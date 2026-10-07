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

type PaymentMethod =
  | "CASH"
  | "UPI"
  | "CARD"
  | "RAZORPAY"
  | "OTHER";

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

interface CashierOrder {
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
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  tableId?: TableInfo;
  createdAt: string;
  updatedAt: string;
}

interface CashierResponse {
  success: boolean;
  message?: string;
  restaurant?: {
    id: string;
    name: string;
  };
  orders?: CashierOrder[];
}

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

function getTableLabel(table?: TableInfo) {
  if (!table) {
    return "Takeaway";
  }

  return table.name || `Table ${table.number}`;
}

export default function CashierPage() {
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [restaurantName, setRestaurantName] = useState("Restaurant");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] =
    useState<CashierOrder | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const loadCashierData = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/cashier/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data: CashierResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load cashier data."
        );
      }

      setOrders(data.orders || []);

      if (data.restaurant?.name) {
        setRestaurantName(data.restaurant.name);
      }
    } catch (err) {
      console.error("Cashier data loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load cashier data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCashierData();

    const interval = window.setInterval(() => {
      loadCashierData(true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadCashierData]);

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === "SERVED" &&
          order.paymentStatus === "PENDING"
      ),
    [orders]
  );

  const paidOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.paymentStatus === "PAID" ||
          order.status === "COMPLETED"
      ),
    [orders]
  );

  const totalPendingAmount = useMemo(
    () =>
      pendingOrders.reduce(
        (sum, order) => sum + order.total,
        0
      ),
    [pendingOrders]
  );

  const totalPaidAmount = useMemo(
    () =>
      paidOrders.reduce(
        (sum, order) => sum + order.total,
        0
      ),
    [paidOrders]
  );

  async function completePayment(
    orderId: string,
    method: PaymentMethod
  ) {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const response = await fetch(
        `/api/restaurant/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "COMPLETED",
            paymentStatus: "PAID",
            paymentMethod: method,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to complete payment."
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: "COMPLETED",
                paymentStatus: "PAID",
                paymentMethod: method,
              }
            : order
        )
      );

      setSelectedOrder((currentOrder) =>
        currentOrder && currentOrder._id === orderId
          ? {
              ...currentOrder,
              status: "COMPLETED",
              paymentStatus: "PAID",
              paymentMethod: method,
            }
          : currentOrder
      );
    } catch (err) {
      console.error("Payment completion error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete payment."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function openPayment(order: CashierOrder) {
    setPaymentMethod(order.paymentMethod || "CASH");
    setSelectedOrder(order);
  }

  function renderPaymentMethod(method?: PaymentMethod) {
    switch (method) {
      case "CASH":
        return "Cash";

      case "UPI":
        return "UPI";

      case "CARD":
        return "Card";

      case "RAZORPAY":
        return "Razorpay";

      case "OTHER":
        return "Other";

      default:
        return "—";
    }
  }

  function renderPendingOrder(order: CashierOrder) {
    const isUpdating = updatingOrderId === order._id;

    return (
      <div
        key={order._id}
        className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-950">
                #{order.orderNumber}
              </span>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                PAYMENT DUE
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {formatDate(order.createdAt)} ·{" "}
              {formatTime(order.createdAt)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Table
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {getTableLabel(order.tableId)}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {order.customerName || "Walk-in Customer"}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Order
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {order.orderType === "DINE_IN"
                ? "Dine In"
                : "Takeaway"}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="p-4">
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
                    {item.quantity}
                  </span>

                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold text-slate-700">
                  ₹{item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 rounded-xl bg-slate-950 p-4 text-white">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Subtotal</span>

              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex justify-between text-sm text-slate-300">
              <span>Tax</span>

              <span>₹{order.tax.toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div className="mt-2 flex justify-between text-sm text-emerald-300">
                <span>Discount</span>

                <span>
                  -₹{order.discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-lg font-bold">
              <span>Total</span>

              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            View Bill
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => openPayment(order)}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? "Processing..." : "Take Payment"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-5 py-8 sm:px-7">
        <div className="mx-auto max-w-7xl animate-pulse">
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

          <div className="mt-8 h-96 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-5 py-8 sm:px-7">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {restaurantName}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Cashier Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage bills, collect payments, and complete served orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCashierData(true)}
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
              className="text-sm font-bold text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Bills Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {pendingOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Amount
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              ₹{totalPendingAmount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Paid Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {paidOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Paid Value
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              ₹{totalPaidAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pending Payments */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Pending Payments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Served orders waiting for payment.
              </p>
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {pendingOrders.length}
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <svg
                  className="h-7 w-7 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />
                  <path
                    strokeLinecap="round"
                    d="M3 10h18M7 15h3"
                  />
                </svg>
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No pending payments
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Served orders requiring payment will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pendingOrders.map(renderPendingOrder)}
            </div>
          )}
        </section>

        {/* Paid Orders */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">
              Recent Payments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recently completed payments.
            </p>
          </div>

          {paidOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No completed payments yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Order
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Table
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Method
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paidOrders.slice(0, 20).map((order) => (
                      <tr
                        key={order._id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            #{order.orderNumber}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatTime(order.updatedAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {getTableLabel(order.tableId)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {order.customerName ||
                            "Walk-in Customer"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {renderPaymentMethod(
                            order.paymentMethod
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-950">
                          ₹{order.total.toFixed(2)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            PAID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Payment / Bill Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selectedOrder.paymentStatus === "PAID"
                    ? "Payment Details"
                    : "Take Payment"}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Order #{selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-5">
              {/* Customer */}
              <div className="grid gap-3 sm:grid-cols-2">
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
                    {getTableLabel(selectedOrder.tableId)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-950">
                  Bill Items
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
                          {item.quantity} × ₹
                          {item.price.toFixed(2)}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal</span>

                  <span>
                    ₹{selectedOrder.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-slate-300">
                  <span>Tax</span>

                  <span>
                    ₹{selectedOrder.tax.toFixed(2)}
                  </span>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="mt-2 flex justify-between text-sm text-emerald-300">
                    <span>Discount</span>

                    <span>
                      -₹{selectedOrder.discount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-xl font-bold">
                  <span>Total</span>

                  <span>
                    ₹{selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment */}
              {selectedOrder.paymentStatus !== "PAID" &&
                selectedOrder.status === "SERVED" && (
                  <div className="mt-5">
                    <p className="text-sm font-bold text-slate-900">
                      Payment Method
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {(
                        [
                          ["CASH", "Cash"],
                          ["UPI", "UPI"],
                          ["CARD", "Card"],
                          ["OTHER", "Other"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setPaymentMethod(value)
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                            paymentMethod === value
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={
                        updatingOrderId === selectedOrder._id
                      }
                      onClick={() =>
                        completePayment(
                          selectedOrder._id,
                          paymentMethod
                        )
                      }
                      className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingOrderId === selectedOrder._id
                        ? "Processing Payment..."
                        : `Confirm Payment · ₹${selectedOrder.total.toFixed(
                            2
                          )}`}
                    </button>
                  </div>
                )}

              {/* Already paid */}
              {selectedOrder.paymentStatus === "PAID" && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-800">
                    Payment Completed
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    Method:{" "}
                    {renderPaymentMethod(
                      selectedOrder.paymentMethod
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}