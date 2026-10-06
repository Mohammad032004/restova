import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import SubscriptionPlan from "@/models/subscription-plan";
import RestaurantSubscription from "@/models/restaurant-subscription";

async function requireSuperAdmin() {
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
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    response: null,
  };
}

/**
 * GET
 * Fetch all restaurant subscriptions
 */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const subscriptions = await RestaurantSubscription.find()
      .populate({
        path: "restaurantId",
        select: "name type city state status numberOfTables",
        model: Restaurant,
      })
      .populate({
        path: "planId",
        select:
          "name description price billingCycle features maxTables maxStaff isActive",
        model: SubscriptionPlan,
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error(
      "Get restaurant subscriptions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load restaurant subscriptions.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Assign a subscription plan to a restaurant
 */
export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    const {
      restaurantId,
      planId,
      startDate,
      status = "ACTIVE",
      autoRenew = false,
    } = body;

    if (!restaurantId || !planId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Restaurant ID and subscription plan ID are required.",
        },
        { status: 400 }
      );
    }

    if (!["ACTIVE", "TRIAL"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subscription status must be ACTIVE or TRIAL.",
        },
        { status: 400 }
      );
    }

    if (typeof autoRenew !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "autoRenew must be a boolean.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(
      restaurantId
    );

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      );
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription plan not found.",
        },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This subscription plan is currently inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * A restaurant can only have one current
     * ACTIVE/TRIAL subscription.
     */
    const existingSubscription =
      await RestaurantSubscription.findOne({
        restaurantId,
        status: {
          $in: ["ACTIVE", "TRIAL"],
        },
      });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This restaurant already has an active subscription.",
        },
        { status: 409 }
      );
    }

    const subscriptionStartDate = startDate
      ? new Date(startDate)
      : new Date();

    if (Number.isNaN(subscriptionStartDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid start date.",
        },
        { status: 400 }
      );
    }

    const subscriptionEndDate =
      new Date(subscriptionStartDate);

    if (plan.billingCycle === "MONTHLY") {
      subscriptionEndDate.setMonth(
        subscriptionEndDate.getMonth() + 1
      );
    } else {
      subscriptionEndDate.setFullYear(
        subscriptionEndDate.getFullYear() + 1
      );
    }

    const subscription =
      await RestaurantSubscription.create({
        restaurantId,
        planId,

        status,

        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,

        /*
         * Snapshot the plan's current billing information.
         * Future plan changes should not change old subscriptions.
         */
        billingCycle: plan.billingCycle,
        price: plan.price,

        autoRenew,
      });

    const populatedSubscription =
      await RestaurantSubscription.findById(
        subscription._id
      )
        .populate({
          path: "restaurantId",
          select:
            "name type city state status numberOfTables",
          model: Restaurant,
        })
        .populate({
          path: "planId",
          select:
            "name description price billingCycle features maxTables maxStaff isActive",
          model: SubscriptionPlan,
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Subscription assigned successfully.",
        subscription: populatedSubscription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create restaurant subscription error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to assign subscription.",
      },
      { status: 500 }
    );
  }
}