"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Table2,
  XCircle,
} from "lucide-react";

interface DashboardData {
  success: boolean;

  restaurant: {
    id: string;
    name: string;
    type: string;
    status: string;
  };

  sales: {
    today: number;
  };

  orders: {
    today: number;
    pending: number;
    completed: number;
    cancelled: number;
  };

  tables: {
    total: number;
    occupied: number;
    available: number;
    billRequested: number;
    cleaning: number;
  };

  recentOrders: Array<{
    _id: string;
    orderNumber: number;
    orderType: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    tableId?: {
      name?: string;
      number?: number;
    } | null;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "READY":
      return "bg-blue-50 text-blue-700";

    case "PREPARING":
      return "bg-amber-50 text-amber-700";

    case "ACCEPTED":
      return "bg-indigo-50 text-indigo-700";

    case "PLACED":
      return "bg-purple-50 text-purple-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getPaymentClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    case "REFUNDED":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default function RestaurantPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/restaurant/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load dashboard."
        );
      }

      setData(result);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load dashboard
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error || "Something went wrong."}
                </p>

                <button
                  type="button"
                  onClick={() => loadDashboard()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { restaurant, sales, orders, tables, recentOrders } = data;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Restaurant Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {restaurant.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here's what's happening with your restaurant today.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Sales */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Today's Sales
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(sales.today)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <IndianRupee size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Paid orders excluding cancelled orders
            </p>
          </div>

          {/* Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Today's Orders
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {orders.today}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ShoppingBag size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Orders received today
            </p>
          </div>

          {/* Pending */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Orders
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {orders.pending}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Orders requiring attention
            </p>
          </div>

          {/* Completed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed Orders
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {orders.completed}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Completed today
            </p>
          </div>
        </div>

        {/* Second Row */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* Order Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Order Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Today's order status
                </p>
              </div>

              <BarChart3
                size={21}
                className="text-slate-400"
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-700">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {orders.pending}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-700">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-900">
                  {orders.completed}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs font-medium text-red-700">
                  Cancelled
                </p>

                <p className="mt-2 text-2xl font-bold text-red-900">
                  {orders.cancelled}
                </p>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Tables
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current table status
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Table2 size={20} />
              </div>
            </div>

            <div className="mt-5 space-y-3">

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Total
                </span>

                <span className="font-semibold text-slate-900">
                  {tables.total}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Occupied
                </span>

                <span className="font-semibold text-orange-600">
                  {tables.occupied}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Available
                </span>

                <span className="font-semibold text-emerald-600">
                  {tables.available}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Bill requested
                </span>

                <span className="font-semibold text-blue-600">
                  {tables.billRequested}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Cleaning
                </span>

                <span className="font-semibold text-slate-700">
                  {tables.cleaning}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest orders from your restaurant
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              Latest 10
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <ShoppingBag
                  size={22}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No orders yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Orders will appear here when customers place them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Table
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Type
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Payment
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          #{order.orderNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {order.tableId?.name ||
                          (order.tableId?.number
                            ? `Table ${order.tableId.number}`
                            : "—")}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatStatus(order.orderType)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentClass(
                            order.paymentStatus
                          )}`}
                        >
                          {formatStatus(order.paymentStatus)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Restaurant Status */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {restaurant.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {restaurant.type}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {restaurant.status}
          </div>
        </div>
      </div>
    </main>
  );
}