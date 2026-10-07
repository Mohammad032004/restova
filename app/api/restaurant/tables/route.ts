import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import Table from "@/models/table";

const ALLOWED_ROLES = ["RESTAURANT_OWNER", "MANAGER"];

/**
 * GET /api/restaurant/tables
 *
 * Returns all tables belonging to the
 * currently logged-in restaurant.
 */
export async function GET() {
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

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access tables.",
        },
        { status: 403 }
      );
    }

    const restaurantId = session.user.restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not associated with a restaurant.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(restaurantId)
      .select("_id name numberOfTables status")
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      );
    }

    if (restaurant.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "This restaurant is currently suspended.",
        },
        { status: 403 }
      );
    }

    const tables = await Table.find({
      restaurantId,
    })
      .sort({ number: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
          configuredTables: restaurant.numberOfTables,
        },
        tables,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get restaurant tables error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load tables.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/restaurant/tables
 *
 * Creates one restaurant table.
 */
export async function POST(request: Request) {
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

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to create tables.",
        },
        { status: 403 }
      );
    }

    const restaurantId = session.user.restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not associated with a restaurant.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const number = Number(body.number);
    const capacity = Number(body.capacity);
    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!Number.isInteger(number) || number < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Table number must be a positive integer.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Table capacity must be at least 1.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Table name is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(restaurantId)
      .select("_id name numberOfTables status")
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      );
    }

    if (restaurant.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "This restaurant is currently suspended.",
        },
        { status: 403 }
      );
    }

    /*
     * The restaurant's approved table count acts
     * as the maximum number of tables available
     * in the current plan/application.
     */
    const existingTableCount = await Table.countDocuments({
      restaurantId,
    });

    if (existingTableCount >= restaurant.numberOfTables) {
      return NextResponse.json(
        {
          success: false,
          message: `Your restaurant is configured for ${restaurant.numberOfTables} table(s).`,
        },
        { status: 400 }
      );
    }

    /*
     * Check duplicate table number explicitly so
     * the user receives a friendly error.
     */
    const existingTable = await Table.findOne({
      restaurantId,
      number,
    });

    if (existingTable) {
      return NextResponse.json(
        {
          success: false,
          message: `Table ${number} already exists.`,
        },
        { status: 409 }
      );
    }

    /*
     * Secure random token for the customer's QR URL.
     */
    const qrToken = crypto.randomBytes(32).toString("hex");

    const table = await Table.create({
      restaurantId,
      name,
      number,
      capacity,
      status: "AVAILABLE",
      qrToken,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Table created successfully.",
        table,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create restaurant table error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create table.",
      },
      { status: 500 }
    );
  }
}