"use client";



import {

  useEffect,

  useMemo,

  useState,

  type CSSProperties,

  type ElementType,

} from "react";

import { useRouter } from "next/navigation";

import {

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



type CourseData = {

  id: number;

  slug: string;

  title: string;

  description?: string | null;

  mode?: string | null;

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



function formatCurrency(

  amount: number,

  currency = "INR"

): string {

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



function formatStatus(value: string | null | undefined): string {

  if (!value) {

    return "Unknown";

  }



  return (

    value.charAt(0).toUpperCase() +

    value.slice(1).toLowerCase()

  );

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

      course.description === null ||

      course.description === undefined

        ? null

        : safeText(course.description),

    mode:

      course.mode === null ||

      course.mode === undefined

        ? null

        : safeText(course.mode),

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



  const courses: PackageCourse[] = Array.isArray(

    packageValue.courses

  )

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

          (

            item: PackageCourse | null

          ): item is PackageCourse => item !== null

        )

    : [];



  return {

    id: Number(packageValue.id),

    slug: safeText(packageValue.slug),

    title: safeText(packageValue.title),

    price:

      packageValue.price === null ||

      packageValue.price === undefined

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

      raw?.paidAt === null ||

      raw?.paidAt === undefined

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

        rawStudent.phone === null ||

        rawStudent.phone === undefined

          ? null

          : safeText(rawStudent.phone),

      state:

        rawStudent.state === null ||

        rawStudent.state === undefined

          ? null

          : safeText(rawStudent.state),

      referralId:

        rawStudent.referralId === null ||

        rawStudent.referralId === undefined

          ? null

          : safeText(rawStudent.referralId),

      isActive: Boolean(rawStudent.isActive),

    },



    stats: {

      enrolledCourses:

        Number(rawStats.enrolledCourses) || 0,

      activeEnrollments:

        Number(rawStats.activeEnrollments) || 0,

      successfulPayments:

        Number(rawStats.successfulPayments) || 0,

      totalPaid:

        Number(rawStats.totalPaid) || 0,

    },



    enrollments: Array.isArray(raw?.enrollments)

      ? raw.enrollments.map(normalizeEnrollment)

      : [],



    payments: Array.isArray(raw?.payments)

      ? raw.payments.map(normalizePayment)

      : [],



    assignments: Array.isArray(raw?.assignments)

      ? raw.assignments

      : [],



    quizzes: Array.isArray(raw?.quizzes)

      ? raw.quizzes

      : [],






    recentActivity: Array.isArray(raw?.recentActivity)

      ? raw.recentActivity

      : [],



    certificates: Array.isArray(raw?.certificates)

      ? raw.certificates

      : [],

  };

}



export default function StudentDashboardPage() {

  const router = useRouter();



  const [dashboard, setDashboard] =

    useState<DashboardData | null>(null);



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

        setError(

          "Your session has expired. Please login again."

        );

        return;

      }



      const response = await fetch(

        `${API_URL}/students/me/dashboard`,

        {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

            "Content-Type": "application/json",

          },

          cache: "no-store",

        }

      );



      const result = await response.json();



      if (

        !response.ok ||

        !result?.success ||

        !result?.data

      ) {

        throw new Error(

          result?.message ||

            "Unable to load your dashboard."

        );

      }



      const normalized =

        normalizeDashboard(result.data);



      setDashboard(normalized);



      const courseMap = new Map<

        number,

        StudentCourse

      >();



      for (const enrollment of normalized.enrollments) {

        if (enrollment.course) {

          courseMap.set(enrollment.course.id, {

            course: enrollment.course,

            packageName: null,

            enrollmentStatus: enrollment.status,

          });

        }



        if (enrollment.package) {

          for (const packageItem of enrollment.package

            .courses) {

            if (!packageItem.course) {

              continue;

            }



            if (!courseMap.has(packageItem.course.id)) {

              courseMap.set(packageItem.course.id, {

                course: packageItem.course,

                packageName:

                  enrollment.package.title,

                enrollmentStatus:

                  enrollment.status,

              });

            }

          }

        }

      }



      const studentCourses = Array.from(

        courseMap.values()

      );



      const progressResults = await Promise.all(

        studentCourses.map(async (item) => {

          try {

            const progressResponse =

              await fetch(

                `${API_URL}/course-progress/courses/${item.course.id}/progress`,

                {

                  method: "GET",

                  headers: {

                    Authorization: `Bearer ${token}`,

                    "Content-Type":

                      "application/json",

                  },

                }

              );



            if (!progressResponse.ok) {

              return null;

            }



            const progressJson =

              await progressResponse.json();



            const progress =

              progressJson?.data ??

              progressJson;



            return {

              courseId: Number(

                progress?.courseId

              ),

              totalLessons:

                Number(

                  progress?.totalLessons

                ) || 0,

              completedLessons:

                Number(

                  progress?.completedLessons

                ) || 0,

              startedLessons:

                Number(

                  progress?.startedLessons

                ) || 0,

              remainingLessons:

                Number(

                  progress?.remainingLessons

                ) || 0,

              progressPercentage:

                Number(

                  progress?.progressPercentage

                ) || 0,

            } as CourseProgress;

          } catch {

            return null;

          }

        })

      );



      const nextProgress: Record<

        number,

        CourseProgress

      > = {};



      for (const progress of progressResults) {

        if (progress?.courseId) {

          nextProgress[

            progress.courseId

          ] = progress;

        }

      }



      setProgressMap(nextProgress);

    } catch (err) {

      console.error(

        "Student dashboard error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to load your dashboard."

      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }



  useEffect(() => {

    fetchDashboardData();

  }, []);



  const studentCourses = useMemo(() => {

    if (!dashboard) {

      return [];

    }



    const courseMap = new Map<

      number,

      StudentCourse

    >();



    for (const enrollment of dashboard.enrollments) {

      if (enrollment.course) {

        courseMap.set(enrollment.course.id, {

          course: enrollment.course,

          packageName: null,

          enrollmentStatus: enrollment.status,

        });

      }



      if (enrollment.package) {

        for (const packageItem of enrollment.package

          .courses) {

          if (!packageItem.course) {

            continue;

          }



          if (!courseMap.has(packageItem.course.id)) {

            courseMap.set(packageItem.course.id, {

              course: packageItem.course,

              packageName:

                enrollment.package.title,

              enrollmentStatus:

                enrollment.status,

            });

          }

        }

      }

    }



    return Array.from(courseMap.values());

  }, [dashboard]);



  const incompleteCourse = useMemo(

    () =>

      studentCourses.find(

        (item) =>

          (progressMap[item.course.id]

            ?.progressPercentage ?? 0) < 100

      ) ?? null,

    [studentCourses, progressMap]

  );



  const completedCourseCount = useMemo(

    () =>

      studentCourses.filter(

        (item) =>

          (progressMap[item.course.id]

            ?.progressPercentage ?? 0) === 100

      ).length,

    [studentCourses, progressMap]

  );



  const totalLessons = useMemo(

    () =>

      Object.values(progressMap).reduce(

        (sum, item) =>

          sum + item.totalLessons,

        0

      ),

    [progressMap]

  );



  const completedLessons = useMemo(

    () =>

      Object.values(progressMap).reduce(

        (sum, item) =>

          sum + item.completedLessons,

        0

      ),

    [progressMap]

  );



  const recentPayment = useMemo(

    () =>

      [...(dashboard?.payments ?? [])].sort(

        (a, b) =>

          new Date(b.createdAt).getTime() -

          new Date(a.createdAt).getTime()

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

        <main

          style={{

            flex: 1,

            minWidth: 0,

            padding: "28px 32px",

            background: "#f5f7fb",

          }}

        >

          <div

            style={{

              minHeight: 360,

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              justifyContent: "center",

              border: "1px solid #e5e9f0",

              borderRadius: 18,

              background: "#ffffff",

            }}

          >

            <RefreshCw

              size={26}

              color="#2f6bff"

              style={{

                animation:

                  "studentDashboardSpin 0.8s linear infinite",

              }}

            />

            <div

              style={{

                marginTop: 14,

                fontSize: 17,

                fontWeight: 700,

                color: "#111827",

              }}

            >

              Loading your dashboard

            </div>

            <div

              style={{

                marginTop: 6,

                fontSize: 13,

                color: "#7b8495",

              }}

            >

              Preparing your learning home page.

            </div>

          </div>

        </main>



        <style

          dangerouslySetInnerHTML={{

            __html: `

              @keyframes studentDashboardSpin {

                from { transform: rotate(0deg); }

                to { transform: rotate(360deg); }

              }

            `,

          }}

        />

      </>

    );

  }



  if (error || !dashboard) {

    return (

      <main

        style={{

          flex: 1,

          minWidth: 0,

          padding: "28px 32px",

          background: "#f5f7fb",

        }}

      >

        <div

          style={{

            minHeight: 360,

            display: "flex",

            flexDirection: "column",

            alignItems: "center",

            justifyContent: "center",

            padding: 30,

            border: "1px solid #f1d4d4",

            borderRadius: 18,

            background: "#ffffff",

            textAlign: "center",

          }}

        >

          <div

            style={{

              width: 48,

              height: 48,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              borderRadius: 13,

              background: "#fdeceb",

              color: "#cf433f",

            }}

          >

            <BellFallback />

          </div>



          <h2

            style={{

              margin: "14px 0 0",

              fontSize: 18,

              fontWeight: 750,

              color: "#111827",

            }}

          >

            Unable to load dashboard

          </h2>



          <p

            style={{

              maxWidth: 480,

              margin: "7px 0 18px",

              fontSize: 13,

              lineHeight: 1.6,

              color: "#7b8495",

            }}

          >

            {error || "Something went wrong."}

          </p>



          <button

            type="button"

            onClick={() => fetchDashboardData(true)}

            style={primaryButtonStyle}

          >

            <RefreshCw size={15} />

            Try Again

          </button>

        </div>

      </main>

    );

  }



  const pendingAssignments =

    dashboard.assignments.length;



  const pendingQuizzes =

    dashboard.quizzes.length;



  const pendingTotal =

    pendingAssignments + pendingQuizzes;



  const completedAll =

    studentCourses.length > 0 &&

    completedCourseCount === studentCourses.length;



  return (
    <>
      <main
        className="skce-dashboard-page"
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
          padding: "26px 28px 40px",
          background: "#F4F6FA",
        }}
      >
        <div
          className="skce-dashboard-container"
          style={{
            width: "100%",
            maxWidth: 1440,
            margin: "0 auto",
          }}
        >
          <section
            className="skce-dashboard-hero"
            style={{
              position: "relative",
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 230px",
              alignItems: "stretch",
              gap: 22,
              marginBottom: 18,
              padding: "23px 25px",
              borderRadius: 20,
              background:
                "linear-gradient(135deg, #112A4D 0%, #18457B 58%, #2A63CF 100%)",
              boxShadow: "0 12px 30px rgba(17,42,77,0.14)",
              color: "#FFFFFF",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 290,
                height: 290,
                top: -195,
                right: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                right: -50,
                bottom: -95,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.14)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 8,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: "#D9E8FB",
                }}
              >
                <GraduationCap size={15} />
                Student Portal
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(28px, 2.6vw, 36px)",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "#FFFFFF",
                }}
              >
                Welcome back, {dashboard.student.name} 👋
              </h1>

              <p
                style={{
                  maxWidth: 700,
                  margin: "9px 0 0",
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: "#D5E2F4",
                }}
              >
                Continue your learning, check what needs your attention,
                and keep moving toward your course goals.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 18,
                  marginTop: 16,
                }}
              >
                <InfoPair
                  label="Student ID"
                  value={dashboard.student.studentId}
                />
                <InfoPair
                  label="Account"
                  value={
                    dashboard.student.isActive ? "Active" : "Inactive"
                  }
                />
                <InfoPair
                  label="Courses"
                  value={String(studentCourses.length)}
                />
              </div>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 40px",
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      color: "#173B67",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {initials}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: "#FFFFFF",
                      }}
                    >
                      {dashboard.student.name}
                    </div>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 3,
                        fontSize: 10,
                        color: "#C9D9ED",
                      }}
                    >
                      {dashboard.student.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                    marginTop: 11,
                  }}
                >
                  <HeroMiniStat
                    label="Completed"
                    value={String(completedCourseCount)}
                  />
                  <HeroMiniStat
                    label="Pending"
                    value={String(pendingTotal)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                style={{
                  ...ghostButtonStyle,
                  width: "100%",
                  marginTop: 10,
                  opacity: refreshing ? 0.65 : 1,
                }}
              >
                <RefreshCw
                  size={14}
                  style={{
                    animation: refreshing
                      ? "studentDashboardSpin 0.8s linear infinite"
                      : undefined,
                  }}
                />
                {refreshing ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>
          </section>

          <section
            className="skce-dashboard-metrics"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
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
              tone="rose"
            />
            <DashboardMetric
              icon={CreditCard}
              label="Total Paid"
              value={formatCurrency(dashboard.stats.totalPaid)}
              detail={`${dashboard.stats.successfulPayments} successful payment${
                dashboard.stats.successfulPayments === 1 ? "" : "s"
              }`}
              tone="purple"
            />
          </section>

          <section
            className="skce-dashboard-main-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.55fr) minmax(320px, 0.85fr)",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <div style={dashboardPanelStyle}>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid #EADFB8",
                    background:
                      "linear-gradient(135deg,#FFFDF6 0%,#FFF8E5 100%)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 44px",
                        borderRadius: 12,
                        background: "#FFF0C7",
                        color: "#B47A12",
                      }}
                    >
                      <Award size={21} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#3D3424",
                        }}
                      >
                        {completedCourseCount} course
                        {completedCourseCount === 1 ? "" : "s"} completed
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: "#897A5C",
                        }}
                      >
                        {completedLessons} lessons completed.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/dashboard/student/certificates")
                    }
                    style={{
                      ...primaryButtonStyle,
                      background: "#B98016",
                    }}
                  >
                    View Certificates
                    <ArrowRight size={14} />
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
                  className="skce-dashboard-hover"
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0,1fr) auto",
                    alignItems: "center",
                    gap: 13,
                    marginTop: 16,
                    padding: 15,
                    border: "1px solid #E4E9F1",
                    borderRadius: 14,
                    background: "#FBFCFF",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 48px",
                      borderRadius: 13,
                      background: "#EAF0FF",
                      color: "#316CF2",
                    }}
                  >
                    <BookOpen size={21} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#1F2937",
                      }}
                    >
                      {incompleteCourse.course.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginTop: 4,
                        fontSize: 10.5,
                        color: "#8791A2",
                      }}
                    >
                      <span>
                        {progressMap[incompleteCourse.course.id]
                          ?.completedLessons ?? 0}
                        /
                        {progressMap[incompleteCourse.course.id]
                          ?.totalLessons ?? 0}{" "}
                        lessons
                      </span>
                      <span>
                        {incompleteCourse.packageName
                          ? `Package: ${incompleteCourse.packageName}`
                          : "Direct enrollment"}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        overflow: "hidden",
                        marginTop: 10,
                        borderRadius: 999,
                        background: "#E7ECF4",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: `${Math.min(
                            Math.max(
                              progressMap[incompleteCourse.course.id]
                                ?.progressPercentage ?? 0,
                              0
                            ),
                            100
                          )}%`,
                          height: "100%",
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg,#2F6BFF,#5E8EFF)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#316CF2",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {Math.round(
                      progressMap[incompleteCourse.course.id]
                        ?.progressPercentage ?? 0
                    )}
                    %
                    <ChevronRight size={16} />
                  </div>
                </button>
              ) : (
                <EmptyCard
                  title="No active course"
                  message="Your next course will appear here when you are enrolled."
                />
              )}
            </div>

            <div style={dashboardPanelStyle}>
              <SectionHeader
                icon={CalendarDays}
                title="Quick Actions"
                subtitle="Jump to a learning area"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 9,
                  marginTop: 16,
                }}
              >
                <QuickDashboardAction
                  icon={ClipboardList}
                  title="Assignments"
                  value={
                    pendingAssignments > 0
                      ? `${pendingAssignments} pending`
                      : "All clear"
                  }
                  tone="rose"
                  onClick={() =>
                    router.push("/dashboard/student/assignments")
                  }
                />
                <QuickDashboardAction
                  icon={BarChart3}
                  title="Quizzes"
                  value={
                    pendingQuizzes > 0
                      ? `${pendingQuizzes} pending`
                      : "All clear"
                  }
                  tone="blue"
                  onClick={() =>
                    router.push("/dashboard/student/assignments")
                  }
                />
                <QuickDashboardAction
                  icon={Award}
                  title="Certificates"
                  value={
                    completedCourseCount > 0
                      ? `${completedCourseCount} earned`
                      : "View achievements"
                  }
                  tone="gold"
                  onClick={() =>
                    router.push("/dashboard/student/certificates")
                  }
                />
                <QuickDashboardAction
                  icon={CalendarDays}
                  title="Calendar"
                  value="View meetings"
                  tone="green"
                  onClick={() =>
                    router.push("/dashboard/student/calendar")
                  }
                />
              </div>

              <div
                style={{
                  marginTop: 13,
                  padding: "11px 12px",
                  borderRadius: 11,
                  background: "#F8FAFC",
                  border: "1px solid #EDF1F6",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: "#8A94A4",
                  }}
                >
                  Course completion
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 3,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 12.5,
                      color: "#283244",
                    }}
                  >
                    {completedCourseCount} / {studentCourses.length} completed
                  </strong>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#316CF2",
                    }}
                  >
                    {studentCourses.length > 0
                      ? `${Math.round(
                          (completedCourseCount / studentCourses.length) * 100
                        )}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            className="skce-dashboard-secondary-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.45fr) minmax(300px, 0.85fr)",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <div style={dashboardPanelStyle}>
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  {studentCourses.slice(0, 4).map((item) => {
                    const progress = progressMap[item.course.id];
                    const percentage = Math.min(
                      Math.max(progress?.progressPercentage ?? 0, 0),
                      100
                    );

                    return (
                      <button
                        key={item.course.id}
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/student/my-courses/${item.course.id}`
                          )
                        }
                        className="skce-dashboard-hover"
                        style={{
                          width: "100%",
                          minWidth: 0,
                          padding: 13,
                          border: "1px solid #E9EDF3",
                          borderRadius: 13,
                          background: "#FBFCFE",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flex: "0 0 34px",
                              borderRadius: 9,
                              background: "#EAF0FF",
                              color: "#316CF2",
                            }}
                          >
                            <BookOpen size={16} />
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: 11.5,
                                fontWeight: 800,
                                color: "#243042",
                              }}
                            >
                              {item.course.title}
                            </div>
                            <div
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                marginTop: 3,
                                fontSize: 9.5,
                                color: "#929BAB",
                              }}
                            >
                              {item.packageName ||
                                "Direct enrollment"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginTop: 10,
                            fontSize: 9.5,
                            color: "#8B95A5",
                          }}
                        >
                          <span>
                            {progress?.completedLessons ?? 0}/
                            {progress?.totalLessons ?? 0} lessons
                          </span>
                          <strong
                            style={{
                              color: "#316CF2",
                              fontSize: 9.5,
                            }}
                          >
                            {Math.round(percentage)}%
                          </strong>
                        </div>

                        <div
                          style={{
                            height: 6,
                            overflow: "hidden",
                            marginTop: 6,
                            borderRadius: 999,
                            background: "#E7ECF4",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: `${percentage}%`,
                              height: "100%",
                              borderRadius: 999,
                              background:
                                "linear-gradient(90deg,#2F6BFF,#5E8EFF)",
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {studentCourses.length > 4 ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/student/my-courses")
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 11,
                    padding: "9px 12px",
                    border: "1px solid #DDE4EE",
                    borderRadius: 9,
                    background: "#FFFFFF",
                    color: "#316CF2",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  View all {studentCourses.length} courses
                  <ArrowRight size={13} />
                </button>
              ) : null}
            </div>

            <div style={dashboardPanelStyle}>
              <SectionHeader
                icon={GraduationCap}
                title="Account Snapshot"
                subtitle="Your current SKCE account"
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 12,
                  background: "#F8FAFC",
                  border: "1px solid #EDF1F5",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 40px",
                    borderRadius: "50%",
                    background: "#EAF0FF",
                    color: "#316CF2",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: "#253043",
                    }}
                  >
                    {dashboard.student.name}
                  </div>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 3,
                      fontSize: 10,
                      color: "#8B95A5",
                    }}
                  >
                    {dashboard.student.email}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 9,
                  marginTop: 10,
                }}
              >
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
                  value={
                    dashboard.student.isActive ? "Active" : "Inactive"
                  }
                />
              </div>

              {recentPayment ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 10,
                    padding: "10px 11px",
                    border: "1px solid #EDF1F5",
                    borderRadius: 10,
                    background: "#FBFCFE",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#8C96A5",
                    }}
                  >
                    Latest payment
                  </span>
                  <strong
                    style={{
                      fontSize: 11,
                      color: "#3A4656",
                    }}
                  >
                    {formatCurrency(
                      recentPayment.amount,
                      recentPayment.currency
                    )}
                  </strong>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/student/profile")
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 10,
                  padding: "9px 12px",
                  border: "1px solid #DDE4EE",
                  borderRadius: 9,
                  background: "#FFFFFF",
                  color: "#316CF2",
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                View Profile
                <ArrowRight size={13} />
              </button>
            </div>
          </section>

          <section
            style={{
              minWidth: 0,
              padding: 22,
              marginBottom: 18,
              border: "1px solid #E2E7EF",
              borderRadius: 18,
              background: "#FFFFFF",
              boxShadow: "0 6px 18px rgba(15,23,42,0.035)",
            }}
          >
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  columnGap: 18,
                  marginTop: 8,
                }}
              >
                {dashboard.recentActivity
                  .slice(0, 6)
                  .map((activity, index) => (
                    <div
                      key={`activity-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom:
                          index <
                          Math.min(
                            dashboard.recentActivity.length,
                            6
                          ) -
                            1
                            ? "1px solid #EEF1F5"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 30px",
                          borderRadius: 9,
                          background: "#EAF8F0",
                          color: "#18945A",
                        }}
                      >
                        <CheckCircle2 size={15} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11.5,
                            lineHeight: 1.45,
                            fontWeight: 700,
                            color: "#2F3949",
                            wordBreak: "break-word",
                          }}
                        >
                          {safeText(activity)}
                        </div>
                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 9.5,
                            color: "#9AA2AF",
                          }}
                        >
                          Recent student activity
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section
            className="skce-dashboard-footer"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <FooterAction
              icon={BookOpen}
              title="My Courses"
              description="Open your enrolled courses"
              onClick={() =>
                router.push("/dashboard/student/my-courses")
              }
            />
            <FooterAction
              icon={ClipboardList}
              title="Assignments & Quizzes"
              description="Open your learning work"
              onClick={() =>
                router.push("/dashboard/student/assignments")
              }
            />
            <FooterAction
              icon={Award}
              title="Certificates"
              description="View earned certificates"
              onClick={() =>
                router.push("/dashboard/student/certificates")
              }
            />
          </section>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes studentDashboardSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            .skce-dashboard-hover {
              transition:
                transform 160ms ease,
                box-shadow 160ms ease,
                border-color 160ms ease;
            }

            .skce-dashboard-hover:hover {
              transform: translateY(-1px);
              box-shadow: 0 8px 18px rgba(15,23,42,0.06);
            }

            @media (max-width: 1120px) {
              .skce-dashboard-metrics {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }

              .skce-dashboard-main-grid,
              .skce-dashboard-secondary-grid {
                grid-template-columns: minmax(0, 1fr) !important;
              }
            }

            @media (max-width: 820px) {
              .skce-dashboard-page {
                padding: 18px 16px 28px !important;
              }

              .skce-dashboard-hero {
                grid-template-columns: minmax(0, 1fr) !important;
              }

              .skce-dashboard-hero > div:last-child {
                width: 100% !important;
              }

              .skce-dashboard-footer {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
            }

            @media (max-width: 620px) {
              .skce-dashboard-metrics,
              .skce-dashboard-footer {
                grid-template-columns: minmax(0, 1fr) !important;
              }

              .skce-dashboard-hero {
                padding: 20px !important;
              }

              .skce-dashboard-hero h1 {
                font-size: 27px !important;
              }

              .skce-dashboard-main-grid > div,
              .skce-dashboard-secondary-grid > div,
              .skce-dashboard-page section {
                box-sizing: border-box;
              }

              .skce-dashboard-container .skce-dashboard-main-grid > div,
              .skce-dashboard-container .skce-dashboard-secondary-grid > div {
                padding: 18px !important;
              }
            }
          `,
        }}
      />
    </>
  );
}

const dashboardPanelStyle: CSSProperties = {
  minWidth: 0,
  padding: 22,
  border: "1px solid #E2E7EF",
  borderRadius: 18,
  background: "#FFFFFF",
  boxShadow: "0 6px 18px rgba(15,23,42,0.035)",
};

function HeroMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "8px 9px",
        borderRadius: 9,
        background: "rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#AFC4DE",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 15,
          fontWeight: 800,
          color: "#FFFFFF",
        }}
      >
        {value}
      </div>
    </div>
  );
}

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
  tone: "blue" | "green" | "rose" | "purple";
}) {
  const toneMap: Record<
    "blue" | "green" | "rose" | "purple",
    { bg: string; fg: string }
  > = {
    blue: { bg: "#EAF0FF", fg: "#316CF2" },
    green: { bg: "#EAF8F0", fg: "#18945A" },
    rose: { bg: "#F8E8EF", fg: "#A01441" },
    purple: { bg: "#F1EAFF", fg: "#7A56D6" },
  };

  const colors = toneMap[tone];

  return (
    <div
      className="skce-dashboard-hover"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        minWidth: 0,
        padding: 15,
        border: "1px solid #E2E7EF",
        borderRadius: 15,
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 40px",
          borderRadius: 11,
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: "#8A94A4" }}>
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 19,
            lineHeight: 1.1,
            fontWeight: 800,
            color: "#182233",
          }}
        >
          {safeText(value)}
        </div>
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 3,
            fontSize: 9.5,
            color: "#9AA2AF",
          }}
        >
          {detail}
        </div>
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
  tone: "rose" | "blue" | "green" | "gold";
  onClick: () => void;
}) {
  const toneMap: Record<
    "rose" | "blue" | "green" | "gold",
    { bg: string; fg: string }
  > = {
    rose: { bg: "#F8E8EF", fg: "#A01441" },
    blue: { bg: "#EAF0FF", fg: "#316CF2" },
    green: { bg: "#EAF8F0", fg: "#18945A" },
    gold: { bg: "#FFF4DC", fg: "#BB7A12" },
  };

  const colors = toneMap[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="skce-dashboard-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        minWidth: 0,
        padding: "10px 9px",
        border: "1px solid #E8ECF2",
        borderRadius: 11,
        background: "#FFFFFF",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 31,
          height: 31,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 31px",
          borderRadius: 9,
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <Icon size={15} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 10.5,
            fontWeight: 800,
            color: "#344052",
          }}
        >
          {title}
        </div>
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
            fontSize: 9.5,
            color: "#969FAD",
          }}
        >
          {value}
        </div>
      </div>
      <ArrowRight size={13} color="#A3ACB9" />
    </button>
  );
}

function InfoPair({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div

      style={{

        display: "flex",

        flexDirection: "column",

        gap: 3,

      }}

    >

      <span

        style={{

          fontSize: 10.5,

          color: "#b7c7df",

        }}

      >

        {label}

      </span>



      <strong

        style={{

          fontSize: 12.5,

          color: "#ffffff",

        }}

      >

        {value}

      </strong>

    </div>

  );

}



function SummaryTile({

  icon: Icon,

  label,

  value,

  helper,

  tone,

  onClick,

}: {

  icon: ElementType;

  label: string;

  value: string | number;

  helper: string;

  tone: "rose" | "blue" | "green" | "gold";

  onClick: () => void;

}) {

  const toneMap: Record<

    string,

    { bg: string; fg: string }

  > = {

    rose: {

      bg: "#f8e8ef",

      fg: "#a01441",

    },

    blue: {

      bg: "#eaf0ff",

      fg: "#316cf2",

    },

    green: {

      bg: "#eaf8f0",

      fg: "#18945a",

    },

    gold: {

      bg: "#fff4dc",

      fg: "#bb7a12",

    },

  };



  const colors = toneMap[tone];



  return (

    <button

      type="button"

      onClick={onClick}

      className="skce-dashboard-hover"

      style={{

        display: "flex",

        alignItems: "center",

        gap: 12,

        width: "100%",

        minWidth: 0,

        padding: 16,

        border:

          "1px solid #e4e8ef",

        borderRadius: 15,

        background: "#ffffff",

        cursor: "pointer",

        textAlign: "left",

      }}

    >

      <div

        style={{

          width: 42,

          height: 42,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          flex: "0 0 42px",

          borderRadius: 12,

          background: colors.bg,

          color: colors.fg,

        }}

      >

        <Icon size={19} />

      </div>



      <div

        style={{

          minWidth: 0,

          flex: 1,

        }}

      >

        <div

          style={{

            fontSize: 11,

            color: "#8b95a6",

          }}

        >

          {label}

        </div>



        <div

          style={{

            marginTop: 3,

            fontSize: 19,

            fontWeight: 800,

            color: "#111827",

          }}

        >

          {safeText(value)}

        </div>



        <div

          style={{

            overflow: "hidden",

            textOverflow: "ellipsis",

            whiteSpace: "nowrap",

            marginTop: 2,

            fontSize: 10,

            color: "#9aa2af",

          }}

        >

          {helper}

        </div>

      </div>



      <ChevronRight

        size={16}

        color="#a4adba"

        style={{

          flex: "0 0 auto",

        }}

      />

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

    <div

      style={{

        display: "flex",

        alignItems: "center",

        gap: 10,

      }}

    >

      <div

        style={{

          width: 38,

          height: 38,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          flex: "0 0 38px",

          borderRadius: 10,

          background: "#f8e8ef",

          color: "#a01441",

        }}

      >

        <Icon size={18} />

      </div>



      <div

        style={{

          minWidth: 0,

        }}

      >

        <h2

          style={{

            margin: 0,

            fontSize: 16,

            lineHeight: 1.3,

            fontWeight: 800,

            color: "#111827",

          }}

        >

          {title}

        </h2>



        <p

          style={{

            margin: "3px 0 0",

            fontSize: 11,

            color: "#919aaa",

          }}

        >

          {subtitle}

        </p>

      </div>

    </div>

  );

}



function FocusRow({

  icon: Icon,

  label,

  value,

  tone,

  onClick,

}: {

  icon: ElementType;

  label: string;

  value: string;

  tone: "rose" | "blue" | "green" | "purple" | "gray";

  onClick: () => void;

}) {

  const tones: Record<

    string,

    { bg: string; fg: string }

  > = {

    rose: {

      bg: "#f8e8ef",

      fg: "#a01441",

    },

    blue: {

      bg: "#eaf0ff",

      fg: "#316cf2",

    },

    green: {

      bg: "#eaf8f0",

      fg: "#18945a",

    },

    purple: {

      bg: "#f1eaff",

      fg: "#7a56d6",

    },

    gray: {

      bg: "#f2f4f7",

      fg: "#8c96a6",

    },

  };



  const colors = tones[tone];



  return (

    <button

      type="button"

      onClick={onClick}

      className="skce-dashboard-hover"

      style={{

        display: "flex",

        alignItems: "center",

        gap: 10,

        width: "100%",

        padding: "10px 11px",

        border:

          "1px solid #edf0f4",

        borderRadius: 11,

        background: "#ffffff",

        cursor: "pointer",

        textAlign: "left",

      }}

    >

      <div

        style={{

          width: 34,

          height: 34,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          flex: "0 0 34px",

          borderRadius: 9,

          background: colors.bg,

          color: colors.fg,

        }}

      >

        <Icon size={16} />

      </div>



      <div

        style={{

          minWidth: 0,

          flex: 1,

        }}

      >

        <div

          style={{

            fontSize: 11.5,

            fontWeight: 750,

            color: "#354052",

          }}

        >

          {label}

        </div>



        <div

          style={{

            overflow: "hidden",

            textOverflow: "ellipsis",

            whiteSpace: "nowrap",

            marginTop: 2,

            fontSize: 10,

            color: "#969fad",

          }}

        >

          {value}

        </div>

      </div>



      <ChevronRight

        size={15}

        color="#adb5c2"

      />

    </button>

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

    <div

      style={{

        padding: "10px 11px",

        border:

          "1px solid #edf0f4",

        borderRadius: 10,

        background: "#fafbfc",

      }}

    >

      <div

        style={{

          fontSize: 10,

          color: "#969fad",

        }}

      >

        {label}

      </div>



      <div

        style={{

          marginTop: 3,

          fontSize: 14,

          fontWeight: 800,

          color: "#283244",

        }}

      >

        {safeText(value)}

      </div>

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

    <button

      type="button"

      onClick={onClick}

      className="skce-dashboard-hover"

      style={{

        display: "flex",

        alignItems: "center",

        gap: 10,

        width: "100%",

        minWidth: 0,

        padding: "12px 13px",

        border:

          "1px solid #e4e8ef",

        borderRadius: 13,

        background: "#ffffff",

        cursor: "pointer",

        textAlign: "left",

      }}

    >

      <div

        style={{

          width: 34,

          height: 34,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          flex: "0 0 34px",

          borderRadius: 9,

          background: "#eef2ff",

          color: "#396bf1",

        }}

      >

        <Icon size={16} />

      </div>



      <div

        style={{

          minWidth: 0,

          flex: 1,

        }}

      >

        <div

          style={{

            overflow: "hidden",

            textOverflow: "ellipsis",

            whiteSpace: "nowrap",

            fontSize: 11.5,

            fontWeight: 800,

            color: "#313b4b",

          }}

        >

          {title}

        </div>



        <div

          style={{

            overflow: "hidden",

            textOverflow: "ellipsis",

            whiteSpace: "nowrap",

            marginTop: 2,

            fontSize: 9.5,

            color: "#9aa2af",

          }}

        >

          {description}

        </div>

      </div>



      <ArrowRight

        size={14}

        color="#98a2b2"

      />

    </button>

  );

}



function EmptyCard({

  title,

  message,

}: {

  title: string;

  message: string;

}) {

  return (

    <div

      style={{

        minHeight: 120,

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        justifyContent: "center",

        padding: 20,

        marginTop: 12,

        border:

          "1px dashed #dfe4eb",

        borderRadius: 13,

        background: "#fbfcfd",

        textAlign: "center",

      }}

    >

      <BookOpen

        size={20}

        color="#a1a9b6"

      />



      <strong

        style={{

          marginTop: 8,

          fontSize: 12.5,

          color: "#4a5565",

        }}

      >

        {title}

      </strong>



      <span

        style={{

          maxWidth: 380,

          marginTop: 4,

          fontSize: 10.5,

          lineHeight: 1.5,

          color: "#9aa2af",

        }}

      >

        {message}

      </span>

    </div>

  );

}



function BellFallback() {

  return (

    <span

      style={{

        fontSize: 20,

        fontWeight: 800,

      }}

    >

      !

    </span>

  );

}



const primaryButtonStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: 7,

  border: 0,

  borderRadius: 9,

  padding: "9px 13px",

  background: "#2f6bff",

  color: "#ffffff",

  fontSize: 11,

  fontWeight: 800,

  cursor: "pointer",

};



const ghostButtonStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: 7,

  border:

    "1px solid rgba(255,255,255,0.25)",

  borderRadius: 9,

  padding: "9px 12px",

  background:

    "rgba(255,255,255,0.11)",

  color: "#ffffff",

  fontSize: 11,

  fontWeight: 800,

  cursor: "pointer",

};
