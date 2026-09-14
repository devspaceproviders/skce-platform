"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  Clock3,
  ArrowRight,
} from "lucide-react";

/*
 * FRONTEND DEVELOPMENT DATA
 *
 * These are currently mock enrollment records.
 *
 * Final flow:
 *
 * Logged-in Student
 *       ↓
 * Student ID
 *       ↓
 * Student Enrollments
 *       ↓
 * Assigned Courses
 *       ↓
 * My Courses
 *
 * The backend/database will replace this data later.
 */

const ENROLLED_COURSES = [
  {
    id: "COURSE-001",
    title: "Computer Basics",
    batch: "SKCE-CB-001",
    progress: 72,
    completedLessons: 18,
    totalLessons: 25,
    nextLesson: "Introduction to MS Windows",
    duration: "2 Months",
    mode: "Online",
    status: "In Progress",
    description:
      "Learn essential computer concepts, operating systems, files, folders, internet basics and everyday computer usage.",
  },
  {
    id: "COURSE-002",
    title: "MS Office",
    batch: "SKCE-MSO-004",
    progress: 45,
    completedLessons: 9,
    totalLessons: 20,
    nextLesson: "Working with Excel Formulas",
    duration: "3 Months",
    mode: "Hybrid",
    status: "In Progress",
    description:
      "Develop practical skills in Microsoft Word, Excel, PowerPoint and other essential office productivity tools.",
  },
  {
    id: "COURSE-003",
    title: "Python",
    batch: "SKCE-PY-002",
    progress: 20,
    completedLessons: 4,
    totalLessons: 20,
    nextLesson: "Python Variables and Data Types",
    duration: "4 Months",
    mode: "Online",
    status: "In Progress",
    description:
      "Build a strong foundation in Python programming, problem solving, data structures and application development.",
  },
];

export default function MyCoursesPage() {
  const router = useRouter();

  const averageProgress = Math.round(
    ENROLLED_COURSES.reduce(
      (total, course) => total + course.progress,
      0
    ) / ENROLLED_COURSES.length
  );

  const handleContinueLearning = (courseId: string) => {
    router.push(`/dashboard/student/my-courses/${courseId}`);
  };

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: "26px" }}>
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

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          icon={<BookOpen size={19} />}
          label="Enrolled Courses"
          value={String(ENROLLED_COURSES.length)}
        />

        <SummaryCard
          icon={<BarChart3 size={19} />}
          label="Average Progress"
          value={`${averageProgress}%`}
        />

        <SummaryCard
          icon={<CheckCircle2 size={19} />}
          label="Learning Status"
          value="Active"
        />
      </div>

      {/* Course List */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "18px",
        }}
      >
        {ENROLLED_COURSES.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onContinue={() => handleContinueLearning(course.id)}
            onView={() =>
              router.push(
                `/dashboard/student/my-courses/${course.id}`
              )
            }
          />
        ))}
      </div>

      {/* Future Empty State */}
      {ENROLLED_COURSES.length === 0 && (
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
            style={{ marginBottom: "12px" }}
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
            Your assigned courses will appear here once you are enrolled.
          </p>
        </div>
      )}
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
  onContinue,
  onView,
}: {
  course: (typeof ENROLLED_COURSES)[number];
  onContinue: () => void;
  onView: () => void;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
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
            <BookOpen size={20} color="#2F6BFF" />
          </div>

          <div style={{ minWidth: 0 }}>
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

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              Batch: {course.batch}
            </div>
          </div>
        </div>

        <span
          style={{
            padding: "5px 9px",
            borderRadius: "999px",
            background: "#ECFDF3",
            color: "#15803D",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {course.status}
        </span>
      </div>

      {/* Description */}
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

      {/* Progress */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "#6B7280" }}>Course Progress</span>

          <span
            style={{
              color: "#111827",
              fontWeight: 700,
            }}
          >
            {course.progress}%
          </span>
        </div>

        <div
          style={{
            height: "7px",
            background: "#EEF0F4",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${course.progress}%`,
              background: "#2F6BFF",
              borderRadius: "999px",
            }}
          />
        </div>
      </div>

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
          label="Lessons"
          value={`${course.completedLessons}/${course.totalLessons}`}
        />

        <InfoItem label="Duration" value={course.duration} />

        <InfoItem label="Mode" value={course.mode} />

        <InfoItem label="Next Lesson" value={course.nextLesson} />
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
            border: "1px solid #D7DCE5",
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
          style={{
            flex: 1,
            height: "40px",
            border: "none",
            background: "#2F6BFF",
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
          Continue Learning
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