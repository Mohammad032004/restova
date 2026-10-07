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

type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "BILL_REQUESTED"
  | "CLEANING";

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
  status: TableStatus;
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
  paymentMethod?: PaymentMethod;
  paymentId?: string;
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

export default function CashierDashboardPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<RestaurantOrder | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [paymentId, setPaymentId] =
    useState("");

  const [processingPayment, setProcessingPayment] =
    useState(false);

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
              "Failed to load restaurant orders."
          );
        }

        setOrders(data.orders || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load restaurant orders."
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

  const payableOrders = useMemo(() => {
    return orders.filter((order) => {
      if (
        order.status !== "SERVED" ||
        order.paymentStatus === "PAID"
      ) {
        return false;
      }

      /*
       * DINE_IN:
       * Waiter must request bill first.
       */
      if (order.orderType === "DINE_IN") {
        return (
          order.tableId?.status ===
          "BILL_REQUESTED"
        );
      }

      /*
       * TAKEAWAY:
       * No table/bill-request requirement.
       */
      return true;
    });
  }, [orders]);

  const waitingForBillOrders = useMemo(() => {
    return orders.filter((order) => {
      return (
        order.status === "SERVED" &&
        order.paymentStatus !== "PAID" &&
        order.orderType === "DINE_IN" &&
        order.tableId?.status !==
          "BILL_REQUESTED"
      );
    });
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status === "COMPLETED" &&
        order.paymentStatus === "PAID"
    );
  }, [orders]);

  const pendingAmount = useMemo(() => {
    return payableOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
  }, [payableOrders]);

  const openPaymentModal = (
    order: RestaurantOrder
  ) => {
    setSelectedOrder(order);
    setPaymentMethod("CASH");
    setPaymentId("");
    setError("");
    setSuccess("");
  };

  const closePaymentModal = () => {
    if (processingPayment) {
      return;
    }

    setSelectedOrder(null);
    setPaymentMethod("CASH");
    setPaymentId("");
  };

  const handlePayment = async () => {
    if (!selectedOrder) {
      return;
    }

    /*
     * Final client-side protection.
     * Server remains the source of truth.
     */
    if (
      selectedOrder.status !== "SERVED"
    ) {
      setError(
        "Only served orders can be paid."
      );
      return;
    }

    if (
      selectedOrder.paymentStatus === "PAID"
    ) {
      setError(
        "This order has already been paid."
      );
      return;
    }

    if (
      selectedOrder.orderType === "DINE_IN" &&
      selectedOrder.tableId?.status !==
        "BILL_REQUESTED"
    ) {
      setError(
        "The waiter must request the bill before payment."
      );
      return;
    }

    if (
      paymentMethod !== "CASH" &&
      !paymentId.trim()
    ) {
      setError(
        "Payment ID is required for non-cash payments."
      );
      return;
    }

    setProcessingPayment(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/restaurant/orders/${selectedOrder._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "COMPLETED",
            paymentStatus: "PAID",
            paymentMethod,
            paymentId:
              paymentMethod === "CASH"
                ? ""
                : paymentId.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to process payment."
        );
      }

      setSuccess(
        data.message ||
          `Payment completed for Order #${selectedOrder.orderNumber}.`
      );

      setSelectedOrder(null);
      setPaymentMethod("CASH");
      setPaymentId("");

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process payment."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
              Cashier Panel
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Billing & Payments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Collect payments only after the waiter requests the bill.
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
                Bills
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {payableOrders.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Ready for payment
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-indigo-50 p-2.5">
                <svg
                  className="h-5 w-5 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2v20"
                    strokeLinecap="round"
                  />

                  <path
                    d="M17 6.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 3 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-slate-400">
                Amount
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(pendingAmount)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Pending collection
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
                Completed
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900">
              {completedOrders.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Paid orders
            </p>
          </div>
        </div>

        {/* Waiting for waiter */}
        {waitingForBillOrders.length > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5">
                <svg
                  className="h-5 w-5 text-amber-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />

                  <path
                    d="M12 7v5l3 2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h3 className="font-bold text-amber-900">
                  Waiting for bill request
                </h3>

                <p className="mt-1 text-sm text-amber-800">
                  {waitingForBillOrders.length} served{" "}
                  {waitingForBillOrders.length === 1
                    ? "order is"
                    : "orders are"}{" "}
                  waiting for the waiter to request the bill.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Queue */}
        <section className="mb-10">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              Payment Queue
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Orders that are served and ready for payment.
            </p>
          </div>

          {payableOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  className="h-6 w-6 text-emerald-600"
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
                No bills ready for payment
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Bills will appear here after the waiter requests them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payableOrders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900">
                          Order #{order.orderNumber}
                        </h4>

                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                          SERVED
                        </span>

                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                          BILL REQUESTED
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        {order.tableId && (
                          <span>
                            Table #{order.tableId.number}
                          </span>
                        )}

                        <span>
                          {order.orderType === "DINE_IN"
                            ? "Dine In"
                            : "Takeaway"}
                        </span>

                        <span>
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map(
                          (item, index) => (
                            <span
                              key={`${order._id}-item-${index}`}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              {item.quantity} ×{" "}
                              {item.name}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Amount
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openPaymentModal(order)
                        }
                        className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 lg:w-auto"
                      >
                        Collect Payment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed History */}
        <section>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              Completed Payments
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Recently completed and paid orders.
            </p>
          </div>

          {completedOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-semibold text-slate-700">
                No completed payments
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Order
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Table
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Method
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {completedOrders.map(
                      (order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                #{order.orderNumber}
                              </p>

                              <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                PAID
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {order.tableId
                              ? `Table #${order.tableId.number}`
                              : "Takeaway"}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {order.paymentMethod
                              ? formatStatus(
                                  order.paymentMethod
                                )
                              : "—"}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-900">
                            {formatCurrency(
                              order.total
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              order.updatedAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Payment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-indigo-600">
                    Collect Payment
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={processingPayment}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="m6 6 12 12M18 6 6 18"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">

              {/* Amount */}
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Total Amount
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(
                      selectedOrder.total
                    )}
                  </span>
                </div>

                {selectedOrder.tableId && (
                  <p className="mt-2 text-xs text-slate-500">
                    Table #{selectedOrder.tableId.number} • Bill Requested
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {(
                    [
                      "CASH",
                      "UPI",
                      "CARD",
                      "RAZORPAY",
                      "OTHER",
                    ] as PaymentMethod[]
                  ).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() =>
                        setPaymentMethod(method)
                      }
                      className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                        paymentMethod === method
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {formatStatus(method)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment ID */}
              {paymentMethod !== "CASH" && (
                <div>
                  <label
                    htmlFor="paymentId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Payment ID / Reference
                  </label>

                  <input
                    id="paymentId"
                    type="text"
                    value={paymentId}
                    onChange={(event) =>
                      setPaymentId(
                        event.target.value
                      )
                    }
                    placeholder="Enter transaction/reference ID"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}

              {/* Confirmation */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Confirm payment
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Once confirmed, this order will be marked as
                  <strong> COMPLETED </strong>
                  and
                  <strong> PAID</strong>.
                </p>
              </div>

              {/* Modal Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={processingPayment}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingPayment
                    ? "Processing..."
                    : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}