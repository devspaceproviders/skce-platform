"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  Save,
  Users,
  X,
} from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

type Student = {
  id: string;
  name: string;
  roll: string;
};

type Batch = {
  id: string;
  name: string;
  students: Student[];
};

type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
};

const BATCHES: Batch[] = [
  {
    id: "BATCH-FS-08",
    name: "BATCH-FS-08",
    students: [
      { id: "1", name: "Ananya Reddy", roll: "FS08-01" },
      { id: "2", name: "Vikram Rao", roll: "FS08-02" },
      { id: "3", name: "Sneha Patil", roll: "FS08-03" },
      { id: "4", name: "Rahul Kumar", roll: "FS08-04" },
      { id: "5", name: "Priya Sharma", roll: "FS08-05" },
    ],
  },
  {
    id: "BATCH-JAVA-06",
    name: "BATCH-JAVA-06",
    students: [
      { id: "6", name: "Karthik Iyer", roll: "JAVA06-01" },
      { id: "7", name: "Meera Nair", roll: "JAVA06-02" },
      { id: "8", name: "Arjun Reddy", roll: "JAVA06-03" },
    ],
  },
];

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Leave",
];

export default function TrainerAttendancePage() {
  const [batchId, setBatchId] = useState(BATCHES[0].id);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [saved, setSaved] = useState(false);

  const selectedBatch = useMemo(
    () => BATCHES.find((batch) => batch.id === batchId),
    [batchId]
  );

  useEffect(() => {
    if (!selectedBatch) return;

    const storageKey = `skce_attendance_${batchId}_${date}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        setAttendance(JSON.parse(stored));
        setSaved(true);
        return;
      } catch {
        // Fall back to fresh attendance state.
      }
    }

    const initial: Record<string, AttendanceRecord> = {};

    selectedBatch.students.forEach((student) => {
      initial[student.id] = {
        studentId: student.id,
        status: "Present",
        remarks: "",
      };
    });

    setAttendance(initial);
    setSaved(false);
  }, [selectedBatch, batchId, date]);

  const updateStatus = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        status,
      },
    }));
    setSaved(false);
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        remarks,
      },
    }));
    setSaved(false);
  };

  const markAllPresent = () => {
    setAttendance((previous) => {
      const updated = { ...previous };

      Object.keys(updated).forEach((id) => {
        updated[id] = {
          ...updated[id],
          status: "Present",
        };
      });

      return updated;
    });

    setSaved(false);
  };

  const handleSave = () => {
    const key = `skce_attendance_${batchId}_${date}`;
    localStorage.setItem(key, JSON.stringify(attendance));
    setSaved(true);
  };

  const resetAttendance = () => {
    if (!selectedBatch) return;

    const reset: Record<string, AttendanceRecord> = {};

    selectedBatch.students.forEach((student) => {
      reset[student.id] = {
        studentId: student.id,
        status: "Present",
        remarks: "",
      };
    });

    setAttendance(reset);
    setSaved(false);
  };

  const counts = {
    Present: 0,
    Absent: 0,
    Late: 0,
    Leave: 0,
  };

  Object.values(attendance).forEach((record) => {
    counts[record.status]++;
  });

  const totalStudents = selectedBatch?.students.length ?? 0;
  const markedStudents = Object.keys(attendance).length;
  const attendancePercentage =
    totalStudents > 0
      ? Math.round((counts.Present / totalStudents) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Attendance Marking
              </h1>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Mark and manage student attendance for your training batches.
              </p>
            </div>

            <button
              onClick={markAllPresent}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Check size={17} />
              Mark All Present
            </button>
          </div>
        </div>

        {/* Development notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <Clock3 size={18} className="mt-0.5 shrink-0 text-orange-500" />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Attendance is currently saved in browser local storage. It will
              be persisted to the backend once trainer attendance APIs are
              connected.
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Batch
              </span>

              <div className="relative">
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  {BATCHES.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Attendance Date
              </span>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSaved(false);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </label>
          </div>
        </section>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <SummaryCard label="Students" value={totalStudents} icon={<Users size={19} />} />
          <SummaryCard label="Marked" value={markedStudents} icon={<Check size={19} />} />
          <SummaryCard label="Present" value={counts.Present} icon={<Check size={19} />} tone="green" />
          <SummaryCard label="Absent" value={counts.Absent} icon={<X size={19} />} tone="red" />
          <SummaryCard label="Attendance" value={`${attendancePercentage}%`} icon={<CalendarDays size={19} />} tone="orange" />
        </div>

        {/* Table / responsive cards */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedBatch?.name ?? "Attendance"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Set status and optional remarks for each student.
              </p>
            </div>

            <div className="text-sm font-semibold text-[#173B67]">
              {selectedBatch?.students.length ?? 0} students
            </div>
          </div>

          <div className="hidden grid-cols-[1.35fr_0.8fr_1fr_1.8fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:grid lg:px-6">
            <span>Student</span>
            <span>Roll No.</span>
            <span>Status</span>
            <span>Remarks</span>
          </div>

          <div>
            {selectedBatch?.students.map((student, index) => {
              const record = attendance[student.id];

              return (
                <div
                  key={student.id}
                  className={`border-b border-slate-100 p-4 last:border-b-0 sm:p-5 lg:grid lg:grid-cols-[1.35fr_0.8fr_1fr_1.8fr] lg:items-center lg:gap-4 lg:px-6 ${
                    index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  }`}
                >
                  <div className="mb-4 lg:mb-0">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Student
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xs font-bold text-white">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {student.name}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 lg:mb-0">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Roll No.
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {student.roll}
                    </span>
                  </div>

                  <div className="mb-4 lg:mb-0">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Status
                    </span>

                    <select
                      value={record?.status ?? "Present"}
                      onChange={(e) =>
                        updateStatus(
                          student.id,
                          e.target.value as AttendanceStatus
                        )
                      }
                      className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-orange-100 ${
                        record?.status === "Present"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : record?.status === "Absent"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : record?.status === "Late"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Remarks
                    </span>

                    <input
                      value={record?.remarks ?? ""}
                      onChange={(e) =>
                        updateRemarks(student.id, e.target.value)
                      }
                      placeholder="Optional remarks"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleSave}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            <Save size={17} />
            Save Attendance
          </button>

          <button
            onClick={resetAttendance}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <X size={16} />
            Reset
          </button>

          {saved && (
            <span className="text-sm font-semibold text-green-600">
              ✓ Attendance saved successfully
            </span>
          )}
        </div>

        {/* Status legend */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <LegendDot color="bg-emerald-500" label="Present" />
          <LegendDot color="bg-red-500" label="Absent" />
          <LegendDot color="bg-amber-500" label="Late" />
          <LegendDot color="bg-indigo-500" label="Leave" />
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "navy",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "navy" | "green" | "red" | "orange";
}) {
  const classes = {
    navy: "bg-blue-50 text-[#173B67]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
