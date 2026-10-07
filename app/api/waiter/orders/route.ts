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
    // 2. Waiter authorization
    // ------------------------------------------------------------

    if (session.user.role !== "WAITER") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view waiter orders.",
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
      .select("_id name numberOfTables")
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
    // 6. Fetch waiter-relevant orders
    //
    // READY       -> waiter needs to serve
    // SERVED      -> waiter has served
    // COMPLETED   -> historical/reference state
    // ------------------------------------------------------------

    const orders = await Order.find({
      restaurantId: restaurant._id,
      status: {
        $in: ["READY", "SERVED", "COMPLETED"],
      },
    })
      .populate({
        path: "tableId",
        model: Table,
        select: "name number capacity status qrToken",
      })
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .lean();

    // ------------------------------------------------------------
    // 7. Fetch restaurant tables
    // ------------------------------------------------------------

    const tables = await Table.find({
      restaurantId: restaurant._id,
    })
      .select("_id name number capacity status qrToken")
      .sort({
        number: 1,
      })
      .lean();

    // ------------------------------------------------------------
    // 8. Return waiter data
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
          numberOfTables: restaurant.numberOfTables,
        },

        orders,
        tables,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waiter orders GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load waiter data.",
      },
      { status: 500 }
    );
  }
}