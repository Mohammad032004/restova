"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Unable to load your session.");
        setLoading(false);
        return;
      }

      const session = await response.json();

      const role = session?.user?.role;

      switch (role) {
        case "SUPER_ADMIN":
          const session = await getSession();

if (!session?.user?.role) {
  setError("Unable to determine your account role.");
  return;
}

switch (session.user.role) {
  case "SUPER_ADMIN":
    window.location.href = "/super-admin";
    break;

  case "RESTAURANT_OWNER":
  case "MANAGER":
    window.location.href = "/dashboard";
    break;

  case "KITCHEN":
    window.location.href = "/kitchen";
    break;

  case "WAITER":
    window.location.href = "/waiter";
    break;

  case "CASHIER":
    window.location.href = "/cashier";
    break;

  default:
    setError("Your account role is not supported.");
}
          break;

        case "RESTAURANT_OWNER":
        case "MANAGER":
        case "KITCHEN":
        case "WAITER":
        case "CASHIER":
          window.location.href = "/dashboard";
          break;

        default:
          setError("Your account does not have a valid role.");
          setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side */}
        <section className="relative hidden overflow-hidden bg-[#0f172a] lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0f172a]">
                  <span className="text-xl font-bold">R</span>
                </div>

                <div>
                  <p className="text-xl font-bold text-white">Restova</p>
                  <p className="text-xs text-slate-400">
                    Restaurant Management Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                <ShieldCheck size={16} />
                Secure restaurant management
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Manage your restaurant
                <span className="block text-slate-400">
                  smarter with Restova.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Manage orders, tables, kitchen operations, staff and payments
                from one powerful platform built for modern restaurants.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Restaurant operations
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-2xl font-bold text-white">QR</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Contactless ordering
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Restova. All rights reserved.
            </p>
          </div>
        </section>

        {/* Right Side */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f172a] text-white">
                <span className="text-xl font-bold">R</span>
              </div>

              <div>
                <p className="text-xl font-bold">Restova</p>
                <p className="text-xs text-slate-500">
                  Restaurant Management Platform
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-indigo-600">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Sign in to Restova
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account credentials to continue.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    onClick={() => {
                      setError(
                        "Please contact your administrator to reset your password."
                      );
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have a restaurant account?{" "}
                <a
                  href="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Get started
                </a>
              </p>
            </div>

            {/* Security */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} />
              Your login is securely encrypted
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}