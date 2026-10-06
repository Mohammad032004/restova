"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Store,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

interface Restaurant {
  _id: string;
  name: string;
  type?: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
  status?: string;
  numberOfTables?: number;
  ownerId?: string;
}

interface Plan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
  features: string[];
  maxTables: number;
  maxStaff: number;
  isActive: boolean;
}

interface Subscription {
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
  planId?: Plan;
}

interface Invoice {
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

  paymentGateway?:
    | "RAZORPAY"
    | "DEMO"
    | "OTHER";

  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  notes?: string;

  restaurantId?: Restaurant;
  subscriptionId?: Subscription;

  createdAt: string;
  updatedAt: string;
}

type InvoiceStatus = Invoice["status"];

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

function formatAmount(
  amount: number,
  currency = "INR"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusClasses(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "REFUNDED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getStatusIcon(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return <CheckCircle2 size={16} />;

    case "PENDING":
      return <Clock3 size={16} />;

    case "FAILED":
      return <XCircle size={16} />;

    case "REFUNDED":
      return <RefreshCw size={16} />;

    case "CANCELLED":
      return <X size={16} />;

    default:
      return <FileText size={16} />;
  }
}

function getGatewayClasses(
  gateway?: Invoice["paymentGateway"]
) {
  switch (gateway) {
    case "DEMO":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "RAZORPAY":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "OTHER":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-500";
  }
}

export default function SubscriptionInvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [demoPaymentLoading, setDemoPaymentLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState<InvoiceStatus>("PENDING");

  async function loadInvoice() {
    if (!id) {
      setError("Invoice ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/super-admin/subscription-invoices/${id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load invoice."
        );
      }

      setInvoice(result.invoice);
      setSelectedStatus(result.invoice.status);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function updateStatus() {
    if (!invoice) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/super-admin/subscription-invoices/${invoice._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update invoice."
        );
      }

      setInvoice(result.invoice);
      setSelectedStatus(result.invoice.status);

      setSuccess(
        "Invoice status updated successfully."
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update invoice."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleDemoPayment() {
    if (!invoice) return;

    if (invoice.status !== "PENDING") {
      setError(
        "Only pending invoices can be paid."
      );
      return;
    }

    const confirmed = window.confirm(
      `Simulate payment of ${formatAmount(
        invoice.amount,
        invoice.currency
      )} for invoice ${
        invoice.invoiceNumber
      }?\n\nNo real money will be charged.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDemoPaymentLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/super-admin/subscription-invoices/${invoice._id}/demo-payment`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to process demo payment."
        );
      }

      setSuccess(
        "Demo payment completed successfully."
      );

      await loadInvoice();
    } catch (error) {
      console.error(
        "Demo payment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to process demo payment."
      );
    } finally {
      setDemoPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="space-y-5">
        <Link
          href="/super-admin/subscriptions/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Back to invoices
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">
            Unable to load invoice
          </p>

          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const restaurant = invoice.restaurantId;
  const subscription = invoice.subscriptionId;
  const plan = subscription?.planId;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/super-admin/subscriptions/invoices"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to invoices
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              {invoice.invoiceNumber}
            </h2>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                invoice.status
              )}`}
            >
              {getStatusIcon(invoice.status)}
              {invoice.status}
            </span>

            {invoice.paymentGateway && (
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getGatewayClasses(
                  invoice.paymentGateway
                )}`}
              >
                {invoice.paymentGateway}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Subscription billing invoice for{" "}
            <span className="font-semibold text-slate-700">
              {restaurant?.name ||
                "Unknown restaurant"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {invoice.status === "PENDING" && (
            <button
              type="button"
              onClick={handleDemoPayment}
              disabled={demoPaymentLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {demoPaymentLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <CreditCard size={16} />
              )}

              {demoPaymentLoading
                ? "Processing..."
                : "Simulate Demo Payment"}
            </button>
          )}

          <button
            type="button"
            onClick={loadInvoice}
            disabled={loading || demoPaymentLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />
          <div>{success}</div>
        </div>
      )}

      {/* Demo payment notice */}
      {invoice.status === "PENDING" && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-start gap-3">
            <CreditCard
              size={18}
              className="mt-0.5 shrink-0 text-violet-600"
            />

            <div>
              <p className="text-sm font-semibold text-violet-900">
                Demo payment available
              </p>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                You can simulate this subscription
                payment for demonstration purposes.
                No real money will be charged.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Invoice overview */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileText size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Invoice overview
                </h3>

                <p className="text-sm text-slate-500">
                  Billing information
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Invoice number
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {invoice.invoiceNumber}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Amount
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {formatAmount(
                  invoice.amount,
                  invoice.currency
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Issue date
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(
                  invoice.issueDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Due date
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(
                  invoice.dueDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Paid at
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(
                  invoice.paidAt
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Currency
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {invoice.currency}
              </p>
            </div>
          </div>
        </section>

        {/* Status management */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h3 className="font-semibold text-slate-950">
              Invoice status
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Update the billing record status.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as InvoiceStatus
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="PENDING">
                Pending
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="FAILED">
                Failed
              </option>

              <option value="REFUNDED">
                Refunded
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <button
              type="button"
              onClick={updateStatus}
              disabled={
                updating ||
                selectedStatus === invoice.status
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {updating
                ? "Updating..."
                : "Update status"}
            </button>
          </div>
        </section>

        {/* Restaurant */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Store size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Restaurant
                </h3>

                <p className="text-sm text-slate-500">
                  Billing account
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-lg font-semibold text-slate-950">
                {restaurant?.name ||
                  "Unknown restaurant"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {restaurant?.type ||
                  "Restaurant"}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <p className="text-sm leading-6 text-slate-600">
                {restaurant?.address ||
                  "Address not available"}

                <br />

                {[
                  restaurant?.city,
                  restaurant?.state,
                  restaurant?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">
                Restaurant status
              </span>

              <span className="text-sm font-semibold text-slate-700">
                {restaurant?.status || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Tables
              </span>

              <span className="text-sm font-semibold text-slate-700">
                {restaurant?.numberOfTables ??
                  "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <CreditCard size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Subscription
                </h3>

                <p className="text-sm text-slate-500">
                  Subscription associated with
                  this invoice
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Plan
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {plan?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Subscription status
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {subscription?.status || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Billing cycle
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {subscription?.billingCycle ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Subscription price
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {subscription
                  ? formatAmount(
                      subscription.price,
                      invoice.currency
                    )
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Start date
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(
                  subscription?.startDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                End date
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(
                  subscription?.endDate
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Payment information */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 p-6">
            <h3 className="font-semibold text-slate-950">
              Payment information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Payment gateway information and
              transaction details.
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Payment gateway
              </p>

              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getGatewayClasses(
                    invoice.paymentGateway
                  )}`}
                >
                  {invoice.paymentGateway ||
                    "Not paid"}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Gateway order ID
              </p>

              <p className="mt-1 break-all text-sm text-slate-700">
                {invoice.gatewayOrderId ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Gateway payment ID
              </p>

              <p className="mt-1 break-all text-sm text-slate-700">
                {invoice.gatewayPaymentId ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Auto renewal
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {subscription?.autoRenew
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h3 className="font-semibold text-slate-950">
              Notes
            </h3>
          </div>

          <div className="p-6">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {invoice.notes ||
                "No notes added."}
            </p>
          </div>
        </section>

        {/* Record information */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <UserRound
                size={19}
                className="text-slate-500"
              />

              <div>
                <h3 className="font-semibold text-slate-950">
                  Record information
                </h3>

                <p className="text-sm text-slate-500">
                  Internal invoice record details
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Invoice ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-slate-600">
                {invoice._id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Created
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(
                  invoice.createdAt
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Last updated
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(
                  invoice.updatedAt
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}