import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import Order, {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
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

  KITCHEN: ["PREPARING", "READY"],

  WAITER: ["SERVED"],

  CASHIER: ["COMPLETED"],
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

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "UPI",
  "CARD",
  "RAZORPAY",
  "OTHER",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

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
    // 2. Restaurant authorization
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
    // 3. Role authorization
    // ------------------------------------------------------------

    const allowedStatuses =
      ROLE_PERMISSIONS[session.user.role];

    if (!allowedStatuses) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to update restaurant orders.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 4. Get order ID
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // 5. Parse request
    // ------------------------------------------------------------

    const body = await request.json();

    const requestedStatus = body?.status;

    if (
      typeof requestedStatus !== "string" ||
      ![
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "COMPLETED",
        "CANCELLED",
      ].includes(requestedStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const nextStatus = requestedStatus as OrderStatus;

    // ------------------------------------------------------------
    // 6. Payment fields
    // ------------------------------------------------------------

    let requestedPaymentStatus: PaymentStatus | undefined;
    let requestedPaymentMethod: PaymentMethod | undefined;
    let requestedPaymentId: string | undefined;

    if (body.paymentStatus !== undefined) {
      if (
        typeof body.paymentStatus !== "string" ||
        !PAYMENT_STATUSES.includes(
          body.paymentStatus as PaymentStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment status.",
          },
          { status: 400 }
        );
      }

      requestedPaymentStatus =
        body.paymentStatus as PaymentStatus;
    }

    if (body.paymentMethod !== undefined) {
      if (
        typeof body.paymentMethod !== "string" ||
        !PAYMENT_METHODS.includes(
          body.paymentMethod as PaymentMethod
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment method.",
          },
          { status: 400 }
        );
      }

      requestedPaymentMethod =
        body.paymentMethod as PaymentMethod;
    }

    if (body.paymentId !== undefined) {
      if (typeof body.paymentId !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment ID.",
          },
          { status: 400 }
        );
      }

      const normalizedPaymentId = body.paymentId.trim();

      if (normalizedPaymentId.length > 200) {
        return NextResponse.json(
          {
            success: false,
            message: "Payment ID is too long.",
          },
          { status: 400 }
        );
      }

      requestedPaymentId =
        normalizedPaymentId || undefined;
    }

    // ------------------------------------------------------------
    // 7. Payment updates are CASHIER-only
    // ------------------------------------------------------------

    const hasPaymentUpdate =
      requestedPaymentStatus !== undefined ||
      requestedPaymentMethod !== undefined ||
      requestedPaymentId !== undefined;

    if (
      hasPaymentUpdate &&
      session.user.role !== "CASHIER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only the cashier can update payment information.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 8. Database connection
    // ------------------------------------------------------------

    await connectDB();

    // ------------------------------------------------------------
    // 9. Verify active restaurant
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
    // 10. Find order inside this restaurant
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // 11. Validate order status permission
    // ------------------------------------------------------------

    if (!allowedStatuses.includes(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Your role cannot change an order to ${nextStatus}.`,
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 12. Validate order status transition
    // ------------------------------------------------------------

    const currentStatus = order.status as OrderStatus;

    if (currentStatus === nextStatus) {
      return NextResponse.json(
        {
          success: false,
          message: `Order is already ${nextStatus}.`,
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
          message: `Order cannot move from ${currentStatus} to ${nextStatus}.`,
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 13. CASHIER payment validation
    // ------------------------------------------------------------

    if (session.user.role === "CASHIER") {
      // Cashier can only complete a SERVED order.

      if (currentStatus !== "SERVED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only served orders can be completed by the cashier.",
          },
          { status: 400 }
        );
      }

      // Completing an order must include a successful payment.

      if (nextStatus === "COMPLETED") {
        if (requestedPaymentStatus !== "PAID") {
          return NextResponse.json(
            {
              success: false,
              message:
                "A completed order must have a PAID payment status.",
            },
            { status: 400 }
          );
        }

        if (!requestedPaymentMethod) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Payment method is required to complete the order.",
            },
            { status: 400 }
          );
        }

        // Do not allow a second payment.

        if (order.paymentStatus === "PAID") {
          return NextResponse.json(
            {
              success: false,
              message: "This order has already been paid.",
            },
            { status: 400 }
          );
        }
      }
    }

    // ------------------------------------------------------------
    // 14. Prevent payment manipulation on non-completed orders
    // ------------------------------------------------------------

    if (
      requestedPaymentStatus === "PAID" &&
      nextStatus !== "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment can only be marked PAID when completing the order.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 15. Apply order status
    // ------------------------------------------------------------

    order.status = nextStatus;

    // ------------------------------------------------------------
    // 16. Apply payment information
    // ------------------------------------------------------------

    if (requestedPaymentStatus !== undefined) {
      order.paymentStatus = requestedPaymentStatus;
    }

    if (requestedPaymentMethod !== undefined) {
      order.paymentMethod = requestedPaymentMethod;
    }

    if (requestedPaymentId !== undefined) {
      order.paymentId = requestedPaymentId;
    }

    await order.save();

    // ------------------------------------------------------------
    // 17. Return updated order
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully.",

        order: {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          paymentId: order.paymentId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restaurant order PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order.",
      },
      { status: 500 }
    );
  }
}