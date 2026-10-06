import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantSubscription from "@/models/restaurant-subscription";
import SubscriptionInvoice from "@/models/subscription-invoice";
import SubscriptionPlan from "@/models/subscription-plan";
import Restaurant from "@/models/restaurant";

async function requireSuperAdmin() {
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
    response: null,
  };
}

function generateInvoiceNumber() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);

  return `RST-${year}${month}-${random}`;
}

/**
 * POST
 *
 * Process subscriptions whose endDate has passed.
 *
 * AUTO RENEW:
 * - Extend subscription
 * - Keep subscription ACTIVE
 * - Create a new PENDING invoice
 *
 * NO AUTO RENEW:
 * - Mark subscription EXPIRED
 */
export async function POST() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const now = new Date();

    const expiredSubscriptions =
      await RestaurantSubscription.find({
        status: {
          $in: ["ACTIVE", "TRIAL"],
        },
        endDate: {
          $lte: now,
        },
      });

    let renewedCount = 0;
    let expiredCount = 0;
    let failedCount = 0;

    const results: Array<{
      subscriptionId: string;
      restaurantId: string;
      action: "RENEWED" | "EXPIRED" | "FAILED";
      invoiceId?: string;
      message?: string;
    }> = [];

    for (const subscription of expiredSubscriptions) {
      const session =
        await RestaurantSubscription.db.startSession();

      try {
        await session.withTransaction(async () => {
          /*
           * AUTO RENEW DISABLED
           */
          if (!subscription.autoRenew) {
            await RestaurantSubscription.updateOne(
              {
                _id: subscription._id,
                status: {
                  $in: ["ACTIVE", "TRIAL"],
                },
                endDate: {
                  $lte: now,
                },
              },
              {
                $set: {
                  status: "EXPIRED",
                  autoRenew: false,
                },
              },
              { session }
            );

            expiredCount++;

            results.push({
              subscriptionId: subscription._id.toString(),
              restaurantId:
                subscription.restaurantId.toString(),
              action: "EXPIRED",
              message:
                "Subscription expired because auto-renewal is disabled.",
            });

            return;
          }

          /*
           * Find the plan.
           *
           * The subscription already contains a snapshot of
           * billingCycle and price, so we do not depend on
           * the current plan price for historical billing.
           */
          const plan = await SubscriptionPlan.findById(
            subscription.planId
          ).session(session);

          if (!plan) {
            throw new Error(
              "Subscription plan no longer exists."
            );
          }

          /*
           * The subscription's existing endDate becomes
           * the beginning of the new billing period.
           *
           * This prevents losing time if the renewal process
           * runs after the exact expiry time.
           */
          const newStartDate = new Date(
            subscription.endDate
          );

          const newEndDate = new Date(newStartDate);

          if (subscription.billingCycle === "MONTHLY") {
            newEndDate.setMonth(
              newEndDate.getMonth() + 1
            );
          } else {
            newEndDate.setFullYear(
              newEndDate.getFullYear() + 1
            );
          }

          /*
           * Renew subscription.
           *
           * Keep the historical subscription price and
           * billing cycle snapshot.
           */
          const updateResult =
            await RestaurantSubscription.updateOne(
              {
                _id: subscription._id,
                status: {
                  $in: ["ACTIVE", "TRIAL"],
                },
                endDate: {
                  $lte: now,
                },
              },
              {
                $set: {
                  status: "ACTIVE",
                  startDate: newStartDate,
                  endDate: newEndDate,
                },
              },
              { session }
            );

          /*
           * If another process already renewed this
           * subscription, do not create another invoice.
           */
          if (updateResult.modifiedCount !== 1) {
            return;
          }

          /*
           * Create the renewal invoice.
           */
          const invoices =
            await SubscriptionInvoice.create(
              [
                {
                  restaurantId:
                    subscription.restaurantId,

                  subscriptionId:
                    subscription._id,

                  invoiceNumber:
                    generateInvoiceNumber(),

                  amount: subscription.price,

                  currency: "INR",

                  status: "PENDING",

                  issueDate: newStartDate,

                  dueDate: newStartDate,

                  notes:
                    "Subscription renewal invoice.",
                },
              ],
              { session }
            );

          const invoice = invoices[0];

          if (!invoice) {
            throw new Error(
              "Failed to create renewal invoice."
            );
          }

          renewedCount++;

          results.push({
            subscriptionId:
              subscription._id.toString(),

            restaurantId:
              subscription.restaurantId.toString(),

            action: "RENEWED",

            invoiceId: invoice._id.toString(),

            message:
              "Subscription renewed and new invoice created.",
          });
        });
      } catch (error) {
        failedCount++;

        results.push({
          subscriptionId:
            subscription._id.toString(),

          restaurantId:
            subscription.restaurantId.toString(),

          action: "FAILED",

          message:
            error instanceof Error
              ? error.message
              : "Failed to process subscription.",
        });
      } finally {
        await session.endSession();
      }
    }

    return NextResponse.json({
      success: true,

      message:
        "Subscription renewal processing completed.",

      processedCount: expiredSubscriptions.length,

      renewedCount,

      expiredCount,

      failedCount,

      results,
    });
  } catch (error) {
    console.error(
      "Process subscription renewals error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process subscription renewals.",
      },
      { status: 500 }
    );
  }
}