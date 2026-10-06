"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav>
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                R
              </div>

              <div>
                <p className="text-lg font-bold leading-none tracking-tight text-slate-950">
                  Restova
                </p>

                <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Restaurant OS
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="#features"
                className="px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                Features
              </Link>

              <Link
                href="#how-it-works"
                className="px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                How It Works
              </Link>

              <Link
                href="#pricing"
                className="px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                Pricing
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileOpen && (
            <div className="border-t border-slate-200 py-4 md:hidden">
              <div className="space-y-1">
                <Link
                  href="#features"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-sm font-medium text-slate-700"
                >
                  Features
                </Link>

                <Link
                  href="#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-sm font-medium text-slate-700"
                >
                  How It Works
                </Link>

                <Link
                  href="#pricing"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-sm font-medium text-slate-700"
                >
                  Pricing
                </Link>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-sm font-semibold text-slate-700"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}