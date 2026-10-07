import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/order";

const ALLOWED_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
];

function getIndiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDateRange(
  startDate?: string,
  endDate?: string
) {
  const today = getIndiaDate();

  const start =
    startDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate)
      ? startDate
      : today;

  const end =
    endDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ? endDate
      : today;

  const startOfRange = new Date(
    `${start}T00:00:00+05:30`
  );

  const endOfRange = new Date(
    `${end}T00:00:00+05:30`
  );

  endOfRange.setTime(
    endOfRange.getTime() +
      24 * 60 * 60 * 1000
  );

  return {
    start,
    end,
    startOfRange,
    endOfRange,
  };
}

export async function GET(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const session = await getServerSession(
      authOptions
    );

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

    // --------------------------------------------------
    // 2. Authorization
    // --------------------------------------------------

    if (
      !ALLOWED_ROLES.includes(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access analytics.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // 3. Restaurant
    // --------------------------------------------------

    const restaurantId =
      session.user.restaurantId;

    if (!restaurantId) {
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

    // --------------------------------------------------
    // 4. Date range
    // --------------------------------------------------

    const url = new URL(request.url);

    const requestedStart =
      url.searchParams.get("startDate") ||
      undefined;

    const requestedEnd =
      url.searchParams.get("endDate") ||
      undefined;

    const {
      start,
      end,
      startOfRange,
      endOfRange,
    } = getDateRange(
      requestedStart,
      requestedEnd
    );

    // --------------------------------------------------
    // 5. Validate date range
    // --------------------------------------------------

    if (startOfRange > endOfRange) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start date cannot be after end date.",
        },
        {
          status: 400,
        }
      );
    }

    // Prevent unnecessarily huge analytics queries.
    const maximumRange =
      366 * 24 * 60 * 60 * 1000;

    if (
      endOfRange.getTime() -
        startOfRange.getTime() >
      maximumRange
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Analytics date range cannot exceed 366 days.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 6. Database
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 7. Base filter
    // --------------------------------------------------

    const baseMatch = {
      restaurantId,
      createdAt: {
        $gte: startOfRange,
        $lt: endOfRange,
      },
    };

    // --------------------------------------------------
    // 8. Main summary
    // --------------------------------------------------

    const summaryResult =
      await Order.aggregate([
        {
          $match: baseMatch,
        },
        {
          $group: {
            _id: null,

            totalOrders: {
              $sum: 1,
            },

            completedOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "COMPLETED",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "CANCELLED",
                    ],
                  },
                  1,
                  0,
                ],
              },
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

            pendingPayments: {
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

            refundedPayments: {
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

            revenue: {
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
          },
        },
      ]);

    const summary =
      summaryResult[0] || {};

    const revenue =
      summary.revenue || 0;

    const paidOrders =
      summary.paidOrders || 0;

    const averageOrderValue =
      paidOrders > 0
        ? revenue / paidOrders
        : 0;

    // --------------------------------------------------
    // 9. Revenue / order trend
    // --------------------------------------------------

    const dailyTrend =
      await Order.aggregate([
        {
          $match: baseMatch,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },

            orders: {
              $sum: 1,
            },

            revenue: {
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
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    // --------------------------------------------------
    // 10. Payment method analytics
    // --------------------------------------------------

    const paymentMethods =
      await Order.aggregate([
        {
          $match: {
            ...baseMatch,
            paymentStatus: "PAID",
            status: {
              $ne: "CANCELLED",
            },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",

            orders: {
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

    // --------------------------------------------------
    // 11. Order type analytics
    // --------------------------------------------------

    const orderTypes =
      await Order.aggregate([
        {
          $match: baseMatch,
        },
        {
          $group: {
            _id: "$orderType",

            orders: {
              $sum: 1,
            },

            revenue: {
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
          },
        },
        {
          $sort: {
            orders: -1,
          },
        },
      ]);

    // --------------------------------------------------
    // 12. Top-selling menu items
    // --------------------------------------------------

    const topItems =
      await Order.aggregate([
        {
          $match: {
            ...baseMatch,
            status: {
              $ne: "CANCELLED",
            },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.name",

            quantity: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: "$items.total",
            },
          },
        },
        {
          $sort: {
            quantity: -1,
            revenue: -1,
          },
        },
        {
          $limit: 10,
        },
      ]);

    // --------------------------------------------------
    // 13. Peak ordering hours
    // --------------------------------------------------

    const peakHours =
      await Order.aggregate([
        {
          $match: baseMatch,
        },
        {
          $group: {
            _id: {
              $hour: {
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },

            orders: {
              $sum: 1,
            },

            revenue: {
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
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    // --------------------------------------------------
    // 14. Response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        range: {
          start,
          end,
        },

        summary: {
          totalOrders:
            summary.totalOrders || 0,

          completedOrders:
            summary.completedOrders || 0,

          cancelledOrders:
            summary.cancelledOrders || 0,

          paidOrders:
            summary.paidOrders || 0,

          pendingPayments:
            summary.pendingPayments || 0,

          refundedPayments:
            summary.refundedPayments || 0,

          revenue,

          refundedAmount:
            summary.refundedAmount || 0,

          averageOrderValue,
        },

        dailyTrend: dailyTrend.map(
          (item) => ({
            date: item._id,
            orders: item.orders,
            revenue: item.revenue || 0,
          })
        ),

        paymentMethods:
          paymentMethods.map(
            (item) => ({
              method:
                item._id || "OTHER",
              orders: item.orders,
              amount: item.amount || 0,
            })
          ),

        orderTypes:
          orderTypes.map((item) => ({
            type: item._id,
            orders: item.orders,
            revenue: item.revenue || 0,
          })),

        topItems:
          topItems.map((item) => ({
            name: item._id,
            quantity: item.quantity,
            revenue: item.revenue || 0,
          })),

        peakHours:
          peakHours.map((item) => ({
            hour: item._id,
            orders: item.orders,
            revenue: item.revenue || 0,
          })),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant analytics error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load restaurant analytics.",
      },
      {
        status: 500,
      }
    );
  }
}