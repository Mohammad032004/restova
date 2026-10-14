
"use client";

import Link from "next/link";
import { Menu, X, ArrowUpRight, ChefHat } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Main navigation"
          className={`relative rounded-2xl border transition-all duration-300 ${
            scrolled
              ? "border-white/90 bg-white/85 shadow-[0_12px_40px_rgba(15,23,42,0.09)] backdrop-blur-2xl"
              : "border-white/70 bg-white/65 shadow-[0_8px_32px_rgba(15,23,42,0.045)] backdrop-blur-xl"
          }`}
        >
          <div className="flex h-[68px] items-center justify-between px-4 sm:px-6">
            {/* Brand */}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="group flex shrink-0 items-center gap-3"
            >
              <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-800 to-violet-950 text-white shadow-lg shadow-slate-950/15 transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <ChefHat size={21} strokeWidth={1.8} />
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-violet-400/80 blur-sm" />
              </span>

              <span>
                <span className="block text-lg font-bold leading-none tracking-tight text-slate-950">
                  Restova<span className="text-violet-600">.</span>
                </span>
                <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[0.19em] text-slate-500">
                  Restaurant OS
                </span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group relative rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-white/80 hover:text-slate-950"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-4 right-4 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-transform duration-200 group-hover:scale-x-100" />
                </Link>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2.5 md:flex">
              <Link
                href="/auth/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white/80 hover:text-slate-950"
              >
                Sign in
              </Link>

              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-600/20"
              >
                Get Started
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 transition hover:bg-white md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile dropdown */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 md:hidden ${
              mobileOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
            aria-hidden={!mobileOpen}
          >
            <div className="overflow-hidden">
              <div className="mx-3 mb-3 rounded-xl border border-white/80 bg-white/80 p-2 shadow-inner shadow-slate-900/[0.025] backdrop-blur-xl">
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      tabIndex={mobileOpen ? 0 : -1}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      {link.label}
                      <ArrowUpRight size={15} className="text-slate-400" />
                    </Link>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3">
                  <Link
                    href="/auth/login"
                    tabIndex={mobileOpen ? 0 : -1}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/pricing"
                    tabIndex={mobileOpen ? 0 : -1}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    Get Started
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
