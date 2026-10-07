import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import User from "@/models/user";

const ALLOWED_ROLES = ["RESTAURANT_OWNER", "MANAGER"];

const CREATABLE_ROLES = [
  "MANAGER",
  "KITCHEN",
  "WAITER",
  "CASHIER",
] as const;

type CreatableRole = (typeof CREATABLE_ROLES)[number];

async function getAuthorizedRestaurant() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      ),
    };
  }

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage staff.",
        },
        { status: 403 }
      ),
    };
  }

  if (!session.user.restaurantId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Restaurant information is missing.",
        },
        { status: 400 }
      ),
    };
  }

  await connectDB();

  const restaurant = await Restaurant.findOne({
    _id: session.user.restaurantId,
    status: "ACTIVE",
  }).lean();

  if (!restaurant) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Restaurant not found or inactive.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    restaurantId: restaurant._id,
    sessionUserId: session.user.id,
    sessionUserRole: session.user.role,
  };
}

/**
 * GET
 * Returns all staff belonging to the logged-in restaurant.
 */
export async function GET() {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const staff = await User.find({
      restaurantId: result.restaurantId,
      role: {
        $in: CREATABLE_ROLES,
      },
    })
      .select(
        "_id name email phone role isActive passwordSetupExpires createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const formattedStaff = staff.map((member) => ({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role,
      isActive: member.isActive,
      passwordSetupPending: Boolean(
        member.passwordSetupExpires &&
          new Date(member.passwordSetupExpires).getTime() > Date.now()
      ),
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        staff: formattedStaff,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restaurant staff GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load restaurant staff.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Creates a new restaurant staff member.
 *
 * The staff member does not receive a permanent password.
 * A secure password setup token is generated instead.
 */
export async function POST(request: Request) {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const body = await request.json();

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body?.email === "string"
        ? body.email.toLowerCase().trim()
        : "";

    const phone =
      typeof body?.phone === "string"
        ? body.phone.trim()
        : "";

    const role =
      typeof body?.role === "string"
        ? body.role.toUpperCase().trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff name must contain at least 2 characters.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff email is required.",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!CREATABLE_ROLES.includes(role as CreatableRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid staff role. Allowed roles are Manager, Kitchen, Waiter and Cashier.",
        },
        { status: 400 }
      );
    }

    /**
     * A MANAGER can create operational staff,
     * but cannot create another MANAGER.
     */
    if (
      result.sessionUserRole === "MANAGER" &&
      role === "MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Managers cannot create another manager.",
        },
        { status: 403 }
      );
    }

    /**
     * Check whether this email is already being used.
     */
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    /**
     * Generate a cryptographically secure password setup token.
     *
     * The raw token is returned only once to the creator.
     * The database stores a SHA-256 hash.
     */
    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    /**
     * Password setup link expires after 24 hours.
     */
    const passwordSetupExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const staff = await User.create({
      name,
      email,
      phone: phone || undefined,
      role,
      restaurantId: result.restaurantId,
      isActive: true,
      passwordSetupToken: hashedToken,
      passwordSetupExpires,
    });

    /**
     * Build the setup URL.
     *
     * NEXTAUTH_URL should be configured in production.
     * localhost is used during development.
     */
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const setupUrl =
      `${baseUrl}/auth/setup-password?token=${rawToken}`;

    return NextResponse.json(
      {
        success: true,
        message:
          "Staff member created successfully. Share the password setup link with the staff member.",
        staff: {
          id: staff._id.toString(),
          name: staff.name,
          email: staff.email,
          phone: staff.phone || "",
          role: staff.role,
          isActive: staff.isActive,
          createdAt: staff.createdAt,
        },
        setupUrl,
        setupExpiresAt: passwordSetupExpires,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Restaurant staff POST error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create staff member.",
      },
      { status: 500 }
    );
  }
}