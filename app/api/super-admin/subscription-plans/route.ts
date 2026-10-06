import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
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

export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const plans = await SubscriptionPlan.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error(
      "Get subscription plans error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load subscription plans.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    const {
      name,
      description,
      price,
      billingCycle,
      features,
      maxTables,
      maxStaff,
    } = body;

    if (
      !name ||
      price === undefined ||
      !billingCycle ||
      maxTables === undefined ||
      maxStaff === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, price, billing cycle, maximum tables, and maximum staff are required.",
        },
        { status: 400 }
      );
    }

    if (
      billingCycle !== "MONTHLY" &&
      billingCycle !== "YEARLY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid billing cycle.",
        },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    const numericMaxTables = Number(maxTables);
    const numericMaxStaff = Number(maxStaff);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Price must be a valid non-negative number.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numericMaxTables) ||
      numericMaxTables <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum tables must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numericMaxStaff) ||
      numericMaxStaff <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum staff must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    if (!normalizedName) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan name is required.",
        },
        { status: 400 }
      );
    }

    const normalizedFeatures = Array.isArray(features)
      ? features
          .filter(
            (feature): feature is string =>
              typeof feature === "string"
          )
          .map((feature) => feature.trim())
          .filter(Boolean)
      : [];

    await connectDB();

    const existingPlan =
      await SubscriptionPlan.findOne({
        name: normalizedName,
        billingCycle,
      });

    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A plan with this name and billing cycle already exists.",
        },
        { status: 409 }
      );
    }

    const plan = await SubscriptionPlan.create({
      name: normalizedName,
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      price: numericPrice,
      billingCycle,
      features: normalizedFeatures,
      maxTables: numericMaxTables,
      maxStaff: numericMaxStaff,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Subscription plan created successfully.",
        plan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create subscription plan error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create subscription plan.",
      },
      { status: 500 }
    );
  }
}