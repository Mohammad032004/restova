"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

interface BillingOrder {
  _id: string;
  orderNumber: number;
  tableId?: {
    name?: string;
    number?: number;
  } | null;
  orderType: string;
  source: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentId?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethodSummary {
  method: string;
  count: number;
  amount: number;
}

interface BillingData {
  success: boolean;
  date: string;
  summary: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    failedOrders: number;
    refundedOrders: number;
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
    cancelledAmount: number;
  };
  paymentMethods: PaymentMethodSummary[];
  orders: BillingOrder[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatPaymentMethod(method?: string) {
  if (!method) {
    return "Not specified";
  }

  if (method === "RAZORPAY") {
    return "Razorpay";
  }

  return method
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPaymentStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    case "REFUNDED":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "READY":
      return "bg-blue-50 text-blue-700";

    case "PREPARING":
      return "bg-amber-50 text-amber-700";

    case "ACCEPTED":
      return "bg-indigo-50 text-indigo-700";

    case "PLACED":
      return "bg-purple-50 text-purple-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getTodayDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function formatDisplayDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T00:00:00+05:30`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RestaurantBillingPage() {
  const [data, setData] = useState<BillingData | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] =
    useState(getTodayDate());

  const [search, setSearch] = useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  async function loadBilling(
    isRefresh = false,
    customDate = selectedDate
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (customDate) {
        params.set("date", customDate);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (paymentStatus) {
        params.set("paymentStatus", paymentStatus);
      }

      if (paymentMethod) {
        params.set("paymentMethod", paymentMethod);
      }

      const response = await fetch(
        `/api/restaurant/billing?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load billing information."
        );
      }

      setData(result);
    } catch (error) {
      console.error(
        "Billing loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load billing information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, [selectedDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBilling(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, paymentStatus, paymentMethod]);

  function handleResetFilters() {
    setSearch("");
    setPaymentStatus("");
    setPaymentMethod("");
    setSelectedDate(getTodayDate());
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm text-slate-500">
            Loading billing...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load billing
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error ||
                    "Something went wrong."}
                </p>

                <button
                  type="button"
                  onClick={() => loadBilling()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const {
    summary,
    paymentMethods,
    orders,
  } = data;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Restaurant Billing
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Billing & Payments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage orders, payments and billing records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadBilling(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Date + Filters */}
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[180px_1fr_180px_180px_auto]">
            {/* Date */}
            <div>
              <label
                htmlFor="billing-date"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="billing-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            {/* Search */}
            <div>
              <label
                htmlFor="billing-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="billing-search"
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Order, customer, phone or payment ID"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label
                htmlFor="payment-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Payment Status
              </label>

              <select
                id="payment-status"
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">
                  Pending
                </option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">
                  Refunded
                </option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label
                htmlFor="payment-method"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Payment Method
              </label>

              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">
                  All Methods
                </option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="RAZORPAY">
                  Razorpay
                </option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Selected Date */}
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={16} />

          <span>
            Showing billing for{" "}
            <span className="font-semibold text-slate-800">
              {formatDisplayDate(data.date)}
            </span>
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Paid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Paid Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    summary.paidAmount
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <IndianRupee size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {summary.paidOrders} paid orders
            </p>
          </div>

          {/* Pending */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    summary.pendingAmount
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {summary.pendingOrders} pending payments
            </p>
          </div>

          {/* Refunded */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Refunded Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    summary.refundedAmount
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <WalletCards size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {summary.refundedOrders} refunded orders
            </p>
          </div>

          {/* Total Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Orders
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summary.totalOrders}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CreditCard size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              All orders for selected date
            </p>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Payment Methods
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Paid revenue by payment method.
              </p>
            </div>

            <WalletCards
              size={21}
              className="text-slate-400"
            />
          </div>

          {paymentMethods.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-600">
                No paid transactions for this date.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {paymentMethods.map((item) => (
                <div
                  key={item.method}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      {formatPaymentMethod(
                        item.method
                      )}
                    </p>

                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500">
                      {item.count}
                    </span>
                  </div>

                  <p className="mt-3 text-xl font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {item.count} transaction
                    {item.count !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Billing Orders */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Billing Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Orders and their payment information.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {orders.length} record
              {orders.length !== 1 ? "s" : ""}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CreditCard
                  size={22}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No billing records
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                No orders match the selected date and
                filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Table
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Order Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Payment
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Method
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                    >
                      {/* Order */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          #{order.orderNumber}
                        </span>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatStatus(
                            order.orderType
                          )}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {order.customerName ||
                            "Walk-in Customer"}
                        </p>

                        {order.customerPhone && (
                          <p className="mt-1 text-xs text-slate-400">
                            {order.customerPhone}
                          </p>
                        )}
                      </td>

                      {/* Table */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {order.tableId?.name ||
                          (order.tableId?.number
                            ? `Table ${order.tableId.number}`
                            : "—")}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>

                      {/* Order Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {formatStatus(
                            order.status
                          )}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {formatStatus(
                            order.paymentStatus
                          )}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatPaymentMethod(
                          order.paymentMethod
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer Summary */}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={19}
                className="text-emerald-600"
              />

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Paid Orders
                </p>

                <p className="mt-0.5 font-semibold text-slate-900">
                  {summary.paidOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3
                size={19}
                className="text-amber-600"
              />

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Pending Payments
                </p>

                <p className="mt-0.5 font-semibold text-slate-900">
                  {summary.pendingOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle
                size={19}
                className="text-red-600"
              />

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Failed Payments
                </p>

                <p className="mt-0.5 font-semibold text-slate-900">
                  {summary.failedOrders}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}