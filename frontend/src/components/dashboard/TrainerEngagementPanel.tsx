"use client";

import { useMemo, useState, type ReactNode } from "react";
import AdminVisualEffects from "@/components/dashboard/AdminVisualEffects";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  Users,
  Video,
  ShieldCheck,
  BarChart3,
  Search,
  XCircle,
} from "lucide-react";

export type TrainerEngagementCourse = {
  id: number;
  courseId: number;
  courseTitle: string;
  courseSlug?: string | null;
  canTeach: boolean;
  canManageContent: boolean;
  canCreateAssessments: boolean;
};

export type TrainerEngagementBatch = {
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

export type TrainerEngagementMeeting = {
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
};

export type TrainerEngagementData = {
  trainer?: { id: number; userId: number };
  summary: {
    responsibleCourses: number;
    assignedBatches: number;
    students: number;
    upcomingMeetings: number;
    totalMeetings: number;
  };
  courses: TrainerEngagementCourse[];
  permissions?: TrainerEngagementCourse[];
  batches: TrainerEngagementBatch[];
  meetings: TrainerEngagementMeeting[];
  upcomingMeetings: TrainerEngagementMeeting[];
};

type Mode = "trainer" | "admin";
type Tab = "overview" | "courses" | "batches" | "meetings";

function pretty(value?: string | null) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


/* ------------------------------------------------------------------
 * Small SKCE building blocks (navy / blue / orange, animated)
 * ------------------------------------------------------------------ */

const FIELD =
  "h-10 w-full rounded-xl border border-[#D2DEEE] bg-white px-3 text-sm text-[#0F2F5F] outline-none transition placeholder:text-slate-400 focus:border-[#173B67] focus:ring-4 focus:ring-orange-100";

function rise(index: number) {
  return { animationDelay: `${index * 70}ms` };
}

function StatCard({
  icon,
  label,
  value,
  helper,
  index = 0,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  helper: string;
  index?: number;
}) {
  return (
    <div
      style={rise(index)}
      className="skce-rise skce-interactive-card group relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-gradient-to-br from-white via-[#F7FAFF] to-[#FFF6EC] p-5 shadow-sm"
    >
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-50 bg-gradient-to-r from-[#173B67] via-[#1459B8] to-[#F97316] transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#173B67] tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF1E3] to-[#FFE0C2] text-[#F97316] shadow-inner transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
  index = 0,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  index?: number;
}) {
  return (
    <section
      style={rise(index)}
      className="skce-rise overflow-hidden rounded-2xl border border-[#DCE6F2] bg-gradient-to-b from-white to-[#F7FAFF] shadow-[0_10px_24px_-16px_rgba(15,47,95,0.25)]"
    >
      <div className="flex items-start gap-3 border-b border-[#E3EBF5] bg-gradient-to-r from-[#EEF4FB] via-[#F7FAFF] to-[#FFF5EA] px-5 py-4 sm:px-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#1459B8] text-white shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#173B67]">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PermissionBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        enabled
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
      }`}
    >
      {enabled ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {label}
    </span>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  const key = (value ?? "").toLowerCase();
  const tone =
    key === "completed" || key === "active" || key === "ongoing"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : key === "scheduled" || key === "upcoming"
        ? "bg-blue-50 text-[#1459B8] ring-blue-200"
        : key === "cancelled" || key === "inactive"
          ? "bg-red-50 text-red-600 ring-red-200"
          : "bg-orange-50 text-[#EA580C] ring-orange-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {pretty(value)}
    </span>
  );
}

function Empty({
  text,
  onClear,
}: {
  text: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAF1FD] to-[#FFF1E3] text-[#173B67]">
        <Search size={20} />
      </span>
      <p className="text-sm font-medium text-slate-600">{text}</p>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#EA580C]"
        >
          Clear Filters
        </button>
      ) : null}
    </div>
  );
}

function FilterBar({
  children,
  active,
  onClear,
  shown,
  total,
}: {
  children: ReactNode;
  active: boolean;
  onClear: () => void;
  shown: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E3EBF5] bg-gradient-to-r from-[#F4F8FD] to-[#FFF8F1] px-5 py-3 sm:px-6 lg:flex-row lg:items-center">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.4fr)_repeat(2,minmax(150px,1fr))]">{children}</div>
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="text-xs font-semibold text-slate-500">
          Showing {shown} of {total}
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={!active}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D2DEEE] bg-white px-4 text-sm font-semibold text-[#173B67] transition hover:-translate-y-0.5 hover:border-[#F97316] hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <XCircle size={15} />
          Clear Filters
        </button>
      </div>
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${FIELD} pl-9`}
      />
    </div>
  );
}

const includes = (value: unknown, query: string) =>
  !query || String(value ?? "").toLowerCase().includes(query.trim().toLowerCase());

const TH = "px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#173B67]";
const TD = "px-6 py-4 text-sm text-slate-600";
const COLFIELD =
  "h-9 w-full rounded-lg border border-[#D2DEEE] bg-white px-2.5 text-xs font-medium text-[#0F2F5F] outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#173B67] focus:ring-2 focus:ring-orange-100";

export default function TrainerEngagementPanel({
  data,
  mode = "trainer",
}: {
  data: TrainerEngagementData;
  mode?: Mode;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  // course / permission filters
  const [courseQuery, setCourseQuery] = useState("");
  const [permFilter, setPermFilter] = useState("all");

  // batch filters (global + per column)
  const [batchQuery, setBatchQuery] = useState("");
  const [batchStatus, setBatchStatus] = useState("all");
  const [batchMode, setBatchMode] = useState("all");
  const [batchName, setBatchName] = useState("");
  const [batchCourse, setBatchCourse] = useState("");

  // meeting filters
  const [meetQuery, setMeetQuery] = useState("");
  const [meetStatus, setMeetStatus] = useState("all");
  const [meetTitle, setMeetTitle] = useState("");
  const [meetCourse, setMeetCourse] = useState("");
  const [meetBatch, setMeetBatch] = useState("");
  const [upcomingQuery, setUpcomingQuery] = useState("");

  const courses = data.courses ?? data.permissions ?? [];
  const meetings = data.meetings ?? [];
  const upcoming = data.upcomingMeetings ?? [];
  const batches = data.batches ?? [];

  const permissionStats = useMemo(() => {
    const total = courses.length;
    const teaching = courses.filter((course) => course.canTeach).length;
    const content = courses.filter((course) => course.canManageContent).length;
    const assessments = courses.filter((course) => course.canCreateAssessments).length;
    return { total, teaching, content, assessments };
  }, [courses]);

  const meetingStats = useMemo(() => {
    const scheduled = meetings.filter((meeting) => meeting.status.toLowerCase() === "scheduled").length;
    const completed = meetings.filter((meeting) => meeting.status.toLowerCase() === "completed").length;
    return { scheduled, completed };
  }, [meetings]);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        if (!includes(`${course.courseTitle} ${course.courseSlug ?? ""} ${course.courseId}`, courseQuery)) return false;
        if (permFilter === "teach") return course.canTeach;
        if (permFilter === "content") return course.canManageContent;
        if (permFilter === "assess") return course.canCreateAssessments;
        if (permFilter === "none") return !course.canTeach && !course.canManageContent && !course.canCreateAssessments;
        return true;
      }),
    [courses, courseQuery, permFilter]
  );

  const batchStatusOptions = useMemo(
    () => Array.from(new Set(batches.map((b) => b.status).filter(Boolean) as string[])).sort(),
    [batches]
  );
  const batchModeOptions = useMemo(
    () => Array.from(new Set(batches.map((b) => b.mode).filter(Boolean) as string[])).sort(),
    [batches]
  );
  const filteredBatches = useMemo(
    () =>
      batches.filter(
        (b) =>
          includes(`${b.name} ${b.courseTitle}`, batchQuery) &&
          includes(b.name, batchName) &&
          includes(b.courseTitle, batchCourse) &&
          (batchStatus === "all" || b.status === batchStatus) &&
          (batchMode === "all" || b.mode === batchMode)
      ),
    [batches, batchQuery, batchName, batchCourse, batchStatus, batchMode]
  );
  const batchFiltersActive =
    batchQuery !== "" || batchName !== "" || batchCourse !== "" || batchStatus !== "all" || batchMode !== "all";
  const clearBatchFilters = () => {
    setBatchQuery("");
    setBatchName("");
    setBatchCourse("");
    setBatchStatus("all");
    setBatchMode("all");
  };

  const meetingStatusOptions = useMemo(
    () => Array.from(new Set(meetings.map((m) => m.status).filter(Boolean))).sort(),
    [meetings]
  );
  const filteredMeetings = useMemo(
    () =>
      meetings.filter(
        (m) =>
          includes(`${m.title} ${m.courseTitle ?? ""} ${m.batchName ?? ""} ${m.meetingType}`, meetQuery) &&
          includes(m.title, meetTitle) &&
          includes(m.courseTitle, meetCourse) &&
          includes(m.batchName, meetBatch) &&
          (meetStatus === "all" || m.status === meetStatus)
      ),
    [meetings, meetQuery, meetTitle, meetCourse, meetBatch, meetStatus]
  );
  const meetFiltersActive =
    meetQuery !== "" || meetTitle !== "" || meetCourse !== "" || meetBatch !== "" || meetStatus !== "all";
  const clearMeetFilters = () => {
    setMeetQuery("");
    setMeetTitle("");
    setMeetCourse("");
    setMeetBatch("");
    setMeetStatus("all");
  };

  const filteredUpcoming = useMemo(
    () =>
      upcoming.filter((m) =>
        includes(`${m.title} ${m.courseTitle ?? ""} ${m.batchName ?? ""} ${m.meetingType}`, upcomingQuery)
      ),
    [upcoming, upcomingQuery]
  );

  const tabs: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={17} /> },
    { id: "courses", label: "Courses & Permissions", icon: <BookOpen size={17} />, count: courses.length },
    { id: "batches", label: "Batches & Students", icon: <Layers3 size={17} />, count: batches.length },
    { id: "meetings", label: "Meetings", icon: <CalendarDays size={17} />, count: meetings.length },
  ];

  return (
    <div className="space-y-5">
      <AdminVisualEffects />

      {mode === "trainer" ? (
        <div className="skce-rise">
          <p className="text-sm font-semibold text-[#F97316]">Trainer Portal</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#173B67]">My Engagements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your teaching responsibilities, assigned batches, students and meetings.
          </p>
        </div>
      ) : null}

      <div role="tablist" className="skce-rise overflow-x-auto rounded-2xl border border-[#DCE6F2] bg-gradient-to-r from-[#EEF4FB] via-white to-[#FFF5EA] p-1.5 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#0F2F5F] to-[#1459B8] text-white shadow-[0_8px_18px_-8px_rgba(15,47,95,0.8)]"
                    : "text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-[#173B67]"
                }`}
              >
                {item.icon}
                {item.label}
                {item.count !== undefined ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-[#E6EEF9] text-[#173B67]"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
                {active ? <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-[#F97316]" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div key={tab} className="skce-rise space-y-5">
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard index={0} icon={<BookOpen size={20} />} label="Responsible Courses" value={data.summary.responsibleCourses} helper="Courses assigned for teaching" />
              <StatCard index={1} icon={<Layers3 size={20} />} label="Assigned Batches" value={data.summary.assignedBatches} helper="Active trainer batches" />
              <StatCard index={2} icon={<Users size={20} />} label="Students" value={data.summary.students} helper="Students across assigned batches" />
              <StatCard index={3} icon={<CalendarDays size={20} />} label="Upcoming Meetings" value={data.summary.upcomingMeetings} helper={`${data.summary.totalMeetings} total meetings`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Section index={1} icon={<ShieldCheck size={18} />} title="Permission Coverage" description="Current trainer permissions across responsible courses.">
                <div className="space-y-5 p-5 sm:p-6">
                  {[
                    ["Teaching", permissionStats.teaching],
                    ["Content Management", permissionStats.content],
                    ["Assessment Creation", permissionStats.assessments],
                  ].map(([label, value]) => {
                    const percent = permissionStats.total ? Math.round((Number(value) / permissionStats.total) * 100) : 0;
                    return (
                      <div key={label as string}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#173B67]">{label}</span>
                          <span className="font-semibold text-slate-500">{value} ({percent}%)</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#E6ECF5]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#173B67] via-[#1459B8] to-[#F97316] transition-all duration-1000 ease-out"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section index={2} icon={<CalendarDays size={18} />} title="Meeting Activity" description="Recorded meeting activity for this trainer.">
                <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                  {[
                    ["Total Meetings", data.summary.totalMeetings],
                    ["Scheduled", meetingStats.scheduled],
                    ["Completed", meetingStats.completed],
                  ].map(([label, value]) => (
                    <div key={label as string} className="skce-interactive-card rounded-xl border border-[#E3EBF5] bg-gradient-to-br from-[#F4F8FD] to-[#FFF7EE] p-4">
                      <p className="text-xs font-semibold text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#173B67] tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <Section index={3} icon={<BookOpen size={18} />} title="Course Responsibilities" description="Quick view of every course assigned to this trainer.">
              {courses.length === 0 ? (
                <Empty text="No course responsibilities are currently assigned." />
              ) : (
                <div className="divide-y divide-[#E9F0F8]">
                  {courses.map((course) => (
                    <div key={course.courseId} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#FFF6EC] sm:px-6">
                      <div>
                        <p className="font-semibold text-[#173B67]">{course.courseTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">Course ID: {course.courseId}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PermissionBadge enabled={course.canTeach} label="Teach" />
                        <PermissionBadge enabled={course.canManageContent} label="Content" />
                        <PermissionBadge enabled={course.canCreateAssessments} label="Assessments" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {tab === "courses" && (
          <Section icon={<BookOpen size={18} />} title="Courses & Permissions" description="Complete permission breakdown for the trainer's assigned courses.">
            {courses.length === 0 ? (
              <Empty text="No course responsibilities are currently assigned." />
            ) : (
              <>
                <FilterBar
                  active={courseQuery !== "" || permFilter !== "all"}
                  onClear={() => {
                    setCourseQuery("");
                    setPermFilter("all");
                  }}
                  shown={filteredCourses.length}
                  total={courses.length}
                >
                  <SearchField value={courseQuery} onChange={setCourseQuery} placeholder="Search course…" />
                  <select value={permFilter} onChange={(e) => setPermFilter(e.target.value)} className={FIELD}>
                    <option value="all">All permissions</option>
                    <option value="teach">Can teach</option>
                    <option value="content">Can manage content</option>
                    <option value="assess">Can create assessments</option>
                    <option value="none">No permissions</option>
                  </select>
                </FilterBar>
                {filteredCourses.length === 0 ? (
                  <Empty
                    text="No courses match the selected filters."
                    onClear={() => {
                      setCourseQuery("");
                      setPermFilter("all");
                    }}
                  />
                ) : (
                  <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                    {filteredCourses.map((course, i) => (
                      <div
                        key={course.courseId}
                        style={rise(Math.min(i, 8))}
                        className="skce-rise skce-interactive-card rounded-2xl border border-[#DCE6F2] bg-gradient-to-br from-white to-[#F6F9FE] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-base font-bold text-[#173B67]">{course.courseTitle}</p>
                            <p className="mt-1 text-xs text-slate-500">{course.courseSlug || `Course ID: ${course.courseId}`}</p>
                          </div>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                            <Award size={18} />
                          </span>
                        </div>
                        <div className="mt-5 grid gap-2">
                          <PermissionBadge enabled={course.canTeach} label="Teaching" />
                          <PermissionBadge enabled={course.canManageContent} label="Content Management" />
                          <PermissionBadge enabled={course.canCreateAssessments} label="Assessment Creation" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        {tab === "batches" && (
          <Section icon={<Layers3 size={18} />} title="Batches & Students" description="Batches connected to the trainer's responsible teaching courses.">
            {batches.length === 0 ? (
              <Empty text="No assigned batches are currently available." />
            ) : (
              <>
                <FilterBar active={batchFiltersActive} onClear={clearBatchFilters} shown={filteredBatches.length} total={batches.length}>
                  <SearchField value={batchQuery} onChange={setBatchQuery} placeholder="Search batch or course…" />
                  <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className={FIELD}>
                    <option value="all">All statuses</option>
                    {batchStatusOptions.map((v) => (
                      <option key={v} value={v}>{pretty(v)}</option>
                    ))}
                  </select>
                  <select value={batchMode} onChange={(e) => setBatchMode(e.target.value)} className={FIELD}>
                    <option value="all">All modes</option>
                    {batchModeOptions.map((v) => (
                      <option key={v} value={v}>{pretty(v)}</option>
                    ))}
                  </select>
                </FilterBar>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead>
                      <tr>
                        <th className={TH}>Batch</th>
                        <th className={TH}>Course</th>
                        <th className={TH}>Students</th>
                        <th className={TH}>Period</th>
                        <th className={TH}>Mode</th>
                        <th className={TH}>Status</th>
                      </tr>
                      <tr className="bg-white/60">
                        <th className="px-6 pb-3"><input value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="Filter batch" className={COLFIELD} /></th>
                        <th className="px-6 pb-3"><input value={batchCourse} onChange={(e) => setBatchCourse(e.target.value)} placeholder="Filter course" className={COLFIELD} /></th>
                        <th className="px-6 pb-3" />
                        <th className="px-6 pb-3" />
                        <th className="px-6 pb-3">
                          <select value={batchMode} onChange={(e) => setBatchMode(e.target.value)} className={COLFIELD}>
                            <option value="all">All</option>
                            {batchModeOptions.map((v) => (
                              <option key={v} value={v}>{pretty(v)}</option>
                            ))}
                          </select>
                        </th>
                        <th className="px-6 pb-3">
                          <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className={COLFIELD}>
                            <option value="all">All</option>
                            {batchStatusOptions.map((v) => (
                              <option key={v} value={v}>{pretty(v)}</option>
                            ))}
                          </select>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((batch) => (
                        <tr key={batch.id} className="border-t border-[#E9F0F8]">
                          <td className="px-6 py-4 text-sm font-semibold text-[#173B67]">{batch.name}</td>
                          <td className={TD}>{batch.courseTitle}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173B67]">
                              <Users size={15} className="text-[#F97316]" />
                              {batch.studentCount}
                            </span>
                          </td>
                          <td className={TD}>{formatDate(batch.startDate)} – {formatDate(batch.endDate)}</td>
                          <td className={TD}>{pretty(batch.mode)}</td>
                          <td className="px-6 py-4"><StatusBadge value={batch.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredBatches.length === 0 ? (
                  <Empty text="No batches match the selected filters." onClear={clearBatchFilters} />
                ) : null}
              </>
            )}
          </Section>
        )}

        {tab === "meetings" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard index={0} icon={<CalendarDays size={20} />} label="Total Meetings" value={data.summary.totalMeetings} helper="All recorded meetings" />
              <StatCard index={1} icon={<Clock3 size={20} />} label="Upcoming" value={data.summary.upcomingMeetings} helper="Future scheduled meetings" />
              <StatCard index={2} icon={<CheckCircle2 size={20} />} label="Completed" value={meetingStats.completed} helper="Meetings marked completed" />
            </div>

            <Section index={1} icon={<CalendarDays size={18} />} title="Upcoming Meetings" description="Future meetings connected to this trainer.">
              {upcoming.length === 0 ? (
                <Empty text="No upcoming meetings are currently scheduled." />
              ) : (
                <>
                  <div className="border-b border-[#E3EBF5] bg-gradient-to-r from-[#F4F8FD] to-[#FFF8F1] px-5 py-3 sm:px-6">
                    <div className="max-w-md">
                      <SearchField value={upcomingQuery} onChange={setUpcomingQuery} placeholder="Search upcoming meetings…" />
                    </div>
                  </div>
                  {filteredUpcoming.length === 0 ? (
                    <Empty text="No upcoming meetings match your search." onClear={() => setUpcomingQuery("")} />
                  ) : (
                    <div className="divide-y divide-[#E9F0F8]">
                      {filteredUpcoming.map((meeting) => (
                        <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#FFF6EC] sm:px-6">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF1E3] to-[#FFE0C2] text-[#F97316]">
                              <Clock3 size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#173B67]">{meeting.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatDateTime(meeting.startAt)} · {pretty(meeting.meetingType)}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {meeting.courseTitle ? `Course: ${meeting.courseTitle}` : ""}
                                {meeting.batchName ? ` · Batch: ${meeting.batchName}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Users size={14} />{meeting.participantCount}</span>
                            {meeting.meetingUrl ? (
                              <a
                                href={meeting.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0F2F5F] to-[#1459B8] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              >
                                <Video size={13} />
                                Join
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Section>

            <Section index={2} icon={<Clock3 size={18} />} title="Meeting History" description="Recorded meetings for this trainer.">
              {meetings.length === 0 ? (
                <Empty text="No meetings have been recorded." />
              ) : (
                <>
                  <FilterBar active={meetFiltersActive} onClear={clearMeetFilters} shown={filteredMeetings.length} total={meetings.length}>
                    <SearchField value={meetQuery} onChange={setMeetQuery} placeholder="Search meeting, course or batch…" />
                    <select value={meetStatus} onChange={(e) => setMeetStatus(e.target.value)} className={FIELD}>
                      <option value="all">All statuses</option>
                      {meetingStatusOptions.map((v) => (
                        <option key={v} value={v}>{pretty(v)}</option>
                      ))}
                    </select>
                  </FilterBar>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px]">
                      <thead>
                        <tr>
                          <th className={TH}>Meeting</th>
                          <th className={TH}>Date</th>
                          <th className={TH}>Course</th>
                          <th className={TH}>Batch</th>
                          <th className={TH}>Participants</th>
                          <th className={TH}>Status</th>
                        </tr>
                        <tr className="bg-white/60">
                          <th className="px-6 pb-3"><input value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)} placeholder="Filter meeting" className={COLFIELD} /></th>
                          <th className="px-6 pb-3" />
                          <th className="px-6 pb-3"><input value={meetCourse} onChange={(e) => setMeetCourse(e.target.value)} placeholder="Filter course" className={COLFIELD} /></th>
                          <th className="px-6 pb-3"><input value={meetBatch} onChange={(e) => setMeetBatch(e.target.value)} placeholder="Filter batch" className={COLFIELD} /></th>
                          <th className="px-6 pb-3" />
                          <th className="px-6 pb-3">
                            <select value={meetStatus} onChange={(e) => setMeetStatus(e.target.value)} className={COLFIELD}>
                              <option value="all">All</option>
                              {meetingStatusOptions.map((v) => (
                                <option key={v} value={v}>{pretty(v)}</option>
                              ))}
                            </select>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMeetings.map((meeting) => (
                          <tr key={meeting.id} className="border-t border-[#E9F0F8]">
                            <td className="px-6 py-4 text-sm font-semibold text-[#173B67]">{meeting.title}</td>
                            <td className={TD}>{formatDateTime(meeting.startAt)}</td>
                            <td className={TD}>{meeting.courseTitle || "—"}</td>
                            <td className={TD}>{meeting.batchName || "—"}</td>
                            <td className={TD}>{meeting.participantCount}</td>
                            <td className="px-6 py-4"><StatusBadge value={meeting.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredMeetings.length === 0 ? (
                    <Empty text="No meetings match the selected filters." onClear={clearMeetFilters} />
                  ) : null}
                </>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
