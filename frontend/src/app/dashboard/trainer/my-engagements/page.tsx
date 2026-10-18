"use client";
import { useEffect, useMemo, useState } from "react";
import { PortalStatCard } from "@/components/dashboard/admin/AdminPageHeader";
import {
  Activity,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  AdminPageHeader,
  ADMIN_BTN_GHOST,
} from "@/components/dashboard/admin/AdminPageHeader";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";
type Course = {
  id: number;
  courseId: number;
  courseTitle: string;
  courseSlug?: string | null;
  canTeach: boolean;
  canManageContent: boolean;
  canCreateAssessments: boolean;
};
type Batch = {
  id: number;
  name: string;
  courseId: number;
  courseTitle: string;
  startDate: string;
  endDate: string;
  mode?: string | null;
  status?: string | null;
  studentCount: number;
};
type Meeting = {
  id: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  meetingType: string;
  status: string;
  courseId?: number | null;
  courseTitle?: string | null;
  batchId?: number | null;
  batchName?: string | null;
  participantCount: number;
  organizer?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};
type EngagementData = {
  summary: {
    responsibleCourses: number;
    assignedBatches: number;
    students: number;
    upcomingMeetings: number;
    totalMeetings: number;
  };
  courses: Course[];
  batches: Batch[];
  meetings: Meeting[];
  upcomingMeetings: Meeting[];
};
function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}
function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
function pretty(value?: string | null) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}
function organizerName(meeting: Meeting) {
  return meeting.organizer?.name?.trim() || "Not available";
}
function organizerRole(meeting: Meeting) {
  return meeting.organizer?.role
    ? pretty(meeting.organizer.role)
    : "";
}
async function loadEngagements() {
  const token = getToken();
  if (!token) {
    throw new Error(
      "Authentication token not found."
    );
  }
  const response = await fetch(
    `${API_URL}/trainer/engagements`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
  const result = await response
    .json()
    .catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message ||
        "Unable to load your engagements."
    );
  }
  return result.data as EngagementData;
}
export default function MyEngagementsPage() {
  const [data, setData] =
    useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");
  async function refresh(isRefresh = false) {
    try {
      isRefresh
        ? setRefreshing(true)
        : setLoading(true);
      setError("");
      const result =
        await loadEngagements();
      setData(result);
    } catch (err) {
      console.error(
        "Load My Engagements error:",
        err
      );
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your engagements."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const upcoming = useMemo(
    () =>
      (data?.upcomingMeetings ?? []).slice(0, 5),
    [data]
  );
  const [batchQuery, setBatchQuery] = useState("");
  const [batchStatus, setBatchStatus] = useState("ALL");
  const [batchCourse, setBatchCourse] = useState("ALL");
  const batchCourses = useMemo(
    () =>
      Array.from(
        new Set((data?.batches ?? []).map((batch) => batch.courseTitle).filter(Boolean))
      ) as string[],
    [data]
  );
  const batchStatuses = useMemo(
    () =>
      Array.from(
        new Set((data?.batches ?? []).map((batch) => String(batch.status ?? "")).filter(Boolean))
      ),
    [data]
  );
  const filteredBatches = useMemo(() => {
    const needle = batchQuery.trim().toLowerCase();
    return (data?.batches ?? []).filter((batch) => {
      if (batchStatus !== "ALL" && String(batch.status ?? "") !== batchStatus) return false;
      if (batchCourse !== "ALL" && batch.courseTitle !== batchCourse) return false;
      if (!needle) return true;
      return `${batch.name ?? ""} ${batch.courseTitle ?? ""}`.toLowerCase().includes(needle);
    });
  }, [data, batchQuery, batchStatus, batchCourse]);
  const batchFiltersOn = batchQuery.trim() !== "" || batchStatus !== "ALL" || batchCourse !== "ALL";

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-orange-500"
            />
            <p className="mt-3 text-sm text-slate-500">
              Loading your engagements...
            </p>
          </div>
        </div>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            Unable to load My Engagements
          </h1>
          <p className="mt-2 text-sm text-red-600">
            {error || "No engagement data available."}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-5 rounded-lg bg-[#173B67] px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-[1680px]">
        <AdminPageHeader
          className="mb-6"
          label="Trainer Portal"
          icon={Layers3}
          title="My Engagements"
          subtitle="Your teaching responsibilities, assigned batches, students and upcoming meetings."
          chips={[
            { label: "Courses", value: data.summary.responsibleCourses },
            { label: "Batches", value: data.summary.assignedBatches },
            { label: "Students", value: data.summary.students },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void refresh(true)}
              disabled={refreshing}
              className={ADMIN_BTN_GHOST}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<BookOpen size={19} />}
            label="Responsible Courses"
            value={data.summary.responsibleCourses}
          />
          <SummaryCard
            icon={<Layers3 size={19} />}
            label="Assigned Batches"
            value={data.summary.assignedBatches}
          />
          <SummaryCard
            icon={<Users size={19} />}
            label="Students"
            value={data.summary.students}
          />
          <SummaryCard
            icon={<CalendarDays size={19} />}
            label="Upcoming Meetings"
            value={data.summary.upcomingMeetings}
          />
        </div>
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">
          <SectionHeader
            icon={<BookOpen size={18} />}
            title="Responsible Courses"
            description="Courses where you currently have teaching responsibility."
          />
          {data.courses.length === 0 ? (
            <Empty text="No teaching courses are currently assigned to you." />
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {data.courses.map((course) => (
                <div
                  key={course.courseId}
                  className="group rounded-xl border border-slate-200/80 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {course.courseTitle}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Course ID: {course.courseId}
                      </p>
                    </div>
                    <CheckCircle2
                      size={19}
                      className="text-emerald-500"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PermissionBadge
                      enabled={course.canTeach}
                      label="Teach"
                    />
                    <PermissionBadge
                      enabled={
                        course.canManageContent
                      }
                      label="Content"
                    />
                    <PermissionBadge
                      enabled={
                        course.canCreateAssessments
                      }
                      label="Assessments"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">
          <SectionHeader
            icon={<Layers3 size={18} />}
            title="Assigned Batches"
            description="Batches connected to your responsible teaching courses."
          />
          {data.batches.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 focus-within:border-[#173B67] focus-within:ring-2 focus-within:ring-orange-200">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  value={batchQuery}
                  onChange={(event) => setBatchQuery(event.target.value)}
                  placeholder="Search batch or course"
                  aria-label="Search batches"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none"
                />
              </label>
              <select
                value={batchCourse}
                onChange={(event) => setBatchCourse(event.target.value)}
                aria-label="Filter by course"
                className="h-10 max-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#173B67]"
              >
                <option value="ALL">All courses</option>
                {batchCourses.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select
                value={batchStatus}
                onChange={(event) => setBatchStatus(event.target.value)}
                aria-label="Filter by status"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#173B67]"
              >
                <option value="ALL">All statuses</option>
                {batchStatuses.map((status) => (
                  <option key={status} value={status}>{pretty(status)}</option>
                ))}
              </select>
              {batchFiltersOn ? (
                <button
                  type="button"
                  onClick={() => {
                    setBatchQuery("");
                    setBatchStatus("ALL");
                    setBatchCourse("ALL");
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                >
                  <X size={14} /> Clear filters
                </button>
              ) : null}
            </div>
          ) : null}
          {data.batches.length === 0 ? (
            <Empty text="No assigned batches are currently available." />
          ) : filteredBatches.length === 0 ? (
            <Empty text="No batches match the current filters." />
          ) : (
            <div className="overflow-x-auto p-1">
              <table className="w-full min-w-[760px]">
                <thead className="bg-[#F2F6FC]">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Batch</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Students</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="border-t border-slate-100 transition-colors hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {batch.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {batch.courseTitle}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {batch.studentCount}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(batch.startDate)} –{" "}
                        {formatDate(batch.endDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {pretty(batch.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">
          <SectionHeader
            icon={<CalendarDays size={18} />}
            title="Upcoming Engagements"
            description="Meetings connected to your trainer account, batches or students."
          />
          {upcoming.length === 0 ? (
            <Empty text="No upcoming meetings are currently scheduled." />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((meeting) => (
                <div
                  key={meeting.id}
                  className="px-5 py-5 transition duration-200 hover:bg-orange-50/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Clock3 size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {meeting.title}
                          </h3>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            {pretty(meeting.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {formatDateTime(meeting.startAt)}
                          {meeting.endAt ? ` – ${formatDateTime(meeting.endAt)}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {pretty(meeting.meetingType)}
                          </span>
                          {meeting.meetingPlatform ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {pretty(meeting.meetingPlatform)}
                            </span>
                          ) : null}
                          {meeting.courseTitle ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              Course: {meeting.courseTitle}
                            </span>
                          ) : null}
                          {meeting.batchName ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              Batch: {meeting.batchName}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={14} />
                            {meeting.participantCount} participant{meeting.participantCount === 1 ? "" : "s"}
                          </span>
                          <span>
                            Scheduled by: <strong className="font-semibold text-slate-700">{organizerName(meeting)}</strong>
                            {organizerRole(meeting) ? ` · ${organizerRole(meeting)}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    {meeting.meetingUrl ? (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-md"
                      >
                        Join Meeting
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <Activity
              size={19}
              className="mt-0.5 text-orange-500"
            />
            <div>
              <h2 className="font-bold text-slate-900">
                Engagement data
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This page is driven by your current course
                permissions, batch assignments and meeting
                records. It does not use hardcoded engagement
                data.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return <PortalStatCard icon={icon} tone="orange" label={label} value={value} />;
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
    <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 px-5 py-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
function PermissionBadge({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="p-8 text-center">
      <Award
        size={28}
        className="mx-auto text-slate-300"
      />
      <p className="mt-3 text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}
