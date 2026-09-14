"use client";

import type { MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  MoreVertical,
  Eye,
  Pencil,
  X,
  Save,
  ClipboardCheck,
} from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

type AttendanceRecord = {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  batch: string;
  date: string;
  checkIn: string;
  status: AttendanceStatus;
};

const COURSES = [
  "Computer Basics",
  "Typing Course - Basics",
  "MS Office",
  "DCA",
  "PGDCA",
  "AI Skills",
  "Digital Marketing",
  "C Programming",
  "C++",
  "MS DOS",
  "HTML",
  "Python",
  "JAVA",
  "Job Oriented Courses",
  "Abacus",
  "Spoken English",
];

const BATCHES = ["All Batches", "No Batches Available"];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(
    INITIAL_ATTENDANCE
  );
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [statusFilter, setStatusFilter] = useState<
    "All" | AttendanceStatus
  >("All");

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<AttendanceRecord | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const filteredRecords = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !searchText ||
        record.studentName.toLowerCase().includes(searchText) ||
        record.studentId.toLowerCase().includes(searchText) ||
        record.course.toLowerCase().includes(searchText) ||
        record.batch.toLowerCase().includes(searchText);

      const matchesDate = record.date === selectedDate;
      const matchesBatch =
        selectedBatch === "All Batches" || record.batch === selectedBatch;
      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesDate && matchesBatch && matchesStatus;
    });
  }, [records, search, selectedDate, selectedBatch, statusFilter]);

  const totalStudents = filteredRecords.length;
  const presentCount = filteredRecords.filter(
    (record) => record.status === "Present"
  ).length;
  const absentCount = filteredRecords.filter(
    (record) => record.status === "Absent"
  ).length;
  const lateCount = filteredRecords.filter(
    (record) => record.status === "Late"
  ).length;
  const leaveCount = filteredRecords.filter(
    (record) => record.status === "Leave"
  ).length;

  const attendancePercentage =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const openViewModal = (record: AttendanceRecord) => {
    setOpenMenuId(null);
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setOpenMenuId(null);
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const updateStatus = (status: AttendanceStatus) => {
    if (!selectedRecord) return;

    const nextCheckIn =
      status === "Present" || status === "Late"
        ? selectedRecord.checkIn || getCurrentTime()
        : "-";

    setRecords((current) =>
      current.map((record) =>
        record.id === selectedRecord.id
          ? { ...record, status, checkIn: nextCheckIn }
          : record
      )
    );

    setSelectedRecord((current) =>
      current
        ? { ...current, status, checkIn: nextCheckIn }
        : null
    );
    setShowEditModal(false);
    setOpenMenuId(null);
  };

  const markRecord = (record: AttendanceRecord, status: AttendanceStatus) => {
    setSelectedRecord(record);
    updateStatus(status);
  };

  const openMoreMenu = (
    e: MouseEvent<HTMLButtonElement>,
    recordId: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 170;
    const gap = 8;
    const padding = 12;

    let left = rect.right - menuWidth;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }
    if (top < padding) top = padding;

    setMenuPosition({ top, left });
    setOpenMenuId((current) => (current === recordId ? null : recordId));
  };

  const closeAll = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedRecord(null);
    setOpenMenuId(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <ClipboardCheck size={14} />
              ADMIN PORTAL
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Attendance
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage daily student attendance by batch and date.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Attendance Date
              </p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-0.5 border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Users size={20} />}
            value={totalStudents}
            title="Total Students"
            tone="navy"
          />
          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            value={presentCount}
            title="Present Today"
            tone="green"
          />
          <SummaryCard
            icon={<XCircle size={20} />}
            value={absentCount}
            title="Absent Today"
            tone="red"
          />
          <SummaryCard
            icon={<Clock3 size={20} />}
            value={attendancePercentage}
            title="Attendance %"
            suffix="%"
            tone="orange"
          />
        </div>

        {/* Main Card */}
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-xl">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name, ID, course or batch..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  {BATCHES.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "All" | AttendanceStatus)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="All">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex flex-wrap gap-x-7 gap-y-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <SmallStatus label="Present" value={presentCount} type="Present" />
            <SmallStatus label="Absent" value={absentCount} type="Absent" />
            <SmallStatus label="Late" value={lateCount} type="Late" />
            <SmallStatus label="Leave" value={leaveCount} type="Leave" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50">
                  <TableHeader>Student</TableHeader>
                  <TableHeader>Student ID</TableHeader>
                  <TableHeader>Course</TableHeader>
                  <TableHeader>Batch</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Check-in</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                          <CalendarDays size={29} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                          No attendance records
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          Attendance records will appear here once students and
                          batches are connected to the backend.
                        </p>
                        <div className="mt-5 rounded-lg border border-dashed border-orange-200 bg-orange-50/50 px-4 py-2.5 text-xs font-medium text-orange-700">
                          Backend attendance integration is pending
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xs font-bold text-white">
                            {record.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">
                            {record.studentName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{record.studentId}</TableCell>
                      <TableCell>{record.course}</TableCell>
                      <TableCell>{record.batch}</TableCell>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ActionButton
                            title="View attendance"
                            onClick={() => openViewModal(record)}
                          >
                            <Eye size={16} />
                          </ActionButton>
                          <ActionButton
                            title="Edit attendance"
                            onClick={() => openEditModal(record)}
                          >
                            <Pencil size={16} />
                          </ActionButton>
                          <ActionButton
                            title="More actions"
                            onClick={(e) => openMoreMenu(e, record.id)}
                          >
                            <MoreVertical size={16} />
                          </ActionButton>
                        </div>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Development note */}
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
          <span className="font-semibold">Development mode:</span> attendance
          data is currently stored in page state. Once the backend is connected,
          students, batches, dates and attendance records will be loaded from
          the database.
        </div>
      </div>

      {/* Floating Menu */}
      {openMenuId && (
        <div
          className="fixed z-[99999] w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {(() => {
            const record = records.find((item) => item.id === openMenuId);
            if (!record) return null;

            return (
              <>
                <MoreMenuItem
                  icon={<CheckCircle2 size={17} />}
                  label="Mark Present"
                  onClick={() => markRecord(record, "Present")}
                />
                <MoreMenuItem
                  icon={<XCircle size={17} />}
                  label="Mark Absent"
                  onClick={() => markRecord(record, "Absent")}
                />
                <MoreMenuItem
                  icon={<Clock3 size={17} />}
                  label="Mark Late"
                  onClick={() => markRecord(record, "Late")}
                />
              </>
            );
          })()}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <ModalOverlay onClose={closeAll}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Attendance Details"
              subtitle="Complete attendance information."
              onClose={closeAll}
            />

            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-lg font-bold text-white">
                  {selectedRecord.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-800">
                    {selectedRecord.studentName}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {selectedRecord.studentId}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Student Name" value={selectedRecord.studentName} />
                <DetailItem label="Student ID" value={selectedRecord.studentId} />
                <DetailItem label="Course" value={selectedRecord.course} />
                <DetailItem label="Batch" value={selectedRecord.batch} />
                <DetailItem label="Date" value={formatDate(selectedRecord.date)} />
                <DetailItem label="Check-in Time" value={selectedRecord.checkIn} />
                <DetailItem label="Status" value={selectedRecord.status} />
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRecord && (
        <ModalOverlay onClose={closeAll}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Update Attendance"
              subtitle={`Update attendance for ${selectedRecord.studentName}.`}
              onClose={closeAll}
            />

            <div className="p-5 sm:p-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Attendance Status
              </label>
              <select
                value={selectedRecord.status}
                onChange={(e) =>
                  setSelectedRecord((current) =>
                    current
                      ? {
                          ...current,
                          status: e.target.value as AttendanceStatus,
                        }
                      : current
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
              </select>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Student
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedRecord.studentName}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedRecord.studentId} · {selectedRecord.course}
                </p>
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus(selectedRecord.status)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                <Save size={17} />
                Save Changes
              </button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  value,
  title,
  suffix = "",
  tone,
}: {
  icon: ReactNode;
  value: number;
  title: string;
  suffix?: string;
  tone: "navy" | "green" | "red" | "orange";
}) {
  const styles = {
    navy: "bg-blue-50 text-[#173B67]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">
          {value}
          {suffix}
        </div>
        <div className="mt-0.5 text-sm text-slate-500">{title}</div>
      </div>
    </div>
  );
}

function SmallStatus({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: AttendanceStatus;
}) {
  const config = {
    Present: "bg-emerald-500",
    Absent: "bg-red-500",
    Late: "bg-amber-500",
    Leave: "bg-indigo-500",
  };

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className={`h-2.5 w-2.5 rounded-full ${config[type]}`} />
      <span>
        {label}:{" "}
        <strong className="font-bold text-slate-700">{value}</strong>
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config = {
    Present: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Absent: "bg-red-50 text-red-700 ring-red-100",
    Late: "bg-amber-50 text-amber-700 ring-amber-100",
    Leave: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${config[status]}`}
    >
      {status}
    </span>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">{children}</td>
  );
}

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
    >
      {children}
    </button>
  );
}

function MoreMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-700"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-600"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "Not set";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
