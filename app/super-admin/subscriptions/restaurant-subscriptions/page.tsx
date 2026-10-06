"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";

interface Restaurant {
  _id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  status: "ACTIVE" | "SUSPENDED";
  numberOfTables: number;
}

interface SubscriptionPlan {
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

interface RestaurantSubscription {
  _id: string;
  restaurantId: Restaurant;
  planId: SubscriptionPlan;
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
}

export default function RestaurantSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<
    RestaurantSubscription[]
  >([]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>(
    []
  );

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAssignForm, setShowAssignForm] =
    useState(false);

  const [restaurantId, setRestaurantId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "TRIAL">(
    "ACTIVE"
  );
  const [autoRenew, setAutoRenew] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        subscriptionsResponse,
        restaurantsResponse,
        plansResponse,
      ] = await Promise.all([
        fetch("/api/super-admin/restaurant-subscriptions"),
        fetch("/api/super-admin/restaurants"),
        fetch("/api/super-admin/subscription-plans"),
      ]);

      const subscriptionsData =
        await subscriptionsResponse.json();

      const restaurantsData =
        await restaurantsResponse.json();

      const plansData = await plansResponse.json();

      if (!subscriptionsResponse.ok) {
        throw new Error(
          subscriptionsData.message ||
            "Failed to load subscriptions."
        );
      }

      if (!restaurantsResponse.ok) {
        throw new Error(
          restaurantsData.message ||
            "Failed to load restaurants."
        );
      }

      if (!plansResponse.ok) {
        throw new Error(
          plansData.message ||
            "Failed to load subscription plans."
        );
      }

      setSubscriptions(
        subscriptionsData.subscriptions || []
      );

      setRestaurants(
        restaurantsData.restaurants || []
      );

      setPlans(
        (plansData.plans || []).filter(
          (plan: SubscriptionPlan) => plan.isActive
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setRestaurantId("");
    setPlanId("");
    setStartDate("");
    setStatus("ACTIVE");
    setAutoRenew(false);
    setError("");
    setSuccess("");
  }

  async function handleAssignSubscription(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!restaurantId || !planId) {
      setError(
        "Please select a restaurant and subscription plan."
      );
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/super-admin/restaurant-subscriptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId,
            planId,
            startDate: startDate || undefined,
            status,
            autoRenew,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to assign subscription."
        );
      }

      setSuccess(
        "Subscription assigned successfully."
      );

      resetForm();

      setShowAssignForm(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign subscription."
      );
    } finally {
      setAssigning(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getStatusClasses(
    subscriptionStatus: RestaurantSubscription["status"]
  ) {
    switch (subscriptionStatus) {
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

  const activeSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "ACTIVE"
  ).length;

  const trialSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "TRIAL"
  ).length;

  const expiredSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "EXPIRED"
  ).length;

  const subscribedRestaurantIds =
    subscriptions
      .filter(
        (subscription) =>
          subscription.status === "ACTIVE" ||
          subscription.status === "TRIAL"
      )
      .map((subscription) =>
        typeof subscription.restaurantId === "object"
          ? subscription.restaurantId._id
          : ""
      );

  const availableRestaurants =
    restaurants.filter(
      (restaurant) =>
        !subscribedRestaurantIds.includes(
          restaurant._id
        )
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <CreditCard size={16} />
              <span>Subscriptions</span>
              <span>/</span>
              <span>Restaurant Subscriptions</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Restaurant Subscriptions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assign and manage subscription plans for
              restaurants.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAssignForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={17} />
              Assign Subscription
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Subscriptions
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {subscriptions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {activeSubscriptions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Trial
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {trialSubscriptions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Expired
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {expiredSubscriptions}
            </p>
          </div>
        </div>

        {/* Assign Form */}
        {showAssignForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Assign Subscription
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assign an active subscription plan to a
                  restaurant.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAssignForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAssignSubscription}
              className="grid gap-5 md:grid-cols-2"
            >
              {/* Restaurant */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Restaurant
                </label>

                <div className="relative">
                  <Store
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={restaurantId}
                    onChange={(event) =>
                      setRestaurantId(event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select restaurant
                    </option>

                    {availableRestaurants.map(
                      (restaurant) => (
                        <option
                          key={restaurant._id}
                          value={restaurant._id}
                        >
                          {restaurant.name} —{" "}
                          {restaurant.city}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {availableRestaurants.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No restaurants are currently
                    available for a new subscription.
                  </p>
                )}
              </div>

              {/* Plan */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subscription Plan
                </label>

                <div className="relative">
                  <CreditCard
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={planId}
                    onChange={(event) =>
                      setPlanId(event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select plan
                    </option>

                    {plans.map((plan) => (
                      <option
                        key={plan._id}
                        value={plan._id}
                      >
                        {plan.name} —{" "}
                        {formatPrice(plan.price)} /{" "}
                        {plan.billingCycle.toLowerCase()}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Start Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Leave empty to start immediately.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Initial Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as
                        | "ACTIVE"
                        | "TRIAL"
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="TRIAL">
                    Trial
                  </option>
                </select>
              </div>

              {/* Auto Renew */}
              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(event) =>
                      setAutoRenew(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Enable automatic renewal
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    assigning ||
                    !restaurantId ||
                    !planId
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigning && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {assigning
                    ? "Assigning..."
                    : "Assign Subscription"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subscription Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Subscription Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All subscription assignments across the
              platform.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin text-slate-400"
              />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <CreditCard
                  size={28}
                  className="text-slate-400"
                />
              </div>

              <h3 className="font-semibold text-slate-900">
                No subscriptions yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Assign a subscription plan to a restaurant
                to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Restaurant
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Plan
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Period
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Start
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      End
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Auto Renew
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {subscriptions.map(
                    (subscription) => (
                      <tr
                        key={subscription._id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-medium text-slate-900">
                              {
                                subscription
                                  .restaurantId.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                subscription
                                  .restaurantId.city
                              }
                              ,{" "}
                              {
                                subscription
                                  .restaurantId.state
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-900">
                            {subscription.planId.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              subscription
                                .planId.maxTables
                            }{" "}
                            tables ·{" "}
                            {
                              subscription
                                .planId.maxStaff
                            }{" "}
                            staff
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-medium text-slate-900">
                            {formatPrice(
                              subscription.price
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm capitalize text-slate-700">
                            {subscription.billingCycle.toLowerCase()}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatDate(
                            subscription.startDate
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatDate(
                            subscription.endDate
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              subscription.status
                            )}`}
                          >
                            {subscription.status ===
                              "ACTIVE" && (
                              <CheckCircle2 size={13} />
                            )}

                            {subscription.status ===
                              "TRIAL" && (
                              <CheckCircle2 size={13} />
                            )}

                            {subscription.status ===
                              "EXPIRED" && (
                              <XCircle size={13} />
                            )}

                            {subscription.status}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {subscription.autoRenew ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                              <CheckCircle2
                                size={15}
                              />
                              Enabled
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">
                              Disabled
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}