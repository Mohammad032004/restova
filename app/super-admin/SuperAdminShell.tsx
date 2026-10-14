"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Sun,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedSidebar = window.localStorage.getItem(
      "restova-sidebar-collapsed"
    );

    const savedTheme = window.localStorage.getItem("restova-theme");

    if (savedSidebar === "true") {
      setSidebarCollapsed(true);
    }

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;

      window.localStorage.setItem(
        "restova-sidebar-collapsed",
        String(next)
      );

      return next;
    });
  };

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;

      window.localStorage.setItem(
        "restova-theme",
        next ? "dark" : "light"
      );

      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return next;
    });
  };

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

    if (
      pathname.startsWith(
        "/super-admin/subscriptions/invoices"
      )
    ) {
      return "Invoices";
    }

    if (
      pathname.startsWith(
        "/super-admin/restaurant-subscriptions"
      )
    ) {
      return "Restaurant Subscriptions";
    }

    if (
      pathname.startsWith("/super-admin/subscriptions") &&
      !pathname.startsWith(
        "/super-admin/subscriptions/invoices"
      )
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

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/auth/login",
    });
  };

  const SidebarContent = ({
    mobile = false,
  }: {
    mobile?: boolean;
  }) => (
    <>
      {/* Sidebar Header */}
      <div
        className={`flex h-[76px] items-center border-b border-slate-200/80 px-4 dark:border-slate-800 ${
          sidebarCollapsed && !mobile
            ? "justify-center"
            : "justify-between"
        }`}
      >
        <Link
          href="/super-admin"
          onClick={() => mobile && setMobileOpen(false)}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-white shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 opacity-90" />

            <span className="relative text-lg font-black tracking-tight">
              R
            </span>
          </div>

          {(!sidebarCollapsed || mobile) && (
            <div className="min-w-0">
              <p className="text-[17px] font-bold tracking-tight text-slate-950 dark:text-white">
                Restova
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Platform Admin
              </p>
            </div>
          )}
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              {(!sidebarCollapsed || mobile) && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {section.label}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.href}
                      className="group relative"
                    >
                      <Link
                        href={item.href}
                        onClick={() =>
                          mobile && setMobileOpen(false)
                        }
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                          sidebarCollapsed && !mobile
                            ? "justify-center"
                            : ""
                        } ${
                          active
                            ? "bg-blue-600 font-semibold text-white shadow-sm shadow-blue-600/20"
                            : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                            active
                              ? "bg-white/15 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-white"
                          }`}
                        >
                          <Icon
                            size={17}
                            strokeWidth={1.9}
                          />
                        </span>

                        {(!sidebarCollapsed || mobile) && (
                          <span className="truncate">
                            {item.label}
                          </span>
                        )}

                        {!sidebarCollapsed &&
                          active &&
                          !mobile && (
                            <ChevronRight
                              size={15}
                              className="ml-auto text-white/80"
                            />
                          )}
                      </Link>

                      {/* Collapsed Sidebar Tooltip */}
                      {sidebarCollapsed && !mobile && (
                        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Status */}
      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
        <div
          className={`rounded-2xl bg-slate-50 p-3 dark:bg-slate-900 ${
            sidebarCollapsed && !mobile
              ? "flex justify-center"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
              <ShieldCheck size={17} />
            </div>

            {(!sidebarCollapsed || mobile) && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  Platform Status
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    All systems operational
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950 transition-colors duration-300 dark:bg-[#0b1120] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white transition-[width] duration-300 dark:border-slate-800 dark:bg-[#0f172a] lg:flex lg:flex-col ${
          sidebarCollapsed
            ? "w-[76px]"
            : "w-[270px]"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[285px] flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-[#0f172a] lg:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <SidebarContent mobile />
      </aside>

      {/* Main Application */}
      <div
        className={`transition-[padding] duration-300 ${
          sidebarCollapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[270px]"
        }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-[76px] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1120]/95">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              {/* Desktop Sidebar Toggle */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:flex"
                aria-label={
                  sidebarCollapsed
                    ? "Expand navigation"
                    : "Collapse navigation"
                }
                title={
                  sidebarCollapsed
                    ? "Expand navigation"
                    : "Collapse navigation"
                }
              >
                <Menu size={19} />
              </button>

              {/* Mobile Sidebar Toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
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
                    className="hidden text-slate-300 sm:block dark:text-slate-600"
                  />

                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {getPageTitle()}
                  </p>
                </div>

                <p className="mt-0.5 hidden text-[11px] text-slate-400 md:block">
                  Manage your Restova platform
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative hidden w-[220px] xl:block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  placeholder="Search restaurants, owners, invoices..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-16 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-900"
                />

                <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 2xl:block">
                  ⌘K
                </span>
              </div>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={
                    darkMode
                      ? "Switch to light theme"
                      : "Switch to dark theme"
                  }
                  title={
                    darkMode
                      ? "Light theme"
                      : "Dark theme"
                  }
                >
                  {darkMode ? (
                    <Sun size={18} />
                  ) : (
                    <Moon size={18} />
                  )}
                </button>
              )}

              {/* Operational Status */}
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 xl:flex dark:border-slate-700 dark:bg-slate-900">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Operational
                </span>
              </div>

              {/* Notifications */}
              <button
                type="button"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={18} />

                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-700" />

              {/* Profile */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen((current) => !current)
                  }
                  className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-sm">
                    SA
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Super Admin
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Administrator
                    </p>
                  </div>

                  <ChevronDown
                    size={15}
                    className={`hidden text-slate-400 transition-transform sm:block ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <>
                    {/* Close profile dropdown */}
                    <button
                      type="button"
                      aria-label="Close profile menu"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    />

                    {/* Profile dropdown */}
                    <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                            SA
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                              Super Admin
                            </p>

                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
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
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <Settings size={17} />
                          Settings
                        </Link>

                        <Link
                          href="/super-admin/support"
                          onClick={() =>
                            setProfileOpen(false)
                          }
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <HelpCircle size={17} />
                          Help & Support
                        </Link>

                        <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
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