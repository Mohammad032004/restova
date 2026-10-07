"use client";

import { useEffect, useMemo, useState } from "react";

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

type OrderItem = {
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
};

type Table = {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: string;
};

type Order = {
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
  tableId?: Table | string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  restaurant?: {
    id: string;
    name: string;
  };
  orders?: Order[];
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
  }
> = {
  PLACED: {
    label: "New",
    className: "bg-amber-100 text-amber-700",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-blue-100 text-blue-700",
  },
  PREPARING: {
    label: "Preparing",
    className: "bg-orange-100 text-orange-700",
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-700",
  },
  SERVED: {
    label: "Served",
    className: "bg-purple-100 text-purple-700",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700",
  },
};

const paymentConfig: Record<
  PaymentStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "Payment Pending",
    className: "bg-amber-50 text-amber-700",
  },
  PAID: {
    label: "Paid",
    className: "bg-green-50 text-green-700",
  },
  FAILED: {
    label: "Payment Failed",
    className: "bg-red-50 text-red-700",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-purple-50 text-purple-700",
  },
};

type Filter =
  | "ALL"
  | "PLACED"
  | "PREPARING"
  | "READY"
  | "COMPLETED";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantName, setRestaurantName] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [filter, setFilter] = useState<Filter>("ALL");

  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");

  const loadOrders = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await fetch("/api/restaurant/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load restaurant orders."
        );
      }

      setOrders(data.orders || []);
      setRestaurantName(data.restaurant?.name || "");
    } catch (err) {
      console.error("Load orders error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ) => {
    try {
      setActionLoading(orderId);
      setError("");

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
          data.message || "Failed to update order."
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: data.order.status,
                updatedAt:
                  data.order.updatedAt || order.updatedAt,
              }
            : order
        )
      );

      setSelectedOrder((currentOrder) =>
        currentOrder && currentOrder._id === orderId
          ? {
              ...currentOrder,
              status: data.order.status,
              updatedAt:
                data.order.updatedAt || currentOrder.updatedAt,
            }
          : currentOrder
      );
    } catch (err) {
      console.error("Update order status error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") {
      return orders;
    }

    if (filter === "PLACED") {
      return orders.filter((order) => order.status === "PLACED");
    }

    if (filter === "PREPARING") {
      return orders.filter(
        (order) =>
          order.status === "ACCEPTED" ||
          order.status === "PREPARING"
      );
    }

    if (filter === "READY") {
      return orders.filter((order) => order.status === "READY");
    }

    if (filter === "COMPLETED") {
      return orders.filter(
        (order) =>
          order.status === "COMPLETED" ||
          order.status === "CANCELLED"
      );
    }

    return orders;
  }, [orders, filter]);

  const stats = useMemo(() => {
    return {
      all: orders.length,

      newOrders: orders.filter(
        (order) => order.status === "PLACED"
      ).length,

      preparing: orders.filter(
        (order) =>
          order.status === "ACCEPTED" ||
          order.status === "PREPARING"
      ).length,

      ready: orders.filter(
        (order) => order.status === "READY"
      ).length,

      completed: orders.filter(
        (order) =>
          order.status === "COMPLETED" ||
          order.status === "CANCELLED"
      ).length,
    };
  }, [orders]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTableName = (tableId?: Table | string) => {
    if (!tableId) {
      return "Takeaway";
    }

    if (typeof tableId === "string") {
      return "Table";
    }

    return tableId.name || `Table ${tableId.number}`;
  };

  const getSourceLabel = (source: Order["source"]) => {
    switch (source) {
      case "CUSTOMER_QR":
        return "QR Order";

      case "WAITER":
        return "Waiter";

      case "STAFF":
        return "Staff";

      default:
        return source;
    }
  };

  const getOrderActions = (order: Order) => {
    const isLoading = actionLoading === order._id;

    switch (order.status) {
      case "PLACED":
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                updateOrderStatus(order._id, "ACCEPTED")
              }
              disabled={isLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Accept Order"}
            </button>

            <button
              type="button"
              onClick={() =>
                updateOrderStatus(order._id, "CANCELLED")
              }
              disabled={isLoading}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        );

      case "ACCEPTED":
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                updateOrderStatus(order._id, "PREPARING")
              }
              disabled={isLoading}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Start Preparing"}
            </button>

            <button
              type="button"
              onClick={() =>
                updateOrderStatus(order._id, "CANCELLED")
              }
              disabled={isLoading}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        );

      case "PREPARING":
        return (
          <button
            type="button"
            onClick={() =>
              updateOrderStatus(order._id, "READY")
            }
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Mark Ready"}
          </button>
        );

      case "READY":
        return (
          <button
            type="button"
            onClick={() =>
              updateOrderStatus(order._id, "SERVED")
            }
            disabled={isLoading}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Mark Served"}
          </button>
        );

      case "SERVED":
        return (
          <button
            type="button"
            onClick={() =>
              updateOrderStatus(order._id, "COMPLETED")
            }
            disabled={isLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Complete Order"}
          </button>
        );

      case "COMPLETED":
        return (
          <span className="text-sm font-medium text-green-600">
            Order completed
          </span>
        );

      case "CANCELLED":
        return (
          <span className="text-sm font-medium text-red-600">
            Order cancelled
          </span>
        );

      default:
        return null;
    }
  };

  const filterButtons: {
    key: Filter;
    label: string;
    count: number;
  }[] = [
    {
      key: "ALL",
      label: "All Orders",
      count: stats.all,
    },
    {
      key: "PLACED",
      label: "New",
      count: stats.newOrders,
    },
    {
      key: "PREPARING",
      label: "Preparing",
      count: stats.preparing,
    },
    {
      key: "READY",
      label: "Ready",
      count: stats.ready,
    },
    {
      key: "COMPLETED",
      label: "Completed",
      count: stats.completed,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {restaurantName || "Restaurant"}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage incoming orders and track their progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(false)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h5M20 20v-5h-5M5.07 9A8 8 0 0119 6.34M18.93 15A8 8 0 015 17.66"
            />
          </svg>

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="All Orders"
          value={stats.all}
          icon="orders"
        />

        <StatCard
          title="New Orders"
          value={stats.newOrders}
          icon="new"
        />

        <StatCard
          title="Preparing"
          value={stats.preparing}
          icon="preparing"
        />

        <StatCard
          title="Ready"
          value={stats.ready}
          icon="ready"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon="completed"
        />
      </div>

      {/* Filters */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          {filterButtons.map((button) => {
            const active = filter === button.key;

            return (
              <button
                key={button.key}
                type="button"
                onClick={() => setFilter(button.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {button.label}

                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {button.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-7 w-7 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3h12M6 3v18M18 3v18M6 8h12M6 13h12M6 18h12"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            No orders found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            There are no orders matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status =
              statusConfig[order.status];

            const payment =
              paymentConfig[order.paymentStatus];

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Top */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
                      #{order.orderNumber}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                        <span>
                          {getTableName(order.tableId)}
                        </span>

                        <span>•</span>

                        <span>
                          {getSourceLabel(order.source)}
                        </span>

                        <span>•</span>

                        <span>
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${payment.className}`}
                    >
                      {payment.label}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                {(order.customerName ||
                  order.customerPhone) && (
                  <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      {order.customerName && (
                        <span className="font-medium text-gray-800">
                          {order.customerName}
                        </span>
                      )}

                      {order.customerPhone && (
                        <span className="text-gray-500">
                          {order.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Items preview */}
                <div className="mt-4">
                  <div className="space-y-2">
                    {order.items
                      .slice(0, 3)
                      .map((item, index) => (
                        <div
                          key={`${order._id}-${index}`}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
                              {item.quantity}
                            </span>

                            <span className="truncate text-gray-700">
                              {item.name}
                            </span>
                          </div>

                          <span className="shrink-0 font-medium text-gray-800">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}

                    {order.items.length > 3 && (
                      <p className="pt-1 text-xs text-gray-400">
                        + {order.items.length - 3} more item
                        {order.items.length - 3 !== 1
                          ? "s"
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOrder(order)
                    }
                    className="text-left text-sm font-medium text-gray-600 transition hover:text-gray-900"
                  >
                    View order details →
                  </button>

                  <div>{getOrderActions(order)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    Order #{selectedOrder.orderNumber}
                  </h2>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusConfig[
                        selectedOrder.status
                      ].className
                    }`}
                  >
                    {
                      statusConfig[
                        selectedOrder.status
                      ].label
                    }
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(selectedOrder.createdAt)} at{" "}
                  {formatTime(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto px-6 py-5">
              {/* Order Information */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBox
                  label="Table"
                  value={getTableName(
                    selectedOrder.tableId
                  )}
                />

                <InfoBox
                  label="Order Type"
                  value={
                    selectedOrder.orderType === "DINE_IN"
                      ? "Dine In"
                      : "Takeaway"
                  }
                />

                <InfoBox
                  label="Source"
                  value={getSourceLabel(
                    selectedOrder.source
                  )}
                />

                <InfoBox
                  label="Payment"
                  value={
                    paymentConfig[
                      selectedOrder.paymentStatus
                    ].label
                  }
                />
              </div>

              {/* Customer */}
              {(selectedOrder.customerName ||
                selectedOrder.customerPhone) && (
                <div className="mt-5 rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Customer
                  </h3>

                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {selectedOrder.customerName && (
                      <p>
                        <span className="font-medium text-gray-800">
                          Name:
                        </span>{" "}
                        {selectedOrder.customerName}
                      </p>
                    )}

                    {selectedOrder.customerPhone && (
                      <p>
                        <span className="font-medium text-gray-800">
                          Phone:
                        </span>{" "}
                        {selectedOrder.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Order Items
                </h3>

                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                  {selectedOrder.items.map(
                    (item, index) => (
                      <div
                        key={`${selectedOrder._id}-item-${index}`}
                        className={`flex items-start justify-between gap-4 px-4 py-3 ${
                          index !==
                          selectedOrder.items.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <div className="flex min-w-0 gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                            {item.quantity}
                          </span>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-800">
                              {item.name}
                            </p>

                            {item.notes && (
                              <p className="mt-1 text-xs text-gray-500">
                                Note: {item.notes}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-gray-400">
                              {formatCurrency(item.price)} each
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 font-semibold text-gray-800">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-semibold text-amber-800">
                    Order Notes
                  </h3>

                  <p className="mt-1 text-sm text-amber-700">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span className="font-medium text-gray-800">
                      {formatCurrency(
                        selectedOrder.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Tax
                    </span>

                    <span className="font-medium text-gray-800">
                      {formatCurrency(selectedOrder.tax)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Discount
                    </span>

                    <span className="font-medium text-gray-800">
                      -{" "}
                      {formatCurrency(
                        selectedOrder.discount
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">
                        Total
                      </span>

                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(
                          selectedOrder.total
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 border-t border-gray-200 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Order Actions
                </h3>

                {getOrderActions(selectedOrder)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon:
    | "orders"
    | "new"
    | "preparing"
    | "ready"
    | "completed";
}) {
  const icons = {
    orders: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 3h12M6 3v18M18 3v18M6 8h12M6 13h12M6 18h12"
        />
      </svg>
    ),

    new: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 5v14M5 12h14"
        />
      </svg>
    ),

    preparing: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2"
        />

        <circle cx="12" cy="12" r="9" />
      </svg>
    ),

    ready: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12l4 4L19 6"
        />
      </svg>
    ),

    completed: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12l4 4L19 6"
        />
      </svg>
    ),
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icons[icon]}
        </div>

        <span className="text-2xl font-bold text-gray-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">
        {title}
      </p>
    </div>
  );
}