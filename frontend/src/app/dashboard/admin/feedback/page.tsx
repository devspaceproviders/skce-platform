"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquareText,
  RefreshCw,
  Search,
  Star,
  ThumbsDown,
  Users,
  XCircle,
} from "lucide-react";

import {
  AdminPageShell,
  AdminPageHeader,
  ADMIN_BTN_GHOST,
} from "@/components/dashboard/admin/AdminPageHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type FeedbackStatus = "PENDING" | "APPROVED" | "REJECTED";
type StatusFilter = "ALL" | FeedbackStatus;

interface Feedback {
  id: number;
  userId: number;
  studentName: string;
  studentEmail: string;
  packageId: number;
  packageName: string;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const config = {
    APPROVED: {
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      label: "Approved",
      Icon: CheckCircle2,
    },
    REJECTED: {
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      label: "Rejected",
      Icon: XCircle,
    },
    PENDING: {
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      label: "Pending review",
      Icon: Clock3,
    },
  }[status];
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={17}
          className={index < rating ? "text-amber-400" : "text-slate-200"}
          fill={index < rating ? "currentColor" : "none"}
          strokeWidth={1.8}
        />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-slate-500">{rating}/5</span>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      const response = await fetch(`${API_URL}/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Failed to load feedback.");
      }

      setFeedback(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedback();
  }, []);

  const updateStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      setUpdatingId(id);
      setError("");

      const response = await fetch(`${API_URL}/admin/feedback/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Failed to update feedback.");
      }

      setFeedback((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update feedback.");
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = feedback.filter((item) => item.status === "PENDING").length;
  const approvedCount = feedback.filter((item) => item.status === "APPROVED").length;
  const rejectedCount = feedback.filter((item) => item.status === "REJECTED").length;

  const filteredFeedback = useMemo(() => {
    const query = search.trim().toLowerCase();
    return feedback.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.studentName,
          item.studentEmail,
          item.packageName,
          item.comment,
          String(item.id),
        ].some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesRating =
        ratingFilter === "ALL" || item.rating === Number(ratingFilter);
      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [feedback, search, statusFilter, ratingFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setRatingFilter("ALL");
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "ALL" || ratingFilter !== "ALL";

  return (
    <AdminPageShell>
      <AdminPageHeader
        label="Community · Student Experience"
        title="Student Feedback"
        subtitle="Review package ratings, manage student comments, and keep the SK Computer Education learning experience improving."
        icon={MessageSquareText}
        chips={[
          { label: "Total", value: feedback.length },
          { label: "Pending", value: pendingCount },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadFeedback()}
            disabled={loading}
            className={ADMIN_BTN_GHOST}
          >
            <RefreshCw size={16} className={loading ? "animate-spin motion-reduce:animate-none" : ""} />
            Refresh
          </button>
        }
      />


        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending review</p>
                <p className="mt-2 text-3xl font-extrabold text-[#173B67]">{pendingCount}</p>
                <p className="mt-1 text-xs text-slate-400">Awaiting moderation</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <Clock3 size={22} />
              </div>
            </div>
          </div>
          <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#173B67] to-sky-500" />
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved</p>
                <p className="mt-2 text-3xl font-extrabold text-[#173B67]">{approvedCount}</p>
                <p className="mt-1 text-xs text-slate-400">Visible and approved</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>
          <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="h-1 bg-gradient-to-r from-slate-400 to-orange-400" />
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rejected</p>
                <p className="mt-2 text-3xl font-extrabold text-[#173B67]">{rejectedCount}</p>
                <p className="mt-1 text-xs text-slate-400">Not approved for display</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <XCircle size={22} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <XCircle className="mt-0.5 shrink-0" size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Search and filters */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-orange-50/70 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-[#173B67]">
                  <Filter size={18} className="text-orange-600" />
                  Filter feedback
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search by student, package or comment, or filter by status and rating.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#173B67]">
                  Showing {filteredFeedback.length} of {feedback.length}
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear filters
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_210px_180px]">
              <label className="relative block">
                <span className="sr-only">Search feedback</span>
                <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, email, package, comment or ID..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </label>
              <label className="block">
                <span className="sr-only">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                >
                  <option value="ALL">All statuses</option>
                  <option value="PENDING">Pending review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
              <label className="block">
                <span className="sr-only">Filter by rating</span>
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                >
                  <option value="ALL">All ratings</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </label>
            </div>
          </div>

          <div className="border-b border-slate-100 px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-orange-600" />
              <h2 className="text-base font-bold text-[#173B67]">Submitted Feedback</h2>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-100">
                {filteredFeedback.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <RefreshCw size={18} className="animate-spin motion-reduce:animate-none text-orange-600" />
                Loading feedback...
              </div>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <MessageSquareText size={25} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {feedback.length === 0 ? "No feedback yet" : "No matching feedback"}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {feedback.length === 0
                  ? "Student feedback submitted through the Student Portal will appear here for review."
                  : "Try changing your search or filters to see more feedback."}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFeedback.map((item) => (
                <article
                  key={item.id}
                  className="border-l-4 border-l-transparent p-5 transition duration-200 hover:border-l-orange-400 hover:bg-orange-50/20 sm:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-base font-bold text-[#173B67]">
                              {item.studentName}
                            </h3>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="mt-1 break-all text-xs text-slate-500">{item.studentEmail}</p>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <RatingStars rating={item.rating} />
                          <p className="mt-1 text-xs text-slate-400">
                            Submitted {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition-colors hover:border-orange-200">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Package
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {item.packageName || "Package not specified"}
                        </p>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Student feedback
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {item.comment ? `“${item.comment}”` : "No written comment provided."}
                        </p>
                      </div>
                    </div>

                    {item.status === "PENDING" && (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <button
                          type="button"
                          onClick={() => void updateStatus(item.id, "APPROVED")}
                          disabled={updatingId === item.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} />
                          {updatingId === item.id ? "Updating..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateStatus(item.id, "REJECTED")}
                          disabled={updatingId === item.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition duration-200 hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ThumbsDown size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
    </AdminPageShell>
  );
}
