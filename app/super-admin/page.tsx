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

export default function SuperAdminPage() {
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

        {/* Main stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Restaurants"
            value="1"
            description="Active restaurants"
            icon={Store}
          />

          <StatCard
            title="Pending Applications"
            value="0"
            description="Awaiting review"
            icon={Clock3}
          />

          <StatCard
            title="Restaurant Owners"
            value="1"
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
            value="1"
            icon={CheckCircle2}
          />

          <SmallStat
            title="Suspended"
            value="0"
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

        {/* Main content */}
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

            <div className="p-6">
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
          <p className="text-sm text-slate-500">{title}</p>

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
        <p className="text-xs text-slate-500">{title}</p>

        <p className="mt-1 text-xl font-bold text-slate-950">
          {value}
        </p>
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