import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantSubscription from "@/models/restaurant-subscription";

export async function POST() {
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

    await connectDB();

    const now = new Date();

    const result =
      await RestaurantSubscription.updateMany(
        {
          status: {
            $in: ["ACTIVE", "TRIAL"],
          },
          endDate: {
            $lte: now,
          },
        },
        {
          $set: {
            status: "EXPIRED",
            autoRenew: false,
          },
        }
      );

    return NextResponse.json({
      success: true,
      message: "Expired subscriptions processed.",
      expiredCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Process subscription expiry error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process subscription expiry.",
      },
      { status: 500 }
    );
  }
}