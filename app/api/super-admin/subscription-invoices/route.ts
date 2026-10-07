import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Restaurant from "@/models/restaurant";
import RestaurantSubscription from "@/models/restaurant-subscription";
import SubscriptionInvoice from "@/models/subscription-invoice";
import SubscriptionPlan from "@/models/subscription-plan";

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

function generateInvoiceNumber(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);

  return `RST-${year}${month}-${random}`;
}

/**
 * GET
 * View all subscription invoices
 */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const invoices = await SubscriptionInvoice.find()
      .populate({
        path: "restaurantId",
        model: Restaurant,
        select: "name type city state status numberOfTables",
      })
      .populate({
        path: "subscriptionId",
        model: RestaurantSubscription,
        select:
          "status startDate endDate billingCycle price autoRenew planId",
        populate: {
          path: "planId",
          model: SubscriptionPlan,
          select:
            "name description price billingCycle features maxTables maxStaff isActive",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        invoices,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "========== GET SUBSCRIPTION INVOICES ERROR =========="
    );
    console.error(error);
    console.error(
      "======================================================"
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load subscription invoices.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Create a subscription invoice
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
      subscriptionId,
      amount,
      currency,
      dueDate,
      notes,
    } = body;

    if (!restaurantId || typeof restaurantId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant ID is required.",
        },
        { status: 400 }
      );
    }

    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be a valid non-negative number.",
        },
        { status: 400 }
      );
    }

    if (
      currency !== undefined &&
      typeof currency !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Currency must be a valid string.",
        },
        { status: 400 }
      );
    }

    if (dueDate !== undefined && dueDate !== null) {
      if (
        typeof dueDate !== "string" ||
        Number.isNaN(new Date(dueDate).getTime())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Due date must be a valid date.",
          },
          { status: 400 }
        );
      }
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

    const subscription =
      await RestaurantSubscription.findById(
        subscriptionId
      );

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant subscription not found.",
        },
        { status: 404 }
      );
    }

    if (
      subscription.restaurantId.toString() !==
      restaurant._id.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The subscription does not belong to the selected restaurant.",
        },
        { status: 400 }
      );
    }

    const invoiceNumber = generateInvoiceNumber();

    const invoice =
      await SubscriptionInvoice.create({
        restaurantId: restaurant._id,
        subscriptionId: subscription._id,
        invoiceNumber,
        amount,
        currency:
          typeof currency === "string" &&
          currency.trim()
            ? currency.trim().toUpperCase()
            : "INR",
        status: "PENDING",
        issueDate: new Date(),
        dueDate: dueDate
          ? new Date(dueDate)
          : undefined,
        notes:
          typeof notes === "string" &&
          notes.trim()
            ? notes.trim()
            : undefined,
      });

    const populatedInvoice =
      await SubscriptionInvoice.findById(
        invoice._id
      )
        .populate({
          path: "restaurantId",
          model: Restaurant,
          select:
            "name type city state status numberOfTables",
        })
        .populate({
          path: "subscriptionId",
          model: RestaurantSubscription,
          select:
            "status startDate endDate billingCycle price autoRenew planId",
          populate: {
            path: "planId",
            model: SubscriptionPlan,
            select:
              "name description price billingCycle features maxTables maxStaff isActive",
          },
        })
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Subscription invoice created successfully.",
        invoice: populatedInvoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create subscription invoice error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create subscription invoice.",
      },
      { status: 500 }
    );
  }
}