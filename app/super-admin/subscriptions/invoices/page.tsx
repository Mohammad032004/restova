"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

interface Restaurant {
  _id: string;
  name: string;
  type?: string;
  city?: string;
  state?: string;
  status?: string;
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  billingCycle: "MONTHLY" | "YEARLY";
}

interface RestaurantSubscription {
  _id: string;
  status:
    | "TRIAL"
    | "ACTIVE"
    | "EXPIRED"
    | "CANCELLED"
    | "SUSPENDED";
  startDate: string;
  endDate: string;
  billingCycle: "MONTHLY" | "YEARLY";
  price: number;
  autoRenew: boolean;
  planId?: SubscriptionPlan;
}

interface SubscriptionInvoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "CANCELLED";
  issueDate: string;
  dueDate?: string;
  paidAt?: string;

  /**
   * Payment gateway used for the invoice.
   *
   * DEMO is temporary and will be removed
   * when real Razorpay billing is fully enabled.
   */
  paymentGateway?: "RAZORPAY" | "DEMO" | "OTHER";

  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  notes?: string;

  restaurantId?: Restaurant;
  subscriptionId?: RestaurantSubscription;

  createdAt: string;
  updatedAt: string;
}

type InvoiceStatus =
  | "ALL"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

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

function formatAmount(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusClasses(status: SubscriptionInvoice["status"]) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";

    case "REFUNDED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getStatusIcon(status: SubscriptionInvoice["status"]) {
  switch (status) {
    case "PAID":
      return <CheckCircle2 size={14} />;

    case "PENDING":
      return <Clock3 size={14} />;

    case "FAILED":
      return <XCircle size={14} />;

    case "REFUNDED":
      return <RefreshCw size={14} />;

    case "CANCELLED":
      return <X size={14} />;

    default:
      return <FileText size={14} />;
  }
}

function getGatewayClasses(gateway?: SubscriptionInvoice["paymentGateway"]) {
  switch (gateway) {
    case "RAZORPAY":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "DEMO":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "OTHER":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-50 text-slate-400 border-slate-200";
  }
}

function getGatewayLabel(gateway?: SubscriptionInvoice["paymentGateway"]) {
  switch (gateway) {
    case "RAZORPAY":
      return "Razorpay";

    case "DEMO":
      return "Demo";

    case "OTHER":
      return "Other";

    default:
      return "Not paid";
  }
}

export default function SubscriptionInvoicesPage() {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InvoiceStatus>("ALL");

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/super-admin/subscription-invoices",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load subscription invoices."
        );
      }

      setInvoices(result.invoices || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load subscription invoices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const statistics = useMemo(() => {
    return {
      total: invoices.length,

      pending: invoices.filter(
        (invoice) => invoice.status === "PENDING"
      ).length,

      paid: invoices.filter(
        (invoice) => invoice.status === "PAID"
      ).length,

      failed: invoices.filter(
        (invoice) => invoice.status === "FAILED"
      ).length,

      refunded: invoices.filter(
        (invoice) => invoice.status === "REFUNDED"
      ).length,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        invoice.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const invoiceNumber =
        invoice.invoiceNumber?.toLowerCase() || "";

      const restaurantName =
        invoice.restaurantId?.name?.toLowerCase() || "";

      const city =
        invoice.restaurantId?.city?.toLowerCase() || "";

      const gateway =
        invoice.paymentGateway?.toLowerCase() || "";

      const gatewayLabel =
        getGatewayLabel(invoice.paymentGateway).toLowerCase();

      const gatewayOrderId =
        invoice.gatewayOrderId?.toLowerCase() || "";

      const gatewayPaymentId =
        invoice.gatewayPaymentId?.toLowerCase() || "";

      return (
        invoiceNumber.includes(normalizedSearch) ||
        restaurantName.includes(normalizedSearch) ||
        city.includes(normalizedSearch) ||
        gateway.includes(normalizedSearch) ||
        gatewayLabel.includes(normalizedSearch) ||
        gatewayOrderId.includes(normalizedSearch) ||
        gatewayPaymentId.includes(normalizedSearch)
      );
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <CreditCard size={17} />
            <span>Subscriptions</span>
            <span>/</span>
            <span>Invoices</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Subscription Invoices
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage billing records for Restova restaurant
            subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInvoices}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle
            className="mt-0.5 shrink-0"
            size={18}
          />

          <div className="flex-1">
            <p className="font-semibold">
              Unable to load invoices
            </p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadInvoices}
            className="font-semibold text-red-700 hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total invoices
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-900">
            {statistics.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-900">
            {statistics.paid}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            Failed
          </p>

          <p className="mt-2 text-2xl font-bold text-red-900">
            {statistics.failed}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-700">
            Refunded
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-900">
            {statistics.refunded}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search invoice, restaurant, city, gateway..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as InvoiceStatus
                )
              }
              className="h-11 min-w-48 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-950">
                Invoice records
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Showing {filteredInvoices.length} of{" "}
                {invoices.length} invoices
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading invoices...
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText size={22} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No invoices found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search || statusFilter !== "ALL"
                ? "Try changing your search or status filter."
                : "Subscription invoices will appear here when they are created."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Restaurant
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Issue date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Gateway
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/super-admin/subscriptions/invoices/${invoice._id}`}
                        className="font-semibold text-slate-900 hover:text-slate-600"
                      >
                        {invoice.invoiceNumber}
                      </Link>

                      <p className="mt-1 text-xs text-slate-400">
                        Created{" "}
                        {formatDateTime(invoice.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {invoice.restaurantId?.name ||
                          "Unknown restaurant"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          invoice.restaurantId?.city,
                          invoice.restaurantId?.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {formatAmount(
                          invoice.amount,
                          invoice.currency
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {invoice.currency}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          invoice.status
                        )}`}
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(invoice.issueDate)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(invoice.dueDate)}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.paymentGateway ? (
                        <div className="flex flex-col items-start gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getGatewayClasses(
                              invoice.paymentGateway
                            )}`}
                          >
                            {getGatewayLabel(
                              invoice.paymentGateway
                            )}
                          </span>

                          {invoice.paymentGateway ===
                            "DEMO" && (
                            <span className="text-[10px] font-medium text-violet-500">
                              Test payment
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Not paid
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/super-admin/subscriptions/invoices/${invoice._id}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}