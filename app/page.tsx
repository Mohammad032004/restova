import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Menu as MenuIcon,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Table2,
  Users,
  Utensils,
  WalletCards,
  Zap,
} from "lucide-react";

import Navbar from "@/components/navbar";

const features = [
  {
    icon: QrCode,
    title: "QR Ordering",
    description:
      "Let customers scan their table QR, browse your menu, customize items, and place orders directly from their phones.",
  },
  {
    icon: ChefHat,
    title: "Kitchen Management",
    description:
      "Give your kitchen team a focused workspace to accept orders, prepare food, and mark orders ready.",
  },
  {
    icon: Table2,
    title: "Table Management",
    description:
      "Track table occupancy independently from payments and let authorized staff release tables when customers leave.",
  },
  {
    icon: WalletCards,
    title: "Billing & Payments",
    description:
      "Manage bills and payment statuses for cash, UPI, card, and other supported payment methods.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description:
      "Give owners, managers, kitchen staff, waiters, and cashiers the permissions they actually need.",
  },
  {
    icon: BarChart3,
    title: "Restaurant Analytics",
    description:
      "Get a clear view of restaurant activity, orders, revenue, tables, and operational performance.",
  },
];

const workflow = [
  {
    number: "01",
    icon: QrCode,
    title: "Customer scans the QR",
    description:
      "Each table has a unique QR token that connects the customer to the correct restaurant and table.",
  },
  {
    number: "02",
    icon: Smartphone,
    title: "Customer places an order",
    description:
      "The customer browses the digital menu, adds items to the cart, and submits the order.",
  },
  {
    number: "03",
    icon: ChefHat,
    title: "Kitchen prepares it",
    description:
      "The kitchen receives the order and moves it through accepted, preparing, and ready states.",
  },
  {
    number: "04",
    icon: Utensils,
    title: "Waiter serves",
    description:
      "When the food is ready, the waiter serves the customer and updates the order.",
  },
  {
    number: "05",
    icon: CreditCard,
    title: "Payment is handled",
    description:
      "Billing and payment are handled separately from the physical table occupancy.",
  },
  {
    number: "06",
    icon: Table2,
    title: "Table is released",
    description:
      "After the customer leaves, authorized staff release the table and make it available again.",
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

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <Navbar />

      {/* ========================================================= */}
      {/* HERO                                                       */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden pt-32 sm:pt-36 lg:pt-40">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-slate-100 blur-3xl" />

          <div className="absolute left-[20%] top-40 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="absolute right-[15%] top-52 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              The modern restaurant operating system

              <ArrowRight size={14} className="text-slate-400" />
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-bold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
              Everything your restaurant needs.
              <span className="block bg-gradient-to-r from-slate-950 via-slate-700 to-slate-400 bg-clip-text text-transparent">
                One powerful platform.
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Restova brings customer ordering, kitchen operations, tables,
              staff, billing, and payments together into one simple restaurant
              operating system.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="#how-it-works"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 sm:w-auto"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Built for restaurants
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Role-based access
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Secure architecture
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto mt-16 max-w-6xl sm:mt-20">
            <div className="absolute left-1/2 top-16 h-72 w-4/5 -translate-x-1/2 rounded-full bg-slate-200/70 blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
              {/* Browser bar */}
              <div className="flex h-12 items-center border-b border-slate-200 bg-slate-50 px-4">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                </div>

                <div className="mx-auto hidden h-7 w-72 items-center justify-center rounded-md border border-slate-200 bg-white text-[11px] text-slate-400 sm:flex">
                  app.restova.com/dashboard
                </div>
              </div>

              <div className="grid min-h-[430px] grid-cols-12 bg-slate-50">
                {/* Sidebar */}
                <div className="col-span-3 hidden border-r border-slate-200 bg-white p-5 sm:block lg:col-span-2">
                  <div className="mb-8 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
                      R
                    </div>

                    <span className="text-sm font-bold">Restova</span>
                  </div>

                  <div className="space-y-1">
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
                        className={`rounded-lg px-3 py-2.5 text-xs ${
                          index === 0
                            ? "bg-slate-100 font-semibold text-slate-950"
                            : "text-slate-500"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashboard */}
                <div className="col-span-12 p-5 sm:col-span-9 lg:col-span-10 lg:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Tuesday, October 6
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        Restaurant Overview
                      </h2>
                    </div>

                    <div className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:block">
                      Today
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      ["Orders", "128"],
                      ["Revenue", "₹42,680"],
                      ["Tables", "18 / 24"],
                      ["Pending", "12"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-xs text-slate-400">{label}</p>

                        <p className="mt-2 text-lg font-bold">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Lower dashboard */}
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          Today&apos;s Orders
                        </h3>

                        <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {[
                          ["#1024", "Table 08", "Preparing"],
                          ["#1023", "Table 14", "Ready"],
                          ["#1022", "Table 03", "Served"],
                          ["#1021", "Table 11", "Completed"],
                        ].map(([order, table, status]) => (
                          <div
                            key={order}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold">
                                {order}
                              </span>

                              <span className="text-xs text-slate-500">
                                {table}
                              </span>
                            </div>

                            <span className="text-[11px] font-medium text-slate-500">
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-semibold">Table Status</h3>

                      <div className="mt-6 flex justify-center">
                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-[14px] border-slate-200">
                          <div className="text-center">
                            <p className="text-2xl font-bold">18</p>
                            <p className="text-[10px] text-slate-400">
                              Occupied
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Occupied</span>
                          <span className="font-semibold">18</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Available</span>
                          <span className="font-semibold">6</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURES                                                   */}
      {/* ========================================================= */}

      <section id="features" className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Everything connected
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              One system for your entire restaurant.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Stop managing separate tools for ordering, kitchen operations,
              tables, staff, and billing. Restova brings the essential
              restaurant workflow together.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-slate-950">
                    Learn more
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

      {/* ========================================================= */}
      {/* HOW IT WORKS                                               */}
      {/* ========================================================= */}

      <section
        id="how-it-works"
        className="border-y border-slate-100 bg-slate-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              From QR scan to table release.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Every part of the restaurant workflow has a clear responsibility
              and status.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {workflow.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-7"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Icon size={20} />
                    </div>

                    <span className="text-4xl font-bold tracking-tight text-slate-100">
                      {item.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-bold">{item.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* RESTAURANT OPERATIONS                                     */}
      {/* ========================================================= */}

      <section id="solutions" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Restaurant operations
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Give every team the tools they need.
              </h2>

              <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg">
                Restova separates responsibilities without separating your
                restaurant data. Owners manage the business while kitchen,
                waiter, and cashier teams focus on their jobs.
              </p>

              <div className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check size={14} />
                    </div>

                    <span className="text-sm font-medium text-slate-700">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800"
              >
                Start with Restova
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            {/* Operations visual */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-slate-100 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs text-slate-400">Restaurant</p>
                    <p className="mt-1 font-bold">Operations Center</p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    Operational
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      icon: QrCode,
                      title: "Customer Orders",
                      value: "24 active",
                    },
                    {
                      icon: ChefHat,
                      title: "Kitchen",
                      value: "8 preparing",
                    },
                    {
                      icon: Utensils,
                      title: "Waiter",
                      value: "5 ready",
                    },
                    {
                      icon: CreditCard,
                      title: "Payments",
                      value: "₹18,420",
                    },
                    {
                      icon: Table2,
                      title: "Tables",
                      value: "18 occupied",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                            <Icon size={17} />
                          </div>

                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-slate-500">
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* QR ORDERING                                                */}
      {/* ========================================================= */}

      <section className="border-y border-slate-100 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Phone visual */}
            <div className="order-2 flex justify-center lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl" />

                <div className="relative w-[270px] rounded-[2.5rem] border-8 border-slate-800 bg-white p-3 shadow-2xl">
                  <div className="overflow-hidden rounded-[2rem] bg-slate-50">
                    <div className="flex items-center justify-between bg-white px-4 py-4">
                      <div>
                        <p className="text-[9px] text-slate-400">
                          Welcome to
                        </p>

                        <p className="text-sm font-bold text-slate-950">
                          Restova Bistro
                        </p>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
                        <MenuIcon size={15} />
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="rounded-xl bg-slate-950 p-4 text-white">
                        <p className="text-[9px] text-slate-400">Table</p>
                        <p className="mt-1 text-xl font-bold">Table 08</p>
                      </div>

                      <p className="mt-5 text-xs font-bold text-slate-950">
                        Popular Items
                      </p>

                      <div className="mt-3 space-y-2">
                        {[
                          ["Chicken Biryani", "₹240"],
                          ["Paneer Tikka", "₹220"],
                          ["Masala Cola", "₹80"],
                        ].map(([name, price]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between rounded-lg bg-white p-3"
                          >
                            <div>
                              <p className="text-[10px] font-semibold text-slate-900">
                                {name}
                              </p>

                              <p className="mt-1 text-[9px] text-slate-400">
                                Freshly prepared
                              </p>
                            </div>

                            <span className="text-[10px] font-bold text-slate-950">
                              {price}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button className="mt-4 w-full rounded-xl bg-slate-950 py-3 text-[10px] font-semibold text-white">
                        View Full Menu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                QR ordering
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Let customers order from their own phones.
              </h2>

              <p className="mt-6 text-base leading-7 text-slate-400 sm:text-lg">
                No customer account. No unnecessary steps. Customers scan the
                table QR, explore the menu, add items, and place their order.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  "Unique QR token for every table",
                  "Mobile-first digital menu",
                  "Server-side price validation",
                  "Secure customer order tracking",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-400"
                    />

                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* KITCHEN / TABLE / PAYMENT                                 */}
      {/* ========================================================= */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Built around your workflow
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Clear responsibilities. Better operations.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Every part of Restova is designed around the actual restaurant
              workflow.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {/* Kitchen */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <ChefHat size={22} />
              </div>

              <h3 className="mt-7 text-xl font-bold">Kitchen</h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Focus only on preparing orders and moving them through the
                kitchen workflow.
              </p>

              <div className="mt-7 space-y-2">
                {["Placed", "Accepted", "Preparing", "Ready"].map(
                  (status, index) => (
                    <div
                      key={status}
                      className="flex items-center gap-3 rounded-lg bg-white px-4 py-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>

                      <span className="text-xs font-medium">{status}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Waiter */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <Utensils size={22} />
              </div>

              <h3 className="mt-7 text-xl font-bold">Waiter</h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                See ready orders, serve customers, and release tables after
                guests actually leave.
              </p>

              <div className="mt-7 rounded-xl bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Table 08</span>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                    READY
                  </span>
                </div>

                <div className="mt-4 h-px bg-slate-100" />

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Order #1024</span>
                  <span className="font-semibold">3 items</span>
                </div>

                <button className="mt-4 w-full rounded-lg bg-slate-950 py-2.5 text-xs font-semibold text-white">
                  Mark Served
                </button>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <CreditCard size={22} />
              </div>

              <h3 className="mt-7 text-xl font-bold">Payment</h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Payment status stays separate from physical table occupancy,
                keeping restaurant operations accurate.
              </p>

              <div className="mt-7 rounded-xl bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Payment</span>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                    PAID
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold">₹1,280</p>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Table</span>
                  <span className="font-semibold">Still occupied</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Payment and table states are independent
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* WHY RESTOVA                                                */}
      {/* ========================================================= */}

      <section id="pricing" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Why Restova
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Designed as a real restaurant operating system.
              </h2>

              <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg">
                Restova is not just a QR menu. It is designed to connect the
                operational parts of a restaurant while keeping permissions,
                payments, orders, and table status properly separated.
              </p>
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
                  text: "Focused interfaces for busy restaurant teams.",
                },
                {
                  icon: LayoutDashboard,
                  title: "Centralized",
                  text: "One platform for your restaurant operations.",
                },
                {
                  icon: Store,
                  title: "SaaS Ready",
                  text: "Built around a multi-restaurant architecture.",
                },
                {
                  icon: Bell,
                  title: "Operational",
                  text: "Clear order and workflow states.",
                },
                {
                  icon: BarChart3,
                  title: "Scalable",
                  text: "Designed to grow with future restaurant features.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <Icon size={21} />

                    <h3 className="mt-5 font-bold">{item.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CTA                                                         */}
      {/* ========================================================= */}

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:py-32">
          <div className="rounded-3xl bg-slate-950 px-6 py-16 text-white shadow-2xl shadow-slate-900/10 sm:px-12 lg:px-20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Store size={25} />
            </div>

            <h2 className="mx-auto mt-7 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to build a better restaurant operation?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Bring ordering, kitchen operations, tables, staff, billing, and
              payments together with Restova.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Talk to Restova
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER                                                      */}
      {/* ========================================================= */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <span className="font-bold">R</span>
                </div>

                <div>
                  <p className="font-bold tracking-tight">Restova</p>
                  <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Restaurant OS
                  </p>
                </div>
              </Link>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
                A modern restaurant operating system connecting customer
                ordering, kitchen operations, tables, staff, billing, and
                payments.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold">Product</h3>

              <div className="mt-4 space-y-3">
                <Link
                  href="#features"
                  className="block text-sm text-slate-500 hover:text-slate-950"
                >
                  Features
                </Link>

                <Link
                  href="#how-it-works"
                  className="block text-sm text-slate-500 hover:text-slate-950"
                >
                  How It Works
                </Link>

                <Link
                  href="#solutions"
                  className="block text-sm text-slate-500 hover:text-slate-950"
                >
                  Solutions
                </Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold">Company</h3>

              <div className="mt-4 space-y-3">
                <Link
                  href="/contact"
                  className="block text-sm text-slate-500 hover:text-slate-950"
                >
                  Contact
                </Link>

                <Link
                  href="/register"
                  className="block text-sm text-slate-500 hover:text-slate-950"
                >
                  Get Started
                </Link>

                <Link
                  href="/auth/login"
                  className="block text-sm text-slate-500 hover:text-slate-950"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Restova. All rights reserved.</p>

            <p>Restaurant operations, simplified.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}