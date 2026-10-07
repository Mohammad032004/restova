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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

interface TableInfo {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: string;
}

interface KitchenOrder {
  _id: string;
  orderNumber: number;
  orderType: string;
  source: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  tableId?: TableInfo;
  createdAt: string;
  updatedAt: string;
}

interface KitchenResponse {
  success: boolean;
  message?: string;
  restaurant?: {
    id: string;
    name: string;
  };
  orders?: KitchenOrder[];
}

const STATUS_CONFIG: Record<
  "ACCEPTED" | "PREPARING" | "READY",
  {
    label: string;
    description: string;
  }
> = {
  ACCEPTED: {
    label: "New Orders",
    description: "Waiting to be prepared",
  },
  PREPARING: {
    label: "Preparing",
    description: "Currently being prepared",
  },
  READY: {
    label: "Ready",
    description: "Waiting for waiter",
  },
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getNextAction(status: OrderStatus) {
  if (status === "ACCEPTED") {
    return {
      label: "Start Preparing",
      nextStatus: "PREPARING" as const,
    };
  }

  if (status === "PREPARING") {
    return {
      label: "Mark Ready",
      nextStatus: "READY" as const,
    };
  }

  return null;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [restaurantName, setRestaurantName] = useState("Kitchen");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(
    null
  );

  const loadOrders = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/kitchen/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data: KitchenResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load kitchen orders.");
      }

      setOrders(data.orders || []);

      if (data.restaurant?.name) {
        setRestaurantName(data.restaurant.name);
      }
    } catch (err) {
      console.error("Kitchen orders loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load kitchen orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    const interval = window.setInterval(() => {
      loadOrders(true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadOrders]);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      accepted: orders.filter((order) => order.status === "ACCEPTED").length,
      preparing: orders.filter(
        (order) => order.status === "PREPARING"
      ).length,
      ready: orders.filter((order) => order.status === "READY").length,
    };
  }, [orders]);

  const acceptedOrders = useMemo(
    () => orders.filter((order) => order.status === "ACCEPTED"),
    [orders]
  );

  const preparingOrders = useMemo(
    () => orders.filter((order) => order.status === "PREPARING"),
    [orders]
  );

  const readyOrders = useMemo(
    () => orders.filter((order) => order.status === "READY"),
    [orders]
  );

  async function updateOrderStatus(
    orderId: string,
    nextStatus: "PREPARING" | "READY"
  ) {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update order.");
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: nextStatus,
              }
            : order
        )
      );

      setSelectedOrder((currentOrder) =>
        currentOrder && currentOrder._id === orderId
          ? {
              ...currentOrder,
              status: nextStatus,
            }
          : currentOrder
      );
    } catch (err) {
      console.error("Kitchen order status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function renderOrderCard(order: KitchenOrder) {
    const action = getNextAction(order.status);
    const isUpdating = updatingOrderId === order._id;

    return (
      <div
        key={order._id}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-950">
                #{order.orderNumber}
              </span>

              {order.tableId && (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {order.tableId.name ||
                    `Table ${order.tableId.number}`}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {formatDate(order.createdAt)} ·{" "}
              {formatTime(order.createdAt)}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              order.status === "ACCEPTED"
                ? "bg-amber-100 text-amber-700"
                : order.status === "PREPARING"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {order.status === "ACCEPTED"
              ? "NEW"
              : order.status === "PREPARING"
              ? "PREPARING"
              : "READY"}
          </span>
        </div>

        {/* Customer / Table */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
              {order.customerName || "Walk-in Customer"}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Order Type
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {order.orderType === "DINE_IN"
                ? "Dine In"
                : "Takeaway"}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Items
          </p>

          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="rounded-xl bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
                      {item.quantity}
                    </span>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>

                      {item.notes && (
                        <p className="mt-1 text-xs text-amber-700">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-slate-700">
                    ₹{item.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Order Note
              </p>

              <p className="mt-1 text-sm text-amber-900">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            View Details
          </button>

          {action ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() =>
                updateOrderStatus(order._id, action.nextStatus)
              }
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : action.label}
            </button>
          ) : (
            <span className="rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-700">
              Ready for Waiter
            </span>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-5 py-8 sm:px-7">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-72 rounded bg-slate-200" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-white"
                />
              ))}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-96 rounded-2xl bg-white"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-5 py-8 sm:px-7">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {restaurantName}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Kitchen Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage food preparation and send completed orders to the waiter.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
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
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M5.1 9A7 7 0 0118.9 6.1L20 7M18.9 15A7 7 0 015.1 17.9L4 17"
              />
            </svg>

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-red-800">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-sm font-bold text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {counts.total}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              New
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {counts.accepted}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Preparing
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {counts.preparing}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Ready
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {counts.ready}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg
                className="h-7 w-7 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12h18M5 12V7a2 2 0 012-2h10a2 2 0 012 2v5M5 12v5a2 2 0 002 2h10a2 2 0 002-2v-5M8 8h8M8 16h5"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Kitchen is clear
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              There are currently no orders waiting for preparation.
              New accepted orders will appear here automatically.
            </p>
          </div>
        ) : (
          /* Kitchen Columns */
          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {/* New */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {STATUS_CONFIG.ACCEPTED.label}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {STATUS_CONFIG.ACCEPTED.description}
                  </p>
                </div>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {acceptedOrders.length}
                </span>
              </div>

              <div className="space-y-4">
                {acceptedOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
                    No new orders
                  </div>
                ) : (
                  acceptedOrders.map(renderOrderCard)
                )}
              </div>
            </section>

            {/* Preparing */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {STATUS_CONFIG.PREPARING.label}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {STATUS_CONFIG.PREPARING.description}
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="space-y-4">
                {preparingOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
                    Nothing is being prepared
                  </div>
                ) : (
                  preparingOrders.map(renderOrderCard)
                )}
              </div>
            </section>

            {/* Ready */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {STATUS_CONFIG.READY.label}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {STATUS_CONFIG.READY.description}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {readyOrders.length}
                </span>
              </div>

              <div className="space-y-4">
                {readyOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
                    No ready orders
                  </div>
                ) : (
                  readyOrders.map(renderOrderCard)
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Order #{selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedOrder.customerName ||
                      "Walk-in Customer"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Table
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedOrder.tableId?.name ||
                      (selectedOrder.tableId
                        ? `Table ${selectedOrder.tableId.number}`
                        : "Takeaway")}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ordered At
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatTime(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-950">
                  Items
                </h3>

                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-start justify-between gap-4 p-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Quantity: {item.quantity} × ₹
                          {item.price.toFixed(2)}
                        </p>

                        {item.notes && (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Order Note
                  </p>

                  <p className="mt-1 text-sm text-amber-900">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <span>
                    ₹{selectedOrder.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-slate-300">
                  <span>Tax</span>
                  <span>₹{selectedOrder.tax.toFixed(2)}</span>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="mt-2 flex justify-between text-sm text-emerald-300">
                    <span>Discount</span>
                    <span>
                      -₹{selectedOrder.discount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-base font-bold">
                  <span>Total</span>
                  <span>₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {getNextAction(selectedOrder.status) && (
                <button
                  type="button"
                  disabled={updatingOrderId === selectedOrder._id}
                  onClick={() => {
                    const action = getNextAction(selectedOrder.status);

                    if (action) {
                      updateOrderStatus(
                        selectedOrder._id,
                        action.nextStatus
                      );
                    }
                  }}
                  className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingOrderId === selectedOrder._id
                    ? "Updating..."
                    : getNextAction(selectedOrder.status)?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}