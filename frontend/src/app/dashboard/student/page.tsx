"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CreditCard,
  GraduationCap,
  CheckCircle2,
  Package,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import QuickAccessGrid from "@/components/dashboard/QuickAccessGrid";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* =========================================================
   TYPES
========================================================= */

type CourseData = {
  id: number;
  slug: string;
  title: string;
};

type PackageData = {
  id: number;
  slug: string;
  title: string;
  price: number;
  courses: CourseData[];
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
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
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
  liveClasses: unknown[];
  recentActivity: unknown[];
  certificates: unknown[];
};

type ApiResponse = {
  success: boolean;
  data?: DashboardData;
  message?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  amount: number,
  currency = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDate(date: string): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatStatus(status: string): string {
  if (!status) return "Unknown";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

/*
 * Important:
 * Never allow an object to reach JSX directly.
 * This helper converts unknown backend values into safe text.
 */
function safeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    if (typeof objectValue.title === "string") {
      return objectValue.title;
    }

    if (typeof objectValue.name === "string") {
      return objectValue.name;
    }

    if (typeof objectValue.label === "string") {
      return objectValue.label;
    }

    if (typeof objectValue.message === "string") {
      return objectValue.message;
    }

    return JSON.stringify(value);
  }

  return String(value);
}

/*
 * Normalize courses because the backend can return either:
 *
 * {
 *   id,
 *   slug,
 *   title
 * }
 *
 * or:
 *
 * {
 *   course: {
 *      id,
 *      slug,
 *      title
 *   }
 * }
 */
function normalizeCourse(raw: any): CourseData | null {
  if (!raw) {
    return null;
  }

  const course = raw.course ?? raw;

  if (!course) {
    return null;
  }

  return {
    id: Number(course.id) || 0,
    slug: safeText(course.slug),
    title: safeText(course.title),
  };
}

function normalizePackage(raw: any): PackageData | null {
  if (!raw) {
    return null;
  }

  const packageData = raw.package ?? raw;

  if (!packageData) {
    return null;
  }

  const rawCourses = Array.isArray(packageData.courses)
    ? packageData.courses
    : [];

  const courses = rawCourses
    .map((course: any) => normalizeCourse(course))
    .filter(
      (course: CourseData | null): course is CourseData =>
        course !== null
    );

  return {
    id: Number(packageData.id) || 0,
    slug: safeText(packageData.slug),
    title: safeText(packageData.title),
    price: Number(packageData.price) || 0,
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
    providerOrderId:
      raw?.providerOrderId === null ||
      raw?.providerOrderId === undefined
        ? null
        : safeText(raw.providerOrderId),
    providerPaymentId:
      raw?.providerPaymentId === null ||
      raw?.providerPaymentId === undefined
        ? null
        : safeText(raw.providerPaymentId),
    paidAt:
      raw?.paidAt === null ||
      raw?.paidAt === undefined
        ? null
        : safeText(raw.paidAt),
    createdAt: safeText(raw?.createdAt),
  };
}

function normalizeDashboard(raw: any): DashboardData {
  const rawStudent = raw?.student ?? {};

  const rawStats = raw?.stats ?? {};

  const rawEnrollments = Array.isArray(raw?.enrollments)
    ? raw.enrollments
    : [];

  const rawPayments = Array.isArray(raw?.payments)
    ? raw.payments
    : [];

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
      totalPaid: Number(rawStats.totalPaid) || 0,
    },

    enrollments: rawEnrollments.map(normalizeEnrollment),

    payments: rawPayments.map(normalizePayment),

    assignments: Array.isArray(raw?.assignments)
      ? raw.assignments
      : [],

    quizzes: Array.isArray(raw?.quizzes)
      ? raw.quizzes
      : [],

    liveClasses: Array.isArray(raw?.liveClasses)
      ? raw.liveClasses
      : [],

    recentActivity: Array.isArray(raw?.recentActivity)
      ? raw.recentActivity
      : [],

    certificates: Array.isArray(raw?.certificates)
      ? raw.certificates
      : [],
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
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

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ||
            "Unable to load your dashboard."
        );
      }

      const normalizedData = normalizeDashboard(
        result.data
      );

      setDashboard(normalizedData);

      console.log(
        "Student dashboard loaded:",
        normalizedData
      );
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
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main
        style={{
          padding: "28px 32px",
          flex: 1,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <RefreshCw
            size={24}
            style={{
              margin: "0 auto 12px",
              animation:
                "studentDashboardSpin 1s linear infinite",
            }}
            color="#2F6BFF"
          />

          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Loading your dashboard...
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 5,
            }}
          >
            Fetching your latest student information.
          </div>
        </div>

        <style jsx>{`
          @keyframes studentDashboardSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !dashboard) {
    return (
      <main
        style={{
          padding: "28px 32px",
          flex: 1,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "#FDEAEA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Bell
              size={21}
              color="#E0473F"
            />
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Unable to load dashboard
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 6,
              marginBottom: 18,
            }}
          >
            {error || "Something went wrong."}
          </div>

          <button
            onClick={loadDashboard}
            style={{
              border: "none",
              background: "#2F6BFF",
              color: "#fff",
              borderRadius: 7,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const {
    student,
    stats,
    enrollments,
    payments,
    assignments,
    quizzes,
    liveClasses,
    recentActivity,
  } = dashboard;

  const pendingWorkCount =
    assignments.length + quizzes.length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              color: "#111827",
            }}
          >
            Welcome back, {student.name}! 👋
          </h1>

          <p
            style={{
              color: "#6B7280",
              fontSize: 14,
              margin: "4px 0 0",
            }}
          >
            Student ID:{" "}
            <strong
              style={{
                color: "#374151",
              }}
            >
              {student.studentId}
            </strong>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#6B7280",
            fontSize: 13.5,
          }}
        >
          <Bell size={18} />
        </div>
      </div>

      {/* =================================================
          QUICK ACCESS
      ================================================= */}

      <QuickAccessGrid />

      {/* =================================================
          STATS
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={BookOpen}
          value={stats.enrolledCourses}
          label="Enrolled Courses"
          bg="#EAF0FE"
          fg="#3B6BF0"
        />

        <StatCard
          icon={GraduationCap}
          value={stats.activeEnrollments}
          label="Active Enrollments"
          bg="#E9F9EF"
          fg="#22A555"
        />

        <StatCard
          icon={CheckCircle2}
          value={stats.successfulPayments}
          label="Successful Payments"
          bg="#FDF3E3"
          fg="#D98E1A"
        />

        <StatCard
          icon={CreditCard}
          value={formatCurrency(
            stats.totalPaid
          )}
          label="Total Paid"
          bg="#F3EAFD"
          fg="#8B5CF6"
        />
      </div>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
        }}
      >
        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div>
          {/* ===============================================
              MY ENROLLMENTS
          =============================================== */}

          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            My Enrollments
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {enrollments.length === 0 ? (
              <EmptyCard
                icon={BookOpen}
                title="No enrollments yet"
                message="Your enrolled courses and packages will appear here."
              />
            ) : (
              enrollments.map(
                (enrollment) => {
                  const packageCourses =
                    enrollment.package?.courses ||
                    [];

                  const individualCourse =
                    enrollment.course;

                  return (
                    <div
                      key={enrollment.id}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding:
                          "17px 18px",
                        boxShadow:
                          "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Enrollment Header */}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 14,
                            alignItems:
                              "flex-start",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background:
                                "#EAF0FE",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                            }}
                          >
                            <Package
                              size={19}
                              color="#3B6BF0"
                            />
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  14.5,
                                fontWeight:
                                  700,
                                color:
                                  "#111827",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {safeText(
                                enrollment
                                  .package
                                  ?.title ||
                                  enrollment
                                    .course
                                    ?.title ||
                                  "Course Enrollment"
                              )}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  12.5,
                                color:
                                  "#6B7280",
                                marginTop: 3,
                              }}
                            >
                              Enrolled on{" "}
                              {formatDate(
                                enrollment.enrolledAt
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            background:
                              enrollment.status ===
                              "ACTIVE"
                                ? "#E9F9EF"
                                : "#FDF3E3",
                            color:
                              enrollment.status ===
                              "ACTIVE"
                                ? "#22A555"
                                : "#B4790E",
                            fontSize: 12,
                            fontWeight: 600,
                            padding:
                              "5px 9px",
                            borderRadius: 6,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatStatus(
                            enrollment.status
                          )}
                        </span>
                      </div>

                      {/* Package Courses */}

                      {packageCourses.length >
                        0 && (
                        <div
                          style={{
                            marginTop: 14,
                            paddingTop: 12,
                            borderTop:
                              "1px solid #F1F2F5",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                "#6B7280",
                              marginBottom: 8,
                            }}
                          >
                            Included Courses
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              flexWrap:
                                "wrap",
                              gap: 7,
                            }}
                          >
                            {packageCourses.map(
                              (course) => (
                                <span
                                  key={
                                    course.id
                                  }
                                  style={{
                                    background:
                                      "#F8FAFC",
                                    border:
                                      "1px solid #E5E7EB",
                                    color:
                                      "#374151",
                                    fontSize:
                                      11.5,
                                    padding:
                                      "5px 9px",
                                    borderRadius:
                                      6,
                                  }}
                                >
                                  {safeText(
                                    course.title
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Individual Course */}

                      {packageCourses.length ===
                        0 &&
                        individualCourse && (
                          <div
                            style={{
                              marginTop: 14,
                              paddingTop: 12,
                              borderTop:
                                "1px solid #F1F2F5",
                            }}
                          >
                            <span
                              style={{
                                background:
                                  "#F8FAFC",
                                border:
                                  "1px solid #E5E7EB",
                                color:
                                  "#374151",
                                fontSize:
                                  11.5,
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  6,
                              }}
                            >
                              {safeText(
                                individualCourse.title
                              )}
                            </span>
                          </div>
                        )}
                    </div>
                  );
                }
              )
            )}
          </div>

          {/* ===============================================
              TODAY'S CLASSES
          =============================================== */}

          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Today's Classes
          </h2>

          <div
            style={{
              marginBottom: 28,
            }}
          >
            {liveClasses.length === 0 ? (
              <EmptyCard
                icon={GraduationCap}
                title="No live classes scheduled"
                message="Live classes will appear here once the class scheduling module is available."
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 12,
                }}
              >
                {liveClasses.map(
                  (item, index) => (
                    <div
                      key={index}
                      style={{
                        background:
                          "#fff",
                        borderRadius: 12,
                        padding:
                          "16px 18px",
                        boxShadow:
                          "0 1px 2px rgba(0,0,0,0.04)",
                        fontSize: 13,
                        color:
                          "#374151",
                      }}
                    >
                      {safeText(item)}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ===============================================
              ASSIGNMENTS & QUIZZES
          =============================================== */}

          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Assignments & Quizzes
          </h2>

          <div
            style={{
              marginBottom: 28,
            }}
          >
            {pendingWorkCount === 0 ? (
              <EmptyCard
                icon={ClipboardList}
                title="No assignments or quizzes"
                message="Assignments and quizzes will appear here when they are assigned to you."
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 12,
                }}
              >
                {assignments.map(
                  (item, index) => (
                    <div
                      key={`assignment-${index}`}
                      style={{
                        background:
                          "#fff",
                        borderRadius: 12,
                        padding:
                          "16px 18px",
                        boxShadow:
                          "0 1px 2px rgba(0,0,0,0.04)",
                        fontSize: 13,
                        color:
                          "#374151",
                      }}
                    >
                      {safeText(item)}
                    </div>
                  )
                )}

                {quizzes.map(
                  (item, index) => (
                    <div
                      key={`quiz-${index}`}
                      style={{
                        background:
                          "#fff",
                        borderRadius: 12,
                        padding:
                          "16px 18px",
                        boxShadow:
                          "0 1px 2px rgba(0,0,0,0.04)",
                        fontSize: 13,
                        color:
                          "#374151",
                      }}
                    >
                      {safeText(item)}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div>
          {/* ===============================================
              PROFILE
          =============================================== */}

          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            My Profile
          </h2>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "18px",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04)",
              marginBottom: 24,
            }}
          >
            <ProfileRow
              label="Name"
              value={safeText(
                student.name
              )}
            />

            <ProfileRow
              label="Student ID"
              value={safeText(
                student.studentId
              )}
            />

            <ProfileRow
              label="Email"
              value={safeText(
                student.email
              )}
            />

            <ProfileRow
              label="Phone"
              value={
                student.phone
                  ? safeText(
                      student.phone
                    )
                  : "Not provided"
              }
            />

            <ProfileRow
              label="State"
              value={
                student.state
                  ? safeText(
                      student.state
                    )
                  : "Not provided"
              }
              last
            />
          </div>

          {/* ===============================================
              PAYMENTS
          =============================================== */}

          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Recent Payments
          </h2>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "6px 18px",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04)",
              marginBottom: 24,
            }}
          >
            {payments.length === 0 ? (
              <div
                style={{
                  padding:
                    "20px 0",
                  textAlign:
                    "center",
                  fontSize: 12.5,
                  color:
                    "#6B7280",
                }}
              >
                No payment records
                found.
              </div>
            ) : (
              payments
                .slice(0, 5)
                .map(
                  (
                    payment,
                    index
                  ) => (
                    <div
                      key={
                        payment.id
                      }
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 12,
                        padding:
                          "13px 0",
                        borderBottom:
                          index <
                          Math.min(
                            payments.length,
                            5
                          ) -
                            1
                            ? "1px solid #F1F2F5"
                            : "none",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize:
                              13,
                            fontWeight:
                              600,
                            color:
                              "#111827",
                          }}
                        >
                          {formatCurrency(
                            payment.amount,
                            payment.currency
                          )}
                        </div>

                        <div
                          style={{
                            fontSize:
                              11.5,
                            color:
                              "#9CA3AF",
                            marginTop:
                              2,
                          }}
                        >
                          {formatDate(
                            payment.createdAt
                          )}
                        </div>

                        <div
                          style={{
                            fontSize:
                              11,
                            color:
                              "#9CA3AF",
                            marginTop:
                              2,
                          }}
                        >
                          {safeText(
                            payment.method
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          height:
                            "fit-content",
                          background:
                            payment.status ===
                            "SUCCESS"
                              ? "#E9F9EF"
                              : "#FDF3E3",
                          color:
                            payment.status ===
                            "SUCCESS"
                              ? "#22A555"
                              : "#B4790E",
                          fontSize:
                            11.5,
                          fontWeight:
                            600,
                          padding:
                            "4px 8px",
                          borderRadius:
                            6,
                        }}
                      >
                        {formatStatus(
                          payment.status
                        )}
                      </span>
                    </div>
                  )
                )
            )}
          </div>

          {/* ===============================================
              RECENT ACTIVITY
          =============================================== */}

          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Recent Activity
          </h2>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "6px 18px",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {recentActivity.length === 0 ? (
              <div
                style={{
                  padding:
                    "20px 0",
                  textAlign:
                    "center",
                  fontSize: 12.5,
                  color:
                    "#6B7280",
                }}
              >
                No recent activity
                yet.
              </div>
            ) : (
              recentActivity.map(
                (
                  activity,
                  index
                ) => (
                  <div
                    key={index}
                    style={{
                      display:
                        "flex",
                      gap: 12,
                      padding:
                        "14px 0",
                      borderBottom:
                        index <
                        recentActivity.length -
                          1
                          ? "1px solid #F1F2F5"
                          : "none",
                    }}
                  >
                    <CheckCircle2
                      size={17}
                      color="#2F6BFF"
                      style={{
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontSize:
                            13.5,
                          fontWeight:
                            600,
                          color:
                            "#111827",
                        }}
                      >
                        {safeText(
                          activity
                        )}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  value,
  label,
  bg,
  fg,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          size={19}
          color={fg}
        />
      </div>

      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {safeText(value)}
        </div>

        <div
          style={{
            fontSize: 12.5,
            color: "#6B7280",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY CARD
========================================================= */

function EmptyCard({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "22px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          size={18}
          color="#94A3B8"
        />
      </div>

      <div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#374151",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            marginTop: 3,
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE ROW
========================================================= */

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: last
          ? "none"
          : "1px solid #F1F2F5",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          color: "#9CA3AF",
          marginBottom: 3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          wordBreak:
            "break-word",
        }}
      >
        {safeText(value)}
      </div>
    </div>
  );
}