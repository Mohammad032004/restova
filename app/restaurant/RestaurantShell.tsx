"use client";

import { ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Bell,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Store,
  Table2,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";

interface RestaurantShellProps {
  children: ReactNode;
  userName: string;
  userRole: string;
  restaurantName: string;
}

const navigation = [
  {
    title: "Overview",
    href: "/restaurant",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/restaurant/orders",
    icon: ClipboardList,
  },
  {
    title: "Tables",
    href: "/restaurant/tables",
    icon: Table2,
  },
  {
    title: "Menu",
    href: "/restaurant/menu",
    icon: UtensilsCrossed,
  },
  {
    title: "Staff",
    href: "/restaurant/staff",
    icon: Users,
  },
  {
    title: "Kitchen",
    href: "/restaurant/kitchen",
    icon: ChefHat,
  },
  {
    title: "Billing",
    href: "/restaurant/billing",
    icon: ShoppingBag,
  },
  {
    title: "Analytics",
    href: "/restaurant/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/restaurant/settings",
    icon: Settings,
  },
];

export default function RestaurantShell({
  children,
  userName,
  userRole,
  restaurantName,
}: RestaurantShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await signOut({
      callbackUrl: "/auth/login",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
          <a
            href="/restaurant"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
              R
            </div>

            <div>
              <p className="text-lg font-bold text-slate-900">Restova</p>
              <p className="text-xs text-slate-500">
                Restaurant Management
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Restaurant */}
        <div className="border-b border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                {restaurantName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {restaurantName}
                </p>

                <p className="text-xs text-emerald-600">
                  Active restaurant
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Management
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <Icon size={19} />
                  <span>{item.title}</span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>

            <div className="hidden sm:block">
              <p className="text-xs text-slate-400">Restaurant</p>
              <p className="max-w-xs truncate text-sm font-semibold text-slate-900">
                {restaurantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            {/* User */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-36 truncate text-sm font-semibold text-slate-900">
                  {userName}
                </p>

                <p className="text-xs text-slate-500">
                  {userRole.replaceAll("_", " ")}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}