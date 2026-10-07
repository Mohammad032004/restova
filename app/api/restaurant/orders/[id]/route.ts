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
import Table from "@/models/table";

/* ============================================================
   ROLE → ALLOWED ORDER ACTIONS

   OWNER / MANAGER
   - Accept new orders
   - Cancel placed orders

   KITCHEN
   - Start preparing
   - Mark ready

   WAITER
   - Mark served

   CASHIER
   - Complete order after payment
============================================================ */

const ROLE_PERMISSIONS: Record<string, OrderStatus[]> = {
  RESTAURANT_OWNER: [
    "ACCEPTED",
    "CANCELLED",
  ],

  MANAGER: [
    "ACCEPTED",
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

/* ============================================================
   VALID ORDER WORKFLOW

   PLACED
      ↓
   ACCEPTED
      ↓
   PREPARING
      ↓
   READY
      ↓
   SERVED
      ↓
   COMPLETED

   Cancellation is allowed from PLACED / ACCEPTED
============================================================ */

const VALID_TRANSITIONS: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PLACED: [
    "ACCEPTED",
    "CANCELLED",
  ],

  ACCEPTED: [
    "PREPARING",
    "CANCELLED",
  ],

  PREPARING: [
    "READY",
  ],

  READY: [
    "SERVED",
  ],

  SERVED: [
    "COMPLETED",
  ],

  COMPLETED: [],

  CANCELLED: [],
};

/* ============================================================
   PAYMENT VALIDATION
============================================================ */

const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "UPI",
  "CARD",
  "RAZORPAY",
  "OTHER",
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
    /* ========================================================
       AUTHENTICATION
    ======================================================== */

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /* ========================================================
       RESTAURANT CHECK
    ======================================================== */

    if (!session.user.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not associated with a restaurant.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       ROLE CHECK
    ======================================================== */

    const allowedStatuses =
      ROLE_PERMISSIONS[session.user.role];

    if (!allowedStatuses) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to update orders.",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       ORDER ID
    ======================================================== */

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       REQUEST BODY
    ======================================================== */

    let body: {
      status?: unknown;
      paymentStatus?: unknown;
      paymentMethod?: unknown;
      paymentId?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const requestedStatus = body?.status;

    const requestedPaymentStatus =
      body?.paymentStatus;

    const requestedPaymentMethod =
      body?.paymentMethod;

    const requestedPaymentId =
      body?.paymentId;

    /* ========================================================
       VALIDATE STATUS
    ======================================================== */

    if (
      typeof requestedStatus !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Order status is required.",
        },
        {
          status: 400,
        }
      );
    }

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
      !validStatuses.includes(
        requestedStatus as OrderStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        {
          status: 400,
        }
      );
    }

    const nextStatus =
      requestedStatus as OrderStatus;

    /* ========================================================
       ROLE → STATUS PERMISSION
    ======================================================== */

    if (
      !allowedStatuses.includes(nextStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Your role cannot change an order to ${nextStatus}.`,
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       PAYMENT STATUS VALIDATION
    ======================================================== */

    let nextPaymentStatus:
      | PaymentStatus
      | undefined;

    if (
      requestedPaymentStatus !== undefined
    ) {
      if (
        typeof requestedPaymentStatus !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment status.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !VALID_PAYMENT_STATUSES.includes(
          requestedPaymentStatus as PaymentStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment status.",
          },
          {
            status: 400,
          }
        );
      }

      nextPaymentStatus =
        requestedPaymentStatus as PaymentStatus;
    }

    /* ========================================================
       PAYMENT METHOD VALIDATION
    ======================================================== */

    let nextPaymentMethod:
      | PaymentMethod
      | undefined;

    if (
      requestedPaymentMethod !== undefined
    ) {
      if (
        typeof requestedPaymentMethod !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment method.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !VALID_PAYMENT_METHODS.includes(
          requestedPaymentMethod as PaymentMethod
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment method.",
          },
          {
            status: 400,
          }
        );
      }

      nextPaymentMethod =
        requestedPaymentMethod as PaymentMethod;
    }

    /* ========================================================
       CONNECT DATABASE
    ======================================================== */

    await connectDB();

    /* ========================================================
       RESTAURANT
    ======================================================== */

    const restaurant =
      await Restaurant.findOne({
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
        {
          status: 404,
        }
      );
    }

    /* ========================================================
       ORDER

       IMPORTANT:
       The order is always scoped to the
       logged-in user's restaurant.
    ======================================================== */

    const order =
      await Order.findOne({
        _id: id,
        restaurantId: restaurant._id,
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    const currentStatus =
      order.status as OrderStatus;

    /* ========================================================
       PREVENT SAME STATUS
    ======================================================== */

    if (
      currentStatus === nextStatus
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Order is already ${nextStatus}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VALID ORDER TRANSITION
    ======================================================== */

    const allowedTransitions =
      VALID_TRANSITIONS[currentStatus] || [];

    if (
      !allowedTransitions.includes(
        nextStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Order cannot move from ${currentStatus} to ${nextStatus}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       OWNER / MANAGER CANCELLATION RULE

       Owner/Manager can cancel only a PLACED order.
    ======================================================== */

    if (
      nextStatus === "CANCELLED" &&
      (
        session.user.role ===
          "RESTAURANT_OWNER" ||
        session.user.role ===
          "MANAGER"
      ) &&
      currentStatus !== "PLACED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only placed orders can be cancelled by the owner or manager.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       CASHIER PAYMENT RULE

       CASHIER can only complete an order after
       waiter has requested the bill for DINE_IN.
    ======================================================== */

    if (
      session.user.role === "CASHIER" &&
      nextStatus === "COMPLETED"
    ) {
      /* ------------------------------------------------------
         Must come from SERVED
      ------------------------------------------------------ */

      if (
        currentStatus !== "SERVED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only served orders can be completed by the cashier.",
          },
          {
            status: 400,
          }
        );
      }

      /* ------------------------------------------------------
         Payment must be PAID
      ------------------------------------------------------ */

      if (
        nextPaymentStatus !== "PAID"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment must be marked as PAID before completing the order.",
          },
          {
            status: 400,
          }
        );
      }

      /* ------------------------------------------------------
         Payment method required
      ------------------------------------------------------ */

      if (!nextPaymentMethod) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment method is required.",
          },
          {
            status: 400,
          }
        );
      }

      /* ------------------------------------------------------
         Prevent duplicate payment
      ------------------------------------------------------ */

      if (
        order.paymentStatus === "PAID"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This order has already been paid.",
          },
          {
            status: 400,
          }
        );
      }

      /* ------------------------------------------------------
         DINE_IN BILL REQUEST CHECK
      ------------------------------------------------------ */

      if (
        order.orderType === "DINE_IN"
      ) {
        if (!order.tableId) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Dine-in order is missing table information.",
            },
            {
              status: 400,
            }
          );
        }

        const table =
          await Table.findOne({
            _id: order.tableId,
            restaurantId:
              restaurant._id,
          })
            .select(
              "_id name number status"
            )
            .lean();

        if (!table) {
          return NextResponse.json(
            {
              success: false,
              message:
                "The table associated with this order was not found.",
            },
            {
              status: 404,
            }
          );
        }

        /* ----------------------------------------------------
           Waiter must request bill first
        ---------------------------------------------------- */

        if (
          table.status !==
          "BILL_REQUESTED"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Table ${table.number} is not currently marked as BILL_REQUESTED. The waiter must request the bill before payment.`,
            },
            {
              status: 400,
            }
          );
        }
      }
    }

    /* ========================================================
       NON-CASHIER PAYMENT PROTECTION

       Only cashier should process payment fields.
    ======================================================== */

    const isUpdatingPayment =
      nextPaymentStatus !== undefined ||
      nextPaymentMethod !== undefined ||
      requestedPaymentId !== undefined;

    if (
      isUpdatingPayment &&
      session.user.role !== "CASHIER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only the cashier can process order payments.",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       GENERAL PAYMENT VALIDATION
    ======================================================== */

    if (
      nextPaymentStatus === "PAID"
    ) {
      if (
        nextStatus !== "COMPLETED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An order can only be marked PAID when it is being completed.",
          },
          {
            status: 400,
          }
        );
      }

      if (!nextPaymentMethod) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment method is required when marking payment as PAID.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ========================================================
       PAYMENT ID
    ======================================================== */

    let paymentId:
      | string
      | undefined;

    if (
      requestedPaymentId !== undefined
    ) {
      if (
        typeof requestedPaymentId !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment ID.",
          },
          {
            status: 400,
          }
        );
      }

      paymentId =
        requestedPaymentId.trim();

      if (
        nextPaymentMethod &&
        nextPaymentMethod !== "CASH" &&
        !paymentId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment ID is required for non-cash payments.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ========================================================
       APPLY ORDER UPDATE
    ======================================================== */

    order.status = nextStatus;

    if (
      nextPaymentStatus !== undefined
    ) {
      order.paymentStatus =
        nextPaymentStatus;
    }

    if (
      nextPaymentMethod !== undefined
    ) {
      order.paymentMethod =
        nextPaymentMethod;
    }

    if (
      paymentId !== undefined
    ) {
      order.paymentId =
        paymentId;
    }

    /* ========================================================
       SAVE
    ======================================================== */

    await order.save();

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          `Order #${order.orderNumber} updated successfully.`,

        order: {
          id: order._id.toString(),

          orderNumber:
            order.orderNumber,

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          paymentMethod:
            order.paymentMethod,

          paymentId:
            order.paymentId,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant order PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update order.",
      },
      {
        status: 500,
      }
    );
  }
}