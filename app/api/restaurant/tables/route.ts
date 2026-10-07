import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Restaurant from "@/models/restaurant";
import Table from "@/models/table";

/* ============================================================
   VIEW PERMISSIONS

   These roles can view restaurant tables.
============================================================ */

const VIEW_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
  "WAITER",
];

/* ============================================================
   MANAGEMENT PERMISSIONS

   Only Owner / Manager can create tables.
============================================================ */

const MANAGE_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
];

/* ============================================================
   GET TABLES
============================================================ */

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
      !VIEW_ROLES.includes(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view restaurant tables.",
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
    ======================================================== */

    const restaurant =
      await Restaurant.findOne({
        _id: session.user.restaurantId,
        status: "ACTIVE",
      })
        .select(
          "_id name numberOfTables status"
        )
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
       GET TABLES

       Always scoped to the authenticated restaurant.
    ======================================================== */

    const tables =
      await Table.find({
        restaurantId: restaurant._id,
      })
        .sort({
          number: 1,
        })
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
          numberOfTables:
            restaurant.numberOfTables,
        },

        tables,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant tables GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load restaurant tables.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   CREATE TABLE
============================================================ */

export async function POST(
  request: Request
) {
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
       MANAGEMENT ROLE CHECK
    ======================================================== */

    if (
      !MANAGE_ROLES.includes(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only the restaurant owner or manager can create tables.",
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
       REQUEST BODY
    ======================================================== */

    let body: {
      name?: unknown;
      number?: unknown;
      capacity?: unknown;
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

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const number =
      typeof body.number === "number"
        ? body.number
        : Number(body.number);

    const capacity =
      typeof body.capacity === "number"
        ? body.capacity
        : Number(body.capacity);

    /* ========================================================
       INPUT VALIDATION
    ======================================================== */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Table name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(number) ||
      number < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Table number must be a positive integer.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Table capacity must be a positive integer.",
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
    ======================================================== */

    const restaurant =
      await Restaurant.findOne({
        _id: session.user.restaurantId,
        status: "ACTIVE",
      })
        .select(
          "_id name numberOfTables status"
        )
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
       CHECK TABLE LIMIT

       Restaurant can only create the number of tables
       included in its registered configuration.
    ======================================================== */

    const existingTableCount =
      await Table.countDocuments({
        restaurantId: restaurant._id,
      });

    if (
      existingTableCount >=
      restaurant.numberOfTables
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `You have reached your restaurant's maximum of ${restaurant.numberOfTables} tables.`,
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       DUPLICATE TABLE NUMBER CHECK
    ======================================================== */

    const existingTable =
      await Table.findOne({
        restaurantId: restaurant._id,
        number,
      })
        .select("_id")
        .lean();

    if (existingTable) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Table number ${number} already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    /* ========================================================
       GENERATE QR TOKEN
    ======================================================== */

    const qrToken =
      crypto.randomBytes(32).toString("hex");

    /* ========================================================
       CREATE TABLE
    ======================================================== */

    const table =
      await Table.create({
        restaurantId:
          restaurant._id,

        name,

        number,

        capacity,

        status: "AVAILABLE",

        qrToken,
      });

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "Table created successfully.",

        table: {
          id: table._id.toString(),
          name: table.name,
          number: table.number,
          capacity: table.capacity,
          status: table.status,
          qrToken: table.qrToken,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Restaurant table POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create table.",
      },
      {
        status: 500,
      }
    );
  }
}