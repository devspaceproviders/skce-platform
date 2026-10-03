"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ClipboardList,
  ArrowRight,
  GraduationCap,
  RefreshCw,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type Assessment = {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  type: "ASSIGNMENT" | "QUIZ";
  dueAt: string | null;
  totalMarks: number;
  submissionCount: number;
  isActive: boolean;
};

type Submission = {
  id: number;
  userId: number;
  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "GRADED";
  submittedAt: string | null;
};

type PendingAssessment = Assessment & {
  pendingCount: number;
};

type TrainerCoursePermission = {
  id: number;
  trainerId: number;
  courseId: number;
  canTeach: boolean;
  canManageContent: boolean;
  canCreateAssessments: boolean;
  createdAt: string;
  updatedAt: string;
};

type DashboardUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function getLoggedInUser(): DashboardUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DashboardUser;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export default function TrainerDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<DashboardUser | null>(null);

  const [assessments, setAssessments] = useState<
    Assessment[]
  >([]);

  const [pendingAssessments, setPendingAssessments] =
    useState<PendingAssessment[]>([]);

  const [coursePermissions, setCoursePermissions] =
    useState<TrainerCoursePermission[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      throw new Error("Authentication required");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
    });

    /*
     * A 401 means the authentication token is
     * invalid or expired.
     *
     * A 403 means the trainer is authenticated
     * but does not have permission for this
     * specific resource.
     *
     * A permission failure must never log
     * the trainer out.
     */
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("student");
      localStorage.removeItem("studentId");

      router.push("/login");

      throw new Error(
        "Authentication required"
      );
    }

    return response;
  }

  async function loadDashboard(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        assessmentsResponse,
        permissionsResponse,
      ] = await Promise.all([
        authenticatedFetch(
          `${API_URL}/assessments`
        ),
        authenticatedFetch(
          `${API_URL}/trainer/course-permissions`
        ),
      ]);

      const assessmentsJson =
        await assessmentsResponse.json();

      const permissionsJson =
        await permissionsResponse.json();

      if (
        !assessmentsResponse.ok ||
        !assessmentsJson?.success
      ) {
        throw new Error(
          assessmentsJson?.message ||
            "Unable to load assessments."
        );
      }

      if (
        !permissionsResponse.ok ||
        !permissionsJson?.success
      ) {
        throw new Error(
          permissionsJson?.message ||
            "Unable to load course permissions."
        );
      }

      const assessmentData =
        Array.isArray(assessmentsJson.data)
          ? assessmentsJson.data
          : [];

      const permissionData =
        Array.isArray(permissionsJson.data)
          ? permissionsJson.data
          : [];

      setAssessments(assessmentData);
      setCoursePermissions(permissionData);

      /*
       * Determine actual pending grading
       * from assessment submissions.
       *
       * SUBMITTED = awaiting trainer grading
       * GRADED = already graded
       * IN_PROGRESS = not counted
       */
      const manageableCourseIds = new Set(
        permissionData
          .filter(
            (
              permission: TrainerCoursePermission
            ) => permission.canCreateAssessments
          )
          .map(
            (
              permission: TrainerCoursePermission
            ) => permission.courseId
          )
      );

      const gradeableAssessments =
        assessmentData.filter(
          (assessment: Assessment) =>
            manageableCourseIds.has(
              assessment.courseId
            )
        );

      const pendingResults =
        await Promise.all(
          gradeableAssessments.map(
            async (assessment: Assessment) => {
              try {
                const response =
                  await authenticatedFetch(
                    `${API_URL}/assessments/${assessment.id}/submissions`
                  );

                const json =
                  await response.json();

                if (
                  !response.ok ||
                  !json?.success
                ) {
                  return {
                    assessment,
                    pendingCount: 0,
                  };
                }

                const submissions: Submission[] =
                  Array.isArray(json.data)
                    ? json.data
                    : Array.isArray(
                          json.data?.submissions
                        )
                      ? json.data.submissions
                      : [];

                const pendingCount =
                  submissions.filter(
                    (submission) =>
                      submission.status ===
                      "SUBMITTED"
                  ).length;

                return {
                  assessment,
                  pendingCount,
                };
              } catch {
                return {
                  assessment,
                  pendingCount: 0,
                };
              }
            }
          )
        );

      setPendingAssessments(
        pendingResults
          .filter(
            (item) =>
              item.pendingCount > 0
          )
          .sort(
            (a, b) =>
              b.pendingCount -
              a.pendingCount
          )
          .slice(0, 5)
      );

      setUser(getLoggedInUser());
    } catch (err) {
      console.error(
        "Trainer dashboard load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load trainer dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    setUser(getLoggedInUser());
    void loadDashboard();
  }, []);

  const pendingGradingCount =
    pendingAssessments.reduce(
      (sum, assessment) =>
        sum + assessment.pendingCount,
      0
    );

  const activeAssessments =
    assessments.filter(
      (assessment) =>
        assessment.isActive
    ).length;

  const firstName =
    user?.name?.trim().split(/\s+/)[0] ||
    "Trainer";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-4 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
              <GraduationCap size={17} />
              Trainer Portal
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {getGreeting()},{" "}
              {firstName}! 👋
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Manage your courses, assessments,
              grading and trainer activities from
              one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              disabled={
                loading ||
                refreshing
              }
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Bell size={17} />
              Public Site
            </Link>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={18}
            />

            <div>
              <p className="font-semibold">
                Unable to load some dashboard data
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={
              <ClipboardList
                size={21}
              />
            }
            value={
              loading
                ? "—"
                : pendingGradingCount
            }
            label="Pending Grading"
            description="Submissions awaiting grading"
          />

          <StatCard
            icon={
              <BookOpen size={21} />
            }
            value={
              loading
                ? "—"
                : activeAssessments
            }
            label="Active Assessments"
            description="Currently active assessments"
          />

          <StatCard
            icon={
              <Users size={21} />
            }
            value={
              loading
                ? "—"
                : coursePermissions.length
            }
            label="Course Permissions"
            description="Courses currently assigned to you"
          />
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* PENDING GRADING */}
            <section>
              <SectionHeader
                title="Pending Grading"
                href="/dashboard/trainer/assignments"
              />

              {loading ? (
                <LoadingCard />
              ) : pendingAssessments.length ===
                0 ? (
                <EmptyCard
                  icon={
                    <ClipboardList
                      size={26}
                    />
                  }
                  title="Nothing to grade"
                  description="There are no submitted assignments or quizzes awaiting grading."
                />
              ) : (
                <div className="space-y-3">
                  {pendingAssessments.map(
                    (assessment) => (
                      <div
                        key={assessment.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                              {assessment.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {assessment.courseTitle ||
                                "Course not available"}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                              <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold">
                                {assessment.type}
                              </span>

                              {assessment.dueAt && (
                                <span>
                                  Due:{" "}
                                  {formatDate(
                                    assessment.dueAt
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="shrink-0 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
                            {
                              assessment.pendingCount
                            }{" "}
                            pending
                          </span>
                        </div>

                        <div className="mt-4">
                          <Link
                            href="/dashboard/trainer/assignments"
                            className="inline-flex items-center gap-1 text-sm font-bold text-[#173B67] transition hover:text-orange-500"
                          >
                            Open Assignments
                            <ArrowRight
                              size={14}
                            />
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* ASSESSMENT OVERVIEW */}
            <section>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <BookOpen
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#173B67]">
                      Assessment Overview
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {activeAssessments} active
                      assessment
                      {activeAssessments === 1
                        ? ""
                        : "s"}{" "}
                      are currently available
                      in the trainer assessment
                      area.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <OverviewItem
                    label="Total Assessments"
                    value={
                      assessments.length
                    }
                  />

                  <OverviewItem
                    label="Active"
                    value={
                      activeAssessments
                    }
                  />

                  <OverviewItem
                    label="Pending Grading"
                    value={
                      pendingGradingCount
                    }
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <section>
            {/* QUICK LINKS */}
            <div className="rounded-2xl bg-[#173B67] p-5 text-white shadow-sm">
              <h3 className="text-sm font-bold">
                Trainer Quick Links
              </h3>

              <div className="mt-4 space-y-2">
                <QuickLink
                  href="/dashboard/trainer/assignments"
                  label="Assignments & Quizzes"
                />

                <QuickLink
                  href="/dashboard/trainer/my-batches"
                  label="My Batches"
                />

                <QuickLink
                  href="/dashboard/trainer/course-content"
                  label="Course Content"
                />

                <QuickLink
                  href="/dashboard/trainer/profile"
                  label="My Profile"
                />

                <QuickLink
                  href="/dashboard/trainer/calendar"
                  label="Calendar"
                />
              </div>
            </div>

            {/* COURSE PERMISSIONS */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <BookOpen size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#173B67]">
                    My Course Permissions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your assigned courses and the
                    actions available to you.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                  Loading permissions...
                </div>
              ) : coursePermissions.length ===
                0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                  No course permissions have
                  been assigned to you yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {coursePermissions.map(
                    (permission) => (
                      <div
                        key={permission.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-900">
                            Course{" "}
                            {permission.courseId}
                          </p>

                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Assigned
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <PermissionBadge
                            label="Can Teach"
                            enabled={
                              permission.canTeach
                            }
                          />

                          <PermissionBadge
                            label="Manage Content"
                            enabled={
                              permission.canManageContent
                            }
                          />

                          <PermissionBadge
                            label="Create Assessments"
                            enabled={
                              permission.canCreateAssessments
                            }
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
  description,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <div>
          <div className="text-2xl font-bold text-[#173B67]">
            {value}
          </div>

          <div className="mt-0.5 text-sm text-slate-500">
            {label}
          </div>

          <div className="mt-1 text-[11px] text-slate-400">
            {description}
          </div>
        </div>
      </div>
    </div>
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
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

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

function OverviewItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-[#173B67]">
        {value}
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex min-h-[170px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="inline-flex items-center gap-2 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin"
        />
        Loading dashboard...
      </div>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#173B67]">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PermissionBadge({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
      <span className="font-medium text-slate-600">
        {label}
      </span>

      <span
        className={
          enabled
            ? "font-bold text-emerald-600"
            : "font-bold text-slate-400"
        }
      >
        {enabled ? "Allowed" : "Not allowed"}
      </span>
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