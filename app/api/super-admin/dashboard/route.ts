import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import RestaurantApplication from "@/models/restaurant-application";
import User from "@/models/user";

export async function GET() {
  try {
    // 1. Check authentication
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

    // 2. Only Super Admin can access this API
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    // 3. Connect to MongoDB
    await connectDB();

    // 4. Get platform statistics
    const [
      totalRestaurants,
      activeRestaurants,
      suspendedRestaurants,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalRestaurantOwners,
    ] = await Promise.all([
      Restaurant.countDocuments(),

      Restaurant.countDocuments({
        status: "ACTIVE",
      }),

      Restaurant.countDocuments({
        status: "SUSPENDED",
      }),

      RestaurantApplication.countDocuments({
        status: "PENDING",
      }),

      RestaurantApplication.countDocuments({
        status: "APPROVED",
      }),

      RestaurantApplication.countDocuments({
        status: "REJECTED",
      }),

      User.countDocuments({
        role: "RESTAURANT_OWNER",
      }),
    ]);

    return NextResponse.json({
      success: true,

      statistics: {
        totalRestaurants,
        activeRestaurants,
        suspendedRestaurants,
        totalRestaurantOwners,

        applications: {
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
        },
      },
    });
  } catch (error) {
    console.error("Super Admin dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load Super Admin dashboard statistics.",
      },
      { status: 500 }
    );
  }
}