"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Store,
  Trash2,
  User,
  Users,
  X,
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

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<
    Application[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [approvingId, setApprovingId] =
    useState<string | null>(null);

  const [rejectingId, setRejectingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

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
          data?.message ||
            "Failed to approve application."
        );
      }

      await fetchApplications();

      alert(
        data?.message ||
          "Application approved successfully."
      );
    } catch (err) {
      console.error(
        "Approve application error:",
        err
      );

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
          data?.message ||
            "Failed to reject application."
        );
      }

      await fetchApplications();

      alert(
        data?.message ||
          "Application rejected successfully."
      );
    } catch (err) {
      console.error(
        "Reject application error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject application."
      );
    } finally {
      setRejectingId(null);
    }
  }

  async function deleteApplication(
    application: Application
  ) {
    const isApproved =
      application.status === "APPROVED";

    const confirmationMessage = isApproved
      ? `Delete approved application for "${application.restaurantName}"?\n\nWARNING: This will permanently delete:\n\n• The application\n• The restaurant\n• The restaurant owner account\n• The owner password invitation\n\nThis action cannot be undone.`
      : `Delete application for "${application.restaurantName}"?\n\nThis action cannot be undone.`;

    const confirmed = window.confirm(
      confirmationMessage
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
          data?.message ||
            "Failed to delete application."
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
      console.error(
        "Delete application error:",
        err
      );

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
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getStatusClasses(
    status: Application["status"]
  ) {
    switch (status) {
      case "APPROVED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "REJECTED":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  function getStatusIcon(
    status: Application["status"]
  ) {
    if (status === "APPROVED") {
      return <CheckCircle2 size={13} />;
    }

    if (status === "REJECTED") {
      return <XCircle size={13} />;
    }

    return <Clock3 size={13} />;
  }

  const pendingCount = applications.filter(
    (application) =>
      application.status === "PENDING"
  ).length;

  const approvedCount = applications.filter(
    (application) =>
      application.status === "APPROVED"
  ).length;

  const rejectedCount = applications.filter(
    (application) =>
      application.status === "REJECTED"
  ).length;

  const filteredApplications = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        application.restaurantName,
        application.ownerName,
        application.email,
        application.phone,
        application.restaurantType,
        application.city,
        application.state,
        application.pincode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    applications,
    searchQuery,
    statusFilter,
  ]);

  return (
    <>
      <style jsx>{`
        @keyframes application-flow-one {
          0% {
            transform: translate3d(-10%, -5%, 0)
              scale(1);
          }

          50% {
            transform: translate3d(10%, 8%, 0)
              scale(1.12);
          }

          100% {
            transform: translate3d(-10%, -5%, 0)
              scale(1);
          }
        }

        @keyframes application-flow-two {
          0% {
            transform: translate3d(8%, 5%, 0)
              scale(1.05);
          }

          50% {
            transform: translate3d(-10%, -5%, 0)
              scale(1);
          }

          100% {
            transform: translate3d(8%, 5%, 0)
              scale(1.05);
          }
        }

        .application-flow-one {
          animation: application-flow-one 9s ease-in-out
            infinite;
        }

        .application-flow-two {
          animation: application-flow-two 11s ease-in-out
            infinite;
        }
      `}</style>

      <div className="min-h-[calc(100vh-76px)] bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1500px]">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <section className="relative mb-6 overflow-hidden rounded-[26px] border border-indigo-200/60 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-cyan-100" />

            <div className="application-flow-one absolute -left-20 -top-24 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />

            <div className="application-flow-two absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />

            <div className="absolute inset-0 bg-white/35" />

            <div className="relative px-6 py-7 sm:px-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600 shadow-sm backdrop-blur">
                    <FileText size={13} />

                    Applications
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Restaurant Applications
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Review, approve and manage restaurant
                    registration requests submitted to
                    Restova.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchApplications}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>
              </div>
            </div>
          </section>

          {/* =====================================================
              ERROR
          ====================================================== */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
              <XCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-0.5 text-red-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* =====================================================
              STATISTICS
          ====================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ApplicationMetric
              label="Total Applications"
              value={applications.length}
              description="All registration requests"
              icon={FileText}
              color="indigo"
            />

            <ApplicationMetric
              label="Pending"
              value={pendingCount}
              description="Waiting for review"
              icon={Clock3}
              color="amber"
            />

            <ApplicationMetric
              label="Approved"
              value={approvedCount}
              description="Successfully approved"
              icon={CheckCircle2}
              color="emerald"
            />

            <ApplicationMetric
              label="Rejected"
              value={rejectedCount}
              description="Rejected requests"
              icon={XCircle}
              color="red"
            />
          </div>

          {/* =====================================================
              SEARCH / FILTER BAR
          ====================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search restaurant, owner, email, city..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto">
                <StatusFilterButton
                  active={statusFilter === "ALL"}
                  onClick={() =>
                    setStatusFilter("ALL")
                  }
                >
                  All
                </StatusFilterButton>

                <StatusFilterButton
                  active={
                    statusFilter === "PENDING"
                  }
                  onClick={() =>
                    setStatusFilter("PENDING")
                  }
                >
                  Pending
                </StatusFilterButton>

                <StatusFilterButton
                  active={
                    statusFilter === "APPROVED"
                  }
                  onClick={() =>
                    setStatusFilter("APPROVED")
                  }
                >
                  Approved
                </StatusFilterButton>

                <StatusFilterButton
                  active={
                    statusFilter === "REJECTED"
                  }
                  onClick={() =>
                    setStatusFilter("REJECTED")
                  }
                >
                  Rejected
                </StatusFilterButton>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-600">
                  {filteredApplications.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-600">
                  {applications.length}
                </span>{" "}
                applications
              </p>

              {(searchQuery ||
                statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {/* =====================================================
              APPLICATION LIST
          ====================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Applications
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Review restaurant registration
                    requests.
                  </p>
                </div>

                <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex">
                  <Users
                    size={15}
                    className="text-slate-400"
                  />

                  <span className="text-xs font-semibold text-slate-600">
                    {filteredApplications.length} results
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : filteredApplications.length === 0 ? (
              <EmptyState
                hasFilters={
                  Boolean(searchQuery) ||
                  statusFilter !== "ALL"
                }
                onClear={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredApplications.map(
                  (application) => {
                    const isApproving =
                      approvingId ===
                      application._id;

                    const isRejecting =
                      rejectingId ===
                      application._id;

                    const isDeleting =
                      deletingId ===
                      application._id;

                    const isBusy =
                      isApproving ||
                      isRejecting ||
                      isDeleting;

                    return (
                      <ApplicationRow
                        key={application._id}
                        application={application}
                        isBusy={isBusy}
                        isApproving={
                          isApproving
                        }
                        isRejecting={
                          isRejecting
                        }
                        isDeleting={
                          isDeleting
                        }
                        onView={() =>
                          setSelectedApplication(
                            application
                          )
                        }
                        onApprove={() =>
                          approveApplication(
                            application._id
                          )
                        }
                        onReject={() =>
                          rejectApplication(
                            application._id
                          )
                        }
                        onDelete={() =>
                          deleteApplication(
                            application
                          )
                        }
                        formatDate={formatDate}
                        getStatusClasses={
                          getStatusClasses
                        }
                        getStatusIcon={
                          getStatusIcon
                        }
                      />
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* =======================================================
          QUICK VIEW MODAL
      ======================================================== */}

      {selectedApplication && (
        <ApplicationQuickView
          application={selectedApplication}
          onClose={() =>
            setSelectedApplication(null)
          }
          formatDate={formatDate}
        />
      )}
    </>
  );
}

/* =========================================================
   APPLICATION METRIC
========================================================= */

interface ApplicationMetricProps {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color:
    | "indigo"
    | "amber"
    | "emerald"
    | "red";
}

function ApplicationMetric({
  label,
  value,
  description,
  icon: Icon,
  color,
}: ApplicationMetricProps) {
  const styles = {
    indigo: {
      glow: "bg-indigo-300/30",
      icon: "bg-indigo-50 text-indigo-600",
      line: "bg-indigo-500",
    },
    amber: {
      glow: "bg-amber-300/30",
      icon: "bg-amber-50 text-amber-600",
      line: "bg-amber-500",
    },
    emerald: {
      glow: "bg-emerald-300/30",
      icon: "bg-emerald-50 text-emerald-600",
      line: "bg-emerald-500",
    },
    red: {
      glow: "bg-red-300/30",
      icon: "bg-red-50 text-red-600",
      line: "bg-red-500",
    },
  };

  const style = styles[color];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
      <div
        className={`application-flow-one absolute -right-12 -top-16 h-36 w-36 rounded-full ${style.glow} blur-3xl`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1.5 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full w-2/5 rounded-full ${style.line} transition-all duration-500 group-hover:w-3/5`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

interface StatusFilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function StatusFilterButton({
  active,
  onClick,
  children,
}: StatusFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   APPLICATION ROW
========================================================= */

interface ApplicationRowProps {
  application: Application;
  isBusy: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isDeleting: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  getStatusClasses: (
    status: Application["status"]
  ) => string;
  getStatusIcon: (
    status: Application["status"]
  ) => React.ReactNode;
}

function ApplicationRow({
  application,
  isBusy,
  isApproving,
  isRejecting,
  isDeleting,
  onView,
  onApprove,
  onReject,
  onDelete,
  formatDate,
  getStatusClasses,
  getStatusIcon,
}: ApplicationRowProps) {
  return (
    <article className="group relative p-5 transition-colors hover:bg-slate-50/60 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">

        {/* Main content */}

        <div className="min-w-0 flex-1">

          {/* Restaurant heading */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                  <Store size={17} />
                </div>

                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">
                    {application.restaurantName}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {application.restaurantType && (
                      <span>
                        {application.restaurantType}
                      </span>
                    )}

                    {typeof application.numberOfTables ===
                      "number" && (
                      <>
                        <span className="text-slate-300">
                          •
                        </span>

                        <span>
                          {application.numberOfTables}{" "}
                          tables
                        </span>
                      </>
                    )}

                    <span className="text-slate-300">
                      •
                    </span>

                    <span>
                      Applied{" "}
                      {formatDate(
                        application.createdAt
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                application.status
              )}`}
            >
              {getStatusIcon(
                application.status
              )}

              {application.status}
            </span>
          </div>

          {/* Information grid */}

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

            {/* Owner */}

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 transition group-hover:bg-white">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <User size={13} />

                Owner
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {application.ownerName}
              </p>

              {application.email && (
                <p className="mt-1.5 flex items-center gap-1.5 break-all text-xs text-slate-500">
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

            {/* Location */}

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 transition group-hover:bg-white">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <MapPin size={13} />

                Location
              </div>

              <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900">
                {application.city ||
                  "Location not provided"}
              </p>

              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {[
                  application.address,
                  application.state,
                  application.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") ||
                  "Address not provided"}
              </p>
            </div>

            {/* Application */}

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 transition group-hover:bg-white">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <FileText size={13} />

                Application
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Application ID
              </p>

              <p className="mt-1 truncate font-mono text-xs font-medium text-slate-700">
                {application._id}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}

        <div className="flex flex-wrap items-center gap-2 xl:w-[310px] xl:justify-end xl:self-center">
          <Link
            href={`/super-admin/applications/${application._id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
          >
            <Eye size={16} />

            View
          </Link>

          <button
            type="button"
            onClick={onView}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Quick View
          </button>

          {application.status === "PENDING" && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={onApprove}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApproving ? (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={15} />
                )}

                {isApproving
                  ? "Approving..."
                  : "Approve"}
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={onReject}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRejecting ? (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <XCircle size={15} />
                )}

                {isRejecting
                  ? "Rejecting..."
                  : "Reject"}
              </button>
            </>
          )}

          <button
            type="button"
            disabled={isBusy}
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <RefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={15} />
            )}

            {isDeleting
              ? "Deleting..."
              : "Delete"}
          </button>

          {application.status === "APPROVED" && (
            <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} />

              Restaurant Created
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   LOADING STATE
========================================================= */

function LoadingState() {
  return (
    <div className="grid gap-4 p-5 sm:p-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-slate-100 p-5"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />

            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-slate-100" />

              <div className="mt-3 h-3 w-72 rounded bg-slate-100" />

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="h-20 rounded-xl bg-slate-100" />
                <div className="h-20 rounded-xl bg-slate-100" />
                <div className="h-20 rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
}

function EmptyState({
  hasFilters,
  onClear,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        {hasFilters ? (
          <Search
            size={26}
            className="text-slate-400"
          />
        ) : (
          <FileText
            size={26}
            className="text-slate-400"
          />
        )}
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-950">
        {hasFilters
          ? "No matching applications"
          : "No applications found"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Try changing your search or status filter."
          : "New restaurant registration applications will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* =========================================================
   QUICK VIEW MODAL
========================================================= */

interface ApplicationQuickViewProps {
  application: Application;
  onClose: () => void;
  formatDate: (date: string) => string;
}

function ApplicationQuickView({
  application,
  onClose,
  formatDate,
}: ApplicationQuickViewProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close quick view"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Application
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              {application.restaurantName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">

          {/* Status */}

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-400">
                Current status
              </p>

              <p className="mt-1 text-sm font-bold text-slate-950">
                {application.status}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              {application.status ===
              "APPROVED" ? (
                <CheckCircle2
                  size={18}
                  className="text-emerald-600"
                />
              ) : application.status ===
                "REJECTED" ? (
                <XCircle
                  size={18}
                  className="text-red-600"
                />
              ) : (
                <Clock3
                  size={18}
                  className="text-amber-600"
                />
              )}
            </div>
          </div>

          {/* Restaurant */}

          <QuickViewSection
            title="Restaurant"
            icon={Store}
          >
            <QuickViewRow
              label="Restaurant Name"
              value={application.restaurantName}
            />

            <QuickViewRow
              label="Restaurant Type"
              value={
                application.restaurantType ||
                "—"
              }
            />

            <QuickViewRow
              label="Tables"
              value={
                typeof application.numberOfTables ===
                "number"
                  ? `${application.numberOfTables}`
                  : "—"
              }
            />
          </QuickViewSection>

          {/* Owner */}

          <QuickViewSection
            title="Owner"
            icon={User}
          >
            <QuickViewRow
              label="Name"
              value={application.ownerName}
            />

            <QuickViewRow
              label="Email"
              value={application.email}
            />

            <QuickViewRow
              label="Phone"
              value={application.phone || "—"}
            />
          </QuickViewSection>

          {/* Location */}

          <QuickViewSection
            title="Location"
            icon={MapPin}
          >
            <QuickViewRow
              label="Address"
              value={
                application.address ||
                "Not provided"
              }
            />

            <QuickViewRow
              label="City"
              value={application.city || "—"}
            />

            <QuickViewRow
              label="State"
              value={application.state || "—"}
            />

            <QuickViewRow
              label="Pincode"
              value={
                application.pincode || "—"
              }
            />
          </QuickViewSection>

          {/* Dates */}

          <QuickViewSection
            title="Application Details"
            icon={FileText}
          >
            <QuickViewRow
              label="Application ID"
              value={application._id}
              mono
            />

            <QuickViewRow
              label="Submitted"
              value={formatDate(
                application.createdAt
              )}
            />

            <QuickViewRow
              label="Last Updated"
              value={formatDate(
                application.updatedAt
              )}
            />
          </QuickViewSection>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <Link
            href={`/super-admin/applications/${application._id}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Full Application
            <Eye size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QUICK VIEW SECTION
========================================================= */

interface QuickViewSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function QuickViewSection({
  title,
  icon: Icon,
  children,
}: QuickViewSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Icon
          size={15}
          className="text-slate-500"
        />

        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
          {title}
        </h3>
      </div>

      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   QUICK VIEW ROW
========================================================= */

interface QuickViewRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function QuickViewRow({
  label,
  value,
  mono = false,
}: QuickViewRowProps) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span
        className={`break-all text-sm font-medium text-slate-800 sm:max-w-[65%] sm:text-right ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}