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
    // 4. Table ID
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
    // 6. Database
    // ------------------------------------------------------------

    await connectDB();

    // ------------------------------------------------------------
    // 7. Active restaurant
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
    // 9. Validate transition
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
    // 10. Get orders belonging to this table
    // ------------------------------------------------------------

    const tableOrders = await Order.find({
      restaurantId: restaurant._id,
      tableId: table._id,
    })
      .select(
        "_id orderNumber status paymentStatus paymentMethod total"
      )
      .sort({ createdAt: -1 })
      .lean();

    // ------------------------------------------------------------
    // 11. OCCUPIED → BILL_REQUESTED
    // ------------------------------------------------------------

    if (nextStatus === "BILL_REQUESTED") {
      const activeOrders = tableOrders.filter(
        (order) =>
          order.status !== "COMPLETED" &&
          order.status !== "CANCELLED"
      );

      if (activeOrders.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This table has no active order to bill.",
          },
          { status: 400 }
        );
      }

      const unpaidOrders = activeOrders.filter(
        (order) =>
          order.paymentStatus !== "PAID"
      );

      if (unpaidOrders.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "All orders for this table are already paid.",
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // 12. BILL_REQUESTED → CLEANING
    // ------------------------------------------------------------

    if (nextStatus === "CLEANING") {
      if (tableOrders.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This table has no orders.",
          },
          { status: 400 }
        );
      }

      // Any order that is not completed/cancelled
      // means the service cycle is not finished.
      const incompleteOrders =
        tableOrders.filter(
          (order) =>
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED"
        );

      if (incompleteOrders.length > 0) {
        const orderNumbers =
          incompleteOrders
            .map(
              (order) =>
                `#${order.orderNumber}`
            )
            .join(", ");

        return NextResponse.json(
          {
            success: false,
            message:
              `Payment/service is not complete for order(s) ${orderNumbers}.`,
          },
          { status: 400 }
        );
      }

      // Every completed order must be PAID.
      const unpaidOrders =
        tableOrders.filter(
          (order) =>
            order.status === "COMPLETED" &&
            order.paymentStatus !== "PAID"
        );

      if (unpaidOrders.length > 0) {
        const orderNumbers =
          unpaidOrders
            .map(
              (order) =>
                `#${order.orderNumber}`
            )
            .join(", ");

        return NextResponse.json(
          {
            success: false,
            message:
              `Payment is still pending for order(s) ${orderNumbers}.`,
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // 13. CLEANING → AVAILABLE
    // ------------------------------------------------------------

    if (nextStatus === "AVAILABLE") {
      const incompleteOrders =
        tableOrders.filter(
          (order) =>
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED"
        );

      if (incompleteOrders.length > 0) {
        const orderNumbers =
          incompleteOrders
            .map(
              (order) =>
                `#${order.orderNumber}`
            )
            .join(", ");

        return NextResponse.json(
          {
            success: false,
            message:
              `Table cannot be released. Order(s) ${orderNumbers} are still incomplete.`,
          },
          { status: 400 }
        );
      }

      const unpaidOrders =
        tableOrders.filter(
          (order) =>
            order.status === "COMPLETED" &&
            order.paymentStatus !== "PAID"
        );

      if (unpaidOrders.length > 0) {
        const orderNumbers =
          unpaidOrders
            .map(
              (order) =>
                `#${order.orderNumber}`
            )
            .join(", ");

        return NextResponse.json(
          {
            success: false,
            message:
              `Table cannot be released. Payment is pending for order(s) ${orderNumbers}.`,
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // 14. Update table
    // ------------------------------------------------------------

    table.status = nextStatus;

    await table.save();

    // ------------------------------------------------------------
    // 15. Return result
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