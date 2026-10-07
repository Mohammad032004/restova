import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/order";
import Table from "@/models/table";

const ALLOWED_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
  "CASHIER",
];

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "CARD",
  "RAZORPAY",
  "OTHER",
] as const;

function getIndiaDateRange(date?: string) {
  const indiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const targetDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : indiaDateFormatter.format(new Date());

  const start = new Date(
    `${targetDate}T00:00:00+05:30`
  );

  const end = new Date(
    start.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    targetDate,
    start,
    end,
  };
}

export async function GET(request: Request) {
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
            "You do not have permission to access billing.",
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
    // 4. Date
    // --------------------------------------------------

    const { targetDate, start, end } =
      getIndiaDateRange(
        new URL(request.url).searchParams.get("date") ||
          undefined
      );

    // --------------------------------------------------
    // 5. Payment status filter
    // --------------------------------------------------

    const requestedPaymentStatus =
      new URL(request.url).searchParams.get(
        "paymentStatus"
      );

    const paymentStatus =
      PAYMENT_STATUSES.includes(
        requestedPaymentStatus as (typeof PAYMENT_STATUSES)[number]
      )
        ? requestedPaymentStatus
        : "";

    // --------------------------------------------------
    // 6. Payment method filter
    // --------------------------------------------------

    const requestedPaymentMethod =
      new URL(request.url).searchParams.get(
        "paymentMethod"
      );

    const paymentMethod =
      PAYMENT_METHODS.includes(
        requestedPaymentMethod as (typeof PAYMENT_METHODS)[number]
      )
        ? requestedPaymentMethod
        : "";

    // --------------------------------------------------
    // 7. Search
    // --------------------------------------------------

    const search =
      new URL(request.url).searchParams
        .get("search")
        ?.trim() || "";

    // --------------------------------------------------
    // 8. Database
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 9. Build billing query
    // --------------------------------------------------

    const query: Record<string, unknown> = {
      restaurantId,
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (search) {
      const searchConditions: Record<string, unknown>[] =
        [];

      if (/^\d+$/.test(search)) {
        searchConditions.push({
          orderNumber: Number(search),
        });
      }

      searchConditions.push({
        customerName: {
          $regex: search,
          $options: "i",
        },
      });

      searchConditions.push({
        customerPhone: {
          $regex: search,
          $options: "i",
        },
      });

      searchConditions.push({
        paymentId: {
          $regex: search,
          $options: "i",
        },
      });

      query.$or = searchConditions;
    }

    // --------------------------------------------------
    // 10. Billing orders
    // --------------------------------------------------

    const billingOrders = await Order.find(query)
      .populate({
        path: "tableId",
        model: Table,
        select: "name number",
      })
      .select(
        "orderNumber tableId orderType source subtotal tax discount total status paymentStatus paymentMethod paymentId customerName customerPhone createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    // --------------------------------------------------
    // 11. Summary
    // --------------------------------------------------

    const summaryResult = await Order.aggregate([
      {
        $match: {
          restaurantId,
          createdAt: {
            $gte: start,
            $lt: end,
          },
        },
      },
      {
        $group: {
          _id: null,

          totalOrders: {
            $sum: 1,
          },

          paidOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "PAID",
                  ],
                },
                1,
                0,
              ],
            },
          },

          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "PENDING",
                  ],
                },
                1,
                0,
              ],
            },
          },

          failedOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "FAILED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          refundedOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "REFUNDED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          paidAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$paymentStatus",
                        "PAID",
                      ],
                    },
                    {
                      $ne: [
                        "$status",
                        "CANCELLED",
                      ],
                    },
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          pendingAmount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "PENDING",
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          refundedAmount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "REFUNDED",
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          cancelledAmount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "CANCELLED",
                  ],
                },
                "$total",
                0,
              ],
            },
          },
        },
      },
    ]);

    const summary = summaryResult[0] || {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      failedOrders: 0,
      refundedOrders: 0,
      paidAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0,
      cancelledAmount: 0,
    };

    // --------------------------------------------------
    // 12. Payment method breakdown
    // --------------------------------------------------

    const paymentMethodResult =
      await Order.aggregate([
        {
          $match: {
            restaurantId,
            createdAt: {
              $gte: start,
              $lt: end,
            },
            paymentStatus: "PAID",
            status: {
              $ne: "CANCELLED",
            },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",

            count: {
              $sum: 1,
            },

            amount: {
              $sum: "$total",
            },
          },
        },
        {
          $sort: {
            amount: -1,
          },
        },
      ]);

    const paymentMethods = paymentMethodResult.map(
      (item) => ({
        method: item._id || "OTHER",
        count: item.count,
        amount: item.amount || 0,
      })
    );

    // --------------------------------------------------
    // 13. Response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        date: targetDate,

        summary: {
          totalOrders: summary.totalOrders || 0,
          paidOrders: summary.paidOrders || 0,
          pendingOrders:
            summary.pendingOrders || 0,
          failedOrders:
            summary.failedOrders || 0,
          refundedOrders:
            summary.refundedOrders || 0,

          paidAmount:
            summary.paidAmount || 0,

          pendingAmount:
            summary.pendingAmount || 0,

          refundedAmount:
            summary.refundedAmount || 0,

          cancelledAmount:
            summary.cancelledAmount || 0,
        },

        paymentMethods,

        orders: billingOrders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant billing GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load billing information.",
      },
      {
        status: 500,
      }
    );
  }
}