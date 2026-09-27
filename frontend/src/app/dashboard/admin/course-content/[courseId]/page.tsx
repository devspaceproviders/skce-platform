"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  PlayCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   TYPES
========================================================= */

type Lesson = {
  id: number;
  moduleId: number;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Module = {
  id: number;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  lessons: Lesson[];
};

type Course = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  mode: string | null;
  duration: string | null;
  price: number;
  isActive: boolean;
};

/* =========================================================
   DYNAMIC MODULE PLACEHOLDER
========================================================= */

function getModuleTitlePlaceholder(
  courseTitle: string
) {
  const normalized =
    courseTitle.trim().toLowerCase();

  if (normalized === "ms word") {
    return "Example: Word Fundamentals";
  }

  if (normalized === "ms excel") {
    return "Example: Excel Fundamentals";
  }

  if (normalized === "ms powerpoint") {
    return "Example: PowerPoint Fundamentals";
  }

  if (normalized === "c programming") {
    return "Example: C Programming Fundamentals";
  }

  if (normalized === "c++") {
    return "Example: C++ Programming Fundamentals";
  }

  if (normalized === "data structures") {
    return "Example: Data Structures Fundamentals";
  }

  if (normalized === "spoken english") {
    return "Example: English Communication Fundamentals";
  }

  if (normalized === "computer basics") {
    return "Example: Computer Fundamentals";
  }

  if (normalized === "typing basics") {
    return "Example: Typing Fundamentals";
  }

  if (normalized === "digital marketing") {
    return "Example: Digital Marketing Fundamentals";
  }

  if (normalized === "affiliate marketing") {
    return "Example: Affiliate Marketing Fundamentals";
  }

  if (normalized === "power bi") {
    return "Example: Power BI Fundamentals";
  }

  if (normalized === "tally") {
    return "Example: Tally Fundamentals";
  }

  if (normalized === "ai skills") {
    return "Example: AI Skills Fundamentals";
  }

  return `Example: ${courseTitle.trim()} Fundamentals`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminCourseContentPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.courseId);

  /* =======================================================
     COURSE
  ======================================================= */

  const [course, setCourse] =
    useState<Course | null>(null);

  const [modules, setModules] =
    useState<Module[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     MODULE CREATE
  ======================================================= */

  const [showModuleForm, setShowModuleForm] =
    useState(false);

  const [moduleTitle, setModuleTitle] =
    useState("");

  const [moduleDescription, setModuleDescription] =
    useState("");

  /* =======================================================
     LESSON CREATE
  ======================================================= */

  const [showLessonForm, setShowLessonForm] =
    useState<number | null>(null);

  const [lessonTitle, setLessonTitle] =
    useState("");

  const [lessonDescription, setLessonDescription] =
    useState("");

  const [lessonContent, setLessonContent] =
    useState("");

  const [lessonVideoUrl, setLessonVideoUrl] =
    useState("");

  const [lessonDocumentUrl, setLessonDocumentUrl] =
    useState("");

  /* =======================================================
     MODULE EXPANSION
  ======================================================= */

  const [expandedModules, setExpandedModules] =
    useState<number[]>([]);

  /* =======================================================
     MODULE EDIT
  ======================================================= */

  const [editingModuleId, setEditingModuleId] =
    useState<number | null>(null);

  const [editModuleTitle, setEditModuleTitle] =
    useState("");

  const [editModuleDescription, setEditModuleDescription] =
    useState("");

  /* =======================================================
     LESSON EDIT
  ======================================================= */

  const [editingLessonId, setEditingLessonId] =
    useState<number | null>(null);

  const [editLessonTitle, setEditLessonTitle] =
    useState("");

  const [editLessonDescription, setEditLessonDescription] =
    useState("");

  const [editLessonContent, setEditLessonContent] =
    useState("");

  const [editLessonVideoUrl, setEditLessonVideoUrl] =
    useState("");

  const [editLessonDocumentUrl, setEditLessonDocumentUrl] =
    useState("");

  /* =======================================================
     LOAD COURSE CONTENT
  ======================================================= */

  useEffect(() => {
    if (!courseId || Number.isNaN(courseId)) {
      setError("Invalid course ID");
      setLoading(false);
      return;
    }

    loadCourseContent();
  }, [courseId]);

  async function loadCourseContent() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          router.push("/admin/login");
          return;
        }

        throw new Error(
          result.message ||
            "Failed to load course content"
        );
      }

      setCourse(result.data.course);

      setModules(
        (result.data.modules || []).map(
          (module: Module) => ({
            ...module,
            lessons: module.lessons || [],
          })
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load course content"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     TOGGLE MODULE
  ======================================================= */

  function toggleModule(moduleId: number) {
    setExpandedModules((current) =>
      current.includes(moduleId)
        ? current.filter(
            (id) => id !== moduleId
          )
        : [...current, moduleId]
    );
  }

  /* =======================================================
     CREATE MODULE
  ======================================================= */

  async function handleCreateModule(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!moduleTitle.trim()) {
      setError("Module title is required");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/${courseId}/modules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: moduleTitle.trim(),
            description:
              moduleDescription.trim() ||
              undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create module"
        );
      }

      setModuleTitle("");
      setModuleDescription("");
      setShowModuleForm(false);

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create module"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CREATE LESSON
  ======================================================= */

  async function handleCreateLesson(
    e: React.FormEvent,
    moduleId: number
  ) {
    e.preventDefault();

    if (!lessonTitle.trim()) {
      setError("Lesson title is required");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/modules/${moduleId}/lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: lessonTitle.trim(),
            description:
              lessonDescription.trim() ||
              undefined,
            content:
              lessonContent.trim() ||
              undefined,
            videoUrl:
              lessonVideoUrl.trim() ||
              undefined,
            documentUrl:
              lessonDocumentUrl.trim() ||
              undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create lesson"
        );
      }

      setLessonTitle("");
      setLessonDescription("");
      setLessonContent("");
      setLessonVideoUrl("");
      setLessonDocumentUrl("");
      setShowLessonForm(null);

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create lesson"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     EDIT MODULE
  ======================================================= */

  function startEditModule(
    module: Module
  ) {
    setEditingLessonId(null);

    setEditingModuleId(module.id);

    setEditModuleTitle(
      module.title
    );

    setEditModuleDescription(
      module.description || ""
    );

    if (
      !expandedModules.includes(
        module.id
      )
    ) {
      setExpandedModules(
        (current) => [
          ...current,
          module.id,
        ]
      );
    }
  }

  function cancelEditModule() {
    setEditingModuleId(null);
    setEditModuleTitle("");
    setEditModuleDescription("");
  }

  async function handleUpdateModule(
    e: React.FormEvent,
    moduleId: number
  ) {
    e.preventDefault();

    if (!editModuleTitle.trim()) {
      setError("Module title is required");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/modules/${moduleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title:
              editModuleTitle.trim(),
            description:
              editModuleDescription.trim() ||
              undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update module"
        );
      }

      cancelEditModule();

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update module"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE MODULE
  ======================================================= */

  async function handleDeleteModule(
    module: Module
  ) {
    const confirmed =
      window.confirm(
        `Delete "${module.title}"?\n\nThis will also delete all lessons inside this module and their progress.\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/modules/${module.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete module"
        );
      }

      if (
        editingModuleId ===
        module.id
      ) {
        cancelEditModule();
      }

      setExpandedModules(
        (current) =>
          current.filter(
            (id) =>
              id !== module.id
          )
      );

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete module"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     EDIT LESSON
  ======================================================= */

  function startEditLesson(
    lesson: Lesson
  ) {
    setEditingModuleId(null);

    setEditingLessonId(
      lesson.id
    );

    setEditLessonTitle(
      lesson.title
    );

    setEditLessonDescription(
      lesson.description || ""
    );

    setEditLessonContent(
      lesson.content || ""
    );

    setEditLessonVideoUrl(
      lesson.videoUrl || ""
    );

    setEditLessonDocumentUrl(
      lesson.documentUrl || ""
    );
  }

  function cancelEditLesson() {
    setEditingLessonId(null);

    setEditLessonTitle("");
    setEditLessonDescription("");
    setEditLessonContent("");
    setEditLessonVideoUrl("");
    setEditLessonDocumentUrl("");
  }

  async function handleUpdateLesson(
    e: React.FormEvent,
    lessonId: number
  ) {
    e.preventDefault();

    if (!editLessonTitle.trim()) {
      setError("Lesson title is required");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/lessons/${lessonId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title:
              editLessonTitle.trim(),
            description:
              editLessonDescription.trim() ||
              undefined,
            content:
              editLessonContent.trim() ||
              undefined,
            videoUrl:
              editLessonVideoUrl.trim() ||
              undefined,
            documentUrl:
              editLessonDocumentUrl.trim() ||
              undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update lesson"
        );
      }

      cancelEditLesson();

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update lesson"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE LESSON
  ======================================================= */

  async function handleDeleteLesson(
    lesson: Lesson
  ) {
    const confirmed =
      window.confirm(
        `Delete "${lesson.title}"?\n\nThis lesson and its saved progress will be permanently removed.\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/lessons/${lesson.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete lesson"
        );
      }

      if (
        editingLessonId ===
        lesson.id
      ) {
        cancelEditLesson();
      }

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete lesson"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     MOVE MODULE
  ======================================================= */

  async function handleMoveModule(
    moduleId: number,
    direction: "UP" | "DOWN"
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/modules/${moduleId}/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            direction,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to reorder module"
        );
      }

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reorder module"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     MOVE LESSON
  ======================================================= */

  async function handleMoveLesson(
    lessonId: number,
    direction: "UP" | "DOWN"
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/course-content/lessons/${lessonId}/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            direction,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to reorder lesson"
        );
      }

      await loadCourseContent();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reorder lesson"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Loading course content...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/admin/courses"
            )
          }
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Courses
        </button>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* COURSE HEADER */}

        {course && (
          <div className="mb-8 rounded-2xl bg-white p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-500">
                  <BookOpen size={17} />
                  Course Content Management
                </div>

                <h1 className="text-3xl font-extrabold text-[#173B67]">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {course.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">

                  {course.mode && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {course.mode}
                    </span>
                  )}

                  {course.duration && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {course.duration}
                    </span>
                  )}

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {course.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModuleForm(
                    !showModuleForm
                  )
                }
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
              >
                <Plus size={18} />
                Add Module
              </button>

            </div>
          </div>
        )}

        {/* ADD MODULE */}

        {showModuleForm && (
          <form
            onSubmit={handleCreateModule}
            className="mb-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Add New Module
            </h2>

            <div className="mt-5 grid gap-4">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Module Title
                </label>

                <input
                  value={moduleTitle}
                  onChange={(e) =>
                    setModuleTitle(
                      e.target.value
                    )
                  }
                  placeholder={
                    course
                      ? getModuleTitlePlaceholder(
                          course.title
                        )
                      : "Example: Module Fundamentals"
                  }
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={moduleDescription}
                  onChange={(e) =>
                    setModuleDescription(
                      e.target.value
                    )
                  }
                  placeholder="Describe what students will learn in this module"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

            </div>

            <div className="mt-5 flex gap-3">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#173B67] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#123052] disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Module"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowModuleForm(false)
                }
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

            </div>
          </form>
        )}

        {/* MODULES */}

        <div className="space-y-5">

          {modules.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

              <BookOpen
                size={42}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-bold text-slate-800">
                No Modules Yet
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Start building this course by
                adding the first module.
              </p>

            </div>

          ) : (

            modules.map(
              (module, index) => {

                const expanded =
                  expandedModules.includes(
                    module.id
                  );

                const lessons =
                  module.lessons || [];

                return (
                  <div
                    key={module.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >

                    {/* MODULE HEADER */}

                    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">

                      <button
                        type="button"
                        onClick={() =>
                          toggleModule(
                            module.id
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-4 text-left"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">

                          {expanded ? (
                            <ChevronDown
                              size={20}
                            />
                          ) : (
                            <ChevronRight
                              size={20}
                            />
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                            Module {index + 1}
                          </p>

                          <h2 className="truncate text-lg font-bold text-slate-900">
                            {module.title}
                          </h2>

                          {module.description && (
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {module.description}
                            </p>
                          )}

                        </div>

                      </button>

                      {/* MODULE ACTIONS */}

                      <div className="flex flex-wrap items-center gap-2">

                        {/* UP */}

                        <button
                          type="button"
                          onClick={() =>
                            handleMoveModule(
                              module.id,
                              "UP"
                            )
                          }
                          disabled={
                            saving ||
                            index === 0
                          }
                          title="Move module up"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowUp size={15} />
                        </button>

                        {/* DOWN */}

                        <button
                          type="button"
                          onClick={() =>
                            handleMoveModule(
                              module.id,
                              "DOWN"
                            )
                          }
                          disabled={
                            saving ||
                            index ===
                              modules.length - 1
                          }
                          title="Move module down"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowDown size={15} />
                        </button>

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            startEditModule(
                              module
                            )
                          }
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteModule(
                              module
                            )
                          }
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>

                        {/* ADD LESSON */}

                        <button
                          type="button"
                          onClick={() => {

                            setShowLessonForm(
                              showLessonForm ===
                                module.id
                                ? null
                                : module.id
                            );

                            if (
                              !expandedModules.includes(
                                module.id
                              )
                            ) {
                              setExpandedModules(
                                (current) => [
                                  ...current,
                                  module.id,
                                ]
                              );
                            }

                          }}
                          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                        >
                          <Plus size={16} />
                          Add Lesson
                        </button>

                      </div>

                    </div>

                    {/* EDIT MODULE */}

                    {editingModuleId ===
                      module.id && (
                      <form
                        onSubmit={(e) =>
                          handleUpdateModule(
                            e,
                            module.id
                          )
                        }
                        className="border-t border-orange-100 bg-orange-50/50 p-5"
                      >

                        <div className="flex items-center justify-between">

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                              Module {index + 1}
                            </p>

                            <h3 className="font-bold text-slate-900">
                              Edit Module
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={
                              cancelEditModule
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                          >
                            <X size={18} />
                          </button>

                        </div>

                        <div className="mt-4 grid gap-4">

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Module Title
                            </label>

                            <input
                              value={
                                editModuleTitle
                              }
                              onChange={(e) =>
                                setEditModuleTitle(
                                  e.target.value
                                )
                              }
                              required
                              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Description
                            </label>

                            <textarea
                              value={
                                editModuleDescription
                              }
                              onChange={(e) =>
                                setEditModuleDescription(
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                            />
                          </div>

                        </div>

                        <div className="mt-4 flex gap-3">

                          <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-[#173B67] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                          >
                            {saving
                              ? "Saving..."
                              : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelEditModule
                            }
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                          >
                            Cancel
                          </button>

                        </div>

                      </form>
                    )}

                    {/* EXPANDED MODULE */}

                    {expanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-5">

                        {/* ADD LESSON */}

                        {showLessonForm ===
                          module.id && (
                          <form
                            onSubmit={(e) =>
                              handleCreateLesson(
                                e,
                                module.id
                              )
                            }
                            className="mb-5 rounded-xl border border-orange-100 bg-white p-5"
                          >

                            <h3 className="font-bold text-slate-900">
                              Add Lesson
                            </h3>

                            <div className="mt-4 grid gap-4">

                              <input
                                value={
                                  lessonTitle
                                }
                                onChange={(e) =>
                                  setLessonTitle(
                                    e.target.value
                                  )
                                }
                                placeholder="Lesson title"
                                required
                                className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                              />

                              <input
                                value={
                                  lessonDescription
                                }
                                onChange={(e) =>
                                  setLessonDescription(
                                    e.target.value
                                  )
                                }
                                placeholder="Short description"
                                className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                              />

                              <textarea
                                value={
                                  lessonContent
                                }
                                onChange={(e) =>
                                  setLessonContent(
                                    e.target.value
                                  )
                                }
                                placeholder="Lesson content"
                                rows={5}
                                className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                              />

                              <input
                                value={
                                  lessonVideoUrl
                                }
                                onChange={(e) =>
                                  setLessonVideoUrl(
                                    e.target.value
                                  )
                                }
                                placeholder="Video URL (optional)"
                                className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                              />

                              <input
                                value={
                                  lessonDocumentUrl
                                }
                                onChange={(e) =>
                                  setLessonDocumentUrl(
                                    e.target.value
                                  )
                                }
                                placeholder="Document URL (optional)"
                                className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                              />

                            </div>

                            <div className="mt-4 flex gap-3">

                              <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-[#173B67] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                              >
                                {saving
                                  ? "Saving..."
                                  : "Create Lesson"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setShowLessonForm(
                                    null
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                              >
                                Cancel
                              </button>

                            </div>

                          </form>
                        )}

                        {/* LESSONS */}

                        {lessons.length === 0 ? (

                          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">

                            <p className="text-sm text-slate-500">
                              No lessons in this
                              module yet.
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setShowLessonForm(
                                  module.id
                                )
                              }
                              className="mt-3 text-sm font-bold text-orange-500 hover:text-orange-600"
                            >
                              + Add the first lesson
                            </button>

                          </div>

                        ) : (

                          <div className="space-y-3">

                            {lessons.map(
                              (
                                lesson,
                                lessonIndex
                              ) => (

                                <div
                                  key={lesson.id}
                                  className="rounded-xl border border-slate-200 bg-white"
                                >

                                  {/* EDIT LESSON */}

                                  {editingLessonId ===
                                  lesson.id ? (

                                    <form
                                      onSubmit={(e) =>
                                        handleUpdateLesson(
                                          e,
                                          lesson.id
                                        )
                                      }
                                      className="p-5"
                                    >

                                      <div className="flex items-center justify-between">

                                        <div>
                                          <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                                            Lesson{" "}
                                            {lessonIndex +
                                              1}
                                          </p>

                                          <h3 className="font-bold text-slate-900">
                                            Edit Lesson
                                          </h3>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={
                                            cancelEditLesson
                                          }
                                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                        >
                                          <X size={18} />
                                        </button>

                                      </div>

                                      <div className="mt-4 grid gap-4">

                                        <div>
                                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Lesson Title
                                          </label>

                                          <input
                                            value={
                                              editLessonTitle
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setEditLessonTitle(
                                                e.target.value
                                              )
                                            }
                                            required
                                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Short Description
                                          </label>

                                          <input
                                            value={
                                              editLessonDescription
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setEditLessonDescription(
                                                e.target.value
                                              )
                                            }
                                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Lesson Content
                                          </label>

                                          <textarea
                                            value={
                                              editLessonContent
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setEditLessonContent(
                                                e.target.value
                                              )
                                            }
                                            rows={6}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Video URL
                                          </label>

                                          <input
                                            value={
                                              editLessonVideoUrl
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setEditLessonVideoUrl(
                                                e.target.value
                                              )
                                            }
                                            placeholder="https://..."
                                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Document URL
                                          </label>

                                          <input
                                            value={
                                              editLessonDocumentUrl
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setEditLessonDocumentUrl(
                                                e.target.value
                                              )
                                            }
                                            placeholder="https://..."
                                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                          />
                                        </div>

                                      </div>

                                      <div className="mt-5 flex gap-3">

                                        <button
                                          type="submit"
                                          disabled={
                                            saving
                                          }
                                          className="rounded-lg bg-[#173B67] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                                        >
                                          {saving
                                            ? "Saving..."
                                            : "Save Changes"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={
                                            cancelEditLesson
                                          }
                                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                                        >
                                          Cancel
                                        </button>

                                      </div>

                                    </form>

                                  ) : (

                                    /* LESSON DISPLAY */

                                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">

                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                                        {lesson.videoUrl ? (
                                          <PlayCircle
                                            size={19}
                                          />
                                        ) : lesson.documentUrl ? (
                                          <FileText
                                            size={19}
                                          />
                                        ) : (
                                          <BookOpen
                                            size={19}
                                          />
                                        )}

                                      </div>

                                      <div className="min-w-0 flex-1">

                                        <p className="text-xs font-semibold text-slate-400">
                                          Lesson{" "}
                                          {lessonIndex +
                                            1}
                                        </p>

                                        <h4 className="font-semibold text-slate-800">
                                          {
                                            lesson.title
                                          }
                                        </h4>

                                        {lesson.description && (
                                          <p className="mt-1 truncate text-sm text-slate-500">
                                            {
                                              lesson.description
                                            }
                                          </p>
                                        )}

                                      </div>

                                      <span
                                        className={
                                          lesson.isActive
                                            ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                                        }
                                      >
                                        {lesson.isActive
                                          ? "Active"
                                          : "Inactive"}
                                      </span>

                                      <div className="flex flex-wrap items-center gap-2">

                                        {/* LESSON UP */}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMoveLesson(
                                              lesson.id,
                                              "UP"
                                            )
                                          }
                                          disabled={
                                            saving ||
                                            lessonIndex ===
                                              0
                                          }
                                          title="Move lesson up"
                                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <ArrowUp
                                            size={14}
                                          />
                                        </button>

                                        {/* LESSON DOWN */}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMoveLesson(
                                              lesson.id,
                                              "DOWN"
                                            )
                                          }
                                          disabled={
                                            saving ||
                                            lessonIndex ===
                                              lessons.length -
                                                1
                                          }
                                          title="Move lesson down"
                                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <ArrowDown
                                            size={14}
                                          />
                                        </button>

                                        {/* EDIT */}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            startEditLesson(
                                              lesson
                                            )
                                          }
                                          disabled={
                                            saving
                                          }
                                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                          <Pencil
                                            size={14}
                                          />
                                          Edit
                                        </button>

                                        {/* DELETE */}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteLesson(
                                              lesson
                                            )
                                          }
                                          disabled={
                                            saving
                                          }
                                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                        >
                                          <Trash2
                                            size={14}
                                          />
                                          Delete
                                        </button>

                                      </div>

                                    </div>
                                  )}

                                </div>

                              )
                            )}

                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              }
            )

          )}

        </div>

      </main>
    </div>
  );
}