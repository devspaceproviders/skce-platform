"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import type { ReactNode } from "react";

import {

  Activity,

  Award,

  BarChart3,

  BookOpen,

  CalendarDays,

  CheckCircle2,

  Clock3,

  ChevronDown,

  Download,

  FileText,

  IndianRupee,

  TrendingUp,

  UserCheck,

  Users,

} from "lucide-react";

type ReportType =

  | "overview"

  | "students"

  | "courses"

  | "trainers"

  | "payments";

type ReportRange =

  | "today"

  | "this-week"

  | "this-month"

  | "last-month"

  | "this-year"

  | "all";

type ReportData = {

  range: ReportRange;

  courseId: string | null;

  packageId: string | null;

  generatedAt: string;

  students: {

    total: number;

    active: number;

    inactive: number;

    newThisPeriod: number;

  };

  courses: {

    total: number;

    active: number;

    inactive: number;

    enrollments: number;

    rows: Array<{

      id: string;

      title: string;

      isActive: boolean;

      mode: string;

      enrollments: number;

    }>;

  };

  trainers: {

    total: number;

    active: number;

    inactive: number;

    withPermissions: number;

    withAvailability: number;

    totalAssignments: number;

    rows: Array<{

      id: string;

      name: string;

      email: string;

      isActive: boolean;

      specialization: string;

      qualification: string;

      experience: number | null;

      assignedCourses: number;

      totalCoursePermissions: number;

      availabilitySlots: number;

      hasAvailability: boolean;

    }>;

  };

  payments: {

    revenue: number;

    paid: number;

    pending: number;

    failed: number;

    refunded: number;

    transactions: number;

  };

  certificates: {

    total: number;

    issued: number;

  };

  enrollments: {

    total: number;

    active: number;

    completed: number;

    pending: number;

    cancelled: number;

  };

  analytics: {
    trend: Array<{ label: string; students: number; enrollments: number; revenue: number; certificates: number }>;
    paymentStatus: Array<{ label: string; value: number; status: string }>;
    coursePerformance: Array<{ id: string; title: string; enrollments: number; revenue: number }>;
    recentActivity: Array<{ type: string; label: string; date: string; amount: number | null }>;
  };

};

const API_URL =

  process.env.NEXT_PUBLIC_API_URL || "http\://localhost:5000/api";

const DATE_RANGES: Array<[ReportRange, string]> = [

  ["today", "Today"],

  ["this-week", "This Week"],

  ["this-month", "This Month"],

  ["last-month", "Last Month"],

  ["this-year", "This Year"],

  ["all", "All Time"],

];

const REPORT_TYPES: Array<{

  key: ReportType;

  label: string;

  icon: ReactNode;

}> = [

  { key: "overview", label: "Overview", icon: <BarChart3 size={17} /> },

  { key: "students", label: "Students", icon: <Users size={17} /> },

  { key: "courses", label: "Courses", icon: <BookOpen size={17} /> },

  { key: "trainers", label: "Trainers", icon: <UserCheck size={17} /> },

  {

    key: "payments",

    label: "Payments & Revenue",

    icon: <IndianRupee size={17} />,

  },

];

function getToken() {

  if (typeof window === "undefined") return null;

  return (

    localStorage.getItem("token") ||

    localStorage.getItem("accessToken") ||

    sessionStorage.getItem("token") ||

    sessionStorage.getItem("accessToken")

  );

}

async function authenticatedFetch(url: string) {

  const token = getToken();

  return fetch(url, {

    headers: token

      ? {

          Authorization: `Bearer ${token}`,

        }

      : {},

    cache: "no-store",

  });

}

function normalizeReportData(data: any): ReportData {
  const overview = data?.overview ?? {};
  const students = data?.students ?? {};
  const courses = data?.courses ?? {};
  const trainers = data?.trainers ?? {};
  const payments = data?.payments ?? {};
  const certificates = data?.certificates ?? {};
  const enrollments = data?.enrollments ?? {};
  const courseRows = Array.isArray(courses.rows) ? courses.rows : [];
  const trainerRows = Array.isArray(trainers.rows) ? trainers.rows : [];
  const enrollmentRows = Array.isArray(enrollments.rows) ? enrollments.rows : [];
  const paymentStatusCounts = payments.statusCounts ?? {};
  const normalizedCourseRows: ReportData["courses"]["rows"] = courseRows.map((course: any) => ({
    id: String(course.id),
    title: String(course.title ?? course.name ?? "Untitled Course"),
    isActive: Boolean(course.isActive),
    mode: String(course.mode ?? "—"),
    enrollments: Number(course.enrollmentCount ?? course.enrollments ?? 0),
  }));
  const normalizedTrainerRows: Array<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    specialization: string;
    qualification: string;
    experience: number | null;
    assignedCourses: number;
    totalCoursePermissions: number;
    availabilitySlots: number;
    hasAvailability: boolean;
  }> = trainerRows.map((trainer: any) => {
    const assignedCourses = Array.isArray(trainer.assignedCourses)
      ? trainer.assignedCourses.length
      : Number(trainer.assignedCourses ?? 0);
    const availabilitySlots = Number(trainer.availabilityCount ?? trainer.availabilitySlots ?? 0);
    return {
      id: String(trainer.id),
      name: String(trainer.name ?? "Unnamed Trainer"),
      email: String(trainer.email ?? ""),
      isActive: Boolean(trainer.isActive),
      specialization: String(trainer.specialization ?? ""),
      qualification: String(trainer.qualification ?? ""),
      experience: trainer.experience == null ? null : Number(trainer.experience),
      assignedCourses,
      totalCoursePermissions: Number(trainer.totalCoursePermissions ?? assignedCourses),
      availabilitySlots,
      hasAvailability: availabilitySlots > 0,
    };
  });
  const activeTrainers = normalizedTrainerRows.filter((trainer) => trainer.isActive).length;
  const activeCourses = normalizedCourseRows.filter((course) => course.isActive).length;
  const enrollmentStatus = (row: any) => String(row.status ?? "").toUpperCase();
  return {
    range: (data?.range ?? "this-month") as ReportRange,
    courseId: data?.courseId == null ? null : String(data.courseId),
    packageId: data?.packageId == null ? null : String(data.packageId),
    generatedAt: new Date().toISOString(),
    students: {
      total: Number(overview.totalStudents ?? students.total ?? 0),
      active: Number(overview.activeStudents ?? 0),
      inactive: Math.max(0, Number(overview.totalStudents ?? students.total ?? 0) - Number(overview.activeStudents ?? 0)),
      newThisPeriod: Number(overview.newStudents ?? students.total ?? 0),
    },
    courses: {
      total: normalizedCourseRows.length,
      active: activeCourses,
      inactive: normalizedCourseRows.length - activeCourses,
      enrollments: normalizedCourseRows.reduce((total, course) => total + course.enrollments, 0),
      rows: normalizedCourseRows,
    },
    trainers: {
      total: normalizedTrainerRows.length,
      active: activeTrainers,
      inactive: normalizedTrainerRows.length - activeTrainers,
      withPermissions: normalizedTrainerRows.filter((trainer) => trainer.totalCoursePermissions > 0).length,
      withAvailability: normalizedTrainerRows.filter((trainer) => trainer.hasAvailability).length,
      totalAssignments: normalizedTrainerRows.reduce((total, trainer) => total + trainer.assignedCourses, 0),
      rows: normalizedTrainerRows,
    },
    payments: {
      revenue: Number(payments.revenue ?? 0),
      paid: Number(paymentStatusCounts.SUCCESS ?? 0),
      pending: Number(paymentStatusCounts.PENDING ?? 0) + Number(paymentStatusCounts.CREATED ?? 0),
      failed: Number(paymentStatusCounts.FAILED ?? 0),
      refunded: Number(paymentStatusCounts.REFUNDED ?? 0),
      transactions: Number(payments.total ?? 0),
    },
    certificates: {
      total: Number(certificates.total ?? 0),
      issued: Number(certificates.total ?? overview.certificatesIssued ?? 0),
    },
    enrollments: {
      total: Number(enrollments.total ?? enrollmentRows.length),
      active: enrollmentRows.filter((row: any) => ["ACTIVE", "ENROLLED"].includes(enrollmentStatus(row))).length,
      completed: enrollmentRows.filter((row: any) => enrollmentStatus(row) === "COMPLETED").length,
      pending: enrollmentRows.filter((row: any) => enrollmentStatus(row) === "PENDING").length,
      cancelled: enrollmentRows.filter((row: any) => enrollmentStatus(row) === "CANCELLED").length,
    },
    analytics: {
      trend: Array.isArray(data?.analytics?.trend) ? data.analytics.trend.map((row: any) => ({ label: String(row.label ?? ""), students: Number(row.students ?? 0), enrollments: Number(row.enrollments ?? 0), revenue: Number(row.revenue ?? 0), certificates: Number(row.certificates ?? 0) })) : [],
      paymentStatus: Array.isArray(data?.analytics?.paymentStatus) ? data.analytics.paymentStatus.map((row: any) => ({ label: String(row.label ?? ""), value: Number(row.value ?? 0), status: String(row.status ?? "") })) : [],
      coursePerformance: Array.isArray(data?.analytics?.coursePerformance) ? data.analytics.coursePerformance.map((row: any) => ({ id: String(row.id), title: String(row.title ?? "Untitled Course"), enrollments: Number(row.enrollments ?? 0), revenue: Number(row.revenue ?? 0) })) : [],
      recentActivity: Array.isArray(data?.analytics?.recentActivity) ? data.analytics.recentActivity.map((row: any) => ({ type: String(row.type ?? "Activity"), label: String(row.label ?? "Activity"), date: String(row.date ?? ""), amount: row.amount == null ? null : Number(row.amount) })) : [],
    },
  };
}

function emptyReportData(): ReportData {

  return {

    range: "this-month",

    courseId: null,

    packageId: null,

    generatedAt: "",

    students: {

      total: 0,

      active: 0,

      inactive: 0,

      newThisPeriod: 0,

    },

    courses: {

      total: 0,

      active: 0,

      inactive: 0,

      enrollments: 0,

      rows: [],

    },

    trainers: {

      total: 0,

      active: 0,

      inactive: 0,

      withPermissions: 0,

      withAvailability: 0,

      totalAssignments: 0,

      rows: [],

    },

    payments: {

      revenue: 0,

      paid: 0,

      pending: 0,

      failed: 0,

      refunded: 0,

      transactions: 0,

    },

    certificates: {

      total: 0,

      issued: 0,

    },

    enrollments: {

      total: 0,

      active: 0,

      completed: 0,

      pending: 0,

      cancelled: 0,

    },

    analytics: { trend: [], paymentStatus: [], coursePerformance: [], recentActivity: [] },
  };

}

export default function ReportsPage() {

  const [reportType, setReportType] =

    useState<ReportType>("overview");

  const [dateRange, setDateRange] =

    useState<ReportRange>("this-month");

  const [courseFilter, setCourseFilter] = useState("all");

  const [packageFilter, setPackageFilter] = useState("all");

  const [showDateMenu, setShowDateMenu] = useState(false);

  const [courses, setCourses] = useState<

    Array<{ id: string; title: string; isActive: boolean }>

  >([]);

  const [packages, setPackages] = useState<

    Array<{ id: string; title: string; isActive: boolean; price: number }>

  >([]);

  const [reportData, setReportData] =

    useState<ReportData>(emptyReportData);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const dateRangeLabel =

    DATE_RANGES.find(([value]) => value === dateRange)?.[1] ??

    "This Month";

  useEffect(() => {

    const loadFilters = async () => {

      try {

        const [coursesResponse, packagesResponse] = await Promise.all([

          authenticatedFetch(`${API_URL}/admin/courses`),

          authenticatedFetch(`${API_URL}/admin/packages`),

        ]);

        if (coursesResponse.ok) {

          const json = await coursesResponse.json();

          const rows = Array.isArray(json.data) ? json.data : [];

          setCourses(

            rows.map((course: any) => ({

              id: String(course.id),

              title: String(course.title ?? "Untitled Course"),

              isActive: Boolean(course.isActive),

            }))

          );

        }

        if (packagesResponse.ok) {

          const json = await packagesResponse.json();

          const rows = Array.isArray(json.data) ? json.data : [];

          setPackages(

            rows.map((item: any) => ({

              id: String(item.id),

              title: String(item.title ?? "Untitled Package"),

              isActive: Boolean(item.isActive),

              price: Number(item.price ?? 0),

            }))

          );

        }

      } catch (err) {

        console.error(err);

      }

    };

    loadFilters();

  }, []);

  useEffect(() => {

    let cancelled = false;

    const loadReport = async () => {

      setLoading(true);

      setError("");

      try {

        const params = new URLSearchParams();

        params.set("range", dateRange);

        if (courseFilter !== "all") {

          params.set("courseId", courseFilter);

        }

        if (packageFilter !== "all") {

          params.set("packageId", packageFilter);

        }

        const response = await authenticatedFetch(

          `${API_URL}/admin/reports?${params.toString()}`

        );

        if (!response.ok) {

          const json = await response.json().catch(() => null);

          throw new Error(

            json?.message || "Unable to load reports"

          );

        }

        const json = await response.json();

        if (!cancelled) {

          setReportData(

            json?.data

              ? normalizeReportData(json.data)

              : emptyReportData()

          );

        }

      } catch (err) {

        if (!cancelled) {

          setError(

            err instanceof Error

              ? err.message

              : "Unable to load reports"

          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    };

    loadReport();

    return () => {

      cancelled = true;

    };

  }, [dateRange, courseFilter, packageFilter]);

  const selectedCourseLabel = useMemo(() => {

    if (courseFilter === "all") return "All Courses";

    return (

      courses.find(

        (course) => String(course.id) === courseFilter

      )?.title || "Selected Course"

    );

  }, [courseFilter, courses]);

  const selectedPackageLabel = useMemo(() => {

    if (packageFilter === "all") return "All Packages";

    return (

      packages.find(

        (item) => String(item.id) === packageFilter

      )?.title || "Selected Package"

    );

  }, [packageFilter, packages]);

  const handleExport = () => {

    const rows: string[][] = [

      ["SKCE Reports & Analytics"],

      ["Generated At", new Date().toLocaleString("en-IN")],

      ["Date Range", dateRangeLabel],

      ["Course", selectedCourseLabel],

      ["Package", selectedPackageLabel],

      [],

      ["Overview"],

      ["Metric", "Value"],

      ["Total Students", String(reportData.students.total)],

      ["Active Students", String(reportData.students.active)],

      ["New Students This Period", String(reportData.students.newThisPeriod)],

      ["Total Courses", String(reportData.courses.total)],

      ["Active Courses", String(reportData.courses.active)],

      ["Total Enrollments", String(reportData.enrollments.total)],

      ["Active Trainers", String(reportData.trainers.active)],

      ["Revenue", `₹${reportData.payments.revenue.toLocaleString("en-IN")}`],

      ["Successful Payments", String(reportData.payments.paid)],

      ["Pending Payments", String(reportData.payments.pending)],

      ["Failed Payments", String(reportData.payments.failed)],

      ["Refunded Payments", String(reportData.payments.refunded)],

      ["Certificates Issued", String(reportData.certificates.issued)],

      [],

      ["Course Performance"],

      ["Course", "Enrollments", "Revenue"],

      ...reportData.analytics.coursePerformance.map((item) => [

        item.title,

        String(item.enrollments),

        `₹${item.revenue.toLocaleString("en-IN")}`,

      ]),

      [],

      ["Activity Trend"],

      ["Period", "Students", "Enrollments", "Revenue", "Certificates"],

      ...reportData.analytics.trend.map((item) => [

        item.label,

        String(item.students),

        String(item.enrollments),

        `₹${item.revenue.toLocaleString("en-IN")}`,

        String(item.certificates),

      ]),

      [],

      ["Recent Activity"],

      ["Type", "Activity", "Date", "Amount"],

      ...reportData.analytics.recentActivity.map((item) => [

        item.type,

        item.label,

        item.date,

        item.amount == null ? "" : `₹${item.amount.toLocaleString("en-IN")}`,

      ]),

    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const filename = `skce-report-${dateRange}${packageFilter !== "all" ? `-package-${packageFilter}` : ""}${courseFilter !== "all" ? `-course-${courseFilter}` : ""}.xlsx`;

    XLSX.writeFile(workbook, filename);

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

            disabled={loading}

            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"

          >

            <Download size={18} />

            Export Excel

          </button>

        </div>

        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}

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

            onChange={(event) =>

              setCourseFilter(event.target.value)

            }

            className="h-11 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"

          >

            <option value="all">All Courses</option>

            {courses.map((course) => (

              <option key={course.id} value={course.id}>

                {course.title}

              </option>

            ))}

          </select>

          <select

            value={packageFilter}

            onChange={(event) =>

              setPackageFilter(event.target.value)

            }

            className="h-11 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"

          >

            <option value="all">All Packages</option>

            {packages.map((item) => (

              <option key={item.id} value={item.id}>

                {item.title}

              </option>

            ))}

          </select>

          <div className="sm:ml-auto text-sm text-slate-500">

            Showing:{" "}

            <strong className="text-slate-700">

              {dateRangeLabel}

            </strong>

            {" · "}

            <strong className="text-slate-700">

              {selectedCourseLabel}

            </strong>

            {" · "}

            <strong className="text-slate-700">

              {selectedPackageLabel}

            </strong>

          </div>

        </div>

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

        {loading ? (

          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="text-sm text-slate-500">

              Loading report data...

            </div>

          </div>

        ) : (

          <>

            {reportType === "overview" && (

              <OverviewReport data={reportData} />

            )}

            {reportType === "students" && (

              <StudentsReport data={reportData} />

            )}

            {reportType === "courses" && (

              <CoursesReport data={reportData} />

            )}

            {reportType === "trainers" && (

              <TrainersReport data={reportData} />

            )}

            {reportType === "payments" && (

              <PaymentsReport data={reportData} />

            )}

          </>

        )}

      </div>

    </div>

  );

}

function OverviewReport({ data }: { data: ReportData }) {
  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Students" value={data.students.total} icon={<Users size={20} />} iconClass="bg-blue-50 text-blue-600" />
        <SummaryCard title="Active Courses" value={data.courses.active} icon={<BookOpen size={20} />} iconClass="bg-violet-50 text-violet-600" />
        <SummaryCard title="Active Trainers" value={data.trainers.active} icon={<UserCheck size={20} />} iconClass="bg-green-50 text-green-600" />
        <SummaryCard title="Revenue" value={`₹${data.payments.revenue.toLocaleString("en-IN")}`} icon={<IndianRupee size={20} />} iconClass="bg-amber-50 text-amber-600" />
      </div>
      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TrendPanel title="Student & Enrollment Activity" subtitle="Activity across the selected period" icon={<TrendingUp size={18} />}><TrendChart data={data.analytics.trend} /></TrendPanel>
        <TrendPanel title="Revenue Trend" subtitle="Successful payments only" icon={<IndianRupee size={18} />}><RevenueChart data={data.analytics.trend} /></TrendPanel>
      </div>
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TrendPanel title="Course Performance" subtitle="Enrollments by course" icon={<BookOpen size={18} />}><CoursePerformance data={data.analytics.coursePerformance} /></TrendPanel>
        <TrendPanel title="Payment Status" subtitle="Transactions in selected period" icon={<IndianRupee size={18} />}><PaymentStatusChart data={data.analytics.paymentStatus} /></TrendPanel>
        <TrendPanel title="Certificates" subtitle="Issued in selected period" icon={<Award size={18} />}><div className="flex h-[245px] flex-col items-center justify-center"><div className="flex h-28 w-28 items-center justify-center rounded-full bg-amber-50 text-amber-600"><div className="text-center"><p className="text-3xl font-bold">{data.certificates.total}</p><p className="text-[11px] font-semibold uppercase tracking-wide">Issued</p></div></div><div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 size={16} className="text-green-600" />Total issued: <strong className="text-slate-700">{data.certificates.issued}</strong></div></div></TrendPanel>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportPanel title="Platform Overview"><MetricRow label="Total Students" value={data.students.total} /><MetricRow label="New Students This Period" value={data.students.newThisPeriod} /><MetricRow label="Active Courses" value={data.courses.active} /><MetricRow label="Total Enrollments" value={data.enrollments.total} /><MetricRow label="Active Trainers" value={data.trainers.active} /></ReportPanel>
        <RecentActivity activities={data.analytics.recentActivity} />
      </div>
    </>
  );
}

function TrendPanel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-base font-bold text-[#173B67]">{icon}{title}</h3><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div><Activity size={17} className="text-slate-300" /></div>{children}</div>;
}

function TrendChart({ data }: { data: ReportData["analytics"]["trend"] }) {
  if (!data.length) return <EmptyState message="No activity is available for this period." />;
  const width = 700, height = 250, padX = 34, padY = 24;
  const maxValue = Math.max(1, ...data.map((item) => Math.max(item.students, item.enrollments)));
  const points = (key: "students" | "enrollments") => data.map((item, index) => { const x = padX + (index * (width - padX * 2)) / Math.max(1, data.length - 1); const y = height - padY - (item[key] / maxValue) * (height - padY * 2); return `${x},${y}`; }).join(" ");
  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  return <div><div className="mb-3 flex items-center gap-5 text-xs font-medium text-slate-500"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#173B67]" />Students</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />Enrollments</span></div><svg viewBox={`0 0 ${width} ${height}`} className="h-[245px] w-full" role="img" aria-label="Student and enrollment activity chart">{[0,1,2,3].map((line) => { const y = padY + (line * (height - padY * 2)) / 3; return <line key={line} x1={padX} x2={width-padX} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />; })}<polyline fill="none" stroke="#173B67" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points("students")} /><polyline fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points("enrollments")} />{data.map((item,index) => { if (index % labelStep !== 0 && index !== data.length-1) return null; const x=padX+(index*(width-padX*2))/Math.max(1,data.length-1); return <text key={item.label+index} x={x} y={height-5} textAnchor="middle" className="fill-slate-400 text-[10px]">{item.label}</text>; })}</svg></div>;
}

function RevenueChart({ data }: { data: ReportData["analytics"]["trend"] }) {
  if (!data.length) return <EmptyState message="No revenue activity is available for this period." />;
  const maxValue=Math.max(1,...data.map((item)=>item.revenue)); const labelStep=Math.max(1,Math.ceil(data.length/7));
  return <div className="h-[290px]"><div className="flex h-[245px] items-end gap-1.5 px-1 sm:gap-2">{data.map((item,index)=>{ const barHeight=item.revenue===0?3:Math.max(8,(item.revenue/maxValue)*205); return <div key={item.label+index} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex justify-center"><div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg bg-[#173B67] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg group-hover:block">₹{item.revenue.toLocaleString("en-IN")}</div><div className="w-full max-w-[30px] rounded-t-md bg-orange-500 transition-all duration-300 group-hover:bg-[#173B67]" style={{height:barHeight}} /></div>{index%labelStep===0||index===data.length-1?<span className="mt-2 truncate text-center text-[10px] text-slate-400">{item.label}</span>:<span className="mt-2 text-center text-[10px] text-transparent">.</span>}</div>; })}</div></div>;
}

function CoursePerformance({ data }: { data: ReportData["analytics"]["coursePerformance"] }) {
  if (!data.length) return <EmptyState message="No course enrollment data for this period." />; const max=Math.max(1,...data.map((item)=>item.enrollments));
  return <div className="space-y-4 py-2">{data.map((item)=><div key={item.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-700">{item.title}</span><span className="shrink-0 font-bold text-[#173B67]">{item.enrollments}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#173B67] transition-all duration-500" style={{width:`${Math.max(2,(item.enrollments/max)*100)}%`}} /></div><div className="mt-1 text-[11px] text-slate-400">₹{item.revenue.toLocaleString("en-IN")} revenue</div></div>)}</div>;
}

function PaymentStatusChart({ data }: { data: ReportData["analytics"]["paymentStatus"] }) {
  const total=data.reduce((sum,item)=>sum+item.value,0); if(!total) return <EmptyState message="No payment transactions for this period." />; const paid=data.find((item)=>item.status==="SUCCESS")?.value??0; const pending=data.find((item)=>item.status==="PENDING")?.value??0; const failed=data.find((item)=>item.status==="FAILED")?.value??0; const refunded=data.find((item)=>item.status==="REFUNDED")?.value??0; const paidEnd=paid/total*100; const pendingEnd=(paid+pending)/total*100; const failedEnd=(paid+pending+failed)/total*100;
  return <div className="flex min-h-[245px] items-center gap-5"><div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{background:`conic-gradient(#16a34a 0 ${paidEnd}%, #f59e0b ${paidEnd}% ${pendingEnd}%, #ef4444 ${pendingEnd}% ${failedEnd}%, #94a3b8 ${failedEnd}% 100%)`}}><div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center"><div><p className="text-2xl font-bold text-[#173B67]">{total}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">Transactions</p></div></div></div><div className="min-w-0 flex-1 space-y-3"><StatusLegend label="Paid" value={paid} className="bg-green-500" /><StatusLegend label="Pending" value={pending} className="bg-amber-500" /><StatusLegend label="Failed" value={failed} className="bg-red-500" /><StatusLegend label="Refunded" value={refunded} className="bg-slate-400" /></div></div>;
}

function StatusLegend({ label, value, className }: { label: string; value: number; className: string }) { return <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-500"><span className={`h-2.5 w-2.5 rounded-full ${className}`} />{label}</span><strong className="text-slate-800">{value}</strong></div>; }

function RecentActivity({ activities }: { activities: ReportData["analytics"]["recentActivity"] }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-4"><h3 className="flex items-center gap-2 text-base font-bold text-[#173B67]"><Clock3 size={18} />Recent Activity</h3><p className="mt-1 text-xs text-slate-400">Latest activity from the selected period</p></div>{activities.length===0?<EmptyState message="No recent activity for this period." />:<div className="divide-y divide-slate-100">{activities.map((activity,index)=><div key={`${activity.type}-${activity.date}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activity.type==="Payment"?"bg-green-50 text-green-600":activity.type==="Certificate"?"bg-amber-50 text-amber-600":"bg-blue-50 text-blue-600"}`}>{activity.type==="Payment"?<IndianRupee size={16}/>:activity.type==="Certificate"?<Award size={16}/>:<Users size={16}/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{activity.label}</p><p className="text-xs text-slate-400">{new Date(activity.date).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div>{activity.amount!=null&&<span className="shrink-0 text-sm font-semibold text-green-700">₹{activity.amount.toLocaleString("en-IN")}</span>}</div>)}</div>}</div>;
}

function StudentsReport({ data }: { data: ReportData }) {

  return (

    <ReportSection title="Student Report">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard

          title="Total Students"

          value={data.students.total}

          icon={<Users size={20} />}

          iconClass="bg-blue-50 text-blue-600"

        />

        <SummaryCard

          title="Active"

          value={data.students.active}

          icon={<CheckCircle2 size={20} />}

          iconClass="bg-green-50 text-green-600"

        />

        <SummaryCard

          title="Inactive"

          value={data.students.inactive}

          icon={<Users size={20} />}

          iconClass="bg-slate-100 text-slate-600"

        />

        <SummaryCard

          title="New This Period"

          value={data.students.newThisPeriod}

          icon={<Users size={20} />}

          iconClass="bg-amber-50 text-amber-600"

        />

      </div>

    </ReportSection>

  );

}

function CoursesReport({ data }: { data: ReportData }) {

  return (

    <ReportSection title="Course Report">

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard

          title="Total Courses"

          value={data.courses.total}

          icon={<BookOpen size={20} />}

          iconClass="bg-blue-50 text-blue-600"

        />

        <SummaryCard

          title="Active Courses"

          value={data.courses.active}

          icon={<CheckCircle2 size={20} />}

          iconClass="bg-green-50 text-green-600"

        />

        <SummaryCard

          title="Inactive Courses"

          value={data.courses.inactive}

          icon={<BookOpen size={20} />}

          iconClass="bg-slate-100 text-slate-600"

        />

        <SummaryCard

          title="Enrollments"

          value={data.courses.enrollments}

          icon={<Users size={20} />}

          iconClass="bg-violet-50 text-violet-600"

        />

      </div>

      <ReportPanel title="Course Performance">

        {data.courses.rows.length === 0 ? (

          <EmptyState message="No course data available for the selected filters." />

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left text-sm">

              <thead>

                <tr className="border-b border-slate-200 text-slate-500">

                  <th className="px-3 py-3 font-medium">Course</th>

                  <th className="px-3 py-3 font-medium">Status</th>

                  <th className="px-3 py-3 font-medium">Mode</th>

                  <th className="px-3 py-3 text-right font-medium">

                    Enrollments

                  </th>

                </tr>

              </thead>

              <tbody>

                {data.courses.rows.map((course) => (

                  <tr

                    key={course.id}

                    className="border-b border-slate-100 last:border-0"

                  >

                    <td className="px-3 py-4 font-medium text-slate-800">

                      {course.title}

                    </td>

                    <td className="px-3 py-4">

                      <StatusBadge active={course.isActive} />

                    </td>

                    <td className="px-3 py-4 text-slate-500">

                      {course.mode}

                    </td>

                    <td className="px-3 py-4 text-right font-semibold text-slate-800">

                      {course.enrollments}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </ReportPanel>

    </ReportSection>

  );

}

function TrainersReport({ data }: { data: ReportData }) {

  return (

    <ReportSection title="Trainer Report">

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard

          title="Total Trainers"

          value={data.trainers.total}

          icon={<Users size={20} />}

          iconClass="bg-blue-50 text-blue-600"

        />

        <SummaryCard

          title="Active Trainers"

          value={data.trainers.active}

          icon={<CheckCircle2 size={20} />}

          iconClass="bg-green-50 text-green-600"

        />

        <SummaryCard

          title="With Permissions"

          value={data.trainers.withPermissions}

          icon={<UserCheck size={20} />}

          iconClass="bg-violet-50 text-violet-600"

        />

        <SummaryCard

          title="With Availability"

          value={data.trainers.withAvailability}

          icon={<CalendarDays size={20} />}

          iconClass="bg-amber-50 text-amber-600"

        />

      </div>

      <ReportPanel title="Trainer Overview">

        <div className="mb-4">

          <MetricRow

            label="Total Course Assignments"

            value={data.trainers.totalAssignments}

          />

        </div>

        {data.trainers.rows.length === 0 ? (

          <EmptyState message="No trainers found." />

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left text-sm">

              <thead>

                <tr className="border-b border-slate-200 text-slate-500">

                  <th className="px-3 py-3 font-medium">Trainer</th>

                  <th className="px-3 py-3 font-medium">Status</th>

                  <th className="px-3 py-3 font-medium">Specialization</th>

                  <th className="px-3 py-3 text-center font-medium">

                    Assigned Courses

                  </th>

                  <th className="px-3 py-3 text-center font-medium">

                    Availability

                  </th>

                </tr>

              </thead>

              <tbody>

                {data.trainers.rows.map((trainer) => (

                  <tr

                    key={trainer.id}

                    className="border-b border-slate-100 last:border-0"

                  >

                    <td className="px-3 py-4">

                      <p className="font-semibold text-slate-800">

                        {trainer.name}

                      </p>

                      <p className="mt-1 text-xs text-slate-500">

                        {trainer.email}

                      </p>

                    </td>

                    <td className="px-3 py-4">

                      <StatusBadge active={trainer.isActive} />

                    </td>

                    <td className="px-3 py-4 text-slate-500">

                      {trainer.specialization || "—"}

                    </td>

                    <td className="px-3 py-4 text-center font-semibold text-slate-800">

                      {trainer.assignedCourses}

                    </td>

                    <td className="px-3 py-4 text-center">

                      {trainer.hasAvailability ? (

                        <span className="font-medium text-green-600">

                          Configured ({trainer.availabilitySlots})

                        </span>

                      ) : (

                        <span className="text-slate-400">

                          Not configured

                        </span>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </ReportPanel>

    </ReportSection>

  );

}

function PaymentsReport({ data }: { data: ReportData }) {

  return (

    <ReportSection title="Payments & Revenue Report">

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MoneyCard

          title="Total Revenue"

          value={data.payments.revenue}

          icon={<IndianRupee size={20} />}

          iconClass="bg-blue-50 text-blue-600"

        />

        <SummaryCard

          title="Paid"

          value={data.payments.paid}

          icon={<CheckCircle2 size={20} />}

          iconClass="bg-green-50 text-green-600"

        />

        <SummaryCard

          title="Pending"

          value={data.payments.pending}

          icon={<FileText size={20} />}

          iconClass="bg-amber-50 text-amber-600"

        />

        <SummaryCard

          title="Transactions"

          value={data.payments.transactions}

          icon={<FileText size={20} />}

          iconClass="bg-violet-50 text-violet-600"

        />

      </div>

      <ReportPanel title="Payment Status">

        <MetricRow label="Successful / Paid" value={data.payments.paid} />

        <MetricRow label="Pending / Created" value={data.payments.pending} />

        <MetricRow label="Failed" value={data.payments.failed} />

        <MetricRow label="Refunded" value={data.payments.refunded} />

      </ReportPanel>

    </ReportSection>

  );

}

function SummaryCard({

  title,

  value,

  icon,

  iconClass,

}: {

  title: string;

  value: string | number;

  icon: ReactNode;

  iconClass: string;

}) {

  return (

    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div

        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}

      >

        {icon}

      </div>

      <div>

        <p className="text-sm text-slate-500">{title}</p>

        <p className="mt-1 text-2xl font-bold text-slate-800">

          {value}

        </p>

      </div>

    </div>

  );

}

function MoneyCard({

  title,

  value,

  icon,

  iconClass,

}: {

  title: string;

  value: number;

  icon: ReactNode;

  iconClass: string;

}) {

  return (

    <SummaryCard

      title={title}

      value={`₹${value.toLocaleString("en-IN")}`}

      icon={icon}

      iconClass={iconClass}

    />

  );

}

function ReportPanel({

  title,

  children,

}: {

  title: string;

  children: ReactNode;

}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

      <h3 className="mb-3 text-base font-bold text-[#173B67]">

        {title}

      </h3>

      {children}

    </div>

  );

}

function MetricRow({

  label,

  value,

}: {

  label: string;

  value: string | number;

}) {

  return (

    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">

      <span className="text-sm text-slate-500">{label}</span>

      <strong className="text-sm text-slate-800">{value}</strong>

    </div>

  );

}

function ReportSection({

  title,

  children,

}: {

  title: string;

  children: ReactNode;

}) {

  return (

    <section>

      <h2 className="mb-5 text-xl font-bold text-[#173B67]">

        {title}

      </h2>

      {children}

    </section>

  );

}

function StatusBadge({ active }: { active: boolean }) {

  return (

    <span

      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${

        active

          ? "bg-green-50 text-green-700"

          : "bg-slate-100 text-slate-500"

      }`}

    >

      {active ? "Active" : "Inactive"}

    </span>

  );

}

function EmptyState({ message }: { message: string }) {

  return (

    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">

      {message}

    </div>

  );

}
