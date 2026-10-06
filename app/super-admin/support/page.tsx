"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  Filter,
  Mail,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

type TicketStatus =
  | "open"
  | "in-progress"
  | "resolved"
  | "closed";

type TicketPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

type Ticket = {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  restaurantName?: string;
  ownerName?: string;
  ownerEmail?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string;
  resolvedAt?: string | null;

  messages?: {
    _id?: string;
    senderType: "admin" | "restaurant" | "owner";
    senderName: string;
    senderEmail?: string;
    message: string;
    createdAt: string;
  }[];
};

const statusOptions = [
  "all",
  "open",
  "in-progress",
  "resolved",
  "closed",
] as const;

const priorityOptions = [
  "all",
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<(typeof priorityOptions)[number]>("all");

  const [selectedTicket, setSelectedTicket] =
    useState<Ticket | null>(null);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [updatingTicket, setUpdatingTicket] =
    useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/super-admin/support",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load support tickets"
        );
      }

      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Support tickets error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load support tickets"
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.ticketNumber
          ?.toLowerCase()
          .includes(query) ||
        ticket.subject
          ?.toLowerCase()
          .includes(query) ||
        ticket.restaurantName
          ?.toLowerCase()
          .includes(query) ||
        ticket.ownerName
          ?.toLowerCase()
          .includes(query) ||
        ticket.ownerEmail
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        ticket.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    tickets,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,

      open: tickets.filter(
        (ticket) => ticket.status === "open"
      ).length,

      inProgress: tickets.filter(
        (ticket) => ticket.status === "in-progress"
      ).length,

      resolved: tickets.filter(
        (ticket) =>
          ticket.status === "resolved" ||
          ticket.status === "closed"
      ).length,

      urgent: tickets.filter(
        (ticket) => ticket.priority === "urgent"
      ).length,
    };
  }, [tickets]);

  async function updateTicket(
    ticketId: string,
    updates: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedTo?: string;
    }
  ) {
    try {
      setUpdatingTicket(true);

      const response = await fetch(
        `/api/super-admin/support/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update ticket"
        );
      }

      const updatedTicket = data.ticket;

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket._id === ticketId
            ? updatedTicket
            : ticket
        )
      );

      setSelectedTicket(updatedTicket);
    } catch (error) {
      console.error("Update ticket error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update ticket"
      );
    } finally {
      setUpdatingTicket(false);
    }
  }

  async function sendReply() {
    if (!selectedTicket || !reply.trim()) {
      return;
    }

    try {
      setSendingReply(true);
      setError("");

      const response = await fetch(
        `/api/super-admin/support/${selectedTicket._id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: reply.trim(),
            senderName: "Super Admin",
            senderEmail: "admin@restova.com",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to send reply"
        );
      }

      const updatedTicket = data.ticket;

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket._id === updatedTicket._id
            ? updatedTicket
            : ticket
        )
      );

      setSelectedTicket(updatedTicket);
      setReply("");
    } catch (error) {
      console.error("Reply error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to send reply"
      );
    } finally {
      setSendingReply(false);
    }
  }

  function formatDate(date?: string) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusLabel(status: TicketStatus) {
    switch (status) {
      case "in-progress":
        return "In Progress";

      case "resolved":
        return "Resolved";

      case "closed":
        return "Closed";

      default:
        return "Open";
    }
  }

  function getPriorityClass(priority: TicketPriority) {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";

      case "high":
        return "bg-orange-100 text-orange-700";

      case "medium":
        return "bg-amber-100 text-amber-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getStatusClass(status: TicketStatus) {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700";

      case "in-progress":
        return "bg-violet-100 text-violet-700";

      case "resolved":
        return "bg-emerald-100 text-emerald-700";

      case "closed":
        return "bg-slate-100 text-slate-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="px-7 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <MessageSquare size={19} />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">
                Super Admin
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Support
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage restaurant support requests and
                customer issues.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-7">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="text-sm text-slate-500">
              Loading support tickets...
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                icon={<MessageSquare size={18} />}
                label="Total Tickets"
                value={stats.total}
              />

              <StatCard
                icon={<Bell size={18} />}
                label="Open"
                value={stats.open}
              />

              <StatCard
                icon={<Clock3 size={18} />}
                label="In Progress"
                value={stats.inProgress}
              />

              <StatCard
                icon={<Check size={18} />}
                label="Resolved"
                value={stats.resolved}
              />

              <StatCard
                icon={<AlertCircle size={18} />}
                label="Urgent"
                value={stats.urgent}
              />
            </div>

            {/* Main card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Toolbar */}
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* Search */}
                  <div className="relative w-full xl:max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search tickets, restaurant, owner..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {/* Status */}
                    <div className="relative">
                      <Filter
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(
                            event.target.value as (typeof statusOptions)[number]
                          )
                        }
                        className="h-10 min-w-[150px] appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="all">
                          All Status
                        </option>

                        <option value="open">
                          Open
                        </option>

                        <option value="in-progress">
                          In Progress
                        </option>

                        <option value="resolved">
                          Resolved
                        </option>

                        <option value="closed">
                          Closed
                        </option>
                      </select>
                    </div>

                    {/* Priority */}
                    <select
                      value={priorityFilter}
                      onChange={(event) =>
                        setPriorityFilter(
                          event.target.value as (typeof priorityOptions)[number]
                        )
                      }
                      className="h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option value="all">
                        All Priority
                      </option>

                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="urgent">
                        Urgent
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={loadTickets}
                      className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              {filteredTickets.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <MessageSquare
                      size={20}
                      className="text-slate-400"
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900">
                    No support tickets
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {tickets.length === 0
                      ? "There are currently no support tickets in the system."
                      : "No tickets match your current filters."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Ticket
                        </th>

                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Subject
                        </th>

                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Restaurant
                        </th>

                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Priority
                        </th>

                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>

                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Created
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-slate-900">
                              {ticket.ticketNumber}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {ticket.category}
                            </p>
                          </td>

                          <td className="max-w-[280px] px-5 py-4">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {ticket.subject}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-400">
                              {ticket.description}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <Building2 size={14} />
                              </div>

                              <div>
                                <p className="text-xs font-medium text-slate-800">
                                  {ticket.restaurantName ||
                                    "—"}
                                </p>

                                <p className="text-[10px] text-slate-400">
                                  {ticket.ownerName ||
                                    "No owner"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${getPriorityClass(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                                ticket.status
                              )}`}
                            >
                              {getStatusLabel(
                                ticket.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs text-slate-600">
                              {formatDate(ticket.createdAt)}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTicket(ticket)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              View
                              <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-200 px-5 py-4">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredTickets.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {tickets.length}
                  </span>{" "}
                  tickets
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ticket Details Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close ticket details"
            onClick={() => setSelectedTicket(null)}
            className="absolute inset-0 bg-black/30"
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedTicket.ticketNumber}
                  </span>

                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-semibold ${getStatusClass(
                      selectedTicket.status
                    )}`}
                  >
                    {getStatusLabel(
                      selectedTicket.status
                    )}
                  </span>
                </div>

                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {selectedTicket.subject}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Created {formatDate(selectedTicket.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Customer information */}
              <div className="border-b border-slate-200 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Building2
                        size={15}
                        className="text-slate-500"
                      />

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Restaurant
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      {selectedTicket.restaurantName ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <User
                        size={15}
                        className="text-slate-500"
                      />

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Owner
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      {selectedTicket.ownerName ||
                        "—"}
                    </p>

                    {selectedTicket.ownerEmail && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Mail size={12} />
                        {selectedTicket.ownerEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ticket controls */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </label>

                    <select
                      value={selectedTicket.status}
                      disabled={updatingTicket}
                      onChange={(event) =>
                        updateTicket(
                          selectedTicket._id,
                          {
                            status:
                              event.target.value as TicketStatus,
                          }
                        )
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="open">
                        Open
                      </option>

                      <option value="in-progress">
                        In Progress
                      </option>

                      <option value="resolved">
                        Resolved
                      </option>

                      <option value="closed">
                        Closed
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Priority
                    </label>

                    <select
                      value={selectedTicket.priority}
                      disabled={updatingTicket}
                      onChange={(event) =>
                        updateTicket(
                          selectedTicket._id,
                          {
                            priority:
                              event.target.value as TicketPriority,
                          }
                        )
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="urgent">
                        Urgent
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Assigned To
                    </label>

                    <input
                      defaultValue={
                        selectedTicket.assignedTo || ""
                      }
                      onBlur={(event) => {
                        const value =
                          event.target.value.trim();

                        if (
                          value !==
                          (selectedTicket.assignedTo || "")
                        ) {
                          updateTicket(
                            selectedTicket._id,
                            {
                              assignedTo: value,
                            }
                          );
                        }
                      }}
                      placeholder="Assign admin"
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className="space-y-5 p-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Conversation
                  </p>

                  {selectedTicket.messages &&
                  selectedTicket.messages.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTicket.messages.map(
                        (message, index) => {
                          const isAdmin =
                            message.senderType ===
                            "admin";

                          return (
                            <div
                              key={
                                message._id ||
                                `${selectedTicket._id}-${index}`
                              }
                              className={`flex ${
                                isAdmin
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                  isAdmin
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                <div className="mb-1 flex items-center justify-between gap-4">
                                  <span
                                    className={`text-[10px] font-semibold ${
                                      isAdmin
                                        ? "text-slate-300"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {message.senderName}
                                  </span>

                                  <span
                                    className={`text-[9px] ${
                                      isAdmin
                                        ? "text-slate-400"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {formatDate(
                                      message.createdAt
                                    )}
                                  </span>
                                </div>

                                <p className="whitespace-pre-wrap text-xs leading-5">
                                  {message.message}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                      <MessageSquare
                        size={20}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-xs text-slate-500">
                        No messages yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reply */}
            <div className="border-t border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-slate-500"
                />

                <span className="text-xs font-semibold text-slate-700">
                  Reply as Super Admin
                </span>
              </div>

              <div className="flex gap-3">
                <textarea
                  value={reply}
                  onChange={(event) =>
                    setReply(event.target.value)
                  }
                  rows={3}
                  placeholder="Write your reply..."
                  className="min-h-[80px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <button
                  type="button"
                  onClick={sendReply}
                  disabled={
                    sendingReply ||
                    !reply.trim()
                  }
                  className="self-end inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} />

                  {sendingReply
                    ? "Sending..."
                    : "Send"}
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
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}