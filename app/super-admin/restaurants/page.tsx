"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Search,
  Store,
  Users,
  XCircle,
} from "lucide-react";

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

interface Restaurant {
  _id: string;
  name: string;
  type: string;
  ownerId: Owner;
  address: string;
  city: string;
  state: string;
  pincode: string;
  numberOfTables: number;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/super-admin/restaurants",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load restaurants."
          );
        }

        setRestaurants(data.restaurants);
      } catch (error) {
        console.error(
          "Restaurants loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load restaurants."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      return (
        restaurant.name
          .toLowerCase()
          .includes(query) ||
        restaurant.type
          .toLowerCase()
          .includes(query) ||
        restaurant.city
          .toLowerCase()
          .includes(query) ||
        restaurant.state
          .toLowerCase()
          .includes(query) ||
        restaurant.ownerId?.name
          ?.toLowerCase()
          .includes(query) ||
        restaurant.ownerId?.email
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [restaurants, search]);

  const activeCount = restaurants.filter(
    (restaurant) => restaurant.status === "ACTIVE"
  ).length;

  const suspendedCount = restaurants.filter(
    (restaurant) => restaurant.status === "SUSPENDED"
  ).length;

  async function updateRestaurantStatus(
    restaurantId: string,
    status: "ACTIVE" | "SUSPENDED"
  ) {
    try {
      setUpdatingId(restaurantId);
      setError("");

      const response = await fetch(
        `/api/super-admin/restaurants/${restaurantId}/status`,
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
            "Failed to update restaurant status."
        );
      }

      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant._id === restaurantId
            ? {
                ...restaurant,
                status,
              }
            : restaurant
        )
      );
    } catch (error) {
      console.error(
        "Restaurant status update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update restaurant status."
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
                Restaurants
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                View and manage all restaurants registered
                on Restova.
              </p>
            </div>

            {/* Summary */}
            <div className="flex flex-wrap gap-3">
              <SummaryCard
                label="Total"
                value={
                  loading ? "—" : restaurants.length
                }
              />

              <SummaryCard
                label="Active"
                value={
                  loading ? "—" : activeCount
                }
              />

              <SummaryCard
                label="Suspended"
                value={
                  loading ? "—" : suspendedCount
                }
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Unable to load restaurants
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
              placeholder="Search restaurant, owner, email, city..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Restaurant List */}
        <div className="rounded-2xl border border-slate-200 bg-white">

          {/* List Header */}
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Restaurant Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading restaurant accounts..."
                : `${filteredRestaurants.length} restaurant${
                    filteredRestaurants.length === 1
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
                Loading restaurants...
              </p>
            </div>
          ) : filteredRestaurants.length === 0 ? (

            /* Empty */
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Store size={24} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-950">
                No restaurants found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Approved restaurants will appear here."}
              </p>
            </div>

          ) : (

            /* Restaurants */
            <div className="divide-y divide-slate-100">
              {filteredRestaurants.map(
                (restaurant) => (
                  <div
                    key={restaurant._id}
                    className="p-6 transition hover:bg-slate-50/60"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                      {/* Restaurant Information */}
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Building2 size={21} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">
                              {restaurant.name}
                            </h3>

                            {restaurant.status ===
                            "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                <CheckCircle2
                                  size={12}
                                />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                <XCircle size={12} />
                                Suspended
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {restaurant.type}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={14} />

                              {restaurant.city},{" "}
                              {restaurant.state}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Store size={14} />

                              {restaurant.numberOfTables}{" "}
                              tables
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="min-w-0 rounded-xl bg-slate-50 p-4 xl:w-80">
                        <div className="flex items-center gap-2">
                          <Users
                            size={15}
                            className="text-slate-500"
                          />

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Owner
                          </p>
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                          {restaurant.ownerId?.name ||
                            "Unknown Owner"}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                          <Mail size={13} />

                          {restaurant.ownerId?.email ||
                            "No email"}
                        </p>

                        {restaurant.ownerId?.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={13} />

                            {restaurant.ownerId.phone}
                          </p>
                        )}
                      </div>

                      {/* Status Action */}
                      <div className="flex shrink-0 items-center">
                        {restaurant.status ===
                        "ACTIVE" ? (
                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              restaurant._id
                            }
                            onClick={() =>
                              updateRestaurantStatus(
                                restaurant._id,
                                "SUSPENDED"
                              )
                            }
                            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                            restaurant._id
                              ? "Updating..."
                              : "Suspend"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              restaurant._id
                            }
                            onClick={() =>
                              updateRestaurantStatus(
                                restaurant._id,
                                "ACTIVE"
                              )
                            }
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                            restaurant._id
                              ? "Updating..."
                              : "Activate"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
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