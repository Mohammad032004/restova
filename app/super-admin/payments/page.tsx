"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

type PaymentGateway = "RAZORPAY" | "DEMO" | "OTHER";

interface Restaurant {
  _id: string;
  name: string;
  type?: string;
  city?: string;
  state?: string;
}

interface PaymentInvoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  issueDate: string;
  dueDate?: string;
  paidAt?: string;
  paymentGateway?: PaymentGateway;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  notes?: string;
  restaurantId?: Restaurant;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = PaymentStatus | "ALL";
type GatewayFilter = PaymentGateway | "ALL";

const ITEMS_PER_PAGE = 10;

function formatAmount(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }
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

function formatDateTime(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";

    case "REFUNDED":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getStatusIcon(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return <CheckCircle2 size={14} />;

    case "PENDING":
      return <Clock3 size={14} />;

    case "FAILED":
      return <XCircle size={14} />;

    case "REFUNDED":
      return <RotateCcw size={14} />;

    case "CANCELLED":
      return <AlertCircle size={14} />;

    default:
      return <AlertCircle size={14} />;
  }
}

function getGatewayClasses(gateway?: PaymentGateway) {
  switch (gateway) {
    case "RAZORPAY":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "DEMO":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "OTHER":
      return "bg-slate-50 text-slate-700 border-slate-200";

    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function getGatewayLabel(gateway?: PaymentGateway) {
  switch (gateway) {
    case "RAZORPAY":
      return "Razorpay";

    case "DEMO":
      return "Demo";

    case "OTHER":
      return "Other";

    default:
      return "—";
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [gatewayFilter, setGatewayFilter] =
    useState<GatewayFilter>("ALL");

  const [page, setPage] = useState(1);

  async function fetchPayments(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "/api/super-admin/subscription-invoices",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load payments (${response.status})`
        );
      }

      const data = await response.json();

      let list: PaymentInvoice[] = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.invoices)) {
        list = data.invoices;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (Array.isArray(data.results)) {
        list = data.results;
      }

      setPayments(list);
    } catch (err) {
      console.error("Payments fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const statistics = useMemo(() => {
    const total = payments.length;

    const paid = payments.filter(
      (payment) => payment.status === "PAID"
    ).length;

    const pending = payments.filter(
      (payment) => payment.status === "PENDING"
    ).length;

    const failed = payments.filter(
      (payment) => payment.status === "FAILED"
    ).length;

    const refunded = payments.filter(
      (payment) => payment.status === "REFUNDED"
    ).length;

    const cancelled = payments.filter(
      (payment) => payment.status === "CANCELLED"
    ).length;

    const totalRevenue = payments
      .filter((payment) => payment.status === "PAID")
      .reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      );

    const pendingAmount = payments
      .filter((payment) => payment.status === "PENDING")
      .reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      );

    const refundedAmount = payments
      .filter((payment) => payment.status === "REFUNDED")
      .reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      );

    return {
      total,
      paid,
      pending,
      failed,
      refunded,
      cancelled,
      totalRevenue,
      pendingAmount,
      refundedAmount,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const restaurantName =
        payment.restaurantId?.name?.toLowerCase() || "";

      const invoiceNumber =
        payment.invoiceNumber?.toLowerCase() || "";

      const gatewayOrderId =
        payment.gatewayOrderId?.toLowerCase() || "";

      const gatewayPaymentId =
        payment.gatewayPaymentId?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        restaurantName.includes(query) ||
        invoiceNumber.includes(query) ||
        gatewayOrderId.includes(query) ||
        gatewayPaymentId.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      const matchesGateway =
        gatewayFilter === "ALL" ||
        payment.paymentGateway === gatewayFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesGateway
      );
    });
  }, [payments, search, statusFilter, gatewayFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, gatewayFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedPayments = useMemo(() => {
    const start =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredPayments.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredPayments, currentPage]);

  const showingFrom =
    filteredPayments.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const showingTo = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredPayments.length
  );

  return (
    <div className="min-h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="px-7 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                <CreditCard size={14} />
                Super Admin
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Payments
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor subscription payments, revenue and
                transaction status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="space-y-6 p-7">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to load payments
              </p>

              <p className="mt-0.5 text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchPayments(true)}
              className="text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {/* Revenue */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatAmount(
                    statistics.totalRevenue
                  )}
                </p>

                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp size={13} />
                  <span>Successful payments</span>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard size={19} />
              </div>
            </div>
          </div>

          {/* Paid */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Paid
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {statistics.paid}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Successful transactions
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {statistics.pending}
                </p>

                <p className="mt-2 text-xs text-amber-600">
                  {formatAmount(
                    statistics.pendingAmount
                  )}{" "}
                  pending
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock3 size={19} />
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Failed
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {statistics.failed}
                </p>

                <p className="mt-2 text-xs text-red-500">
                  Failed transactions
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <XCircle size={19} />
              </div>
            </div>
          </div>

          {/* Refunded */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Refunded
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {statistics.refunded}
                </p>

                <p className="mt-2 text-xs text-purple-600">
                  {formatAmount(
                    statistics.refundedAmount
                  )}{" "}
                  refunded
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <RotateCcw size={19} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search invoice, restaurant or payment ID..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Gateway */}
            <select
              value={gatewayFilter}
              onChange={(event) =>
                setGatewayFilter(
                  event.target.value as GatewayFilter
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="ALL">
                All Gateways
              </option>
              <option value="RAZORPAY">
                Razorpay
              </option>
              <option value="DEMO">Demo</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Payment Transactions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredPayments.length} transaction
                  {filteredPayments.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              {filteredPayments.length > 0 && (
                <div className="text-xs text-slate-500">
                  Showing {showingFrom}–{showingTo}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={28}
                  className="animate-spin text-slate-400"
                />

                <p className="text-sm text-slate-500">
                  Loading payments...
                </p>
              </div>
            </div>
          ) : paginatedPayments.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CreditCard size={24} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No payments found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {payments.length === 0
                  ? "There are no subscription payment transactions yet."
                  : "Try changing your search or filters."}
              </p>

              {(search ||
                statusFilter !== "ALL" ||
                gatewayFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setGatewayFilter("ALL");
                  }}
                  className="mt-4 text-sm font-medium text-slate-900 underline underline-offset-4"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Invoice
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Restaurant
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Gateway
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Payment Date
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedPayments.map((payment) => (
                      <tr
                        key={payment._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        {/* Invoice */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {payment.invoiceNumber ||
                                "—"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Issued{" "}
                              {formatDate(
                                payment.issueDate
                              )}
                            </p>
                          </div>
                        </td>

                        {/* Restaurant */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">
                              {payment.restaurantId?.name ||
                                "Unknown Restaurant"}
                            </p>

                            {(payment.restaurantId?.city ||
                              payment.restaurantId
                                ?.state) && (
                              <p className="mt-1 text-xs text-slate-400">
                                {[
                                  payment.restaurantId?.city,
                                  payment.restaurantId?.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatAmount(
                              payment.amount,
                              payment.currency
                            )}
                          </p>
                        </td>

                        {/* Gateway */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${getGatewayClasses(
                                payment.paymentGateway
                              )}`}
                            >
                              {getGatewayLabel(
                                payment.paymentGateway
                              )}
                            </span>

                            {payment.gatewayPaymentId && (
                              <span
                                className="max-w-[160px] truncate text-[10px] text-slate-400"
                                title={
                                  payment.gatewayPaymentId
                                }
                              >
                                {payment.gatewayPaymentId}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                              payment.status
                            )}`}
                          >
                            {getStatusIcon(
                              payment.status
                            )}

                            {payment.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm text-slate-700">
                              {formatDate(
                                payment.paidAt ||
                                  payment.issueDate
                              )}
                            </p>

                            {payment.paidAt && (
                              <p className="mt-1 text-[11px] text-slate-400">
                                {formatDateTime(
                                  payment.paidAt
                                )}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/super-admin/subscriptions/invoices/${payment._id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-medium text-slate-700">
                      {showingFrom}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-slate-700">
                      {showingTo}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-700">
                      {filteredPayments.length}
                    </span>{" "}
                    payments
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setPage((value) =>
                          Math.max(1, value - 1)
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    )
                      .slice(
                        Math.max(0, currentPage - 3),
                        Math.min(
                          totalPages,
                          currentPage + 2
                        )
                      )
                      .map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() =>
                            setPage(pageNumber)
                          }
                          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium transition ${
                            currentPage === pageNumber
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ))}

                    <button
                      type="button"
                      disabled={
                        currentPage === totalPages
                      }
                      onClick={() =>
                        setPage((value) =>
                          Math.min(
                            totalPages,
                            value + 1
                          )
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom information */}
        {!loading && payments.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowUp
                size={14}
                className="text-emerald-500"
              />
              <span>
                Total successful revenue:{" "}
                <strong className="text-slate-800">
                  {formatAmount(
                    statistics.totalRevenue
                  )}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowDown
                size={14}
                className="text-amber-500"
              />
              <span>
                Pending amount:{" "}
                <strong className="text-slate-800">
                  {formatAmount(
                    statistics.pendingAmount
                  )}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}