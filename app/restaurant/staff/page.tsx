"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type StaffRole =
  | "MANAGER"
  | "KITCHEN"
  | "WAITER"
  | "CASHIER";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  isActive: boolean;
  passwordSetupPending?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface StaffForm {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  MANAGER: "Manager",
  KITCHEN: "Kitchen",
  WAITER: "Waiter",
  CASHIER: "Cashier",
};

const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  MANAGER: "Restaurant operations and management",
  KITCHEN: "Kitchen order preparation",
  WAITER: "Serving orders and table management",
  CASHIER: "Billing and payment management",
};

const EMPTY_FORM: StaffForm = {
  name: "",
  email: "",
  phone: "",
  role: "WAITER",
};

export default function RestaurantStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] =
    useState<Staff | null>(null);

  const [form, setForm] =
    useState<StaffForm>(EMPTY_FORM);

  const [roleFilter, setRoleFilter] =
    useState<"ALL" | StaffRole>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [setupUrl, setSetupUrl] = useState("");
  const [setupExpiresAt, setSetupExpiresAt] =
    useState("");
  const [showSetupModal, setShowSetupModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);
  const [staffToDelete, setStaffToDelete] =
    useState<Staff | null>(null);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/restaurant/staff",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load staff."
        );
      }

      setStaff(data.staff || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load staff."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesRole =
        roleFilter === "ALL" ||
        member.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          member.isActive) ||
        (statusFilter === "INACTIVE" &&
          !member.isActive);

      return matchesRole && matchesStatus;
    });
  }, [staff, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: staff.length,
      active: staff.filter(
        (member) => member.isActive
      ).length,
      inactive: staff.filter(
        (member) => !member.isActive
      ).length,
      managers: staff.filter(
        (member) => member.role === "MANAGER"
      ).length,
      kitchen: staff.filter(
        (member) => member.role === "KITCHEN"
      ).length,
      waiters: staff.filter(
        (member) => member.role === "WAITER"
      ).length,
      cashiers: staff.filter(
        (member) => member.role === "CASHIER"
      ).length,
    };
  }, [staff]);

  const openAddModal = () => {
    clearMessages();
    setEditingStaff(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (member: Staff) => {
    clearMessages();

    setEditingStaff(member);

    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (actionLoading) return;

    setShowModal(false);
    setEditingStaff(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (
    field: keyof StaffForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    clearMessages();

    if (!form.name.trim()) {
      setError("Staff name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Staff email is required.");
      return;
    }

    setActionLoading(
      editingStaff
        ? `edit-${editingStaff.id}`
        : "create"
    );

    try {
      const response = await fetch(
        editingStaff
          ? `/api/restaurant/staff/${editingStaff.id}`
          : "/api/restaurant/staff",
        {
          method: editingStaff ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            editingStaff
              ? {
                  action: "UPDATE",
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  role: form.role,
                }
              : {
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  role: form.role,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (editingStaff
              ? "Failed to update staff."
              : "Failed to create staff.")
        );
      }

      if (editingStaff) {
        setSuccess(
          data.message ||
            "Staff member updated successfully."
        );

        setShowModal(false);
        setEditingStaff(null);
        setForm(EMPTY_FORM);

        await loadStaff();
      } else {
        setSetupUrl(data.setupUrl || "");
        setSetupExpiresAt(
          data.setupExpiresAt || ""
        );

        setShowModal(false);
        setEditingStaff(null);
        setForm(EMPTY_FORM);

        await loadStaff();

        if (data.setupUrl) {
          setShowSetupModal(true);
        }

        setSuccess(
          data.message ||
            "Staff member created successfully."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingStaff
            ? "Failed to update staff."
            : "Failed to create staff."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (
    member: Staff
  ) => {
    clearMessages();

    const actionId = `status-${member.id}`;

    setActionLoading(actionId);

    try {
      const response = await fetch(
        `/api/restaurant/staff/${member.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "STATUS",
            isActive: !member.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update staff status."
        );
      }

      setSuccess(
        data.message ||
          "Staff status updated successfully."
      );

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update staff status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSetupLink = async (
    member: Staff
  ) => {
    clearMessages();

    const actionId = `setup-${member.id}`;

    setActionLoading(actionId);

    try {
      const response = await fetch(
        `/api/restaurant/staff/${member.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "REGENERATE_SETUP_LINK",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to generate setup link."
        );
      }

      setSetupUrl(data.setupUrl || "");
      setSetupExpiresAt(
        data.setupExpiresAt || ""
      );
      setShowSetupModal(true);

      setSuccess(
        data.message ||
          "Setup link generated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate setup link."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (member: Staff) => {
    clearMessages();
    setStaffToDelete(member);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (actionLoading) return;

    setShowDeleteModal(false);
    setStaffToDelete(null);
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;

    clearMessages();

    const member = staffToDelete;

    setActionLoading(`delete-${member.id}`);

    try {
      const response = await fetch(
        `/api/restaurant/staff/${member.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete staff member."
        );
      }

      setSuccess(
        data.message ||
          "Staff member deleted successfully."
      );

      setShowDeleteModal(false);
      setStaffToDelete(null);

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete staff member."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const copySetupLink = async () => {
    if (!setupUrl) return;

    try {
      await navigator.clipboard.writeText(
        setupUrl
      );

      setSuccess(
        "Password setup link copied to clipboard."
      );
    } catch {
      setError(
        "Could not copy the setup link. Please copy it manually."
      );
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "-";
    }
  };

  const formatExpiry = (date: string) => {
    try {
      return new Date(date).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "-";
    }
  };

  const getRoleClass = (role: StaffRole) => {
    switch (role) {
      case "MANAGER":
        return "border-violet-500/20 bg-violet-500/10 text-violet-300";
      case "KITCHEN":
        return "border-orange-500/20 bg-orange-500/10 text-orange-300";
      case "WAITER":
        return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
      case "CASHIER":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
      default:
        return "border-white/10 bg-white/5 text-white/70";
    }
  };

  return (
    <div className="min-h-full bg-[#070b14] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              Restaurant Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Staff Management
            </h1>

            <p className="mt-1 text-sm text-white/50">
              Manage your restaurant team and
              permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            <span className="text-lg leading-none">
              +
            </span>
            Add Staff
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Total Staff"
            value={stats.total}
            icon="👥"
          />

          <StatCard
            label="Active"
            value={stats.active}
            icon="✓"
          />

          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon="○"
          />

          <StatCard
            label="Managers"
            value={stats.managers}
            icon="◆"
          />
        </div>

        {/* Role summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <RoleSummary
            label="Kitchen"
            value={stats.kitchen}
            className="text-orange-300"
          />

          <RoleSummary
            label="Waiters"
            value={stats.waiters}
            className="text-cyan-300"
          />

          <RoleSummary
            label="Cashiers"
            value={stats.cashiers}
            className="text-emerald-300"
          />

          <RoleSummary
            label="Managers"
            value={stats.managers}
            className="text-violet-300"
          />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Team Members
              </h2>
              <p className="mt-1 text-xs text-white/40">
                {filteredStaff.length} member
                {filteredStaff.length === 1
                  ? ""
                  : "s"} shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value as
                      | "ALL"
                      | StaffRole
                  )
                }
                className="rounded-lg border border-white/10 bg-[#0c1220] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                <option value="ALL">
                  All Roles
                </option>
                <option value="MANAGER">
                  Manager
                </option>
                <option value="KITCHEN">
                  Kitchen
                </option>
                <option value="WAITER">
                  Waiter
                </option>
                <option value="CASHIER">
                  Cashier
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "ALL"
                      | "ACTIVE"
                      | "INACTIVE"
                  )
                }
                className="rounded-lg border border-white/10 bg-[#0c1220] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                <option value="ALL">
                  All Status
                </option>
                <option value="ACTIVE">
                  Active
                </option>
                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff list */}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
            <p className="text-sm text-white/50">
              Loading staff...
            </p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
              👥
            </div>

            <h3 className="text-base font-semibold">
              No staff members found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
              {staff.length === 0
                ? "Add your first restaurant staff member to get started."
                : "Try changing the selected filters."}
            </p>

            {staff.length === 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Add Staff
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                    <th className="px-5 py-4">
                      Staff
                    </th>
                    <th className="px-5 py-4">
                      Role
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Joined
                    </th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStaff.map(
                    (member) => (
                      <tr
                        key={member.id}
                        className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-cyan-300">
                              {member.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate font-medium text-white">
                                {member.name}
                              </div>

                              <div className="truncate text-xs text-white/40">
                                {member.email}
                              </div>

                              {member.phone && (
                                <div className="mt-0.5 text-xs text-white/30">
                                  {member.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRoleClass(
                              member.role
                            )}`}
                          >
                            {
                              ROLE_LABELS[
                                member.role
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                                member.isActive
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                  : "border-red-500/20 bg-red-500/10 text-red-300"
                              }`}
                            >
                              {member.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>

                            {member.passwordSetupPending && (
                              <span className="text-[11px] text-amber-300/80">
                                Password setup
                                pending
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-white/50">
                          {formatDate(
                            member.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  member
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoading ===
                                `status-${member.id}`
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  member
                                )
                              }
                              className={`rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                                member.isActive
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              }`}
                            >
                              {actionLoading ===
                              `status-${member.id}`
                                ? "..."
                                : member.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoading ===
                                `setup-${member.id}`
                              }
                              onClick={() =>
                                handleGenerateSetupLink(
                                  member
                                )
                              }
                              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
                            >
                              {actionLoading ===
                              `setup-${member.id}`
                                ? "..."
                                : "Setup Link"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal(
                                  member
                                )
                              }
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-white/5 md:hidden">
              {filteredStaff.map(
                (member) => (
                  <div
                    key={member.id}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-cyan-300">
                        {member.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {member.name}
                        </div>

                        <div className="mt-1 break-all text-xs text-white/40">
                          {member.email}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs ${getRoleClass(
                              member.role
                            )}`}
                          >
                            {
                              ROLE_LABELS[
                                member.role
                              ]
                            }
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs ${
                              member.isActive
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-red-500/20 bg-red-500/10 text-red-300"
                            }`}
                          >
                            {member.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        {member.passwordSetupPending && (
                          <div className="mt-2 text-xs text-amber-300">
                            Password setup
                            pending
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                member
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              `status-${member.id}`
                            }
                            onClick={() =>
                              handleToggleStatus(
                                member
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 disabled:opacity-50"
                          >
                            {actionLoading ===
                            `status-${member.id}`
                              ? "..."
                              : member.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              `setup-${member.id}`
                            }
                            onClick={() =>
                              handleGenerateSetupLink(
                                member
                              )
                            }
                            className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 disabled:opacity-50"
                          >
                            {actionLoading ===
                            `setup-${member.id}`
                              ? "..."
                              : "Setup Link"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openDeleteModal(
                                member
                              )
                            }
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold">
                  {editingStaff
                    ? "Edit Staff"
                    : "Add Staff"}
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  {editingStaff
                    ? "Update staff account details."
                    : "Create a staff account and generate a secure password setup link."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Full Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter staff name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Email Address
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    handleFormChange(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="staff@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-500/50"
                />

                {!editingStaff && (
                  <p className="mt-2 text-xs text-white/35">
                    This email will be used to log in
                    after the staff member creates a
                    password.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Phone
                  <span className="ml-1 text-white/30">
                    (optional)
                  </span>
                </label>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    handleFormChange(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    handleFormChange(
                      "role",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="MANAGER">
                    Manager
                  </option>
                  <option value="KITCHEN">
                    Kitchen
                  </option>
                  <option value="WAITER">
                    Waiter
                  </option>
                  <option value="CASHIER">
                    Cashier
                  </option>
                </select>

                <p className="mt-2 text-xs text-white/35">
                  {
                    ROLE_DESCRIPTIONS[
                      form.role
                    ]
                  }
                </p>
              </div>

              {!editingStaff && (
                <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-xs leading-5 text-cyan-200/70">
                  No permanent password will be
                  generated. The staff member will
                  receive a secure password setup link
                  valid for 24 hours.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={Boolean(actionLoading)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={Boolean(actionLoading)}
                  className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading
                    ? editingStaff
                      ? "Saving..."
                      : "Creating..."
                    : editingStaff
                      ? "Save Changes"
                      : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setup Link Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-500/20 bg-[#0b1220] shadow-2xl">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  ✓
                </div>

                <div>
                  <h2 className="font-semibold">
                    Password Setup Link
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    Share this link securely with
                    the staff member.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/35">
                  Setup URL
                </div>

                <div className="break-all text-sm leading-6 text-cyan-300">
                  {setupUrl}
                </div>
              </div>

              {setupExpiresAt && (
                <div className="text-xs text-amber-300/80">
                  Expires:{" "}
                  {formatExpiry(
                    setupExpiresAt
                  )}
                </div>
              )}

              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200/70">
                This link allows the staff member
                to create their password. Do not post
                it publicly. Generate a new link if
                this one is lost or compromised.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={copySetupLink}
                  className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  Copy Link
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowSetupModal(false)
                  }
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal &&
        staffToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0b1220] shadow-2xl">
              <div className="p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-xl">
                  ⚠
                </div>

                <h2 className="text-lg font-semibold">
                  Delete Staff Member?
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  You are about to permanently delete{" "}
                  <span className="font-medium text-white">
                    {staffToDelete.name}
                  </span>
                  . This action cannot be undone.
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={Boolean(
                      actionLoading
                    )}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={Boolean(
                      actionLoading
                    )}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                  >
                    {actionLoading ===
                    `delete-${staffToDelete.id}`
                      ? "Deleting..."
                      : "Delete Staff"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-white/40">
          {label}
        </span>

        <span className="text-sm opacity-70">
          {icon}
        </span>
      </div>

      <div className="text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}

function RoleSummary({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="text-xs text-white/40">
        {label}
      </div>

      <div
        className={`mt-1 text-lg font-bold ${className}`}
      >
        {value}
      </div>
    </div>
  );
}