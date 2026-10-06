"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  LifeBuoy,
  Store,
  Users,
} from "lucide-react";

interface DashboardStatistics {
  totalRestaurants: number;
  activeRestaurants: number;
  suspendedRestaurants: number;
  totalRestaurantOwners: number;
  applications: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function SuperAdminPage() {
  const [statistics, setStatistics] =
    useState<DashboardStatistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/super-admin/dashboard",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load dashboard."
          );
        }

        setStatistics(data.statistics);
      } catch (error) {
        console.error("Dashboard loading error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalRestaurants =
    statistics?.totalRestaurants ?? 0;

  const activeRestaurants =
    statistics?.activeRestaurants ?? 0;

  const suspendedRestaurants =
    statistics?.suspendedRestaurants ?? 0;

  const totalRestaurantOwners =
    statistics?.totalRestaurantOwners ?? 0;

  const pendingApplications =
    statistics?.applications.pending ?? 0;

  const approvedApplications =
    statistics?.applications.approved ?? 0;

  const rejectedApplications =
    statistics?.applications.rejected ?? 0;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Overview
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Super Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage the Restova platform, restaurants, owners,
            subscriptions, and support.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Unable to load dashboard
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Main stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Restaurants"
            value={
              loading ? "—" : totalRestaurants.toString()
            }
            description="Registered restaurants"
            icon={Store}
          />

          <StatCard
            title="Pending Applications"
            value={
              loading
                ? "—"
                : pendingApplications.toString()
            }
            description="Awaiting review"
            icon={Clock3}
          />

          <StatCard
            title="Restaurant Owners"
            value={
              loading
                ? "—"
                : totalRestaurantOwners.toString()
            }
            description="Registered owners"
            icon={Users}
          />

          <StatCard
            title="Platform Revenue"
            value="₹0"
            description="This month"
            icon={CreditCard}
          />
        </div>

        {/* Secondary stats */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SmallStat
            title="Active Restaurants"
            value={
              loading
                ? "—"
                : activeRestaurants.toString()
            }
            icon={CheckCircle2}
          />

          <SmallStat
            title="Suspended"
            value={
              loading
                ? "—"
                : suspendedRestaurants.toString()
            }
            icon={Building2}
          />

          <SmallStat
            title="Support Requests"
            value="0"
            icon={LifeBuoy}
          />

          <SmallStat
            title="Platform Growth"
            value="0%"
            icon={BarChart3}
          />
        </div>

        {/* Application summary */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Applications */}
          <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-semibold text-slate-950">
                  Restaurant Applications
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review recent restaurant applications.
                </p>
              </div>

              <Link
                href="/super-admin/applications"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-950"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3">
              <ApplicationStat
                title="Pending"
                value={
                  loading
                    ? "—"
                    : pendingApplications.toString()
                }
                icon={Clock3}
                iconClassName="bg-amber-50 text-amber-600"
              />

              <ApplicationStat
                title="Approved"
                value={
                  loading
                    ? "—"
                    : approvedApplications.toString()
                }
                icon={CheckCircle2}
                iconClassName="bg-green-50 text-green-600"
              />

              <ApplicationStat
                title="Rejected"
                value={
                  loading
                    ? "—"
                    : rejectedApplications.toString()
                }
                icon={Building2}
                iconClassName="bg-red-50 text-red-600"
              />
            </div>

            <div className="border-t border-slate-100 p-6">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock3 size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Pending applications
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Applications requiring review
                    </p>
                  </div>
                </div>

                <Link
                  href="/super-admin/applications"
                  className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Review
                </Link>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-950">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Common platform management tasks.
              </p>
            </div>

            <div className="space-y-2 p-4">
              <QuickAction
                href="/super-admin/applications"
                icon={Building2}
                title="Review Applications"
                description="Approve or reject restaurants"
              />

              <QuickAction
                href="/super-admin/restaurants"
                icon={Store}
                title="Manage Restaurants"
                description="View restaurant accounts"
              />

              <QuickAction
                href="/super-admin/owners"
                icon={Users}
                title="Manage Owners"
                description="View restaurant owners"
              />

              <QuickAction
                href="/super-admin/analytics"
                icon={BarChart3}
                title="View Analytics"
                description="Platform performance"
              />
            </div>
          </div>
        </div>

        {/* Platform status */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <h2 className="font-semibold text-slate-950">
                  Platform Status
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Restova platform services are currently operational.
              </p>
            </div>

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-xl font-bold text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function ApplicationStat({
  title,
  value,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={18} />
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight
        size={16}
        className="ml-auto shrink-0 text-slate-400"
      />
    </Link>
  );
}