import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import Table from "@/models/table";

const ALLOWED_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "BILL_REQUESTED",
  "CLEANING",
] as const;

type TableStatus = (typeof ALLOWED_STATUSES)[number];

const VALID_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
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
    // 2. Waiter authorization
    // ------------------------------------------------------------

    if (session.user.role !== "WAITER") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage tables.",
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

    const body = await request.json();

    const requestedStatus = body?.status;

    if (
      typeof requestedStatus !== "string" ||
      !ALLOWED_STATUSES.includes(
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

    const nextStatus = requestedStatus as TableStatus;

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
          message: "Restaurant not found or inactive.",
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

    const currentStatus = table.status as TableStatus;

    if (currentStatus === nextStatus) {
      return NextResponse.json(
        {
          success: false,
          message: `Table is already ${nextStatus}.`,
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
          message: `Table cannot move from ${currentStatus} to ${nextStatus}.`,
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 10. Additional safety
    //
    // A waiter should not manually make an occupied table
    // available. The table must go through billing/cleaning.
    // ------------------------------------------------------------

    if (
      currentStatus === "OCCUPIED" &&
      nextStatus === "AVAILABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Occupied tables must go through billing and cleaning before becoming available.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 11. Update table
    // ------------------------------------------------------------

    table.status = nextStatus;

    await table.save();

    // ------------------------------------------------------------
    // 12. Return updated table
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: `Table status changed to ${nextStatus}.`,
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
    console.error("Waiter table PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update table.",
      },
      { status: 500 }
    );
  }
}