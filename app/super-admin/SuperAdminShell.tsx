"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
  X,
} from "lucide-react";

interface SuperAdminShellProps {
  children: React.ReactNode;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/super-admin",
        icon: LayoutDashboard,
      },
      {
        label: "Analytics",
        href: "/super-admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Restaurants",
    items: [
      {
        label: "Applications",
        href: "/super-admin/applications",
        icon: FileText,
      },
      {
        label: "Restaurants",
        href: "/super-admin/restaurants",
        icon: Store,
      },
      {
        label: "Restaurant Owners",
        href: "/super-admin/owners",
        icon: Users,
      },
    ],
  },
  {
    label: "Subscriptions",
    items: [
      {
        label: "Plans",
        href: "/super-admin/subscriptions",
        icon: WalletCards,
      },
      {
        label: "Restaurant Subscriptions",
        href: "/super-admin/restaurant-subscriptions",
        icon: CreditCard,
      },
      {
        label: "Invoices",
        href: "/super-admin/subscriptions/invoices",
        icon: FileText,
      },
      {
        label: "Payments",
        href: "/super-admin/payments",
        icon: Activity,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        label: "Support",
        href: "/super-admin/support",
        icon: LifeBuoy,
      },
      {
        label: "Settings",
        href: "/super-admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function SuperAdminShell({
  children,
}: SuperAdminShellProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname === "/super-admin") {
      return "Dashboard";
    }

    if (pathname.startsWith("/super-admin/applications")) {
      return "Applications";
    }

    if (pathname.startsWith("/super-admin/restaurants")) {
      return "Restaurants";
    }

    if (pathname.startsWith("/super-admin/owners")) {
      return "Restaurant Owners";
    }

    if (pathname.startsWith("/super-admin/subscriptions/invoices")) {
      return "Invoices";
    }

    if (pathname.startsWith("/super-admin/restaurant-subscriptions")) {
      return "Restaurant Subscriptions";
    }

    if (
      pathname.startsWith("/super-admin/subscriptions") &&
      !pathname.startsWith("/super-admin/subscriptions/invoices")
    ) {
      return "Subscription Plans";
    }

    if (pathname.startsWith("/super-admin/payments")) {
      return "Payments";
    }

    if (pathname.startsWith("/super-admin/analytics")) {
      return "Analytics";
    }

    if (pathname.startsWith("/super-admin/support")) {
      return "Support";
    }

    if (pathname.startsWith("/super-admin/settings")) {
      return "Settings";
    }

    return "Super Admin";
  };

  const isActive = (href: string) => {
    if (href === "/super-admin") {
      return pathname === "/super-admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/auth/login",
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] border-r border-slate-200/80 bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-[76px] items-center border-b border-slate-100 px-6">
          <Link
            href="/super-admin"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-white shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 opacity-90" />

              <span className="relative text-lg font-black tracking-tight">
                R
              </span>
            </div>

            <div>
              <p className="text-[17px] font-bold tracking-tight text-slate-950">
                Restova
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Platform Admin
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                        )}

                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900"
                          }`}
                        >
                          <Icon size={17} strokeWidth={1.9} />
                        </span>

                        <span className="truncate">
                          {item.label}
                        </span>

                        {active && (
                          <ChevronRight
                            size={15}
                            className="ml-auto text-white/60"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <ShieldCheck size={17} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900">
                  Platform Protected
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Admin access secured
                </p>
              </div>

              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[285px] flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Mobile Logo */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/super-admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400" />

              <span className="relative text-lg font-black">
                R
              </span>
            </div>

            <div>
              <p className="text-[17px] font-bold tracking-tight text-slate-950">
                Restova
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Platform Admin
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-slate-950 text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon size={17} />
                        </span>

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile Bottom */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
              <ShieldCheck size={17} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-900">
                Secure Admin
              </p>

              <p className="text-[11px] text-slate-500">
                Protected access
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Application */}
      <div className="lg:pl-[270px]">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-[76px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile menu */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="hidden text-xs font-medium text-slate-400 sm:block">
                    Super Admin
                  </p>

                  <ChevronRight
                    size={13}
                    className="hidden text-slate-300 sm:block"
                  />

                  <p className="truncate text-sm font-semibold text-slate-900">
                    {getPageTitle()}
                  </p>
                </div>

                <p className="mt-0.5 hidden text-[11px] text-slate-400 md:block">
                  Manage your Restova platform
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Status */}
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 md:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-medium text-slate-600">
                  Operational
                </span>
              </div>

              {/* Notifications */}
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                aria-label="Notifications"
              >
                <Bell size={18} />

                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-white" />
              </button>

              {/* Divider */}
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              {/* Profile */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen((current) => !current)
                  }
                  className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-sm">
                    SA
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold text-slate-900">
                      Super Admin
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Administrator
                    </p>
                  </div>

                  <ChevronDown
                    size={15}
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
                      onClick={() => setProfileOpen(false)}
                    />

                    <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                      <div className="border-b border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                            SA
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
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
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <Settings size={17} />
                          Settings
                        </Link>

                        <Link
                          href="/super-admin/support"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <HelpCircle size={17} />
                          Help & Support
                        </Link>

                        <div className="my-2 h-px bg-slate-100" />

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut size={17} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-76px)]">
          {children}
        </main>
      </div>
    </div>
  );
}