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

interface TableInfo {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
  qrToken?: string;
}

interface WaiterOrder {
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

interface WaiterResponse {
  success: boolean;
  message?: string;
  restaurant?: {
    id: string;
    name: string;
    numberOfTables: number;
  };
  orders?: WaiterOrder[];
  tables?: TableInfo[];
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

function getTableStatusStyle(status: TableStatus) {
  switch (status) {
    case "AVAILABLE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "OCCUPIED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "BILL_REQUESTED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "CLEANING":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getTableStatusLabel(status: TableStatus) {
  switch (status) {
    case "AVAILABLE":
      return "Available";

    case "OCCUPIED":
      return "Occupied";

    case "BILL_REQUESTED":
      return "Bill Requested";

    case "CLEANING":
      return "Cleaning";

    default:
      return status;
  }
}

function getNextTableAction(status: TableStatus) {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Occupy Table",
        nextStatus: "OCCUPIED" as TableStatus,
      };

    case "OCCUPIED":
      return {
        label: "Request Bill",
        nextStatus: "BILL_REQUESTED" as TableStatus,
      };

    case "BILL_REQUESTED":
      return {
        label: "Start Cleaning",
        nextStatus: "CLEANING" as TableStatus,
      };

    case "CLEANING":
      return {
        label: "Mark Available",
        nextStatus: "AVAILABLE" as TableStatus,
      };

    default:
      return null;
  }
}

export default function WaiterPage() {
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [restaurantName, setRestaurantName] = useState("Restaurant");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [updatingTableId, setUpdatingTableId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<WaiterOrder | null>(null);

  const loadWaiterData = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/waiter/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data: WaiterResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load waiter data."
        );
      }

      setOrders(data.orders || []);
      setTables(data.tables || []);

      if (data.restaurant?.name) {
        setRestaurantName(data.restaurant.name);
      }
    } catch (err) {
      console.error("Waiter data loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load waiter data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWaiterData();

    const interval = window.setInterval(() => {
      loadWaiterData(true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadWaiterData]);

  const readyOrders = useMemo(
    () => orders.filter((order) => order.status === "READY"),
    [orders]
  );

  const servedOrders = useMemo(
    () => orders.filter((order) => order.status === "SERVED"),
    [orders]
  );

  const availableTables = useMemo(
    () => tables.filter((table) => table.status === "AVAILABLE"),
    [tables]
  );

  const occupiedTables = useMemo(
    () => tables.filter((table) => table.status === "OCCUPIED"),
    [tables]
  );

  const billRequestedTables = useMemo(
    () =>
      tables.filter(
        (table) => table.status === "BILL_REQUESTED"
      ),
    [tables]
  );

  const cleaningTables = useMemo(
    () => tables.filter((table) => table.status === "CLEANING"),
    [tables]
  );

  async function markOrderServed(orderId: string) {
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

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: "SERVED",
              }
            : order
        )
      );

      setSelectedOrder((currentOrder) =>
        currentOrder && currentOrder._id === orderId
          ? {
              ...currentOrder,
              status: "SERVED",
            }
          : currentOrder
      );
    } catch (err) {
      console.error("Mark served error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark order as served."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function updateTableStatus(
    tableId: string,
    nextStatus: TableStatus
  ) {
    try {
      setUpdatingTableId(tableId);
      setError("");

      const response = await fetch(
        `/api/waiter/tables/${tableId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update table."
        );
      }

      setTables((currentTables) =>
        currentTables.map((table) =>
          table._id === tableId
            ? {
                ...table,
                status: nextStatus,
              }
            : table
        )
      );
    } catch (err) {
      console.error("Table status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update table."
      );
    } finally {
      setUpdatingTableId(null);
    }
  }

  function renderReadyOrder(order: WaiterOrder) {
    const isUpdating = updatingOrderId === order._id;

    return (
      <div
        key={order._id}
        className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-950">
                #{order.orderNumber}
              </span>

              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                READY
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

        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {order.customerName || "Walk-in Customer"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Items
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}
              </p>
            </div>
          </div>

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

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>

                    {item.notes && (
                      <p className="mt-0.5 truncate text-xs text-amber-700">
                        {item.notes}
                      </p>
                    )}
                  </div>
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

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            View Details
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => markOrderServed(order._id)}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Mark Served"}
          </button>
        </div>
      </div>
    );
  }

  function renderTableCard(table: TableInfo) {
    const action = getNextTableAction(table.status);
    const isUpdating = updatingTableId === table._id;

    return (
      <div
        key={table._id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-950">
              {table.name || `Table ${table.number}`}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Capacity: {table.capacity}
            </p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
            {table.number}
          </span>
        </div>

        <div
          className={`mt-4 rounded-xl border px-3 py-2 text-center text-xs font-bold ${getTableStatusStyle(
            table.status
          )}`}
        >
          {getTableStatusLabel(table.status)}
        </div>

        {action && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() =>
              updateTableStatus(
                table._id,
                action.nextStatus
              )
            }
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : action.label}
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-5 py-8 sm:px-7">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-52 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-80 rounded bg-slate-200" />

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
              Waiter Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Serve ready orders and manage restaurant table status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadWaiterData(true)}
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Ready to Serve
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {readyOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Served
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {servedOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Tables
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {availableTables.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Bill Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {billRequestedTables.length}
            </p>
          </div>
        </div>

        {/* Ready Orders */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Ready Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Orders prepared by the kitchen and waiting to be served.
              </p>
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {readyOrders.length}
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
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
                    d="M3 12h18M5 12V7a2 2 0 012-2h10a2 2 0 012 2v5M5 12v5a2 2 0 002 2h10a2 2 0 002-2v-5"
                  />
                </svg>
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No orders ready
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                New ready orders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {readyOrders.map(renderReadyOrder)}
            </div>
          )}
        </section>

        {/* Tables */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">
              Restaurant Tables
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the current state of each restaurant table.
            </p>
          </div>

          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h3 className="font-bold text-slate-900">
                No tables configured
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tables will appear here after they are configured.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tables.map(renderTableCard)}
            </div>
          )}
        </section>

        {/* Table Summary */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {availableTables.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Occupied
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {occupiedTables.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bill Requested
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {billRequestedTables.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cleaning
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-600">
              {cleaningTables.length}
            </p>
          </div>
        </section>
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
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
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
                    {getTableLabel(selectedOrder.tableId)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    {selectedOrder.status}
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

                <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-base font-bold">
                  <span>Total</span>

                  <span>
                    ₹{selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedOrder.status === "READY" && (
                <button
                  type="button"
                  disabled={
                    updatingOrderId === selectedOrder._id
                  }
                  onClick={() =>
                    markOrderServed(selectedOrder._id)
                  }
                  className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingOrderId === selectedOrder._id
                    ? "Updating..."
                    : "Mark Served"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}