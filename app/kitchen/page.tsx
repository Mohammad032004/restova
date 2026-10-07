"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

interface OrderTable {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: string;
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
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  tableId?: OrderTable | null;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  message?: string;
  orders?: RestaurantOrder[];
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const statusStyles: Record<
  "ACCEPTED" | "PREPARING" | "READY",
  {
    badge: string;
    border: string;
    background: string;
    dot: string;
  }
> = {
  ACCEPTED: {
    badge: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-200",
    background: "bg-indigo-50/40",
    dot: "bg-indigo-500",
  },

  PREPARING: {
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    background: "bg-amber-50/40",
    dot: "bg-amber-500",
  },

  READY: {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    background: "bg-emerald-50/40",
    dot: "bg-emerald-500",
  },
};

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = useCallback(
    async (showRefreshLoader = false) => {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          "/api/restaurant/orders",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: OrdersResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load kitchen orders."
          );
        }

        setOrders(data.orders || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load kitchen orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = async (
    orderId: string,
    status: "PREPARING" | "READY"
  ) => {
    setActionLoading(orderId);
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
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update order status."
        );
      }

      setSuccess(
        data.message ||
          `Order moved to ${formatStatus(status)}.`
      );

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const kitchenOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status === "ACCEPTED" ||
        order.status === "PREPARING" ||
        order.status === "READY"
    );
  }, [orders]);

  const acceptedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "ACCEPTED"
      ),
    [orders]
  );

  const preparingOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "PREPARING"
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-28 rounded-2xl bg-white"
                  />
                )
              )}
            </div>

            <div className="h-72 rounded-2xl bg-white" />
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
              Kitchen Panel
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Kitchen Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Prepare orders and mark them ready for the waiter.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
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

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
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

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-indigo-50 p-2.5">
                <span className="block h-5 w-5 rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Queue
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {acceptedOrders.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              New orders
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
                  <path
                    d="M4 12h16"
                    strokeLinecap="round"
                  />

                  <path
                    d="M7 7h10M7 17h10"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Kitchen
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {preparingOrders.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Preparing
            </p>
          </div>

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
                Ready
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {readyOrders.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Waiting for waiter
            </p>
          </div>
        </div>

        {/* Kitchen Queue */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Kitchen Queue
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Only accepted, preparing and ready orders are shown.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {kitchenOrders.length} orders
            </span>
          </div>

          {kitchenOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  className="h-7 w-7 text-emerald-600"
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

              <p className="font-semibold text-slate-700">
                Kitchen queue is clear
              </p>

              <p className="mt-1 text-sm text-slate-500">
                New accepted orders will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {kitchenOrders.map((order) => {
                const status =
                  order.status as
                    | "ACCEPTED"
                    | "PREPARING"
                    | "READY";

                const styles =
                  statusStyles[status];

                const isLoading =
                  actionLoading === order._id;

                return (
                  <div
                    key={order._id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${styles.border}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                          />

                          <h4 className="text-lg font-bold text-slate-900">
                            Order #{order.orderNumber}
                          </h4>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles.badge}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          {order.tableId && (
                            <span>
                              Table #
                              {order.tableId.number}
                            </span>
                          )}

                          <span>
                            {order.orderType ===
                            "DINE_IN"
                              ? "Dine In"
                              : "Takeaway"}
                          </span>

                          <span>
                            {formatDate(
                              order.createdAt
                            )}
                          </span>
                        </div>
                      </div>

                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {order.items.length}{" "}
                        item
                        {order.items.length ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    {/* Customer */}
                    {(order.customerName ||
                      order.customerPhone) && (
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Customer
                        </p>

                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-700">
                          {order.customerName && (
                            <span className="font-semibold">
                              {
                                order.customerName
                              }
                            </span>
                          )}

                          {order.customerPhone && (
                            <span>
                              {
                                order.customerPhone
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="mt-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Order Items
                      </p>

                      <div className="space-y-3">
                        {order.items.map(
                          (item, index) => (
                            <div
                              key={`${order._id}-${index}`}
                              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    <span className="mr-2 inline-flex min-w-7 items-center justify-center rounded-md bg-white px-1.5 py-1 text-xs font-bold text-indigo-600 shadow-sm">
                                      {item.quantity}
                                    </span>

                                    {
                                      item.name
                                    }
                                  </p>

                                  {item.notes && (
                                    <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                                      <p className="text-xs font-semibold text-amber-700">
                                        Special instruction
                                      </p>

                                      <p className="mt-0.5 text-xs text-amber-800">
                                        {
                                          item.notes
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <span className="shrink-0 text-sm font-bold text-slate-700">
                                  {formatCurrency(
                                    item.total
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        )}
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

                    {/* Total */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-sm text-slate-500">
                        Order total
                      </span>

                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(
                          order.total
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4">
                      {order.status ===
                        "ACCEPTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateOrderStatus(
                              order._id,
                              "PREPARING"
                            )
                          }
                          disabled={isLoading}
                          className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading
                            ? "Starting..."
                            : "Start Preparing"}
                        </button>
                      )}

                      {order.status ===
                        "PREPARING" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateOrderStatus(
                              order._id,
                              "READY"
                            )
                          }
                          disabled={isLoading}
                          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading
                            ? "Updating..."
                            : "Mark Order Ready"}
                        </button>
                      )}

                      {order.status ===
                        "READY" && (
                        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                          Order ready — waiting for waiter
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Workflow */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Kitchen Workflow
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-indigo-50 p-4">
              <span className="text-xs font-bold text-indigo-600">
                01
              </span>

              <p className="mt-2 font-semibold text-indigo-900">
                Accepted
              </p>

              <p className="mt-1 text-xs leading-5 text-indigo-700">
                Order has been accepted and is waiting for kitchen preparation.
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <span className="text-xs font-bold text-amber-600">
                02
              </span>

              <p className="mt-2 font-semibold text-amber-900">
                Preparing
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                Kitchen staff is preparing the food.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <span className="text-xs font-bold text-emerald-600">
                03
              </span>

              <p className="mt-2 font-semibold text-emerald-900">
                Ready
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Food is ready and the waiter can serve the customer.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}