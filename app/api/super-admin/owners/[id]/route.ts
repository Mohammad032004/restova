import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
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
          message:
            "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Owner ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid owner status.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const owner = await User.findOne({
      _id: id,
      role: "RESTAURANT_OWNER",
    });

    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant owner not found.",
        },
        { status: 404 }
      );
    }

    owner.isActive = isActive;

    await owner.save();

    return NextResponse.json({
      success: true,
      message: isActive
        ? "Owner account activated successfully."
        : "Owner account deactivated successfully.",
      owner: {
        id: owner._id.toString(),
        isActive: owner.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Owner status update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update owner account status.",
      },
      { status: 500 }
    );
  }
}