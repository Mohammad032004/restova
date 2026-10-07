import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

const ALLOWED_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this profile.",
        },
        { status: 403 }
      );
    }

    if (!session.user.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant information is missing.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      _id: session.user.id,
      restaurantId: session.user.restaurantId,
      role: session.user.role,
      isActive: true,
    }).select("_id name email phone role restaurantId createdAt");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          restaurantId: user.restaurantId?.toString() || "",
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Restaurant profile GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load account profile.",
      },
      { status: 500 }
    );
  }
}