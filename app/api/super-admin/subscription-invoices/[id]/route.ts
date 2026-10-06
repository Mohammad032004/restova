import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
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

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET
 * Get one subscription invoice
 */
export async function GET(
  _request: Request,
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
          message: "Invoice ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const invoice = await SubscriptionInvoice.findById(id)
      .populate({
        path: "restaurantId",
        select:
          "name type city state address pincode status numberOfTables ownerId",
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

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription invoice not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get subscription invoice error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load subscription invoice.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Update subscription invoice
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
          message: "Invoice ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      status,
      paidAt,
      paymentGateway,
      gatewayOrderId,
      gatewayPaymentId,
      dueDate,
      notes,
    } = body;

    const allowedStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
      "REFUNDED",
      "CANCELLED",
    ];

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice status.",
        },
        { status: 400 }
      );
    }

    const allowedGateways = [
      "RAZORPAY",
      "DEMO",
      "OTHER",
    ];

    if (
      paymentGateway !== undefined &&
      paymentGateway !== null &&
      !allowedGateways.includes(paymentGateway)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment gateway.",
        },
        { status: 400 }
      );
    }

    if (
      paidAt !== undefined &&
      paidAt !== null &&
      (
        typeof paidAt !== "string" ||
        Number.isNaN(new Date(paidAt).getTime())
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Paid date must be a valid date.",
        },
        { status: 400 }
      );
    }

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      (
        typeof dueDate !== "string" ||
        Number.isNaN(new Date(dueDate).getTime())
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Due date must be a valid date.",
        },
        { status: 400 }
      );
    }

    if (
      gatewayOrderId !== undefined &&
      gatewayOrderId !== null &&
      typeof gatewayOrderId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Gateway order ID must be a string.",
        },
        { status: 400 }
      );
    }

    if (
      gatewayPaymentId !== undefined &&
      gatewayPaymentId !== null &&
      typeof gatewayPaymentId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Gateway payment ID must be a string.",
        },
        { status: 400 }
      );
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Notes must be a string.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const invoice =
      await SubscriptionInvoice.findById(id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription invoice not found.",
        },
        { status: 404 }
      );
    }

    if (status === "PAID") {
      invoice.status = "PAID";
      invoice.paidAt = paidAt
        ? new Date(paidAt)
        : invoice.paidAt || new Date();
    } else if (status !== undefined) {
      invoice.status = status;

      if (status !== "PAID") {
        invoice.paidAt = undefined;
      }
    }

    if (paymentGateway !== undefined) {
      invoice.paymentGateway =
        paymentGateway || undefined;
    }

    if (gatewayOrderId !== undefined) {
      invoice.gatewayOrderId =
        typeof gatewayOrderId === "string" &&
        gatewayOrderId.trim()
          ? gatewayOrderId.trim()
          : undefined;
    }

    if (gatewayPaymentId !== undefined) {
      invoice.gatewayPaymentId =
        typeof gatewayPaymentId === "string" &&
        gatewayPaymentId.trim()
          ? gatewayPaymentId.trim()
          : undefined;
    }

    if (dueDate !== undefined) {
      invoice.dueDate = dueDate
        ? new Date(dueDate)
        : undefined;
    }

    if (notes !== undefined) {
      invoice.notes =
        typeof notes === "string" && notes.trim()
          ? notes.trim()
          : undefined;
    }

    await invoice.save();

    const updatedInvoice =
      await SubscriptionInvoice.findById(invoice._id)
        .populate({
          path: "restaurantId",
          select:
            "name type city state address pincode status numberOfTables ownerId",
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

    return NextResponse.json({
      success: true,
      message:
        "Subscription invoice updated successfully.",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error(
      "Update subscription invoice error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update subscription invoice.",
      },
      { status: 500 }
    );
  }
}