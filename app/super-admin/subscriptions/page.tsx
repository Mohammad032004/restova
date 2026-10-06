"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Plus,
  XCircle,
} from "lucide-react";

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
  createdAt: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState<
    "MONTHLY" | "YEARLY"
  >("MONTHLY");

  const [maxTables, setMaxTables] = useState("");
  const [maxStaff, setMaxStaff] = useState("");

  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>(
    []
  );

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/super-admin/subscription-plans",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load subscription plans."
        );
      }

      setPlans(data.plans);
    } catch (error) {
      console.error(
        "Subscription plans loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load subscription plans."
      );
    } finally {
      setLoading(false);
    }
  }

  function addFeature() {
    const feature = featureInput.trim();

    if (!feature) return;

    if (features.includes(feature)) {
      setFeatureInput("");
      return;
    }

    setFeatures((current) => [
      ...current,
      feature,
    ]);

    setFeatureInput("");
  }

  function removeFeature(feature: string) {
    setFeatures((current) =>
      current.filter((item) => item !== feature)
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/super-admin/subscription-plans",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            price: Number(price),
            billingCycle,
            features,
            maxTables: Number(maxTables),
            maxStaff: Number(maxStaff),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create subscription plan."
        );
      }

      setPlans((current) => [
        data.plan,
        ...current,
      ]);

      setSuccess(
        "Subscription plan created successfully."
      );

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error(
        "Create subscription plan error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create subscription plan."
      );
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setBillingCycle("MONTHLY");
    setMaxTables("");
    setMaxStaff("");
    setFeatureInput("");
    setFeatures([]);
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/super-admin"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Platform Management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Subscriptions
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Create and manage subscription plans for
                Restova restaurants.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm((current) => !current);
                setError("");
                setSuccess("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={17} />

              {showForm
                ? "Close Form"
                : "Create Plan"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm font-semibold text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-950">
                Create Subscription Plan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define pricing, limits, and features.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">

                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Plan Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="e.g. Professional"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      placeholder="999"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Billing Cycle
                  </label>

                  <select
                    value={billingCycle}
                    onChange={(event) =>
                      setBillingCycle(
                        event.target.value as
                          | "MONTHLY"
                          | "YEARLY"
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-400"
                  >
                    <option value="MONTHLY">
                      Monthly
                    </option>

                    <option value="YEARLY">
                      Yearly
                    </option>
                  </select>
                </div>

                {/* Max Tables */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Maximum Tables
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={maxTables}
                    onChange={(event) =>
                      setMaxTables(event.target.value)
                    }
                    placeholder="50"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                {/* Max Staff */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Maximum Staff
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={maxStaff}
                    onChange={(event) =>
                      setMaxStaff(event.target.value)
                    }
                    placeholder="15"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe what this plan is suitable for..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                {/* Features */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Features
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(event) =>
                        setFeatureInput(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter"
                        ) {
                          event.preventDefault();
                          addFeature();
                        }
                      }}
                      placeholder="e.g. QR Ordering"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />

                    <button
                      type="button"
                      onClick={addFeature}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Add
                    </button>
                  </div>

                  {features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          {feature}

                          <button
                            type="button"
                            onClick={() =>
                              removeFeature(
                                feature
                              )
                            }
                            className="text-slate-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Subscription Plans
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Plans available for restaurant subscriptions.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

              <p className="mt-4 text-sm text-slate-500">
                Loading plans...
              </p>
            </div>
          ) : plans.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <CreditCard size={24} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-950">
                No subscription plans
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first plan to start managing
                restaurant subscriptions.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={16} />
                Create First Plan
              </button>
            </div>
          ) : (
            <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        {plan.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {plan.description ||
                          "No description provided."}
                      </p>
                    </div>

                    {plan.isActive ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <XCircle size={12} />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <span className="text-3xl font-bold text-slate-950">
                      ₹{plan.price}
                    </span>

                    <span className="ml-1 text-sm text-slate-500">
                      /{" "}
                      {plan.billingCycle ===
                      "MONTHLY"
                        ? "month"
                        : "year"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Tables
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {plan.maxTables}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Staff
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {plan.maxStaff}
                      </p>
                    </div>
                  </div>

                  {plan.features.length > 0 && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Features
                      </p>

                      <div className="space-y-2">
                        {plan.features.map(
                          (feature) => (
                            <div
                              key={feature}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <CheckCircle2
                                size={15}
                                className="mt-0.5 shrink-0 text-green-600"
                              />

                              <span>{feature}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}