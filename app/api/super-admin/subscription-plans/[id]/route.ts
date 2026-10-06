import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import SubscriptionPlan from "@/models/subscription-plan";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan ID is required.",
        },
        { status: 400 }
      );
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
      isActive,
    } = body;

    await connectDB();

    const plan =
      await SubscriptionPlan.findById(id);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription plan not found.",
        },
        { status: 404 }
      );
    }

    if (
      name !== undefined &&
      typeof name !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid plan name.",
        },
        { status: 400 }
      );
    }

    if (
      billingCycle !== undefined &&
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

    if (
      price !== undefined &&
      (!Number.isFinite(Number(price)) ||
        Number(price) < 0)
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
      maxTables !== undefined &&
      (!Number.isInteger(Number(maxTables)) ||
        Number(maxTables) <= 0)
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
      maxStaff !== undefined &&
      (!Number.isInteger(Number(maxStaff)) ||
        Number(maxStaff) <= 0)
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

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid active status.",
        },
        { status: 400 }
      );
    }

    const newName =
      name !== undefined
        ? name.trim()
        : plan.name;

    const newBillingCycle =
      billingCycle !== undefined
        ? billingCycle
        : plan.billingCycle;

    if (!newName) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan name is required.",
        },
        { status: 400 }
      );
    }

    const duplicate =
      await SubscriptionPlan.findOne({
        _id: { $ne: id },
        name: newName,
        billingCycle: newBillingCycle,
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another plan with this name and billing cycle already exists.",
        },
        { status: 409 }
      );
    }

    plan.name = newName;

    if (description !== undefined) {
      plan.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    if (price !== undefined) {
      plan.price = Number(price);
    }

    if (billingCycle !== undefined) {
      plan.billingCycle = billingCycle;
    }

    if (Array.isArray(features)) {
      plan.features = features
        .filter(
          (feature): feature is string =>
            typeof feature === "string"
        )
        .map((feature) => feature.trim())
        .filter(Boolean);
    }

    if (maxTables !== undefined) {
      plan.maxTables = Number(maxTables);
    }

    if (maxStaff !== undefined) {
      plan.maxStaff = Number(maxStaff);
    }

    if (isActive !== undefined) {
      plan.isActive = isActive;
    }

    await plan.save();

    return NextResponse.json({
      success: true,
      message: "Subscription plan updated successfully.",
      plan,
    });
  } catch (error) {
    console.error(
      "Update subscription plan error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update subscription plan.",
      },
      { status: 500 }
    );
  }
}