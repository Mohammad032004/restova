import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { getRazorpay } from "@/lib/razorpay";

import SubscriptionInvoice from "@/models/subscription-invoice";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
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

    const invoice =
      await SubscriptionInvoice.findById(id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found.",
        },
        { status: 404 }
      );
    }

    if (invoice.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only pending invoices can be paid.",
        },
        { status: 400 }
      );
    }

    /*
     * If an order already exists, return it.
     * This prevents duplicate Razorpay orders.
     */
    if (invoice.gatewayOrderId) {
      return NextResponse.json({
        success: true,
        order: {
          id: invoice.gatewayOrderId,
          amount: Math.round(
            invoice.amount * 100
          ),
          currency: invoice.currency,
        },
        keyId:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }

    const razorpay = getRazorpay();

    const amount = Math.round(
      invoice.amount * 100
    );

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invoice amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const order =
      await razorpay.orders.create({
        amount,
        currency: invoice.currency || "INR",
        receipt: invoice.invoiceNumber,

        notes: {
          invoiceId: invoice._id.toString(),
          invoiceNumber:
            invoice.invoiceNumber,
          restaurantId:
            invoice.restaurantId.toString(),
          subscriptionId:
            invoice.subscriptionId.toString(),
        },
      });

    invoice.paymentGateway = "RAZORPAY";
    invoice.gatewayOrderId = order.id;

    await invoice.save();

    return NextResponse.json({
      success: true,

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },

      keyId:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "Razorpay order creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}