import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";
import Restaurant from "@/models/restaurant";
import User from "@/models/user";
import { sendPasswordSetupEmail } from "@/lib/email";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------------
    // 2. Authorization
    // --------------------------------------------------

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Super Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // 3. Get application ID
    // --------------------------------------------------

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Application ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 4. Connect to MongoDB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 5. Find application
    // --------------------------------------------------

    const application =
      await RestaurantApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // 6. Make sure application is still pending
    // --------------------------------------------------

    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `Application has already been ${application.status.toLowerCase()}.`,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 7. Check whether owner already exists
    // --------------------------------------------------

    const normalizedEmail =
      application.email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // 8. Generate secure password setup token
    // --------------------------------------------------

    const passwordSetupToken =
      crypto.randomBytes(32).toString("hex");

    const passwordSetupExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // --------------------------------------------------
    // 9. Create restaurant owner
    // --------------------------------------------------

    const owner = await User.create({
      name: application.ownerName,
      email: normalizedEmail,
      phone: application.phone,
      role: "RESTAURANT_OWNER",
      isActive: true,
      passwordSetupToken,
      passwordSetupExpires,
    });

    try {
      // ------------------------------------------------
      // 10. Create restaurant
      // ------------------------------------------------

      const restaurant = await Restaurant.create({
        name: application.restaurantName,
        type: application.restaurantType,
        ownerId: owner._id,
        address: application.address,
        city: application.city,
        state: application.state,
        pincode: application.pincode,
        numberOfTables: application.numberOfTables,
        status: "ACTIVE",
      });

      // ------------------------------------------------
      // 11. Connect owner to restaurant
      // ------------------------------------------------

      owner.restaurantId = restaurant._id;

      await owner.save();

      // ------------------------------------------------
      // 12. Create password setup URL
      // ------------------------------------------------

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

      const setupUrl =
        `${baseUrl}/auth/setup-password?token=${passwordSetupToken}`;

      // ------------------------------------------------
      // 13. Send password setup email
      // ------------------------------------------------

      await sendPasswordSetupEmail({
        ownerName: owner.name,
        ownerEmail: owner.email,
        setupUrl,
      });

      // ------------------------------------------------
      // 14. Approve application
      // ------------------------------------------------

      application.status = "APPROVED";

      await application.save();

      // ------------------------------------------------
      // 15. Return success
      // ------------------------------------------------

      return NextResponse.json(
        {
          success: true,
          message:
            "Application approved successfully.",
          restaurantId: restaurant._id.toString(),
        },
        {
          status: 200,
        }
      );
    } catch (error) {
      // ------------------------------------------------
      // Rollback owner if restaurant creation or
      // onboarding fails
      // ------------------------------------------------

      await User.findByIdAndDelete(owner._id);

      throw error;
    }
  } catch (error) {
    console.error(
      "Approve application error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to approve application.",
      },
      {
        status: 500,
      }
    );
  }
}