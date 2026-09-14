"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Clock3,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

/*
 * FRONTEND DEVELOPMENT DATA
 *
 * The lessons and completion status are currently mock data.
 *
 * Final system:
 *
 * Logged-in Student
 *       ↓
 * Student Enrollment
 *       ↓
 * Course
 *       ↓
 * Lessons
 *       ↓
 * Completed Lessons
 *       ↓
 * System calculates Progress
 *
 * The backend/database will become the source of truth later.
 */

const COURSE_DATA = {
  "COURSE-001": {
    title: "Computer Basics",
    batch: "SKCE-CB-001",
    currentModule: "Module 2 - Operating System Basics",

    lessons: [
      {
        id: "lesson-1",
        module: "Module 1 - Computer Fundamentals",
        title: "Introduction to Computers",
        duration: "18 min",
        completed: true,
      },
      {
        id: "lesson-2",
        module: "Module 1 - Computer Fundamentals",
        title: "Types of Computers",
        duration: "22 min",
        completed: true,
      },
      {
        id: "lesson-3",
        module: "Module 1 - Computer Fundamentals",
        title: "Computer Hardware",
        duration: "25 min",
        completed: true,
      },
      {
        id: "lesson-4",
        module: "Module 1 - Computer Fundamentals",
        title: "Computer Software",
        duration: "20 min",
        completed: true,
      },
      {
        id: "lesson-5",
        module: "Module 2 - Operating System Basics",
        title: "Introduction to Operating Systems",
        duration: "24 min",
        completed: false,
      },
      {
        id: "lesson-6",
        module: "Module 2 - Operating System Basics",
        title: "Windows Desktop",
        duration: "28 min",
        completed: false,
      },
      {
        id: "lesson-7",
        module: "Module 2 - Operating System Basics",
        title: "Files and Folders",
        duration: "26 min",
        completed: false,
      },
      {
        id: "lesson-8",
        module: "Module 2 - Operating System Basics",
        title: "Windows Settings",
        duration: "21 min",
        completed: false,
      },
      {
        id: "lesson-9",
        module: "Module 3 - Internet Basics",
        title: "Introduction to Internet",
        duration: "20 min",
        completed: false,
      },
    ],
  },

  "COURSE-002": {
    title: "MS Office",
    batch: "SKCE-MSO-004",
    currentModule: "Module 2 - Microsoft Excel",

    lessons: [
      {
        id: "lesson-1",
        module: "Module 1 - Microsoft Word",
        title: "Word Interface",
        duration: "20 min",
        completed: true,
      },
      {
        id: "lesson-2",
        module: "Module 1 - Microsoft Word",
        title: "Creating Documents",
        duration: "24 min",
        completed: true,
      },
      {
        id: "lesson-3",
        module: "Module 1 - Microsoft Word",
        title: "Formatting Documents",
        duration: "25 min",
        completed: true,
      },
      {
        id: "lesson-4",
        module: "Module 1 - Microsoft Word",
        title: "Tables and Images",
        duration: "22 min",
        completed: false,
      },
      {
        id: "lesson-5",
        module: "Module 2 - Microsoft Excel",
        title: "Excel Interface",
        duration: "20 min",
        completed: true,
      },
      {
        id: "lesson-6",
        module: "Module 2 - Microsoft Excel",
        title: "Working with Worksheets",
        duration: "26 min",
        completed: true,
      },
      {
        id: "lesson-7",
        module: "Module 2 - Microsoft Excel",
        title: "Excel Formulas",
        duration: "30 min",
        completed: false,
      },
      {
        id: "lesson-8",
        module: "Module 2 - Microsoft Excel",
        title: "Charts and Graphs",
        duration: "25 min",
        completed: false,
      },
    ],
  },

  "COURSE-003": {
    title: "Python",
    batch: "SKCE-PY-002",
    currentModule: "Module 1 - Python Fundamentals",

    lessons: [
      {
        id: "lesson-1",
        module: "Module 1 - Python Fundamentals",
        title: "Introduction to Python",
        duration: "20 min",
        completed: true,
      },
      {
        id: "lesson-2",
        module: "Module 1 - Python Fundamentals",
        title: "Installing Python",
        duration: "18 min",
        completed: true,
      },
      {
        id: "lesson-3",
        module: "Module 1 - Python Fundamentals",
        title: "Python Syntax",
        duration: "24 min",
        completed: true,
      },
      {
        id: "lesson-4",
        module: "Module 1 - Python Fundamentals",
        title: "Variables and Data Types",
        duration: "28 min",
        completed: false,
      },
      {
        id: "lesson-5",
        module: "Module 2 - Control Flow",
        title: "Conditional Statements",
        duration: "25 min",
        completed: false,
      },
      {
        id: "lesson-6",
        module: "Module 2 - Control Flow",
        title: "Loops",
        duration: "30 min",
        completed: false,
      },
    ],
  },
};

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = String(params.courseId);

  const course =
    COURSE_DATA[courseId as keyof typeof COURSE_DATA] ||
    COURSE_DATA["COURSE-001"];

  /*
   * Find the first lesson that is not completed.
   * The student will automatically start from there.
   */
  const firstIncompleteIndex = course.lessons.findIndex(
    (lesson) => !lesson.completed
  );

  const [currentIndex, setCurrentIndex] = useState(
    firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0
  );

  /*
   * Local frontend state for lesson completion.
   *
   * Later this will be saved to the backend/database.
   */
  const [completedLessons, setCompletedLessons] = useState(
    course.lessons.map((lesson) => lesson.completed)
  );

  const currentLesson = course.lessons[currentIndex];

  /*
   * Calculate progress from the actual completed lessons.
   *
   * This prevents the page from having two different
   * progress values.
   */
  const completedCount = completedLessons.filter(Boolean).length;

  const calculatedProgress =
    course.lessons.length === 0
      ? 0
      : Math.round((completedCount / course.lessons.length) * 100);

  const handleMarkComplete = () => {
    setCompletedLessons((previous) => {
      const updated = [...previous];
      updated[currentIndex] = true;
      return updated;
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < course.lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F6FA",
        padding: "24px 30px 40px",
      }}
    >
      {/* Top Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
          marginBottom: "22px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => router.push("/dashboard/student/my-courses")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            border: "none",
            background: "transparent",
            color: "#374151",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          <ArrowLeft size={17} />
          Back to My Courses
        </button>

        <div
          style={{
            fontSize: "12px",
            color: "#6B7280",
          }}
        >
          {course.title} · {course.batch}
        </div>
      </div>

      {/* Course Header */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "13px",
          padding: "20px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#EAF0FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={20} color="#2F6BFF" />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "21px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {course.title}
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12.5px",
                color: "#6B7280",
              }}
            >
              {currentLesson.module}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#6B7280" }}>
              Course Progress
            </span>

            <strong style={{ color: "#111827" }}>
              {calculatedProgress}%
            </strong>
          </div>

          <div
            style={{
              height: "7px",
              background: "#E5E7EB",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${calculatedProgress}%`,
                height: "100%",
                background: "#2F6BFF",
                borderRadius: "999px",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Learning Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 330px",
          gap: "18px",
          alignItems: "start",
        }}
      >
        {/* Main Lesson Area */}
        <div>
          {/* Video */}
          <div
            style={{
              background: "#111827",
              borderRadius: "13px",
              overflow: "hidden",
              aspectRatio: "16 / 9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                textAlign: "center",
                color: "#FFFFFF",
              }}
            >
              <div
                style={{
                  width: "66px",
                  height: "66px",
                  borderRadius: "50%",
                  background: "#2F6BFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <PlayCircle size={34} />
              </div>

              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Video Lesson
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "11px",
                  color: "#D1D5DB",
                }}
              >
                Video content will be connected later
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "14px",
                left: "16px",
                right: "16px",
                height: "4px",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "5px",
              }}
            >
              <div
                style={{
                  width: "0%",
                  height: "100%",
                  background: "#2F6BFF",
                  borderRadius: "5px",
                }}
              />
            </div>
          </div>

          {/* Lesson Information */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "13px",
              marginTop: "16px",
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6B7280",
                    marginBottom: "6px",
                  }}
                >
                  {currentLesson.module}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "19px",
                    color: "#111827",
                    fontWeight: 700,
                  }}
                >
                  {currentLesson.title}
                </h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "8px",
                    color: "#6B7280",
                    fontSize: "12px",
                  }}
                >
                  <Clock3 size={14} />
                  {currentLesson.duration}
                </div>
              </div>

              {completedLessons[currentIndex] && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 9px",
                    borderRadius: "999px",
                    background: "#ECFDF3",
                    color: "#15803D",
                    fontSize: "10px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  <CheckCircle2 size={13} />
                  Completed
                </span>
              )}
            </div>

            <p
              style={{
                margin: "18px 0 0",
                color: "#6B7280",
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              This lesson introduces the concepts covered in this
              section of the course. The actual lesson video and
              learning resources will be connected when the backend
              and cloud storage are implemented.
            </p>

            {/* Resources */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "18px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "10px",
                }}
              >
                Lesson Resources
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "11px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "9px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <FileText size={18} color="#2F6BFF" />

                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Lesson Notes
                    </div>

                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9CA3AF",
                        marginTop: "2px",
                      }}
                    >
                      PDF resource
                    </div>
                  </div>
                </div>

                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    border: "none",
                    background: "transparent",
                    color: "#2F6BFF",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            {/* Lesson Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                marginTop: "22px",
                paddingTop: "18px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  background:
                    currentIndex === 0 ? "#F3F4F6" : "#FFFFFF",
                  color:
                    currentIndex === 0 ? "#9CA3AF" : "#374151",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor:
                    currentIndex === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <button
                onClick={handleMarkComplete}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: completedLessons[currentIndex]
                    ? "#16A34A"
                    : "#2F6BFF",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <CheckCircle2 size={15} />

                {completedLessons[currentIndex]
                  ? "Completed"
                  : "Mark as Complete"}
              </button>

              <button
                onClick={handleNext}
                disabled={
                  currentIndex === course.lessons.length - 1
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    currentIndex === course.lessons.length - 1
                      ? "#E5E7EB"
                      : "#2F6BFF",
                  color:
                    currentIndex === course.lessons.length - 1
                      ? "#9CA3AF"
                      : "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor:
                    currentIndex === course.lessons.length - 1
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <aside
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "13px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "17px",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Course Content
            </h3>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              {completedCount} of {course.lessons.length} lessons
              completed
            </p>
          </div>

          <div
            style={{
              maxHeight: "620px",
              overflowY: "auto",
            }}
          >
            {course.lessons.map((lesson, index) => {
              const isCurrent = index === currentIndex;
              const isCompleted = completedLessons[index];

              return (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "9px",
                    padding: "12px 14px",
                    border: "none",
                    borderBottom: "1px solid #F0F1F3",
                    background: isCurrent
                      ? "#F0F5FF"
                      : "#FFFFFF",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      size={17}
                      color="#16A34A"
                      style={{
                        marginTop: "1px",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <PlayCircle
                      size={17}
                      color={
                        isCurrent ? "#2F6BFF" : "#9CA3AF"
                      }
                      style={{
                        marginTop: "1px",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9CA3AF",
                        marginBottom: "3px",
                      }}
                    >
                      {lesson.module}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.4,
                        color: isCurrent
                          ? "#1D4ED8"
                          : "#374151",
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                    >
                      {index + 1}. {lesson.title}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "4px",
                        fontSize: "10px",
                        color: "#9CA3AF",
                      }}
                    >
                      <Clock3 size={11} />
                      {lesson.duration}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}