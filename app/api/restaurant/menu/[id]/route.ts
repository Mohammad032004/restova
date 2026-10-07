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
          message: "Restaurant information is missing.",
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
| PATCH
|--------------------------------------------------------------------------
| Updates either a CATEGORY or ITEM.
|
| CATEGORY:
| {
|   type: "CATEGORY",
|   name?,
|   description?,
|   sortOrder?,
|   isActive?
| }
|
| ITEM:
| {
|   type: "ITEM",
|   categoryId?,
|   name?,
|   description?,
|   price?,
|   imageUrl?,
|   isVeg?,
|   isAvailable?,
|   sortOrder?
| }
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const restaurantId = result.restaurantId;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const type = body?.type;

    if (type === "CATEGORY") {
      const category = await MenuCategory.findOne({
        _id: id,
        restaurantId,
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "Menu category not found.",
          },
          { status: 404 }
        );
      }

      if (body.name !== undefined) {
        if (typeof body.name !== "string") {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid category name.",
            },
            { status: 400 }
          );
        }

        const name = body.name.trim();

        if (!name) {
          return NextResponse.json(
            {
              success: false,
              message: "Category name cannot be empty.",
            },
            { status: 400 }
          );
        }

        const duplicate = await MenuCategory.findOne({
          restaurantId,
          name,
          _id: { $ne: id },
        });

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              message: "A category with this name already exists.",
            },
            { status: 409 }
          );
        }

        category.name = name;
      }

      if (body.description !== undefined) {
        category.description =
          typeof body.description === "string"
            ? body.description.trim()
            : "";
      }

      if (body.sortOrder !== undefined) {
        const sortOrder = Number(body.sortOrder);

        if (!Number.isFinite(sortOrder) || sortOrder < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid category sort order.",
            },
            { status: 400 }
          );
        }

        category.sortOrder = sortOrder;
      }

      if (body.isActive !== undefined) {
        category.isActive = Boolean(body.isActive);
      }

      await category.save();

      return NextResponse.json(
        {
          success: true,
          message: "Menu category updated successfully.",
          category,
        },
        { status: 200 }
      );
    }

    if (type === "ITEM") {
      const item = await MenuItem.findOne({
        _id: id,
        restaurantId,
      });

      if (!item) {
        return NextResponse.json(
          {
            success: false,
            message: "Menu item not found.",
          },
          { status: 404 }
        );
      }

      if (body.categoryId !== undefined) {
        if (
          typeof body.categoryId !== "string" ||
          !body.categoryId.trim()
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid category.",
            },
            { status: 400 }
          );
        }

        const category = await MenuCategory.findOne({
          _id: body.categoryId.trim(),
          restaurantId,
        });

        if (!category) {
          return NextResponse.json(
            {
              success: false,
              message:
                "The selected category does not belong to this restaurant.",
            },
            { status: 400 }
          );
        }

        item.categoryId = category._id;
      }

      if (body.name !== undefined) {
        if (typeof body.name !== "string") {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid item name.",
            },
            { status: 400 }
          );
        }

        const name = body.name.trim();

        if (!name) {
          return NextResponse.json(
            {
              success: false,
              message: "Item name cannot be empty.",
            },
            { status: 400 }
          );
        }

        item.name = name;
      }

      if (body.description !== undefined) {
        item.description =
          typeof body.description === "string"
            ? body.description.trim()
            : "";
      }

      if (body.price !== undefined) {
        const price = Number(body.price);

        if (!Number.isFinite(price) || price < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Please enter a valid item price.",
            },
            { status: 400 }
          );
        }

        item.price = price;
      }

      if (body.imageUrl !== undefined) {
        item.imageUrl =
          typeof body.imageUrl === "string"
            ? body.imageUrl.trim()
            : "";
      }

      if (body.isVeg !== undefined) {
        item.isVeg = Boolean(body.isVeg);
      }

      if (body.isAvailable !== undefined) {
        item.isAvailable = Boolean(body.isAvailable);
      }

      if (body.sortOrder !== undefined) {
        const sortOrder = Number(body.sortOrder);

        if (!Number.isFinite(sortOrder) || sortOrder < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid item sort order.",
            },
            { status: 400 }
          );
        }

        item.sortOrder = sortOrder;
      }

      await item.save();

      return NextResponse.json(
        {
          success: true,
          message: "Menu item updated successfully.",
          item,
        },
        { status: 200 }
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
    console.error("Restaurant menu PATCH error:", error);

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
        message: "Failed to update menu data.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
| Deletes:
| - Menu item directly
| - Menu category only if it has no items
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const restaurantId = result.restaurantId;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const type = body?.type;

    if (type === "ITEM") {
      const item = await MenuItem.findOne({
        _id: id,
        restaurantId,
      });

      if (!item) {
        return NextResponse.json(
          {
            success: false,
            message: "Menu item not found.",
          },
          { status: 404 }
        );
      }

      await MenuItem.deleteOne({
        _id: id,
        restaurantId,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Menu item deleted successfully.",
        },
        { status: 200 }
      );
    }

    if (type === "CATEGORY") {
      const category = await MenuCategory.findOne({
        _id: id,
        restaurantId,
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "Menu category not found.",
          },
          { status: 404 }
        );
      }

      const itemCount = await MenuItem.countDocuments({
        restaurantId,
        categoryId: id,
      });

      if (itemCount > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This category contains menu items. Remove or move the items before deleting the category.",
          },
          { status: 409 }
        );
      }

      await MenuCategory.deleteOne({
        _id: id,
        restaurantId,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Menu category deleted successfully.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid menu type.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Restaurant menu DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete menu data.",
      },
      { status: 500 }
    );
  }
}