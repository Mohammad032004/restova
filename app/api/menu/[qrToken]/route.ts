import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Table from "@/models/table";
import Restaurant from "@/models/restaurant";
import MenuCategory from "@/models/menu-category";
import MenuItem from "@/models/menu-item";

interface RouteContext {
  params: Promise<{
    qrToken: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { qrToken } = await context.params;

    if (!qrToken || typeof qrToken !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "QR token is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the table using the QR token.
    const table = await Table.findOne({
      qrToken,
    })
      .select("_id restaurantId name number capacity status")
      .lean();

    if (!table) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired QR code.",
        },
        { status: 404 }
      );
    }

    // Find the restaurant belonging to this table.
    const restaurant = await Restaurant.findOne({
      _id: table.restaurantId,
      status: "ACTIVE",
    })
      .select("_id name type city state")
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "This restaurant is currently unavailable.",
        },
        { status: 404 }
      );
    }

    // Get active menu categories.
    const categories = await MenuCategory.find({
      restaurantId: restaurant._id,
      isActive: true,
    })
      .select("_id name description sortOrder")
      .sort({
        sortOrder: 1,
        createdAt: 1,
      })
      .lean();

    // Get only available menu items.
    const items = await MenuItem.find({
      restaurantId: restaurant._id,
      isAvailable: true,
    })
      .select(
        "_id categoryId name description price imageUrl isVeg sortOrder"
      )
      .sort({
        categoryId: 1,
        sortOrder: 1,
        createdAt: 1,
      })
      .lean();

    // Only show categories that contain available items.
    const categoryIdsWithItems = new Set(
      items.map((item) => item.categoryId.toString())
    );

    const visibleCategories = categories.filter((category) =>
      categoryIdsWithItems.has(category._id.toString())
    );

    return NextResponse.json(
      {
        success: true,

        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
          type: restaurant.type,
          city: restaurant.city,
          state: restaurant.state,
        },

        table: {
          id: table._id.toString(),
          name: table.name,
          number: table.number,
          capacity: table.capacity,
          status: table.status,
        },

        categories: visibleCategories,

        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer QR menu error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load the menu.",
      },
      { status: 500 }
    );
  }
}