import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import Order from "@/models/order";
import Table from "@/models/table";

export async function GET() {
  try {
    // ------------------------------------------------------------
    // 1. Authentication
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // 2. Kitchen role authorization
    // ------------------------------------------------------------

    if (session.user.role !== "KITCHEN") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view kitchen orders.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 3. Restaurant authorization
    // ------------------------------------------------------------

    if (!session.user.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant information is missing.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 4. Database connection
    // ------------------------------------------------------------

    await connectDB();

    // ------------------------------------------------------------
    // 5. Verify active restaurant
    // ------------------------------------------------------------

    const restaurant = await Restaurant.findOne({
      _id: session.user.restaurantId,
      status: "ACTIVE",
    })
      .select("_id name")
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found or inactive.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 6. Fetch kitchen orders
    //
    // Kitchen only needs orders that still require preparation.
    //
    // ACCEPTED    -> Start Preparing
    // PREPARING   -> Mark Ready
    // READY       -> Kitchen work completed
    // ------------------------------------------------------------

    const orders = await Order.find({
      restaurantId: restaurant._id,
      status: {
        $in: ["ACCEPTED", "PREPARING", "READY"],
      },
    })
      .populate({
        path: "tableId",
        model: Table,
        select: "name number capacity status",
      })
      .sort({
        createdAt: 1,
      })
      .limit(100)
      .lean();

    // ------------------------------------------------------------
    // 7. Return kitchen queue
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
        },

        orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Kitchen orders GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load kitchen orders.",
      },
      { status: 500 }
    );
  }
}