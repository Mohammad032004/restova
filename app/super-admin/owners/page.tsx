"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Search,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

interface Restaurant {
  _id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  status: "ACTIVE" | "SUSPENDED";
  numberOfTables: number;
}

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  restaurantId?: Restaurant;
  createdAt: string;
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadOwners() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/super-admin/owners",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load owners."
          );
        }

        setOwners(data.owners);
      } catch (error) {
        console.error(
          "Owners loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load owners."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOwners();
  }, []);

  const filteredOwners = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return owners;
    }

    return owners.filter((owner) => {
      return (
        owner.name
          .toLowerCase()
          .includes(query) ||
        owner.email
          .toLowerCase()
          .includes(query) ||
        owner.phone
          ?.toLowerCase()
          .includes(query) ||
        owner.restaurantId?.name
          ?.toLowerCase()
          .includes(query) ||
        owner.restaurantId?.city
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [owners, search]);

  const activeOwners = owners.filter(
    (owner) => owner.isActive
  ).length;

  const inactiveOwners = owners.filter(
    (owner) => !owner.isActive
  ).length;

  const connectedOwners = owners.filter(
    (owner) => owner.restaurantId
  ).length;

  async function updateOwnerStatus(
    ownerId: string,
    isActive: boolean
  ) {
    try {
      setUpdatingId(ownerId);
      setError("");

      const response = await fetch(
        `/api/super-admin/owners/${ownerId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update owner status."
        );
      }

      setOwners((current) =>
        current.map((owner) =>
          owner._id === ownerId
            ? {
                ...owner,
                isActive,
              }
            : owner
        )
      );
    } catch (error) {
      console.error(
        "Owner status update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update owner status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/super-admin"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Platform Management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Restaurant Owners
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage restaurant owner accounts and
                their connected restaurants.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <SummaryCard
                label="Total"
                value={loading ? "—" : owners.length}
              />

              <SummaryCard
                label="Active"
                value={
                  loading ? "—" : activeOwners
                }
              />

              <SummaryCard
                label="Inactive"
                value={
                  loading ? "—" : inactiveOwners
                }
              />

              <SummaryCard
                label="Connected"
                value={
                  loading ? "—" : connectedOwners
                }
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Unable to load owners
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search owner, email, phone, restaurant..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Owners */}
        <div className="rounded-2xl border border-slate-200 bg-white">

          {/* List Header */}
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Owner Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading owner accounts..."
                : `${filteredOwners.length} owner${
                    filteredOwners.length === 1
                      ? ""
                      : "s"
                  } found`}
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

              <p className="mt-4 text-sm text-slate-500">
                Loading owners...
              </p>
            </div>
          ) : filteredOwners.length === 0 ? (

            /* Empty */
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <UserRound size={24} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-950">
                No owners found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Restaurant owners will appear here after approval."}
              </p>
            </div>

          ) : (

            /* Owners */
            <div className="divide-y divide-slate-100">
              {filteredOwners.map((owner) => (
                <div
                  key={owner._id}
                  className="p-6 transition hover:bg-slate-50/60"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                    {/* Owner Information */}
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <UserRound size={21} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">
                            {owner.name}
                          </h3>

                          {owner.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              <CheckCircle2
                                size={12}
                              />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <XCircle size={12} />
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                          <Mail size={14} />
                          {owner.email}
                        </p>

                        {owner.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={13} />
                            {owner.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Restaurant */}
                    <div className="rounded-xl bg-slate-50 p-4 xl:w-96">
                      <div className="flex items-center gap-2">
                        <Store
                          size={15}
                          className="text-slate-500"
                        />

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Restaurant
                        </p>
                      </div>

                      {owner.restaurantId ? (
                        <>
                          <div className="mt-2 flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">
                              {owner.restaurantId.name}
                            </p>

                            {owner.restaurantId
                              .status === "ACTIVE" ? (
                              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                Suspended
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {owner.restaurantId.type}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={13} />
                              {owner.restaurantId.city},{" "}
                              {owner.restaurantId.state}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Building2 size={13} />
                              {
                                owner.restaurantId
                                  .numberOfTables
                              }{" "}
                              tables
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No restaurant connected
                        </p>
                      )}
                    </div>

                    {/* Account Action */}
                    <div className="flex shrink-0">
                      {owner.isActive ? (
                        <button
                          type="button"
                          disabled={
                            updatingId === owner._id
                          }
                          onClick={() =>
                            updateOwnerStatus(
                              owner._id,
                              false
                            )
                          }
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === owner._id
                            ? "Updating..."
                            : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            updatingId === owner._id
                          }
                          onClick={() =>
                            updateOwnerStatus(
                              owner._id,
                              true
                            )
                          }
                          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === owner._id
                            ? "Updating..."
                            : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}