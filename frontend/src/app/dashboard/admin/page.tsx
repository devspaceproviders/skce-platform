import Link from "next/link";
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  IndianRupee,
  ClipboardList,
  UserPlus,
  PlusCircle,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  CreditCard,
  Award,
  CalendarCheck,
} from "lucide-react";

const STATS = [
  {
    label: "Total Students",
    value: "0",
    description: "Registered students",
    icon: Users,
  },
  {
    label: "Active Courses",
    value: "16",
    description: "Courses available",
    icon: BookOpen,
  },
  {
    label: "Total Trainers",
    value: "0",
    description: "Registered trainers",
    icon: GraduationCap,
  },
  {
    label: "Associates",
    value: "0",
    description: "Active associates",
    icon: UserCheck,
  },
];

const QUICK_ACTIONS = [
  {
    title: "Add Student",
    description: "Create a new student account",
    href: "/dashboard/admin/students",
    icon: UserPlus,
  },
  {
    title: "Add Course",
    description: "Create a new training course",
    href: "/dashboard/admin/courses",
    icon: PlusCircle,
  },
  {
    title: "Add Trainer",
    description: "Register a new trainer",
    href: "/dashboard/admin/trainers",
    icon: GraduationCap,
  },
  {
    title: "Create Batch",
    description: "Create and manage batches",
    href: "/dashboard/admin/batches",
    icon: CalendarDays,
  },
];

const MANAGEMENT_ITEMS = [
  {
    title: "Students",
    description: "Manage student registrations and profiles",
    href: "/dashboard/admin/students",
    icon: Users,
  },
  {
    title: "Courses",
    description: "Manage courses and course content",
    href: "/dashboard/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Payments",
    description: "View and manage payment records",
    href: "/dashboard/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Attendance",
    description: "Track student attendance",
    href: "/dashboard/admin/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Certificates",
    description: "Manage student certificates",
    href: "/dashboard/admin/certificates",
    icon: Award,
  },
  {
    title: "Reports",
    description: "View platform reports and insights",
    href: "/dashboard/admin/reports",
    icon: TrendingUp,
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Administration
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage students, courses, trainers and your SKCE platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 sm:flex">
              A
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Administrator
              </p>

              <p className="text-xs text-slate-500">
                Admin Account
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            STATISTICS
        ====================================================== */}
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight text-[#173B67]">
                        {stat.value}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {stat.description}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-orange-100">
                      <Icon
                        size={21}
                        strokeWidth={2}
                        className="text-orange-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#173B67]">
                Quick Actions
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Frequently used administration actions
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-orange-500">
                      <Icon
                        size={20}
                        className="text-orange-500 transition group-hover:text-white"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {action.description}
                      </p>
                    </div>

                    <ArrowRight
                      size={16}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            MAIN DASHBOARD CONTENT
        ====================================================== */}
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">

          {/* =================================================
              RECENT ACTIVITY
          ================================================== */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#173B67]">
                Recent Activity
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Latest activity across the SKCE platform
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <TrendingUp
                    size={25}
                    className="text-slate-400"
                  />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-700">
                  No recent activity
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Student registrations, payments, enrollments and other
                  platform activity will appear here.
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              PLATFORM OVERVIEW
          ================================================== */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#173B67]">
                Platform Overview
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Current platform summary
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Revenue */}
              <div className="flex items-center gap-4 border-b border-slate-100 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <IndianRupee
                    size={20}
                    className="text-orange-500"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    Total Revenue
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#173B67]">
                    ₹0
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/payments"
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                >
                  View
                </Link>
              </div>

              {/* Pending Tasks */}
              <div className="flex items-center gap-4 border-b border-slate-100 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <ClipboardList
                    size={20}
                    className="text-[#173B67]"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    Pending Tasks
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#173B67]">
                    0
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/assignments"
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                >
                  View
                </Link>
              </div>

              {/* Active Courses */}
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <BookOpen
                    size={20}
                    className="text-orange-500"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    Active Courses
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#173B67]">
                    16
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/courses"
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                >
                  View
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            MANAGEMENT SHORTCUTS
        ====================================================== */}
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-[#173B67]">
              Management
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Quickly access important administration sections
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MANAGEMENT_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173B67]/5 transition group-hover:bg-orange-50">
                    <Icon
                      size={19}
                      className="text-[#173B67] transition group-hover:text-orange-500"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            DEVELOPMENT MODE NOTICE
        ====================================================== */}
        <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <TrendingUp
                size={15}
                className="text-orange-600"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-orange-800">
                Development Mode
              </p>

              <p className="mt-1 text-xs leading-5 text-orange-700/80">
                Dashboard statistics and activity data will be connected
                to the backend and database when the administration API
                is implemented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}