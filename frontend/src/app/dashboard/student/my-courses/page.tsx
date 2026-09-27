"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Course = {
  id: number;
  title: string;
  slug?: string | null;
  description?: string | null;
  mode?: string | null;
  isActive?: boolean;
};

type PackageCourse = {
  id: number;
  packageId: number;
  courseId: number;
  course: Course | null;
};

type PackageData = {
  id: number;
  slug?: string | null;
  title: string;
  description?: string | null;
  price?: number | null;
  isActive?: boolean;
  courses: PackageCourse[];
};

type Enrollment = {
  id: number;
  userId: number;
  studentId?: number | null;
  courseId?: number | null;
  packageId?: number | null;
  status: string;
  enrolledAt?: string | null;
  completedAt?: string | null;
  course: Course | null;
  package: PackageData | null;
};

type DashboardData = {
  id: number;
  name: string;
  email: string;
  studentId?: string | null;
  enrollments: Enrollment[];
};

type CourseProgress = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  startedLessons: number;
  remainingLessons: number;
  progressPercentage: number;
  lessons: {
    lessonId: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  }[];
};

type StudentCourse = {
  course: Course;
  enrollmentStatus: string;
  packageName: string | null;
  enrolledAt: string | null;
};

export default function MyCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [progressMap, setProgressMap] = useState<
    Record<number, CourseProgress>
  >({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * GET TOKEN
   * ---------------------------------------------------------
   */
  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  /*
   * ---------------------------------------------------------
   * LOAD STUDENT COURSES
   * ---------------------------------------------------------
   */
  const loadCourses = async () => {
    const token = getToken();

    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/students/me/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Failed to load your courses."
        );
      }

      const dashboard: DashboardData =
        json?.data ?? json;

      const enrollmentList =
        dashboard?.enrollments ?? [];

      /*
       * -----------------------------------------------------
       * BUILD UNIQUE COURSE LIST
       *
       * Handles:
       * 1. Direct course enrollment
       * 2. Package enrollment
       * -----------------------------------------------------
       */

      const courseMap = new Map<
        number,
        StudentCourse
      >();

      for (const enrollment of enrollmentList) {
        /*
         * Direct course
         */
        if (enrollment.course) {
          courseMap.set(enrollment.course.id, {
            course: enrollment.course,
            enrollmentStatus: enrollment.status,
            packageName: null,
            enrolledAt:
              enrollment.enrolledAt ?? null,
          });
        }

        /*
         * Package courses
         */
        if (enrollment.package) {
          for (const packageItem of enrollment.package
            .courses ?? []) {
            if (!packageItem.course) {
              continue;
            }

            const courseId =
              packageItem.course.id;

            /*
             * Don't overwrite an existing direct
             * enrollment with package information.
             */
            if (!courseMap.has(courseId)) {
              courseMap.set(courseId, {
                course: packageItem.course,
                enrollmentStatus:
                  enrollment.status,
                packageName:
                  enrollment.package.title,
                enrolledAt:
                  enrollment.enrolledAt ?? null,
              });
            }
          }
        }
      }

      const studentCourses = Array.from(
        courseMap.values()
      );

      setCourses(studentCourses);

      /*
       * -----------------------------------------------------
       * LOAD PROGRESS FOR EVERY COURSE
       * -----------------------------------------------------
       */

      const progressResults =
        await Promise.all(
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

              const progressJson =
                await progressResponse.json();

              if (!progressResponse.ok) {
                return null;
              }

              const progress: CourseProgress =
                progressJson?.data ??
                progressJson;

              return progress;
            } catch (progressError) {
              console.error(
                `Progress error for course ${item.course.id}:`,
                progressError
              );

              return null;
            }
          })
        );

      /*
       * Convert progress array into lookup map.
       */
      const nextProgressMap: Record<
        number,
        CourseProgress
      > = {};

      for (const progress of progressResults) {
        if (progress) {
          nextProgressMap[progress.courseId] =
            progress;
        }
      }

      setProgressMap(nextProgressMap);
    } catch (err: any) {
      console.error(
        "My Courses error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your courses."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */
  useEffect(() => {
    loadCourses();
  }, []);

  /*
   * ---------------------------------------------------------
   * REFRESH
   * ---------------------------------------------------------
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
  };

  /*
   * ---------------------------------------------------------
   * COURSE PROGRESS
   * ---------------------------------------------------------
   */
  const getCourseProgress = (
    courseId: number
  ): CourseProgress => {
    return (
      progressMap[courseId] ?? {
        courseId,
        totalLessons: 0,
        completedLessons: 0,
        startedLessons: 0,
        remainingLessons: 0,
        progressPercentage: 0,
        lessons: [],
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   */
  const averageProgress = useMemo(() => {
    if (courses.length === 0) {
      return 0;
    }

    const total = courses.reduce(
      (sum, item) =>
        sum +
        getCourseProgress(item.course.id)
          .progressPercentage,
      0
    );

    return Math.round(
      total / courses.length
    );
  }, [courses, progressMap]);

  const completedCourses = useMemo(() => {
    return courses.filter(
      (item) =>
        getCourseProgress(item.course.id)
          .progressPercentage === 100
    ).length;
  }, [courses, progressMap]);

  const activeCourses = useMemo(() => {
    return courses.filter(
      (item) =>
        getCourseProgress(item.course.id)
          .progressPercentage < 100
    ).length;
  }, [courses, progressMap]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading) {
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
            border: "1px solid #E5E7EB",
            borderRadius: "14px",
            padding: "60px 25px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              margin: "0 auto 14px",
              borderRadius: "50%",
              border: "4px solid #E5E7EB",
              borderTopColor: "#A01441",
              animation:
                "spin 0.8s linear infinite",
            }}
          />

          <p
            style={{
              margin: 0,
              color: "#6B7280",
              fontSize: "14px",
            }}
          >
            Loading your courses...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */
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
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              color: "#B91C1C",
            }}
          >
            Unable to Load Courses
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "#6B7280",
              fontSize: "13px",
            }}
          >
            {error}
          </p>

          <button
            onClick={handleRefresh}
            style={{
              border: "none",
              background: "#A01441",
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

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div
        style={{
          marginBottom: "26px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "15px",
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
            Courses assigned to your student account.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            border: "1px solid #D7DCE5",
            background: "#FFFFFF",
            color: "#374151",
            borderRadius: "8px",
            padding: "9px 13px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: refreshing
              ? "not-allowed"
              : "pointer",
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: refreshing
                ? "spin 0.8s linear infinite"
                : undefined,
            }}
          />

          Refresh
        </button>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}
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
          value={String(courses.length)}
        />

        <SummaryCard
          icon={<BarChart3 size={19} />}
          label="Average Progress"
          value={`${averageProgress}%`}
        />

        <SummaryCard
          icon={<CheckCircle2 size={19} />}
          label="Completed Courses"
          value={`${completedCourses}/${courses.length}`}
        />
      </div>

      {/* =====================================================
          COURSE LIST
      ====================================================== */}
      {courses.length === 0 ? (
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
            Your assigned courses will appear here once
            you are enrolled.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {courses.map((item) => {
            const progress =
              getCourseProgress(item.course.id);

            return (
              <CourseCard
                key={item.course.id}
                course={item.course}
                progress={progress}
                enrollmentStatus={
                  item.enrollmentStatus
                }
                packageName={
                  item.packageName
                }
                onContinue={() =>
                  router.push(
                    `/dashboard/student/my-courses/${item.course.id}`
                  )
                }
              />
            );
          })}
        </div>
      )}

      {/* =====================================================
          ACTIVE COURSE SUMMARY
      ====================================================== */}
      {courses.length > 0 && (
        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "17px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
                marginBottom: "5px",
              }}
            >
              Courses In Progress
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {activeCourses}
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "17px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
                marginBottom: "5px",
              }}
            >
              Completed Courses
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#15803D",
              }}
            >
              {completedCourses}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          main {
            padding: 22px 18px !important;
          }

          div[style*="repeat(3"] {
            grid-template-columns: 1fr !important;
          }

          div[style*="repeat(2"] {
            grid-template-columns: 1fr !important;
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
          background: "#F8EAF0",
          color: "#A01441",
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
  progress,
  enrollmentStatus,
  packageName,
  onContinue,
}: {
  course: Course;
  progress: CourseProgress;
  enrollmentStatus: string;
  packageName: string | null;
  onContinue: () => void;
}) {
  const isCompleted =
    progress.progressPercentage === 100;

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
              background: "#F8EAF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen
              size={20}
              color="#A01441"
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

            {course.mode && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#6B7280",
                }}
              >
                {course.mode}
              </div>
            )}
          </div>
        </div>

        <span
          style={{
            padding: "5px 9px",
            borderRadius: "999px",
            background: isCompleted
              ? "#ECFDF3"
              : "#EFF6FF",
            color: isCompleted
              ? "#15803D"
              : "#2563EB",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {isCompleted
            ? "Completed"
            : enrollmentStatus === "ACTIVE"
            ? "Active"
            : enrollmentStatus}
        </span>
      </div>

      {/* Description */}
      {course.description && (
        <p
          style={{
            margin: "0 0 18px",
            fontSize: "12.5px",
            lineHeight: 1.6,
            color: "#6B7280",
          }}
        >
          {course.description}
        </p>
      )}

      {/* Package */}
      {packageName && (
        <div
          style={{
            marginBottom: "15px",
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
            Package
          </div>

          <div
            style={{
              fontSize: "11.5px",
              color: "#374151",
              fontWeight: 600,
            }}
          >
            {packageName}
          </div>
        </div>
      )}

      {/* Progress */}
      <div
        style={{
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "7px",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              color: "#6B7280",
            }}
          >
            Course Progress
          </span>

          <span
            style={{
              color: isCompleted
                ? "#15803D"
                : "#A01441",
              fontWeight: 700,
            }}
          >
            {progress.progressPercentage}%
          </span>
        </div>

        <div
          style={{
            height: "8px",
            background: "#EEF0F4",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress.progressPercentage}%`,
              background: isCompleted
                ? "#16A34A"
                : "#A01441",
              borderRadius: "999px",
              transition:
                "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Lesson Information */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <InfoItem
          label="Lessons"
          value={`${progress.completedLessons}/${progress.totalLessons}`}
        />

        <InfoItem
          label="Remaining"
          value={String(
            progress.remainingLessons
          )}
        />

        <InfoItem
          label="Started"
          value={String(
            progress.startedLessons
          )}
        />

        <InfoItem
          label="Status"
          value={
            isCompleted
              ? "Completed"
              : progress.startedLessons > 0
              ? "In Progress"
              : "Not Started"
          }
        />
      </div>

      {/* Action */}
      <button
        onClick={onContinue}
        style={{
          width: "100%",
          height: "40px",
          border: "none",
          background: "#A01441",
          color: "#FFFFFF",
          borderRadius: "8px",
          fontSize: "12.5px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <PlayCircle size={15} />

        {isCompleted
          ? "Review Course"
          : progress.startedLessons > 0
          ? "Continue Learning"
          : "Start Learning"}

        <ArrowRight size={14} />
      </button>
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