import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import Order, {
  OrderStatus,
} from "@/models/order";

const ROLE_PERMISSIONS: Record<string, OrderStatus[]> = {
  RESTAURANT_OWNER: [
    "ACCEPTED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ],

  MANAGER: [
    "ACCEPTED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ],

  KITCHEN: [
    "PREPARING",
    "READY",
  ],

  WAITER: [
    "SERVED",
  ],

  CASHIER: [
    "COMPLETED",
  ],
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["ACCEPTED", "CANCELLED"],

  ACCEPTED: ["PREPARING", "CANCELLED"],

  PREPARING: ["READY"],

  READY: ["SERVED"],

  SERVED: ["COMPLETED"],

  COMPLETED: [],

  CANCELLED: [],
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

    const restaurantId = session.user.restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant information is missing.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = ROLE_PERMISSIONS[session.user.role];

    if (!allowedStatuses) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update orders.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const requestedStatus = body?.status;

    const validStatuses: OrderStatus[] = [
      "PLACED",
      "ACCEPTED",
      "PREPARING",
      "READY",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (
      typeof requestedStatus !== "string" ||
      !validStatuses.includes(requestedStatus as OrderStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const newStatus = requestedStatus as OrderStatus;

    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Your role cannot change an order to ${newStatus}.`,
        },
        { status: 403 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      status: "ACTIVE",
    })
      .select("_id")
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

    const order = await Order.findOne({
      _id: id,
      restaurantId: restaurant._id,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    const currentStatus = order.status;

    if (currentStatus === newStatus) {
      return NextResponse.json(
        {
          success: false,
          message: `Order is already ${newStatus}.`,
        },
        { status: 400 }
      );
    }

    const allowedTransitions =
      VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status transition: ${currentStatus} → ${newStatus}.`,
        },
        { status: 400 }
      );
    }

    order.status = newStatus;

    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: `Order #${order.orderNumber} moved from ${currentStatus} to ${newStatus}.`,
        order: {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          updatedAt: order.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restaurant order status PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order status.",
      },
      { status: 500 }
    );
  }
}