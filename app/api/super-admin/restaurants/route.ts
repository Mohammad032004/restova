import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
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

    const restaurants = await Restaurant.find()
      .populate({
        path: "ownerId",
        select: "name email phone isActive",
        model: User,
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      restaurants,
    });
  } catch (error) {
    console.error("Get restaurants error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load restaurants.",
      },
      { status: 500 }
    );
  }
}