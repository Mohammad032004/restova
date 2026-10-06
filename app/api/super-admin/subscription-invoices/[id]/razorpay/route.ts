import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import SubscriptionInvoice from "@/models/subscription-invoice";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(
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
     * If an order already exists for this invoice,
     * return it instead of creating another order.
     */
    if (invoice.gatewayOrderId) {
      return NextResponse.json({
        success: true,
        message:
          "Existing Razorpay order returned.",
        order: {
          id: invoice.gatewayOrderId,
          amount: Math.round(
            invoice.amount * 100
          ),
          currency: invoice.currency,
          invoiceId: invoice._id.toString(),
          invoiceNumber:
            invoice.invoiceNumber,
        },
      });
    }

    /*
     * Razorpay expects the amount in the
     * smallest currency unit.
     *
     * Example:
     *
     * ₹999 = 99900 paise
     */
    const amountInSmallestUnit = Math.round(
      invoice.amount * 100
    );

    if (amountInSmallestUnit <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invoice amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    /*
     * Create Razorpay order.
     */
   const razorpay = getRazorpay(); 
    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: invoice.currency,
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

    /*
     * Store the Razorpay order ID.
     *
     * Do NOT mark the invoice as PAID here.
     *
     * Creating an order does NOT mean payment succeeded.
     */
    invoice.paymentGateway = "RAZORPAY";
    invoice.gatewayOrderId = order.id;

    await invoice.save();

    return NextResponse.json({
      success: true,

      message:
        "Razorpay order created successfully.",

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        invoiceId:
          invoice._id.toString(),
        invoiceNumber:
          invoice.invoiceNumber,
      },
    });
  } catch (error) {
    console.error(
      "Create Razorpay subscription order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}