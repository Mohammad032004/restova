"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  {
    label: "Product",
    items: [
      { label: "QR Ordering", href: "#features" },
      { label: "Kitchen Management", href: "#features" },
      { label: "Table Management", href: "#features" },
      { label: "Billing & Payments", href: "#features" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "For Restaurants", href: "#solutions" },
      { label: "For Kitchen Teams", href: "#solutions" },
      { label: "For Staff", href: "#solutions" },
    ],
  },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav className="relative flex h-16 items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <span className="text-lg font-bold">R</span>
            </div>

            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-slate-950">
                Restova
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Restaurant OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const hasDropdown = "items" in item;

              if (!hasDropdown) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === item.label ? null : item.label
                      )
                    }
                  >
                    {item.label}

                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        openDropdown === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === item.label && (
                    <div className="absolute left-0 top-full pt-2">
                      <div className="w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Get Started
              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Mobile Navigation */}
          {mobileOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 lg:hidden">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const hasDropdown = "items" in item;

                  if (!hasDropdown) {
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === item.label ? null : item.label
                          )
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {item.label}

                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            openDropdown === item.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {openDropdown === item.label && (
                        <div className="ml-3 border-l border-slate-200 pl-3">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              onClick={() => setMobileOpen(false)}
                              className="block rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Get Started
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
