"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  LifeBuoy,
  Store,
  Users,
  WalletCards,
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

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBackground: string;
}

interface SmallStatProps {
  title: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
}

interface ApplicationStatProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconClassName: string;
}

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
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
        console.error(
          "Dashboard loading error:",
          error
        );

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
    <div className="min-h-[calc(100vh-76px)] bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white">
                <Activity size={14} />
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Platform Overview
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Super Admin Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor restaurants, owners, subscriptions,
              payments and the overall Restova platform.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm lg:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>

            <span className="text-xs font-semibold text-slate-600">
              Platform operational
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-700">
              Unable to load dashboard
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Main KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Restaurants"
            value={
              loading
                ? "—"
                : totalRestaurants.toString()
            }
            description="Registered restaurants"
            icon={Store}
            gradient="from-indigo-500/20 via-violet-400/10 to-transparent"
            iconBackground="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            title="Pending Applications"
            value={
              loading
                ? "—"
                : pendingApplications.toString()
            }
            description="Awaiting platform review"
            icon={Clock3}
            gradient="from-amber-400/20 via-orange-300/10 to-transparent"
            iconBackground="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Restaurant Owners"
            value={
              loading
                ? "—"
                : totalRestaurantOwners.toString()
            }
            description="Registered platform owners"
            icon={Users}
            gradient="from-cyan-400/20 via-sky-300/10 to-transparent"
            iconBackground="bg-cyan-50 text-cyan-600"
          />

          <StatCard
            title="Platform Revenue"
            value="₹0"
            description="Revenue generated this month"
            icon={CreditCard}
            gradient="from-emerald-400/20 via-teal-300/10 to-transparent"
            iconBackground="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SmallStat
            title="Active Restaurants"
            value={
              loading
                ? "—"
                : activeRestaurants.toString()
            }
            icon={CheckCircle2}
            gradient="from-emerald-400/15 to-transparent"
          />

          <SmallStat
            title="Suspended Restaurants"
            value={
              loading
                ? "—"
                : suspendedRestaurants.toString()
            }
            icon={Building2}
            gradient="from-red-400/15 to-transparent"
          />

          <SmallStat
            title="Support Requests"
            value="0"
            icon={LifeBuoy}
            gradient="from-blue-400/15 to-transparent"
          />

          <SmallStat
            title="Platform Growth"
            value="0%"
            icon={BarChart3}
            gradient="from-violet-400/15 to-transparent"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)]">
          {/* Applications */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileText size={17} />
                  </span>

                  <h2 className="font-semibold text-slate-950">
                    Restaurant Applications
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Monitor the current application pipeline.
                </p>
              </div>

              <Link
                href="/super-admin/applications"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              >
                View all
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
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
                iconClassName="bg-emerald-50 text-emerald-600"
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

            <div className="border-t border-slate-100 p-5 sm:p-6">
              <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
                <div className="absolute -right-12 -top-16 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                      <Clock3 size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Applications requiring review
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Review pending restaurant applications
                        from the platform.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/super-admin/applications"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Review applications
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <WalletCards size={17} />
                </span>

                <h2 className="font-semibold text-slate-950">
                  Quick Actions
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Common platform management tasks.
              </p>
            </div>

            <div className="space-y-1 p-3">
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
                href="/super-admin/subscriptions"
                icon={WalletCards}
                title="Manage Subscriptions"
                description="Configure platform plans"
              />

              <QuickAction
                href="/super-admin/payments"
                icon={CreditCard}
                title="View Payments"
                description="Monitor subscription payments"
              />

              <QuickAction
                href="/super-admin/analytics"
                icon={BarChart3}
                title="View Analytics"
                description="Platform performance insights"
              />
            </div>
          </section>
        </div>

        {/* Platform Health */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative p-5 sm:p-6">
            <div className="absolute -right-24 -top-24 h-52 w-52 rounded-full bg-emerald-100/50 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Activity size={20} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>

                    <h2 className="font-semibold text-slate-950">
                      Platform Status
                    </h2>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Restova platform services are currently
                    operational.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
                <CheckCircle2
                  size={16}
                  className="text-emerald-600"
                />

                <span className="text-xs font-bold text-emerald-700">
                  All Systems Operational
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   KPI CARD
------------------------------------------------------- */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  iconBackground,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
      {/* Animated color flow */}
      <div
        className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${gradient} blur-2xl transition-transform duration-700 group-hover:scale-125`}
      />

      <div
        className={`pointer-events-none absolute -bottom-24 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr ${gradient} opacity-70 blur-3xl`}
      />

      {/* Moving glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-1000 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              {title}
            </p>

            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              {value}
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              {description}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground} shadow-sm`}
          >
            <Icon size={19} strokeWidth={2} />
          </div>
        </div>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full w-2/5 rounded-full bg-gradient-to-r ${gradient.replace(
              /from-|via-|to-/g,
              ""
            )}`}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SMALL STAT
------------------------------------------------------- */

function SmallStat({
  title,
  value,
  icon: Icon,
  gradient,
}: SmallStatProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} blur-2xl transition-transform duration-500 group-hover:scale-125`}
      />

      <div className="relative flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-950 group-hover:text-white">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   APPLICATION STAT
------------------------------------------------------- */

function ApplicationStat({
  title,
  value,
  icon: Icon,
  iconClassName,
}: ApplicationStatProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-50">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={18} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
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

/* -------------------------------------------------------
   QUICK ACTION
------------------------------------------------------- */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-200 group-hover:bg-slate-950 group-hover:text-white">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight
        size={16}
        className="ml-auto shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-600"
      />
    </Link>
  );
}