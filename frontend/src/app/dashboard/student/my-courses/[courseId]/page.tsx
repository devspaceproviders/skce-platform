"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  PlayCircle,
  Package,
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

type StudentDashboard = {
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
  enrollments: Enrollment[];
};

type DashboardResponse = {
  success: boolean;
  message: string;
  data?: StudentDashboard;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.courseId);

  const [dashboard, setDashboard] =
    useState<StudentDashboard | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Load student dashboard                                                    */
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
              "Failed to load course information."
          );
        }

        setDashboard(result.data ?? null);
      } catch (err) {
        console.error(
          "Failed to load course:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load course information."
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
  /* Find selected course                                                      */
  /* ------------------------------------------------------------------------ */

  const selectedCourse = useMemo(() => {
    if (!dashboard || !Number.isFinite(courseId)) {
      return null;
    }

    for (const enrollment of dashboard.enrollments) {
      /* Direct enrollment */

      if (
        enrollment.course &&
        enrollment.course.id === courseId
      ) {
        return {
          course: enrollment.course,
          enrollment,
          packageTitle:
            enrollment.package?.title ?? null,
        };
      }

      /* Package enrollment */

      if (enrollment.package) {
        const packageCourse =
          enrollment.package.courses.find(
            (item) =>
              item.course &&
              item.course.id === courseId
          );

        if (packageCourse) {
          return {
            course: packageCourse.course,
            enrollment,
            packageTitle:
              enrollment.package.title,
          };
        }
      }
    }

    return null;
  }, [dashboard, courseId]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            width: "130px",
            height: "16px",
            background: "#E5E7EB",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        />

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "180px",
              background: "#EEF2F7",
            }}
          />

          <div
            style={{
              padding: "24px",
            }}
          >
            <div
              style={{
                width: "260px",
                height: "25px",
                background: "#E5E7EB",
                borderRadius: "6px",
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                width: "80%",
                height: "16px",
                background: "#E5E7EB",
                borderRadius: "6px",
                marginBottom: "25px",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  style={{
                    height: "75px",
                    background: "#F3F4F6",
                    borderRadius: "9px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                     */
  /* ------------------------------------------------------------------------ */

  if (error) {
    return (
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 32px",
        }}
      >
        <button
          onClick={() =>
            router.push(
              "/dashboard/student/my-courses"
            )
          }
          style={{
            border: "none",
            background: "transparent",
            color: "#374151",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "22px",
          }}
        >
          <ArrowLeft size={16} />
          Back to My Courses
        </button>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #FECACA",
            borderRadius: "14px",
            padding: "55px 25px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#FEF2F2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Clock3 size={24} />
          </div>

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: "18px",
              color: "#111827",
            }}
          >
            Unable to load course
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
            onClick={() =>
              loadDashboard()
            }
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
  /* Course not enrolled                                                       */
  /* ------------------------------------------------------------------------ */

  if (!selectedCourse) {
    return (
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 32px",
        }}
      >
        <button
          onClick={() =>
            router.push(
              "/dashboard/student/my-courses"
            )
          }
          style={{
            border: "none",
            background: "transparent",
            color: "#374151",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "22px",
          }}
        >
          <ArrowLeft size={16} />
          Back to My Courses
        </button>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "14px",
            padding: "60px 25px",
            textAlign: "center",
          }}
        >
          <BookOpen
            size={44}
            color="#9CA3AF"
            style={{
              marginBottom: "14px",
            }}
          />

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: "19px",
              color: "#111827",
            }}
          >
            Course Not Available
          </h2>

          <p
            style={{
              margin: "0 auto 20px",
              maxWidth: "500px",
              color: "#6B7280",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            This course is not part of your current
            enrollment or is no longer available.
          </p>

          <button
            onClick={() =>
              router.push(
                "/dashboard/student/my-courses"
              )
            }
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
            View My Courses
          </button>
        </div>
      </main>
    );
  }

  const {
    course,
    enrollment,
    packageTitle,
  } = selectedCourse;

  /* ------------------------------------------------------------------------ */
  /* Main course learning area                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      style={{
        flex: 1,
        minWidth: 0,
        padding: "24px 32px 40px",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Top controls                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() =>
            router.push(
              "/dashboard/student/my-courses"
            )
          }
          style={{
            border: "none",
            background: "transparent",
            color: "#374151",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} />
          Back to My Courses
        </button>

        <button
          onClick={() =>
            loadDashboard(true)
          }
          disabled={refreshing}
          title="Refresh course"
          style={{
            width: "40px",
            height: "40px",
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
            size={17}
            style={{
              animation: refreshing
                ? "spin 1s linear infinite"
                : undefined,
            }}
          />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Course Header                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        {/* Course banner */}

        <div
          style={{
            minHeight: "175px",
            background:
              "linear-gradient(135deg, #12172B 0%, #1D315D 55%, #2F6BFF 100%)",
            padding: "30px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: "850px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: "999px",
                  background:
                    "rgba(255,255,255,0.14)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {formatMode(course.mode)}
              </span>

              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: "999px",
                  background:
                    enrollment.status ===
                    "ACTIVE"
                      ? "rgba(34,197,94,0.18)"
                      : "rgba(255,255,255,0.14)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {formatStatus(
                  enrollment.status
                )}
              </span>

              {packageTitle && (
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "999px",
                    background:
                      "rgba(255,255,255,0.14)",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {packageTitle}
                </span>
              )}
            </div>

            <h1
              style={{
                margin: "0 0 8px",
                color: "#FFFFFF",
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1.25,
              }}
            >
              {course.title}
            </h1>

            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.78)",
                fontSize: "13px",
                lineHeight: 1.6,
                maxWidth: "760px",
              }}
            >
              {course.description ||
                "Course information will be available soon."}
            </p>
          </div>
        </div>

        {/* Course information */}

        <div
          style={{
            padding: "20px",
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <CourseInfo
            icon={<BookOpen size={17} />}
            label="Modules"
            value={
              course.modules !== null
                ? String(course.modules)
                : "Not available"
            }
          />

          <CourseInfo
            icon={<Clock3 size={17} />}
            label="Duration"
            value={
              course.duration ||
              "Not specified"
            }
          />

          <CourseInfo
            icon={<CheckCircle2 size={17} />}
            label="Enrollment"
            value={formatStatus(
              enrollment.status
            )}
          />

          <CourseInfo
            icon={<FileText size={17} />}
            label="Enrolled On"
            value={formatDate(
              enrollment.enrolledAt
            )}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Learning Area                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom:
              "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}
        >
          <PlayCircle
            size={18}
            color="#2F6BFF"
          />

          <h2
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Course Learning Area
          </h2>
        </div>

        <div
          style={{
            padding: "55px 25px",
            textAlign: "center",
            background: "#FAFBFC",
          }}
        >
          <div
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "14px",
              background: "#EAF0FE",
              color: "#2F6BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <PlayCircle size={30} />
          </div>

          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              color: "#111827",
            }}
          >
            Learning Content Coming Soon
          </h3>

          <p
            style={{
              margin: "0 auto",
              maxWidth: "580px",
              color: "#6B7280",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            Lessons, videos, documents and other
            learning materials will appear here once
            course content is added to the learning
            system.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Course status                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#F0FDF4",
              color: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} />
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 5px",
                fontSize: "14px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Enrollment Status
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: "12.5px",
                color: "#6B7280",
                lineHeight: 1.6,
              }}
            >
              You are currently enrolled in{" "}
              <strong
                style={{
                  color: "#374151",
                }}
              >
                {course.title}
              </strong>
              .
              {packageTitle
                ? ` This course is included in your ${packageTitle} package.`
                : ""}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Responsive styles                                                   */}
      {/* ------------------------------------------------------------------ */}

      <style jsx>{`
        @media (max-width: 900px) {
          main {
            padding-left: 22px !important;
            padding-right: 22px !important;
          }

          section > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 600px) {
          main {
            padding: 20px 16px 30px !important;
          }

          section > div:last-child {
            grid-template-columns: 1fr !important;
          }

          h1 {
            font-size: 23px !important;
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
/* Course Info                                                                */
/* -------------------------------------------------------------------------- */

function CourseInfo({
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
        padding: "12px",
        background: "#F9FAFB",
        border: "1px solid #F0F1F3",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
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

      <div
        style={{
          minWidth: 0,
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
            fontSize: "12px",
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

function formatStatus(
  status: Enrollment["status"]
) {
  switch (status) {
    case "ACTIVE":
      return "Active";

    case "COMPLETED":
      return "Completed";

    case "PENDING":
      return "Pending";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
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