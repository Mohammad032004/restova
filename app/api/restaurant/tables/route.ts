import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import Table, { TableStatus } from "@/models/table";
import Order from "@/models/order";

const ROLE_PERMISSIONS: Record<string, TableStatus[]> = {
  RESTAURANT_OWNER: [
    "BILL_REQUESTED",
    "CLEANING",
    "AVAILABLE",
  ],
  MANAGER: [
    "BILL_REQUESTED",
    "CLEANING",
    "AVAILABLE",
  ],
  WAITER: [
    "BILL_REQUESTED",
    "CLEANING",
    "AVAILABLE",
  ],
};

const VALID_TRANSITIONS: Record<
  TableStatus,
  TableStatus[]
> = {
  AVAILABLE: ["OCCUPIED"],
  OCCUPIED: ["BILL_REQUESTED"],
  BILL_REQUESTED: ["CLEANING"],
  CLEANING: ["AVAILABLE"],
};

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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
    // 2. Restaurant association
    // ------------------------------------------------------------

    if (!session.user.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not associated with a restaurant.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 3. Role authorization
    // ------------------------------------------------------------

    const allowedStatuses =
      ROLE_PERMISSIONS[session.user.role];

    if (!allowedStatuses) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage tables.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 4. Get table ID
    // ------------------------------------------------------------

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Table ID is required.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 5. Parse request
    // ------------------------------------------------------------

    let body: {
      status?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const requestedStatus = body?.status;

    const validStatuses: TableStatus[] = [
      "AVAILABLE",
      "OCCUPIED",
      "BILL_REQUESTED",
      "CLEANING",
    ];

    if (
      typeof requestedStatus !== "string" ||
      !validStatuses.includes(
        requestedStatus as TableStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid table status.",
        },
        { status: 400 }
      );
    }

    const nextStatus =
      requestedStatus as TableStatus;

    if (!allowedStatuses.includes(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Your role cannot change a table to ${nextStatus}.`,
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 6. Database connection
    // ------------------------------------------------------------

    await connectDB();

    // ------------------------------------------------------------
    // 7. Verify active restaurant
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
          message:
            "Restaurant not found or inactive.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 8. Find table inside this restaurant
    // ------------------------------------------------------------

    const table = await Table.findOne({
      _id: id,
      restaurantId: restaurant._id,
    });

    if (!table) {
      return NextResponse.json(
        {
          success: false,
          message: "Table not found.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 9. Validate current → next transition
    // ------------------------------------------------------------

    const currentStatus =
      table.status as TableStatus;

    if (currentStatus === nextStatus) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Table is already ${nextStatus}.`,
        },
        { status: 400 }
      );
    }

    const allowedTransitions =
      VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Table cannot move from ${currentStatus} to ${nextStatus}.`,
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 10. BILL_REQUESTED validation
    // ------------------------------------------------------------

    if (nextStatus === "BILL_REQUESTED") {
      const activeOrder = await Order.findOne({
        restaurantId: restaurant._id,
        tableId: table._id,
        status: {
          $nin: ["COMPLETED", "CANCELLED"],
        },
      })
        .select("_id orderNumber status paymentStatus")
        .lean();

      if (!activeOrder) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This table has no active order to bill.",
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // 11. CLEANING validation
    // ------------------------------------------------------------

    if (nextStatus === "CLEANING") {
      const incompleteOrder = await Order.findOne({
        restaurantId: restaurant._id,
        tableId: table._id,
        status: {
          $nin: ["COMPLETED", "CANCELLED"],
        },
      })
        .select(
          "_id orderNumber status paymentStatus"
        )
        .lean();

      if (incompleteOrder) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Order #${incompleteOrder.orderNumber} is still ${incompleteOrder.status}. Complete the order before cleaning the table.`,
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // 12. AVAILABLE validation
    // ------------------------------------------------------------

    if (nextStatus === "AVAILABLE") {
      const incompleteOrder = await Order.findOne({
        restaurantId: restaurant._id,
        tableId: table._id,
        status: {
          $nin: ["COMPLETED", "CANCELLED"],
        },
      })
        .select(
          "_id orderNumber status paymentStatus"
        )
        .lean();

      if (incompleteOrder) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Table cannot be released. Order #${incompleteOrder.orderNumber} is still ${incompleteOrder.status}.`,
          },
          { status: 400 }
        );
      }

      const unpaidCompletedOrder =
        await Order.findOne({
          restaurantId: restaurant._id,
          tableId: table._id,
          status: "COMPLETED",
          paymentStatus: {
            $ne: "PAID",
          },
        })
          .select(
            "_id orderNumber status paymentStatus"
          )
          .lean();

      if (unpaidCompletedOrder) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Table cannot be released because order #${unpaidCompletedOrder.orderNumber} has not been paid.`,
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // 13. Apply table status
    // ------------------------------------------------------------

    table.status = nextStatus;

    await table.save();

    // ------------------------------------------------------------
    // 14. Return updated table
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          `Table status changed from ${currentStatus} to ${nextStatus}.`,
        table: {
          id: table._id.toString(),
          name: table.name,
          number: table.number,
          capacity: table.capacity,
          status: table.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Restaurant table PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update table status.",
      },
      { status: 500 }
    );
  }
}