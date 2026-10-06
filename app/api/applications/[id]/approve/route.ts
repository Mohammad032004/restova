import { NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";
import Restaurant from "@/models/restaurant";
import User from "@/models/user";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate application ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find application
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

    // Only pending applications can be approved
    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Only pending applications can be approved.",
        },
        { status: 409 }
      );
    }

    // Check whether owner email already exists
    const existingUser = await User.findOne({
      email: application.email,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // Generate secure password setup token
    const passwordSetupToken = crypto.randomBytes(32).toString("hex");

    const passwordSetupExpires = new Date(
      Date.now() + 1000 * 60 * 60 * 24
    );

    // Create owner
    const owner = await User.create({
      name: application.ownerName,
      email: application.email,
      phone: application.phone,

      role: "RESTAURANT_OWNER",

      isActive: true,

      passwordSetupToken,
      passwordSetupExpires,
    });

    try {
      // Create restaurant
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

      // Connect owner to restaurant
      owner.restaurantId = restaurant._id;

      await owner.save();

      // Mark application approved
      application.status = "APPROVED";

      await application.save();

      return NextResponse.json(
        {
          success: true,
          message:
            "Application approved and restaurant owner created successfully.",

          applicationId: application._id,
          restaurantId: restaurant._id,
          ownerId: owner._id,

          // Temporary for development.
          // We will remove this from the API response
          // before production.
          passwordSetupToken,
        },
        { status: 200 }
      );
    } catch (error) {
      // If restaurant creation fails after owner creation,
      // remove the owner so we don't leave an incomplete account.
      await User.findByIdAndDelete(owner._id);

      throw error;
    }
  } catch (error) {
    console.error("Approve application error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while approving the application.",
      },
      { status: 500 }
    );
  }
}