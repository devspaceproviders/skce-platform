"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  ChevronRight,
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

function StatCard({ icon, label, value, helper }: { icon: ReactNode; label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#173B67]">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">{icon}</div>
      </div>
    </div>
  );
}

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">{icon}</div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PermissionBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
      {enabled ? <CheckCircle2 size={13} /> : null}
      {label}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

export default function TrainerEngagementPanel({ data, mode = "trainer" }: { data: TrainerEngagementData; mode?: Mode }) {
  const [tab, setTab] = useState<Tab>("overview");

  const courses = data.courses ?? data.permissions ?? [];
  const meetings = data.meetings ?? [];
  const upcoming = data.upcomingMeetings ?? [];

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

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={17} /> },
    { id: "courses", label: "Courses & Permissions", icon: <BookOpen size={17} /> },
    { id: "batches", label: "Batches & Students", icon: <Layers3 size={17} /> },
    { id: "meetings", label: "Meetings", icon: <CalendarDays size={17} /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-orange-500">{mode === "admin" ? "Trainer Administration" : "Trainer Portal"}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#173B67]">{mode === "admin" ? "Trainer Engagement" : "My Engagements"}</h1>
        <p className="mt-1 text-sm text-slate-500">{mode === "admin" ? "Detailed view of this trainer's teaching responsibilities, batches, students, permissions and meetings." : "Your teaching responsibilities, assigned batches, students and meetings."}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        <div className="flex min-w-max gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === item.id ? "bg-[#173B67] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<BookOpen size={20} />} label="Responsible Courses" value={data.summary.responsibleCourses} helper="Courses assigned for teaching" />
            <StatCard icon={<Layers3 size={20} />} label="Assigned Batches" value={data.summary.assignedBatches} helper="Active trainer batches" />
            <StatCard icon={<Users size={20} />} label="Students" value={data.summary.students} helper="Students across assigned batches" />
            <StatCard icon={<CalendarDays size={20} />} label="Upcoming Meetings" value={data.summary.upcomingMeetings} helper={`${data.summary.totalMeetings} total meetings`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Section icon={<ShieldCheck size={18} />} title="Permission Coverage" description="Current trainer permissions across responsible courses.">
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
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="font-semibold text-slate-500">{value} ({percent}%)</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#173B67] transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section icon={<CalendarDays size={18} />} title="Meeting Activity" description="Recorded meeting activity for this trainer.">
              <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Total Meetings</p>
                  <p className="mt-2 text-2xl font-bold text-[#173B67]">{data.summary.totalMeetings}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Scheduled</p>
                  <p className="mt-2 text-2xl font-bold text-[#173B67]">{meetingStats.scheduled}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Completed</p>
                  <p className="mt-2 text-2xl font-bold text-[#173B67]">{meetingStats.completed}</p>
                </div>
              </div>
            </Section>
          </div>

          <Section icon={<BookOpen size={18} />} title="Course Responsibilities" description="Quick view of every course assigned to this trainer.">
            {courses.length === 0 ? <Empty text="No course responsibilities are currently assigned." /> : (
              <div className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <div key={course.courseId} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div>
                      <p className="font-semibold text-slate-900">{course.courseTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">Course ID: {course.courseId}</p>
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
          {courses.length === 0 ? <Empty text="No course responsibilities are currently assigned." /> : (
            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
              {courses.map((course) => (
                <div key={course.courseId} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-slate-900">{course.courseTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">{course.courseSlug || `Course ID: ${course.courseId}`}</p>
                    </div>
                    <Award size={19} className="text-orange-500" />
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
        </Section>
      )}

      {tab === "batches" && (
        <Section icon={<Layers3 size={18} />} title="Batches & Students" description="Batches connected to the trainer's responsible teaching courses.">
          {data.batches.length === 0 ? <Empty text="No assigned batches are currently available." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Batch</th>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">Students</th>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3">Mode</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.batches.map((batch) => (
                    <tr key={batch.id} className="border-t border-slate-100">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{batch.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{batch.courseTitle}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Users size={15} />{batch.studentCount}</span></td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(batch.startDate)} – {formatDate(batch.endDate)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{pretty(batch.mode)}</td>
                      <td className="px-6 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{pretty(batch.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {tab === "meetings" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={<CalendarDays size={20} />} label="Total Meetings" value={data.summary.totalMeetings} helper="All recorded meetings" />
            <StatCard icon={<Clock3 size={20} />} label="Upcoming" value={data.summary.upcomingMeetings} helper="Future scheduled meetings" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={meetingStats.completed} helper="Meetings marked completed" />
          </div>

          <Section icon={<CalendarDays size={18} />} title="Upcoming Meetings" description="Future meetings connected to this trainer.">
            {upcoming.length === 0 ? <Empty text="No upcoming meetings are currently scheduled." /> : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((meeting) => (
                  <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Clock3 size={18} /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{meeting.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(meeting.startAt)} · {pretty(meeting.meetingType)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {meeting.courseTitle ? `Course: ${meeting.courseTitle}` : ""}
                          {meeting.batchName ? ` · Batch: ${meeting.batchName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Users size={14} />{meeting.participantCount}</span>
                      {meeting.meetingUrl ? <a href={meeting.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#173B67] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"><Video size={13} />Join</a> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section icon={<Clock3 size={18} />} title="Meeting History" description="Recorded meetings for this trainer.">
            {meetings.length === 0 ? <Empty text="No meetings have been recorded." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Meeting</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Batch</th>
                      <th className="px-6 py-3">Participants</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map((meeting) => (
                      <tr key={meeting.id} className="border-t border-slate-100">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{meeting.title}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(meeting.startAt)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{meeting.courseTitle || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{meeting.batchName || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{meeting.participantCount}</td>
                        <td className="px-6 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{pretty(meeting.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
