"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  GraduationCap,
  IndianRupee,
  Layers,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ReportData = {
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
    trend: Array<{
      label: string;
      students: number;
      enrollments: number;
      revenue: number;
      certificates: number;
    }>;
    recentActivity: Array<{
      type: string;
      label: string;
      date: string;
      amount: number | null;
    }>;
    coursePerformance: Array<{
      id: string;
      title: string;
      enrollments: number;
      revenue: number;
    }>;
  };
};

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}

async function loadAdminReport(): Promise<ReportData> {
  const token = getToken();

  if (!token) {
    throw new Error("Your admin session has expired. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/admin/reports?range=this-month`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const json = await response.json().catch(() => null);

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");

    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }

    throw new Error("Your admin session has expired. Please login again.");
  }

  if (!response.ok || !json?.success || !json?.data) {
    throw new Error(
      json?.message || "Unable to load admin dashboard data."
    );
  }

  const data = json.data;

  return {
    students: {
      total: Number(data?.students?.total ?? data?.overview?.totalStudents ?? 0),
      active: Number(data?.students?.active ?? data?.overview?.activeStudents ?? 0),
      inactive: Number(
        data?.students?.inactive ??
          Math.max(
            0,
            Number(data?.students?.total ?? data?.overview?.totalStudents ?? 0) -
              Number(data?.students?.active ?? data?.overview?.activeStudents ?? 0)
          )
      ),
      newThisPeriod: Number(
        data?.students?.newThisPeriod ?? data?.overview?.newStudents ?? 0
      ),
    },
    courses: {
      total: Number(data?.courses?.total ?? data?.courses?.rows?.length ?? 0),
      active: Number(
        data?.courses?.active ??
          (Array.isArray(data?.courses?.rows)
            ? data.courses.rows.filter((item: any) => item?.isActive !== false).length
            : 0)
      ),
      inactive: Number(data?.courses?.inactive ?? 0),
      enrollments: Number(data?.courses?.enrollments ?? 0),
      rows: Array.isArray(data?.courses?.rows)
        ? data.courses.rows.map((item: any) => ({
            id: String(item?.id ?? ""),
            title: String(item?.title ?? item?.name ?? "Untitled Course"),
            isActive: Boolean(item?.isActive),
            mode: String(item?.mode ?? "—"),
            enrollments: Number(
              item?.enrollmentCount ?? item?.enrollments ?? 0
            ),
          }))
        : [],
    },
    trainers: {
      total: Number(data?.trainers?.total ?? data?.trainers?.rows?.length ?? 0),
      active: Number(data?.trainers?.active ?? 0),
      inactive: Number(data?.trainers?.inactive ?? 0),
      withPermissions: Number(data?.trainers?.withPermissions ?? 0),
      withAvailability: Number(data?.trainers?.withAvailability ?? 0),
      totalAssignments: Number(data?.trainers?.totalAssignments ?? 0),
      rows: Array.isArray(data?.trainers?.rows)
        ? data.trainers.rows.map((item: any) => ({
            id: String(item?.id ?? ""),
            name: String(item?.name ?? "Unnamed Trainer"),
            email: String(item?.email ?? ""),
            isActive: Boolean(item?.isActive),
            assignedCourses: Number(
              Array.isArray(item?.assignedCourses)
                ? item.assignedCourses.length
                : item?.assignedCourses ?? 0
            ),
            totalCoursePermissions: Number(
              item?.totalCoursePermissions ?? 0
            ),
            availabilitySlots: Number(
              item?.availabilityCount ?? item?.availabilitySlots ?? 0
            ),
            hasAvailability: Number(
              item?.availabilityCount ?? item?.availabilitySlots ?? 0
            ) > 0,
          }))
        : [],
    },
    payments: {
      revenue: Number(data?.payments?.revenue ?? 0),
      paid: Number(data?.payments?.paid ?? 0),
      pending: Number(data?.payments?.pending ?? 0),
      failed: Number(data?.payments?.failed ?? 0),
      refunded: Number(data?.payments?.refunded ?? 0),
      transactions: Number(data?.payments?.transactions ?? 0),
    },
    certificates: {
      total: Number(data?.certificates?.total ?? 0),
      issued: Number(data?.certificates?.issued ?? data?.certificates?.total ?? 0),
    },
    enrollments: {
      total: Number(data?.enrollments?.total ?? 0),
      active: Number(data?.enrollments?.active ?? 0),
      completed: Number(data?.enrollments?.completed ?? 0),
      pending: Number(data?.enrollments?.pending ?? 0),
      cancelled: Number(data?.enrollments?.cancelled ?? 0),
    },
    analytics: {
      trend: Array.isArray(data?.analytics?.trend)
        ? data.analytics.trend.map((item: any) => ({
            label: String(item?.label ?? ""),
            students: Number(item?.students ?? 0),
            enrollments: Number(item?.enrollments ?? 0),
            revenue: Number(item?.revenue ?? 0),
            certificates: Number(item?.certificates ?? 0),
          }))
        : [],
      recentActivity: Array.isArray(data?.analytics?.recentActivity)
        ? data.analytics.recentActivity.map((item: any) => ({
            type: String(item?.type ?? "Activity"),
            label: String(item?.label ?? "Platform activity"),
            date: String(item?.date ?? ""),
            amount:
              item?.amount === null || item?.amount === undefined
                ? null
                : Number(item.amount),
          }))
        : [],
      coursePerformance: Array.isArray(data?.analytics?.coursePerformance)
        ? data.analytics.coursePerformance.map((item: any) => ({
            id: String(item?.id ?? ""),
            title: String(item?.title ?? "Untitled Course"),
            enrollments: Number(item?.enrollments ?? 0),
            revenue: Number(item?.revenue ?? 0),
          }))
        : [],
    },
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const QUICK_ACTIONS = [
  {
    title: "Add Student",
    description: "Create a new student account",
    href: "/dashboard/admin/students",
    icon: UserPlusIcon,
  },
  {
    title: "Add Course",
    description: "Create a new course",
    href: "/dashboard/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Add Trainer",
    description: "Register and configure a trainer",
    href: "/dashboard/admin/trainers",
    icon: GraduationCap,
  },
  {
    title: "Create Batch",
    description: "Create and manage learning batches",
    href: "/dashboard/admin/batches",
    icon: Layers,
  },
];

const MANAGEMENT_LINKS = [
  {
    title: "Students",
    description: "Student registrations and profiles",
    href: "/dashboard/admin/students",
    icon: Users,
  },
  {
    title: "Courses",
    description: "Courses and learning content",
    href: "/dashboard/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Trainers",
    description: "Trainer engagement and assignments",
    href: "/dashboard/admin/trainers",
    icon: UserCheck,
  },
  {
    title: "Batches",
    description: "Batch schedules and students",
    href: "/dashboard/admin/batches",
    icon: Layers,
  },
  {
    title: "Assignments & Quizzes",
    description: "Assessments and submissions",
    href: "/dashboard/admin/assignments",
    icon: ClipboardList,
  },
  {
    title: "Calendar",
    description: "Meetings and scheduling",
    href: "/dashboard/admin/calendar",
    icon: CalendarDays,
  },
  {
    title: "Payments",
    description: "Transactions and revenue",
    href: "/dashboard/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Reports",
    description: "Detailed platform analytics",
    href: "/dashboard/admin/reports",
    icon: BarChart3,
  },
];

function UserPlusIcon(props: { size?: number; className?: string }) {
  return <Users size={props.size} className={props.className} />;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await loadAdminReport();
      setData(result);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const topCourses = useMemo(() => {
    if (!data) {
      return [];
    }

    const fromPerformance = data.analytics.coursePerformance;

    if (fromPerformance.length > 0) {
      return [...fromPerformance]
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5);
    }

    return [...data.courses.rows]
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5)
      .map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: course.enrollments,
        revenue: 0,
      }));
  }, [data]);

  const trend = data?.analytics.trend ?? [];

  const maxTrendEnrollments = Math.max(
    1,
    ...trend.map((item) => item.enrollments)
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading admin dashboard
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Preparing your platform overview.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-red-200 bg-white px-6 shadow-sm">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Activity size={26} />
              </div>
              <h1 className="mt-5 text-xl font-bold text-[#173B67]">
                Unable to load dashboard
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {error || "No dashboard data is available right now."}
              </p>
              <button
                type="button"
                onClick={() => void fetchDashboard(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statCards = [
    {
      label: "Students",
      value: data.students.total,
      detail: `${data.students.active} active · ${data.students.newThisPeriod} new this month`,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Courses",
      value: data.courses.total,
      detail: `${data.courses.active} active · ${data.courses.enrollments} enrollments`,
      icon: BookOpen,
      tone: "violet",
    },
    {
      label: "Trainers",
      value: data.trainers.total,
      detail: `${data.trainers.active} active · ${data.trainers.withAvailability} with availability`,
      icon: UserCheck,
      tone: "green",
    },
    {
      label: "Revenue",
      value: formatCurrency(data.payments.revenue),
      detail: `${data.payments.paid} paid transactions this month`,
      icon: IndianRupee,
      tone: "amber",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="mb-6 rounded-3xl bg-[linear-gradient(135deg,#12345b_0%,#173b67_55%,#2465c6_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-300">
                <ShieldCheck size={15} />
                Administration Portal
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                A central view of your students, courses, trainers,
                enrollments and platform activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-50">
              Active students: {data.students.active}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-50">
              Active trainers: {data.trainers.active}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-50">
              Active courses: {data.courses.active}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-50">
              Certificates: {data.certificates.issued}
            </span>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            const toneClasses = {
              blue: "bg-blue-50 text-blue-600",
              violet: "bg-violet-50 text-violet-600",
              green: "bg-emerald-50 text-emerald-600",
              amber: "bg-orange-50 text-orange-600",
            }[stat.tone];

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-[#173B67]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {stat.detail}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp size={18} />
                  </div>
                  <h2 className="text-base font-bold text-[#173B67]">
                    Platform Activity
                  </h2>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Enrollment activity across the current reporting period
                </p>
              </div>

              <Link
                href="/dashboard/admin/reports"
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                View reports
                <ArrowRight size={13} />
              </Link>
            </div>

            {trend.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-xs text-slate-400">
                No activity trend data is available yet.
              </div>
            ) : (
              <div className="mt-7 flex items-end gap-3 overflow-x-auto pb-1">
                {trend.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-[48px] flex-1"
                    title={`${item.label}: ${item.enrollments} enrollments`}
                  >
                    <div className="flex h-40 items-end justify-center">
                      <div
                        className="w-8 rounded-t-lg bg-[#2F6BFF] transition hover:bg-[#1f56dc]"
                        style={{
                          height: `${Math.max(
                            8,
                            Math.round(
                              (item.enrollments / maxTrendEnrollments) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 truncate text-center text-[10px] font-medium text-slate-400">
                      {item.label}
                    </div>
                    <div className="mt-1 text-center text-xs font-bold text-slate-700">
                      {item.enrollments}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                    <BarChart3 size={18} />
                  </div>
                  <h2 className="text-base font-bold text-[#173B67]">
                    Enrollment Status
                  </h2>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Current enrollment distribution
                </p>
              </div>

              <Link
                href="/dashboard/admin/reports"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                Details
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              <StatusRow
                label="Active"
                value={data.enrollments.active}
                total={Math.max(1, data.enrollments.total)}
                tone="green"
              />
              <StatusRow
                label="Completed"
                value={data.enrollments.completed}
                total={Math.max(1, data.enrollments.total)}
                tone="blue"
              />
              <StatusRow
                label="Pending"
                value={data.enrollments.pending}
                total={Math.max(1, data.enrollments.total)}
                tone="amber"
              />
              <StatusRow
                label="Cancelled"
                value={data.enrollments.cancelled}
                total={Math.max(1, data.enrollments.total)}
                tone="slate"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniMetric
                label="Total"
                value={data.enrollments.total}
                icon={<Layers size={14} />}
              />
              <MiniMetric
                label="Certificates"
                value={data.certificates.issued}
                icon={<Award size={14} />}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <BookOpen size={18} />
                  </div>
                  <h2 className="text-base font-bold text-[#173B67]">
                    Course Performance
                  </h2>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Courses with the highest enrollment activity
                </p>
              </div>

              <Link
                href="/dashboard/admin/courses"
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                View courses
                <ArrowRight size={13} />
              </Link>
            </div>

            {topCourses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-xs text-slate-400">
                No course performance data is available yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {topCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-[#173B67] shadow-sm">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {course.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-400">
                        <span>{course.enrollments} enrollments</span>
                        <span>{formatCurrency(course.revenue)}</span>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Activity size={18} />
                  </div>
                  <h2 className="text-base font-bold text-[#173B67]">
                    Recent Activity
                  </h2>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Latest platform events
                </p>
              </div>
            </div>

            {data.analytics.recentActivity.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-xs text-slate-400">
                No recent activity is available yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {data.analytics.recentActivity.slice(0, 6).map((item, index) => (
                  <div
                    key={`${item.type}-${item.label}-${index}`}
                    className="flex items-start gap-3 py-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {activityIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDate(item.date)}
                      </p>
                    </div>

                    {item.amount !== null ? (
                      <span className="shrink-0 text-xs font-bold text-slate-700">
                        {formatCurrency(item.amount)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                  <ArrowRight size={18} />
                </div>
                <h2 className="text-base font-bold text-[#173B67]">
                  Quick Actions
                </h2>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Common administration tasks
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        {action.description}
                      </p>
                    </div>

                    <ArrowRight
                      size={15}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#173B67]">
              Management
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Access the main administration areas
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MANAGEMENT_LINKS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/5 text-[#173B67] transition group-hover:bg-orange-50 group-hover:text-orange-500">
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={15}
                      className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-400 shadow-sm">
          Dashboard data is loaded from the existing admin reports API for the
          current month.
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "green" | "blue" | "amber" | "slate";
}) {
  const width = Math.min(100, Math.round((value / total) * 100));

  const toneClass = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-orange-500",
    slate: "bg-slate-400",
  }[tone];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-700">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-extrabold text-[#173B67]">{value}</p>
    </div>
  );
}

function activityIcon(type: string) {
  const value = type.toLowerCase();

  if (value.includes("payment") || value.includes("revenue")) {
    return <IndianRupee size={15} />;
  }

  if (value.includes("student")) {
    return <Users size={15} />;
  }

  if (value.includes("certificate")) {
    return <Award size={15} />;
  }

  if (value.includes("course")) {
    return <BookOpen size={15} />;
  }

  if (value.includes("trainer")) {
    return <GraduationCap size={15} />;
  }

  return <CheckCircle2 size={15} />;
}
