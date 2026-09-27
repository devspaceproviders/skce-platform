"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Lesson = {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  documentUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type CourseModule = {
  id: number;
  title: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  lessons: Lesson[];
};

type CourseContent = {
  course: {
    id: number;
    code?: string | null;
    name: string;
    description?: string | null;
    mode?: string | null;
    isActive?: boolean;
  };
  enrollment?: {
    id: number;
    status: string;
  } | null;
  package?: {
    id: number;
    name: string;
  } | null;
  modules: CourseModule[];
};

type LessonProgress = {
  lessonId: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
};

type CourseProgress = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  startedLessons: number;
  remainingLessons: number;
  progressPercentage: number;
  lessons: LessonProgress[];
};

export default function StudentCoursePage() {
  const params = useParams();
  const courseId = Number(params.courseId);

  const [courseContent, setCourseContent] =
    useState<CourseContent | null>(null);

  const [progress, setProgress] =
    useState<CourseProgress | null>(null);

  const [selectedLesson, setSelectedLesson] =
    useState<Lesson | null>(null);

  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [startingLesson, setStartingLesson] =
    useState(false);

  const [completingLesson, setCompletingLesson] =
    useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  /*
   * ---------------------------------------------------------
   * LOAD COURSE CONTENT
   * ---------------------------------------------------------
   */
  const loadCourseContent = async () => {
    if (!courseId || Number.isNaN(courseId)) {
      setError("Invalid course ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/course-content/${courseId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load course content."
        );
      }

      const content = data?.data ?? data;

      setCourseContent(content);

      /*
       * Automatically select the first active lesson.
       */
      const firstLesson = content?.modules
        ?.slice()
        .sort(
          (a: CourseModule, b: CourseModule) =>
            a.sortOrder - b.sortOrder
        )
        ?.flatMap((module: CourseModule) =>
          module.lessons
            .slice()
            .sort(
              (a: Lesson, b: Lesson) =>
                a.sortOrder - b.sortOrder
            )
        )
        ?.find(
          (lesson: Lesson) =>
            lesson.isActive !== false
        );

      if (firstLesson) {
        setSelectedLesson(firstLesson);
      }
    } catch (err: any) {
      console.error(
        "Course content error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load course content."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOAD COURSE PROGRESS
   * ---------------------------------------------------------
   */
  const loadProgress = async () => {
    if (
      !courseId ||
      Number.isNaN(courseId) ||
      !token
    ) {
      return;
    }

    try {
      setProgressLoading(true);

      const response = await fetch(
        `${API_URL}/course-progress/courses/${courseId}/progress`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load course progress."
        );
      }

      setProgress(data?.data ?? data);
    } catch (err) {
      console.error(
        "Course progress error:",
        err
      );
    } finally {
      setProgressLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */
  useEffect(() => {
    loadCourseContent();
    loadProgress();
  }, [courseId]);

  /*
   * ---------------------------------------------------------
   * GET LESSON PROGRESS
   * ---------------------------------------------------------
   */
  const getLessonProgress = (
    lessonId: number
  ) => {
    return progress?.lessons?.find(
      (item) =>
        item.lessonId === lessonId
    );
  };

  /*
   * ---------------------------------------------------------
   * ALL LESSONS
   *
   * Creates one ordered list across all modules.
   * ---------------------------------------------------------
   */
  const allLessons = useMemo(() => {
    if (!courseContent?.modules) {
      return [];
    }

    return courseContent.modules
      .slice()
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder
      )
      .flatMap((module) =>
        module.lessons
          .slice()
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder
          )
          .filter(
            (lesson) =>
              lesson.isActive !== false
          )
      );
  }, [courseContent]);

  /*
   * ---------------------------------------------------------
   * LESSON LOCKING
   * ---------------------------------------------------------
   *
   * The first lesson is available immediately.
   * Every following lesson is unlocked only after the
   * immediately previous lesson has been completed.
   */
  const isLessonUnlocked = (lessonId: number) => {
    const lessonIndex = allLessons.findIndex(
      (lesson) => lesson.id === lessonId
    );

    if (lessonIndex <= 0) {
      return true;
    }

    const previousLesson = allLessons[lessonIndex - 1];

    return (
      getLessonProgress(previousLesson.id)?.status ===
      "COMPLETED"
    );
  };

  /*
   * ---------------------------------------------------------
   * CURRENT LESSON INDEX
   * ---------------------------------------------------------
   */
  const currentLessonIndex =
    selectedLesson
      ? allLessons.findIndex(
          (lesson) =>
            lesson.id ===
            selectedLesson.id
        )
      : -1;

  const previousLesson =
    currentLessonIndex > 0
      ? allLessons[
          currentLessonIndex - 1
        ]
      : null;

  const nextLesson =
    currentLessonIndex >= 0 &&
    currentLessonIndex <
      allLessons.length - 1
      ? allLessons[
          currentLessonIndex + 1
        ]
      : null;

  /*
   * ---------------------------------------------------------
   * START LESSON
   * ---------------------------------------------------------
   */
  const startLesson = async (
    lesson: Lesson
  ) => {
    if (!token) {
      setError("Please login again.");
      return;
    }

    if (!isLessonUnlocked(lesson.id)) {
      setError(
        "This lesson is locked. Complete the previous lesson first."
      );
      return;
    }

    try {
      setStartingLesson(true);
      setError("");

      const response = await fetch(
        `${API_URL}/course-progress/lessons/${lesson.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to start lesson."
        );
      }

      await loadProgress();
    } catch (err: any) {
      console.error(
        "Start lesson error:",
        err
      );

      setError(
        err?.message ||
          "Unable to start the lesson."
      );
    } finally {
      setStartingLesson(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * SELECT LESSON
   * ---------------------------------------------------------
   */
  const handleSelectLesson = async (
    lesson: Lesson
  ) => {
    if (!isLessonUnlocked(lesson.id)) {
      setError(
        "This lesson is locked. Complete the previous lesson first."
      );
      return;
    }

    setError("");
    setSelectedLesson(lesson);

    const lessonStatus =
      getLessonProgress(lesson.id);

    /*
     * Don't move a completed lesson
     * backwards to IN_PROGRESS.
     */
    if (
      lessonStatus?.status ===
      "COMPLETED"
    ) {
      return;
    }

    await startLesson(lesson);
  };

  /*
   * ---------------------------------------------------------
   * GO TO PREVIOUS LESSON
   * ---------------------------------------------------------
   */
  const handlePreviousLesson = async () => {
    if (!previousLesson) {
      return;
    }

    await handleSelectLesson(
      previousLesson
    );
  };

  /*
   * ---------------------------------------------------------
   * GO TO NEXT LESSON
   * ---------------------------------------------------------
   */
  const handleNextLesson = async () => {
    if (!nextLesson) {
      return;
    }

    await handleSelectLesson(
      nextLesson
    );
  };

  /*
   * ---------------------------------------------------------
   * COMPLETE LESSON
   * ---------------------------------------------------------
   */
  const completeLesson = async () => {
    if (!selectedLesson || !token) {
      return;
    }

    try {
      setCompletingLesson(true);
      setError("");

      const response = await fetch(
        `${API_URL}/course-progress/lessons/${selectedLesson.id}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to complete lesson."
        );
      }

      /*
       * Refresh progress first.
       */
      await loadProgress();

      /*
       * Do not automatically start the next lesson.
       * Completing this lesson unlocks the next lesson.
       * The student must explicitly open it.
       */
    } catch (err: any) {
      console.error(
        "Complete lesson error:",
        err
      );

      setError(
        err?.message ||
          "Unable to complete the lesson."
      );
    } finally {
      setCompletingLesson(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * TOTAL MODULES / LESSONS
   * ---------------------------------------------------------
   */
  const totalModules =
    courseContent?.modules?.length || 0;

  const totalLessonsFromContent =
    useMemo(() => {
      if (!courseContent?.modules) {
        return 0;
      }

      return courseContent.modules.reduce(
        (total, module) =>
          total + module.lessons.length,
        0
      );
    }, [courseContent]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Loading course content...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */
  if (error && !courseContent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Unable to Load Course
            </h2>

            <p className="text-gray-600">
              {error}
            </p>

            <button
              onClick={() => {
                loadCourseContent();
                loadProgress();
              }}
              className="mt-5 rounded-lg bg-[#A01441] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!courseContent) {
    return null;
  }

  const currentLessonProgress =
    selectedLesson
      ? getLessonProgress(
          selectedLesson.id
        )
      : null;

  const progressPercentage =
    progress?.progressPercentage ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            COURSE HEADER
        ====================================================== */}
        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">

                {courseContent.course.mode && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {courseContent.course.mode}
                  </span>
                )}

                {courseContent.course.isActive !==
                  false && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {courseContent.course.name}
              </h1>

              {courseContent.course.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  {
                    courseContent.course
                      .description
                  }
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">

                <span>
                  {totalModules}{" "}
                  {totalModules === 1
                    ? "Module"
                    : "Modules"}
                </span>

                <span>•</span>

                <span>
                  {progress?.totalLessons ??
                    totalLessonsFromContent}{" "}
                  {(progress?.totalLessons ??
                    totalLessonsFromContent) ===
                  1
                    ? "Lesson"
                    : "Lessons"}
                </span>

                {courseContent.package && (
                  <>
                    <span>•</span>

                    <span>
                      Package:{" "}
                      <strong className="text-gray-700">
                        {
                          courseContent
                            .package.name
                        }
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* COURSE PROGRESS */}
            <div className="w-full lg:w-72">

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Course Progress
                </span>

                <span className="text-sm font-bold text-[#A01441]">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#A01441] transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>
                  {progress?.completedLessons ??
                    0}{" "}
                  completed
                </span>

                <span>
                  {progress?.remainingLessons ??
                    0}{" "}
                  remaining
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            MAIN LMS AREA
        ====================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

          {/* ===================================================
              LEFT - MODULES / LESSONS
          ==================================================== */}
          <div className="rounded-2xl border bg-white shadow-sm">

            <div className="border-b px-5 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Course Content
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a lesson to continue
                    learning
                  </p>
                </div>

                {progressLoading && (
                  <span className="text-xs text-gray-400">
                    Updating...
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-[700px] overflow-y-auto">

              {courseContent.modules.length ===
              0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No course content available
                    yet.
                  </p>
                </div>
              ) : (
                courseContent.modules
                  .slice()
                  .sort(
                    (a, b) =>
                      a.sortOrder -
                      b.sortOrder
                  )
                  .map(
                    (
                      module,
                      moduleIndex
                    ) => (
                      <div
                        key={module.id}
                        className="border-b last:border-b-0"
                      >

                        {/* MODULE HEADER */}
                        <div className="bg-gray-50 px-5 py-4">

                          <div className="flex items-start gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#A01441] text-sm font-bold text-white">
                              {moduleIndex + 1}
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {module.title}
                              </h3>

                              {module.description && (
                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                  {
                                    module.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* LESSONS */}
                        <div className="p-3">

                          {module.lessons.length ===
                          0 ? (
                            <p className="px-2 py-3 text-xs text-gray-400">
                              No lessons available.
                            </p>
                          ) : (
                            module.lessons
                              .slice()
                              .sort(
                                (a, b) =>
                                  a.sortOrder -
                                  b.sortOrder
                              )
                              .map(
                                (
                                  lesson,
                                  lessonIndex
                                ) => {

                                  const lessonProgress =
                                    getLessonProgress(
                                      lesson.id
                                    );

                                  const isCompleted =
                                    lessonProgress?.status ===
                                    "COMPLETED";

                                  const isUnlocked =
                                    isLessonUnlocked(
                                      lesson.id
                                    );

                                  const isLocked =
                                    !isUnlocked &&
                                    !isCompleted;

                                  const isSelected =
                                    selectedLesson?.id ===
                                    lesson.id;

                                  return (
                                    <button
                                      key={lesson.id}
                                      onClick={() =>
                                        handleSelectLesson(
                                          lesson
                                        )
                                      }
                                      disabled={isLocked}
                                      className={`mb-2 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition last:mb-0 ${
                                        isLocked
                                          ? "cursor-not-allowed border-transparent bg-gray-50 opacity-60"
                                          : isSelected
                                          ? "border-[#A01441] bg-[#A01441]/5"
                                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                                      }`}
                                    >

                                      {/* STATUS ICON */}
                                      <div
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                          isCompleted
                                            ? "bg-green-100 text-green-700"
                                            : isLocked
                                            ? "bg-gray-200 text-gray-500"
                                            : isSelected
                                            ? "bg-[#A01441] text-white"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {isCompleted
                                          ? "✓"
                                          : isLocked
                                          ? "🔒"
                                          : lessonIndex +
                                            1}
                                      </div>

                                      <div className="min-w-0 flex-1">

                                        <div
                                          className={`text-sm font-medium ${
                                            isSelected
                                              ? "text-[#A01441]"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {
                                            lesson.title
                                          }
                                        </div>

                                        {lesson.description && (
                                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                            {
                                              lesson.description
                                            }
                                          </p>
                                        )}

                                        <div className="mt-2">

                                          {isCompleted ? (
                                            <span className="text-[11px] font-semibold text-green-600">
                                              Completed
                                            </span>
                                          ) : isLocked ? (
                                            <span className="text-[11px] font-semibold text-gray-500">
                                              🔒 Locked
                                            </span>
                                          ) : lessonProgress?.status ===
                                            "IN_PROGRESS" ? (
                                            <span className="text-[11px] font-semibold text-blue-600">
                                              In Progress
                                            </span>
                                          ) : (
                                            <span className="text-[11px] font-semibold text-[#A01441]">
                                              Available
                                            </span>
                                          )}

                                        </div>
                                      </div>
                                    </button>
                                  );
                                }
                              )
                          )}
                        </div>
                      </div>
                    )
                  )
              )}
            </div>
          </div>

          {/* ===================================================
              RIGHT - LESSON VIEWER
          ==================================================== */}
          <div className="rounded-2xl border bg-white shadow-sm">

            {!selectedLesson ? (
              <div className="flex min-h-[500px] items-center justify-center p-8">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                    ▶
                  </div>

                  <h2 className="text-lg font-semibold text-gray-800">
                    Select a Lesson
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Select a lesson from the
                    course content to start
                    learning.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    LESSON HEADER
                ================================================== */}
                <div className="border-b px-5 py-5 md:px-6">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wide text-[#A01441]">
                        Lesson{" "}
                        {currentLessonIndex >=
                        0
                          ? currentLessonIndex +
                            1
                          : ""}
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-gray-900">
                        {selectedLesson.title}
                      </h2>

                      {selectedLesson.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {
                            selectedLesson.description
                          }
                        </p>
                      )}
                    </div>

                    {/* LESSON STATUS */}
                    <div className="shrink-0">

                      {currentLessonProgress?.status ===
                      "COMPLETED" ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                          <span>✓</span>
                          Completed
                        </span>
                      ) : currentLessonProgress?.status ===
                        "IN_PROGRESS" ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          <span>●</span>
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* =================================================
                    LESSON CONTENT
                ================================================== */}
                <div className="p-5 md:p-6">

                  {startingLesson && (
                    <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      Starting lesson...
                    </div>
                  )}

                  {/* VIDEO */}
                  {selectedLesson.videoUrl && (
                    <div className="mb-6 overflow-hidden rounded-xl bg-black">
                      <div className="aspect-video">

                        <iframe
                          src={
                            selectedLesson.videoUrl
                          }
                          title={
                            selectedLesson.title
                          }
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />

                      </div>
                    </div>
                  )}

                  {/* TEXT CONTENT */}
                  {selectedLesson.content ? (
                    <div className="rounded-xl border bg-gray-50 p-5">

                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Lesson Content
                      </h3>

                      <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                        {
                          selectedLesson.content
                        }
                      </div>
                    </div>
                  ) : !selectedLesson.videoUrl ? (
                    <div className="rounded-xl border bg-gray-50 p-6 text-center">

                      <p className="text-sm text-gray-500">
                        No lesson content has
                        been added yet.
                      </p>

                    </div>
                  ) : null}

                  {/* DOCUMENT */}
                  {selectedLesson.documentUrl && (
                    <div className="mt-5 rounded-xl border p-4">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <h3 className="text-sm font-semibold text-gray-900">
                            Lesson Document
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            Open the supporting
                            document for this
                            lesson.
                          </p>

                        </div>

                        <a
                          href={
                            selectedLesson.documentUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-[#A01441] px-4 py-2 text-sm font-medium text-[#A01441] hover:bg-[#A01441] hover:text-white"
                        >
                          Open Document
                        </a>

                      </div>
                    </div>
                  )}

                  {/* =================================================
                      LESSON NAVIGATION
                  ================================================== */}
                  <div className="mt-6 border-t pt-5">

                    <div className="mb-4 flex items-center justify-between gap-3">

                      {/* PREVIOUS */}
                      <button
                        onClick={
                          handlePreviousLesson
                        }
                        disabled={
                          !previousLesson ||
                          startingLesson
                        }
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Previous
                      </button>

                      {/* NEXT */}
                      {nextLesson && (
                        <button
                          onClick={
                            handleNextLesson
                          }
                          disabled={
                            startingLesson ||
                            currentLessonProgress?.status !==
                              "COMPLETED"
                          }
                          className="rounded-lg border border-[#A01441] bg-white px-4 py-2.5 text-sm font-medium text-[#A01441] transition hover:bg-[#A01441]/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next →
                        </button>
                      )}
                    </div>

                    {/* =================================================
                        COMPLETION AREA
                    ================================================== */}

                    {currentLessonProgress?.status ===
                    "COMPLETED" ? (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <p className="font-semibold text-green-800">
                              Lesson completed
                            </p>

                            <p className="mt-1 text-xs text-green-700">
                              You have successfully
                              completed this lesson. The next lesson is now unlocked.
                            </p>
                          </div>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg text-green-700">
                            ✓
                          </div>

                        </div>

                        {/* NEXT LESSON */}
                        {nextLesson ? (
                          <div className="mt-4 border-t border-green-200 pt-4">

                            <p className="text-xs font-medium text-green-700">
                              Next Lesson — Unlocked
                            </p>

                            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              <p className="text-sm font-semibold text-gray-800">
                                {
                                  nextLesson.title
                                }
                              </p>

                              <button
                                onClick={
                                  handleNextLesson
                                }
                                disabled={
                                  startingLesson
                                }
                                className="rounded-lg bg-[#A01441] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                              >
                                {startingLesson
                                  ? "Opening..."
                                  : "Continue →"}
                              </button>

                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 border-t border-green-200 pt-4">

                            <p className="text-sm font-semibold text-green-800">
                              🎉 Course Completed
                            </p>

                            <p className="mt-1 text-xs text-green-700">
                              You have completed
                              all available
                              lessons in this
                              course.
                            </p>

                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Finished this lesson?
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Mark it as complete
                            to update your
                            course progress.
                          </p>
                        </div>

                        <button
                          onClick={
                            completeLesson
                          }
                          disabled={
                            completingLesson
                          }
                          className="rounded-lg bg-[#A01441] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {completingLesson
                            ? "Completing..."
                            : "Mark as Complete"}
                        </button>

                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* =====================================================
            PROGRESS SUMMARY
        ====================================================== */}
        {progress && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Total Lessons
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {progress.totalLessons}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {progress.completedLessons}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Started
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {progress.startedLessons}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Remaining
              </p>

              <p className="mt-2 text-2xl font-bold text-[#A01441]">
                {progress.remainingLessons}
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}