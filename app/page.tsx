
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Table2,
  Users,
  Utensils,
  WalletCards,
  Zap,
  Sparkles,
  Clock3,
  TrendingUp,
  CircleCheck,
} from "lucide-react";

import Navbar from "@/components/navbar";

const features = [
  {
    icon: QrCode,
    title: "QR Ordering",
    description:
      "Let customers scan their table QR, explore your digital menu, and place orders directly from their phones.",
    color: "from-violet-500 to-indigo-500",
    glow: "group-hover:shadow-violet-500/15",
  },
  {
    icon: ChefHat,
    title: "Kitchen Management",
    description:
      "Give your kitchen team a focused workspace to accept orders, prepare food, and mark orders ready.",
    color: "from-orange-400 to-rose-500",
    glow: "group-hover:shadow-orange-500/15",
  },
  {
    icon: Table2,
    title: "Table Management",
    description:
      "Track occupancy independently from payments and release tables when guests have finished dining.",
    color: "from-blue-500 to-cyan-500",
    glow: "group-hover:shadow-blue-500/15",
  },
  {
    icon: WalletCards,
    title: "Billing & Payments",
    description:
      "Keep billing and payment statuses organized across your restaurant's daily operations.",
    color: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/15",
  },
  {
    icon: Users,
    title: "Staff Management",
    description:
      "Give owners, managers, kitchen staff, waiters, and cashiers access to the tools they need.",
    color: "from-fuchsia-500 to-violet-500",
    glow: "group-hover:shadow-fuchsia-500/15",
  },
  {
    icon: BarChart3,
    title: "Restaurant Analytics",
    description:
      "Understand restaurant activity, orders, revenue, table utilization, and operational performance.",
    color: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-sky-500/15",
  },
];

const workflow = [
  {
    number: "01",
    icon: QrCode,
    title: "Customer scans the QR",
    description:
      "A unique table QR connects guests to the correct restaurant and table.",
  },
  {
    number: "02",
    icon: Smartphone,
    title: "Customer places an order",
    description:
      "Guests browse the menu, add dishes to their cart, and submit an order.",
  },
  {
    number: "03",
    icon: ChefHat,
    title: "Kitchen prepares it",
    description:
      "The kitchen receives orders and moves them through the preparation workflow.",
  },
  {
    number: "04",
    icon: Utensils,
    title: "Waiter serves",
    description:
      "The waiter sees ready orders, serves the food, and updates the order status.",
  },
  {
    number: "05",
    icon: CreditCard,
    title: "Payment is handled",
    description:
      "The cashier manages billing and payment without confusing payment with table status.",
  },
  {
    number: "06",
    icon: Table2,
    title: "Table is released",
    description:
      "Authorized staff release the table when guests leave so it can be used again.",
  },
];

const benefits = [
  "QR-based customer ordering",
  "Role-based restaurant staff access",
  "Kitchen-focused order workflow",
  "Independent payment and table states",
  "Server-side order validation",
  "Multi-restaurant SaaS architecture",
];

const operations = [
  {
    icon: ChefHat,
    title: "Kitchen",
    subtitle: "Prepare every order with clarity",
    description:
      "A focused workspace for incoming orders, preparation progress, and ready-to-serve dishes.",
    tag: "PREPARATION",
    tagClass: "bg-orange-50 text-orange-700 ring-orange-200",
    iconClass: "from-orange-400 to-rose-500",
  },
  {
    icon: Utensils,
    title: "Waiter",
    subtitle: "Keep service moving",
    description:
      "See ready orders, serve guests, and manage table handoffs with a clear workflow.",
    tag: "SERVICE",
    tagClass: "bg-blue-50 text-blue-700 ring-blue-200",
    iconClass: "from-blue-500 to-indigo-500",
  },
  {
    icon: CreditCard,
    title: "Cashier",
    subtitle: "Keep billing organized",
    description:
      "Handle bills and payment states while keeping physical table occupancy accurate.",
    tag: "BILLING",
    tagClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    iconClass: "from-emerald-500 to-teal-500",
  },
];

const glassCard =
  "rounded-3xl border border-white/90 bg-white/70 shadow-[0_8px_35px_rgba(15,23,42,0.045)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_22px_60px_rgba(79,70,229,0.09)]";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-950 selection:bg-violet-100 selection:text-violet-950">
      <Navbar />

      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-64 left-1/2 h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-violet-200/35 blur-[130px]" />
        <div className="absolute right-[-180px] top-[20%] h-[500px] w-[500px] rounded-full bg-sky-200/35 blur-[130px]" />
        <div className="absolute bottom-[10%] left-[-180px] h-[460px] w-[460px] rounded-full bg-indigo-200/25 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(#475569 0.7px, transparent 0.7px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* HERO */}
        <section className="relative overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-36 lg:pb-28 lg:pt-40">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/90 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-[0_5px_25px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                The modern restaurant operating system
                <ArrowRight size={14} className="text-violet-500" />
              </div>

              <h1 className="text-5xl font-bold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[76px]">
                Everything your restaurant needs.
                <span className="mt-2 block bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-500 bg-clip-text pb-2 text-transparent">
                  One powerful platform.
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Restova brings customer ordering, kitchen operations, tables,
                staff, billing, and payments together in one beautifully
                connected restaurant operating system.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:from-violet-700 hover:to-indigo-700 hover:shadow-[0_16px_35px_rgba(99,102,241,0.25)] sm:w-auto"
                >
                  Get Started
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href="#how-it-works"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white bg-white/65 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:bg-white hover:text-violet-700 hover:shadow-lg sm:w-auto"
                >
                  Explore the platform
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500 sm:text-sm">
                {[
                  "Built for restaurants",
                  "Role-based access",
                  "Connected operations",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="relative mx-auto mt-16 max-w-6xl sm:mt-20">
              <div className="absolute inset-x-[10%] top-16 h-64 rounded-full bg-violet-300/30 blur-[100px]" />

              <div className="relative overflow-hidden rounded-[26px] border border-white/90 bg-white/75 shadow-[0_35px_100px_rgba(15,23,42,0.13)] backdrop-blur-2xl">
                <div className="flex h-14 items-center border-b border-slate-200/70 bg-white/75 px-5">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-300" />
                    <span className="h-3 w-3 rounded-full bg-amber-300" />
                    <span className="h-3 w-3 rounded-full bg-emerald-300" />
                  </div>
                  <div className="mx-auto hidden h-8 w-72 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-[11px] text-slate-400 sm:flex">
                    app.restova.com/dashboard
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live preview
                  </div>
                </div>

                <div className="grid min-h-[440px] grid-cols-12 bg-slate-50/65">
                  <aside className="col-span-3 hidden border-r border-slate-200/70 bg-white/65 p-5 sm:block lg:col-span-2">
                    <div className="mb-8 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-xs font-bold text-white shadow-lg shadow-violet-500/20">
                        R
                      </div>
                      <span className="text-sm font-bold">Restova</span>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        "Overview",
                        "Orders",
                        "Menu",
                        "Tables",
                        "Staff",
                        "Billing",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-xl px-3 py-2.5 text-xs transition ${
                            index === 0
                              ? "bg-violet-50 font-semibold text-violet-700 ring-1 ring-violet-100"
                              : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="col-span-12 p-4 sm:col-span-9 sm:p-6 lg:col-span-10 lg:p-8">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          Your restaurant at a glance
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight">
                          Restaurant Overview
                        </h2>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm">
                        <Bell size={16} />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {[
                        {
                          label: "Total Orders",
                          value: "128",
                          icon: Utensils,
                          color: "text-violet-600 bg-violet-50",
                        },
                        {
                          label: "Revenue",
                          value: "₹42,680",
                          icon: TrendingUp,
                          color: "text-emerald-600 bg-emerald-50",
                        },
                        {
                          label: "Tables",
                          value: "18 / 24",
                          icon: Table2,
                          color: "text-blue-600 bg-blue-50",
                        },
                        {
                          label: "Pending",
                          value: "12",
                          icon: Clock3,
                          color: "text-orange-600 bg-orange-50",
                        },
                      ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div
                            key={stat.label}
                            className="rounded-2xl border border-white bg-white/85 p-4 shadow-[0_5px_20px_rgba(15,23,42,0.035)]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-500">
                                {stat.label}
                              </span>
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}
                              >
                                <Icon size={15} />
                              </span>
                            </div>
                            <p className="mt-3 text-xl font-bold tracking-tight">
                              {stat.value}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-white bg-white/85 p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)] lg:col-span-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold">Recent Orders</h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>

                        <div className="mt-5 space-y-3">
                          {[
                            ["#1024", "Table 08", "Preparing"],
                            ["#1023", "Table 14", "Ready"],
                            ["#1022", "Table 03", "Served"],
                            ["#1021", "Table 11", "Completed"],
                          ].map(([order, table, status], index) => (
                            <div
                              key={order}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">
                                    {order}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {table}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  status === "Ready"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : status === "Preparing"
                                      ? "bg-orange-50 text-orange-700"
                                      : status === "Served"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white bg-white/85 p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)]">
                        <h3 className="text-sm font-bold">Table Status</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Current occupancy
                        </p>

                        <div className="mt-6 flex justify-center">
                          <div className="flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-violet-100 border-r-violet-600 border-t-indigo-500">
                            <div className="text-center">
                              <p className="text-3xl font-bold tracking-tight">
                                75%
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                Occupied
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-500">
                              <span className="h-2 w-2 rounded-full bg-violet-500" />
                              Occupied
                            </span>
                            <span className="font-semibold">18</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-500">
                              <span className="h-2 w-2 rounded-full bg-slate-200" />
                              Available
                            </span>
                            <span className="font-semibold">6</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-5 left-[8%] hidden rounded-2xl border border-white/90 bg-white/80 px-4 py-3 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:flex sm:items-center sm:gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CircleCheck size={19} />
                </span>
                <span>
                  <span className="block text-xs font-bold">Orders connected</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    From table to kitchen
                  </span>
                </span>
              </div>

              <div className="pointer-events-none absolute -right-3 top-24 hidden rounded-2xl border border-white/90 bg-white/80 px-4 py-3 shadow-xl shadow-slate-900/5 backdrop-blur-xl lg:flex lg:items-center lg:gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Zap size={19} />
                </span>
                <span>
                  <span className="block text-xs font-bold">One platform</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    Your restaurant, connected
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="scroll-mt-28 py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                <Sparkles size={15} />
                Everything connected
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                One system for your entire restaurant.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Replace disconnected workflows with one coordinated system for
                customer ordering, kitchen operations, tables, staff, and
                billing.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={`group relative overflow-hidden rounded-3xl border border-white/90 bg-white/65 p-7 shadow-[0_8px_32px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:bg-white/90 hover:shadow-[0_20px_60px_rgba(99,102,241,0.12)] ${feature.glow}`}
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-100/60 blur-3xl transition duration-500 group-hover:bg-indigo-100" />
                    <div
                      className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg transition duration-300 group-hover:scale-105`}
                    >
                      <Icon size={21} />
                    </div>
                    <h3 className="relative mt-6 text-lg font-bold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="relative mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                    <div className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition group-hover:text-violet-700">
                      Built for your workflow
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="scroll-mt-28 border-y border-white/80 bg-white/40 py-20 backdrop-blur-sm sm:py-24 lg:py-28"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                From QR scan to table release.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                Every part of the restaurant workflow has a clear
                responsibility, handoff, and status.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
              {workflow.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.number}
                    className={`${glassCard} relative overflow-hidden p-7`}
                  >
                    <span className="pointer-events-none absolute right-5 top-2 text-6xl font-bold tracking-tight text-violet-100/80">
                      {item.number}
                    </span>
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 text-violet-700 shadow-sm">
                      <Icon size={21} />
                    </div>
                    <h3 className="relative mt-7 text-lg font-bold">
                      {item.title}
                    </h3>
                    <p className="relative mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RESTAURANT OPERATIONS */}
        <section id="solutions" className="scroll-mt-28 py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                  Restaurant operations
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Give every team the tools they need.
                </h2>
                <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg">
                  Restova connects restaurant teams without mixing their
                  responsibilities. Owners oversee the business while kitchen,
                  waiter, and cashier teams focus on their work.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Clear responsibilities for each role",
                    "Consistent order status transitions",
                    "Restaurant-level data isolation",
                    "Separate payment and table states",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-6 text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Bring Restova to your restaurant
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {operations.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={`${glassCard} p-6 ${
                        index === 0 ? "sm:translate-y-5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.iconClass} text-white shadow-lg`}
                        >
                          <Icon size={22} />
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider ring-1 ${item.tagClass}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {item.subtitle}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  );
                })}

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(79,70,229,0.2)] sm:translate-y-5">
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                    <LayoutDashboard size={22} />
                  </div>
                  <h3 className="relative mt-6 text-xl font-bold">
                    One connected system
                  </h3>
                  <p className="relative mt-3 text-sm leading-6 text-white/75">
                    Keep restaurant workflows connected through one
                    coordinated operating platform.
                  </p>
                  <div className="relative mt-6 flex items-center gap-2 text-xs font-semibold text-white/90">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Connected workflows
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QR ORDERING */}
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-14 text-white shadow-[0_35px_100px_rgba(15,23,42,0.16)] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-20 -top-40 h-[450px] w-[450px] rounded-full bg-violet-600/30 blur-[100px]" />
                <div className="absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]" />
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "radial-gradient(white 0.7px, transparent 0.7px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-violet-200 backdrop-blur-xl">
                    <QrCode size={15} />
                    A smarter guest experience
                  </span>

                  <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    Your menu is now
                    <span className="block bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
                      one scan away.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                    Give guests a convenient way to explore your menu and
                    submit orders from their own devices, while orders move
                    into the restaurant workflow.
                  </p>

                  <div className="mt-8 space-y-4">
                    {[
                      "No customer account required",
                      "Table-specific QR ordering",
                      "Orders routed into restaurant operations",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                          <Check size={14} />
                        </span>
                        <span className="text-sm text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/register"
                    className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
                  >
                    Get started with Restova
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>

                {/* QR experience mockup */}
                <div className="mx-auto w-full max-w-sm">
                  <div className="rounded-[28px] border border-white/15 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-2xl">
                    <div className="rounded-[22px] bg-white p-5 text-slate-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white">
                            <ChefHat size={19} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">The Food House</p>
                            <p className="text-[10px] text-slate-500">
                              Fresh food, made with care
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                          OPEN
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-gradient-to-br from-orange-100 via-rose-50 to-amber-50 p-5">
                        <div className="flex aspect-[2/1] items-center justify-center rounded-xl border border-white/80 bg-white/60">
                          <Utensils
                            size={38}
                            className="text-orange-500"
                            strokeWidth={1.4}
                          />
                        </div>
                        <p className="mt-4 text-lg font-bold">
                          Discover your favourites
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Explore dishes, choose your favourites, and order
                          from your table.
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-xs font-bold">Popular dishes</span>
                        <span className="text-[10px] font-medium text-violet-600">
                          View menu
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {[
                          ["Classic Burger", "₹249", "bg-amber-100"],
                          ["Creamy Pasta", "₹299", "bg-rose-100"],
                        ].map(([name, price, color]) => (
                          <div
                            key={name}
                            className="rounded-xl border border-slate-100 p-2.5"
                          >
                            <div
                              className={`flex h-16 items-center justify-center rounded-lg ${color}`}
                            >
                              <Utensils
                                size={22}
                                className="text-slate-500"
                              />
                            </div>
                            <p className="mt-2 text-[11px] font-semibold">
                              {name}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {price}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-white">
                        <span className="text-xs font-semibold">
                          Your order
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                          View cart <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-[11px] text-slate-400">
                    Illustrative menu preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY RESTOVA */}
        <section
          id="pricing"
          className="scroll-mt-28 border-y border-white/80 bg-white/40 py-20 backdrop-blur-sm sm:py-24 lg:py-28"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                  Why Restova
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Designed as a real restaurant operating system.
                </h2>
                <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg">
                  Restova is more than a digital menu. It connects the
                  operational parts of a restaurant while keeping permissions,
                  orders, payments, and table status properly separated.
                </p>

                <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white bg-white/75 p-5 shadow-sm backdrop-blur-xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                    <ShieldCheck size={23} />
                  </div>
                  <div>
                    <p className="font-bold">Built around clear boundaries</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Role-based access and restaurant-level data isolation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Secure",
                    text: "Role-based access and restaurant-level data isolation.",
                  },
                  {
                    icon: Zap,
                    title: "Fast",
                    text: "Focused interfaces designed for busy restaurant teams.",
                  },
                  {
                    icon: LayoutDashboard,
                    title: "Centralized",
                    text: "One platform for essential restaurant operations.",
                  },
                  {
                    icon: Store,
                    title: "SaaS Ready",
                    text: "A multi-restaurant architecture built for growth.",
                  },
                  {
                    icon: Bell,
                    title: "Operational",
                    text: "Clear order states and workflow responsibilities.",
                  },
                  {
                    icon: BarChart3,
                    title: "Scalable",
                    text: "A foundation for future restaurant capabilities.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className={`${glassCard} p-5`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 text-violet-700">
                        <Icon size={19} />
                      </div>
                      <h3 className="mt-4 font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/65 px-6 py-14 text-center shadow-[0_25px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:px-12 sm:py-20">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-[-180px] h-80 w-[650px] -translate-x-1/2 rounded-full bg-violet-200/50 blur-[100px]" />
                <div className="absolute bottom-[-180px] right-[-80px] h-80 w-80 rounded-full bg-sky-200/40 blur-[100px]" />
              </div>

              <div className="relative mx-auto max-w-3xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-violet-500/20">
                  <Store size={25} />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                  Your next chapter starts here
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Ready to build a better restaurant operation?
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Bring ordering, kitchen operations, tables, staff, billing,
                  and payments together with Restova.
                </p>

                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-violet-700"
                  >
                    Get Started
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
                  >
                    Talk to Restova
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/80 bg-white/55 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-violet-950 text-sm font-bold text-white shadow-lg shadow-slate-950/10">
                    R
                  </span>
                  <span>
                    <span className="block text-lg font-bold tracking-tight">
                      Restova<span className="text-violet-600">.</span>
                    </span>
                    <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Restaurant OS
                    </span>
                  </span>
                </Link>

                <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                  A modern restaurant operating system connecting customer
                  ordering, kitchen operations, tables, staff, billing, and
                  payments.
                </p>

                <p className="mt-5 text-xs text-slate-400">
                  A new era for restaurants.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold">Product</h3>
                <div className="mt-4 space-y-3">
                  {[
                    ["Features", "#features"],
                    ["How It Works", "#how-it-works"],
                    ["Solutions", "#solutions"],
                    ["Pricing", "/pricing"],
                  ].map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="block text-sm text-slate-500 transition hover:translate-x-0.5 hover:text-violet-700"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold">Company</h3>
                <div className="mt-4 space-y-3">
                  <Link
                    href="/contact"
                    className="block text-sm text-slate-500 transition hover:text-violet-700"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/register"
                    className="block text-sm text-slate-500 transition hover:text-violet-700"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block text-sm text-slate-500 transition hover:text-violet-700"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/70 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} Restova. All rights reserved.
              </p>
              <p>Designed for better restaurant operations.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
