"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  IndianRupee,
  Users,
  Wallet,
} from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

type ReportType =
  | "overview"
  | "students"
  | "courses"
  | "attendance"
  | "payments"
  | "certificates"
  | "affiliates";

const REPORT_TYPES: { key: ReportType; label: string; icon: ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <BarChart3 size={17} /> },
  { key: "students", label: "Students", icon: <Users size={17} /> },
  { key: "courses", label: "Courses", icon: <BookOpen size={17} /> },
  { key: "attendance", label: "Attendance", icon: <CalendarDays size={17} /> },
  { key: "payments", label: "Payments & Revenue", icon: <IndianRupee size={17} /> },
  { key: "certificates", label: "Certificates", icon: <Award size={17} /> },
  { key: "affiliates", label: "Affiliate Marketing", icon: <Wallet size={17} /> },
];

const COURSE_NAMES = COURSE_OPTIONS.map((course) => course.title);

const reportData = {
  students: { total: 0, active: 0, inactive: 0, newThisPeriod: 0 },
  courses: { total: COURSE_NAMES.length, active: COURSE_NAMES.length, inactive: 0, enrollments: 0 },
  attendance: { totalRecords: 0, present: 0, absent: 0, late: 0, percentage: 0 },
  payments: { revenue: 0, paid: 0, pending: 0, transactions: 0 },
  certificates: { total: 0, issued: 0, pending: 0, revoked: 0 },
  affiliates: { total: 0, active: 0, referrals: 0, commission: 0 },
};

const DATE_RANGES = [
  ["today", "Today"],
  ["this-week", "This Week"],
  ["this-month", "This Month"],
  ["last-month", "Last Month"],
  ["this-year", "This Year"],
  ["all", "All Time"],
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [dateRange, setDateRange] = useState("this-month");
  const [courseFilter, setCourseFilter] = useState("all");
  const [showDateMenu, setShowDateMenu] = useState(false);

  const dateRangeLabel =
    DATE_RANGES.find(([value]) => value === dateRange)?.[1] ?? "This Month";

  const handleExport = () => {
    alert("Report export will be connected to the backend reporting service.");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500">
              <BarChart3 size={15} />
              Business Intelligence
            </div>
            <h1 className="text-2xl font-bold text-[#173B67] sm:text-3xl">
              Reports & Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor platform performance, student activity and business metrics.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <BarChart3 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Development mode</p>
            <p className="mt-0.5 text-blue-700">
              Report metrics are currently zero or based on the configured course
              catalogue. Live analytics will be connected to the backend/database later.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays size={18} />
            Date Range
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDateMenu((current) => !current)}
              className="flex h-11 min-w-[175px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-orange-300"
            >
              {dateRangeLabel}
              <ChevronDown size={16} />
            </button>

            {showDateMenu && (
              <div className="absolute left-0 top-12 z-50 w-[175px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {DATE_RANGES.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setDateRange(value);
                      setShowDateMenu(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                      dateRange === value
                        ? "bg-blue-50 font-semibold text-[#173B67]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="h-11 min-w-[210px] rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All Courses</option>
            {COURSE_NAMES.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <div className="sm:ml-auto text-sm text-slate-500">
            Showing: <strong className="text-slate-700">{dateRangeLabel}</strong>
            {courseFilter !== "all" && (
              <>
                {" "}·{" "}
                <strong className="text-slate-700">{courseFilter}</strong>
              </>
            )}
          </div>
        </div>

        {/* Report navigation */}
        <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {REPORT_TYPES.map((report) => (
            <button
              key={report.key}
              onClick={() => setReportType(report.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                reportType === report.key
                  ? "bg-[#173B67] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#173B67]"
              }`}
            >
              {report.icon}
              {report.label}
            </button>
          ))}
        </div>

        {reportType === "overview" && <OverviewReport />}
        {reportType === "students" && <StudentsReport />}
        {reportType === "courses" && <CoursesReport />}
        {reportType === "attendance" && <AttendanceReport />}
        {reportType === "payments" && <PaymentsReport />}
        {reportType === "certificates" && <CertificatesReport />}
        {reportType === "affiliates" && <AffiliateReport />}
      </div>
    </div>
  );
}

function OverviewReport() {
  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Students" value={reportData.students.total} icon={<Users size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Active Courses" value={reportData.courses.active} icon={<BookOpen size={20} />} iconClass="bg-violet-50 text-violet-600" />
        <SummaryCard title="Attendance" value={`${reportData.attendance.percentage}%`} icon={<CalendarDays size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Revenue" value={`₹${reportData.payments.revenue.toLocaleString("en-IN")}`} icon={<IndianRupee size={20} />} iconClass="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportPanel title="Student Overview">
          <MetricRow label="Total Students" value={reportData.students.total} />
          <MetricRow label="Active Students" value={reportData.students.active} />
          <MetricRow label="Inactive Students" value={reportData.students.inactive} />
          <MetricRow label="New This Period" value={reportData.students.newThisPeriod} />
        </ReportPanel>
        <ReportPanel title="Course Overview">
          <MetricRow label="Total Courses" value={reportData.courses.total} />
          <MetricRow label="Active Courses" value={reportData.courses.active} />
          <MetricRow label="Inactive Courses" value={reportData.courses.inactive} />
          <MetricRow label="Total Enrollments" value={reportData.courses.enrollments} />
        </ReportPanel>
        <ReportPanel title="Attendance Overview">
          <MetricRow label="Attendance Records" value={reportData.attendance.totalRecords} />
          <MetricRow label="Present" value={reportData.attendance.present} />
          <MetricRow label="Absent" value={reportData.attendance.absent} />
          <MetricRow label="Late" value={reportData.attendance.late} />
        </ReportPanel>
        <ReportPanel title="Certificate Overview">
          <MetricRow label="Total Certificates" value={reportData.certificates.total} />
          <MetricRow label="Issued" value={reportData.certificates.issued} />
          <MetricRow label="Pending" value={reportData.certificates.pending} />
          <MetricRow label="Revoked" value={reportData.certificates.revoked} />
        </ReportPanel>
      </div>
    </>
  );
}

function StudentsReport() {
  return (
    <ReportSection title="Student Report">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Students" value={0} icon={<Users size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Active" value={0} icon={<CheckCircle2 size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Inactive" value={0} icon={<Users size={20} />} iconClass="bg-slate-100 text-slate-600" />
        <SummaryCard title="New This Period" value={0} icon={<Users size={20} />} iconClass="bg-amber-50 text-amber-600" />
      </div>
    </ReportSection>
  );
}

function CoursesReport() {
  return (
    <ReportSection title="Course Report">
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Courses" value={reportData.courses.total} icon={<BookOpen size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Active Courses" value={reportData.courses.active} icon={<CheckCircle2 size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Inactive Courses" value={0} icon={<BookOpen size={20} />} iconClass="bg-slate-100 text-slate-600" />
        <SummaryCard title="Enrollments" value={0} icon={<Users size={20} />} iconClass="bg-violet-50 text-violet-600" />
      </div>
      <EmptyReportState icon={<BookOpen size={30} />} title="Course analytics will appear here" description="Once student enrollments and course activity are connected to the database, course performance will be calculated automatically." />
    </ReportSection>
  );
}

function AttendanceReport() {
  return (
    <ReportSection title="Attendance Report">
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Attendance" value="0%" icon={<CalendarDays size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Present" value={0} icon={<CheckCircle2 size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Absent" value={0} icon={<CalendarDays size={20} />} iconClass="bg-red-50 text-red-600" />
        <SummaryCard title="Late" value={0} icon={<CalendarDays size={20} />} iconClass="bg-amber-50 text-amber-600" />
      </div>
      <EmptyReportState icon={<CalendarDays size={30} />} title="Attendance analytics will appear here" description="Attendance percentages and trends will be calculated automatically from attendance records." />
    </ReportSection>
  );
}

function PaymentsReport() {
  return (
    <ReportSection title="Payments & Revenue Report">
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyCard title="Total Revenue" value={0} icon={<IndianRupee size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <MoneyCard title="Paid" value={0} icon={<CheckCircle2 size={20} />} iconClass="bg-green-50 text-green-600" />
        <MoneyCard title="Pending" value={0} icon={<Wallet size={20} />} iconClass="bg-amber-50 text-amber-600" />
        <SummaryCard title="Transactions" value={0} icon={<FileText size={20} />} iconClass="bg-violet-50 text-violet-600" />
      </div>
      <EmptyReportState icon={<IndianRupee size={30} />} title="Revenue analytics will appear here" description="Payment transactions, revenue trends, pending amounts and payment-method breakdowns will be calculated automatically." />
    </ReportSection>
  );
}

function CertificatesReport() {
  return (
    <ReportSection title="Certificate Report">
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total" value={0} icon={<Award size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Issued" value={0} icon={<CheckCircle2 size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Pending" value={0} icon={<FileText size={20} />} iconClass="bg-amber-50 text-amber-600" />
        <SummaryCard title="Revoked" value={0} icon={<Award size={20} />} iconClass="bg-red-50 text-red-600" />
      </div>
      <EmptyReportState icon={<Award size={30} />} title="Certificate analytics will appear here" description="Certificate issuance and completion statistics will update automatically as students complete courses." />
    </ReportSection>
  );
}

function AffiliateReport() {
  return (
    <ReportSection title="Affiliate Marketing Report">
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Affiliates" value={0} icon={<Users size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Active Affiliates" value={0} icon={<CheckCircle2 size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Referrals" value={0} icon={<Users size={20} />} iconClass="bg-violet-50 text-violet-600" />
        <MoneyCard title="Commission" value={0} icon={<IndianRupee size={20} />} iconClass="bg-amber-50 text-amber-600" />
      </div>
      <EmptyReportState icon={<Wallet size={30} />} title="Affiliate analytics will appear here" description="Referral activity and commission information will be calculated automatically from the affiliate system." />
    </ReportSection>
  );
}

function SummaryCard({ title, value, icon, iconClass }: { title: string; value: string | number; icon: ReactNode; iconClass: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function MoneyCard({ title, value, icon, iconClass }: { title: string; value: number; icon: ReactNode; iconClass: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-xl font-bold text-slate-800">₹{value.toLocaleString("en-IN")}</p>
      </div>
    </div>
  );
}

function ReportPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-3 text-base font-bold text-[#173B67]">{title}</h3>
      {children}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="text-sm text-slate-800">{value}</strong>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-bold text-[#173B67]">{title}</h2>
      {children}
    </section>
  );
}

function EmptyReportState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-[270px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#173B67]">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
