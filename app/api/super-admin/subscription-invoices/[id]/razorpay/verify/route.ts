import crypto from "crypto";
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

    const body = await request.json();

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (
      !razorpayOrderId ||
      typeof razorpayOrderId !== "string" ||
      !razorpayPaymentId ||
      typeof razorpayPaymentId !== "string" ||
      !razorpaySignature ||
      typeof razorpaySignature !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment verification data is incomplete.",
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
     * Do not process an already paid invoice again.
     */
    if (invoice.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Invoice is already marked as paid.",
        invoice,
      });
    }

    /*
     * The order ID returned by Razorpay must match
     * the order ID stored against this invoice.
     */
    if (
      !invoice.gatewayOrderId ||
      invoice.gatewayOrderId !== razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay order does not match this invoice.",
        },
        { status: 400 }
      );
    }

    /*
     * The invoice must still be pending.
     */
    if (invoice.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invoice cannot be verified in its current state.",
        },
        { status: 400 }
      );
    }

    const razorpaySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error(
        "RAZORPAY_KEY_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment verification is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * Razorpay signature verification.
     *
     * Signature is generated from:
     *
     * razorpayOrderId + "|" + razorpayPaymentId
     *
     * using HMAC SHA256 and the Razorpay secret.
     */
    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpaySecret
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    /*
     * Use timingSafeEqual instead of a simple
     * string comparison for the signature.
     */
    const generatedBuffer =
      Buffer.from(generatedSignature, "utf8");

    const receivedBuffer =
      Buffer.from(razorpaySignature, "utf8");

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay payment signature.",
        },
        { status: 400 }
      );
    }

    const signatureValid =
      crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );

    if (!signatureValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay payment signature.",
        },
        { status: 400 }
      );
    }

    /*
     * Signature verification succeeded.
     *
     * Only now do we mark the invoice as PAID.
     */
    invoice.status = "PAID";

    invoice.paymentGateway = "RAZORPAY";

    invoice.gatewayOrderId =
      razorpayOrderId;

    invoice.gatewayPaymentId =
      razorpayPaymentId;

    invoice.paidAt = new Date();

    await invoice.save();

    return NextResponse.json({
      success: true,

      message:
        "Razorpay payment verified successfully.",

      invoice,
    });
  } catch (error) {
    console.error(
      "Razorpay payment verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to verify Razorpay payment.",
      },
      { status: 500 }
    );
  }
}