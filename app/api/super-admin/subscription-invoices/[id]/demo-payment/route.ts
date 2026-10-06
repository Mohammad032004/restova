import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import SubscriptionInvoice from "@/models/subscription-invoice";

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

    /*
     * Only pending invoices can be paid.
     */
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
     * Generate a clearly identifiable demo payment ID.
     *
     * This is NOT a Razorpay payment ID.
     */
    const demoPaymentId =
      `demo_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    /*
     * Update the invoice.
     *
     * The payment is intentionally marked as DEMO,
     * so it can never be confused with a real
     * Razorpay transaction.
     */
    invoice.status = "PAID";

    invoice.paymentGateway = "DEMO";

    invoice.gatewayPaymentId =
      demoPaymentId;

    invoice.paidAt = new Date();

    invoice.notes = invoice.notes
      ? `${invoice.notes} Demo payment completed.`
      : "Demo payment completed.";

    await invoice.save();

    return NextResponse.json({
      success: true,

      message:
        "Demo payment completed successfully.",

      payment: {
        invoiceId: invoice._id.toString(),

        invoiceNumber:
          invoice.invoiceNumber,

        amount: invoice.amount,

        currency: invoice.currency,

        status: invoice.status,

        paymentGateway:
          invoice.paymentGateway,

        paymentId:
          invoice.gatewayPaymentId,

        paidAt: invoice.paidAt,
      },
    });
  } catch (error) {
    console.error(
      "Demo subscription payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process demo payment.",
      },
      { status: 500 }
    );
  }
}