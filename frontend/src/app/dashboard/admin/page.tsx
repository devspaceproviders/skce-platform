"use client";

import {
  AdminPageHeader,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LIGHT,
} from "@/components/dashboard/admin/AdminPageHeader";


import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";

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

/* ------------------------------------------------------------------ */
/* Static config                                                       */
/* ------------------------------------------------------------------ */

const ROOT = "/dashboard/admin";

const QUICK_ACTIONS: { title: string; description: string; href: string; icon: LucideIcon }[] = [
  { title: "Add Course", description: "Create a new course", href: `${ROOT}/courses`, icon: BookOpen },
  { title: "Add Trainer", description: "Register and configure a trainer", href: `${ROOT}/trainers`, icon: GraduationCap },
  { title: "Create Batch", description: "Create and manage learning batches", href: `${ROOT}/batches`, icon: Layers },
];

const MANAGEMENT_LINKS: { title: string; description: string; href: string; icon: LucideIcon }[] = [
  { title: "Students", description: "Registrations and profiles", href: `${ROOT}/students`, icon: Users },
  { title: "Courses", description: "Courses and learning content", href: `${ROOT}/courses`, icon: BookOpen },
  { title: "Trainers", description: "Engagement and assignments", href: `${ROOT}/trainers`, icon: UserCheck },
  { title: "Batches", description: "Schedules and students", href: `${ROOT}/batches`, icon: Layers },
  { title: "Assignments & Quizzes", description: "Assessments and submissions", href: `${ROOT}/assignments`, icon: ClipboardList },
  { title: "Calendar", description: "Meetings and scheduling", href: `${ROOT}/calendar`, icon: CalendarDays },
  { title: "Payments", description: "Transactions and revenue", href: `${ROOT}/payments`, icon: CreditCard },
  { title: "Reports", description: "Detailed platform analytics", href: `${ROOT}/reports`, icon: BarChart3 },
];

type TrendMetric = "enrollments" | "students" | "revenue" | "certificates";

const TREND_TABS: { key: TrendMetric; label: string }[] = [
  { key: "enrollments", label: "Enrollments" },
  { key: "students", label: "Students" },
  { key: "revenue", label: "Revenue" },
  { key: "certificates", label: "Certificates" },
];

const TONES = {
  blue: { chip: "bg-blue-50 text-blue-600", bar: "from-blue-500 to-blue-400" },
  violet: { chip: "bg-[#E8EEF8] text-[#173B67]", bar: "from-[#173B67] to-[#1459B8]" },
  green: { chip: "bg-emerald-50 text-emerald-600", bar: "from-emerald-500 to-emerald-400" },
  orange: { chip: "bg-orange-50 text-orange-600", bar: "from-orange-500 to-amber-400" },
} as const;

type Tone = keyof typeof TONES;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<TrendMetric>("enrollments");
  const [barsReady, setBarsReady] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

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
      setUpdatedAt(new Date());
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  // Let bars mount at 0 height, then grow.
  useEffect(() => {
    if (!data) return;
    setBarsReady(false);
    const id = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(id);
  }, [data, metric]);

  const topCourses = useMemo(() => {
    if (!data) return [];

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
  const maxTrend = Math.max(1, ...trend.map((item) => item[metric]));
  const maxCourse = Math.max(1, ...topCourses.map((c) => c.enrollments));

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <main className="min-h-[calc(100vh-1px)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1680px]">
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-red-100 bg-white px-6 shadow-sm">
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
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statCards: {
    label: string;
    value: number;
    display?: string;
    detail: string;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
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
      value: data.payments.revenue,
      display: formatCurrency(data.payments.revenue),
      detail: `${data.payments.paid} paid transactions this month`,
      icon: IndianRupee,
      tone: "orange",
    },
  ];

  const enrollTotal = Math.max(1, data.enrollments.total);
  const formatMetric = (n: number) =>
    metric === "revenue" ? formatCurrency(n) : String(n);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <style dangerouslySetInnerHTML={{ __html: `
        .adm-navy::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
          background:
            radial-gradient(circle at 94% -8%, transparent 0 118px, rgba(255,255,255,.07) 119px 150px, rgba(255,255,255,.035) 151px 190px, transparent 191px),
            radial-gradient(circle at 3% 112%, transparent 0 80px, rgba(255,255,255,.06) 81px 110px, transparent 111px),
            radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px);
          background-size:auto,auto,24px 24px;}
        .adm-shine::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;transform:skewX(-20deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transition:left .7s ease;pointer-events:none;}
        .adm-shine:hover::after{left:130%;}
        .adm-tile::after{content:"";position:absolute;top:-30px;right:-30px;width:90px;height:90px;border-radius:9999px;
          border:14px solid rgba(23,59,103,.05);pointer-events:none;transition:border-color .3s ease, transform .5s ease;}
        .adm-card::after{content:"";position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:9999px;border:18px solid rgba(23,59,103,.045);pointer-events:none;z-index:-1;}
        .adm-tile:hover::after{border-color:rgba(255,255,255,.10);transform:scale(1.25);}
        .sk-scroll{scrollbar-width:thin;scrollbar-color:#9DB6DA transparent;}
        .sk-scroll::-webkit-scrollbar{height:6px;}
        .sk-scroll::-webkit-scrollbar-thumb{background:#9DB6DA;border-radius:9999px;}
        @media (prefers-reduced-motion: reduce){.adm-shine::after,.adm-tile::after{transition:none;}}
      ` }} />
      <div className="mx-auto w-full max-w-[1680px] space-y-6">
        {/* Hero */}
        <Reveal>
          <AdminPageHeader
            icon={ShieldCheck}
            label="Administration Portal"
            title={`${greeting()}, Admin`}
            subtitle={`A central view of your students, courses, trainers, enrollments and platform activity at SK Computer Education. ${today}`}
            chips={[
              { label: "Active students", value: data.students.active },
              { label: "Active trainers", value: data.trainers.active },
              { label: "Active courses", value: data.courses.active },
              { label: "Certificates", value: data.certificates.issued },
            ]}
            actions={
              <>
                {updatedAt && (
                  <span className="text-xs text-blue-100/80">
                    Updated{" "}
                    {updatedAt.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void fetchDashboard(true)}
                  disabled={refreshing}
                  className={ADMIN_BTN_GHOST}
                >
                  <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </>
            }
          />
        </Reveal>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const tone = TONES[stat.tone];

            return (
              <Reveal key={stat.label} delay={index * 70}>
                <div className="adm-tile group relative isolate h-full overflow-hidden rounded-2xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-blue-900/20">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 to-[#1459B8] transition-all duration-300 group-hover:w-full group-hover:opacity-0" />
                  <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2A55] via-[#0F2F5F] to-[#173B67] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-colors duration-300 group-hover:text-blue-100/80">
                        {stat.label}
                      </p>
                      <p className="mt-2 truncate text-3xl font-extrabold tracking-tight text-[#173B67] transition-colors duration-300 group-hover:text-white">
                        {stat.display ?? <CountUp end={stat.value} duration={1100} />}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500 transition-colors duration-300 group-hover:text-blue-100/80">
                        {stat.detail}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#1459B8] text-white shadow-md shadow-blue-900/20 transition duration-300 group-hover:scale-110 group-hover:from-orange-400 group-hover:to-orange-600">
                      <Icon size={21} />
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </section>

        {/* Activity + Enrollment status */}
        <section className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Reveal className="min-w-0">
            <Card className="h-full">
              <CardHeader
                icon={<TrendingUp size={18} />}
                tone="blue"
                title="Platform Activity"
                subtitle="Activity across the current reporting period"
                action={
                  <Link
                    href={`${ROOT}/reports`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 transition hover:text-orange-600"
                  >
                    View reports <ArrowRight size={13} />
                  </Link>
                }
              />

              <div className="mt-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                {TREND_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMetric(tab.key)}
                    aria-pressed={metric === tab.key}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      metric === tab.key
                        ? "bg-white text-[#173B67] shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {trend.length === 0 ? (
                <EmptyState>No activity trend data is available yet.</EmptyState>
              ) : (
                <div className="mt-6">
                  <div className="sk-scroll relative overflow-x-auto pb-3">
                    <div className="relative w-max min-w-full">
                      {/* gridlines */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-60 flex-col justify-between">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="border-t border-dashed border-slate-100" />
                        ))}
                      </div>

                      <div className="relative flex items-end gap-2">
                        {trend.map((item, i) => {
                          const value = item[metric];
                          const pct = Math.max(value > 0 ? 6 : 2, Math.round((value / maxTrend) * 100));

                          return (
                            <div key={`${item.label}-${i}`} className="group w-[46px] flex-none" title={`${item.label}: ${formatMetric(value)}`}>
                              <div className="relative flex h-60 items-end justify-center">
                                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#173B67] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">
                                  {formatMetric(value)}
                                </span>
                                <div
                                  className="w-7 rounded-t-lg bg-gradient-to-t from-[#173B67] to-[#2F6BFF] transition-[height,filter] duration-700 ease-out group-hover:brightness-110"
                                  style={{
                                    height: barsReady ? `${pct}%` : "0%",
                                    transitionDelay: `${i * 40}ms`,
                                  }}
                                />
                              </div>
                              <div className="mt-2 truncate text-center text-[10px] font-medium text-slate-400">
                                {item.label}
                              </div>
                              <div className="mt-0.5 truncate text-center text-xs font-bold text-slate-700">
                                {formatMetric(value)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {trend.length > 12 && (
                    <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-medium text-slate-400">
                      Scroll sideways to see all {trend.length} days <ArrowRight size={11} />
                    </p>
                  )}
                </div>
              )}
            </Card>
          </Reveal>

          <Reveal delay={90} className="min-w-0">
            <Card className="h-full">
              <CardHeader
                icon={<BarChart3 size={18} />}
                tone="orange"
                title="Enrollment Status"
                subtitle="Current enrollment distribution"
                action={
                  <Link href={`${ROOT}/reports`} className="text-xs font-semibold text-orange-500 transition hover:text-orange-600">
                    Details
                  </Link>
                }
              />

              {/* stacked overview bar */}
              <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100">
                {[
                  { v: data.enrollments.active, c: "bg-emerald-500" },
                  { v: data.enrollments.completed, c: "bg-blue-500" },
                  { v: data.enrollments.pending, c: "bg-orange-500" },
                  { v: data.enrollments.cancelled, c: "bg-slate-400" },
                ].map((seg, i) => (
                  <div
                    key={i}
                    className={`${seg.c} transition-[width] duration-700 ease-out`}
                    style={{ width: barsReady ? `${(seg.v / enrollTotal) * 100}%` : "0%" }}
                  />
                ))}
              </div>

              <div className="mt-5 space-y-2.5">
                <StatusRow label="Active" value={data.enrollments.active} total={enrollTotal} tone="green" ready={barsReady} />
                <StatusRow label="Completed" value={data.enrollments.completed} total={enrollTotal} tone="blue" ready={barsReady} />
                <StatusRow label="Pending" value={data.enrollments.pending} total={enrollTotal} tone="amber" ready={barsReady} />
                <StatusRow label="Cancelled" value={data.enrollments.cancelled} total={enrollTotal} tone="slate" ready={barsReady} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <MiniMetric label="Total enrollments" value={data.enrollments.total} icon={<Layers size={14} />} />
                <MiniMetric label="Certificates" value={data.certificates.issued} icon={<Award size={14} />} />
              </div>
            </Card>
          </Reveal>
        </section>

        {/* Course performance + Recent activity */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Reveal>
            <Card className="h-full">
              <CardHeader
                icon={<BookOpen size={18} />}
                tone="violet"
                title="Course Performance"
                subtitle="Courses with the highest enrollment activity"
                action={
                  <Link href={`${ROOT}/courses`} className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 transition hover:text-orange-600">
                    View courses <ArrowRight size={13} />
                  </Link>
                }
              />

              {topCourses.length === 0 ? (
                <EmptyState>No course performance data is available yet.</EmptyState>
              ) : (
                <div className="mt-5 space-y-2.5">
                  {topCourses.map((course, index) => (
                    <div
                      key={course.id || index}
                      className="adm-tile group relative isolate overflow-hidden rounded-xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:shadow-blue-900/20"
                    >
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 to-[#1459B8] transition-all duration-300 group-hover:w-full group-hover:opacity-0" />
                      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2A55] via-[#0F2F5F] to-[#173B67] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#1459B8] text-xs font-extrabold text-white shadow-md shadow-blue-900/20 transition duration-300 group-hover:scale-110 group-hover:from-orange-400 group-hover:to-orange-600">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#173B67] transition-colors duration-300 group-hover:text-white">{course.title}</p>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-slate-500 transition-colors duration-300 group-hover:text-blue-100/80">
                            <span>{course.enrollments} enrollments</span>
                            <span>{formatCurrency(course.revenue)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200/70 transition-colors duration-300 group-hover:bg-white/20">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#173B67] via-[#1459B8] to-[#F97316] transition-[width] duration-700 ease-out"
                          style={{ width: barsReady ? `${(course.enrollments / maxCourse) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Reveal>

          <Reveal delay={90}>
            <Card className="h-full">
              <CardHeader
                icon={<Activity size={18} />}
                tone="green"
                title="Recent Activity"
                subtitle="Latest platform events"
              />

              {data.analytics.recentActivity.length === 0 ? (
                <EmptyState>No recent activity is available yet.</EmptyState>
              ) : (
                <ol className="relative mt-5 space-y-1 before:absolute before:bottom-3 before:left-[26px] before:top-3 before:w-px before:bg-[#173B67]/10">
                  {data.analytics.recentActivity.slice(0, 6).map((item, index) => (
                    <li
                      key={`${item.type}-${item.label}-${index}`}
                      className="relative flex items-start gap-3 rounded-xl border border-transparent px-2.5 py-2 transition duration-300 hover:border-[#173B67]/10 hover:bg-gradient-to-br hover:from-white hover:to-[#EEF4FF] hover:shadow-sm"
                    >
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#173B67] to-[#1459B8] text-white shadow-md shadow-blue-900/20">
                        {activityIcon(item.type)}
                      </span>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold leading-5 text-slate-700">{item.label}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(item.date)}</p>
                      </div>
                      {item.amount !== null && (
                        <span className="shrink-0 pr-2 text-xs font-bold text-slate-700">
                          {formatCurrency(item.amount)}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </Reveal>
        </section>

        {/* Quick actions */}
        <Reveal>
          <Card>
            <CardHeader
              icon={<ArrowRight size={18} />}
              tone="orange"
              title="Quick Actions"
              subtitle="Common administration tasks"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="adm-tile group relative isolate flex h-full items-center gap-3 overflow-hidden rounded-xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-blue-900/20"
                  >
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 to-[#1459B8] transition-all duration-300 group-hover:w-full group-hover:opacity-0" />
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2A55] via-[#0F2F5F] to-[#173B67] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#1459B8] text-white shadow-md shadow-blue-900/20 transition duration-300 group-hover:scale-110 group-hover:from-orange-400 group-hover:to-orange-600">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#173B67] transition-colors duration-300 group-hover:text-white">{action.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-5 text-slate-500 transition-colors duration-300 group-hover:text-blue-100/80">{action.description}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-[#173B67]/40 transition duration-300 group-hover:translate-x-1 group-hover:text-orange-300" />
                  </Link>
                );
              })}
            </div>
          </Card>
        </Reveal>

        {/* Management */}
        <section>
          <Reveal>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-orange-500 to-[#1459B8]" />
              <div>
                <h2 className="text-base font-bold text-[#173B67]">Management</h2>
                <p className="mt-0.5 text-xs text-slate-500">Access the main administration areas</p>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MANAGEMENT_LINKS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={(index % 4) * 60}>
                  <Link
                    href={item.href}
                    className="adm-tile group relative isolate flex h-full items-center gap-3 overflow-hidden rounded-xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-blue-900/20"
                  >
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 to-[#1459B8] transition-all duration-300 group-hover:w-full group-hover:opacity-0" />
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2A55] via-[#0F2F5F] to-[#173B67] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#1459B8] text-white shadow-md shadow-blue-900/20 transition duration-300 group-hover:scale-110 group-hover:from-orange-400 group-hover:to-orange-600">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#173B67] transition-colors duration-300 group-hover:text-white">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-5 text-slate-500 transition-colors duration-300 group-hover:text-blue-100/80">{item.description}</span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-[#173B67]/40 transition duration-300 group-hover:translate-x-1 group-hover:text-orange-300" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        <p className="pb-2 text-center text-[11px] text-slate-400">
          Figures reflect the current month · SK Computer Education Admin
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`adm-card relative isolate overflow-hidden rounded-2xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-blue-900/10 sm:p-6 ${className}`}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 to-[#1459B8]" />
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  tone,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  tone: Tone;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#1459B8] text-white shadow-md shadow-blue-900/20">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-[#173B67]">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-xs text-slate-400">
      {children}
    </div>
  );
}

function StatusTile({
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
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const dot = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-orange-500",
    slate: "bg-slate-400",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold leading-none text-[#173B67]">{value}</span>
        <span className="text-xs font-semibold text-slate-400">{pct}%</span>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  total,
  tone,
  ready,
}: {
  label: string;
  value: number;
  total: number;
  tone: "green" | "blue" | "amber" | "slate";
  ready: boolean;
}) {
  const width = Math.min(100, Math.round((value / total) * 100));

  const toneClass = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-orange-500",
    slate: "bg-slate-400",
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] px-4 py-3 pl-5 shadow-sm">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneClass}`} />
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className={`h-2 w-2 rounded-full ${toneClass}`} />
          {label}
        </span>
        <span className="text-xs font-bold text-slate-700">
          {value} <span className="font-medium text-slate-400">· {width}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${toneClass}`}
          style={{ width: ready ? `${width}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#173B67]/10 bg-gradient-to-br from-white to-[#EEF4FF] px-3.5 py-3 pl-4 shadow-sm"><span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 to-[#1459B8]" />
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-extrabold text-[#173B67]">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-2xl bg-slate-200/70";
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading admin dashboard</span>
      <div className="mx-auto w-full max-w-[1680px] space-y-6">
        <div className={`${block} h-48`} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${block} h-32`} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className={`${block} h-80`} />
          <div className={`${block} h-80`} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className={`${block} h-72`} />
          <div className={`${block} h-72`} />
        </div>
      </div>
    </main>
  );
}

function activityIcon(type: string) {
  const value = type.toLowerCase();

  if (value.includes("payment") || value.includes("revenue")) return <IndianRupee size={14} />;
  if (value.includes("student")) return <Users size={14} />;
  if (value.includes("certificate")) return <Award size={14} />;
  if (value.includes("course")) return <BookOpen size={14} />;
  if (value.includes("trainer")) return <GraduationCap size={14} />;

  return <CheckCircle2 size={14} />;
}
