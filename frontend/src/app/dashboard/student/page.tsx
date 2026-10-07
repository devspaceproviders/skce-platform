"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
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
  UserCircle,
  X,
  ChevronDown,
  Package,
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

type MetricKey = "courses" | "active" | "pending" | "paid";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function clampPercent(value: number | undefined): number {
  return Math.min(Math.max(value ?? 0, 0), 100);
}

/* Staggered entrance helper: sets --i used by .sd-reveal */
function reveal(index: number): CSSProperties {
  return { ["--i" as string]: index } as CSSProperties;
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
  const [hoverMetric, setHoverMetric] = useState<MetricKey | null>(null);
  const [pinnedMetric, setPinnedMetric] = useState<MetricKey | null>(null);
  const [lastMetric, setLastMetric] = useState<MetricKey>("courses");
  const [quickHint, setQuickHint] = useState<string | null>(null);
  const shownMetric = hoverMetric ?? pinnedMetric;

  useEffect(() => {
    if (shownMetric) {
      setLastMetric(shownMetric);
    }
  }, [shownMetric]);

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

  const completedAll =
    studentCourses.length > 0 &&
    completedCourseCount === studentCourses.length;

  const completionPercent =
    studentCourses.length > 0
      ? (completedCourseCount / studentCourses.length) * 100
      : 0;

  const incompleteProgress = incompleteCourse
    ? progressMap[incompleteCourse.course.id]
    : undefined;
  const incompleteImage = incompleteCourse
    ? getImageUrl(incompleteCourse.course.imageUrl)
    : null;

  const overallLessonPercent =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const togglePin = (key: MetricKey) =>
    setPinnedMetric((prev) => (prev === key ? null : key));

  const sortedPayments = [...dashboard.payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const metricMeta: Record<
    MetricKey,
    { icon: ElementType; title: string; subtitle: string }
  > = {
    courses: {
      icon: BookOpen,
      title: "Enrolled Courses",
      subtitle: `${studentCourses.length} course${
        studentCourses.length === 1 ? "" : "s"
      } in your learning space`,
    },
    active: {
      icon: GraduationCap,
      title: "Active Enrollments",
      subtitle: `${dashboard.stats.activeEnrollments} currently active`,
    },
    pending: {
      icon: ClipboardList,
      title: "Pending Work",
      subtitle: `${pendingAssignments} assignments · ${pendingQuizzes} quizzes`,
    },
    paid: {
      icon: CreditCard,
      title: "Payments",
      subtitle: `${formatCurrency(dashboard.stats.totalPaid)} paid in total`,
    },
  };

  let metricBody: ReactNode = null;

  if (lastMetric === "courses") {
    metricBody =
      studentCourses.length === 0 ? (
        <EmptyCard
          title="No enrolled courses"
          message="Your enrolled courses will appear here."
        />
      ) : (
        <>
          <div className="sd-drows">
            {studentCourses.slice(0, 6).map((item) => {
              const p = progressMap[item.course.id];
              const img = getImageUrl(item.course.imageUrl);

              return (
                <button
                  key={item.course.id}
                  type="button"
                  className="sd-drow"
                  onClick={() =>
                    router.push(`/dashboard/student/my-courses/${item.course.id}`)
                  }
                >
                  <div className="sd-thumb">
                    {img ? (
                      <img src={img} alt={item.course.title} />
                    ) : (
                      <BookOpen size={16} />
                    )}
                  </div>
                  <div className="sd-min0 sd-grow">
                    <div className="sd-course-title">{item.course.title}</div>
                    <div className="sd-course-pkg">
                      {item.packageName || "Direct enrollment"} ·{" "}
                      {p?.completedLessons ?? 0}/{p?.totalLessons ?? 0} lessons
                    </div>
                  </div>
                  <b className="sd-next-pct">
                    {Math.round(p?.progressPercentage ?? 0)}%
                  </b>
                  <ChevronRight size={16} className="sd-arrow" />
                </button>
              );
            })}
          </div>
          {studentCourses.length > 6 ? (
            <button
              type="button"
              onClick={() => router.push("/dashboard/student/my-courses")}
              className="sd-btn sd-btn-secondary sd-btn-block"
            >
              View all {studentCourses.length} courses
              <ArrowRight size={15} />
            </button>
          ) : null}
        </>
      );
  } else if (lastMetric === "active") {
    metricBody =
      dashboard.enrollments.length === 0 ? (
        <EmptyCard
          title="No enrollments yet"
          message="Your enrollments will appear here."
        />
      ) : (
        <div className="sd-drows">
          {dashboard.enrollments.slice(0, 6).map((enrollment, index) => {
            const isPackage = Boolean(enrollment.package);
            const name =
              enrollment.package?.title ?? enrollment.course?.title ?? "Enrollment";
            const isActive = enrollment.status.toUpperCase().includes("ACTIVE");

            return (
              <div key={`${enrollment.id}-${index}`} className="sd-drow sd-drow-static">
                <div className="sd-icon sd-icon-sm sd-tone-green">
                  {isPackage ? <Package size={16} /> : <BookOpen size={16} />}
                </div>
                <div className="sd-min0 sd-grow">
                  <div className="sd-course-title">{name}</div>
                  <div className="sd-course-pkg">
                    {isPackage ? "Package" : "Course"} · Enrolled{" "}
                    {formatDate(enrollment.enrolledAt)}
                  </div>
                </div>
                <span className={`sd-badge${isActive ? "" : " sd-badge-warn"}`}>
                  {formatStatus(enrollment.status)}
                </span>
              </div>
            );
          })}
        </div>
      );
  } else if (lastMetric === "pending") {
    metricBody =
      pendingTotal === 0 ? (
        <EmptyCard
          title="You're all caught up"
          message="No assignments or quizzes are waiting for you right now."
        />
      ) : (
        <>
          <div className="sd-pend">
            <div className="sd-pend-box">
              <ClipboardList size={18} />
              <b>{pendingAssignments}</b>
              <span>Assignments</span>
            </div>
            <div className="sd-pend-box">
              <BarChart3 size={18} />
              <b>{pendingQuizzes}</b>
              <span>Quizzes</span>
            </div>
          </div>
          <div className="sd-drows">
            {[...dashboard.assignments, ...dashboard.quizzes]
              .slice(0, 6)
              .map((item, index) => (
                <div key={`pending-${index}`} className="sd-drow sd-drow-static">
                  <div className="sd-icon sd-icon-sm sd-tone-orange">
                    <ClipboardList size={16} />
                  </div>
                  <div className="sd-min0 sd-grow">
                    <div className="sd-course-title">{safeText(item)}</div>
                    <div className="sd-course-pkg">Waiting for you</div>
                  </div>
                </div>
              ))}
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/student/assignments")}
            className="sd-btn sd-btn-primary sd-btn-block"
          >
            Open Assignments & Quizzes
            <ArrowRight size={15} />
          </button>
        </>
      );
  } else {
    metricBody =
      sortedPayments.length === 0 ? (
        <EmptyCard
          title="No payments yet"
          message="Your payment history will appear here."
        />
      ) : (
        <div className="sd-drows">
          {sortedPayments.slice(0, 6).map((payment, index) => {
            const ok = /SUCCESS|PAID|COMPLETED/i.test(payment.status);

            return (
              <div key={`${payment.id}-${index}`} className="sd-drow sd-drow-static">
                <div className="sd-icon sd-icon-sm sd-tone-navy">
                  <CreditCard size={16} />
                </div>
                <div className="sd-min0 sd-grow">
                  <div className="sd-course-title">
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                  <div className="sd-course-pkg">
                    {payment.method} · {formatDate(payment.paidAt ?? payment.createdAt)}
                  </div>
                </div>
                <span className={`sd-badge${ok ? "" : " sd-badge-warn"}`}>
                  {formatStatus(payment.status)}
                </span>
              </div>
            );
          })}
        </div>
      );
  }

  const MetricDetailIcon = metricMeta[lastMetric].icon;

  const otherCourses = studentCourses
    .filter(
      (item) =>
        item.course.id !== incompleteCourse?.course.id &&
        (progressMap[item.course.id]?.progressPercentage ?? 0) < 100
    )
    .slice(0, 3);

  return (
    <>
      <main className="sd-page">
        <div className="sd-container">
          {/* HERO */}
          <section className="sd-hero sd-reveal" style={reveal(0)}>
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
              <h1>
                Welcome back, {dashboard.student.name}{" "}
                <span className="sd-wave" aria-hidden="true">
                  👋
                </span>
              </h1>
              <p>
                Continue your learning, check what needs your attention, and
                keep moving toward your course goals.
              </p>

              <div className="sd-hero-pills">
                <span className="sd-pill">
                  <span className="sd-pill-label">Student ID</span>
                  <strong>{dashboard.student.studentId}</strong>
                </span>
                <span
                  className={`sd-pill ${
                    dashboard.student.isActive ? "sd-pill-on" : ""
                  }`}
                >
                  <span className="sd-dot" />
                  <strong>
                    {dashboard.student.isActive ? "Active" : "Inactive"}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="sd-btn sd-btn-ghost-light sd-refresh"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "sd-spin" : "sd-refresh-icon"}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </section>

          {/* METRICS + DETAIL (hover to preview, click to pin) */}
          <div
            className="sd-metric-zone"
            onMouseLeave={() => setHoverMetric(null)}
          >
            <section className="sd-metrics">
              <DashboardMetric
                index={1}
                icon={BookOpen}
                label="Enrolled Courses"
                value={dashboard.stats.enrolledCourses}
                detail={`${studentCourses.length} course${
                  studentCourses.length === 1 ? "" : "s"
                } in your learning space`}
                tone="blue"
                active={shownMetric === "courses"}
                pinned={pinnedMetric === "courses"}
                onEnter={() => setHoverMetric("courses")}
                onToggle={() => togglePin("courses")}
              />
              <DashboardMetric
                index={2}
                icon={GraduationCap}
                label="Active Enrollments"
                value={dashboard.stats.activeEnrollments}
                detail="Currently active enrollments"
                tone="green"
                active={shownMetric === "active"}
                pinned={pinnedMetric === "active"}
                onEnter={() => setHoverMetric("active")}
                onToggle={() => togglePin("active")}
              />
              <DashboardMetric
                index={3}
                icon={ClipboardList}
                label="Pending Work"
                value={pendingTotal}
                detail={`${pendingAssignments} assignments · ${pendingQuizzes} quizzes`}
                tone="orange"
                active={shownMetric === "pending"}
                pinned={pinnedMetric === "pending"}
                onEnter={() => setHoverMetric("pending")}
                onToggle={() => togglePin("pending")}
              />
              <DashboardMetric
                index={4}
                icon={CreditCard}
                label="Total Paid"
                value={dashboard.stats.totalPaid}
                format={(n) => formatCurrency(n)}
                detail={`${dashboard.stats.successfulPayments} successful payment${
                  dashboard.stats.successfulPayments === 1 ? "" : "s"
                }`}
                tone="navy"
                active={shownMetric === "paid"}
                pinned={pinnedMetric === "paid"}
                onEnter={() => setHoverMetric("paid")}
                onToggle={() => togglePin("paid")}
              />
            </section>

            <div className={`sd-detail${shownMetric ? " is-open" : ""}`}>
              <div className="sd-detail-inner">
                <div className="sd-detail-card" key={lastMetric}>
                  <div className="sd-detail-head">
                    <SectionHeader
                      icon={MetricDetailIcon}
                      title={metricMeta[lastMetric].title}
                      subtitle={metricMeta[lastMetric].subtitle}
                    />
                    {pinnedMetric === lastMetric ? (
                      <button
                        type="button"
                        className="sd-pinchip"
                        onClick={() => setPinnedMetric(null)}
                        aria-label="Close details"
                      >
                        Pinned
                        <X size={13} />
                      </button>
                    ) : (
                      <span className="sd-detail-hint">
                        Click the card to keep this open
                      </span>
                    )}
                  </div>
                  {metricBody}
                </div>
              </div>
            </div>
          </div>

          {/* CONTINUE + QUICK ACTIONS */}
          <section className="sd-grid sd-grid-a">
            <div className="sd-panel sd-reveal" style={reveal(5)}>
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

              {studentCourses.length > 0 ? (
                <div className="sd-overview">
                  <div className="sd-ring">
                    <svg viewBox="0 0 88 88" width="88" height="88" aria-hidden="true">
                      <circle className="sd-ring-bg" cx="44" cy="44" r="36" />
                      <circle
                        className="sd-ring-fg"
                        cx="44"
                        cy="44"
                        r="36"
                        style={{
                          strokeDasharray: 226.2,
                          strokeDashoffset:
                            226.2 * (1 - clampPercent(overallLessonPercent) / 100),
                        }}
                      />
                    </svg>
                    <div className="sd-ring-text">
                      <CountUp
                        value={Math.round(overallLessonPercent)}
                        format={(n) => `${n}%`}
                      />
                    </div>
                  </div>
                  <div className="sd-min0">
                    <div className="sd-overview-title">Overall lesson progress</div>
                    <div className="sd-overview-sub">
                      {completedLessons} of {totalLessons} lessons completed across{" "}
                      {studentCourses.length} course
                      {studentCourses.length === 1 ? "" : "s"}
                    </div>
                    <div className="sd-chips">
                      <span className="sd-chip">
                        {Math.max(totalLessons - completedLessons, 0)} lessons to go
                      </span>
                      <span className="sd-chip sd-chip-orange">
                        {studentCourses.length - completedCourseCount} in progress
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {otherCourses.length > 0 ? (
                <div className="sd-next">
                  <div className="sd-next-title">Also in progress</div>
                  {otherCourses.map((item) => {
                    const p = progressMap[item.course.id];
                    const img = getImageUrl(item.course.imageUrl);

                    return (
                      <button
                        key={item.course.id}
                        type="button"
                        className="sd-next-item"
                        onClick={() =>
                          router.push(
                            `/dashboard/student/my-courses/${item.course.id}`
                          )
                        }
                      >
                        <div className="sd-thumb">
                          {img ? (
                            <img src={img} alt={item.course.title} />
                          ) : (
                            <BookOpen size={16} />
                          )}
                        </div>
                        <div className="sd-min0 sd-grow">
                          <div className="sd-course-title">{item.course.title}</div>
                          <div className="sd-course-pkg">
                            {p?.completedLessons ?? 0}/{p?.totalLessons ?? 0} lessons
                          </div>
                        </div>
                        <b className="sd-next-pct">
                          {Math.round(p?.progressPercentage ?? 0)}%
                        </b>
                        <ChevronRight size={16} className="sd-arrow" />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="sd-panel sd-reveal" style={reveal(6)}>
              <SectionHeader
                icon={CalendarDays}
                title="Quick Actions"
                subtitle="Jump to a learning area"
              />

              <div className={`sd-quick-hint${quickHint ? " is-on" : ""}`} key={quickHint ?? "idle"}>
                {quickHint ?? "Hover an action to see what's inside"}
              </div>

              <div className="sd-quick-grid">
                <QuickDashboardAction
                  icon={BookOpen}
                  title="My Courses"
                  hint={"Open your enrolled courses and keep learning"}
                  onHint={setQuickHint}
                  value={`${studentCourses.length} enrolled`}
                  tone="blue"
                  onClick={() => router.push("/dashboard/student/my-courses")}
                />
                <QuickDashboardAction
                  icon={ClipboardList}
                  title="Assignments"
                  hint={pendingAssignments > 0 ? `${pendingAssignments} assignment${pendingAssignments === 1 ? "" : "s"} waiting for you` : "No assignments pending. You are all caught up"}
                  onHint={setQuickHint}
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
                  hint={pendingQuizzes > 0 ? `${pendingQuizzes} quiz${pendingQuizzes === 1 ? "" : "zes"} waiting for you` : "No quizzes pending. You are all caught up"}
                  onHint={setQuickHint}
                  value={
                    pendingQuizzes > 0 ? `${pendingQuizzes} pending` : "All clear"
                  }
                  tone="blue"
                  onClick={() => router.push("/dashboard/student/assignments")}
                />
                <QuickDashboardAction
                  icon={Award}
                  title="Certificates"
                  hint={completedCourseCount > 0 ? `${completedCourseCount} certificate${completedCourseCount === 1 ? "" : "s"} earned so far` : "Finish a course to earn your certificate"}
                  onHint={setQuickHint}
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
                  hint={"See your upcoming live sessions and meetings"}
                  onHint={setQuickHint}
                  value="View meetings"
                  tone="green"
                  onClick={() => router.push("/dashboard/student/calendar")}
                />
                <QuickDashboardAction
                  icon={UserCircle}
                  title="Profile"
                  hint={"Update your personal details and account settings"}
                  onHint={setQuickHint}
                  value="Manage account"
                  tone="navy"
                  onClick={() => router.push("/dashboard/student/profile")}
                />
              </div>
            </div>
          </section>

          {/* COURSES + ACCOUNT */}
          <section className="sd-grid sd-grid-b">
            <div className="sd-panel sd-reveal" style={reveal(7)}>
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
                <div className="sd-course-grid">
                  {studentCourses.slice(0, 4).map((item, i) => {
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
                        className="sd-course sd-reveal"
                        style={reveal(8 + i)}
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
                          <span className="sd-badge">
                            {formatStatus(item.enrollmentStatus)}
                          </span>
                        </div>

                        <div className="sd-course-row">
                          <span>
                            {progress?.completedLessons ?? 0}/
                            {progress?.totalLessons ?? 0} lessons
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

            <div className="sd-panel sd-reveal" style={reveal(8)}>
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
                  label="Courses Completed"
                  value={`${completedCourseCount}/${studentCourses.length}`}
                />
                <SmallAccountCard
                  label="Certificates"
                  value={dashboard.certificates.length}
                />
              </div>

              <div className="sd-completion">
                <div className="sd-completion-row">
                  <span>Course completion</span>
                  <b>{Math.round(completionPercent)}%</b>
                </div>
                <ProgressBar value={completionPercent} slim />
              </div>

              {recentPayment ? (
                <div className="sd-payment">
                  <span>Latest payment</span>
                  <strong>
                    {formatCurrency(recentPayment.amount, recentPayment.currency)}
                  </strong>
                </div>
              ) : null}
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="sd-panel sd-reveal" style={reveal(9)}>
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
                    <div className="sd-activity-text">{safeText(activity)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: dashboardCss }} />
    </>
  );
}

function CountUp({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const duration = 1000;
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value]);

  const n = Math.round(display);

  return <>{format ? format(n) : String(n)}</>;
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

type Tone = "blue" | "green" | "orange" | "navy";

function DashboardMetric({
  index,
  icon: Icon,
  label,
  value,
  format,
  detail,
  tone,
  active,
  pinned,
  onEnter,
  onToggle,
}: {
  index: number;
  icon: ElementType;
  label: string;
  value: number;
  format?: (n: number) => string;
  detail: string;
  tone: Tone;
  active: boolean;
  pinned: boolean;
  onEnter: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`sd-metric sd-reveal${active ? " is-active" : ""}${
        pinned ? " is-pinned" : ""
      }`}
      style={reveal(index)}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onToggle}
      aria-pressed={pinned}
    >
      <div className={`sd-icon sd-tone-${tone}`}>
        <Icon size={20} />
      </div>
      <div className="sd-min0 sd-grow">
        <div className="sd-metric-label">{label}</div>
        <div className="sd-metric-value">
          <CountUp value={value} format={format} />
        </div>
        <div className="sd-metric-detail">{detail}</div>
      </div>
      <ChevronDown size={17} className="sd-metric-caret" />
    </button>
  );
}

function QuickDashboardAction({
  icon: Icon,
  title,
  value,
  tone,
  hint,
  onHint,
  onClick,
}: {
  icon: ElementType;
  title: string;
  value: string;
  tone: Tone;
  hint: string;
  onHint: (hint: string | null) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHint(hint)}
      onMouseLeave={() => onHint(null)}
      onFocus={() => onHint(hint)}
      onBlur={() => onHint(null)}
      className="sd-quick"
    >
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
  --muted:#64748B; --soft:#8A97AB;
  --green:#15803D; --green-tint:#E8F6EE; --blue-tint:#EAF1FD;
  --ease:cubic-bezier(.2,.7,.2,1);
  flex:1; min-width:0; width:100%; box-sizing:border-box;
  padding:24px 28px 40px; background:var(--bg); color:var(--navy);
}
.sd-page *{box-sizing:border-box}
.sd-container{width:100%;max-width:1360px;margin:0 auto}
.sd-min0{min-width:0}
.sd-grow{flex:1}
.sd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ---------- Keyframes ---------- */
@keyframes sd-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes sd-grow-x{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes sd-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes studentDashboardSpin{to{transform:rotate(360deg)}}
@keyframes sd-flow{0%{background-position:0% 50%}100%{background-position:100% 50%}}
@keyframes sd-wave{0%,60%,100%{transform:rotate(0)}10%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}30%{transform:rotate(16deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}
@keyframes sd-pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
@keyframes sd-sheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}
.sd-spin{animation:studentDashboardSpin .8s linear infinite}

/* Staggered entrance for every block */
.sd-reveal{animation:sd-rise 520ms var(--ease) both;animation-delay:calc(var(--i,0) * 70ms)}

/* ---------- Buttons ---------- */
.sd-btn{
  position:relative;overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  height:42px;padding:0 18px;border-radius:10px;border:1px solid transparent;
  font:inherit;font-size:14px;font-weight:600;line-height:1;cursor:pointer;
  transition:background .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease),color .2s ease;
}
.sd-btn:focus-visible,.sd-continue:focus-visible,.sd-course:focus-visible,.sd-quick:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.sd-btn:active,.sd-quick:active,.sd-course:active,.sd-continue:active{transform:scale(.98)}
.sd-btn:disabled{opacity:.65;cursor:not-allowed}
.sd-btn-primary{background:linear-gradient(180deg,#FF8A12 0%,#FF6B00 55%,#F25A00 100%);color:#fff}
.sd-btn-primary::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-120%) skewX(-18deg);pointer-events:none}
.sd-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(255,107,0,.35)}
.sd-btn-primary:hover::after{animation:sd-sheen 700ms ease}
.sd-btn-secondary{background:#fff;color:var(--blue);border-color:var(--line)}
.sd-btn-secondary:hover{background:var(--blue-tint);border-color:#BFD3F2;transform:translateY(-2px);box-shadow:0 6px 14px rgba(20,89,184,.12)}
.sd-btn-secondary svg{transition:transform .2s var(--ease)}
.sd-btn-secondary:hover svg{transform:translateX(3px)}
.sd-btn-ghost-light{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.3)}
.sd-btn-ghost-light:hover:not(:disabled){background:rgba(255,255,255,.22);transform:translateY(-2px)}
.sd-refresh-icon{transition:transform .5s var(--ease)}
.sd-refresh:hover .sd-refresh-icon{transform:rotate(180deg)}
.sd-btn-block{width:100%;margin-top:14px}

/* ---------- Hero ---------- */
.sd-hero{
  position:relative;overflow:hidden;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;
  margin-bottom:20px;padding:26px 30px;border-radius:16px;color:#fff;
  background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 35%,#1459B8 70%,#0F2F5F 100%);
  background-size:220% 220%;animation:sd-rise 520ms var(--ease) both,sd-flow 14s ease-in-out infinite alternate;
  box-shadow:0 12px 30px rgba(15,47,95,.18);
}
.sd-hero::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 16%,transparent 16%)}
.sd-hero-main{position:relative;z-index:1;min-width:0}
.sd-logo-chip{display:inline-block;margin-bottom:14px;padding:6px;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.16);transition:transform .25s var(--ease)}
.sd-logo-chip:hover{transform:scale(1.04)}
.sd-logo-crop{width:132px;height:78px;overflow:hidden;border-radius:8px}
.sd-logo-crop img{display:block;width:151px;max-width:none;margin:-29px 0 0 -10px}
.sd-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;font-weight:600;color:#C9DBF5}
.sd-hero h1{margin:0;font-size:clamp(26px,2.6vw,34px);line-height:1.2;font-weight:700;letter-spacing:-.02em;color:#fff}
.sd-wave{display:inline-block;transform-origin:70% 70%;animation:sd-wave 1.8s ease-in-out .6s 1}
.sd-hero p{max-width:620px;margin:8px 0 0;font-size:15px;line-height:1.6;color:#D3E1F5}
.sd-hero-pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.sd-pill{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);font-size:13px;color:#fff;transition:background .2s ease}
.sd-pill:hover{background:rgba(255,255,255,.2)}
.sd-pill-label{color:#B7C9E4}
.sd-dot{width:8px;height:8px;border-radius:50%;background:#94A3B8}
.sd-pill-on .sd-dot{background:#4ADE80;animation:sd-pulse 2s infinite}
.sd-refresh{position:relative;z-index:1;flex:0 0 auto;height:40px}

/* ---------- Icons / avatar ---------- */
.sd-icon{width:40px;height:40px;flex:0 0 40px;display:flex;align-items:center;justify-content:center;border-radius:10px;transition:transform .3s var(--ease)}
.sd-icon-sm{width:36px;height:36px;flex-basis:36px}
.sd-tone-blue{background:var(--blue-tint);color:var(--blue)}
.sd-tone-green{background:var(--green-tint);color:var(--green)}
.sd-tone-orange{background:var(--orange-tint);color:var(--orange)}
.sd-tone-navy{background:#E6ECF5;color:var(--navy)}
.sd-avatar{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--blue-tint);color:var(--blue);font-size:13px;font-weight:700}

/* ---------- Metrics ---------- */
.sd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px}
.sd-metric{display:flex;align-items:flex-start;gap:14px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04);transition:box-shadow .25s ease,transform .25s var(--ease),border-color .25s ease}
.sd-metric:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(15,47,95,.12);border-color:#C9D8EE}
.sd-metric:hover .sd-icon,.sd-quick:hover .sd-icon,.sd-section-head:hover .sd-icon{transform:scale(1.12) rotate(-6deg)}
.sd-metric-label{font-size:13px;color:var(--muted)}
.sd-metric-value{margin-top:4px;font-size:26px;line-height:1.15;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums}
.sd-metric-detail{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:5px;font-size:12px;color:var(--soft)}

/* ---------- Grids & panels ---------- */
.sd-grid{display:grid;gap:20px;margin-bottom:20px}
.sd-grid-a{grid-template-columns:minmax(0,1.55fr) minmax(320px,.85fr)}
.sd-grid-b{grid-template-columns:minmax(0,1.45fr) minmax(320px,.85fr)}
.sd-panel{min-width:0;padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03);transition:box-shadow .25s ease,border-color .25s ease}
.sd-panel:hover{box-shadow:0 10px 26px rgba(15,47,95,.08);border-color:#D4DEEC}
.sd-section-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.sd-section-head h2{margin:0;font-size:17px;line-height:1.3;font-weight:700;color:var(--navy)}
.sd-section-head p{margin:2px 0 0;font-size:13px;color:var(--muted)}

/* ---------- Continue learning ---------- */
.sd-continue{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;padding:16px;border:1px solid var(--line);border-radius:14px;background:#FBFCFE;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .25s ease,box-shadow .25s ease,transform .25s var(--ease),background .25s ease}
.sd-continue:hover{border-color:#9DBBEA;background:#fff;box-shadow:0 12px 26px rgba(15,47,95,.12);transform:translateY(-3px)}
.sd-thumb{width:38px;height:38px;flex:0 0 38px;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--blue-tint);color:var(--blue)}
.sd-thumb-lg{width:56px;height:56px;flex-basis:56px;border-radius:12px}
.sd-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
.sd-continue:hover .sd-thumb img,.sd-course:hover .sd-thumb img{transform:scale(1.12)}
.sd-continue-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;color:var(--navy)}
.sd-continue-meta{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px;font-size:12.5px;color:var(--muted)}
.sd-continue-cta{display:flex;align-items:center;gap:10px}
.sd-continue-pct{font-size:15px;font-weight:700;color:var(--blue)}
.sd-continue-go{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(180deg,#FF8A12,#F25A00);color:#fff;transition:transform .25s var(--ease),box-shadow .25s ease}
.sd-continue:hover .sd-continue-go{transform:translateX(4px) scale(1.08);box-shadow:0 6px 14px rgba(255,107,0,.4)}

.sd-bar{height:8px;overflow:hidden;margin-top:12px;border-radius:999px;background:#E6ECF5}
.sd-bar-slim{height:6px;margin-top:8px}
.sd-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transform-origin:left;animation:sd-grow-x 1100ms var(--ease) 250ms both}

.sd-complete{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding:18px;border:1px solid #FFD9BD;border-radius:14px;background:var(--orange-tint)}
.sd-complete-info{display:flex;align-items:center;gap:14px}
.sd-complete-icon{width:46px;height:46px;flex:0 0 46px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#FFE3CD;color:var(--orange)}
.sd-complete-title{font-size:15px;font-weight:700;color:var(--navy)}
.sd-complete-sub{margin-top:3px;font-size:13px;color:var(--muted)}

/* ---------- Quick actions ---------- */
.sd-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sd-quick{display:flex;align-items:center;gap:10px;width:100%;min-width:0;min-height:58px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease),background .2s ease}
.sd-quick:hover{border-color:#9DBBEA;background:#FAFCFF;box-shadow:0 8px 18px rgba(15,47,95,.1);transform:translateY(-3px)}
.sd-quick-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;color:var(--navy)}
.sd-quick-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:12px;color:var(--muted)}
.sd-arrow{flex:0 0 auto;color:#A3B0C4;transition:transform .25s var(--ease),color .2s ease}
.sd-quick:hover .sd-arrow{transform:translateX(4px);color:var(--orange)}

/* ---------- Courses ---------- */
.sd-course-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sd-course{width:100%;min-width:0;padding:16px;border:1px solid var(--line);border-radius:12px;background:#FBFCFE;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .25s ease,box-shadow .25s ease,transform .25s var(--ease),background .25s ease}
.sd-course:hover{border-color:#9DBBEA;background:#fff;box-shadow:0 12px 24px rgba(15,47,95,.12);transform:translateY(-4px)}
.sd-course-top{display:flex;align-items:flex-start;gap:12px}
.sd-course-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.sd-course-pkg{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:12px;color:var(--muted)}
.sd-course-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;font-size:12px;color:var(--muted)}
.sd-course-row b{color:var(--blue);font-size:13px}
.sd-badge{flex:0 0 auto;padding:2px 8px;border-radius:6px;background:var(--green-tint);color:var(--green);font-size:11px;font-weight:600}

/* ---------- Account ---------- */
.sd-account-user{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line-2);border-radius:12px;background:#F8FAFD}
.sd-account-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.sd-account-email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:12.5px;color:var(--muted)}
.sd-account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
.sd-small{padding:12px;border:1px solid var(--line-2);border-radius:10px;background:#fff;transition:border-color .2s ease,transform .2s var(--ease)}
.sd-small:hover{border-color:#BFD3F2;transform:translateY(-2px)}
.sd-small div{font-size:12px;color:var(--muted)}
.sd-small b{display:block;margin-top:4px;font-size:16px;font-weight:700;color:var(--navy)}
.sd-completion{margin-top:10px;padding:12px 14px;border:1px solid var(--line-2);border-radius:10px;background:#F8FAFD}
.sd-completion-row{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted)}
.sd-completion-row b{font-size:14px;color:var(--blue)}
.sd-completion .sd-bar{margin-top:8px}
.sd-payment{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:12px 14px;border:1px solid var(--line-2);border-radius:10px;background:#fff;font-size:13px;color:var(--muted)}
.sd-payment strong{font-size:14px;color:var(--navy)}

/* ---------- Activity ---------- */
.sd-activity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px}
.sd-activity-item{display:flex;align-items:center;gap:12px;padding:12px 8px;margin:0 -8px;border-bottom:1px solid var(--line-2);border-radius:8px;transition:background .2s ease}
.sd-activity-item:hover{background:#F5F8FD}
.sd-activity-icon{width:32px;height:32px;flex:0 0 32px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--green-tint);color:var(--green)}
.sd-activity-text{min-width:0;font-size:14px;line-height:1.45;font-weight:500;color:var(--navy);word-break:break-word}

/* ---------- Hover preview / click to pin ---------- */
@keyframes sd-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.sd-metric-zone{margin-bottom:20px}
.sd-metric-zone .sd-metrics{margin-bottom:0}
button.sd-metric{width:100%;text-align:left;font:inherit;color:inherit;cursor:pointer}
button.sd-metric:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.sd-metric.is-active{transform:translateY(-4px);border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.14),0 14px 28px rgba(15,47,95,.1)}
.sd-metric.is-pinned{background:#FBFCFF}
.sd-metric.is-pinned::after{content:"";position:absolute}
.sd-metric-caret{flex:0 0 auto;align-self:center;color:var(--soft);transition:transform .3s var(--ease),color .2s ease}
.sd-metric.is-active .sd-metric-caret{transform:rotate(180deg);color:var(--orange)}
.sd-metric{position:relative}
.sd-detail{display:grid;grid-template-rows:0fr;margin-top:0;transition:grid-template-rows .4s var(--ease),margin-top .4s var(--ease)}
.sd-detail.is-open{grid-template-rows:1fr;margin-top:14px}
.sd-detail-inner{min-height:0;overflow:hidden;padding:0 2px}
.sd-detail-card{padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(15,47,95,.08);animation:sd-swap .35s var(--ease) both}
.sd-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.sd-detail-hint{flex:0 0 auto;padding:5px 10px;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:12px;font-weight:600}
.sd-pinchip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px 0 12px;border:0;border-radius:999px;background:var(--orange-tint);color:var(--orange-2);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .2s ease,transform .2s var(--ease)}
.sd-pinchip:hover{background:#FFE3CD;transform:translateY(-1px)}
.sd-drows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sd-drow{display:flex;align-items:center;gap:12px;width:100%;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;font:inherit;color:inherit;animation:sd-swap .35s var(--ease) both}
button.sd-drow{cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease)}
button.sd-drow:hover{border-color:#9DBBEA;box-shadow:0 8px 18px rgba(15,47,95,.1);transform:translateX(4px)}
button.sd-drow:hover .sd-arrow{transform:translateX(4px);color:var(--orange)}
button.sd-drow:hover .sd-thumb img{transform:scale(1.12)}
.sd-drow:nth-child(2){animation-delay:40ms}.sd-drow:nth-child(3){animation-delay:80ms}.sd-drow:nth-child(4){animation-delay:120ms}.sd-drow:nth-child(5){animation-delay:160ms}.sd-drow:nth-child(6){animation-delay:200ms}
.sd-badge{flex:0 0 auto;padding:3px 9px;border-radius:6px;background:var(--green-tint);color:var(--green);font-size:11.5px;font-weight:600}
.sd-badge-warn{background:var(--orange-tint);color:var(--orange-2)}
.sd-pend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:10px}
.sd-pend-box{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;background:var(--orange-tint);color:var(--orange-2)}
.sd-pend-box b{font-size:22px;color:var(--navy)}
.sd-pend-box span{font-size:13px;color:var(--muted)}
.sd-quick-hint{min-height:42px;display:flex;align-items:center;margin:0 0 12px;padding:10px 12px;border:1px solid var(--line-2);border-radius:10px;background:#F8FAFD;font-size:13px;color:var(--muted);animation:sd-swap .3s var(--ease) both;transition:background .2s ease,color .2s ease}
.sd-quick-hint.is-on{background:var(--blue-tint);border-color:#CFE0FA;color:var(--navy)}
@media (max-width:820px){.sd-drows,.sd-pend{grid-template-columns:minmax(0,1fr)}.sd-detail-hint{display:none}}
@media (prefers-reduced-motion:reduce){.sd-detail{transition:none}.sd-detail-card,.sd-drow,.sd-quick-hint{animation:none!important}}

/* ---------- Overview (fills Continue panel) ---------- */
@keyframes sd-ring{from{stroke-dashoffset:226.2}}
.sd-overview{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:18px;margin-top:16px;padding:16px;border:1px solid var(--line-2);border-radius:14px;background:linear-gradient(135deg,#F8FAFD 0%,#FFFFFF 100%)}
.sd-ring{position:relative;width:88px;height:88px}
.sd-ring svg{display:block;transform:rotate(-90deg)}
.sd-ring-bg{fill:none;stroke:#E6ECF5;stroke-width:8}
.sd-ring-fg{fill:none;stroke:var(--blue);stroke-width:8;stroke-linecap:round;animation:sd-ring 1200ms var(--ease) 300ms both}
.sd-ring-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums}
.sd-overview-title{font-size:15px;font-weight:600;color:var(--navy)}
.sd-overview-sub{margin-top:4px;font-size:13px;line-height:1.5;color:var(--muted)}
.sd-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.sd-chip{padding:4px 10px;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:12px;font-weight:600}
.sd-chip-orange{background:var(--orange-tint);color:var(--orange-2)}
.sd-next{margin-top:16px}
.sd-next-title{margin-bottom:8px;font-size:13px;font-weight:600;color:var(--muted)}
.sd-next-item{display:flex;align-items:center;gap:12px;width:100%;margin-bottom:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease)}
.sd-next-item:last-child{margin-bottom:0}
.sd-next-item:hover{border-color:#9DBBEA;box-shadow:0 8px 18px rgba(15,47,95,.1);transform:translateX(4px)}
.sd-next-item:hover .sd-arrow{transform:translateX(4px);color:var(--orange)}
.sd-next-item:hover .sd-thumb img{transform:scale(1.12)}
.sd-next-pct{font-size:13px;color:var(--blue)}
.sd-grid-b>.sd-panel:last-child{align-self:start}

/* ---------- Empty / error ---------- */
.sd-empty{min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:24px;border:1px dashed #CBD6E6;border-radius:14px;background:#FAFBFE;text-align:center}
.sd-empty-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;border-radius:12px;background:var(--blue-tint);color:var(--blue)}
.sd-empty strong{font-size:14px;color:var(--navy)}
.sd-empty span{max-width:380px;font-size:13px;line-height:1.5;color:var(--muted)}
.sd-error{min-height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;border:1px solid #F3D1D1;border-radius:16px;background:#fff;text-align:center;animation:sd-rise 420ms var(--ease) both}
.sd-error-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#FDECEC;color:#C62828}
.sd-error h2{margin:16px 0 0;font-size:18px;font-weight:700;color:var(--navy)}
.sd-error p{max-width:480px;margin:8px 0 20px;font-size:14px;line-height:1.6;color:var(--muted)}

/* ---------- Skeleton ---------- */
.sd-skel{border-radius:16px;background:linear-gradient(90deg,#E9EEF6 25%,#F6F8FC 37%,#E9EEF6 63%);background-size:1200px 100%;animation:sd-shimmer 1.4s linear infinite}
.sd-skel-hero{height:190px;margin-bottom:20px}
.sd-skel-metric{height:104px}
.sd-skel-panel{height:240px}

/* ---------- Responsive ---------- */
@media (max-width:1120px){
  .sd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sd-grid-a,.sd-grid-b{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:820px){
  .sd-page{padding:18px 14px 28px}
  .sd-hero{flex-direction:column;padding:22px 18px}
  .sd-refresh{width:100%}
  .sd-activity-grid{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:620px){
  .sd-metrics,.sd-course-grid,.sd-quick-grid{grid-template-columns:minmax(0,1fr)}
  .sd-panel{padding:18px}
  .sd-hero h1{font-size:25px}
  .sd-continue{grid-template-columns:auto minmax(0,1fr)}
  .sd-continue-cta{grid-column:1 / -1;justify-content:space-between}
  .sd-btn{height:44px}
  .sd-complete .sd-btn{width:100%}
}
@media (prefers-reduced-motion:reduce){
  .sd-reveal,.sd-hero,.sd-bar span,.sd-skel,.sd-wave,.sd-pill-on .sd-dot{animation:none!important}
  .sd-metric,.sd-continue,.sd-course,.sd-quick,.sd-btn,.sd-icon,.sd-panel{transition:none!important}
}
`;
