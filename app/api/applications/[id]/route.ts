import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";
import mongoose from "mongoose";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action !== "reject") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application action.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await RestaurantApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found.",
        },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Only pending applications can be rejected.",
        },
        { status: 409 }
      );
    }

    application.status = "REJECTED";

    await application.save();

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully.",
    });
  } catch (error) {
    console.error("Application action error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}