"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Store,
  UserRound,
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

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition group-hover:bg-slate-950 group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
            {value !== undefined &&
            value !== null &&
            value !== ""
              ? value
              : "Not provided"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-950">
          {title}
        </h2>

        <p className="mt-0.5 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ApplicationDetailsPage() {
  const params = useParams<{ id: string }>();

  const id = params.id;

  const [application, setApplication] =
    useState<Application | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showContact, setShowContact] =
    useState(false);

  const fetchApplication = useCallback(
    async () => {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/applications",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load applications."
          );
        }

        const applications: Application[] =
          data.applications || [];

        const found = applications.find(
          (item) => item._id === id
        );

        if (!found) {
          setApplication(null);
          setError("Application not found.");
          return;
        }

        setApplication(found);
      } catch (err) {
        console.error(
          "Fetch application details error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the application."
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const statusStyles: Record<
    Application["status"],
    {
      badge: string;
      icon: string;
      glow: string;
      label: string;
    }
  > = {
    PENDING: {
      badge:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon: "bg-amber-100 text-amber-600",
      glow: "bg-amber-300/25",
      label: "Awaiting Review",
    },
    APPROVED: {
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-100 text-emerald-600",
      glow: "bg-emerald-300/25",
      label: "Approved",
    },
    REJECTED: {
      badge:
        "border-red-200 bg-red-50 text-red-700",
      icon: "bg-red-100 text-red-600",
      glow: "bg-red-300/25",
      label: "Rejected",
    },
  };

  const currentStatus =
    application?.status || "PENDING";

  const status = statusStyles[currentStatus];

  const statusIcon =
    currentStatus === "APPROVED" ? (
      <CheckCircle2 size={17} />
    ) : currentStatus === "REJECTED" ? (
      <XCircle size={17} />
    ) : (
      <Clock3 size={17} />
    );

  return (
    <>
      <style jsx>{`
        @keyframes detail-flow-one {
          0% {
            transform: translate3d(-8%, -5%, 0)
              scale(1);
          }

          50% {
            transform: translate3d(10%, 8%, 0)
              scale(1.12);
          }

          100% {
            transform: translate3d(-8%, -5%, 0)
              scale(1);
          }
        }

        @keyframes detail-flow-two {
          0% {
            transform: translate3d(8%, 5%, 0)
              scale(1.05);
          }

          50% {
            transform: translate3d(-10%, -6%, 0)
              scale(1);
          }

          100% {
            transform: translate3d(8%, 5%, 0)
              scale(1.05);
          }
        }

        .detail-flow-one {
          animation: detail-flow-one 9s ease-in-out
            infinite;
        }

        .detail-flow-two {
          animation: detail-flow-two 11s ease-in-out
            infinite;
        }
      `}</style>

      <div className="min-h-[calc(100vh-76px)] bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1450px]">

          {/* =====================================================
              TOP NAVIGATION
          ====================================================== */}

          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
              href="/super-admin/applications"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:bg-slate-950 group-hover:text-white">
                <ArrowLeft size={16} />
              </span>

              Back to Applications
            </Link>

            <button
              type="button"
              onClick={fetchApplication}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading ? (
            <LoadingDetails />
          ) : error || !application ? (
            <ErrorDetails
              message={
                error ||
                "Application not found."
              }
              onRetry={fetchApplication}
            />
          ) : (
            <>
              {/* =================================================
                  HERO / APPLICATION SUMMARY
              ================================================== */}

              <section className="relative mb-6 overflow-hidden rounded-[28px] border border-indigo-200/60 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-cyan-100" />

                <div className="detail-flow-one absolute -left-24 -top-28 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />

                <div className="detail-flow-two absolute -right-24 -bottom-28 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />

                <div
                  className={`absolute -right-16 top-10 h-48 w-48 rounded-full ${status.glow} blur-3xl`}
                />

                <div className="absolute inset-0 bg-white/30" />

                <div className="relative p-6 sm:p-8 lg:p-9">
                  <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                    {/* Restaurant identity */}

                    <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 sm:h-[72px] sm:w-[72px]">
                        <Store
                          size={30}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                            Restaurant Application
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span className="text-xs text-slate-500">
                            {formatShortDate(
                              application.createdAt
                            )}
                          </span>
                        </div>

                        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                          {application.restaurantName}
                        </h1>

                        <p className="mt-2 text-sm text-slate-600">
                          {application.restaurantType ||
                            "Restaurant"}

                          {typeof application.numberOfTables ===
                          "number"
                            ? ` · ${application.numberOfTables} tables`
                            : ""}
                        </p>

                        <p className="mt-3 max-w-xl break-all font-mono text-[11px] text-slate-400">
                          Application ID:{" "}
                          {application._id}
                        </p>
                      </div>
                    </div>

                    {/* Status */}

                    <div className="shrink-0">
                      <div
                        className={`inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 ${status.badge}`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${status.icon}`}
                        >
                          {statusIcon}
                        </span>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-70">
                            Application Status
                          </p>

                          <p className="mt-0.5 text-sm font-bold">
                            {status.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  MAIN CONTENT
              ================================================== */}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">

                {/* =================================================
                    LEFT COLUMN
                ================================================== */}

                <div className="space-y-6">

                  {/* Restaurant information */}

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <SectionHeader
                      icon={<Store size={19} />}
                      title="Restaurant Information"
                      description="Business details submitted during registration."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem
                        label="Restaurant Name"
                        value={
                          application.restaurantName
                        }
                        icon={
                          <Store size={18} />
                        }
                      />

                      <DetailItem
                        label="Restaurant Type"
                        value={
                          application.restaurantType
                        }
                        icon={
                          <FileText size={18} />
                        }
                      />

                      <DetailItem
                        label="Number of Tables"
                        value={
                          application.numberOfTables
                        }
                        icon={
                          <Store size={18} />
                        }
                      />

                      <DetailItem
                        label="Application Date"
                        value={formatDate(
                          application.createdAt
                        )}
                        icon={
                          <CalendarDays
                            size={18}
                          />
                        }
                      />
                    </div>
                  </section>

                  {/* Owner information */}

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <SectionHeader
                      icon={<UserRound size={19} />}
                      title="Owner Information"
                      description="Contact information provided by the applicant."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem
                        label="Owner Name"
                        value={
                          application.ownerName
                        }
                        icon={
                          <UserRound
                            size={18}
                          />
                        }
                      />

                      <DetailItem
                        label="Email Address"
                        value={application.email}
                        icon={
                          <Mail size={18} />
                        }
                      />

                      <DetailItem
                        label="Phone Number"
                        value={
                          application.phone
                        }
                        icon={
                          <Phone size={18} />
                        }
                      />
                    </div>

                    {application.email && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowContact(true)
                        }
                        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        <Mail size={15} />

                        Contact Applicant
                      </button>
                    )}
                  </section>

                  {/* Location */}

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <SectionHeader
                      icon={<MapPin size={19} />}
                      title="Location"
                      description="Restaurant address and registered location."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <DetailItem
                          label="Street Address"
                          value={
                            application.address
                          }
                          icon={
                            <MapPin
                              size={18}
                            />
                          }
                        />
                      </div>

                      <DetailItem
                        label="City"
                        value={
                          application.city
                        }
                        icon={
                          <MapPin
                            size={18}
                          />
                        }
                      />

                      <DetailItem
                        label="State"
                        value={
                          application.state
                        }
                        icon={
                          <MapPin
                            size={18}
                          />
                        }
                      />

                      <DetailItem
                        label="PIN Code"
                        value={
                          application.pincode
                        }
                        icon={
                          <MapPin
                            size={18}
                          />
                        }
                      />
                    </div>
                  </section>
                </div>

                {/* =================================================
                    RIGHT COLUMN
                ================================================== */}

                <aside className="space-y-6">

                  {/* Status card */}

                  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="font-semibold text-slate-950">
                        Application Status
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Current workflow state
                      </p>
                    </div>

                    <div className="p-5">
                      <div
                        className={`rounded-2xl border p-4 ${status.badge}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${status.icon}`}
                          >
                            {statusIcon}
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-70">
                              Status
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {status.label}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-5 text-slate-500">
                        {currentStatus ===
                        "PENDING"
                          ? "This application is waiting for Super Admin review."
                          : currentStatus ===
                            "APPROVED"
                          ? "This application has been approved and the restaurant onboarding workflow has been initiated."
                          : "This application has been rejected. The submitted information remains available for review."}
                      </p>
                    </div>
                  </section>

                  {/* Timeline */}

                  <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="font-semibold text-slate-950">
                        Activity
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Application timeline
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="relative space-y-6">

                        {/* Submitted */}

                        <TimelineItem
                          icon={
                            <FileText
                              size={15}
                            />
                          }
                          title="Application submitted"
                          date={formatDate(
                            application.createdAt
                          )}
                          active
                          color="indigo"
                        />

                        {/* Current state */}

                        <TimelineItem
                          icon={statusIcon}
                          title={
                            currentStatus ===
                            "PENDING"
                              ? "Awaiting review"
                              : currentStatus ===
                                "APPROVED"
                              ? "Application approved"
                              : "Application rejected"
                          }
                          date={formatDate(
                            application.updatedAt
                          )}
                          active
                          color={
                            currentStatus ===
                            "APPROVED"
                              ? "emerald"
                              : currentStatus ===
                                "REJECTED"
                              ? "red"
                              : "amber"
                          }
                          last
                        />
                      </div>
                    </div>
                  </section>

                  {/* Metadata */}

                  <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="font-semibold text-slate-950">
                        Application Metadata
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Registration information
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <MetadataRow
                        label="Submitted"
                        value={formatDate(
                          application.createdAt
                        )}
                      />

                      <MetadataRow
                        label="Updated"
                        value={formatDate(
                          application.updatedAt
                        )}
                      />

                      <MetadataRow
                        label="Application ID"
                        value={application._id}
                        mono
                      />
                    </div>
                  </section>

                  {/* Contact card */}

                  {application.email && (
                    <section className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-sm">
                      <div className="detail-flow-one absolute -right-16 -top-20 h-40 w-40 rounded-full bg-indigo-300/30 blur-3xl" />

                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                          <Mail size={17} />
                        </div>

                        <h3 className="mt-4 text-sm font-bold text-slate-950">
                          Need to contact the applicant?
                        </h3>

                        <p className="mt-1.5 text-xs leading-5 text-slate-500">
                          Use the registered email address
                          to contact the restaurant owner.
                        </p>

                        <a
                          href={`mailto:${application.email}`}
                          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Mail size={14} />

                          Email Applicant
                        </a>
                      </div>
                    </section>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =======================================================
          CONTACT MODAL
      ======================================================== */}

      {showContact && application?.email && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close contact dialog"
            className="absolute inset-0 cursor-default"
            onClick={() =>
              setShowContact(false)
            }
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Contact
                </p>

                <h2 className="mt-1 font-bold text-slate-950">
                  Contact Applicant
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowContact(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Applicant
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {application.ownerName}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Email address
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                  {application.email}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowContact(false)
                  }
                  className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <a
                  href={`mailto:${application.email}`}
                  onClick={() =>
                    setShowContact(false)
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Mail size={15} />

                  Open Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   TIMELINE ITEM
========================================================= */

function TimelineItem({
  icon,
  title,
  date,
  active,
  color,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  date: string;
  active?: boolean;
  color:
    | "indigo"
    | "emerald"
    | "amber"
    | "red";
  last?: boolean;
}) {
  const colors = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber:
      "bg-amber-50 text-amber-600 border-amber-100",
    red:
      "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className="relative flex gap-3">
      {!last && (
        <div className="absolute left-[19px] top-10 h-[calc(100%+8px)] w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}
      >
        {icon}
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {date}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   METADATA ROW
========================================================= */

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <span className="shrink-0 text-xs text-slate-400">
        {label}
      </span>

      <span
        className={`break-all text-right text-xs font-semibold text-slate-700 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingDetails() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-8">
        <div className="flex gap-5">
          <div className="h-[72px] w-[72px] rounded-2xl bg-slate-100" />

          <div className="flex-1">
            <div className="h-3 w-40 rounded bg-slate-100" />

            <div className="mt-3 h-8 w-72 rounded bg-slate-100" />

            <div className="mt-3 h-3 w-52 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-6">
          <LoadingSection />
          <LoadingSection />
          <LoadingSection />
        </div>

        <div className="space-y-6">
          <LoadingSection />
          <LoadingSection />
          <LoadingSection />
        </div>
      </div>
    </div>
  );
}

function LoadingSection() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
      <div className="h-5 w-44 rounded bg-slate-100" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorDetails({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <XCircle size={28} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-950">
          Unable to load application
        </h2>

        <p className="mt-2 text-sm leading-6 text-red-600">
          {message}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw size={15} />

            Try Again
          </button>

          <Link
            href="/super-admin/applications"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />

            Applications
          </Link>
        </div>
      </div>
    </div>
  );
}