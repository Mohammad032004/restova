import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantSubscription from "@/models/restaurant-subscription";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "SUSPENDED",
] as const;

type SubscriptionStatus =
  (typeof allowedStatuses)[number];

type AuthResult =
  | {
      authorized: true;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

async function requireSuperAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
  };
}

/**
 * PATCH
 *
 * Update subscription status / auto-renew.
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { status, autoRenew } = body;

    if (
      status === undefined &&
      autoRenew === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one field must be provided.",
        },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subscription status.",
        },
        { status: 400 }
      );
    }

    if (
      autoRenew !== undefined &&
      typeof autoRenew !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "autoRenew must be a boolean.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const subscription =
      await RestaurantSubscription.findById(id);

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription not found.",
        },
        { status: 404 }
      );
    }

    if (status !== undefined) {
      /*
       * If changing another subscription to ACTIVE/TRIAL,
       * make sure the restaurant doesn't already have
       * another current subscription.
       */
      if (
        status === "ACTIVE" ||
        status === "TRIAL"
      ) {
        const existingSubscription =
          await RestaurantSubscription.findOne({
            restaurantId:
              subscription.restaurantId,
            status: {
              $in: ["ACTIVE", "TRIAL"],
            },
            _id: {
              $ne: subscription._id,
            },
          });

        if (existingSubscription) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This restaurant already has another active subscription.",
            },
            { status: 409 }
          );
        }
      }

      subscription.status =
        status as SubscriptionStatus;
    }

    if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }

    await subscription.save();

    const updatedSubscription =
      await RestaurantSubscription.findById(
        subscription._id
      )
        .populate({
          path: "restaurantId",
          select:
            "name type city state status numberOfTables",
        })
        .populate({
          path: "planId",
          select:
            "name description price billingCycle features maxTables maxStaff isActive",
        })
        .lean();

    return NextResponse.json({
      success: true,
      message:
        "Subscription updated successfully.",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error(
      "Update restaurant subscription error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update subscription.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const subscription =
      await RestaurantSubscription.findById(id)
        .populate({
          path: "restaurantId",
          select:
            "name type city state address pincode status numberOfTables ownerId",
        })
        .populate({
          path: "planId",
          select:
            "name description price billingCycle features maxTables maxStaff isActive",
        })
        .lean();

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error(
      "Get restaurant subscription details error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load subscription details.",
      },
      { status: 500 }
    );
  }
}