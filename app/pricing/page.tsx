
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChefHat,
  CircleHelp,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

type BillingCycle = "MONTHLY" | "YEARLY";

interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  maxTables: number;
  maxStaff: number;
}

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const planOrder = ["basic", "growth", "pro"];

const getPlanRank = (name: string) => {
  const index = planOrder.indexOf(name.toLowerCase());
  return index === -1 ? 99 : index;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("MONTHLY");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/public/subscription-plans",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Could not load subscription plans."
          );
        }

        if (!cancelled) {
          setPlans(data.plans ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading plans."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePlans = useMemo(() => {
    return plans
      .filter((plan) => plan.billingCycle === billingCycle)
      .sort(
        (a, b) =>
          getPlanRank(a.name) - getPlanRank(b.name) ||
          a.price - b.price
      );
  }, [plans, billingCycle]);

  const yearlySavings = (name: string) => {
    const monthly = plans.find(
      (plan) =>
        plan.name.toLowerCase() === name.toLowerCase() &&
        plan.billingCycle === "MONTHLY"
    );

    const yearly = plans.find(
      (plan) =>
        plan.name.toLowerCase() === name.toLowerCase() &&
        plan.billingCycle === "YEARLY"
    );

    if (!monthly || !yearly || monthly.price <= 0) return null;

    const savings =
      monthly.price * 12 - yearly.price;

    if (savings <= 0) return null;

    return Math.round(
      (savings / (monthly.price * 12)) * 100
    );
  };

  const registrationLink = (plan: SubscriptionPlan) =>
    `/register?planId=${encodeURIComponent(plan._id)}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b12] text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-white/[0.08]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-105">
              <ChefHat size={23} />
            </span>
            <span className="text-2xl font-bold tracking-tight">
              Restova
              <span className="text-violet-400">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm text-slate-300 transition hover:text-white sm:block"
            >
              Home
            </Link>
            <Link
              href="/auth/login"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:border-white/25 hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-4 py-2 text-sm text-violet-200">
          <Sparkles size={15} />
          Simple, transparent pricing
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          The right plan for
          <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            your restaurant
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Manage your menu, tables, orders and team from one
          place. Choose a plan that fits your restaurant and
          grow at your own pace.
        </p>

        {/* Billing toggle */}
        <div className="mt-9 inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              billingCycle === "MONTHLY"
                ? "bg-white text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
              billingCycle === "YEARLY"
                ? "bg-white text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Yearly
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                billingCycle === "YEARLY"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-400/10 text-emerald-300"
              }`}
            >
              SAVE MORE
            </span>
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Prices and features are loaded from Restova&apos;s active
          subscription plans.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        {loading && (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
            <LoaderCircle className="animate-spin" size={22} />
            Loading subscription plans...
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6 text-center">
            <p className="font-semibold text-red-200">
              Unable to load pricing
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && visiblePlans.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <CircleHelp className="mx-auto text-slate-400" size={32} />
            <h2 className="mt-4 text-xl font-semibold">
              Plans are coming soon
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              No active {billingCycle.toLowerCase()} plans are
              available right now. Please check back soon.
            </p>
          </div>
        )}

        {!loading && !error && visiblePlans.length > 0 && (
          <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const isPopular =
                plan.name.toLowerCase() === "growth";
              const savings = yearlySavings(plan.name);

              return (
                <article
                  key={plan._id}
                  className={`group relative flex flex-col rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 sm:p-8 ${
                    isPopular
                      ? "border-violet-400/60 bg-gradient-to-b from-violet-500/[0.12] to-white/[0.025] shadow-[0_0_60px_rgba(139,92,246,0.10)]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {plan.name}
                      </h2>
                      <p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">
                        {plan.description ||
                          `A ${plan.name} plan for your restaurant.`}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isPopular
                          ? "bg-violet-400/15 text-violet-300"
                          : "bg-white/[0.06] text-slate-300"
                      }`}
                    >
                      {isPopular ? (
                        <Zap size={22} />
                      ) : (
                        <ChefHat size={22} />
                      )}
                    </div>
                  </div>

                  <div className="mt-7 border-b border-white/10 pb-7">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                        {money(plan.price)}
                      </span>
                      <span className="text-sm text-slate-400">
                        / {billingCycle === "MONTHLY" ? "month" : "year"}
                      </span>
                    </div>

                    {billingCycle === "YEARLY" && savings !== null && (
                      <p className="mt-3 text-sm font-medium text-emerald-300">
                        Save {savings}% compared with monthly billing
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-500">
                      {billingCycle === "YEARLY"
                        ? "Billed yearly"
                        : "Billed monthly"}
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                        <p className="text-xl font-bold">
                          {plan.maxTables}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Tables included
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                        <p className="text-xl font-bold">
                          {plan.maxStaff}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Staff accounts
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      What&apos;s included
                    </p>

                    {plan.features.length > 0 ? (
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li
                            key={`${plan._id}-${index}`}
                            className="flex items-start gap-3 text-sm leading-5 text-slate-300"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                              <Check size={13} strokeWidth={3} />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Contact us for plan details.
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-8">
                    <Link
                      href={registrationLink(plan)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition ${
                        isPopular
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
                          : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/[0.09]"
                      }`}
                    >
                      Get Started
                      <ArrowRight size={17} />
                    </Link>
                    <p className="mt-3 text-center text-xs text-slate-500">
                      Secure checkout after registration
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust section */}
      <section className="relative z-10 border-t border-white/[0.08] bg-white/[0.015]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={23} />
            </div>
            <div>
              <h3 className="font-semibold">Secure payments</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Subscription payments are processed through
                secure checkout.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <Sparkles size={23} />
            </div>
            <div>
              <h3 className="font-semibold">Built for restaurants</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                One workspace for the tools your restaurant
                needs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <CircleHelp size={23} />
            </div>
            <div>
              <h3 className="font-semibold">Need help choosing?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Choose the plan that best matches your
                restaurant&apos;s size.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:px-8">
          <Link href="/" className="font-bold text-white">
            Restova<span className="text-violet-400">.</span>
          </Link>
          <p>
            A New Era for Restaurants.
          </p>
          <p>
            © {new Date().getFullYear()} Restova. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
