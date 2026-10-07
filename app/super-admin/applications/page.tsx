"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Trash2,
  XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";

interface Application {
  _id: string;

  restaurantName: string;
  restaurantType: string;
  numberOfTables: number;

  ownerName: string;
  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  pincode: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/applications", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load applications."
        );
      }

      setApplications(result.applications || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading applications."
      );
    } finally {
      setLoading(false);
    }
  }

  async function approveApplication(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to approve this application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setApprovingId(id);
      setError("");

      const response = await fetch(
        `/api/applications/${id}/approve`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to approve application."
        );
      }

      alert(
        "Application approved successfully.\n\nRestaurant and owner account have been created."
      );

      await fetchApplications();
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while approving the application."
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function rejectApplication(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRejectingId(id);
      setError("");

      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to reject application."
        );
      }

      await fetchApplications();
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while rejecting the application."
      );
    } finally {
      setRejectingId(null);
    }
  }

  async function deleteApplication(id: string) {
    const application = applications.find(
      (item) => item._id === id
    );

    if (!application) {
      return;
    }

    if (application.status === "APPROVED") {
      setError(
        "Approved applications cannot be deleted because the restaurant and owner account already exist."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the application from ${application.ownerName} for ${application.restaurantName}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to delete application."
        );
      }

      setApplications((current) =>
        current.filter((item) => item._id !== id)
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the application."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount = applications.filter(
    (application) => application.status === "PENDING"
  ).length;

  const approvedCount = applications.filter(
    (application) => application.status === "APPROVED"
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === "REJECTED"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              R
            </div>

            <div>
              <p className="text-lg font-bold leading-none tracking-tight text-slate-950">
                Restova
              </p>

              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Super Admin
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to website
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Restaurant Applications
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review and manage restaurant registration requests.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <Clock3 className="text-amber-600" size={20} />

              <div>
                <p className="text-sm font-medium text-amber-700">
                  Pending
                </p>

                <p className="mt-1 text-2xl font-bold text-amber-900">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="text-emerald-600"
                size={20}
              />

              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Approved
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-900">
                  {approvedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-600" size={20} />

              <div>
                <p className="text-sm font-medium text-red-700">
                  Rejected
                </p>

                <p className="mt-1 text-2xl font-bold text-red-900">
                  {rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              Loading applications...
            </p>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Building2
              className="mx-auto mb-4 text-slate-300"
              size={40}
            />

            <h2 className="text-lg font-semibold text-slate-900">
              No applications
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There are currently no restaurant applications.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {applications.map((application) => {
              const isApproving =
                approvingId === application._id;

              const isRejecting =
                rejectingId === application._id;

              const isDeleting =
                deletingId === application._id;

              return (
                <div
                  key={application._id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-950">
                          {application.restaurantName}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            application.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : application.status ===
                                  "APPROVED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {application.restaurantType}
                      </p>

                      {/* Details */}
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-start gap-3">
                          <Building2
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Owner
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-800">
                              {application.ownerName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Mail
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Email
                            </p>

                            <p className="mt-1 break-all text-sm text-slate-700">
                              {application.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Phone
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {application.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Location
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {application.city},{" "}
                              {application.state}
                            </p>

                            <p className="text-xs text-slate-400">
                              {application.pincode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Building2
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Tables
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {application.numberOfTables}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Applied
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {new Date(
                              application.createdAt
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Address
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {application.address}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2 lg:w-44">
                      {application.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              approveApplication(
                                application._id
                              )
                            }
                            disabled={
                              isApproving ||
                              isRejecting ||
                              isDeleting
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle2 size={16} />

                            {isApproving
                              ? "Approving..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              rejectApplication(
                                application._id
                              )
                            }
                            disabled={
                              isApproving ||
                              isRejecting ||
                              isDeleting
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <XCircle size={16} />

                            {isRejecting
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </>
                      )}

                      {/* Delete only pending/rejected */}
                      {application.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            deleteApplication(
                              application._id
                            )
                          }
                          disabled={
                            isApproving ||
                            isRejecting ||
                            isDeleting
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={16} />

                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}

                      {/* Approved info */}
                      {application.status === "APPROVED" && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                          <p className="text-xs font-medium leading-5 text-emerald-700">
                            Approved application
                          </p>

                          <p className="mt-1 text-[11px] leading-4 text-emerald-600">
                            Restaurant and owner account created
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}