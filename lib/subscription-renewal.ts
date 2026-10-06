import RestaurantSubscription from "@/models/restaurant-subscription";
import SubscriptionInvoice from "@/models/subscription-invoice";
import SubscriptionPlan from "@/models/subscription-plan";

export interface SubscriptionProcessingResult {
  subscriptionId: string;
  restaurantId: string;
  action: "RENEWED" | "EXPIRED" | "SKIPPED" | "FAILED";
  invoiceId?: string;
  message?: string;
}

function generateInvoiceNumber() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);

  return `RST-${year}${month}-${random}`;
}

/**
 * Process all subscriptions whose endDate has passed.
 *
 * Rules:
 *
 * 1. ACTIVE/TRIAL + autoRenew false
 *    -> EXPIRED
 *
 * 2. ACTIVE/TRIAL + autoRenew true
 *    -> Renew subscription
 *    -> Create PENDING invoice
 *
 * 3. Subscription that was already processed
 *    -> SKIPPED
 */
export async function processExpiredSubscriptions(
  now = new Date()
): Promise<{
  processedCount: number;
  renewedCount: number;
  expiredCount: number;
  skippedCount: number;
  failedCount: number;
  results: SubscriptionProcessingResult[];
}> {
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
  let skippedCount = 0;
  let failedCount = 0;

  const results: SubscriptionProcessingResult[] = [];

  for (const subscription of expiredSubscriptions) {
    const session =
      await RestaurantSubscription.db.startSession();

    try {
      await session.withTransaction(async () => {
        /*
         * AUTO RENEW DISABLED
         */
        if (!subscription.autoRenew) {
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
                  status: "EXPIRED",
                  autoRenew: false,
                },
              },
              { session }
            );

          if (updateResult.modifiedCount !== 1) {
            skippedCount++;

            results.push({
              subscriptionId:
                subscription._id.toString(),

              restaurantId:
                subscription.restaurantId.toString(),

              action: "SKIPPED",

              message:
                "Subscription was already processed.",
            });

            return;
          }

          expiredCount++;

          results.push({
            subscriptionId:
              subscription._id.toString(),

            restaurantId:
              subscription.restaurantId.toString(),

            action: "EXPIRED",

            message:
              "Subscription expired because auto-renewal is disabled.",
          });

          return;
        }

        /*
         * Find the original subscription plan.
         *
         * We use the subscription's stored price and
         * billing cycle for the renewal itself.
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
         * The old endDate becomes the new startDate.
         *
         * This prevents losing billing time if the processor
         * runs after the exact expiration moment.
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
         * Atomically renew the subscription.
         *
         * The conditions protect against two workers
         * processing the same subscription simultaneously.
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
              autoRenew: true,
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
         * Another worker may have already renewed it.
         */
        if (updateResult.modifiedCount !== 1) {
          skippedCount++;

          results.push({
            subscriptionId:
              subscription._id.toString(),

            restaurantId:
              subscription.restaurantId.toString(),

            action: "SKIPPED",

            message:
              "Subscription was already processed by another request.",
          });

          return;
        }

        /*
         * Create the renewal invoice.
         *
         * IMPORTANT:
         *
         * The amount comes from subscription.price,
         * not plan.price.
         *
         * This preserves the historical subscription price.
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

          invoiceId:
            invoice._id.toString(),

          message:
            "Subscription renewed and renewal invoice created.",
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

  return {
    processedCount: expiredSubscriptions.length,

    renewedCount,

    expiredCount,

    skippedCount,

    failedCount,

    results,
  };
}