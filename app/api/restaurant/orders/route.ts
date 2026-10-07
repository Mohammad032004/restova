import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Restaurant from "@/models/restaurant";
import Order from "@/models/order";
import Table from "@/models/table";

/* ============================================================
   ROLES ALLOWED TO VIEW RESTAURANT ORDERS

   OWNER
   MANAGER
   KITCHEN
   WAITER
   CASHIER

   Every request is still restricted to the user's
   own restaurant through session.user.restaurantId.
============================================================ */

const ALLOWED_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
  "KITCHEN",
  "WAITER",
  "CASHIER",
];

export async function GET() {
  try {
    /* ========================================================
       AUTHENTICATION
    ======================================================== */

    const session =
      await getServerSession(authOptions);

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
       ROLE CHECK
    ======================================================== */

    if (
      !ALLOWED_ROLES.includes(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view restaurant orders.",
        },
        {
          status: 403,
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
            "Restaurant information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectDB();

    /* ========================================================
       VERIFY ACTIVE RESTAURANT

       IMPORTANT:
       We never trust a restaurantId supplied by the client.

       The restaurant comes from the authenticated session.
    ======================================================== */

    const restaurant =
      await Restaurant.findOne({
        _id: session.user.restaurantId,
        status: "ACTIVE",
      })
        .select("_id name status")
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
       GET ORDERS

       IMPORTANT:
       Orders are strictly filtered by restaurantId.

       A staff member can NEVER see another restaurant's
       orders through this endpoint.
    ======================================================== */

    const orders =
      await Order.find({
        restaurantId: restaurant._id,
      })
        .populate({
          path: "tableId",
          model: Table,
          select:
            "name number capacity status",
        })
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .lean();

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
        },

        orders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant orders GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load restaurant orders.",
      },
      {
        status: 500,
      }
    );
  }
}