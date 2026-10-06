import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import SubscriptionPlan from "@/models/subscription-plan";
import RestaurantSubscription from "@/models/restaurant-subscription";
import SubscriptionInvoice from "@/models/subscription-invoice";

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
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
  };
}

function generateInvoiceNumber() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `RST-${year}${month}-${random}`;
}

/**
 * GET
 *
 * Fetch all restaurant subscriptions.
 */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const subscriptions =
      await RestaurantSubscription.find()
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
        message:
          "Failed to load restaurant subscriptions.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Assign a subscription plan to a restaurant.
 *
 * This also creates the first subscription invoice.
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

    const restaurant =
      await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found.",
        },
        { status: 404 }
      );
    }

    const plan =
      await SubscriptionPlan.findById(planId);

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

    if (
      Number.isNaN(
        subscriptionStartDate.getTime()
      )
    ) {
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

    /*
     * Create subscription and invoice together.
     *
     * Both records must succeed.
     * If either operation fails, the transaction
     * is rolled back.
     */
    const session =
      await RestaurantSubscription.db.startSession();

    let createdSubscriptionId: string | null = null;
    let createdInvoiceId: string | null = null;

    try {
      await session.withTransaction(async () => {
        const createdSubscriptions =
          await RestaurantSubscription.create(
            [
              {
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
              },
            ],
            { session }
          );

        const subscription =
          createdSubscriptions[0];

        if (!subscription) {
          throw new Error(
            "Failed to create restaurant subscription."
          );
        }

        createdSubscriptionId =
          subscription._id.toString();

        /*
         * Create the first invoice for this subscription.
         *
         * The invoice amount is taken from the plan's
         * current price and stored independently.
         */
        const createdInvoices =
          await SubscriptionInvoice.create(
            [
              {
                restaurantId,
                subscriptionId: subscription._id,
                invoiceNumber:
                  generateInvoiceNumber(),

                amount: plan.price,
                currency: "INR",

                /*
                 * A subscription assignment does not mean
                 * the invoice has been paid.
                 */
                status: "PENDING",

                issueDate: new Date(),
                dueDate: subscriptionStartDate,

                notes:
                  status === "TRIAL"
                    ? "Initial invoice created for a trial subscription."
                    : "Initial invoice created for the restaurant subscription.",
              },
            ],
            { session }
          );

        const invoice = createdInvoices[0];

        if (!invoice) {
          throw new Error(
            "Failed to create subscription invoice."
          );
        }

        createdInvoiceId =
          invoice._id.toString();
      });
    } finally {
      await session.endSession();
    }

    if (
      !createdSubscriptionId ||
      !createdInvoiceId
    ) {
      throw new Error(
        "Subscription and invoice creation failed."
      );
    }

    /*
     * Fetch the newly created subscription with
     * restaurant and plan information.
     */
    const populatedSubscription =
      await RestaurantSubscription.findById(
        createdSubscriptionId
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

    /*
     * Fetch the newly created invoice.
     */
    const invoice =
      await SubscriptionInvoice.findById(
        createdInvoiceId
      )
        .populate({
          path: "restaurantId",
          select:
            "name type city state status numberOfTables",
          model: Restaurant,
        })
        .populate({
          path: "subscriptionId",
          select:
            "status startDate endDate billingCycle price autoRenew planId",
          populate: {
            path: "planId",
            select:
              "name description price billingCycle features maxTables maxStaff isActive",
          },
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Subscription assigned and invoice created successfully.",

        subscription: populatedSubscription,

        invoice,
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
          "Failed to assign subscription and create invoice.",
      },
      { status: 500 }
    );
  }
}