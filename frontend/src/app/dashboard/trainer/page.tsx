import Link from "next/link";
import {
  Bell,
  BookOpen,
  Users,
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Clock3,
  GraduationCap,
} from "lucide-react";

const STATS = [
  { icon: BookOpen, value: 3, label: "Active Batches" },
  { icon: Users, value: 44, label: "Total Students" },
  { icon: ClipboardList, value: 7, label: "Pending Grading" },
  { icon: CalendarDays, value: 2, label: "Today's Classes" },
];

const SCHEDULE = [
  {
    time: "10:00–12:00",
    title: "PostgreSQL Advanced Queries",
    meta: "BATCH-FS-08 · 18 students · Online",
  },
  {
    time: "18:00–20:00",
    title: "Spring Boot REST APIs",
    meta: "BATCH-JAVA-06 · 14 students · Offline",
  },
];

const GRADING = [
  {
    title: "Node.js CRUD API",
    meta: "BATCH-FS-08 · Due: 25 Aug 2026",
    count: 12,
  },
  {
    title: "Spring Boot REST Assignment",
    meta: "BATCH-JAVA-06 · Due: 28 Aug 2026",
    count: 8,
  },
  {
    title: "React Mini Project",
    meta: "BATCH-FS-09 · Due: 30 Aug 2026",
    count: 5,
  },
];

const ACTIVITY = [
  {
    title: "Marked attendance",
    meta: "BATCH-FS-08 — 16/18 present",
    time: "Yesterday, 12:05 PM",
  },
  {
    title: "Uploaded lecture",
    meta: "Express.js Middleware — Part 2 (BATCH-FS-08)",
    time: "Yesterday, 2:30 PM",
  },
  {
    title: "Created assignment",
    meta: "Node.js CRUD API — due 25 Aug (BATCH-FS-08)",
    time: "2 days ago",
  },
  {
    title: "Graded quiz",
    meta: "React Hooks Quiz — 12 submissions reviewed (BATCH-FS-08)",
    time: "3 days ago",
  },
];

export default function TrainerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
              <GraduationCap size={17} />
              Trainer Portal
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Good morning, Rajesh! 👋
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              You have 2 classes today and 7 submissions to grade.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Bell size={17} />
            Public Site
          </Link>
        </div>

        {/* Development notice */}
        <div className="mb-7 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <Clock3 className="mt-0.5 shrink-0 text-orange-500" size={18} />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Dashboard figures and activity shown here are currently sample
              frontend data. They will come from the backend once trainer APIs
              and database integration are connected.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Icon size={21} />
                </div>

                <div>
                  <div className="text-2xl font-bold text-[#173B67]">
                    {value}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-8">
            {/* Today's Schedule */}
            <section>
              <SectionHeader
                title="Today's Schedule"
                href="/dashboard/trainer/my-batches"
              />

              <div className="space-y-3">
                {SCHEDULE.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="shrink-0 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
                          {item.time}
                        </span>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            {item.meta}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href="/dashboard/trainer/attendance"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#173B67] hover:text-[#173B67] sm:text-sm"
                        >
                          Mark Attendance
                        </Link>

                        <Link
                          href="/dashboard/trainer/my-batches"
                          className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 sm:text-sm"
                        >
                          Start Class
                          <ArrowRight size={14} className="ml-1.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pending Grading */}
            <section>
              <SectionHeader
                title="Pending Grading"
                href="/dashboard/trainer/assignments"
              />

              <div className="space-y-3">
                {GRADING.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                          {item.meta}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                        <span className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
                          {item.count} submissions
                        </span>

                        <Link
                          href="/dashboard/trainer/assignments"
                          className="text-sm font-bold text-[#173B67] transition hover:text-orange-500"
                        >
                          Grade →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Recent Activity */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Your latest trainer actions
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {ACTIVITY.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className={`flex gap-3 p-4 sm:p-5 ${
                    index < ACTIVITY.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <CheckCircle2 size={16} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.meta}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="mt-5 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm">
              <h3 className="text-sm font-bold">Trainer Quick Links</h3>

              <div className="mt-4 space-y-2">
                <QuickLink
                  href="/dashboard/trainer/my-batches"
                  label="My Batches"
                />
                <QuickLink
                  href="/dashboard/trainer/attendance"
                  label="Attendance"
                />
                <QuickLink
                  href="/dashboard/trainer/student-progress"
                  label="Student Progress"
                />
                <QuickLink
                  href="/dashboard/trainer/upload-content"
                  label="Upload Content"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>

      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#173B67] transition hover:text-orange-500 sm:text-sm"
      >
        View All
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-orange-500"
    >
      <span>{label}</span>
      <ArrowRight size={15} />
    </Link>
  );
}
