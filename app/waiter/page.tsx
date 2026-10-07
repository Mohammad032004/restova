"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";

type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "BILL_REQUESTED"
  | "CLEANING";

interface Table {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
}

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

interface Order {
  _id: string;
  orderNumber: number;
  tableId?: {
    _id: string;
    name: string;
    number: number;
    capacity: number;
    status: TableStatus;
  } | null;
  orderType: string;
  source: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
    notes?: string;
  }[];
}

interface TablesResponse {
  success: boolean;
  tables: Table[];
  message?: string;
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
  message?: string;
}

const statusConfig: Record<
  TableStatus,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  AVAILABLE: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  OCCUPIED: {
    label: "Occupied",
    className: "bg-orange-50 text-orange-700",
    icon: Utensils,
  },
  BILL_REQUESTED: {
    label: "Bill Requested",
    className: "bg-blue-50 text-blue-700",
    icon: ReceiptText,
  },
  CLEANING: {
    label: "Cleaning",
    className: "bg-slate-100 text-slate-700",
    icon: Sparkles,
  },
};

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WaiterPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingTableId, setUpdatingTableId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [tablesResponse, ordersResponse] =
        await Promise.all([
          fetch("/api/restaurant/tables", {
            method: "GET",
            cache: "no-store",
          }),

          fetch("/api/restaurant/orders", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

      const tablesResult: TablesResponse =
        await tablesResponse.json();

      const ordersResult: OrdersResponse =
        await ordersResponse.json();

      if (
        !tablesResponse.ok ||
        !tablesResult.success
      ) {
        throw new Error(
          tablesResult.message ||
            "Failed to load tables."
        );
      }

      if (
        !ordersResponse.ok ||
        !ordersResult.success
      ) {
        throw new Error(
          ordersResult.message ||
            "Failed to load orders."
        );
      }

      setTables(tablesResult.tables || []);
      setOrders(ordersResult.orders || []);
    } catch (error) {
      console.error("Load waiter dashboard error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load waiter dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status !== "COMPLETED" &&
        order.status !== "CANCELLED"
    );
  }, [orders]);

  function getTableOrders(tableId: string) {
    return activeOrders.filter(
      (order) =>
        order.tableId?._id === tableId
    );
  }

  async function updateTableStatus(
    tableId: string,
    status: TableStatus
  ) {
    try {
      setUpdatingTableId(tableId);
      setError("");
      setSuccess("");

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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to update table."
        );
      }

      setSuccess(result.message);

      await loadData(true);
    } catch (error) {
      console.error(
        "Update waiter table error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update table."
      );
    } finally {
      setUpdatingTableId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm text-slate-500">
            Loading waiter dashboard...
          </p>
        </div>
      </main>
    );
  }

  const availableCount = tables.filter(
    (table) => table.status === "AVAILABLE"
  ).length;

  const occupiedCount = tables.filter(
    (table) => table.status === "OCCUPIED"
  ).length;

  const billRequestedCount = tables.filter(
    (table) => table.status === "BILL_REQUESTED"
  ).length;

  const cleaningCount = tables.filter(
    (table) => table.status === "CLEANING"
  ).length;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Waiter Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Tables & Service
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer tables and service flow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={17} />

            {success}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Available
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {availableCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Ready for customers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Occupied
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600">
              {occupiedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Customers currently dining
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Bill Requested
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {billRequestedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Waiting for cashier
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Cleaning
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-700">
              {cleaningCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Waiting to be released
            </p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Active Orders
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Orders currently requiring service.
              </p>
            </div>

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {activeOrders.length}
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <ReceiptText
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No active orders
              </p>

              <p className="mt-1 text-xs text-slate-400">
                New customer orders will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeOrders.slice(0, 12).map(
                (order) => (
                  <div
                    key={order._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Order #{order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.tableId
                            ? `Table ${order.tableId.number}`
                            : "No table"}
                        </p>
                      </div>

                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {order.items
                        .slice(0, 3)
                        .map((item, index) => (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-600">
                              {item.quantity} ×{" "}
                              {item.name}
                            </span>

                            <span className="font-medium text-slate-800">
                              {formatCurrency(
                                item.total
                              )}
                            </span>
                          </div>
                        ))}

                      {order.items.length > 3 && (
                        <p className="text-xs text-slate-400">
                          +{" "}
                          {order.items.length - 3}{" "}
                          more item(s)
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 size={13} />
                        {formatTime(
                          order.createdAt
                        )}
                      </div>

                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Tables */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Restaurant Tables
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Handle table service and customer billing requests.
            </p>
          </div>

          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Users
                size={32}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-bold text-slate-800">
                No tables configured
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your restaurant does not have any tables yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((table) => {
                const config =
                  statusConfig[table.status];

                const StatusIcon = config.icon;

                const tableOrders =
                  getTableOrders(table._id);

                const isUpdating =
                  updatingTableId === table._id;

                return (
                  <div
                    key={table._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                          {table.number}
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900">
                            {table.name}
                          </h3>

                          <p className="text-xs text-slate-500">
                            Table {table.number}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
                      >
                        <StatusIcon size={12} />

                        {config.label}
                      </span>
                    </div>

                    {/* Capacity */}
                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                      <Users size={16} />

                      <span>
                        Capacity:{" "}
                        <strong className="text-slate-800">
                          {table.capacity}
                        </strong>
                      </span>
                    </div>

                    {/* Orders */}
                    {tableOrders.length > 0 && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700">
                            Active Orders
                          </p>

                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {tableOrders.length}
                          </span>
                        </div>

                        <div className="mt-2 space-y-2">
                          {tableOrders
                            .slice(0, 2)
                            .map((order) => (
                              <div
                                key={order._id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-600">
                                  Order #
                                  {order.orderNumber}
                                </span>

                                <span className="font-semibold text-slate-800">
                                  {formatCurrency(
                                    order.total
                                  )}
                                </span>
                              </div>
                            ))}

                          {tableOrders.length > 2 && (
                            <p className="text-[11px] text-slate-400">
                              +
                              {tableOrders.length -
                                2}{" "}
                              more active order(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 space-y-2">
                      {table.status ===
                        "OCCUPIED" && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateTableStatus(
                              table._id,
                              "BILL_REQUESTED"
                            )
                          }
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <ReceiptText
                              size={16}
                            />
                          )}

                          Request Bill
                        </button>
                      )}

                      {table.status ===
                        "BILL_REQUESTED" && (
                        <div className="rounded-xl bg-blue-50 px-3 py-3 text-center">
                          <p className="text-xs font-semibold text-blue-700">
                            Bill requested
                          </p>

                          <p className="mt-1 text-[11px] text-blue-600">
                            Waiting for cashier payment.
                          </p>
                        </div>
                      )}

                      {table.status ===
                        "BILL_REQUESTED" && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateTableStatus(
                              table._id,
                              "CLEANING"
                            )
                          }
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Sparkles
                              size={16}
                            />
                          )}

                          Start Cleaning
                        </button>
                      )}

                      {table.status ===
                        "CLEANING" && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateTableStatus(
                              table._id,
                              "AVAILABLE"
                            )
                          }
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={16}
                            />
                          )}

                          Release Table
                        </button>
                      )}

                      {table.status ===
                        "AVAILABLE" && (
                        <div className="rounded-xl bg-emerald-50 px-3 py-3 text-center">
                          <p className="text-xs font-semibold text-emerald-700">
                            Ready for customers
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer note */}
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex gap-3">
            <LogOut
              size={18}
              className="mt-0.5 shrink-0 text-indigo-600"
            />

            <div>
              <p className="text-sm font-semibold text-indigo-900">
                Table release protection
              </p>

              <p className="mt-1 text-xs leading-5 text-indigo-700">
                A table cannot be released while it has an
                incomplete order or an unpaid completed order.
                Payment and table release remain separate operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}