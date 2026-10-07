"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  QrCode,
  Users,
  X,
} from "lucide-react";

interface Table {
  _id: string;
  name: string;
  number: number;
  capacity: number;
  status:
    | "AVAILABLE"
    | "OCCUPIED"
    | "BILL_REQUESTED"
    | "CLEANING";
  qrToken?: string;
}

interface RestaurantInfo {
  id: string;
  name: string;
  configuredTables: number;
}

interface TablesResponse {
  success: boolean;
  restaurant: RestaurantInfo;
  tables: Table[];
  message?: string;
}

const statusStyles: Record<Table["status"], string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  OCCUPIED: "bg-orange-50 text-orange-700",
  BILL_REQUESTED: "bg-blue-50 text-blue-700",
  CLEANING: "bg-slate-100 text-slate-700",
};

function formatStatus(status: Table["status"]) {
  return status.replaceAll("_", " ");
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurant, setRestaurant] =
    useState<RestaurantInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("2");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadTables(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/restaurant/tables", {
        method: "GET",
        cache: "no-store",
      });

      const result: TablesResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load tables."
        );
      }

      setTables(result.tables || []);
      setRestaurant(result.restaurant);
    } catch (error) {
      console.error("Load tables error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load tables."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, []);

  function resetForm() {
    setName("");
    setNumber("");
    setCapacity("2");
    setError("");
  }

  function openCreateModal() {
    resetForm();

    /*
     * Automatically suggest the next table number.
     */
    if (tables.length > 0) {
      const nextNumber =
        Math.max(...tables.map((table) => table.number)) + 1;

      setNumber(String(nextNumber));
    } else {
      setNumber("1");
    }

    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (creating) return;

    setShowCreateModal(false);
    resetForm();
  }

  async function handleCreateTable(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/restaurant/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          number: Number(number),
          capacity: Number(capacity),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to create table."
        );
      }

      setSuccess("Table created successfully.");
      setShowCreateModal(false);
      resetForm();

      await loadTables(true);
    } catch (error) {
      console.error("Create table error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create table."
      );
    } finally {
      setCreating(false);
    }
  }

  function getQrUrl(table: Table) {
    if (!table.qrToken) return "";

    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/menu/${table.qrToken}`;
  }

  async function handleCopyQrUrl(table: Table) {
    const url = getQrUrl(table);

    if (!url) {
      setError("QR URL is not available for this table.");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);

      setSuccess(`QR URL copied for ${table.name}.`);
    } catch {
      setError("Unable to copy the QR URL.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm text-slate-500">
            Loading tables...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Restaurant Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Tables
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your restaurant tables and customer QR
              access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadTables(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={
                !!restaurant &&
                tables.length >= restaurant.configuredTables
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Add Table
            </button>
          </div>
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
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Configured
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {restaurant?.configuredTables ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Maximum tables
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Created
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {tables.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Tables currently configured
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Available
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {
                tables.filter(
                  (table) => table.status === "AVAILABLE"
                ).length
              }
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Ready for customers
            </p>
          </div>
        </div>

        {/* Tables */}
        <section className="mt-6">
          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Users
                  size={25}
                  className="text-slate-400"
                />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No tables created
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Create your first table to start managing
                seating and customer QR ordering.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={17} />
                Create First Table
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((table) => (
                <div
                  key={table._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
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
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[table.status]}`}
                    >
                      {formatStatus(table.status)}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Users size={17} />

                    <span>
                      Capacity:{" "}
                      <strong className="text-slate-800">
                        {table.capacity}
                      </strong>
                    </span>
                  </div>

                  {/* QR */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                      <QrCode
                        size={18}
                        className="text-indigo-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Customer QR
                        </p>

                        <p className="text-xs text-slate-400">
                          Ordering access
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyQrUrl(table)
                      }
                      disabled={!table.qrToken}
                      className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Copy QR URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Table
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add a table to your restaurant.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateTable}
              className="space-y-5 p-6"
            >
              <div>
                <label
                  htmlFor="tableName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Table Name
                </label>

                <input
                  id="tableName"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Table 1"
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="tableNumber"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Table Number
                </label>

                <input
                  id="tableNumber"
                  type="number"
                  min="1"
                  value={number}
                  onChange={(event) =>
                    setNumber(event.target.value)
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Seating Capacity
                </label>

                <input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) =>
                    setCapacity(event.target.value)
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {restaurant && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  {tables.length} of{" "}
                  {restaurant.configuredTables} tables
                  configured.
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Table
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}