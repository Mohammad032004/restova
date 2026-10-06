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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
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

          {/* Back */}
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
          <p className="mb-2 text-sm font-medium text-slate-500">
            Super Admin
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Restaurant Applications
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review and manage restaurant applications submitted to
            Restova.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {/* Pending */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={20} />
            </div>

            <p className="text-sm text-slate-500">Pending</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {loading ? "—" : pendingCount}
            </p>
          </div>

          {/* Approved */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-slate-500">Approved</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {loading ? "—" : approvedCount}
            </p>
          </div>

          {/* Rejected */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle size={20} />
            </div>

            <p className="text-sm text-slate-500">Rejected</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {loading ? "—" : rejectedCount}
            </p>
          </div>
        </div>

        {/* Applications */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Applications header */}
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Applications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading applications..."
                : `${applications.length} total application${
                    applications.length !== 1 ? "s" : ""
                  }`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

              <p className="text-sm text-slate-500">
                Loading applications...
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && applications.length === 0 && (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Building2 size={24} />
              </div>

              <h3 className="text-base font-semibold text-slate-950">
                No applications yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Restaurant applications submitted through Restova
                will appear here.
              </p>
            </div>
          )}

          {/* Application list */}
          {!loading && applications.length > 0 && (
            <div className="divide-y divide-slate-100">
              {applications.map((application) => (
                <div key={application._id} className="p-6">
                  {/* Main information */}
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    {/* Restaurant */}
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Building2 size={21} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold text-slate-950">
                            {application.restaurantName}
                          </h3>

                          <StatusBadge
                            status={application.status}
                          />
                        </div>

                        <p className="mt-1 text-sm capitalize text-slate-500">
                          {application.restaurantType.replace(
                            "-",
                            " "
                          )}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Submitted{" "}
                          {new Date(
                            application.createdAt
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:min-w-[420px]">
                      <div className="flex items-center gap-2">
                        <UserIcon />

                        <span>{application.ownerName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail
                          size={16}
                          className="shrink-0 text-slate-400"
                        />

                        <span className="break-all">
                          {application.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone
                          size={16}
                          className="shrink-0 text-slate-400"
                        />

                        <span>{application.phone}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <span>
                          {application.city},{" "}
                          {application.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="grid gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          Number of tables
                        </p>

                        <p className="mt-1 font-medium text-slate-950">
                          {application.numberOfTables}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          PIN code
                        </p>

                        <p className="mt-1 font-medium text-slate-950">
                          {application.pincode}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Application ID
                        </p>

                        <p className="mt-1 truncate font-mono text-xs text-slate-600">
                          {application._id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mt-4 rounded-xl border border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-400">
                      Restaurant address
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {application.address}, {application.city},{" "}
                      {application.state} - {application.pincode}
                    </p>
                  </div>

                  {/* Actions */}
                  {application.status === "PENDING" && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {/* Approve */}
                      <button
                        type="button"
                        disabled={
                          approvingId === application._id ||
                          rejectingId === application._id
                        }
                        onClick={() =>
                          approveApplication(application._id)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 size={17} />

                        {approvingId === application._id
                          ? "Approving..."
                          : "Approve"}
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        disabled={
                          rejectingId === application._id ||
                          approvingId === application._id
                        }
                        onClick={() =>
                          rejectApplication(application._id)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={17} />

                        {rejectingId === application._id
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
}) {
  if (status === "APPROVED") {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        Approved
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}

function UserIcon() {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500">
      U
    </span>
  );
}