"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
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
  RefreshCw,
  Sparkles,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_URL.replace("/api", "")}${
    imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`
  }`;
}

type CourseData = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  mode?: string | null;
  imageUrl?: string | null;
};

type PackageCourse = {
  id?: number;
  courseId?: number;
  course?: CourseData | null;
};

type PackageData = {
  id: number;
  slug: string;
  title: string;
  price?: number | null;
  courses: PackageCourse[];
};

type EnrollmentData = {
  id: number;
  status: string;
  enrolledAt: string;
  package: PackageData | null;
  course: CourseData | null;
};

type PaymentData = {
  id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
};

type DashboardData = {
  student: {
    id: number;
    studentId: string;
    name: string;
    email: string;
    phone: string | null;
    state: string | null;
    referralId: string | null;
    isActive: boolean;
  };
  stats: {
    enrolledCourses: number;
    activeEnrollments: number;
    successfulPayments: number;
    totalPaid: number;
  };
  enrollments: EnrollmentData[];
  payments: PaymentData[];
  assignments: unknown[];
  quizzes: unknown[];
  recentActivity: unknown[];
  certificates: unknown[];
};

type CourseProgress = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  startedLessons: number;
  remainingLessons: number;
  progressPercentage: number;
};

type StudentCourse = {
  course: CourseData;
  packageName: string | null;
  enrollmentStatus: string;
};

function safeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    for (const key of ["title", "name", "label", "message", "description"]) {
      if (typeof objectValue[key] === "string") {
        return objectValue[key] as string;
      }
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function formatCurrency(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return `₹${Number(amount) || 0}`;
  }
}

function formatStatus(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeCourse(raw: any): CourseData | null {
  if (!raw) {
    return null;
  }

  const course = raw.course ?? raw;

  if (!course?.id) {
    return null;
  }

  return {
    id: Number(course.id),
    slug: safeText(course.slug),
    title: safeText(course.title),
    description:
      course.description === null || course.description === undefined
        ? null
        : safeText(course.description),
    mode:
      course.mode === null || course.mode === undefined
        ? null
        : safeText(course.mode),
    imageUrl:
      course.imageUrl === null || course.imageUrl === undefined
        ? null
        : safeText(course.imageUrl),
  };
}

function normalizePackage(raw: any): PackageData | null {
  if (!raw) {
    return null;
  }

  const packageValue = raw.package ?? raw;

  if (!packageValue?.id) {
    return null;
  }

  const courses: PackageCourse[] = Array.isArray(packageValue.courses)
    ? packageValue.courses
        .map((item: any) => {
          const course = normalizeCourse(item);

          return course
            ? {
                id: item?.id ? Number(item.id) : undefined,
                courseId: course.id,
                course,
              }
            : null;
        })
        .filter(
          (item: PackageCourse | null): item is PackageCourse =>
            item !== null
        )
    : [];

  return {
    id: Number(packageValue.id),
    slug: safeText(packageValue.slug),
    title: safeText(packageValue.title),
    price:
      packageValue.price === null || packageValue.price === undefined
        ? null
        : Number(packageValue.price) || 0,
    courses,
  };
}

function normalizeEnrollment(raw: any): EnrollmentData {
  return {
    id: Number(raw?.id) || 0,
    status: safeText(raw?.status),
    enrolledAt: safeText(raw?.enrolledAt),
    package: normalizePackage(raw?.package),
    course: normalizeCourse(raw?.course),
  };
}

function normalizePayment(raw: any): PaymentData {
  return {
    id: Number(raw?.id) || 0,
    amount: Number(raw?.amount) || 0,
    currency: safeText(raw?.currency || "INR"),
    method: safeText(raw?.method),
    status: safeText(raw?.status),
    createdAt: safeText(raw?.createdAt),
    paidAt:
      raw?.paidAt === null || raw?.paidAt === undefined
        ? null
        : safeText(raw?.paidAt),
  };
}

function normalizeDashboard(raw: any): DashboardData {
  const rawStudent = raw?.student ?? {};
  const rawStats = raw?.stats ?? {};

  return {
    student: {
      id: Number(rawStudent.id) || 0,
      studentId: safeText(rawStudent.studentId),
      name: safeText(rawStudent.name),
      email: safeText(rawStudent.email),
      phone:
        rawStudent.phone === null || rawStudent.phone === undefined
          ? null
          : safeText(rawStudent.phone),
      state:
        rawStudent.state === null || rawStudent.state === undefined
          ? null
          : safeText(rawStudent.state),
      referralId:
        rawStudent.referralId === null || rawStudent.referralId === undefined
          ? null
          : safeText(rawStudent.referralId),
      isActive: Boolean(rawStudent.isActive),
    },
    stats: {
      enrolledCourses: Number(rawStats.enrolledCourses) || 0,
      activeEnrollments: Number(rawStats.activeEnrollments) || 0,
      successfulPayments: Number(rawStats.successfulPayments) || 0,
      totalPaid: Number(rawStats.totalPaid) || 0,
    },
    enrollments: Array.isArray(raw?.enrollments)
      ? raw.enrollments.map(normalizeEnrollment)
      : [],
    payments: Array.isArray(raw?.payments)
      ? raw.payments.map(normalizePayment)
      : [],
    assignments: Array.isArray(raw?.assignments) ? raw.assignments : [],
    quizzes: Array.isArray(raw?.quizzes) ? raw.quizzes : [],
    recentActivity: Array.isArray(raw?.recentActivity)
      ? raw.recentActivity
      : [],
    certificates: Array.isArray(raw?.certificates) ? raw.certificates : [],
  };
}

function buildStudentCourses(
  enrollments: EnrollmentData[]
): StudentCourse[] {
  const courseMap = new Map<number, StudentCourse>();

  for (const enrollment of enrollments) {
    if (enrollment.course) {
      courseMap.set(enrollment.course.id, {
        course: enrollment.course,
        packageName: null,
        enrollmentStatus: enrollment.status,
      });
    }

    if (enrollment.package) {
      for (const packageItem of enrollment.package.courses) {
        if (!packageItem.course) {
          continue;
        }

        if (!courseMap.has(packageItem.course.id)) {
          courseMap.set(packageItem.course.id, {
            course: packageItem.course,
            packageName: enrollment.package.title,
            enrollmentStatus: enrollment.status,
          });
        }
      }
    }
  }

  return Array.from(courseMap.values());
}

function clampPercent(value: number | undefined): number {
  return Math.min(Math.max(value ?? 0, 0), 100);
}

export default function StudentDashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [progressMap, setProgressMap] = useState<
    Record<number, CourseProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchDashboardData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/students/me/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || "Unable to load your dashboard.");
      }

      const normalized = normalizeDashboard(result.data);

      setDashboard(normalized);

      const studentCourses = buildStudentCourses(normalized.enrollments);

      const progressResults = await Promise.all(
        studentCourses.map(async (item) => {
          try {
            const progressResponse = await fetch(
              `${API_URL}/course-progress/courses/${item.course.id}/progress`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!progressResponse.ok) {
              return null;
            }

            const progressJson = await progressResponse.json();
            const progress = progressJson?.data ?? progressJson;

            return {
              courseId: Number(progress?.courseId),
              totalLessons: Number(progress?.totalLessons) || 0,
              completedLessons: Number(progress?.completedLessons) || 0,
              startedLessons: Number(progress?.startedLessons) || 0,
              remainingLessons: Number(progress?.remainingLessons) || 0,
              progressPercentage: Number(progress?.progressPercentage) || 0,
            } as CourseProgress;
          } catch {
            return null;
          }
        })
      );

      const nextProgress: Record<number, CourseProgress> = {};

      for (const progress of progressResults) {
        if (progress?.courseId) {
          nextProgress[progress.courseId] = progress;
        }
      }

      setProgressMap(nextProgress);
    } catch (err) {
      console.error("Student dashboard error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const studentCourses = useMemo(
    () => (dashboard ? buildStudentCourses(dashboard.enrollments) : []),
    [dashboard]
  );

  const incompleteCourse = useMemo(
    () =>
      studentCourses.find(
        (item) => (progressMap[item.course.id]?.progressPercentage ?? 0) < 100
      ) ?? null,
    [studentCourses, progressMap]
  );

  const completedCourseCount = useMemo(
    () =>
      studentCourses.filter(
        (item) => (progressMap[item.course.id]?.progressPercentage ?? 0) === 100
      ).length,
    [studentCourses, progressMap]
  );

  const totalLessons = useMemo(
    () => Object.values(progressMap).reduce((sum, i) => sum + i.totalLessons, 0),
    [progressMap]
  );

  const completedLessons = useMemo(
    () =>
      Object.values(progressMap).reduce((sum, i) => sum + i.completedLessons, 0),
    [progressMap]
  );

  const recentPayment = useMemo(
    () =>
      [...(dashboard?.payments ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] ?? null,
    [dashboard]
  );

  const initials = useMemo(() => {
    const name = dashboard?.student.name || "Student";

    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [dashboard]);

  if (loading) {
    return (
      <>
        <main className="sd-page" aria-busy="true" aria-live="polite">
          <div className="sd-container">
            <div className="sd-skel sd-skel-hero" />
            <div className="sd-metrics">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="sd-skel sd-skel-metric" />
              ))}
            </div>
            <div className="sd-grid sd-grid-a">
              <div className="sd-skel sd-skel-panel" />
              <div className="sd-skel sd-skel-panel" />
            </div>
            <div className="sd-grid sd-grid-b">
              <div className="sd-skel sd-skel-panel" />
              <div className="sd-skel sd-skel-panel" />
            </div>
            <span className="sd-sr">Loading your dashboard</span>
          </div>
        </main>
        <style dangerouslySetInnerHTML={{ __html: dashboardCss }} />
      </>
    );
  }

  if (error || !dashboard) {
    return (
      <>
        <main className="sd-page">
          <div className="sd-container">
            <div className="sd-error" role="alert">
              <div className="sd-error-icon">
                <AlertCircle size={24} />
              </div>
              <h2>Unable to load dashboard</h2>
              <p>{error || "Something went wrong."}</p>
              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                className="sd-btn sd-btn-primary"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </main>
        <style dangerouslySetInnerHTML={{ __html: dashboardCss }} />
      </>
    );
  }

  const pendingAssignments = dashboard.assignments.length;
  const pendingQuizzes = dashboard.quizzes.length;
  const pendingTotal = pendingAssignments + pendingQuizzes;
  const pendingCourseCount = Math.max(
  studentCourses.length - completedCourseCount,
  0
);

  const completedAll =
    studentCourses.length > 0 &&
    completedCourseCount === studentCourses.length;

  const incompleteProgress = incompleteCourse
    ? progressMap[incompleteCourse.course.id]
    : undefined;
  const incompleteImage = incompleteCourse
    ? getImageUrl(incompleteCourse.course.imageUrl)
    : null;

  return (
    <>
      <main className="sd-page">
        <div className="sd-container">
          {/* HERO */}
          <section className="sd-hero">
            <div className="sd-hero-main">
              <div className="sd-logo-chip">
                <div className="sd-logo-crop">
                  <img
                    src="/skce-logo.jpg"
                    alt="SK Computer Education"
                    onError={(e) => {
                      const chip = e.currentTarget.closest(
                        ".sd-logo-chip"
                      ) as HTMLElement | null;
                      if (chip) chip.style.display = "none";
                    }}
                  />
                </div>
              </div>
              <div className="sd-eyebrow">
                <GraduationCap size={16} />
                Student Portal
              </div>
              <h1>Welcome back, {dashboard.student.name} 👋</h1>
              <p>
                Continue your learning, check what needs your attention, and
                keep moving toward your course goals.
              </p>
              <div className="sd-hero-pairs">
                <InfoPair label="Student ID" value={dashboard.student.studentId} />
                <InfoPair
                  label="Account"
                  value={dashboard.student.isActive ? "Active" : "Inactive"}
                />
                <InfoPair label="Courses" value={String(studentCourses.length)} />
              </div>
            </div>

            <div className="sd-hero-side">
              <div className="sd-hero-card">
                <div className="sd-hero-user">
                  <div className="sd-avatar sd-avatar-light">{initials}</div>
                  <div className="sd-min0">
                    <div className="sd-hero-name">{dashboard.student.name}</div>
                    <div className="sd-hero-email">{dashboard.student.email}</div>
                  </div>
                </div>
                <div className="sd-hero-mini">
                  <HeroMiniStat
                    label="Completed"
                    value={String(completedCourseCount)}
                  />
                  <HeroMiniStat label="Pending" value={String(pendingCourseCount)} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="sd-btn sd-btn-ghost-light"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "sd-spin" : undefined}
                />
                {refreshing ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>
          </section>

          {/* METRICS */}
          <section className="sd-metrics sd-stagger">
            <DashboardMetric
              icon={BookOpen}
              label="Enrolled Courses"
              value={dashboard.stats.enrolledCourses}
              detail={`${studentCourses.length} course${
                studentCourses.length === 1 ? "" : "s"
              } in your learning space`}
              tone="blue"
            />
            <DashboardMetric
              icon={GraduationCap}
              label="Active Enrollments"
              value={dashboard.stats.activeEnrollments}
              detail="Currently active enrollments"
              tone="green"
            />
            <DashboardMetric
              icon={ClipboardList}
              label="Pending Work"
              value={pendingTotal}
              detail={`${pendingAssignments} assignments · ${pendingQuizzes} quizzes`}
              tone="orange"
            />
            <DashboardMetric
              icon={CreditCard}
              label="Total Paid"
              value={formatCurrency(dashboard.stats.totalPaid)}
              detail={`${dashboard.stats.successfulPayments} successful payment${
                dashboard.stats.successfulPayments === 1 ? "" : "s"
              }`}
              tone="navy"
            />
          </section>

          {/* CONTINUE + QUICK ACTIONS */}
          <section className="sd-grid sd-grid-a">
            <div className="sd-panel">
              <SectionHeader
                icon={completedAll ? Award : Sparkles}
                title={completedAll ? "Learning complete" : "Continue Learning"}
                subtitle={
                  completedAll
                    ? "All enrolled courses are complete."
                    : "Pick up where you left off."
                }
              />

              {completedAll ? (
                <div className="sd-complete">
                  <div className="sd-complete-info">
                    <div className="sd-complete-icon">
                      <Award size={22} />
                    </div>
                    <div>
                      <div className="sd-complete-title">
                        {completedCourseCount} course
                        {completedCourseCount === 1 ? "" : "s"} completed
                      </div>
                      <div className="sd-complete-sub">
                        {completedLessons} lessons completed.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/student/certificates")}
                    className="sd-btn sd-btn-primary"
                  >
                    View Certificates
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : incompleteCourse ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/student/my-courses/${incompleteCourse.course.id}`
                    )
                  }
                  className="sd-continue"
                >
                  <div className="sd-thumb sd-thumb-lg">
                    {incompleteImage ? (
                      <img
                        src={incompleteImage}
                        alt={incompleteCourse.course.title}
                      />
                    ) : (
                      <BookOpen size={22} />
                    )}
                  </div>

                  <div className="sd-min0">
                    <div className="sd-continue-title">
                      {incompleteCourse.course.title}
                    </div>
                    <div className="sd-continue-meta">
                      <span>
                        {incompleteProgress?.completedLessons ?? 0}/
                        {incompleteProgress?.totalLessons ?? 0} lessons
                      </span>
                      <span>
                        {incompleteCourse.packageName
                          ? `Package: ${incompleteCourse.packageName}`
                          : "Direct enrollment"}
                      </span>
                    </div>
                    <ProgressBar
                      value={clampPercent(incompleteProgress?.progressPercentage)}
                    />
                  </div>

                  <div className="sd-continue-cta">
                    <span className="sd-continue-pct">
                      {Math.round(incompleteProgress?.progressPercentage ?? 0)}%
                    </span>
                    <span className="sd-continue-go">
                      <ChevronRight size={18} />
                    </span>
                  </div>
                </button>
              ) : (
                <EmptyCard
                  title="No active course"
                  message="Your next course will appear here when you are enrolled."
                />
              )}
            </div>

            <div className="sd-panel">
              <SectionHeader
                icon={CalendarDays}
                title="Quick Actions"
                subtitle="Jump to a learning area"
              />

              <div className="sd-quick-grid">
                <QuickDashboardAction
                  icon={ClipboardList}
                  title="Assignments"
                  value={
                    pendingAssignments > 0
                      ? `${pendingAssignments} pending`
                      : "All clear"
                  }
                  tone="orange"
                  onClick={() => router.push("/dashboard/student/assignments")}
                />
                <QuickDashboardAction
                  icon={BarChart3}
                  title="Quizzes"
                  value={
                    pendingQuizzes > 0 ? `${pendingQuizzes} pending` : "All clear"
                  }
                  tone="blue"
                  onClick={() => router.push("/dashboard/student/assignments")}
                />
                <QuickDashboardAction
                  icon={Award}
                  title="Certificates"
                  value={
                    completedCourseCount > 0
                      ? `${completedCourseCount} earned`
                      : "View achievements"
                  }
                  tone="navy"
                  onClick={() => router.push("/dashboard/student/certificates")}
                />
                <QuickDashboardAction
                  icon={CalendarDays}
                  title="Calendar"
                  value="View meetings"
                  tone="green"
                  onClick={() => router.push("/dashboard/student/calendar")}
                />
              </div>

              <div className="sd-completion">
                <div className="sd-completion-row">
                  <span>Course completion</span>
                  <b>
                    {studentCourses.length > 0
                      ? `${Math.round(
                          (completedCourseCount / studentCourses.length) * 100
                        )}%`
                      : "0%"}
                  </b>
                </div>
                <ProgressBar
                  value={
                    studentCourses.length > 0
                      ? (completedCourseCount / studentCourses.length) * 100
                      : 0
                  }
                  slim
                />
                <div className="sd-completion-sub">
                  {completedCourseCount} / {studentCourses.length} completed
                </div>
              </div>
            </div>
          </section>

          {/* COURSES + ACCOUNT */}
          <section className="sd-grid sd-grid-b">
            <div className="sd-panel">
              <SectionHeader
                icon={BookOpen}
                title="My Courses"
                subtitle={`${studentCourses.length} enrolled course${
                  studentCourses.length === 1 ? "" : "s"
                }`}
              />

              {studentCourses.length === 0 ? (
                <EmptyCard
                  title="No enrolled courses"
                  message="Your enrolled courses will appear here."
                />
              ) : (
                <div className="sd-course-grid sd-stagger">
                  {studentCourses.slice(0, 4).map((item) => {
                    const progress = progressMap[item.course.id];
                    const percentage = clampPercent(progress?.progressPercentage);
                    const image = getImageUrl(item.course.imageUrl);

                    return (
                      <button
                        key={item.course.id}
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/student/my-courses/${item.course.id}`
                          )
                        }
                        className="sd-course"
                      >
                        <div className="sd-course-top">
                          <div className="sd-thumb">
                            {image ? (
                              <img src={image} alt={item.course.title} />
                            ) : (
                              <BookOpen size={17} />
                            )}
                          </div>
                          <div className="sd-min0 sd-grow">
                            <div className="sd-course-title">
                              {item.course.title}
                            </div>
                            <div className="sd-course-pkg">
                              {item.packageName || "Direct enrollment"}
                            </div>
                          </div>
                        </div>

                        <div className="sd-course-row">
                          <span>
                            {progress?.completedLessons ?? 0}/
                            {progress?.totalLessons ?? 0} lessons
                          </span>
                          <span className="sd-badge">
                            {formatStatus(item.enrollmentStatus)}
                          </span>
                          <b>{Math.round(percentage)}%</b>
                        </div>
                        <ProgressBar value={percentage} slim />
                      </button>
                    );
                  })}
                </div>
              )}

              {studentCourses.length > 4 ? (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/student/my-courses")}
                  className="sd-btn sd-btn-secondary sd-btn-block"
                >
                  View all {studentCourses.length} courses
                  <ArrowRight size={15} />
                </button>
              ) : null}
            </div>

            <div className="sd-panel">
              <SectionHeader
                icon={GraduationCap}
                title="Account Snapshot"
                subtitle="Your current SKCE account"
              />

              <div className="sd-account-user">
                <div className="sd-avatar">{initials}</div>
                <div className="sd-min0">
                  <div className="sd-account-name">{dashboard.student.name}</div>
                  <div className="sd-account-email">{dashboard.student.email}</div>
                </div>
              </div>

              <div className="sd-account-grid">
                <SmallAccountCard
                  label="Successful Payments"
                  value={dashboard.stats.successfulPayments}
                />
                <SmallAccountCard
                  label="Courses Completed"
                  value={completedCourseCount}
                />
                <SmallAccountCard
                  label="Lessons Completed"
                  value={`${completedLessons}/${totalLessons}`}
                />
                <SmallAccountCard
                  label="Account"
                  value={dashboard.student.isActive ? "Active" : "Inactive"}
                />
              </div>

              {recentPayment ? (
                <div className="sd-payment">
                  <span>Latest payment</span>
                  <strong>
                    {formatCurrency(recentPayment.amount, recentPayment.currency)}
                  </strong>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => router.push("/dashboard/student/profile")}
                className="sd-btn sd-btn-secondary sd-btn-block"
              >
                View Profile
                <ArrowRight size={15} />
              </button>
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="sd-panel sd-activity">
            <SectionHeader
              icon={CheckCircle2}
              title="Recent Activity"
              subtitle="Your latest activity in SKCE"
            />

            {dashboard.recentActivity.length === 0 ? (
              <EmptyCard
                title="No recent activity"
                message="Your learning actions will appear here as you use the portal."
              />
            ) : (
              <div className="sd-activity-grid">
                {dashboard.recentActivity.slice(0, 6).map((activity, index) => (
                  <div key={`activity-${index}`} className="sd-activity-item">
                    <div className="sd-activity-icon">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="sd-min0">
                      <div className="sd-activity-text">{safeText(activity)}</div>
                      <div className="sd-activity-sub">Recent student activity</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* FOOTER ACTIONS */}
          <section className="sd-footer sd-stagger">
            <FooterAction
              icon={BookOpen}
              title="My Courses"
              description="Open your enrolled courses"
              onClick={() => router.push("/dashboard/student/my-courses")}
            />
            <FooterAction
              icon={ClipboardList}
              title="Assignments & Quizzes"
              description="Open your learning work"
              onClick={() => router.push("/dashboard/student/assignments")}
            />
            <FooterAction
              icon={Award}
              title="Certificates"
              description="View earned certificates"
              onClick={() => router.push("/dashboard/student/certificates")}
            />
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: dashboardCss }} />
    </>
  );
}

function ProgressBar({ value, slim }: { value: number; slim?: boolean }) {
  return (
    <div
      className={`sd-bar${slim ? " sd-bar-slim" : ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: `${clampPercent(value)}%` }} />
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="sd-pair">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HeroMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sd-mini">
      <div>{label}</div>
      <b>{value}</b>
    </div>
  );
}

type Tone = "blue" | "green" | "orange" | "navy";

function DashboardMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className="sd-metric">
      <div className={`sd-icon sd-tone-${tone}`}>
        <Icon size={20} />
      </div>
      <div className="sd-min0">
        <div className="sd-metric-label">{label}</div>
        <div className="sd-metric-value">{safeText(value)}</div>
        <div className="sd-metric-detail">{detail}</div>
      </div>
    </div>
  );
}

function QuickDashboardAction({
  icon: Icon,
  title,
  value,
  tone,
  onClick,
}: {
  icon: ElementType;
  title: string;
  value: string;
  tone: Tone;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="sd-quick">
      <div className={`sd-icon sd-icon-sm sd-tone-${tone}`}>
        <Icon size={17} />
      </div>
      <div className="sd-min0 sd-grow">
        <div className="sd-quick-title">{title}</div>
        <div className="sd-quick-value">{value}</div>
      </div>
      <ArrowRight size={15} className="sd-arrow" />
    </button>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="sd-section-head">
      <div className="sd-icon sd-tone-blue">
        <Icon size={19} />
      </div>
      <div className="sd-min0">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function SmallAccountCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="sd-small">
      <div>{label}</div>
      <b>{safeText(value)}</b>
    </div>
  );
}

function FooterAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="sd-footer-item">
      <div className="sd-icon sd-icon-sm sd-tone-blue">
        <Icon size={17} />
      </div>
      <div className="sd-min0 sd-grow">
        <div className="sd-footer-title">{title}</div>
        <div className="sd-footer-desc">{description}</div>
      </div>
      <ArrowRight size={15} className="sd-arrow" />
    </button>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="sd-empty">
      <div className="sd-empty-icon">
        <BookOpen size={20} />
      </div>
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

const dashboardCss = `
.sd-page{
  --navy:#0F2F5F; --navy-2:#123B6D; --blue:#1459B8; --blue-2:#2563EB;
  --orange:#FF6B00; --orange-2:#E85F00; --orange-tint:#FFF3EA;
  --bg:#F7F9FC; --card:#FFFFFF; --line:#E2E8F1; --line-2:#EDF1F7;
  --text:#0F2F5F; --muted:#64748B; --soft:#8A97AB;
  --green:#15803D; --green-tint:#E8F6EE; --blue-tint:#EAF1FD;
  flex:1; min-width:0; width:100%; box-sizing:border-box;
  padding:28px 32px 48px; background:var(--bg); color:var(--text);
  animation:sd-page-in 280ms ease-out both;
}
.sd-page *{box-sizing:border-box}
.sd-container{width:100%; max-width:1360px; margin:0 auto}
.sd-min0{min-width:0}
.sd-grow{flex:1}
.sd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@keyframes sd-page-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes sd-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes sd-grow-x{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes sd-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes studentDashboardSpin{to{transform:rotate(360deg)}}
.sd-spin{animation:studentDashboardSpin .8s linear infinite}

.sd-stagger>*{animation:sd-rise 260ms ease-out both}
.sd-stagger>*:nth-child(2){animation-delay:40ms}
.sd-stagger>*:nth-child(3){animation-delay:80ms}
.sd-stagger>*:nth-child(4){animation-delay:120ms}

/* Buttons */
.sd-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  height:42px;padding:0 18px;border-radius:10px;border:1px solid transparent;
  font:inherit;font-size:14px;font-weight:600;line-height:1;cursor:pointer;
  transition:background-color 160ms ease,border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease,color 160ms ease;
}
.sd-btn:focus-visible,.sd-continue:focus-visible,.sd-course:focus-visible,.sd-quick:focus-visible,.sd-footer-item:focus-visible{
  outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.28);
}
.sd-btn:active{transform:translateY(0) scale(.99)}
.sd-btn:disabled{opacity:.65;cursor:not-allowed}
.sd-btn-primary{background:linear-gradient(180deg,#FF8A12 0%,#FF6B00 55%,#F25A00 100%);color:#fff}
.sd-btn-primary:hover{background:linear-gradient(180deg,#FF7E00 0%,#F26000 55%,#E25200 100%);transform:translateY(-1px);box-shadow:0 6px 16px rgba(255,107,0,.28)}
.sd-logo-chip{display:inline-block;margin-bottom:16px;padding:6px;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.14)}
.sd-logo-crop{width:132px;height:78px;overflow:hidden;border-radius:8px}
.sd-logo-crop img{display:block;width:151px;max-width:none;margin:-29px 0 0 -10px}
.sd-btn-secondary{background:#fff;color:var(--blue);border-color:var(--line)}
.sd-btn-secondary:hover{background:var(--blue-tint);border-color:#CFE0FA;transform:translateY(-1px)}
.sd-btn-ghost-light{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.28);width:100%;height:40px}
.sd-btn-ghost-light:hover:not(:disabled){background:rgba(255,255,255,.2)}
.sd-btn-block{width:100%;margin-top:14px}

/* Hero */
.sd-hero{
  position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:28px;
  margin-bottom:20px;padding:28px 32px;border-radius:16px;color:#fff;
  background:linear-gradient(135deg,var(--navy) 0%,var(--navy-2) 55%,var(--blue) 100%);
  box-shadow:0 10px 28px rgba(15,47,95,.16);
}
.sd-hero::after{
  content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;
  background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 18%,transparent 18%);
}
.sd-hero-main,.sd-hero-side{position:relative;z-index:1;min-width:0}
.sd-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px;font-size:13px;font-weight:600;color:#C9DBF5}
.sd-hero h1{margin:0;font-size:clamp(26px,2.6vw,34px);line-height:1.2;font-weight:700;letter-spacing:-.02em;color:#fff}
.sd-hero p{max-width:640px;margin:10px 0 0;font-size:15px;line-height:1.6;color:#D3E1F5}
.sd-hero-pairs{display:flex;flex-wrap:wrap;gap:12px 32px;margin-top:20px}
.sd-pair{display:flex;flex-direction:column;gap:4px}
.sd-pair span{font-size:12px;color:#B7C9E4}
.sd-pair strong{font-size:14px;font-weight:600;color:#fff}
.sd-hero-side{display:flex;flex-direction:column;justify-content:space-between;gap:12px}
.sd-hero-card{padding:16px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.sd-hero-user{display:flex;align-items:center;gap:12px}
.sd-hero-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:#fff}
.sd-hero-email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:12px;color:#C3D4EC}
.sd-hero-mini{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}
.sd-mini{padding:9px 11px;border-radius:9px;background:rgba(255,255,255,.1)}
.sd-mini div{font-size:12px;color:#B7C9E4}
.sd-mini b{display:block;margin-top:2px;font-size:18px;font-weight:700;color:#fff}

.sd-avatar{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--blue-tint);color:var(--blue);font-size:13px;font-weight:700}
.sd-avatar-light{background:#fff;color:var(--navy)}

/* Icons */
.sd-icon{width:40px;height:40px;flex:0 0 40px;display:flex;align-items:center;justify-content:center;border-radius:10px}
.sd-icon-sm{width:36px;height:36px;flex-basis:36px}
.sd-tone-blue{background:var(--blue-tint);color:var(--blue)}
.sd-tone-green{background:var(--green-tint);color:var(--green)}
.sd-tone-orange{background:var(--orange-tint);color:var(--orange)}
.sd-tone-navy{background:#E6ECF5;color:var(--navy)}

/* Metrics */
.sd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px}
.sd-metric{display:flex;align-items:flex-start;gap:14px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04);transition:box-shadow 200ms ease,transform 200ms ease,border-color 200ms ease}
.sd-metric:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,47,95,.08);border-color:#D4DEEC}
.sd-metric-label{font-size:13px;color:var(--muted)}
.sd-metric-value{margin-top:4px;font-size:24px;line-height:1.15;font-weight:700;color:var(--navy)}
.sd-metric-detail{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:5px;font-size:12px;color:var(--soft)}

/* Grids & panels */
.sd-grid{display:grid;gap:20px;margin-bottom:20px}
.sd-grid-a{grid-template-columns:minmax(0,1.55fr) minmax(320px,.85fr)}
.sd-grid-b{grid-template-columns:minmax(0,1.45fr) minmax(320px,.85fr)}
.sd-panel{min-width:0;padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03)}
.sd-activity{margin-bottom:20px}
.sd-section-head{display:flex;align-items:center;gap:12px}
.sd-section-head h2{margin:0;font-size:17px;line-height:1.3;font-weight:700;color:var(--navy)}
.sd-section-head p{margin:3px 0 0;font-size:13px;color:var(--muted)}

/* Continue learning */
.sd-continue{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:14px;background:#FBFCFE;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color 180ms ease,box-shadow 180ms ease,transform 180ms ease}
.sd-continue:hover{border-color:#BFD3F2;box-shadow:0 8px 20px rgba(15,47,95,.08);transform:translateY(-1px)}
.sd-thumb{width:38px;height:38px;flex:0 0 38px;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--blue-tint);color:var(--blue)}
.sd-thumb-lg{width:56px;height:56px;flex-basis:56px;border-radius:12px}
.sd-thumb img{width:100%;height:100%;object-fit:cover;transition:transform 300ms ease}
.sd-continue:hover .sd-thumb img,.sd-course:hover .sd-thumb img{transform:scale(1.05)}
.sd-continue-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;color:var(--navy)}
.sd-continue-meta{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px;font-size:12.5px;color:var(--muted)}
.sd-continue-cta{display:flex;align-items:center;gap:10px}
.sd-continue-pct{font-size:15px;font-weight:700;color:var(--blue)}
.sd-continue-go{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(180deg,#FF8A12,#F25A00);color:#fff;transition:transform 180ms ease,background-color 180ms ease}
.sd-continue:hover .sd-continue-go{background:var(--orange-2);transform:translateX(2px)}

.sd-bar{height:8px;overflow:hidden;margin-top:12px;border-radius:999px;background:#E6ECF5}
.sd-bar-slim{height:6px;margin-top:8px}
.sd-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transform-origin:left;animation:sd-grow-x 700ms ease-out both}

.sd-complete{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-top:18px;padding:18px;border:1px solid #FFD9BD;border-radius:14px;background:var(--orange-tint)}
.sd-complete-info{display:flex;align-items:center;gap:14px}
.sd-complete-icon{width:46px;height:46px;flex:0 0 46px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#FFE3CD;color:var(--orange)}
.sd-complete-title{font-size:15px;font-weight:700;color:var(--navy)}
.sd-complete-sub{margin-top:3px;font-size:13px;color:var(--muted)}

/* Quick actions */
.sd-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}
.sd-quick,.sd-footer-item{display:flex;align-items:center;gap:10px;width:100%;min-width:0;border:1px solid var(--line);background:#fff;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color 180ms ease,box-shadow 180ms ease,transform 180ms ease,background-color 180ms ease}
.sd-quick{padding:12px;border-radius:12px;min-height:58px}
.sd-quick:hover,.sd-footer-item:hover{border-color:#BFD3F2;box-shadow:0 6px 16px rgba(15,47,95,.07);transform:translateY(-1px)}
.sd-quick-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;color:var(--navy)}
.sd-quick-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:12px;color:var(--muted)}
.sd-arrow{flex:0 0 auto;color:#A3B0C4;transition:transform 180ms ease,color 180ms ease}
.sd-quick:hover .sd-arrow,.sd-footer-item:hover .sd-arrow{transform:translateX(2px);color:var(--orange)}

.sd-completion{margin-top:14px;padding:14px;border:1px solid var(--line-2);border-radius:12px;background:#F8FAFD}
.sd-completion-row{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted)}
.sd-completion-row b{font-size:14px;color:var(--blue)}
.sd-completion-sub{margin-top:8px;font-size:12.5px;font-weight:600;color:var(--navy)}
.sd-completion .sd-bar{margin-top:10px}

/* Courses */
.sd-course-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
.sd-course{width:100%;min-width:0;padding:16px;border:1px solid var(--line);border-radius:12px;background:#FBFCFE;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color 180ms ease,box-shadow 180ms ease,transform 180ms ease}
.sd-course:hover{border-color:#BFD3F2;box-shadow:0 8px 20px rgba(15,47,95,.08);transform:translateY(-2px)}
.sd-course-top{display:flex;align-items:flex-start;gap:12px}
.sd-course-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.sd-course-pkg{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:12px;color:var(--muted)}
.sd-course-row{display:flex;align-items:center;gap:8px;margin-top:14px;font-size:12px;color:var(--muted)}
.sd-course-row span:first-child{flex:1;min-width:0}
.sd-course-row b{color:var(--blue);font-size:13px}
.sd-badge{padding:2px 8px;border-radius:6px;background:var(--green-tint);color:var(--green);font-size:11px;font-weight:600}

/* Account */
.sd-account-user{display:flex;align-items:center;gap:12px;margin-top:18px;padding:14px;border:1px solid var(--line-2);border-radius:12px;background:#F8FAFD}
.sd-account-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.sd-account-email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:12.5px;color:var(--muted)}
.sd-account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
.sd-small{padding:12px;border:1px solid var(--line-2);border-radius:10px;background:#fff}
.sd-small div{font-size:12px;color:var(--muted)}
.sd-small b{display:block;margin-top:4px;font-size:16px;font-weight:700;color:var(--navy)}
.sd-payment{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:12px 14px;border:1px solid var(--line-2);border-radius:10px;background:#F8FAFD;font-size:13px;color:var(--muted)}
.sd-payment strong{font-size:14px;color:var(--navy)}

/* Activity */
.sd-activity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px;margin-top:10px}
.sd-activity-item{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--line-2)}
.sd-activity-icon{width:32px;height:32px;flex:0 0 32px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--green-tint);color:var(--green)}
.sd-activity-text{font-size:14px;line-height:1.45;font-weight:500;color:var(--navy);word-break:break-word}
.sd-activity-sub{margin-top:3px;font-size:12px;color:var(--soft)}

/* Footer actions */
.sd-footer{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.sd-footer-item{padding:14px 16px;border-radius:12px}
.sd-footer-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.sd-footer-desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:12px;color:var(--muted)}

/* Empty / error */
.sd-empty{min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;margin-top:16px;padding:24px;border:1px dashed #CBD6E6;border-radius:14px;background:#FAFBFE;text-align:center}
.sd-empty-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;border-radius:12px;background:var(--blue-tint);color:var(--blue)}
.sd-empty strong{font-size:14px;color:var(--navy)}
.sd-empty span{max-width:380px;font-size:13px;line-height:1.5;color:var(--muted)}
.sd-error{min-height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;border:1px solid #F3D1D1;border-radius:16px;background:#fff;text-align:center}
.sd-error-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#FDECEC;color:#C62828}
.sd-error h2{margin:16px 0 0;font-size:18px;font-weight:700;color:var(--navy)}
.sd-error p{max-width:480px;margin:8px 0 20px;font-size:14px;line-height:1.6;color:var(--muted)}

/* Skeleton */
.sd-skel{border-radius:16px;background:linear-gradient(90deg,#E9EEF6 25%,#F4F7FB 37%,#E9EEF6 63%);background-size:800px 100%;animation:sd-shimmer 1.4s ease infinite}
.sd-skel-hero{height:200px;margin-bottom:20px}
.sd-skel-metric{height:104px}
.sd-skel-panel{height:250px}
.sd-container>.sd-metrics,.sd-container>.sd-grid{margin-bottom:20px}

/* Responsive */
@media (max-width:1120px){
  .sd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sd-grid-a,.sd-grid-b{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:820px){
  .sd-page{padding:20px 16px 32px}
  .sd-hero{grid-template-columns:minmax(0,1fr);padding:24px 20px}
  .sd-footer{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sd-activity-grid{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:620px){
  .sd-metrics,.sd-footer,.sd-course-grid{grid-template-columns:minmax(0,1fr)}
  .sd-panel{padding:18px}
  .sd-hero h1{font-size:25px}
  .sd-quick-grid{grid-template-columns:minmax(0,1fr)}
  .sd-continue{grid-template-columns:auto minmax(0,1fr);}
  .sd-continue-cta{grid-column:1 / -1;justify-content:space-between}
  .sd-btn{height:44px}
  .sd-complete .sd-btn{width:100%}
}
@media (prefers-reduced-motion:reduce){
  .sd-page,.sd-stagger>*,.sd-bar span,.sd-skel{animation:none!important}
  .sd-metric,.sd-continue,.sd-course,.sd-quick,.sd-footer-item,.sd-btn{transition:none!important}
}
`;
