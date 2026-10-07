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
  ShieldCheck,
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
  glowClass: string;
  iconClass: string;
  accentClass: string;
}

interface SmallStatProps {
  title: string;
  value: string;
  icon: React.ElementType;
  glowClass: string;
  iconClass: string;
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
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    function updateGreeting() {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }
    }

    updateGreeting();

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
    <>
      <style jsx>{`
        @keyframes restova-flow-one {
          0% {
            transform: translate3d(-8%, -5%, 0) scale(1);
          }

          50% {
            transform: translate3d(8%, 8%, 0) scale(1.12);
          }

          100% {
            transform: translate3d(-8%, -5%, 0) scale(1);
          }
        }

        @keyframes restova-flow-two {
          0% {
            transform: translate3d(8%, 5%, 0) scale(1.05);
          }

          50% {
            transform: translate3d(-10%, -6%, 0) scale(1);
          }

          100% {
            transform: translate3d(8%, 5%, 0) scale(1.05);
          }
        }

        @keyframes restova-shine {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(220%);
          }
        }

        .restova-flow-one {
          animation: restova-flow-one 9s ease-in-out infinite;
        }

        .restova-flow-two {
          animation: restova-flow-two 11s ease-in-out infinite;
        }

        .restova-shine {
          animation: restova-shine 7s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-[calc(100vh-76px)] bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1500px]">

          {/* =====================================================
              ADMIN WELCOME HEADER
          ====================================================== */}

          <section className="relative mb-8 overflow-hidden rounded-[28px] border border-indigo-200/70 shadow-sm">
            {/* Main background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-violet-50 to-cyan-100" />

            {/* Moving color 1 */}
            <div className="restova-flow-one absolute -left-24 -top-28 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />

            {/* Moving color 2 */}
            <div className="restova-flow-two absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />

            {/* Moving color 3 */}
            <div className="restova-flow-one absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

            {/* Soft overlay */}
            <div className="absolute inset-0 bg-white/35" />

            {/* Header content */}
            <div className="relative px-6 py-9 sm:px-8 sm:py-10 lg:px-10 lg:py-11">
              <div className="max-w-3xl">
                <p className="text-sm font-medium text-slate-500">
                  Welcome back
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]">
                  {greeting}, Administrator
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Manage restaurants, owners, subscriptions,
                  payments and the overall Restova platform from
                  one place.
                </p>
              </div>
            </div>
          </section>

          {/* =====================================================
              ERROR
          ====================================================== */}

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

          {/* =====================================================
              KEY METRICS TITLE
          ====================================================== */}

          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Key Metrics
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Platform at a glance
              </h2>
            </div>

            <p className="hidden text-xs text-slate-400 sm:block">
              Live platform statistics
            </p>
          </div>

          {/* =====================================================
              MAIN KPI CARDS
          ====================================================== */}

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
              glowClass="bg-indigo-300/40"
              iconClass="bg-indigo-50 text-indigo-600"
              accentClass="bg-indigo-500"
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
              glowClass="bg-amber-300/40"
              iconClass="bg-amber-50 text-amber-600"
              accentClass="bg-amber-500"
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
              glowClass="bg-cyan-300/40"
              iconClass="bg-cyan-50 text-cyan-600"
              accentClass="bg-cyan-500"
            />

            <StatCard
              title="Platform Revenue"
              value="₹0"
              description="Revenue generated this month"
              icon={CreditCard}
              glowClass="bg-emerald-300/40"
              iconClass="bg-emerald-50 text-emerald-600"
              accentClass="bg-emerald-500"
            />
          </div>

          {/* =====================================================
              SECONDARY METRICS
          ====================================================== */}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SmallStat
              title="Active Restaurants"
              value={
                loading
                  ? "—"
                  : activeRestaurants.toString()
              }
              icon={CheckCircle2}
              glowClass="bg-emerald-300/30"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <SmallStat
              title="Suspended Restaurants"
              value={
                loading
                  ? "—"
                  : suspendedRestaurants.toString()
              }
              icon={Building2}
              glowClass="bg-red-300/30"
              iconClass="bg-red-50 text-red-600"
            />

            <SmallStat
              title="Support Requests"
              value="0"
              icon={LifeBuoy}
              glowClass="bg-blue-300/30"
              iconClass="bg-blue-50 text-blue-600"
            />

            <SmallStat
              title="Platform Growth"
              value="0%"
              icon={BarChart3}
              glowClass="bg-violet-300/30"
              iconClass="bg-violet-50 text-violet-600"
            />
          </div>

          {/* =====================================================
              APPLICATIONS + QUICK ACTIONS
          ====================================================== */}

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)]">

            {/* Applications */}

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText size={17} />
                    </span>

                    <div>
                      <h2 className="font-semibold text-slate-950">
                        Restaurant Applications
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Application pipeline
                      </p>
                    </div>
                  </div>
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
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <WalletCards size={17} />
                  </span>

                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Quick Actions
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Platform management
                    </p>
                  </div>
                </div>
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

          {/* =====================================================
              PLATFORM STATUS
          ====================================================== */}

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
    </>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  glowClass,
  iconClass,
  accentClass,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
      {/* Animated background */}

      <div
        className={`restova-flow-one pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full ${glowClass} blur-3xl`}
      />

      <div
        className={`restova-flow-two pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full ${glowClass} opacity-60 blur-3xl`}
      />

      {/* Hover shine */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="restova-shine absolute -left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
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
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass} shadow-sm`}
          >
            <Icon
              size={19}
              strokeWidth={2}
            />
          </div>
        </div>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full w-2/5 rounded-full ${accentClass} transition-all duration-700 group-hover:w-3/5`}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL STAT
========================================================= */

function SmallStat({
  title,
  value,
  icon: Icon,
  glowClass,
  iconClass,
}: SmallStatProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`restova-flow-one pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full ${glowClass} blur-2xl`}
      />

      <div className="relative flex items-center gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass} transition-all duration-200`}
        >
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

/* =========================================================
   APPLICATION STAT
========================================================= */

function ApplicationStat({
  title,
  value,
  icon: Icon,
  iconClassName,
}: ApplicationStatProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-slate-50">
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

/* =========================================================
   QUICK ACTION
========================================================= */

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