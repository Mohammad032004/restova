"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  Store,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";

interface Restaurant {
  _id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  status: "ACTIVE" | "SUSPENDED";
  numberOfTables: number;
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
  restaurantId: Restaurant;
  planId: Plan;
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
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadSubscription() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/super-admin/restaurant-subscriptions/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load subscription."
          );
        }

        setSubscription(data.subscription);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load subscription."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [id]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getStatusClasses(
    status: Subscription["status"]
  ) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "TRIAL":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "EXPIRED":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";

      case "SUSPENDED":
        return "bg-slate-100 text-slate-700 border-slate-200";

      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2
          size={30}
          className="animate-spin text-slate-400"
        />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            Unable to load subscription
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error || "Subscription not found."}
          </p>

          <Link
            href="/super-admin/subscriptions/restaurant-subscriptions"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  const restaurant = subscription.restaurantId;
  const plan = subscription.planId;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/super-admin/subscriptions/restaurant-subscriptions"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Restaurant Subscriptions
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Subscription Details
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {restaurant.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {plan.name} subscription
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusClasses(
              subscription.status
            )}`}
          >
            {subscription.status === "ACTIVE" ||
            subscription.status === "TRIAL" ? (
              <CheckCircle2 size={15} />
            ) : (
              <XCircle size={15} />
            )}

            {subscription.status}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscription Overview */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <CreditCard
                    size={19}
                    className="text-slate-700"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Subscription Overview
                  </h2>

                  <p className="text-sm text-slate-500">
                    Current subscription information
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Plan
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {plan.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Price
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatPrice(subscription.price)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Billing Cycle
                </p>

                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {subscription.billingCycle.toLowerCase()}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Auto Renew
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    subscription.autoRenew
                      ? "text-emerald-600"
                      : "text-slate-700"
                  }`}
                >
                  {subscription.autoRenew
                    ? "Enabled"
                    : "Disabled"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Start Date
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(
                    subscription.startDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  End Date
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(
                    subscription.endDate
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Limits */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Plan Limits
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Resources included in this plan
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                  <Utensils
                    size={19}
                    className="text-slate-600"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Maximum Tables
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    {plan.maxTables}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                  <Users
                    size={19}
                    className="text-slate-600"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Maximum Staff
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    {plan.maxStaff}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Plan Features
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Features included with this subscription
              </p>
            </div>

            <div className="p-6">
              {plan.features.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No features configured.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.features.map(
                    (feature, index) => (
                      <div
                        key={`${feature}-${index}`}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                      >
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-emerald-600"
                        />

                        <span className="text-sm text-slate-700">
                          {feature}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Information */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Store
                    size={19}
                    className="text-slate-700"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Restaurant
                  </h2>

                  <p className="text-sm text-slate-500">
                    Restaurant information
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Name
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {restaurant.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Type
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {restaurant.type}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Location
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {restaurant.city},{" "}
                  {restaurant.state}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {restaurant.address}
                </p>

                <p className="text-xs text-slate-500">
                  {restaurant.pincode}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Restaurant Status
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    restaurant.status === "ACTIVE"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {restaurant.status}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tables
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {restaurant.numberOfTables}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <CalendarDays
                    size={19}
                    className="text-slate-700"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Record Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Subscription timestamps
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDateTime(
                    subscription.createdAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Updated
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDateTime(
                    subscription.updatedAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Subscription ID
                </p>

                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                  {subscription._id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}