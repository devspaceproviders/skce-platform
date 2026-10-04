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
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

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

export default function AdminCourseContentPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.courseId);

  const [course, setCourse] =
    useState<Course | null>(null);

  const [modules, setModules] =
    useState<Module[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showModuleForm, setShowModuleForm] =
    useState(false);

  const [showLessonForm, setShowLessonForm] =
    useState<number | null>(null);

  const [moduleTitle, setModuleTitle] =
    useState("");

  const [moduleDescription, setModuleDescription] =
    useState("");

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

  const [saving, setSaving] =
    useState(false);

  const [expandedModules, setExpandedModules] =
    useState<number[]>([]);

  const [editingModuleId, setEditingModuleId] =
    useState<number | null>(null);

  const [editingLessonId, setEditingLessonId] =
    useState<number | null>(null);

  const [editModuleTitle, setEditModuleTitle] =
    useState("");

  const [editModuleDescription, setEditModuleDescription] =
    useState("");

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
      setModules(result.data.modules || []);
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

  function toggleModule(moduleId: number) {
    setExpandedModules((current) =>
      current.includes(moduleId)
        ? current.filter(
            (id) => id !== moduleId
          )
        : [...current, moduleId]
    );
  }

  async function handleCreateModule(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!moduleTitle.trim()) {
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

  async function handleCreateLesson(
    e: React.FormEvent,
    moduleId: number
  ) {
    e.preventDefault();

    if (!lessonTitle.trim()) {
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

  function startEditModule(module: Module) {
    setEditingLessonId(null);
    setEditingModuleId(module.id);
    setEditModuleTitle(module.title);
    setEditModuleDescription(module.description || "");
  }

  function cancelEditModule() {
    setEditingModuleId(null);
    setEditModuleTitle("");
    setEditModuleDescription("");
  }

  function startEditLesson(lesson: Lesson) {
    setEditingModuleId(null);
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonDescription(lesson.description || "");
    setEditLessonContent(lesson.content || "");
    setEditLessonVideoUrl(lesson.videoUrl || "");
    setEditLessonDocumentUrl(lesson.documentUrl || "");
  }

  function cancelEditLesson() {
    setEditingLessonId(null);
    setEditLessonTitle("");
    setEditLessonDescription("");
    setEditLessonContent("");
    setEditLessonVideoUrl("");
    setEditLessonDocumentUrl("");
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

    const token = localStorage.getItem("token");

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
            title: editModuleTitle.trim(),
            description:
              editModuleDescription.trim() || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update module"
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

  async function handleDeleteModule(module: Module) {
    const confirmed = window.confirm(
      `Delete "${module.title}"?\n\nThis will also delete all lessons inside this module and their progress. This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

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
          result.message || "Failed to delete module"
        );
      }

      if (editingModuleId === module.id) {
        cancelEditModule();
      }

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

  async function handleUpdateLesson(
    e: React.FormEvent,
    lessonId: number
  ) {
    e.preventDefault();

    if (!editLessonTitle.trim()) {
      setError("Lesson title is required");
      return;
    }

    const token = localStorage.getItem("token");

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
            title: editLessonTitle.trim(),
            description:
              editLessonDescription.trim() || undefined,
            content:
              editLessonContent.trim() || undefined,
            videoUrl:
              editLessonVideoUrl.trim() || undefined,
            documentUrl:
              editLessonDocumentUrl.trim() || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update lesson"
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

  async function handleDeleteLesson(lesson: Lesson) {
    const confirmed = window.confirm(
      `Delete "${lesson.title}"?\n\nThis lesson and its saved progress will be permanently removed. This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

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
          result.message || "Failed to delete lesson"
        );
      }

      if (editingLessonId === lesson.id) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* Back */}
        <button
          onClick={() =>
            router.push("/dashboard/admin/courses")
          }
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Courses
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Course Header */}
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

        {/* Add Module */}
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
                  placeholder="Example: MS Word Fundamentals"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  required
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

        {/* Modules */}
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
            modules.map((module, index) => {
              const expanded =
                expandedModules.includes(
                  module.id
                );

              return (
                <div
                  key={module.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between gap-4 p-5">
                    <button
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

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEditModule(module)
                        }
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteModule(module)
                        }
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowLessonForm(
                            showLessonForm === module.id
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
                        className="flex shrink-0 items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                      >
                        <Plus size={16} />
                        Add Lesson
                      </button>
                    </div>
                  </div>

                  {/* Edit Module */}
                  {editingModuleId === module.id && (
                    <form
                      onSubmit={(e) =>
                        handleUpdateModule(e, module.id)
                      }
                      className="border-t border-orange-100 bg-orange-50/40 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">
                          Edit Module
                        </h3>
                        <button
                          type="button"
                          onClick={cancelEditModule}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4">
                        <input
                          value={editModuleTitle}
                          onChange={(e) =>
                            setEditModuleTitle(e.target.value)
                          }
                          placeholder="Module title"
                          required
                          className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-500"
                        />

                        <textarea
                          value={editModuleDescription}
                          onChange={(e) =>
                            setEditModuleDescription(
                              e.target.value
                            )
                          }
                          placeholder="Module description"
                          rows={3}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-[#173B67] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditModule}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Expanded Module */}
                  {expanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5">

                      {/* Add Lesson Form */}
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
                                  e.target
                                    .value
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
                                  e.target
                                    .value
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
                                  e.target
                                    .value
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
                                  e.target
                                    .value
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
                                  e.target
                                    .value
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

                      {/* Lessons */}
                      {module.lessons.length ===
                      0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                          <p className="text-sm text-slate-500">
                            No lessons in this
                            module yet.
                          </p>

                          <button
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
                          {module.lessons.map(
                            (lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="rounded-xl border border-slate-200 bg-white"
                              >
                                {editingLessonId === lesson.id ? (
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
                                      <h4 className="font-bold text-slate-900">
                                        Edit Lesson
                                      </h4>

                                      <button
                                        type="button"
                                        onClick={cancelEditLesson}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                      >
                                        <X size={18} />
                                      </button>
                                    </div>

                                    <div className="mt-4 grid gap-4">
                                      <input
                                        value={editLessonTitle}
                                        onChange={(e) =>
                                          setEditLessonTitle(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Lesson title"
                                        required
                                        className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                      />

                                      <input
                                        value={editLessonDescription}
                                        onChange={(e) =>
                                          setEditLessonDescription(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Short description"
                                        className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                      />

                                      <textarea
                                        value={editLessonContent}
                                        onChange={(e) =>
                                          setEditLessonContent(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Lesson content"
                                        rows={6}
                                        className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                                      />

                                      <input
                                        value={editLessonVideoUrl}
                                        onChange={(e) =>
                                          setEditLessonVideoUrl(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Video URL (optional)"
                                        className="h-11 rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-500"
                                      />

                                      <input
                                        value={editLessonDocumentUrl}
                                        onChange={(e) =>
                                          setEditLessonDocumentUrl(
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
                                          : "Save Changes"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={cancelEditLesson}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex items-center gap-4 p-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                      {lesson.videoUrl ? (
                                        <PlayCircle size={19} />
                                      ) : lesson.documentUrl ? (
                                        <FileText size={19} />
                                      ) : (
                                        <BookOpen size={19} />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-slate-400">
                                        Lesson {lessonIndex + 1}
                                      </p>

                                      <h4 className="font-semibold text-slate-800">
                                        {lesson.title}
                                      </h4>

                                      {lesson.description && (
                                        <p className="mt-1 truncate text-sm text-slate-500">
                                          {lesson.description}
                                        </p>
                                      )}
                                    </div>

                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                      {lesson.isActive
                                        ? "Active"
                                        : "Inactive"}
                                    </span>

                                    <div className="flex shrink-0 items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          startEditLesson(
                                            lesson
                                          )
                                        }
                                        disabled={saving}
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                      >
                                        <Pencil size={14} />
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteLesson(
                                            lesson
                                          )
                                        }
                                        disabled={saving}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                      >
                                        <Trash2 size={14} />
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
            })
          )}
        </div>
      </main>
    </div>
  );
}
