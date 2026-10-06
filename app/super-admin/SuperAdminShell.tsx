"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  LayoutDashboard,
  FileCheck2,
  Store,
  Users,
  CreditCard,
  IndianRupee,
  BarChart3,
  LifeBuoy,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface NavigationChild {
  label: string;
  href: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavigationChild[];
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/super-admin",
    icon: LayoutDashboard,
  },

  {
    name: "Applications",
    href: "/super-admin/applications",
    icon: FileCheck2,
  },

  {
    name: "Restaurants",
    href: "/super-admin/restaurants",
    icon: Store,
  },

  {
    name: "Owners",
    href: "/super-admin/owners",
    icon: Users,
  },

  {
    name: "Subscriptions",
    href: "/super-admin/subscriptions",
    icon: CreditCard,
    children: [
      {
        label: "Plans",
        href: "/super-admin/subscriptions",
      },
      {
        label: "Restaurant Subscriptions",
        href: "/super-admin/subscriptions/restaurant-subscriptions",
      },
      {
  label: "Invoices",
  href: "/super-admin/subscriptions/invoices",
},
    ],
  },

  {
    name: "Payments",
    href: "/super-admin/payments",
    icon: IndianRupee,
  },

  {
    name: "Analytics",
    href: "/super-admin/analytics",
    icon: BarChart3,
  },

  {
    name: "Support",
    href: "/super-admin/support",
    icon: LifeBuoy,
  },

  {
    name: "Settings",
    href: "/super-admin/settings",
    icon: Settings,
  },
];

interface SuperAdminShellProps {
  children: React.ReactNode;
}

export default function SuperAdminShell({
  children,
}: SuperAdminShellProps) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const subscriptionPathActive =
    pathname.startsWith("/super-admin/subscriptions");

  const [subscriptionsOpen, setSubscriptionsOpen] =
    useState(subscriptionPathActive);

  function getCurrentPage() {
    if (pathname === "/super-admin") {
      return "Dashboard";
    }

    for (const item of navigation) {
      if (
        item.href !== "/super-admin" &&
        pathname.startsWith(item.href)
      ) {
        return item.name;
      }
    }

    return "Super Admin";
  }

  const currentPage = getCurrentPage();

  async function handleLogout() {
    setLoggingOut(true);

    await signOut({
      callbackUrl: "/auth/login",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <Link
            href="/super-admin"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <span className="text-lg font-bold">
                R
              </span>
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                Restova
              </p>

              <p className="text-xs font-medium text-slate-500">
                Super Admin
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const hasChildren =
                Boolean(item.children?.length);

              const isActive =
                item.href === "/super-admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              /*
               * Navigation item with children
               */
              if (hasChildren) {
                return (
                  <div key={item.href}>
                    <button
                      type="button"
                      onClick={() =>
                        setSubscriptionsOpen(
                          (value) => !value
                        )
                      }
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600"
                        }
                      />

                      <span className="flex-1 text-left">
                        {item.name}
                      </span>

                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          subscriptionsOpen
                            ? "rotate-180"
                            : ""
                        } ${
                          isActive
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      />
                    </button>

                    {subscriptionsOpen && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3">
                        {item.children?.map(
                          (child) => {
                            const childActive =
                              pathname ===
                              child.href;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() =>
                                  setSidebarOpen(
                                    false
                                  )
                                }
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                                  childActive
                                    ? "bg-slate-100 font-semibold text-slate-900"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <Layers
                                  size={14}
                                  className={
                                    childActive
                                      ? "text-slate-700"
                                      : "text-slate-400"
                                  }
                                />

                                <span>
                                  {child.label}
                                </span>
                              </Link>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              /*
               * Normal navigation item
               */
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Profile */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              SA
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                Super Admin
              </p>

              <p className="truncate text-xs text-slate-500">
                Platform Administrator
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Super Admin
              </p>

              <h1 className="text-lg font-semibold text-slate-900">
                {currentPage}
              </h1>
            </div>
          </div>

          {/* Right profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileOpen((value) => !value)
              }
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-100"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Super Admin
                </p>

                <p className="text-xs text-slate-500">
                  Platform Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                SA
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                />

                <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        SA
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          Super Admin
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          Platform Administrator
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/super-admin/settings"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Settings size={17} />
                      Settings
                    </Link>

                    <button
                      type="button"
                      disabled={loggingOut}
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut size={17} />

                      {loggingOut
                        ? "Logging out..."
                        : "Logout"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Security banner */}
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck
              size={15}
              className="text-emerald-600"
            />

            <span>
              You are accessing the Restova platform
              administration panel.
            </span>
          </div>
        </div>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}