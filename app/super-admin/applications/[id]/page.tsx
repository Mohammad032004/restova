
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
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value !== undefined && value !== null && value !== ""
            ? value
            : "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function ApplicationDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [application, setApplication] = useState<Application | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplication = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      // Reuse the existing applications API.
      const response = await fetch("/api/applications", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load applications."
        );
      }

      const applications: Application[] = data.applications || [];
      const found = applications.find((item) => item._id === id);

      if (!found) {
        setApplication(null);
        setError("Application not found.");
        return;
      }

      setApplication(found);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the application."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const statusStyles: Record<Application["status"], string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  };

  const statusIcon = application?.status === "APPROVED"
    ? <CheckCircle2 size={16} />
    : application?.status === "REJECTED"
      ? <XCircle size={16} />
      : <Clock3 size={16} />;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/super-admin"
            className="hover:text-slate-900"
          >
            Super Admin
          </Link>
          <span>/</span>
          <Link
            href="/super-admin/applications"
            className="hover:text-slate-900"
          >
            Applications
          </Link>
          <span>/</span>
          <span className="text-slate-900">Details</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Application Details
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View restaurant registration and owner information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchApplication}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              href="/super-admin/applications"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to Applications
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading application details...
          </div>
        </div>
      ) : error || !application ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <XCircle className="mx-auto text-red-500" size={36} />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            Unable to load application
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error || "Application not found."}
          </p>
          <button
            type="button"
            onClick={fetchApplication}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Application summary */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-5 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Store size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {application.restaurantName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {application.restaurantType || "Restaurant"}
                    {typeof application.numberOfTables === "number"
                      ? ` · ${application.numberOfTables} tables`
                      : ""}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-slate-400">
                    ID: {application._id}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${statusStyles[application.status]}`}
              >
                {statusIcon}
                {application.status}
              </span>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Application submitted"
                value={formatDate(application.createdAt)}
                icon={<CalendarDays size={19} />}
              />
              <DetailItem
                label="Last updated"
                value={formatDate(application.updatedAt)}
                icon={<RefreshCw size={19} />}
              />
              <DetailItem
                label="Current status"
                value={application.status}
                icon={statusIcon}
              />
            </div>
          </section>

          {/* Restaurant information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Store size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Restaurant Information
                </h2>
                <p className="text-sm text-slate-500">
                  Business details submitted in the application.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Restaurant name"
                value={application.restaurantName}
                icon={<Store size={19} />}
              />
              <DetailItem
                label="Restaurant type"
                value={application.restaurantType}
                icon={<FileText size={19} />}
              />
              <DetailItem
                label="Number of tables"
                value={application.numberOfTables}
                icon={<Store size={19} />}
              />
              <DetailItem
                label="Street address"
                value={application.address}
                icon={<MapPin size={19} />}
              />
              <DetailItem
                label="City"
                value={application.city}
                icon={<MapPin size={19} />}
              />
              <DetailItem
                label="State"
                value={application.state}
                icon={<MapPin size={19} />}
              />
              <DetailItem
                label="PIN code"
                value={application.pincode}
                icon={<MapPin size={19} />}
              />
            </div>
          </section>

          {/* Owner information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Owner Information
                </h2>
                <p className="text-sm text-slate-500">
                  Contact information provided by the applicant.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Owner name"
                value={application.ownerName}
                icon={<UserRound size={19} />}
              />
              <DetailItem
                label="Email address"
                value={application.email}
                icon={<Mail size={19} />}
              />
              <DetailItem
                label="Phone number"
                value={application.phone}
                icon={<Phone size={19} />}
              />
            </div>

            {application.email && (
              <a
                href={`mailto:${application.email}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Mail size={16} />
                Contact Applicant
              </a>
            )}
          </section>

          {/* Read-only status note */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">
              Application status: {application.status}
            </p>
            <p className="mt-1">
              {application.status === "PENDING"
                ? "This application is awaiting review. Use the Applications page to approve or reject it."
                : application.status === "APPROVED"
                  ? "This application has been approved. The restaurant and owner account were handled by the approval workflow."
                  : "This application has been rejected. You can review its submitted details here."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
