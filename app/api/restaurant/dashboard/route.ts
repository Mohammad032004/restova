import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/order";
import Table from "@/models/table";
import Restaurant from "@/models/restaurant";

const ALLOWED_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
];

export async function GET() {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 2. Authorization
    // --------------------------------------------------

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this dashboard.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. Restaurant ID
    // --------------------------------------------------

    const restaurantId = session.user.restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not associated with a restaurant.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Database connection
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 5. Verify restaurant
    // --------------------------------------------------

    const restaurant = await Restaurant.findById(
      restaurantId
    )
      .select("_id name type status")
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      );
    }

    if (restaurant.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This restaurant is currently suspended.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 6. Today's date
    //
    // Restova currently uses Asia/Kolkata for
    // restaurant dashboard day boundaries.
    // --------------------------------------------------

    const now = new Date();

    const indiaDateFormatter = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

    const today = indiaDateFormatter.format(now);

    const startOfDay = new Date(
      `${today}T00:00:00+05:30`
    );

    const startOfTomorrow = new Date(
      startOfDay.getTime() + 24 * 60 * 60 * 1000
    );

    // --------------------------------------------------
    // 7. Today's order filter
    // --------------------------------------------------

    const todayOrderFilter = {
      restaurantId,
      createdAt: {
        $gte: startOfDay,
        $lt: startOfTomorrow,
      },
    };

    // --------------------------------------------------
    // 8. Today's sales
    //
    // Sales are PAID orders.
    //
    // Cancelled orders are excluded.
    // Refunded orders cannot match paymentStatus: PAID.
    // --------------------------------------------------

    const salesResult = await Order.aggregate([
      {
        $match: {
          ...todayOrderFilter,
          paymentStatus: "PAID",
          status: {
            $ne: "CANCELLED",
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$total",
          },
        },
      },
    ]);

    const todaySales = salesResult[0]?.total || 0;

    // --------------------------------------------------
    // 9. Today's order statistics
    // --------------------------------------------------

    const [
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      // All orders received today
      Order.countDocuments(todayOrderFilter),

      // Orders that still require operational attention
      Order.countDocuments({
        ...todayOrderFilter,
        status: {
          $in: [
            "PLACED",
            "ACCEPTED",
            "PREPARING",
            "READY",
            "SERVED",
          ],
        },
      }),

      // Completed orders
      Order.countDocuments({
        ...todayOrderFilter,
        status: "COMPLETED",
      }),

      // Cancelled orders
      Order.countDocuments({
        ...todayOrderFilter,
        status: "CANCELLED",
      }),
    ]);

    // --------------------------------------------------
    // 10. Table statistics
    // --------------------------------------------------

    const [
      totalTables,
      occupiedTables,
      availableTables,
      billRequestedTables,
      cleaningTables,
    ] = await Promise.all([
      Table.countDocuments({
        restaurantId,
      }),

      Table.countDocuments({
        restaurantId,
        status: "OCCUPIED",
      }),

      Table.countDocuments({
        restaurantId,
        status: "AVAILABLE",
      }),

      Table.countDocuments({
        restaurantId,
        status: "BILL_REQUESTED",
      }),

      Table.countDocuments({
        restaurantId,
        status: "CLEANING",
      }),
    ]);

    // --------------------------------------------------
    // 11. Recent orders
    // --------------------------------------------------

    const recentOrders = await Order.find({
      restaurantId,
    })
      .populate({
        path: "tableId",
        model: Table,
        select: "name number",
      })
      .select(
        "orderNumber tableId orderType items total status paymentStatus createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean();

    // --------------------------------------------------
    // 12. Response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
          type: restaurant.type,
          status: restaurant.status,
        },

        sales: {
          today: todaySales,
        },

        orders: {
          today: todayOrders,
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },

        tables: {
          total: totalTables,
          occupied: occupiedTables,
          available: availableTables,
          billRequested: billRequestedTables,
          cleaning: cleaningTables,
        },

        recentOrders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load restaurant dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}