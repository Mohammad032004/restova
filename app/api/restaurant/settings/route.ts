import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";

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
          message: "You do not have permission to access restaurant settings.",
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

  const restaurant = await Restaurant.findById(session.user.restaurantId);

  if (!restaurant) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    session,
    restaurant,
  };
}

// ======================================================
// GET RESTAURANT SETTINGS
// ======================================================

export async function GET() {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const { restaurant } = result;

    return NextResponse.json(
      {
        success: true,
        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
          type: restaurant.type,
          address: restaurant.address,
          city: restaurant.city,
          state: restaurant.state,
          pincode: restaurant.pincode,
          numberOfTables: restaurant.numberOfTables,
          status: restaurant.status,
          ownerId: restaurant.ownerId.toString(),
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restaurant settings GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load restaurant settings.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE RESTAURANT SETTINGS
// ======================================================

export async function PATCH(request: Request) {
  try {
    const result = await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    const { restaurant, session } = result;

    // Only restaurant owner can modify settings.
    if (session.user.role !== "RESTAURANT_OWNER") {
      return NextResponse.json(
        {
          success: false,
          message: "Only the restaurant owner can update restaurant settings.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type.trim()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const city =
      typeof body.city === "string"
        ? body.city.trim()
        : "";

    const state =
      typeof body.state === "string"
        ? body.state.trim()
        : "";

    const pincode =
      typeof body.pincode === "string"
        ? body.pincode.trim()
        : "";

    const numberOfTables = Number(body.numberOfTables);

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant name cannot exceed 150 characters.",
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant type is required.",
        },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message: "Address is required.",
        },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required.",
        },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        {
          success: false,
          message: "State is required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Pincode must contain exactly 6 digits.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numberOfTables) ||
      numberOfTables < 1 ||
      numberOfTables > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Number of tables must be between 1 and 1000.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Update restaurant
    // --------------------------------------------------

    restaurant.name = name;
    restaurant.type = type;
    restaurant.address = address;
    restaurant.city = city;
    restaurant.state = state;
    restaurant.pincode = pincode;
    restaurant.numberOfTables = numberOfTables;

    await restaurant.save();

    return NextResponse.json(
      {
        success: true,
        message: "Restaurant settings updated successfully.",
        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
          type: restaurant.type,
          address: restaurant.address,
          city: restaurant.city,
          state: restaurant.state,
          pincode: restaurant.pincode,
          numberOfTables: restaurant.numberOfTables,
          status: restaurant.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restaurant settings PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update restaurant settings.",
      },
      { status: 500 }
    );
  }
}