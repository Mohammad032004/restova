import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import SubscriptionInvoice from "@/models/subscription-invoice";

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Webhook configuration is missing.",
        },
        { status: 500 }
      );
    }

    /*
     * IMPORTANT:
     * We must read the raw request body.
     * Razorpay signs the exact raw body.
     */
    const rawBody = await request.text();

    const signature =
      request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing Razorpay webhook signature.",
        },
        { status: 400 }
      );
    }

    const signatureValid = verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!signatureValid) {
      console.warn(
        "Invalid Razorpay webhook signature."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook signature.",
        },
        { status: 401 }
      );
    }

    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook payload.",
        },
        { status: 400 }
      );
    }

    const event = payload?.event;

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Webhook event is missing.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * -------------------------------------------------------
     * PAYMENT CAPTURED
     * -------------------------------------------------------
     */
    if (event === "payment.captured") {
      const payment = payload?.payload?.payment?.entity;

      const orderId = payment?.order_id;
      const paymentId = payment?.id;

      if (!orderId || !paymentId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment order ID or payment ID is missing.",
          },
          { status: 400 }
        );
      }

      const invoice = await SubscriptionInvoice.findOne({
        gatewayOrderId: orderId,
      });

      if (!invoice) {
        console.warn(
          `No invoice found for Razorpay order ${orderId}`
        );

        /*
         * Return 200 so Razorpay does not repeatedly retry
         * a webhook for an order that Restova does not know.
         */
        return NextResponse.json({
          success: true,
          message: "No matching invoice found.",
        });
      }

      /*
       * Idempotency:
       *
       * Razorpay may send the same webhook more than once.
       *
       * If Restova already marked this invoice as PAID,
       * don't modify it again.
       */
      if (invoice.status === "PAID") {
        return NextResponse.json({
          success: true,
          message: "Invoice already marked as paid.",
        });
      }

      /*
       * Verify that the payment belongs to the stored order.
       *
       * We already matched gatewayOrderId above.
       */
      invoice.status = "PAID";
      invoice.paymentGateway = "RAZORPAY";
      invoice.gatewayOrderId = orderId;
      invoice.gatewayPaymentId = paymentId;
      invoice.paidAt = new Date();

      const existingNotes = invoice.notes?.trim();

      invoice.notes = existingNotes
        ? `${existingNotes} Payment confirmed by Razorpay webhook.`
        : "Payment confirmed by Razorpay webhook.";

      await invoice.save();

      return NextResponse.json({
        success: true,
        message: "Payment captured and invoice updated.",
      });
    }

    /*
     * -------------------------------------------------------
     * PAYMENT FAILED
     * -------------------------------------------------------
     */
    if (event === "payment.failed") {
      const payment = payload?.payload?.payment?.entity;

      const orderId = payment?.order_id;
      const paymentId = payment?.id;

      if (!orderId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment order ID is missing.",
          },
          { status: 400 }
        );
      }

      const invoice = await SubscriptionInvoice.findOne({
        gatewayOrderId: orderId,
      });

      if (!invoice) {
        console.warn(
          `No invoice found for failed Razorpay order ${orderId}`
        );

        return NextResponse.json({
          success: true,
          message: "No matching invoice found.",
        });
      }

      /*
       * Never change a successfully paid invoice back to FAILED.
       */
      if (invoice.status === "PAID") {
        return NextResponse.json({
          success: true,
          message:
            "Invoice is already paid. Failed event ignored.",
        });
      }

      invoice.status = "FAILED";
      invoice.paymentGateway = "RAZORPAY";
      invoice.gatewayOrderId = orderId;

      if (paymentId) {
        invoice.gatewayPaymentId = paymentId;
      }

      const existingNotes = invoice.notes?.trim();

      const failureReason =
        payment?.error_description ||
        payment?.error_reason ||
        "Razorpay payment failed.";

      invoice.notes = existingNotes
        ? `${existingNotes} ${failureReason}`
        : failureReason;

      await invoice.save();

      return NextResponse.json({
        success: true,
        message: "Failed payment recorded.",
      });
    }

    /*
     * -------------------------------------------------------
     * OTHER EVENTS
     * -------------------------------------------------------
     *
     * We don't need to process every Razorpay event right now.
     */
    return NextResponse.json({
      success: true,
      message: `Webhook event ${event} received.`,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}