import Link from "next/link";
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

import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";

export default async function ApplicationsPage() {
  await connectDB();

  const applications = await RestaurantApplication.find()
    .sort({ createdAt: -1 })
    .lean();

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
          <div className="flex items-center gap-2.5">
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
          </div>

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
            Review and manage restaurant applications submitted to Restova.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={20} />
            </div>

            <p className="text-sm text-slate-500">Pending</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-slate-500">Approved</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle size={20} />
            </div>

            <p className="text-sm text-slate-500">Rejected</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {rejectedCount}
            </p>
          </div>
        </div>

        {/* Applications */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Applications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {applications.length} total application
              {applications.length !== 1 ? "s" : ""}
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Building2 size={24} />
              </div>

              <h3 className="text-base font-semibold text-slate-950">
                No applications yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Restaurant applications submitted through Restova will appear
                here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((application) => (
                <div
                  key={application._id.toString()}
                  className="p-6"
                >
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

                          <StatusBadge status={application.status} />
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {application.restaurantType}
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
                        <Mail size={16} className="text-slate-400" />
                        <span className="break-all">
                          {application.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        <span>{application.phone}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <span>
                          {application.city}, {application.state}
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
                          {application._id.toString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {application.status === "PENDING" && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        <CheckCircle2 size={17} />
                        Approve
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <XCircle size={17} />
                        Reject
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
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500">
      U
    </span>
  );
}