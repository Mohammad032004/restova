"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";

type Summary = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  pendingPayments: number;
  refundedPayments: number;
  revenue: number;
  refundedAmount: number;
  averageOrderValue: number;
};

type DailyTrend = {
  date: string;
  orders: number;
  revenue: number;
};

type PaymentMethod = {
  method: string;
  orders: number;
  amount: number;
};

type OrderType = {
  type: string;
  orders: number;
  revenue: number;
};

type TopItem = {
  name: string;
  quantity: number;
  revenue: number;
};

type PeakHour = {
  hour: number;
  orders: number;
  revenue: number;
};

type AnalyticsResponse = {
  success: boolean;
  range: {
    start: string;
    end: string;
  };
  summary: Summary;
  dailyTrend: DailyTrend[];
  paymentMethods: PaymentMethod[];
  orderTypes: OrderType[];
  topItems: TopItem[];
  peakHours: PeakHour[];
  message?: string;
};

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  if (!date) return "-";

  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;

  return `${normalized} ${suffix}`;
}

function formatPaymentMethod(method: string) {
  if (!method) return "Unknown";

  return method
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatOrderType(type: string) {
  return type === "DINE_IN" ? "Dine In" : "Takeaway";
}

export default function RestaurantAnalyticsPage() {
  const today = useMemo(() => getToday(), []);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalytics(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(
        `/api/restaurant/analytics?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load analytics.");
      }

      setData(result);
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load restaurant analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const maxDailyRevenue = useMemo(() => {
    if (!data?.dailyTrend?.length) return 1;

    return Math.max(
      ...data.dailyTrend.map((item) => Number(item.revenue || 0)),
      1
    );
  }, [data]);

  const maxPeakOrders = useMemo(() => {
    if (!data?.peakHours?.length) return 1;

    return Math.max(
      ...data.peakHours.map((item) => Number(item.orders || 0)),
      1
    );
  }, [data]);

  const maxTopItemQuantity = useMemo(() => {
    if (!data?.topItems?.length) return 1;

    return Math.max(
      ...data.topItems.map((item) => Number(item.quantity || 0)),
      1
    );
  }, [data]);

  function handleApplyFilters() {
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    loadAnalytics();
  }

  function handleReset() {
    const currentDate = getToday();

    setStartDate(currentDate);
    setEndDate(currentDate);

    setTimeout(() => {
      loadAnalytics();
    }, 0);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">
            Loading restaurant analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-purple-600" />

            <h1 className="text-2xl font-bold text-gray-900">
              Analytics
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Understand your restaurant performance, sales and customer
            ordering patterns.
          </p>
        </div>

        <button
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Start Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              End Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <button
            onClick={handleApplyFilters}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Apply
          </button>

          <button
            onClick={handleReset}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {data?.range && (
          <p className="mt-3 text-xs text-gray-500">
            Showing analytics from{" "}
            <span className="font-medium text-gray-700">
              {formatDate(data.range.start)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-700">
              {formatDate(data.range.end)}
            </span>
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Revenue"
              value={formatCurrency(data.summary.revenue)}
              subtitle={`${data.summary.paidOrders} paid orders`}
              icon={IndianRupee}
            />

            <SummaryCard
              title="Total Orders"
              value={data.summary.totalOrders.toLocaleString("en-IN")}
              subtitle={`${data.summary.completedOrders} completed`}
              icon={ShoppingBag}
            />

            <SummaryCard
              title="Average Order Value"
              value={formatCurrency(data.summary.averageOrderValue)}
              subtitle="Per paid order"
              icon={TrendingUp}
            />

            <SummaryCard
              title="Pending Payments"
              value={data.summary.pendingPayments.toLocaleString("en-IN")}
              subtitle="Awaiting payment"
              icon={Clock3}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat
              title="Completed"
              value={data.summary.completedOrders}
              icon={CheckCircle2}
            />

            <MiniStat
              title="Cancelled"
              value={data.summary.cancelledOrders}
              icon={XCircle}
            />

            <MiniStat
              title="Refunded"
              value={data.summary.refundedPayments}
              icon={RefreshCw}
            />

            <MiniStat
              title="Refund Amount"
              value={formatCurrency(data.summary.refundedAmount)}
              icon={IndianRupee}
            />
          </div>

          {/* Revenue Trend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Revenue Trend
                </h2>

                <p className="text-sm text-gray-500">
                  Paid revenue and order volume by day
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Revenue
              </div>
            </div>

            {data.dailyTrend.length === 0 ? (
              <EmptyState text="No sales data available for this period." />
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="flex min-w-[600px] items-end gap-2"
                  style={{ height: 280 }}
                >
                  {data.dailyTrend.map((item) => {
                    const height =
                      item.revenue > 0
                        ? Math.max(
                            12,
                            (item.revenue / maxDailyRevenue) * 220
                          )
                        : 4;

                    return (
                      <div
                        key={item.date}
                        className="flex min-w-[45px] flex-1 flex-col items-center justify-end gap-2"
                      >
                        <div className="group relative flex w-full justify-center">
                          <div
                            className="w-full max-w-[42px] rounded-t-lg bg-purple-500 transition hover:bg-purple-600"
                            style={{
                              height: `${height}px`,
                            }}
                          />

                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            <div className="font-semibold">
                              {formatCurrency(item.revenue)}
                            </div>
                            <div className="text-gray-300">
                              {item.orders} orders
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-gray-500">
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Payment + Order Types */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Payment Methods */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Methods
                </h2>

                <p className="text-sm text-gray-500">
                  Paid orders by payment method
                </p>
              </div>

              {data.paymentMethods.length === 0 ? (
                <EmptyState text="No payment data available." />
              ) : (
                <div className="space-y-4">
                  {data.paymentMethods.map((item) => {
                    const totalPaid = data.summary.revenue || 1;
                    const percentage = Math.min(
                      100,
                      (item.amount / totalPaid) * 100
                    );

                    return (
                      <div key={item.method}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {formatPaymentMethod(item.method)}
                            </p>

                            <p className="text-xs text-gray-500">
                              {item.orders} orders
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Types */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Types
                </h2>

                <p className="text-sm text-gray-500">
                  Dine-in versus takeaway performance
                </p>
              </div>

              {data.orderTypes.length === 0 ? (
                <EmptyState text="No order type data available." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.orderTypes.map((item) => (
                    <div
                      key={item.type}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                          <UtensilsCrossed className="h-5 w-5 text-purple-600" />
                        </div>

                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                          {item.orders} orders
                        </span>
                      </div>

                      <p className="text-sm font-medium text-gray-500">
                        {formatOrderType(item.type)}
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Items */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Selling Items
              </h2>

              <p className="text-sm text-gray-500">
                Most ordered menu items during the selected period
              </p>
            </div>

            {data.topItems.length === 0 ? (
              <EmptyState text="No item sales data available." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        #
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Item
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Quantity
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Item Value
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Performance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.topItems.map((item, index) => {
                      const percentage =
                        (item.quantity / maxTopItemQuantity) * 100;

                      return (
                        <tr
                          key={`${item.name}-${index}`}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-3 py-4 text-sm font-semibold text-gray-400">
                            {index + 1}
                          </td>

                          <td className="px-3 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {item.name}
                            </p>
                          </td>

                          <td className="px-3 py-4 text-sm text-gray-700">
                            {item.quantity}
                          </td>

                          <td className="px-3 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(item.revenue)}
                          </td>

                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-purple-500"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>

                              <span className="text-xs text-gray-500">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Peak Hours */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Peak Hours
              </h2>

              <p className="text-sm text-gray-500">
                Order activity throughout the day
              </p>
            </div>

            {data.peakHours.length === 0 ? (
              <EmptyState text="No hourly order data available." />
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="flex min-w-[700px] items-end gap-2"
                  style={{ height: 260 }}
                >
                  {data.peakHours.map((item) => {
                    const height =
                      item.orders > 0
                        ? Math.max(
                            12,
                            (item.orders / maxPeakOrders) * 190
                          )
                        : 4;

                    return (
                      <div
                        key={item.hour}
                        className="group flex min-w-[35px] flex-1 flex-col items-center justify-end gap-2"
                      >
                        <div className="relative flex w-full justify-center">
                          <div
                            className="w-full max-w-[30px] rounded-t-md bg-indigo-500 transition hover:bg-indigo-600"
                            style={{
                              height: `${height}px`,
                            }}
                          />

                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            <div className="font-semibold">
                              {item.orders} orders
                            </div>

                            <div className="text-gray-300">
                              {formatCurrency(item.revenue)}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-gray-500">
                          {formatHour(item.hour)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>

      <div>
        <p className="text-xs text-gray-500">{title}</p>

        <p className="text-lg font-bold text-gray-900">
          {typeof value === "number"
            ? value.toLocaleString("en-IN")
            : value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
      <div className="text-center">
        <Activity className="mx-auto h-7 w-7 text-gray-300" />

        <p className="mt-2 text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );
}