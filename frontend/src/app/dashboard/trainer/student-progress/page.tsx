import type { ReactNode } from "react";
import {
  BarChart3,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

const STUDENTS = [
  { name: "Ananya Reddy", batch: "BATCH-FS-08", progress: 88, attendance: "96%" },
  { name: "Vikram Rao", batch: "BATCH-FS-08", progress: 62, attendance: "84%" },
  { name: "Sneha Patil", batch: "BATCH-FS-08", progress: 74, attendance: "92%" },
  { name: "Karthik Iyer", batch: "BATCH-JAVA-06", progress: 45, attendance: "78%" },
  { name: "Meera Nair", batch: "BATCH-JAVA-06", progress: 91, attendance: "98%" },
];

export default function StudentProgressPage() {
  const averageProgress = Math.round(
    STUDENTS.reduce((total, student) => total + student.progress, 0) /
      STUDENTS.length
  );

  const averageAttendance = Math.round(
    STUDENTS.reduce(
      (total, student) => total + Number.parseInt(student.attendance, 10),
      0
    ) / STUDENTS.length
  );

  const strongProgressCount = STUDENTS.filter(
    (student) => student.progress >= 80
  ).length;

  const needsAttentionCount = STUDENTS.filter(
    (student) => student.progress < 60 || Number.parseInt(student.attendance, 10) < 80
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Student Progress
              </h1>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Monitor course completion and attendance across your batches.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-orange-300">
              <BarChart3 size={21} />
            </div>
          </div>
        </div>

        {/* Development notice */}
        <div className="mb-7 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <TrendingUp className="mt-0.5 shrink-0 text-orange-500" size={18} />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Progress and attendance figures are currently sample frontend
              data. They will be calculated from actual course activity and
              attendance records after backend integration.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Users size={20} />}
            label="Total Students"
            value={STUDENTS.length}
            tone="navy"
          />
          <SummaryCard
            icon={<BarChart3 size={20} />}
            label="Average Progress"
            value={`${averageProgress}%`}
            tone="blue"
          />
          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="Average Attendance"
            value={`${averageAttendance}%`}
            tone="green"
          />
          <SummaryCard
            icon={<TrendingUp size={20} />}
            label="Needs Attention"
            value={needsAttentionCount}
            tone={needsAttentionCount > 0 ? "orange" : "green"}
          />
        </div>

        {/* Progress table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student Performance
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Course completion and attendance for your current students.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#173B67]">
              {strongProgressCount} of {STUDENTS.length} above 80% progress
            </span>
          </div>

          <div className="hidden grid-cols-[1.5fr_1fr_2fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:grid lg:px-6">
            <span>Student</span>
            <span>Batch</span>
            <span>Course Progress</span>
            <span>Attendance</span>
          </div>

          <div>
            {STUDENTS.map((student, index) => {
              const attendance = Number.parseInt(student.attendance, 10);
              const progressTone =
                student.progress >= 80
                  ? "bg-emerald-500"
                  : student.progress >= 60
                    ? "bg-blue-500"
                    : "bg-orange-500";

              const attendanceClass =
                attendance >= 90
                  ? "bg-emerald-50 text-emerald-700"
                  : attendance >= 80
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700";

              return (
                <div
                  key={student.name}
                  className={`border-b border-slate-100 p-4 last:border-b-0 sm:p-5 lg:grid lg:grid-cols-[1.5fr_1fr_2fr_1fr] lg:items-center lg:gap-4 lg:px-6 ${
                    index % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                  }`}
                >
                  {/* Student */}
                  <div className="mb-4 lg:mb-0">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Student
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-sm font-bold text-white">
                        {student.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {student.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Student
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Batch */}
                  <div className="mb-4 lg:mb-0">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Batch
                    </span>

                    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                      {student.batch}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4 lg:mb-0">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Course Progress
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${progressTone}`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>

                      <span className="w-10 text-right text-xs font-bold text-slate-600">
                        {student.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div>
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Attendance
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${attendanceClass}`}
                    >
                      {student.attendance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Insight panels */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <InsightCard
            title="Strong Progress"
            description="Students currently at 80% or higher course completion."
            value={`${strongProgressCount} students`}
            tone="green"
            icon={<CheckCircle2 size={19} />}
          />

          <InsightCard
            title="Needs Attention"
            description="Students with lower course progress or attendance."
            value={`${needsAttentionCount} students`}
            tone="orange"
            icon={<TrendingUp size={19} />}
          />
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone: "navy" | "blue" | "green" | "orange";
}) {
  const toneClass = {
    navy: "bg-blue-50 text-[#173B67]",
    blue: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass[tone]}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-2xl font-bold text-[#173B67]">{value}</p>
          <p className="mt-0.5 text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  description,
  value,
  tone,
  icon,
}: {
  title: string;
  description: string;
  value: string;
  tone: "green" | "orange";
  icon: ReactNode;
}) {
  const classes =
    tone === "green"
      ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
      : "border-orange-100 bg-orange-50/50 text-orange-700";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${classes}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80">
          {icon}
        </div>

        <div>
          <p className="text-base font-bold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
          <p className="mt-3 text-sm font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
