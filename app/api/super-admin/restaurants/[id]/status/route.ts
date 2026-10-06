import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { status } = body;

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid restaurant status.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      );
    }

    restaurant.status = status;

    await restaurant.save();

    return NextResponse.json({
      success: true,
      message:
        status === "ACTIVE"
          ? "Restaurant activated successfully."
          : "Restaurant suspended successfully.",
      restaurant: {
        id: restaurant._id.toString(),
        status: restaurant.status,
      },
    });
  } catch (error) {
    console.error("Restaurant status update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update restaurant status.",
      },
      { status: 500 }
    );
  }
}