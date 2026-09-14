"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Package,
  PlayCircle,
  RefreshCw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Course = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  duration: string | null;
  modules: number | null;
  price: number | null;
  isActive: boolean;
};

type PackageCourseItem = {
  id: number;
  packageId: number;
  courseId: number;
  course: Course;
};

type CoursePackage = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  isActive: boolean;
  courses: PackageCourseItem[];
};

type Enrollment = {
  id: number;
  userId: number;
  studentId: number;
  courseId: number | null;
  packageId: number | null;
  status:
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELLED"
    | "PENDING";
  enrolledAt: string;
  completedAt: string | null;
  course: Course | null;
  package: CoursePackage | null;
};

type Student = {
  id: number;
  studentId: string;
  name: string;
  email: string;
  phone: string | null;
  state: string | null;
  referralId: string | null;
  isActive: boolean;
};

type DashboardStats = {
  enrolledCourses: number;
  activeEnrollments: number;
  successfulPayments: number;
  totalPaid: number;
};

type DashboardData = {
  student: Student;
  stats: DashboardStats;
  enrollments: Enrollment[];
};

type DashboardResponse = {
  success: boolean;
  message: string;
  data?: DashboardData;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function MyCoursesPage() {
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Load dashboard                                                            */
  /* ------------------------------------------------------------------------ */

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) {
          setError(
            "Your session has expired. Please log in again."
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

        const result =
          (await response.json()) as DashboardResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load your courses."
          );
        }

        setData(result.data ?? null);
      } catch (err) {
        console.error(
          "Failed to load student courses:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your courses."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* Initial load                                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ------------------------------------------------------------------------ */
  /* Build unique course list                                                  */
  /* ------------------------------------------------------------------------ */

  const enrolledCourses = useMemo(() => {
    if (!data) {
      return [];
    }

    const courseMap = new Map<
      number,
      {
        course: Course;
        enrollment: Enrollment;
        packageTitle: string | null;
      }
    >();

    for (const enrollment of data.enrollments) {
      /* -------------------------------------------------------------------- */
      /* Direct course enrollment                                              */
      /* -------------------------------------------------------------------- */

      if (enrollment.course) {
        if (
          !courseMap.has(
            enrollment.course.id
          )
        ) {
          courseMap.set(
            enrollment.course.id,
            {
              course: enrollment.course,
              enrollment,
              packageTitle:
                enrollment.package?.title ??
                null,
            }
          );
        }
      }

      /* -------------------------------------------------------------------- */
      /* Package enrollment                                                    */
      /* -------------------------------------------------------------------- */

      if (enrollment.package) {
        for (const packageItem of
          enrollment.package.courses) {
          const course = packageItem.course;

          if (!course) {
            continue;
          }

          if (!courseMap.has(course.id)) {
            courseMap.set(course.id, {
              course,
              enrollment,
              packageTitle:
                enrollment.package.title,
            });
          }
        }
      }
    }

    return Array.from(courseMap.values());
  }, [data]);

  /* ------------------------------------------------------------------------ */
  /* Statistics                                                                */
  /* ------------------------------------------------------------------------ */

  const enrolledCourseCount =
    enrolledCourses.length;

  const activeCourseCount =
    enrolledCourses.filter(
      ({ enrollment }) =>
        enrollment.status === "ACTIVE"
    ).length;

  const pendingOrCompletedCount =
    enrolledCourses.filter(
      ({ enrollment }) =>
        enrollment.status === "PENDING" ||
        enrollment.status === "COMPLETED"
    ).length;

  /* ------------------------------------------------------------------------ */
  /* Package enrollments                                                       */
  /* ------------------------------------------------------------------------ */

  const packages = useMemo(() => {
    if (!data) {
      return [];
    }

    const packageMap = new Map<
      number,
      CoursePackage
    >();

    for (const enrollment of data.enrollments) {
      if (enrollment.package) {
        packageMap.set(
          enrollment.package.id,
          enrollment.package
        );
      }
    }

    return Array.from(packageMap.values());
  }, [data]);

  /* ------------------------------------------------------------------------ */
  /* Navigation                                                                */
  /* ------------------------------------------------------------------------ */

  const openCourse = (courseId: number) => {
    router.push(
      `/dashboard/student/my-courses/${courseId}`
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                              */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main
        style={{
          padding: "28px 32px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ marginBottom: "26px" }}>
          <div
            style={{
              width: "180px",
              height: "28px",
              background: "#E5E7EB",
              borderRadius: "7px",
              marginBottom: "9px",
            }}
          />

          <div
            style={{
              width: "280px",
              height: "16px",
              background: "#E5E7EB",
              borderRadius: "6px",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                height: "88px",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              style={{
                height: "380px",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
              }}
            />
          ))}
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error state                                                               */
  /* ------------------------------------------------------------------------ */

  if (error) {
    return (
      <main
        style={{
          padding: "28px 32px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #FECACA",
            borderRadius: "14px",
            padding: "45px 25px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "#FEF2F2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Clock3 size={23} />
          </div>

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: "18px",
              color: "#111827",
            }}
          >
            Unable to load your courses
          </h2>

          <p
            style={{
              margin: "0 auto 18px",
              maxWidth: "500px",
              color: "#6B7280",
              fontSize: "13px",
            }}
          >
            {error}
          </p>

          <button
            onClick={() => loadDashboard()}
            style={{
              border: "none",
              background: "#2F6BFF",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "13px",
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

  /* ------------------------------------------------------------------------ */
  /* Main page                                                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "26px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 5px",
            }}
          >
            My Courses
          </h1>

          <p
            style={{
              color: "#6B7280",
              fontSize: "14px",
              margin: 0,
            }}
          >
            Your enrolled courses and learning
            programs.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          title="Refresh courses"
          style={{
            width: "42px",
            height: "42px",
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            color: "#374151",
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: refreshing
              ? "default"
              : "pointer",
            opacity: refreshing ? 0.65 : 1,
          }}
        >
          <RefreshCw
            size={18}
            style={{
              animation: refreshing
                ? "spin 1s linear infinite"
                : undefined,
            }}
          />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary Cards                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          icon={<BookOpen size={19} />}
          label="Enrolled Courses"
          value={String(enrolledCourseCount)}
        />

        <SummaryCard
          icon={<CheckCircle2 size={19} />}
          label="Active Courses"
          value={String(activeCourseCount)}
        />

        <SummaryCard
          icon={<Clock3 size={19} />}
          label="Pending / Completed"
          value={String(pendingOrCompletedCount)}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Package Enrollment                                                  */}
      {/* ------------------------------------------------------------------ */}

      {packages.length > 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "14px",
            padding: "17px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Package
              size={17}
              color="#2F6BFF"
            />

            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Your Enrollment
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {packages.map((pkg) => (
              <span
                key={pkg.id}
                style={{
                  padding: "7px 12px",
                  borderRadius: "999px",
                  border:
                    "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  color: "#374151",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {pkg.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Courses                                                             */}
      {/* ------------------------------------------------------------------ */}

      {enrolledCourses.length === 0 ? (
        <EmptyCourses />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {enrolledCourses.map(
            ({
              course,
              enrollment,
              packageTitle,
            }) => (
              <CourseCard
                key={course.id}
                course={course}
                enrollment={enrollment}
                packageTitle={packageTitle}
                onView={() =>
                  openCourse(course.id)
                }
                onContinue={() =>
                  openCourse(course.id)
                }
              />
            )
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Responsive styles                                                   */}
      {/* ------------------------------------------------------------------ */}

      <style jsx>{`
        @media (max-width: 1100px) {
          main {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }

        @media (max-width: 800px) {
          main > div:nth-of-type(2) {
            grid-template-columns: 1fr !important;
          }

          main > div:nth-of-type(4) {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          main {
            padding: 20px 16px !important;
          }
        }

        @keyframes spin {
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

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "17px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "9px",
          background: "#EAF0FE",
          color: "#2F6BFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "11px",
            color: "#6B7280",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Course Card                                                                */
/* -------------------------------------------------------------------------- */

function CourseCard({
  course,
  enrollment,
  packageTitle,
  onContinue,
  onView,
}: {
  course: Course;
  enrollment: Enrollment;
  packageTitle: string | null;
  onContinue: () => void;
  onView: () => void;
}) {
  const statusLabel =
    enrollment.status === "ACTIVE"
      ? "Active"
      : enrollment.status === "COMPLETED"
        ? "Completed"
        : enrollment.status === "PENDING"
          ? "Pending"
          : "Cancelled";

  const statusStyle =
    enrollment.status === "ACTIVE"
      ? {
          background: "#ECFDF3",
          color: "#15803D",
        }
      : enrollment.status === "COMPLETED"
        ? {
            background: "#EFF6FF",
            color: "#2563EB",
          }
        : enrollment.status === "PENDING"
          ? {
              background: "#FFFBEB",
              color: "#B45309",
            }
          : {
              background: "#FEF2F2",
              color: "#DC2626",
            };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        padding: "20px",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {/* Course Header */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#EAF0FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen
              size={20}
              color="#2F6BFF"
            />
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.35,
              }}
            >
              {course.title}
            </h2>

            {packageTitle && (
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: "#6B7280",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Package size={12} />
                {packageTitle}
              </div>
            )}
          </div>
        </div>

        <span
          style={{
            padding: "5px 9px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            ...statusStyle,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Description */}

      <p
        style={{
          margin: "0 0 18px",
          fontSize: "12.5px",
          lineHeight: 1.6,
          color: "#6B7280",
          minHeight: "40px",
        }}
      >
        {course.description ||
          "Course information will be available soon."}
      </p>

      {/* Course Information */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <InfoItem
          label="Mode"
          value={formatMode(course.mode)}
        />

        <InfoItem
          label="Duration"
          value={
            course.duration ||
            "Not specified"
          }
        />

        <InfoItem
          label="Modules"
          value={
            course.modules !== null
              ? String(course.modules)
              : "Not available"
          }
        />

        <InfoItem
          label="Enrolled On"
          value={formatDate(
            enrollment.enrolledAt
          )}
        />
      </div>

      {/* Learning Progress */}

      <div
        style={{
          padding: "11px 12px",
          background: "#F9FAFB",
          border: "1px solid #F0F1F3",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "#6B7280",
          }}
        >
          Learning Progress
        </span>

        <span
          style={{
            fontSize: "11px",
            color: "#9CA3AF",
            fontWeight: 500,
          }}
        >
          Not available yet
        </span>
      </div>

      {/* Actions */}

      <div
        style={{
          display: "flex",
          gap: "9px",
        }}
      >
        <button
          onClick={onView}
          style={{
            flex: 1,
            height: "40px",
            border:
              "1px solid #D7DCE5",
            background: "#FFFFFF",
            color: "#374151",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          View Course
        </button>

        <button
          onClick={onContinue}
          disabled={
            enrollment.status ===
            "CANCELLED"
          }
          style={{
            flex: 1,
            height: "40px",
            border: "none",
            background:
              enrollment.status ===
              "CANCELLED"
                ? "#D1D5DB"
                : "#2F6BFF",
            color: "#FFFFFF",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor:
              enrollment.status ===
              "CANCELLED"
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <PlayCircle size={15} />

          Continue

          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Info Item                                                                  */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "9px 10px",
        background: "#F9FAFB",
        borderRadius: "8px",
        border: "1px solid #F0F1F3",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#9CA3AF",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "11.5px",
          color: "#374151",
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty Courses                                                              */
/* -------------------------------------------------------------------------- */

function EmptyCourses() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        padding: "55px 25px",
        textAlign: "center",
      }}
    >
      <BookOpen
        size={42}
        color="#9CA3AF"
        style={{
          marginBottom: "12px",
        }}
      />

      <h3
        style={{
          margin: "0 0 6px",
          fontSize: "17px",
          color: "#111827",
        }}
      >
        No Courses Assigned
      </h3>

      <p
        style={{
          margin: 0,
          color: "#6B7280",
          fontSize: "13px",
        }}
      >
        Your enrolled courses will appear
        here once you complete registration
        and payment.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatMode(
  mode: Course["mode"]
) {
  switch (mode) {
    case "ONLINE":
      return "Online";

    case "OFFLINE":
      return "Offline";

    case "HYBRID":
      return "Hybrid";

    default:
      return "Not specified";
  }
}

function formatDate(
  value: string
) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}