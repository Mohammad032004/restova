"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  Store,
  Users,
  XCircle,
} from "lucide-react";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED"
  | string;

interface Restaurant {
  _id: string;
  name: string;
  createdAt?: string;
}

interface PaymentInvoice {
  _id: string;
  invoiceNumber?: string;
  amount?: number;
  totalAmount?: number;
  currency?: string;
  status: PaymentStatus;
  issueDate?: string;
  paidAt?: string;
  createdAt?: string;
  restaurantId?: Restaurant;
  restaurant?: {
    _id?: string;
    name?: string;
  };
  planName?: string;
  plan?: string;
}

interface Subscription {
  _id: string;
  status?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
  planId?: {
    _id?: string;
    name?: string;
    price?: number;
  };
  planName?: string;
  plan?: string;
  restaurantId?: {
    _id?: string;
    name?: string;
  };
}

interface AnalyticsOverview {
  totalRevenue: number;
  successfulAmount: number;
  failedAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  paymentSuccessRate: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  pendingSubscriptions: number;
}

interface AnalyticsData {
  payments: PaymentInvoice[];
  subscriptions: Subscription[];
  restaurants: Restaurant[];

  overview: AnalyticsOverview;

  monthlyRevenue: {
    month: string;
    year: number;
    revenue: number;
  }[];

  paymentStatus: {
    paid: number;
    failed: number;
    pending: number;
  };

  backendPlanDistribution: {
    plan: string;
    count: number;
  }[];

  backendRecentPayments: {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    createdAt?: string;
    restaurantName?: string;
    plan?: string;
  }[];
}

type Period = "7D" | "30D" | "90D" | "1Y";

const EMPTY_OVERVIEW: AnalyticsOverview = {
  totalRevenue: 0,
  successfulAmount: 0,
  failedAmount: 0,
  totalPayments: 0,
  successfulPayments: 0,
  failedPayments: 0,
  pendingPayments: 0,
  paymentSuccessRate: 0,
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  pendingSubscriptions: 0,
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function isWithinPeriod(
  date: string | undefined,
  period: Period
) {
  if (!date) return false;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const days =
    period === "7D"
      ? 7
      : period === "30D"
        ? 30
        : period === "90D"
          ? 90
          : 365;

  return parsed >= getDaysAgo(days);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "short",
  });
}

function getPaymentDate(payment: PaymentInvoice) {
  return (
    payment.paidAt ||
    payment.issueDate ||
    payment.createdAt
  );
}

function getPaymentAmount(payment: PaymentInvoice) {
  return Number(
    payment.amount ??
      payment.totalAmount ??
      0
  );
}

function normalizeStatus(status?: string) {
  return String(status || "").toUpperCase();
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    payments: [],
    subscriptions: [],
    restaurants: [],
    overview: EMPTY_OVERVIEW,
    monthlyRevenue: [],
    paymentStatus: {
      paid: 0,
      failed: 0,
      pending: 0,
    },
    backendPlanDistribution: [],
    backendRecentPayments: [],
  });

  const [period, setPeriod] =
    useState<Period>("30D");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchAnalytics(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        analyticsResponse,
        paymentsResponse,
        subscriptionsResponse,
        restaurantsResponse,
      ] = await Promise.all([
        fetch("/api/super-admin/analytics", {
          cache: "no-store",
        }),

        fetch(
          "/api/super-admin/subscription-invoices",
          {
            cache: "no-store",
          }
        ),

        fetch("/api/super-admin/subscriptions", {
          cache: "no-store",
        }),

        fetch("/api/super-admin/restaurants", {
          cache: "no-store",
        }),
      ]);

      const analyticsJson =
        analyticsResponse.ok
          ? await analyticsResponse.json()
          : {};

      const paymentsJson =
        paymentsResponse.ok
          ? await paymentsResponse.json()
          : {};

      const subscriptionsJson =
        subscriptionsResponse.ok
          ? await subscriptionsResponse.json()
          : {};

      const restaurantsJson =
        restaurantsResponse.ok
          ? await restaurantsResponse.json()
          : {};

      const payments = Array.isArray(
        paymentsJson
      )
        ? paymentsJson
        : Array.isArray(
              paymentsJson?.invoices
            )
          ? paymentsJson.invoices
          : Array.isArray(
                paymentsJson?.data
              )
            ? paymentsJson.data
            : [];

      const subscriptions =
        Array.isArray(subscriptionsJson)
          ? subscriptionsJson
          : Array.isArray(
                subscriptionsJson?.subscriptions
              )
            ? subscriptionsJson.subscriptions
            : Array.isArray(
                  subscriptionsJson?.data
                )
              ? subscriptionsJson.data
              : [];

      const restaurants = Array.isArray(
        restaurantsJson
      )
        ? restaurantsJson
        : Array.isArray(
              restaurantsJson?.restaurants
            )
          ? restaurantsJson.restaurants
          : Array.isArray(
                restaurantsJson?.data
              )
            ? restaurantsJson.data
            : [];

      if (
        !analyticsResponse.ok &&
        !paymentsResponse.ok &&
        !subscriptionsResponse.ok &&
        !restaurantsResponse.ok
      ) {
        throw new Error(
          "Unable to load analytics data."
        );
      }

      setData({
        payments,
        subscriptions,
        restaurants,

        overview:
          analyticsJson?.overview ||
          EMPTY_OVERVIEW,

        monthlyRevenue:
          Array.isArray(
            analyticsJson?.monthlyRevenue
          )
            ? analyticsJson.monthlyRevenue
            : [],

        paymentStatus:
          analyticsJson?.paymentStatus || {
            paid: 0,
            failed: 0,
            pending: 0,
          },

        backendPlanDistribution:
          Array.isArray(
            analyticsJson?.planDistribution
          )
            ? analyticsJson.planDistribution
            : [],

        backendRecentPayments:
          Array.isArray(
            analyticsJson?.recentPayments
          )
            ? analyticsJson.recentPayments
            : [],
      });
    } catch (err) {
      console.error(
        "Analytics error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const analytics = useMemo(() => {
    const filteredPayments =
      data.payments.filter((payment) =>
        isWithinPeriod(
          getPaymentDate(payment),
          period
        )
      );

    const filteredSubscriptions =
      data.subscriptions.filter(
        (subscription) =>
          isWithinPeriod(
            subscription.createdAt ||
              subscription.startDate,
            period
          )
      );

    const filteredRestaurants =
      data.restaurants.filter((restaurant) =>
        isWithinPeriod(
          restaurant.createdAt,
          period
        )
      );

    const paidPayments =
      filteredPayments.filter(
        (payment) =>
          normalizeStatus(payment.status) ===
          "PAID"
      );

    const failedPayments =
      filteredPayments.filter(
        (payment) =>
          normalizeStatus(payment.status) ===
          "FAILED"
      );

    const pendingPayments =
      filteredPayments.filter(
        (payment) =>
          normalizeStatus(payment.status) ===
          "PENDING"
      );

    const refundedPayments =
      filteredPayments.filter(
        (payment) =>
          normalizeStatus(payment.status) ===
          "REFUNDED"
      );

    const cancelledPayments =
      filteredPayments.filter(
        (payment) =>
          normalizeStatus(payment.status) ===
          "CANCELLED"
      );

    const revenue =
      paidPayments.reduce(
        (sum, payment) =>
          sum + getPaymentAmount(payment),
        0
      );

    const refundedAmount =
      refundedPayments.reduce(
        (sum, payment) =>
          sum + getPaymentAmount(payment),
        0
      );

    const pendingAmount =
      pendingPayments.reduce(
        (sum, payment) =>
          sum + getPaymentAmount(payment),
        0
      );

    const failedAmount =
      failedPayments.reduce(
        (sum, payment) =>
          sum + getPaymentAmount(payment),
        0
      );

    const totalTransactions =
      filteredPayments.length;

    const successRate =
      totalTransactions > 0
        ? Math.round(
            (paidPayments.length /
              totalTransactions) *
              100
          )
        : 0;

    const activeSubscriptions =
      data.subscriptions.filter(
        (subscription) => {
          const status =
            normalizeStatus(
              subscription.status
            );

          return (
            status === "ACTIVE" ||
            status === "TRIAL" ||
            status === "TRIALING"
          );
        }
      ).length;

    const expiredSubscriptions =
      data.subscriptions.filter(
        (subscription) =>
          normalizeStatus(
            subscription.status
          ) === "EXPIRED"
      ).length;

    const cancelledSubscriptions =
      data.subscriptions.filter(
        (subscription) => {
          const status =
            normalizeStatus(
              subscription.status
            );

          return (
            status === "CANCELLED" ||
            status === "CANCELED"
          );
        }
      ).length;

    const pendingSubscriptions =
      data.subscriptions.filter(
        (subscription) => {
          const status =
            normalizeStatus(
              subscription.status
            );

          return (
            status === "PENDING" ||
            status === "INACTIVE"
          );
        }
      ).length;

    return {
      filteredPayments,
      filteredSubscriptions,
      filteredRestaurants,

      paidPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      cancelledPayments,

      revenue,
      refundedAmount,
      pendingAmount,
      failedAmount,

      totalTransactions,
      successRate,

      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      pendingSubscriptions,
    };
  }, [data, period]);

  const monthlyRevenue =
    useMemo(() => {
      const months: {
        key: string;
        label: string;
        revenue: number;
      }[] = [];

      const now = new Date();

      for (
        let index = 5;
        index >= 0;
        index--
      ) {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - index,
          1
        );

        const key = getMonthKey(date);

        const revenue =
          data.payments
            .filter((payment) => {
              if (
                normalizeStatus(
                  payment.status
                ) !== "PAID"
              ) {
                return false;
              }

              const paymentDate =
                new Date(
                  getPaymentDate(
                    payment
                  ) || ""
                );

              return (
                !Number.isNaN(
                  paymentDate.getTime()
                ) &&
                getMonthKey(
                  paymentDate
                ) === key
              );
            })
            .reduce(
              (sum, payment) =>
                sum +
                getPaymentAmount(payment),
              0
            );

        months.push({
          key,
          label: getMonthLabel(date),
          revenue,
        });
      }

      return months;
    }, [data.payments]);

  const monthlySubscriptions =
    useMemo(() => {
      const months: {
        key: string;
        label: string;
        count: number;
      }[] = [];

      const now = new Date();

      for (
        let index = 5;
        index >= 0;
        index--
      ) {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - index,
          1
        );

        const key = getMonthKey(date);

        const count =
          data.subscriptions.filter(
            (subscription) => {
              const subscriptionDate =
                new Date(
                  subscription.createdAt ||
                    subscription.startDate ||
                    ""
                );

              return (
                !Number.isNaN(
                  subscriptionDate.getTime()
                ) &&
                getMonthKey(
                  subscriptionDate
                ) === key
              );
            }
          ).length;

        months.push({
          key,
          label: getMonthLabel(date),
          count,
        });
      }

      return months;
    }, [data.subscriptions]);

  const maxRevenue = Math.max(
    ...monthlyRevenue.map(
      (item) => item.revenue
    ),
    1
  );

  const maxSubscriptions = Math.max(
    ...monthlySubscriptions.map(
      (item) => item.count
    ),
    1
  );

  const planDistribution = useMemo(() => {
    const map = new Map<
      string,
      number
    >();

    data.subscriptions.forEach(
      (subscription) => {
        const planName =
          subscription.planId?.name ||
          subscription.planName ||
          subscription.plan ||
          "Unknown Plan";

        map.set(
          planName,
          (map.get(planName) || 0) + 1
        );
      }
    );

    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort(
        (a, b) => b.count - a.count
      )
      .slice(0, 5);
  }, [data.subscriptions]);

  const recentPayments = useMemo(() => {
    return [...data.payments]
      .sort((a, b) => {
        const dateA = new Date(
          getPaymentDate(a) || ""
        ).getTime();

        const dateB = new Date(
          getPaymentDate(b) || ""
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [data.payments]);

  const totalSubscriptions =
    data.subscriptions.length;

  const subscriptionStatusTotal =
    Math.max(
      totalSubscriptions,
      1
    );

  const paymentHealthTotal =
    analytics.paidPayments.length +
    analytics.failedPayments.length +
    analytics.pendingPayments.length;

  return (
    <div className="min-h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="px-7 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                <BarChart3 size={14} />
                Super Admin
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Analytics
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor Restova platform
                growth, revenue and
                subscriptions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                {(
                  [
                    "7D",
                    "30D",
                    "90D",
                    "1Y",
                  ] as Period[]
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setPeriod(item)
                    }
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      period === item
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  fetchAnalytics(true)
                }
                disabled={refreshing}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-7">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5"
            />

            <div>
              <p className="font-semibold">
                Analytics data warning
              </p>

              <p className="mt-1 text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={30}
                className="animate-spin text-slate-400"
              />

              <p className="text-sm text-slate-500">
                Loading analytics...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Revenue"
                value={formatAmount(
                  analytics.revenue
                )}
                subtitle="Successful payments"
                icon={
                  <CreditCard size={19} />
                }
                iconClass="bg-emerald-50 text-emerald-600"
                subtitleClass="text-emerald-600"
              />

              <StatCard
                title="Transactions"
                value={
                  analytics.totalTransactions
                }
                subtitle={`${analytics.successRate}% success rate`}
                icon={
                  <Activity size={19} />
                }
                iconClass="bg-blue-50 text-blue-600"
                subtitleClass="text-blue-600"
              />

              <StatCard
                title="New Subscriptions"
                value={
                  analytics
                    .filteredSubscriptions
                    .length
                }
                subtitle="During selected period"
                icon={
                  <Users size={19} />
                }
                iconClass="bg-violet-50 text-violet-600"
                subtitleClass="text-violet-600"
              />

              <StatCard
                title="New Restaurants"
                value={
                  analytics
                    .filteredRestaurants
                    .length
                }
                subtitle="During selected period"
                icon={
                  <Store size={19} />
                }
                iconClass="bg-orange-50 text-orange-600"
                subtitleClass="text-orange-600"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SmallStat
                title="Paid"
                value={
                  analytics.paidPayments
                    .length
                }
                icon={
                  <CheckCircle2 size={17} />
                }
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <SmallStat
                title="Pending"
                value={
                  analytics.pendingPayments
                    .length
                }
                icon={
                  <Clock3 size={17} />
                }
                iconClass="bg-amber-50 text-amber-600"
              />

              <SmallStat
                title="Failed"
                value={
                  analytics.failedPayments
                    .length
                }
                icon={
                  <XCircle size={17} />
                }
                iconClass="bg-red-50 text-red-600"
              />

              <SmallStat
                title="Active Subscriptions"
                value={
                  analytics.activeSubscriptions
                }
                icon={
                  <Users size={17} />
                }
                iconClass="bg-blue-50 text-blue-600"
              />

              <SmallStat
                title="Total Restaurants"
                value={
                  data.restaurants.length
                }
                icon={
                  <Building2 size={17} />
                }
                iconClass="bg-slate-100 text-slate-600"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Revenue */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Revenue Overview
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Monthly successful
                      payment revenue
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <BarChart3 size={17} />
                  </div>
                </div>

                <div className="flex h-[250px] items-end gap-3 border-b border-l border-slate-200 px-3 pb-0">
                  {monthlyRevenue.map(
                    (item) => {
                      const height =
                        item.revenue === 0
                          ? 3
                          : Math.max(
                              8,
                              (item.revenue /
                                maxRevenue) *
                                100
                            );

                      return (
                        <div
                          key={item.key}
                          className="group flex h-full flex-1 flex-col justify-end"
                        >
                          <div className="relative flex flex-1 items-end justify-center">
                            <div
                              className="w-full max-w-[48px] rounded-t-md bg-slate-900 transition-all group-hover:bg-slate-700"
                              style={{
                                height: `${height}%`,
                              }}
                            >
                              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
                                {formatAmount(
                                  item.revenue
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="mt-3 pb-2 text-center text-[10px] text-slate-500">
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Subscriptions */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Subscription Growth
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      New subscriptions by
                      month
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Users size={17} />
                  </div>
                </div>

                <div className="flex h-[250px] items-end gap-3 border-b border-l border-slate-200 px-3 pb-0">
                  {monthlySubscriptions.map(
                    (item) => {
                      const height =
                        item.count === 0
                          ? 3
                          : Math.max(
                              8,
                              (item.count /
                                maxSubscriptions) *
                                100
                            );

                      return (
                        <div
                          key={item.key}
                          className="group flex h-full flex-1 flex-col justify-end"
                        >
                          <div className="relative flex flex-1 items-end justify-center">
                            <div
                              className="w-full max-w-[48px] rounded-t-md bg-violet-500 transition-all group-hover:bg-violet-600"
                              style={{
                                height: `${height}%`,
                              }}
                            >
                              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
                                {item.count}{" "}
                                subscription
                                {item.count !==
                                1
                                  ? "s"
                                  : ""}
                              </div>
                            </div>
                          </div>

                          <span className="mt-3 pb-2 text-center text-[10px] text-slate-500">
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Status / Plans / Payment Health */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Subscription Status */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Subscription Status
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current subscription
                  distribution
                </p>

                <div className="mt-6 space-y-5">
                  <ProgressRow
                    label="Active / Trial"
                    value={
                      analytics.activeSubscriptions
                    }
                    total={
                      subscriptionStatusTotal
                    }
                    className="bg-emerald-500"
                  />

                  <ProgressRow
                    label="Pending / Inactive"
                    value={
                      analytics.pendingSubscriptions
                    }
                    total={
                      subscriptionStatusTotal
                    }
                    className="bg-amber-500"
                  />

                  <ProgressRow
                    label="Expired"
                    value={
                      analytics.expiredSubscriptions
                    }
                    total={
                      subscriptionStatusTotal
                    }
                    className="bg-slate-400"
                  />

                  <ProgressRow
                    label="Cancelled"
                    value={
                      analytics.cancelledSubscriptions
                    }
                    total={
                      subscriptionStatusTotal
                    }
                    className="bg-red-400"
                  />
                </div>
              </div>

              {/* Popular Plans */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Popular Plans
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Subscription distribution
                    </p>
                  </div>

                  <Users
                    size={18}
                    className="text-violet-500"
                  />
                </div>

                <div className="mt-5 space-y-4">
                  {planDistribution.length ===
                  0 ? (
                    <EmptyState text="No subscription plan data available." />
                  ) : (
                    planDistribution.map(
                      (item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="truncate text-xs font-medium text-slate-700">
                              {item.name}
                            </span>

                            <span className="text-xs font-semibold text-slate-900">
                              {item.count}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.count /
                                    Math.max(
                                      1,
                                      totalSubscriptions
                                    )) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Payment Health */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Payment Health
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Payment status overview
                    </p>
                  </div>

                  <CreditCard
                    size={18}
                    className="text-emerald-500"
                  />
                </div>

                <div className="mt-6 space-y-5">
                  <ProgressRow
                    label="Paid"
                    value={
                      analytics.paidPayments
                        .length
                    }
                    total={
                      Math.max(
                        paymentHealthTotal,
                        1
                      )
                    }
                    className="bg-emerald-500"
                  />

                  <ProgressRow
                    label="Pending"
                    value={
                      analytics.pendingPayments
                        .length
                    }
                    total={
                      Math.max(
                        paymentHealthTotal,
                        1
                      )
                    }
                    className="bg-amber-500"
                  />

                  <ProgressRow
                    label="Failed"
                    value={
                      analytics.failedPayments
                        .length
                    }
                    total={
                      Math.max(
                        paymentHealthTotal,
                        1
                      )
                    }
                    className="bg-red-500"
                  />

                  <ProgressRow
                    label="Refunded"
                    value={
                      analytics.refundedPayments
                        .length
                    }
                    total={
                      Math.max(
                        analytics.totalTransactions,
                        1
                      )
                    }
                    className="bg-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                title="Pending Amount"
                value={formatAmount(
                  analytics.pendingAmount
                )}
                description="Awaiting successful payment"
                icon={
                  <Clock3 size={18} />
                }
                className="text-amber-600 bg-amber-50"
              />

              <SummaryCard
                title="Refunded Amount"
                value={formatAmount(
                  analytics.refundedAmount
                )}
                description="Refunded transactions"
                icon={
                  <ArrowDownRight size={18} />
                }
                className="text-slate-600 bg-slate-100"
              />

              <SummaryCard
                title="Failed Amount"
                value={formatAmount(
                  analytics.failedAmount
                )}
                description="Failed payment attempts"
                icon={
                  <XCircle size={18} />
                }
                className="text-red-600 bg-red-50"
              />
            </div>

            {/* Recent Payments */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent Payments
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest payment activity
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity size={14} />
                  {data.payments.length} total
                  payments
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                        Invoice
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                        Restaurant
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                        Plan
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentPayments.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center"
                        >
                          <EmptyState text="No payment records available." />
                        </td>
                      </tr>
                    ) : (
                      recentPayments.map(
                        (payment) => {
                          const status =
                            normalizeStatus(
                              payment.status
                            );

                          const restaurantName =
                            payment
                              .restaurantId
                              ?.name ||
                            payment.restaurant
                              ?.name ||
                            "—";

                          const planName =
                            payment.planName ||
                            payment.plan ||
                            "—";

                          return (
                            <tr
                              key={
                                payment._id
                              }
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                            >
                              <td className="px-5 py-4">
                                <span className="text-xs font-semibold text-slate-900">
                                  {payment.invoiceNumber ||
                                    "—"}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <span className="text-xs text-slate-700">
                                  {
                                    restaurantName
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <span className="text-xs text-slate-600">
                                  {
                                    planName
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <span className="text-xs font-semibold text-slate-900">
                                  {formatAmount(
                                    getPaymentAmount(
                                      payment
                                    )
                                  )}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge
                                  status={
                                    status
                                  }
                                />
                              </td>

                              <td className="px-5 py-4">
                                <span className="text-xs text-slate-500">
                                  {formatDate(
                                    getPaymentDate(
                                      payment
                                    )
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Activity */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Platform Activity
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Current Restova platform
                    totals
                  </p>
                </div>

                <Activity
                  size={18}
                  className="text-slate-500"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                <ActivityItem
                  label="Restaurants"
                  value={
                    data.restaurants.length
                  }
                  icon={
                    <Store size={16} />
                  }
                />

                <ActivityItem
                  label="Subscriptions"
                  value={
                    data.subscriptions
                      .length
                  }
                  icon={
                    <Users size={16} />
                  }
                />

                <ActivityItem
                  label="Payments"
                  value={
                    data.payments.length
                  }
                  icon={
                    <CreditCard size={16} />
                  }
                />

                <ActivityItem
                  label="Success Rate"
                  value={`${analytics.successRate}%`}
                  icon={
                    <CheckCircle2
                      size={16}
                    />
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable UI Components                                                     */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
  subtitleClass,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
  subtitleClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <div
            className={`mt-2 flex items-center gap-1 text-xs ${subtitleClass}`}
          >
            <ArrowUpRight size={13} />
            {subtitle}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {title}
          </p>

          <p className="text-lg font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          (value / total) * 100
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-600">
          {label}
        </span>

        <span className="text-xs font-semibold text-slate-900">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${className}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  className,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${className}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  const config =
    normalized === "PAID"
      ? {
          label: "Paid",
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        }
      : normalized === "PENDING"
        ? {
            label: "Pending",
            className:
              "bg-amber-50 text-amber-700 border-amber-200",
          }
        : normalized === "FAILED"
          ? {
              label: "Failed",
              className:
                "bg-red-50 text-red-700 border-red-200",
            }
          : normalized === "REFUNDED"
            ? {
                label: "Refunded",
                className:
                  "bg-slate-100 text-slate-700 border-slate-200",
              }
            : normalized ===
                "CANCELLED"
              ? {
                  label: "Cancelled",
                  className:
                    "bg-orange-50 text-orange-700 border-orange-200",
                }
              : {
                  label:
                    status || "Unknown",
                  className:
                    "bg-slate-100 text-slate-600 border-slate-200",
                };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <BarChart3
        size={24}
        className="text-slate-300"
      />

      <p className="mt-2 text-xs text-slate-500">
        {text}
      </p>
    </div>
  );
}