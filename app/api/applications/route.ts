import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";
import User from "@/models/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      restaurantName,
      restaurantType,
      numberOfTables,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
    } = body;

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

    if (
      !restaurantName ||
      !restaurantType ||
      !numberOfTables ||
      !ownerName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All required fields must be provided.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Validate number of tables
    // --------------------------------------------------

    const tables = Number(numberOfTables);

    if (!Number.isInteger(tables) || tables <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Number of tables must be a valid positive number.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Validate email format
    // --------------------------------------------------

    const normalizedEmail = email.toLowerCase().trim();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Connect to MongoDB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 5. Check whether email already belongs to a user
    // --------------------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists. Please use another email address.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 6. Check whether a pending application exists
    // --------------------------------------------------

    const existingApplication =
      await RestaurantApplication.findOne({
        email: normalizedEmail,
        status: "PENDING",
      });

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have a pending application with this email address.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 7. Create application
    // --------------------------------------------------

    const application =
      await RestaurantApplication.create({
        restaurantName: restaurantName.trim(),
        restaurantType: restaurantType.trim(),
        numberOfTables: tables,

        ownerName: ownerName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),

        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),

        status: "PENDING",
      });

    // --------------------------------------------------
    // 8. Return success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Your restaurant application has been submitted successfully.",
        applicationId: application._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Restaurant application error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting your application.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Authorization
    // --------------------------------------------------

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. Connect to MongoDB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 4. Get applications
    // --------------------------------------------------

    const applications =
      await RestaurantApplication.find()
        .sort({ createdAt: -1 })
        .lean();

    // --------------------------------------------------
    // 5. Return applications
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error(
      "Get applications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load applications.",
      },
      { status: 500 }
    );
  }
}