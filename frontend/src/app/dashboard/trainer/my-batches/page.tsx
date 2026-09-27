"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  ChevronRight,
  GraduationCap,
  Clock3,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type Course = {
  id: number;
  slug: string;
  title: string;
  isActive: boolean;
};

type Batch = {
  id: number;
  displayId: string;
  name: string;
  courseId: number;
  trainerId: number;
  startDate: string;
  endDate: string;
  mode: string;
  maxStudents: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  course: Course | null;
  studentCount: number;
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
}

function normalizeStatus(
  status: string
): "Active" | "Completed" {
  const normalized =
    status.trim().toUpperCase();

  if (
    normalized === "COMPLETED" ||
    normalized === "COMPLETE"
  ) {
    return "Completed";
  }

  return "Active";
}

function normalizeMode(mode: string) {
  const normalized =
    mode.trim().toUpperCase();

  if (normalized === "OFFLINE") {
    return "Offline";
  }

  return "Online";
}

function formatDate(
  value: string
) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function MyBatchesPage() {
  const [batches, setBatches] =
    useState<Batch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBatches() {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        const response =
          await fetch(
            `${API_URL}/trainer/batches`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Unable to load trainer batches."
          );
        }

        const data =
          Array.isArray(result?.data)
            ? result.data
            : [];

        if (!cancelled) {
          setBatches(data);
        }
      } catch (err) {
        console.error(
          "Load trainer batches error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load trainer batches."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const activeCount =
      batches.filter(
        (batch) =>
          normalizeStatus(
            batch.status
          ) === "Active"
      ).length;

    const completedCount =
      batches.filter(
        (batch) =>
          normalizeStatus(
            batch.status
          ) === "Completed"
      ).length;

    const totalStudents =
      batches.reduce(
        (total, batch) =>
          total +
          Number(
            batch.studentCount || 0
          ),
        0
      );

    return {
      total: batches.length,
      active: activeCount,
      completed: completedCount,
      students: totalStudents,
    };
  }, [batches]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-6 text-white shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                My Batches
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                View the training batches assigned to you and their
                current student counts.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={19}
            />

            <div>
              <p className="font-semibold">
                Unable to load batches
              </p>

              <p className="mt-1 leading-6">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Layers size={20} />}
            value={summary.total}
            label="Total Batches"
          />

          <SummaryCard
            icon={<GraduationCap size={20} />}
            value={summary.active}
            label="Active Batches"
          />

          <SummaryCard
            icon={<Clock3 size={20} />}
            value={summary.completed}
            label="Completed Batches"
          />

          <SummaryCard
            icon={<Users size={20} />}
            value={summary.students}
            label="Total Students"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-slate-200" />

                    <div className="flex-1">
                      <div className="h-5 w-48 rounded bg-slate-200" />

                      <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
                    </div>
                  </div>

                  <div className="my-5 h-px bg-slate-100" />

                  <div className="h-4 w-40 rounded bg-slate-100" />
                </div>
              )
            )}
          </div>
        ) : batches.length === 0 ? (
          /* Empty */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Layers size={25} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No batches assigned
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              You currently do not have any training batches assigned
              to your trainer profile.
            </p>
          </div>
        ) : (
          /* Batch list */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {batches.map(
              (batch) => {
                const status =
                  normalizeStatus(
                    batch.status
                  );

                const mode =
                  normalizeMode(
                    batch.mode
                  );

                const courseName =
                  batch.course?.title ||
                  "Course not available";

                return (
                  <div
                    key={batch.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                          <Layers size={21} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {batch.displayId}
                          </p>

                          <h2 className="mt-0.5 truncate text-base font-bold text-[#173B67]">
                            {batch.name}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {courseName}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          status ===
                          "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="my-5 h-px bg-slate-100" />

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Students"
                        value={`${batch.studentCount} students`}
                      />

                      <DetailItem
                        label="Mode"
                        value={mode}
                      />

                      <DetailItem
                        label="Start Date"
                        value={formatDate(
                          batch.startDate
                        )}
                      />

                      <DetailItem
                        label="End Date"
                        value={formatDate(
                          batch.endDate
                        )}
                      />

                      <DetailItem
                        label="Maximum Students"
                        value={String(
                          batch.maxStudents
                        )}
                      />

                      <DetailItem
                        label="Course"
                        value={courseName}
                      />
                    </div>

                    {/* Action */}
                    <div className="mt-5 flex justify-end">
                      <Link
                        href={`/dashboard/trainer/my-batches/batch-detail/${encodeURIComponent(
                          String(
                            batch.id
                          )
                        )}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-bold text-white transition hover:bg-orange-600"
                      >
                        View Batch
                        <ChevronRight
                          size={15}
                        />
                      </Link>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <div>
          <p className="text-2xl font-bold text-[#173B67]">
            {value}
          </p>

          <p className="mt-0.5 text-sm text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}