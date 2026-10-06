import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import SubscriptionInvoice from "@/models/subscription-invoice";
import Subscription from "@/models/restaurant-subscription";
import Restaurant from "@/models/restaurant";

export async function GET() {
  try {
    await connectDB();

    const [invoices, subscriptions, restaurants] = await Promise.all([
      SubscriptionInvoice.find({})
        .sort({ createdAt: -1 })
        .lean(),

      Subscription.find({})
        .sort({ createdAt: -1 })
        .lean(),

      Restaurant.find({})
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // -----------------------------------------
    // PAYMENT STATUS
    // -----------------------------------------

    const successfulInvoices = invoices.filter(
      (invoice: any) =>
        invoice.status === "paid" ||
        invoice.status === "success" ||
        invoice.paymentStatus === "paid" ||
        invoice.paymentStatus === "success"
    );

    const failedInvoices = invoices.filter(
      (invoice: any) =>
        invoice.status === "failed" ||
        invoice.paymentStatus === "failed"
    );

    const pendingInvoices = invoices.filter(
      (invoice: any) =>
        invoice.status === "pending" ||
        invoice.paymentStatus === "pending"
    );

    // -----------------------------------------
    // AMOUNT HELPER
    // -----------------------------------------

    function getAmount(invoice: any): number {
      return Number(
        invoice.amount ??
          invoice.totalAmount ??
          invoice.paidAmount ??
          invoice.price ??
          0
      );
    }

    // -----------------------------------------
    // REVENUE
    // -----------------------------------------

    const totalRevenue = successfulInvoices.reduce(
      (total: number, invoice: any) =>
        total + getAmount(invoice),
      0
    );

    const successfulAmount = successfulInvoices.reduce(
      (total: number, invoice: any) =>
        total + getAmount(invoice),
      0
    );

    const failedAmount = failedInvoices.reduce(
      (total: number, invoice: any) =>
        total + getAmount(invoice),
      0
    );

    // -----------------------------------------
    // SUBSCRIPTIONS
    // -----------------------------------------

    const activeSubscriptions = subscriptions.filter(
      (subscription: any) => {
        const status = String(
          subscription.status || ""
        ).toLowerCase();

        return (
          status === "active" ||
          status === "trialing"
        );
      }
    );

    const expiredSubscriptions = subscriptions.filter(
      (subscription: any) => {
        const status = String(
          subscription.status || ""
        ).toLowerCase();

        return (
          status === "expired" ||
          status === "cancelled" ||
          status === "canceled"
        );
      }
    );

    const pendingSubscriptions = subscriptions.filter(
      (subscription: any) => {
        const status = String(
          subscription.status || ""
        ).toLowerCase();

        return (
          status === "pending" ||
          status === "inactive"
        );
      }
    );

    // -----------------------------------------
    // MONTHLY REVENUE - LAST 12 MONTHS
    // -----------------------------------------

    const monthlyRevenue = Array.from(
      { length: 12 },
      (_, index) => {
        const date = new Date();

        date.setMonth(
          date.getMonth() - (11 - index)
        );

        const year = date.getFullYear();
        const month = date.getMonth();

        const revenue = successfulInvoices
          .filter((invoice: any) => {
            if (!invoice.createdAt) {
              return false;
            }

            const invoiceDate = new Date(
              invoice.createdAt
            );

            return (
              invoiceDate.getFullYear() === year &&
              invoiceDate.getMonth() === month
            );
          })
          .reduce(
            (total: number, invoice: any) =>
              total + getAmount(invoice),
            0
          );

        return {
          month: date.toLocaleString("en-IN", {
            month: "short",
          }),
          year,
          revenue,
        };
      }
    );

    // -----------------------------------------
    // PAYMENT STATUS CHART
    // -----------------------------------------

    const paymentStatus = {
      paid: successfulInvoices.length,
      failed: failedInvoices.length,
      pending: pendingInvoices.length,
    };

    // -----------------------------------------
    // PLAN DISTRIBUTION
    // -----------------------------------------

    const planMap: Record<string, number> = {};

    subscriptions.forEach((subscription: any) => {
      const plan =
        subscription.planName ||
        subscription.plan ||
        subscription.name ||
        subscription.subscriptionPlan ||
        "Unknown";

      planMap[plan] =
        (planMap[plan] || 0) + 1;
    });

    const planDistribution = Object.entries(
      planMap
    ).map(([plan, count]) => ({
      plan,
      count,
    }));

    // -----------------------------------------
    // RECENT PAYMENTS
    // -----------------------------------------

    const recentPayments = successfulInvoices
      .slice(0, 10)
      .map((invoice: any) => ({
        id: String(invoice._id),

        invoiceNumber:
          invoice.invoiceNumber ||
          invoice.invoiceId ||
          String(invoice._id),

        amount: getAmount(invoice),

        status:
          invoice.status ||
          invoice.paymentStatus ||
          "paid",

        createdAt: invoice.createdAt,

        restaurantName:
          invoice.restaurantName ||
          invoice.restaurant?.name ||
          invoice.businessName ||
          "—",

        plan:
          invoice.planName ||
          invoice.plan ||
          "—",
      }));

    // -----------------------------------------
    // PAYMENT SUCCESS RATE
    // -----------------------------------------

    const totalPaymentAttempts =
      successfulInvoices.length +
      failedInvoices.length;

    const paymentSuccessRate =
      totalPaymentAttempts === 0
        ? 0
        : Number(
            (
              (successfulInvoices.length /
                totalPaymentAttempts) *
              100
            ).toFixed(1)
          );

    // -----------------------------------------
    // RESTAURANT STATISTICS
    // -----------------------------------------

    const totalRestaurants =
      restaurants.length;

    const activeRestaurants =
      restaurants.filter((restaurant: any) => {
        const status = String(
          restaurant.status || ""
        ).toLowerCase();

        return (
          status === "active" ||
          status === "approved"
        );
      }).length;

    const pendingRestaurants =
      restaurants.filter((restaurant: any) => {
        const status = String(
          restaurant.status || ""
        ).toLowerCase();

        return (
          status === "pending" ||
          status === "pending_approval"
        );
      }).length;

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return NextResponse.json({
      success: true,

      overview: {
        totalRevenue,

        successfulAmount,

        failedAmount,

        totalPayments:
          invoices.length,

        successfulPayments:
          successfulInvoices.length,

        failedPayments:
          failedInvoices.length,

        pendingPayments:
          pendingInvoices.length,

        paymentSuccessRate,

        totalSubscriptions:
          subscriptions.length,

        activeSubscriptions:
          activeSubscriptions.length,

        expiredSubscriptions:
          expiredSubscriptions.length,

        pendingSubscriptions:
          pendingSubscriptions.length,

        totalRestaurants,

        activeRestaurants,

        pendingRestaurants,
      },

      monthlyRevenue,

      paymentStatus,

      planDistribution,

      recentPayments,
    });
  } catch (error) {
    console.error(
      "GET /api/super-admin/analytics error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load analytics",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}