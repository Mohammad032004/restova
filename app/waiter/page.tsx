"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "BILL_REQUESTED"
  | "CLEANING";

type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

interface RestaurantTable {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
  qrToken?: string;
}

interface OrderTable {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

interface RestaurantOrder {
  _id: string;
  orderNumber: number;
  orderType: "DINE_IN" | "TAKEAWAY";
  source: "CUSTOMER_QR" | "WAITER" | "STAFF";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  tableId?: OrderTable | null;
  createdAt: string;
  updatedAt: string;
}

interface TablesResponse {
  success: boolean;
  message?: string;
  tables?: RestaurantTable[];
}

interface OrdersResponse {
  success: boolean;
  message?: string;
  orders?: RestaurantOrder[];
}

const tableStatusStyles: Record<
  TableStatus,
  {
    badge: string;
    border: string;
    background: string;
    dot: string;
  }
> = {
  AVAILABLE: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-200",
    background: "bg-emerald-50/40",
    dot: "bg-emerald-500",
  },
  OCCUPIED: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-200",
    background: "bg-amber-50/40",
    dot: "bg-amber-500",
  },
  BILL_REQUESTED: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    border: "border-orange-200",
    background: "bg-orange-50/40",
    dot: "bg-orange-500",
  },
  CLEANING: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-200",
    background: "bg-blue-50/40",
    dot: "bg-blue-500",
  },
};

const orderStatusStyles: Record<OrderStatus, string> = {
  PLACED: "bg-slate-100 text-slate-700",
  ACCEPTED: "bg-indigo-100 text-indigo-700",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  SERVED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentStatusStyles: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function WaiterDashboardPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(
    async (showRefreshLoader = false) => {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [tablesResponse, ordersResponse] = await Promise.all([
          fetch("/api/restaurant/tables", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/restaurant/orders", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const tablesData: TablesResponse = await tablesResponse.json();
        const ordersData: OrdersResponse = await ordersResponse.json();

        if (!tablesResponse.ok || !tablesData.success) {
          throw new Error(
            tablesData.message || "Failed to load restaurant tables."
          );
        }

        if (!ordersResponse.ok || !ordersData.success) {
          throw new Error(
            ordersData.message || "Failed to load restaurant orders."
          );
        }

        setTables(tablesData.tables || []);
        setOrders(ordersData.orders || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load waiter dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateTableStatus = async (
    tableId: string,
    status: TableStatus
  ) => {
    setActionLoading(`table-${tableId}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/restaurant/tables/${tableId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update table status."
        );
      }

      setSuccess(
        data.message || "Table status updated successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update table status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleServeOrder = async (orderId: string) => {
    setActionLoading(`order-${orderId}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/restaurant/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "SERVED",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to mark order as served."
        );
      }

      setSuccess(
        data.message || "Order marked as served."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark order as served."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const availableTables = useMemo(
    () => tables.filter((table) => table.status === "AVAILABLE").length,
    [tables]
  );

  const occupiedTables = useMemo(
    () => tables.filter((table) => table.status === "OCCUPIED").length,
    [tables]
  );

  const billRequestedTables = useMemo(
    () =>
      tables.filter(
        (table) => table.status === "BILL_REQUESTED"
      ).length,
    [tables]
  );

  const cleaningTables = useMemo(
    () => tables.filter((table) => table.status === "CLEANING").length,
    [tables]
  );

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== "COMPLETED" &&
          order.status !== "CANCELLED"
      ),
    [orders]
  );

  const readyOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "READY"
      ),
    [orders]
  );

  const servedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "SERVED"
      ),
    [orders]
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-indigo-600">
              Waiter Panel
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Restaurant Operations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage tables, serve ready orders, and handle billing requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                d="M12 8v4"
                strokeLinecap="round"
              />
              <path
                d="M12 16h.01"
                strokeLinecap="round"
              />
            </svg>

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                d="m8.5 12 2.2 2.2 4.8-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>{success}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="m8.5 12 2.2 2.2 4.8-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Tables
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {availableTables}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Available
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-2.5">
                <svg
                  className="h-5 w-5 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="M12 8v8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.5 12h7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Tables
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {occupiedTables}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Occupied
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-orange-50 p-2.5">
                <svg
                  className="h-5 w-5 text-orange-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 3h12v18H6z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 7h6M9 11h6M9 15h4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Billing
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {billRequestedTables}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Bill requested
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <svg
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Tables
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {cleaningTables}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cleaning
            </p>
          </div>
        </div>

        {/* Ready Orders Alert */}
        {readyOrders.length > 0 && (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-100 p-2.5">
                  <svg
                    className="h-5 w-5 text-emerald-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M12 3v18M3 12h18"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="font-bold text-emerald-900">
                    {readyOrders.length} order
                    {readyOrders.length === 1 ? "" : "s"} ready to serve
                  </h3>

                  <p className="mt-1 text-sm text-emerald-700">
                    Kitchen has completed these orders. Please serve them to
                    the customers.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                Action Required
              </span>
            </div>
          </div>
        )}

        {/* Tables */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Tables
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manage table service lifecycle.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {tables.length} tables
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                No tables found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Tables will appear here once they are created.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((table) => {
                const styles = tableStatusStyles[table.status];
                const tableActionLoading =
                  actionLoading === `table-${table._id}`;

                return (
                  <div
                    key={table._id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${styles.border}`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                          />

                          <h4 className="font-bold text-slate-900">
                            {table.name}
                          </h4>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          Table #{table.number}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles.badge}`}
                      >
                        {formatStatus(table.status)}
                      </span>
                    </div>

                    <div className="mb-5 flex items-center gap-4 text-sm text-slate-500">
                      <span>
                        Capacity:{" "}
                        <strong className="text-slate-700">
                          {table.capacity}
                        </strong>
                      </span>
                    </div>

                    {table.status === "AVAILABLE" && (
                      <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                        Ready for customers
                      </div>
                    )}

                    {table.status === "OCCUPIED" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateTableStatus(
                            table._id,
                            "BILL_REQUESTED"
                          )
                        }
                        disabled={tableActionLoading}
                        className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {tableActionLoading
                          ? "Requesting..."
                          : "Request Bill"}
                      </button>
                    )}

                    {table.status === "BILL_REQUESTED" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateTableStatus(
                            table._id,
                            "CLEANING"
                          )
                        }
                        disabled={tableActionLoading}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {tableActionLoading
                          ? "Checking..."
                          : "Start Cleaning"}
                      </button>
                    )}

                    {table.status === "CLEANING" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateTableStatus(
                            table._id,
                            "AVAILABLE"
                          )
                        }
                        disabled={tableActionLoading}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {tableActionLoading
                          ? "Releasing..."
                          : "Release Table"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Orders */}
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Orders
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Serve ready orders and monitor active service.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Active: {activeOrders.length}
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Ready: {readyOrders.length}
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Served: {servedOrders.length}
              </span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                No orders found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                New restaurant orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderActionLoading =
                  actionLoading === `order-${order._id}`;

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-bold text-slate-900">
                            Order #{order.orderNumber}
                          </h4>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${orderStatusStyles[order.status]}`}
                          >
                            {formatStatus(order.status)}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${paymentStatusStyles[order.paymentStatus]}`}
                          >
                            {formatStatus(order.paymentStatus)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span>
                            {order.orderType === "DINE_IN"
                              ? "Dine In"
                              : "Takeaway"}
                          </span>

                          {order.tableId && (
                            <span>
                              Table #{order.tableId.number}
                            </span>
                          )}

                          <span>
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Total
                        </p>

                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>

                    {/* Customer */}
                    {(order.customerName || order.customerPhone) && (
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Customer
                        </p>

                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-700">
                          {order.customerName && (
                            <span className="font-semibold">
                              {order.customerName}
                            </span>
                          )}

                          {order.customerPhone && (
                            <span>
                              {order.customerPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Items
                      </p>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-start justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800">
                                {item.quantity} × {item.name}
                              </p>

                              {item.notes && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 font-semibold text-slate-700">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                          Order Note
                        </p>

                        <p className="mt-1 text-sm text-amber-800">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    {order.status === "READY" && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleServeOrder(order._id)
                          }
                          disabled={orderActionLoading}
                          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {orderActionLoading
                            ? "Serving..."
                            : "Mark Order as Served"}
                        </button>
                      </div>
                    )}

                    {order.status === "SERVED" && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path
                              d="m8.5 12 2.2 2.2 4.8-5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          Order served. Waiting for billing/payment.
                        </div>
                      </div>
                    )}

                    {order.status === "COMPLETED" && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                          Order completed.
                        </div>
                      </div>
                    )}

                    {order.status === "CANCELLED" && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                          Order cancelled.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Workflow Information */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Waiter Workflow
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-400">
                01
              </span>

              <p className="mt-2 font-semibold text-slate-800">
                Customer Orders
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Table becomes occupied.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-400">
                02
              </span>

              <p className="mt-2 font-semibold text-slate-800">
                Kitchen Prepares
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Order moves to READY.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <span className="text-xs font-bold text-emerald-600">
                03
              </span>

              <p className="mt-2 font-semibold text-emerald-800">
                Serve Order
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                Waiter marks READY → SERVED.
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <span className="text-xs font-bold text-orange-600">
                04
              </span>

              <p className="mt-2 font-semibold text-orange-800">
                Request Bill
              </p>

              <p className="mt-1 text-xs text-orange-700">
                Waiter requests the bill.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <span className="text-xs font-bold text-blue-600">
                05
              </span>

              <p className="mt-2 font-semibold text-blue-800">
                Clean & Release
              </p>

              <p className="mt-1 text-xs text-blue-700">
                After payment, clean and release.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}