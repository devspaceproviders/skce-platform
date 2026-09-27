"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Users,
  Layers,
  Mail,
  Phone,
  Hash,
  GraduationCap,
  CalendarDays,
  Clock3,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type Batch = {
  id: number;
  displayId: string;
  name: string;
  courseId: number;
  trainerId: number | null;
  startDate: string;
  endDate: string;
  mode: string;
  maxStudents: number;
  status: string;
  course: {
    id: number;
    slug: string;
    title: string;
    isActive: boolean;
  } | null;
  trainer: {
    id: number;
    userId: number;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  } | null;
  studentCount: number;
};

type BatchStudent = {
  id: number;
  studentId: number;
  assignedAt: string;
  completedAt: string | null;
  student: {
    id: number;
    studentId: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  } | null;
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMode(value: string) {
  switch (value?.toUpperCase()) {
    case "ONLINE":
      return "Online";
    case "HYBRID":
      return "Hybrid";
    default:
      return "Offline";
  }
}

function formatStatus(value: string) {
  switch (value?.toUpperCase()) {
    case "ACTIVE":
      return "Active";
    case "COMPLETED":
      return "Completed";
    case "INACTIVE":
      return "Inactive";
    default:
      return "Upcoming";
  }
}

async function apiFetch(path: string) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      result?.message ||
        "You are not authorized to view this batch."
    );
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        "Unable to load batch information."
    );
  }

  return result;
}

export default function BatchDetailPage() {
  const router = useRouter();
  const params = useParams();

  const batchId = String(params.batchId || "");

  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      if (!batchId) {
        throw new Error("Batch ID is missing.");
      }

      const [batchResult, studentsResult] =
        await Promise.all([
          apiFetch(`/trainer/batches/${batchId}`),
          apiFetch(`/trainer/batches/${batchId}/students`),
        ]);

      setBatch(batchResult?.data || null);
      setStudents(
        Array.isArray(studentsResult?.data)
          ? studentsResult.data
          : []
      );
    } catch (err) {
      console.error(
        "Load trainer batch details error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load batch details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [batchId]);

  const enrolledStudents = students.filter(
    (item) => item.student
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-[1400px] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={32}
              className="mx-auto animate-spin text-orange-500"
            />
            <p className="mt-3 text-sm text-slate-500">
              Loading batch details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !batch) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <button
            onClick={() =>
              router.push(
                "/dashboard/trainer/my-batches"
              )
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#173B67]"
          >
            <ArrowLeft size={16} />
            Back to My Batches
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />
              <div>
                <p className="font-semibold">
                  Unable to load batch
                </p>
                <p className="mt-1 text-sm">
                  {error || "Batch not found."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <button
          onClick={() =>
            router.push(
              "/dashboard/trainer/my-batches"
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#173B67]"
        >
          <ArrowLeft size={16} />
          Back to My Batches
        </button>

        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <div className="flex items-center gap-2">
                <Layers
                  size={21}
                  className="text-orange-300"
                />
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {batch.name}
                </h1>
              </div>

              <p className="mt-2 text-sm text-blue-100">
                {batch.displayId} ·{" "}
                {batch.course?.title ||
                  "Course not available"}
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-100">
                Enrolled Students
              </p>
              <p className="mt-1 text-2xl font-bold">
                {enrolledStudents}
                <span className="ml-1 text-sm font-normal text-blue-100">
                  / {batch.maxStudents}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Backend status */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          <Clock3
            className="mt-0.5 shrink-0 text-blue-500"
            size={18}
          />
          <div>
            <p className="font-semibold text-slate-900">
              Live batch data
            </p>
            <p className="mt-0.5 leading-6">
              Students and batch information are loaded
              directly from the backend. Student
              assignments are managed from the Admin
              Batches page.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Users size={20} />}
            value={enrolledStudents}
            label="Enrolled Students"
          />
          <SummaryCard
            icon={<Layers size={20} />}
            value={batch.maxStudents}
            label="Maximum Seats"
          />
          <SummaryCard
            icon={<CalendarDays size={20} />}
            value={batch.studentCount}
            label="Backend Student Count"
          />
        </div>

        {/* Batch information */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Batch Information
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current information for this assigned batch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Batch ID"
              value={batch.displayId}
            />
            <Detail
              label="Course"
              value={
                batch.course?.title ||
                "Not available"
              }
            />
            <Detail
              label="Trainer"
              value={
                batch.trainer?.name ||
                "Not assigned"
              }
            />
            <Detail
              label="Status"
              value={formatStatus(batch.status)}
            />
            <Detail
              label="Start Date"
              value={formatDate(batch.startDate)}
            />
            <Detail
              label="End Date"
              value={formatDate(batch.endDate)}
            />
            <Detail
              label="Mode"
              value={formatMode(batch.mode)}
            />
            <Detail
              label="Seats"
              value={`${enrolledStudents} / ${batch.maxStudents}`}
            />
          </div>
        </section>

        {/* Students */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Batch Students
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Students currently assigned to this batch.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
              {enrolledStudents} / {batch.maxStudents} seats
            </span>
          </div>

          <div className="hidden grid-cols-[1.4fr_0.8fr_1.5fr_1.2fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:grid lg:px-6">
            <span>Name</span>
            <span>Roll No.</span>
            <span>Email</span>
            <span>Phone</span>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <Users size={29} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                No students in this batch
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                No students are currently assigned to
                this batch.
              </p>
            </div>
          ) : (
            <div>
              {students.map((assignment) => {
                const student = assignment.student;

                if (!student) {
                  return null;
                }

                return (
                  <div
                    key={assignment.id}
                    className="border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5 lg:grid lg:grid-cols-[1.4fr_0.8fr_1.5fr_1.2fr] lg:items-center lg:gap-4 lg:px-6 hover:bg-slate-50/60"
                  >
                    <div className="mb-4 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Name
                      </label>

                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xs font-bold text-white">
                          {student.name
                            ? student.name
                                .charAt(0)
                                .toUpperCase()
                            : "?"}
                        </div>

                        <span className="truncate text-sm font-semibold text-slate-800">
                          {student.name || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Roll No.
                      </label>

                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <Hash
                          size={14}
                          className="text-orange-500"
                        />
                        {student.studentId || "—"}
                      </span>
                    </div>

                    <div className="mb-4 min-w-0 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Email
                      </label>

                      <span className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-slate-600">
                        <Mail
                          size={14}
                          className="shrink-0 text-slate-400"
                        />
                        <span className="truncate">
                          {student.email || "—"}
                        </span>
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Phone
                      </label>

                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone
                          size={14}
                          className="text-slate-400"
                        />
                        {student.phone || "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}
