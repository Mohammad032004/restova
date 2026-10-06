"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Pencil,
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

interface PlanForm {
  name: string;
  description: string;
  price: string;
  billingCycle: "MONTHLY" | "YEARLY";
  maxTables: string;
  maxStaff: string;
  featureInput: string;
  features: string[];
}

const emptyForm: PlanForm = {
  name: "",
  description: "",
  price: "",
  billingCycle: "MONTHLY",
  maxTables: "",
  maxStaff: "",
  featureInput: "",
  features: [],
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<
    SubscriptionPlan[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<PlanForm>(emptyForm);

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
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load subscription plans."
        );
      }

      setPlans(data.plans);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load subscription plans."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm(
    field: keyof PlanForm,
    value: string | string[]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addFeature() {
    const feature = form.featureInput.trim();

    if (!feature) return;

    if (form.features.includes(feature)) {
      updateForm("featureInput", "");
      return;
    }

    updateForm("features", [
      ...form.features,
      feature,
    ]);

    updateForm("featureInput", "");
  }

  function removeFeature(feature: string) {
    updateForm(
      "features",
      form.features.filter(
        (item) => item !== feature
      )
    );
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(plan: SubscriptionPlan) {
    setEditingId(plan._id);

    setForm({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      maxTables: String(plan.maxTables),
      maxStaff: String(plan.maxStaff),
      featureInput: "",
      features: [...plan.features],
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const url = editingId
        ? `/api/super-admin/subscription-plans/${editingId}`
        : "/api/super-admin/subscription-plans";

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          billingCycle: form.billingCycle,
          features: form.features,
          maxTables: Number(form.maxTables),
          maxStaff: Number(form.maxStaff),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save subscription plan."
        );
      }

      if (editingId) {
        setPlans((current) =>
          current.map((plan) =>
            plan._id === editingId
              ? data.plan
              : plan
          )
        );

        setSuccess(
          "Subscription plan updated successfully."
        );
      } else {
        setPlans((current) => [
          data.plan,
          ...current,
        ]);

        setSuccess(
          "Subscription plan created successfully."
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save subscription plan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePlanStatus(
    plan: SubscriptionPlan
  ) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/super-admin/subscription-plans/${plan._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !plan.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update plan status."
        );
      }

      setPlans((current) =>
        current.map((item) =>
          item._id === plan._id
            ? data.plan
            : item
        )
      );

      setSuccess(
        plan.isActive
          ? "Subscription plan deactivated."
          : "Subscription plan activated."
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update plan status."
      );
    }
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
              onClick={
                showForm
                  ? closeForm
                  : openCreateForm
              }
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

        {/* Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-950">
                {editingId
                  ? "Edit Subscription Plan"
                  : "Create Subscription Plan"}
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
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Professional"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
                      value={form.price}
                      onChange={(event) =>
                        updateForm(
                          "price",
                          event.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Billing */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Billing Cycle
                  </label>

                  <select
                    value={form.billingCycle}
                    onChange={(event) =>
                      updateForm(
                        "billingCycle",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="MONTHLY">
                      Monthly
                    </option>

                    <option value="YEARLY">
                      Yearly
                    </option>
                  </select>
                </div>

                {/* Tables */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Maximum Tables
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.maxTables}
                    onChange={(event) =>
                      updateForm(
                        "maxTables",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* Staff */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Maximum Staff
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.maxStaff}
                    onChange={(event) =>
                      updateForm(
                        "maxStaff",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
                      value={form.featureInput}
                      onChange={(event) =>
                        updateForm(
                          "featureInput",
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
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />

                    <button
                      type="button"
                      onClick={addFeature}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                    >
                      Add
                    </button>
                  </div>

                  {form.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.features.map(
                        (feature) => (
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
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
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
              Manage plans available on Restova.
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
                Create your first plan.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
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
                  <div className="flex items-start justify-between gap-3">
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

                  {/* Actions */}
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(plan)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        togglePlanStatus(plan)
                      }
                      className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                        plan.isActive
                          ? "border border-red-200 text-red-600 hover:bg-red-50"
                          : "bg-slate-950 text-white hover:bg-slate-800"
                      }`}
                    >
                      {plan.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}