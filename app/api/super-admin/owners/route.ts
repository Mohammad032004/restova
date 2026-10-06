import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const owners = await User.find({
      role: "RESTAURANT_OWNER",
    })
      .select(
        "name email phone isActive restaurantId createdAt"
      )
      .populate({
        path: "restaurantId",
        select:
          "name type city state status numberOfTables",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      owners,
    });
  } catch (error) {
    console.error("Get restaurant owners error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load restaurant owners.",
      },
      { status: 500 }
    );
  }
}