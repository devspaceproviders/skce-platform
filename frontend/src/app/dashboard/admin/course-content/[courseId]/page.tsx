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

  const API_ORIGIN = API_URL.replace(/\/api$/, "");

  function getMediaUrl(url: string | null | undefined) {

    if (!url) {

      return null;

    }

    const value = url.trim();

    if (!value) {

      return null;

    }

    if (/^https?:\/\//i.test(value)) {

      try {

        const parsed = new URL(value);

        // Uploaded files are served by the backend. Normalize any stored

        // frontend-origin upload URL back to the backend upload origin.

        if (parsed.pathname.startsWith("/uploads/")) {

          return `${API_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;

        }

        return value;

      } catch {

        return value;

      }

    }

    return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;

  }

  type Lesson = {

    id: number;

    moduleId: number;

    title: string;

    description: string | null;

    content: string | null;

    videoUrl: string | null;

    documentUrl: string | null;

    imageUrl: string | null;

    sortOrder: number;

    isActive: boolean;

  };

  type Module = {

    id: number;

    title: string;

    description: string | null;

    imageUrl: string | null;

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

    const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);

    const [editLessonVideoFile, setEditLessonVideoFile] = useState<File | null>(null);

    const [lessonDocumentFile, setLessonDocumentFile] = useState<File | null>(null);

    const [editLessonDocumentFile, setEditLessonDocumentFile] = useState<File | null>(null);

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

    const [selectedModuleImageFile, setSelectedModuleImageFile] =

      useState<File | null>(null);

    const [moduleImagePreview, setModuleImagePreview] =

      useState<string | null>(null);

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

    const [selectedLessonImageFile, setSelectedLessonImageFile] =

      useState<File | null>(null);

    const [selectedEditLessonImageFile, setSelectedEditLessonImageFile] =

      useState<File | null>(null);

    const [lessonImagePreview, setLessonImagePreview] =

      useState<string | null>(null);

    const [editLessonImagePreview, setEditLessonImagePreview] =

      useState<string | null>(null);

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

    function validateModuleImageFile(file: File) {

      const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/webp",

      ];

      if (!allowedTypes.includes(file.type)) {

        setError("Module image must be JPG, PNG or WEBP.");

        return false;

      }

      if (file.size > 5 * 1024 * 1024) {

        setError("Module image must be 5 MB or smaller.");

        return false;

      }

      return true;

    }

    function handleModuleImageChange(file: File | null) {

      setError("");

      if (!file) {

        setSelectedModuleImageFile(null);

        setModuleImagePreview(null);

        return;

      }

      if (!validateModuleImageFile(file)) {

        setSelectedModuleImageFile(null);

        setModuleImagePreview(null);

        return;

      }

      setSelectedModuleImageFile(file);

      setModuleImagePreview(URL.createObjectURL(file));

    }

    function validateLessonImageFile(file: File) {

      const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/webp",

      ];

      if (!allowedTypes.includes(file.type)) {

        setError("Lesson image must be JPG, PNG or WEBP.");

        return false;

      }

      if (file.size > 5 * 1024 * 1024) {

        setError("Lesson image must be 5 MB or smaller.");

        return false;

      }

      return true;

    }

    function handleLessonImageChange(file: File | null) {

      setError("");

      if (!file) {

        setSelectedLessonImageFile(null);

        setLessonImagePreview(null);

        return;

      }

      if (!validateLessonImageFile(file)) {

        setSelectedLessonImageFile(null);

        setLessonImagePreview(null);

        return;

      }

      setSelectedLessonImageFile(file);

      setLessonImagePreview(URL.createObjectURL(file));

    }

    function handleEditLessonImageChange(file: File | null) {

      setError("");

      if (!file) {

        setSelectedEditLessonImageFile(null);

        return;

      }

      if (!validateLessonImageFile(file)) {

        setSelectedEditLessonImageFile(null);

        return;

      }

      setSelectedEditLessonImageFile(file);

      setEditLessonImagePreview(URL.createObjectURL(file));

    }

    async function uploadModuleImage(

      moduleId: number,

      file: File

    ) {

      const formData = new FormData();

      formData.append("image", file);

      const token = localStorage.getItem("token");

      if (!token) {

        router.push("/admin/login");

        return;

      }

      const response = await fetch(

        `${API_URL}/admin/course-content/modules/${moduleId}/image`,

        {

          method: "POST",

          headers: { Authorization: `Bearer ${token}` },

          body: formData,

        }

      );

      const result = await response.json();

      if (!response.ok) {

        throw new Error(

          result.message || "Failed to upload module image"

        );

      }

      return result;

    }

    async function uploadLessonImage(

      lessonId: number,

      file: File

    ) {

      const formData = new FormData();

      formData.append("image", file);

      const token = localStorage.getItem("token");

      if (!token) {

        router.push("/admin/login");

        return;

      }

      const response = await fetch(

        `${API_URL}/admin/course-content/lessons/${lessonId}/image`,

        {

          method: "POST",

          headers: {

            Authorization: `Bearer ${token}`,

          },

          body: formData,

        }

      );

      const result = await response.json();

      if (!response.ok) {

        throw new Error(

          result.message || "Failed to upload lesson image"

        );

      }

      return result;

    }

    async function uploadLessonVideo(lessonId: number, file: File, token: string) {

      const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];

      if (!allowedTypes.includes(file.type)) {

        throw new Error("Please select an MP4, WebM, or MOV video file.");

      }

      if (file.size > 500 * 1024 * 1024) {

        throw new Error("Video size must be 500 MB or less.");

      }

      const formData = new FormData();

      formData.append("video", file);

      const response = await fetch(`${API_URL}/admin/course-content/lessons/${lessonId}/video`, {

        method: "POST",

        headers: { Authorization: `Bearer ${token}` },

        body: formData,

      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {

        throw new Error(result?.message || "Failed to upload lesson video");

      }

      return result;

    }

    async function uploadLessonDocument(lessonId: number, file: File, token: string) {

      const allowedTypes = [

        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "application/vnd.ms-powerpoint",

        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      ];

      const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

      const hasAllowedType = allowedTypes.includes(file.type);

      const hasAllowedExtension = allowedExtensions.some((extension) =>

        file.name.toLowerCase().endsWith(extension)

      );

      if (!hasAllowedType && !hasAllowedExtension) {

        throw new Error("Please select a PDF, DOC, DOCX, PPT, or PPTX document.");

      }

      if (file.size > 20 * 1024 * 1024) {

        throw new Error("Document size must be 20 MB or less.");

      }

      const formData = new FormData();

      formData.append("document", file);

      const response = await fetch(`${API_URL}/admin/course-content/lessons/${lessonId}/document`, {

        method: "POST",

        headers: { Authorization: `Bearer ${token}` },

        body: formData,

      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {

        throw new Error(result?.message || "Failed to upload lesson document");

      }

      return result;

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

              videoUrl: lessonVideoFile ? undefined : (lessonVideoUrl.trim() || undefined),

              documentUrl: lessonDocumentFile

                ? undefined

                : (lessonDocumentUrl.trim() || undefined),

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

        const createdLessonId =

          result?.data?.id ??

          result?.data?.lesson?.id;

        if (lessonVideoFile && createdLessonId) {

          await uploadLessonVideo(Number(createdLessonId), lessonVideoFile, token);

        }

        if (lessonDocumentFile && createdLessonId) {

          await uploadLessonDocument(Number(createdLessonId), lessonDocumentFile, token);

        }

        setLessonTitle("");

        setLessonDescription("");

        setLessonContent("");

        setLessonVideoUrl("");

        setLessonVideoFile(null);

        setLessonDocumentUrl("");

        setLessonDocumentFile(null);

        setSelectedLessonImageFile(null);

        setLessonImagePreview(null);

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

      setSelectedModuleImageFile(null);

      setModuleImagePreview(getMediaUrl(module.imageUrl));

    }

    function cancelEditModule() {

      setEditingModuleId(null);

      setEditModuleTitle("");

      setEditModuleDescription("");

      setSelectedModuleImageFile(null);

      setModuleImagePreview(null);

    }

    function startEditLesson(lesson: Lesson) {

      setEditingModuleId(null);

      setEditingLessonId(lesson.id);

      setEditLessonTitle(lesson.title);

      setEditLessonDescription(lesson.description || "");

      setEditLessonContent(lesson.content || "");

      setEditLessonVideoUrl(lesson.videoUrl || "");

      setEditLessonVideoFile(null);

      setEditLessonVideoFile(null);

      setEditLessonDocumentUrl(lesson.documentUrl || "");

      setEditLessonDocumentFile(null);

      setSelectedEditLessonImageFile(null);

      setEditLessonImagePreview(getMediaUrl(lesson.imageUrl));

    }

    function cancelEditLesson() {

      setEditingLessonId(null);

      setEditLessonTitle("");

      setEditLessonDescription("");

      setEditLessonContent("");

      setEditLessonVideoUrl("");

      setEditLessonVideoFile(null);

      setEditLessonVideoFile(null);

      setEditLessonDocumentUrl("");

      setEditLessonDocumentFile(null);

      setSelectedEditLessonImageFile(null);

      setEditLessonImagePreview(null);

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

              videoUrl: editLessonVideoFile ? undefined : (editLessonVideoUrl.trim() || undefined),

              documentUrl: editLessonDocumentFile

                ? undefined

                : (editLessonDocumentUrl.trim() || undefined),

            }),

          }

        );

        const result = await response.json();

        if (!response.ok) {

          throw new Error(

            result.message || "Failed to update lesson"

          );

        }

        if (editLessonVideoFile) {

          await uploadLessonVideo(lessonId, editLessonVideoFile, token);

        }

        if (editLessonDocumentFile) {

          await uploadLessonDocument(lessonId, editLessonDocumentFile, token);

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

        <div className="min-h-screen bg-[#F7F9FC] p-8">

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

      <div className="min-h-screen bg-[#F7F9FC]">

        <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

          {/* Error */}

          {error && (

            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

              {error}

            </div>

          )}

          {/* SKCE BRANDED COURSE CONTENT BANNER */}
          {course && (
            <section className="sk-fade-up relative isolate mb-7 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#102F55] via-[#173B67] to-[#24558A] px-5 py-5 text-white shadow-[0_12px_28px_rgba(23,59,103,0.16)] sm:px-7 sm:py-6 lg:px-8">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 -z-10 h-64 w-64 rounded-full border border-orange-300/25 shadow-[0_0_0_18px_rgba(255,255,255,0.035),0_0_0_42px_rgba(255,255,255,0.025)]" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-1 w-40 bg-gradient-to-r from-orange-500 via-amber-300 to-transparent" />

              <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/admin/courses")}
                    className="mb-3 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-blue-100/90 transition hover:-translate-x-0.5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  >
                    <ArrowLeft size={16} />
                    Back to Courses
                  </button>

                  <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-orange-300 sm:text-xs">
                    <BookOpen size={15} />
                    Administration Portal <span className="text-white/40">·</span> Course Content
                  </p>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {course.title}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-blue-100/90">
                    {course.description || "Manage course modules, lessons and learning resources."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.mode && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95 backdrop-blur">
                        {course.mode}
                      </span>
                    )}
                    {course.duration && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95 backdrop-blur">
                        {course.duration}
                      </span>
                    )}
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur ${
                      course.isActive
                        ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                        : "border-orange-300/30 bg-orange-400/15 text-orange-100"
                    }`}>
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur">
                      Modules: <strong className="ml-1">{modules.length}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModuleForm(!showModuleForm)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-md shadow-orange-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B67] active:translate-y-0 md:self-center"
                >
                  <Plus size={18} />
                  Add Module
                </button>
              </div>
            </section>
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

                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-[#F7F9FC]"

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

                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[#F7F9FC] disabled:opacity-50"

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

                      <div className="border-t border-slate-100 bg-[#F7F9FC] p-5">

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

                              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setLessonVideoFile(e.target.files?.[0] || null)} className="h-11 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm" />

                              {lessonVideoFile && <p className="text-xs text-slate-500">Selected: {lessonVideoFile.name}</p>}

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

                              <div className="space-y-1">

                                <label className="text-sm font-medium text-slate-700">Upload Document (optional)</label>

                                <input

                                  type="file"

                                  accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"

                                  onChange={(e) => setLessonDocumentFile(e.target.files?.[0] || null)}

                                  className="h-11 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"

                                />

                                {lessonDocumentFile && <p className="text-xs text-slate-500">Selected: {lessonDocumentFile.name}</p>}

                                <p className="text-xs text-slate-500">PDF, DOC, DOCX, PPT, or PPTX; maximum 20 MB.</p>

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

                                          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#F7F9FC] hover:text-slate-700"

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

                                        <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setEditLessonVideoFile(e.target.files?.[0] || null)} className="h-11 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm" />

                                          {editLessonVideoFile && <p className="text-xs text-slate-500">Selected: {editLessonVideoFile.name}</p>}

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

                                        <div className="space-y-1">

                                          <label className="text-sm font-medium text-slate-700">Upload Document (optional)</label>

                                          <input

                                            type="file"

                                            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"

                                            onChange={(e) => setEditLessonDocumentFile(e.target.files?.[0] || null)}

                                            className="h-11 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"

                                          />

                                          {editLessonDocumentFile && <p className="text-xs text-slate-500">Selected: {editLessonDocumentFile.name}</p>}

                                          <p className="text-xs text-slate-500">PDF, DOC, DOCX, PPT, or PPTX; maximum 20 MB.</p>

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

                                          onClick={cancelEditLesson}

                                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"

                                        >

                                          Cancel

                                        </button>

                                      </div>

                                    </form>

                                  ) : (

                                    <div className="flex items-center gap-4 p-4">

                                      {getMediaUrl(lesson.imageUrl) ? (

                                        <img

                                          src={getMediaUrl(lesson.imageUrl) || ""}

                                          alt={lesson.title}

                                          className="h-16 w-24 shrink-0 rounded-lg object-cover border border-slate-200"

                                        />

                                      ) : null}

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

                                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F7F9FC] disabled:opacity-50"

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
