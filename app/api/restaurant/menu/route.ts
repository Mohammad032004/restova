import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import MenuCategory from "@/models/menu-category";
import MenuItem from "@/models/menu-item";

const ALLOWED_ROLES = ["RESTAURANT_OWNER", "MANAGER"];

async function getAuthorizedRestaurant() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      ),
    };
  }

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage the menu.",
        },
        { status: 403 }
      ),
    };
  }

  if (!session.user.restaurantId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Restaurant information is missing from your account.",
        },
        { status: 400 }
      ),
    };
  }

  await connectDB();

  const restaurant = await Restaurant.findOne({
    _id: session.user.restaurantId,
    status: "ACTIVE",
  }).lean();

  if (!restaurant) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Restaurant not found or inactive.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    restaurantId: restaurant._id,
  };
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
| Returns the complete menu for the logged-in restaurant.
*/
export async function GET() {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const restaurantId = result.restaurantId;

    const categories = await MenuCategory.find({
      restaurantId,
    })
      .sort({
        sortOrder: 1,
        createdAt: 1,
      })
      .lean();

    const items = await MenuItem.find({
      restaurantId,
    })
      .sort({
        categoryId: 1,
        sortOrder: 1,
        createdAt: 1,
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        categories,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restaurant menu GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load the restaurant menu.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
| Creates either a category or a menu item.
|
| category:
| {
|   type: "CATEGORY",
|   name,
|   description?,
|   sortOrder?
| }
|
| item:
| {
|   type: "ITEM",
|   categoryId,
|   name,
|   description?,
|   price,
|   imageUrl?,
|   isVeg?,
|   isAvailable?,
|   sortOrder?
| }
|--------------------------------------------------------------------------
*/
export async function POST(request: Request) {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const restaurantId = result.restaurantId;

    const body = await request.json();

    const type = body?.type;

    if (type === "CATEGORY") {
      const name =
        typeof body.name === "string" ? body.name.trim() : "";

      const description =
        typeof body.description === "string"
          ? body.description.trim()
          : "";

      const sortOrder =
        body.sortOrder !== undefined
          ? Number(body.sortOrder)
          : 0;

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Category name is required.",
          },
          { status: 400 }
        );
      }

      if (!Number.isFinite(sortOrder) || sortOrder < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid category sort order.",
          },
          { status: 400 }
        );
      }

      const existingCategory = await MenuCategory.findOne({
        restaurantId,
        name,
      });

      if (existingCategory) {
        return NextResponse.json(
          {
            success: false,
            message: "A category with this name already exists.",
          },
          { status: 409 }
        );
      }

      const category = await MenuCategory.create({
        restaurantId,
        name,
        description,
        sortOrder,
        isActive: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Menu category created successfully.",
          category,
        },
        { status: 201 }
      );
    }

    if (type === "ITEM") {
      const categoryId =
        typeof body.categoryId === "string"
          ? body.categoryId.trim()
          : "";

      const name =
        typeof body.name === "string" ? body.name.trim() : "";

      const description =
        typeof body.description === "string"
          ? body.description.trim()
          : "";

      const imageUrl =
        typeof body.imageUrl === "string"
          ? body.imageUrl.trim()
          : "";

      const price = Number(body.price);

      const sortOrder =
        body.sortOrder !== undefined
          ? Number(body.sortOrder)
          : 0;

      const isVeg =
        body.isVeg === undefined ? true : Boolean(body.isVeg);

      const isAvailable =
        body.isAvailable === undefined
          ? true
          : Boolean(body.isAvailable);

      if (!categoryId) {
        return NextResponse.json(
          {
            success: false,
            message: "Category is required.",
          },
          { status: 400 }
        );
      }

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Menu item name is required.",
          },
          { status: 400 }
        );
      }

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid item price.",
          },
          { status: 400 }
        );
      }

      if (!Number.isFinite(sortOrder) || sortOrder < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid item sort order.",
          },
          { status: 400 }
        );
      }

      const category = await MenuCategory.findOne({
        _id: categoryId,
        restaurantId,
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "The selected category does not belong to this restaurant.",
          },
          { status: 400 }
        );
      }

      const item = await MenuItem.create({
        restaurantId,
        categoryId,
        name,
        description,
        price,
        imageUrl,
        isVeg,
        isAvailable,
        sortOrder,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Menu item created successfully.",
          item,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid menu type.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Restaurant menu POST error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A menu category with this name already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create menu data.",
      },
      { status: 500 }
    );
  }
}