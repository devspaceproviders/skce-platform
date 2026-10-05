"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Star,
  ThumbsDown,
  Users,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type FeedbackStatus = "PENDING" | "APPROVED" | "REJECTED";

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

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={13} />
        Approved
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle size={13} />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <Clock3 size={13} />
      Pending
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          className={
            index < rating ? "text-amber-400" : "text-slate-200"
          }
          fill={index < rating ? "currentColor" : "none"}
          strokeWidth={1.8}
        />
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(`${API_URL}/admin/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Failed to load feedback.");
      }

      setFeedback(json.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const updateStatus = async (
    id: number,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      setUpdatingId(id);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/admin/feedback/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json.message || "Failed to update feedback."
        );
      }

      setFeedback((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update feedback."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = feedback.filter(
    (item) => item.status === "PENDING"
  ).length;

  const approvedCount = feedback.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const rejectedCount = feedback.filter(
    (item) => item.status === "REJECTED"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand">
              <MessageSquareText size={17} />
              Community
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Feedback
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage feedback submitted by students about
              their overall package experience.
            </p>
          </div>

          <button
            type="button"
            onClick={loadFeedback}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Pending Review
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {pendingCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Approved
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {approvedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Rejected
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {rejectedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <XCircle size={21} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Feedback list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-2">
              <Users size={19} className="text-slate-500" />

              <h2 className="text-base font-bold text-slate-900">
                Submitted Feedback
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {feedback.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading feedback...
              </div>
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <MessageSquareText size={25} />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                No feedback yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Student feedback submitted through the Student Portal
                will appear here for review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="p-6 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    {/* Main information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {item.studentName}
                            </h3>

                            <StatusBadge status={item.status} />
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.studentEmail}
                          </p>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <RatingStars rating={item.rating} />

                          <p className="mt-1 text-xs text-slate-400">
                            Submitted {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Package */}
                      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Package
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {item.packageName}
                        </p>
                      </div>

                      {/* Feedback */}
                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Student Feedback
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          “{item.comment}”
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {item.status === "PENDING" && (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(item.id, "APPROVED")
                          }
                          disabled={updatingId === item.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} />
                          {updatingId === item.id
                            ? "Updating..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(item.id, "REJECTED")
                          }
                          disabled={updatingId === item.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ThumbsDown size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}