"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Store,
  Trash2,
  User,
  XCircle,
} from "lucide-react";

interface Application {
  _id: string;
  restaurantName: string;
  restaurantType?: string;
  numberOfTables?: number;

  ownerName: string;
  email: string;
  phone?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  async function fetchApplications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/applications", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch applications."
        );
      }

      setApplications(data.applications || []);
    } catch (err) {
      console.error("Fetch applications error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load applications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  async function approveApplication(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to approve this application?\n\nThis will create the restaurant and restaurant owner account."
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
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to approve application."
        );
      }

      await fetchApplications();

      alert(
        data?.message ||
          "Application approved successfully."
      );
    } catch (err) {
      console.error("Approve application error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve application."
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

      const response = await fetch(
        `/api/applications/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to reject application."
        );
      }

      await fetchApplications();

      alert(
        data?.message ||
          "Application rejected successfully."
      );
    } catch (err) {
      console.error("Reject application error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject application."
      );
    } finally {
      setRejectingId(null);
    }
  }

  async function deleteApplication(application: Application) {
    if (application.status === "APPROVED") {
      alert(
        "Approved applications cannot be deleted because the restaurant and owner account have already been created."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete application for "${application.restaurantName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(application._id);
      setError("");

      const response = await fetch(
        `/api/applications/${application._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to delete application."
        );
      }

      setApplications((current) =>
        current.filter(
          (item) => item._id !== application._id
        )
      );

      alert(
        data?.message ||
          "Application deleted successfully."
      );
    } catch (err) {
      console.error("Delete application error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete application."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(date: string) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusClasses(status: Application["status"]) {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  }

  function getStatusIcon(status: Application["status"]) {
    if (status === "APPROVED") {
      return <CheckCircle2 size={14} />;
    }

    if (status === "REJECTED") {
      return <XCircle size={14} />;
    }

    return <Clock3 size={14} />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/super-admin"
              className="hover:text-slate-900"
            >
              Super Admin
            </Link>

            <span>/</span>

            <span className="text-slate-900">
              Applications
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Restaurant Applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review and manage restaurant registration
            applications.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Applications
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {applications.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
              <FileText
                size={20}
                className="text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pending
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Clock3
                size={20}
                className="text-amber-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Approved
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {approvedCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2
                size={20}
                className="text-emerald-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Rejected
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {rejectedCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <XCircle
                size={20}
                className="text-red-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            Applications
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Review restaurant registration requests
            submitted through the public registration
            form.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <RefreshCw
                size={18}
                className="animate-spin"
              />
              Loading applications...
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileText
                size={24}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No applications found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              New restaurant registration applications
              will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
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
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    {/* Main information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {application.restaurantName}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                application.status
                              )}`}
                            >
                              {getStatusIcon(
                                application.status
                              )}

                              {application.status}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            {application.restaurantType && (
                              <span className="inline-flex items-center gap-1.5">
                                <Store size={13} />
                                {application.restaurantType}
                              </span>
                            )}

                            {typeof application.numberOfTables ===
                              "number" && (
                              <span>
                                {application.numberOfTables}{" "}
                                tables
                              </span>
                            )}

                            <span>
                              Applied{" "}
                              {formatDate(
                                application.createdAt
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <User size={14} />
                            Owner
                          </div>

                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {application.ownerName}
                          </p>

                          {application.email && (
                            <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-slate-500">
                              <Mail size={12} />
                              {application.email}
                            </p>
                          )}

                          {application.phone && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone size={12} />
                              {application.phone}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <MapPin size={14} />
                            Location
                          </div>

                          <p className="mt-2 text-sm text-slate-700">
                            {application.address ||
                              "Address not provided"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {[
                              application.city,
                              application.state,
                              application.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <FileText size={14} />
                            Application
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            Application ID
                          </p>

                          <p className="mt-1 break-all font-mono text-xs text-slate-700">
                            {application._id}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 xl:w-[300px] xl:justify-end">
                      <Link
                        href={`/super-admin/applications/${application._id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye size={16} />
                        View
                      </Link>

                      {application.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            disabled={
                              isApproving ||
                              isRejecting ||
                              isDeleting
                            }
                            onClick={() =>
                              approveApplication(
                                application._id
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />

                            {isApproving
                              ? "Approving..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isApproving ||
                              isRejecting ||
                              isDeleting
                            }
                            onClick={() =>
                              rejectApplication(
                                application._id
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={16} />

                            {isRejecting
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </>
                      )}

                      {/* DELETE */}
                      {application.status !== "APPROVED" && (
                        <button
                          type="button"
                          disabled={
                            isApproving ||
                            isRejecting ||
                            isDeleting
                          }
                          onClick={() =>
                            deleteApplication(
                              application
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete application"
                        >
                          <Trash2 size={16} />

                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}

                      {application.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-500">
                          <CheckCircle2 size={15} />
                          Restaurant Created
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}