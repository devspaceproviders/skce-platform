"use client";



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

  { title: "Add Student", description: "Create a new student account", href: `${ROOT}/students`, icon: UserPlus },

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

  blue: { chip: "bg-blue-50 text-blue-600", bar: "from-[#173B67] to-[#E87916]" },

  violet: { chip: "bg-amber-50 text-amber-700", bar: "from-[#173B67] to-[#E8A23A]" },

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

        <div className="mx-auto max-w-[1500px]">

          <div className="flex min-h-[480px] items-center justify-center rounded-2xl border border-red-100 bg-white px-6 shadow-sm">

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

    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

      <div className="mx-auto w-full max-w-[1680px] space-y-6">

        {/* Hero */}

        <Reveal>

          <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,#102B4D_0%,#173B67_58%,#244B75_100%)] px-6 py-7 text-white shadow-xl shadow-[#102B4D]/15 sm:px-8 lg:px-9 lg:py-8">

            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[22px] border-white/[0.045]" />
            <div className="pointer-events-none absolute -right-2 -top-8 h-56 w-56 rounded-full border-[2px] border-amber-300/15" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-40 rounded-r-full bg-gradient-to-r from-orange-500 via-amber-300 to-transparent" />

            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-orange-400/10 blur-3xl" />



            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">

                  <ShieldCheck size={14} />

                  Administration Portal

                </div>

                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">

                  {greeting()}, Admin

                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/90">

                  A central view of your students, courses, trainers, enrollments

                  and platform activity at SK Computer Education.

                </p>

                <p className="mt-1 text-xs text-blue-200/70">{today}</p>

              </div>



              <div className="flex flex-col items-start gap-2 lg:items-end">

                <button

                  type="button"

                  onClick={() => void fetchDashboard(true)}

                  disabled={refreshing}

                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"

                >

                  <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />

                  {refreshing ? "Refreshing…" : "Refresh"}

                </button>

                {updatedAt && (

                  <span className="text-[11px] text-blue-200/70">

                    Updated{" "}

                    {updatedAt.toLocaleTimeString("en-IN", {

                      hour: "2-digit",

                      minute: "2-digit",

                    })}

                  </span>

                )}

              </div>

            </div>



            <div className="relative mt-6 flex flex-wrap gap-2">

              {[

                ["Active students", data.students.active],

                ["Active trainers", data.trainers.active],

                ["Active courses", data.courses.active],

                ["Certificates", data.certificates.issued],

              ].map(([label, value]) => (

                <span

                  key={label}

                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-50"

                >

                  {label}: <strong className="font-bold text-white">{value}</strong>

                </span>

              ))}

            </div>

          </section>

        </Reveal>



        {/* KPI cards */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {statCards.map((stat, index) => {

            const Icon = stat.icon;

            const tone = TONES[stat.tone];



            return (

              <Reveal key={stat.label} delay={index * 70}>

                <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">

                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.bar}`} />

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">

                        {stat.label}

                      </p>

                      <p className="mt-2 truncate text-3xl font-extrabold tracking-tight text-[#173B67]">

                        {stat.display ?? <CountUp end={stat.value} duration={1100} />}

                      </p>

                      <p className="mt-1.5 text-xs leading-5 text-slate-500">

                        {stat.detail}

                      </p>

                    </div>

                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tone.chip}`}>

                      <Icon size={21} />

                    </div>

                  </div>

                </div>

              </Reveal>

            );

          })}

        </section>



        {/* Activity + Enrollment status */}

        <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">

          <Reveal>

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



              <div className="mt-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-[#F4F6FA] p-1.5">

                {TREND_TABS.map((tab) => (

                  <button

                    key={tab.key}

                    type="button"

                    onClick={() => setMetric(tab.key)}

                    aria-pressed={metric === tab.key}

                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${

                      metric === tab.key

                        ? "bg-[#173B67] text-white shadow-sm shadow-[#173B67]/20"

                        : "text-slate-600 hover:bg-white hover:text-[#173B67]"

                    }`}

                  >

                    {tab.label}

                  </button>

                ))}

              </div>



              {trend.length === 0 ? (

                <EmptyState>No activity trend data is available yet.</EmptyState>

              ) : (

                <div className="relative mt-6">

                  {/* gridlines */}

                  <div className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between">

                    {[0, 1, 2, 3].map((i) => (

                      <div key={i} className="border-t border-dashed border-slate-100" />

                    ))}

                  </div>



                  <div className="relative flex items-end gap-2 overflow-x-auto pb-1 sm:gap-3">

                    {trend.map((item, i) => {

                      const value = item[metric];

                      const pct = Math.max(value > 0 ? 6 : 2, Math.round((value / maxTrend) * 100));



                      return (

                        <div key={`${item.label}-${i}`} className="group min-w-[44px] flex-1" title={`${item.label}: ${formatMetric(value)}`}>

                          <div className="relative flex h-44 items-end justify-center">

                            <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#173B67] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">

                              {formatMetric(value)}

                            </span>

                            <div

                              className="w-full max-w-[34px] rounded-t-lg bg-gradient-to-t from-[#173B67] to-[#E87916] transition-[height,filter] duration-700 ease-out group-hover:brightness-110"

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

              )}

            </Card>

          </Reveal>



          <Reveal delay={90}>

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



              <div className="mt-6 space-y-4">

                <StatusRow label="Active" value={data.enrollments.active} total={enrollTotal} tone="green" ready={barsReady} />

                <StatusRow label="Completed" value={data.enrollments.completed} total={enrollTotal} tone="blue" ready={barsReady} />

                <StatusRow label="Pending" value={data.enrollments.pending} total={enrollTotal} tone="amber" ready={barsReady} />

                <StatusRow label="Cancelled" value={data.enrollments.cancelled} total={enrollTotal} tone="slate" ready={barsReady} />

              </div>



              <div className="mt-6 grid grid-cols-2 gap-3">

                <MiniMetric label="Total enrollments" value={data.enrollments.total} icon={<Layers size={14} />} />

                <MiniMetric label="Certificates" value={data.certificates.issued} icon={<Award size={14} />} />

              </div>

            </Card>

          </Reveal>

        </section>



        {/* Course performance + Recent activity */}

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

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

                      className="group rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition duration-200 hover:border-orange-200 hover:bg-white hover:shadow-sm"

                    >

                      <div className="flex items-center gap-3">

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-[#173B67] shadow-sm transition group-hover:bg-[#173B67] group-hover:text-white">

                          {index + 1}

                        </span>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-semibold text-slate-800">{course.title}</p>

                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-slate-400">

                            <span>{course.enrollments} enrollments</span>

                            <span>{formatCurrency(course.revenue)}</span>

                          </div>

                        </div>

                      </div>

                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200/70">

                        <div

                          className="h-full rounded-full bg-gradient-to-r from-[#173B67] to-[#E87916] transition-[width] duration-700 ease-out"

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

                <ol className="relative mt-5 space-y-1 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-slate-100">

                  {data.analytics.recentActivity.slice(0, 6).map((item, index) => (

                    <li

                      key={`${item.type}-${item.label}-${index}`}

                      className="relative flex items-start gap-3 rounded-xl px-0 py-2 transition hover:bg-slate-50"

                    >

                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#EEF3FA] text-[#173B67] shadow-sm">

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

                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"

                  >

                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">

                      <Icon size={19} />

                    </span>

                    <span className="min-w-0 flex-1">

                      <span className="block text-sm font-semibold text-slate-800">{action.title}</span>

                      <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{action.description}</span>

                    </span>

                    <ArrowRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500" />

                  </Link>

                );

              })}

            </div>

          </Card>

        </Reveal>



        {/* Management */}

        <section>

          <Reveal>

            <div className="mb-4">

              <h2 className="text-base font-bold text-[#173B67]">Management</h2>

              <p className="mt-1 text-xs text-slate-500">Access the main administration areas</p>

            </div>

          </Reveal>



          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {MANAGEMENT_LINKS.map((item, index) => {

              const Icon = item.icon;

              return (

                <Reveal key={item.title} delay={(index % 4) * 60}>

                  <Link

                    href={item.href}

                    className="group flex h-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"

                  >

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/5 text-[#173B67] transition group-hover:bg-orange-50 group-hover:text-orange-500">

                      <Icon size={17} />

                    </span>

                    <span className="min-w-0 flex-1">

                      <span className="block text-sm font-semibold text-slate-800">{item.title}</span>

                      <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{item.description}</span>

                    </span>

                    <ChevronRight size={15} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />

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

    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>

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

      <div className="flex items-center gap-3">

        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone].chip}`}>

          {icon}

        </span>

        <div>

          <h2 className="text-base font-bold leading-tight text-[#173B67]">{title}</h2>

          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>

        </div>

      </div>

      {action}

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

    <div>

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

    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">

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

        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">

          <div className={`${block} h-80`} />

          <div className={`${block} h-80`} />

        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

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
