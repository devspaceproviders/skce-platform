"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type TrainerCoursePermission = {
  courseId: number;
  canManageContent: boolean;
};

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string | null;
  mode?: string | null;
  duration?: string | null;
  isActive?: boolean;
};

type Lesson = {
  id: number;
  moduleId: number;
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

type CourseContentResponse = {
  course: Course;
  modules: CourseModule[];
};

type ModuleForm = {
  title: string;
  description: string;
};

type LessonForm = {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  documentUrl: string;
};

const EMPTY_MODULE_FORM: ModuleForm = {
  title: "",
  description: "",
};

const EMPTY_LESSON_FORM: LessonForm = {
  title: "",
  description: "",
  content: "",
  videoUrl: "",
  documentUrl: "",
};

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function clearAuthAndRedirect(
  router: ReturnType<typeof useRouter>
) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("student");
  localStorage.removeItem("studentId");

  router.push("/login");
}

export default function TrainerCourseContentPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [permissions, setPermissions] = useState<
    TrainerCoursePermission[]
  >([]);

  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expandedModules, setExpandedModules] =
    useState<number[]>([]);

  const [showModuleForm, setShowModuleForm] =
    useState(false);

  const [moduleForm, setModuleForm] =
    useState<ModuleForm>(EMPTY_MODULE_FORM);

  const [editingModuleId, setEditingModuleId] =
    useState<number | null>(null);

  const [
    showLessonFormForModuleId,
    setShowLessonFormForModuleId,
  ] = useState<number | null>(null);

  const [lessonForm, setLessonForm] =
    useState<LessonForm>(EMPTY_LESSON_FORM);

  const [editingLessonId, setEditingLessonId] =
    useState<number | null>(null);

  const [selectedVideoFile, setSelectedVideoFile] =
    useState<File | null>(null);

  const [
    selectedDocumentFile,
    setSelectedDocumentFile,
  ] = useState<File | null>(null);

  const [actionError, setActionError] = useState("");

  const allowedCourseIds = useMemo(
    () =>
      new Set(
        permissions
          .filter(
            (permission) =>
              permission.canManageContent
          )
          .map((permission) =>
            Number(permission.courseId)
          )
      ),
    [permissions]
  );

  const allowedCourses = useMemo(
    () =>
      courses.filter(
        (item) =>
          Boolean(item.isActive) &&
          allowedCourseIds.has(Number(item.id))
      ),
    [courses, allowedCourseIds]
  );

  const selectedPermission = useMemo(
    () =>
      permissions.find(
        (permission) =>
          Number(permission.courseId) ===
          Number(selectedCourseId)
      ),
    [permissions, selectedCourseId]
  );

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      clearAuthAndRedirect(router);
      throw new Error("Authentication required");
    }

    const headers = new Headers(options.headers);

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuthAndRedirect(router);
      throw new Error("Authentication required");
    }

    return response;
  }

  async function parseResponse(
    response: Response
  ) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message:
          "The server returned an invalid response.",
      };
    }
  }

  async function loadPermissionsAndCourses() {
    try {
      setLoading(true);
      setError("");

      const [
        permissionsResponse,
        coursesResponse,
      ] = await Promise.all([
        authenticatedFetch(
          `${API_URL}/trainer/course-permissions`
        ),
        authenticatedFetch(
          `${API_URL}/courses`
        ),
      ]);

      const permissionsJson =
        await parseResponse(
          permissionsResponse
        );

      const coursesJson =
        await parseResponse(
          coursesResponse
        );

      if (
        !permissionsResponse.ok ||
        !permissionsJson?.success
      ) {
        throw new Error(
          permissionsJson?.message ||
            "Unable to load your course permissions."
        );
      }

      if (
        !coursesResponse.ok ||
        !coursesJson?.success
      ) {
        throw new Error(
          coursesJson?.message ||
            "Unable to load courses."
        );
      }

      const permissionData =
        Array.isArray(
          permissionsJson.data
        )
          ? permissionsJson.data
          : [];

      const courseData =
        Array.isArray(coursesJson.data)
          ? coursesJson.data
          : [];

      const normalizedPermissions =
        permissionData.map(
          (permission: any) => ({
            courseId: Number(
              permission.courseId
            ),
            canManageContent: Boolean(
              permission.canManageContent
            ),
          })
        );

      const normalizedCourses =
        courseData.map(
          (item: any) => ({
            id: Number(item.id),
            slug: item.slug,
            title: item.title,
            description:
              item.description ?? null,
            mode: item.mode ?? null,
            duration:
              item.duration ?? null,
            isActive:
              Boolean(item.isActive),
          })
        );

      setPermissions(
        normalizedPermissions
      );

      setCourses(normalizedCourses);

      const permittedIds = new Set(
        normalizedPermissions
          .filter(
            (
              permission: TrainerCoursePermission
            ) =>
              permission.canManageContent
          )
          .map(
            (
              permission: TrainerCoursePermission
            ) => permission.courseId
          )
      );

      const firstPermittedCourse =
        normalizedCourses.find(
          (item: Course) =>
            item.isActive &&
            permittedIds.has(item.id)
        );

      setSelectedCourseId(
        firstPermittedCourse
          ? String(firstPermittedCourse.id)
          : ""
      );
    } catch (err) {
      console.error(
        "Load trainer course content setup error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load course permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseContent(
    courseId: number
  ) {
    if (!courseId) {
      setCourse(null);
      setModules([]);
      return;
    }

    const permission =
      permissions.find(
        (item) =>
          Number(item.courseId) ===
          Number(courseId)
      );

    if (!permission?.canManageContent) {
      setCourse(null);
      setModules([]);

      setError(
        "You do not have permission to manage content for this course."
      );

      return;
    }

    try {
      setLoadingContent(true);
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/${courseId}`,
          {
            cache: "no-store",
          }
        );

      const result =
        await parseResponse(response);

      if (response.status === 403) {
        setCourse(null);
        setModules([]);

        setError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Unable to load course content."
        );
      }

      const data =
        result.data as CourseContentResponse;

      setCourse(data?.course || null);

      setModules(
        Array.isArray(data?.modules)
          ? data.modules
          : []
      );

      setExpandedModules(
        Array.isArray(data?.modules)
          ? data.modules.map(
              (module) => module.id
            )
          : []
      );
    } catch (err) {
      console.error(
        "Load trainer course content error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load course content."
      );
    } finally {
      setLoadingContent(false);
    }
  }

  useEffect(() => {
    loadPermissionsAndCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      void loadCourseContent(
        Number(selectedCourseId)
      );
    } else {
      setCourse(null);
      setModules([]);
    }
  }, [
    selectedCourseId,
    permissions,
  ]);

  function resetForms() {
    setShowModuleForm(false);
    setModuleForm(EMPTY_MODULE_FORM);
    setEditingModuleId(null);

    setShowLessonFormForModuleId(null);
    setLessonForm(EMPTY_LESSON_FORM);
    setEditingLessonId(null);

    setSelectedVideoFile(null);
    setSelectedDocumentFile(null);

    setActionError("");
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

  function startCreateModule() {
    setActionError("");
    setSuccess("");
    setEditingModuleId(null);
    setModuleForm(
      EMPTY_MODULE_FORM
    );
    setShowModuleForm(true);
  }

  function startEditModule(
    module: CourseModule
  ) {
    setActionError("");
    setSuccess("");
    setShowModuleForm(false);
    setEditingModuleId(module.id);

    setModuleForm({
      title: module.title,
      description:
        module.description || "",
    });
  }

  function startCreateLesson(
    moduleId: number
  ) {
    setActionError("");
    setSuccess("");
    setEditingLessonId(null);
    setLessonForm(
      EMPTY_LESSON_FORM
    );

    setSelectedVideoFile(null);
    setSelectedDocumentFile(null);

    setShowLessonFormForModuleId(
      moduleId
    );

    setExpandedModules((current) =>
      current.includes(moduleId)
        ? current
        : [...current, moduleId]
    );
  }

  function startEditLesson(
    lesson: Lesson
  ) {
    setActionError("");
    setSuccess("");
    setShowLessonFormForModuleId(null);
    setEditingLessonId(lesson.id);

    setLessonForm({
      title: lesson.title,
      description:
        lesson.description || "",
      content:
        lesson.content || "",
      videoUrl:
        lesson.videoUrl || "",
      documentUrl:
        lesson.documentUrl || "",
    });

    setSelectedVideoFile(null);
    setSelectedDocumentFile(null);

    setExpandedModules((current) =>
      current.includes(
        lesson.moduleId
      )
        ? current
        : [
            ...current,
            lesson.moduleId,
          ]
    );
  }

  function cancelModuleForm() {
    setShowModuleForm(false);
    setEditingModuleId(null);
    setModuleForm(
      EMPTY_MODULE_FORM
    );
  }

  function cancelLessonForm() {
    setShowLessonFormForModuleId(
      null
    );

    setEditingLessonId(null);

    setLessonForm(
      EMPTY_LESSON_FORM
    );

    setSelectedVideoFile(null);
    setSelectedDocumentFile(null);
  }

  function validateVideoFile(
    file: File
  ) {
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setActionError(
        "Only MP4, WebM, and MOV video files are allowed."
      );

      return false;
    }

    if (
      file.size > MAX_VIDEO_SIZE
    ) {
      setActionError(
        "Video file must be 500 MB or smaller."
      );

      return false;
    }

    return true;
  }

  function validateDocumentFile(
    file: File
  ) {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setActionError(
        "Only PDF, DOC, DOCX, PPT, and PPTX documents are allowed."
      );

      return false;
    }

    if (
      file.size > MAX_DOCUMENT_SIZE
    ) {
      setActionError(
        "Document file must be 20 MB or smaller."
      );

      return false;
    }

    return true;
  }

  function handleVideoFileChange(
    file: File | null
  ) {
    setActionError("");

    if (!file) {
      setSelectedVideoFile(null);
      return;
    }

    if (!validateVideoFile(file)) {
      setSelectedVideoFile(null);
      return;
    }

    setSelectedVideoFile(file);
  }

  function handleDocumentFileChange(
    file: File | null
  ) {
    setActionError("");

    if (!file) {
      setSelectedDocumentFile(null);
      return;
    }

    if (
      !validateDocumentFile(file)
    ) {
      setSelectedDocumentFile(null);
      return;
    }

    setSelectedDocumentFile(file);
  }

  async function uploadLessonVideo(
    lessonId: number,
    file: File
  ) {
    const formData = new FormData();

    formData.append(
      "video",
      file
    );

    const response =
      await authenticatedFetch(
        `${API_URL}/admin/course-content/lessons/${lessonId}/video`,
        {
          method: "POST",
          body: formData,
        }
      );

    const result =
      await parseResponse(response);

    if (
      response.status === 403
    ) {
      throw new Error(
        result?.message ||
          "You do not have permission to manage content for this course."
      );
    }

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          "Failed to upload lesson video."
      );
    }

    return result;
  }

  async function uploadLessonDocument(
    lessonId: number,
    file: File
  ) {
    const formData = new FormData();

    formData.append(
      "document",
      file
    );

    const response =
      await authenticatedFetch(
        `${API_URL}/admin/course-content/lessons/${lessonId}/document`,
        {
          method: "POST",
          body: formData,
        }
      );

    const result =
      await parseResponse(response);

    if (
      response.status === 403
    ) {
      throw new Error(
        result?.message ||
          "You do not have permission to manage content for this course."
      );
    }

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          "Failed to upload lesson document."
      );
    }

    return result;
  }

  async function uploadSelectedLessonFiles(
    lessonId: number
  ) {
    if (
      !selectedVideoFile &&
      !selectedDocumentFile
    ) {
      return;
    }

    setUploading(true);

    try {
      if (selectedVideoFile) {
        await uploadLessonVideo(
          lessonId,
          selectedVideoFile
        );
      }

      if (selectedDocumentFile) {
        await uploadLessonDocument(
          lessonId,
          selectedDocumentFile
        );
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateModule(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedCourseId) {
      return;
    }

    if (!moduleForm.title.trim()) {
      setActionError(
        "Module title is required."
      );

      return;
    }

    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/${selectedCourseId}/modules`,
          {
            method: "POST",
            body: JSON.stringify({
              title:
                moduleForm.title.trim(),
              description:
                moduleForm.description.trim() ||
                undefined,
            }),
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to create module."
        );
      }

      cancelModuleForm();

      setSuccess(
        result?.message ||
          "Module created successfully."
      );

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Create module error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to create module."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateModule(
    event: React.FormEvent<HTMLFormElement>,
    moduleId: number
  ) {
    event.preventDefault();

    if (!moduleForm.title.trim()) {
      setActionError(
        "Module title is required."
      );

      return;
    }

    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/modules/${moduleId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              title:
                moduleForm.title.trim(),
              description:
                moduleForm.description.trim() ||
                undefined,
            }),
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to update module."
        );
      }

      cancelModuleForm();

      setSuccess(
        result?.message ||
          "Module updated successfully."
      );

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Update module error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update module."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModule(
    module: CourseModule
  ) {
    const confirmed =
      window.confirm(
        `Delete "${module.title}"?\n\nThis will also delete the lessons inside this module. This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/modules/${module.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to delete module."
        );
      }

      if (
        editingModuleId ===
        module.id
      ) {
        cancelModuleForm();
      }

      setSuccess(
        result?.message ||
          "Module deleted successfully."
      );

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Delete module error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to delete module."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderModule(
    moduleId: number,
    direction: "UP" | "DOWN"
  ) {
    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/modules/${moduleId}/reorder`,
          {
            method: "PATCH",
            body: JSON.stringify({
              direction,
            }),
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to reorder module."
        );
      }

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Reorder module error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to reorder module."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateLesson(
    event: React.FormEvent<HTMLFormElement>,
    moduleId: number
  ) {
    event.preventDefault();

    if (!lessonForm.title.trim()) {
      setActionError(
        "Lesson title is required."
      );

      return;
    }

    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/modules/${moduleId}/lessons`,
          {
            method: "POST",
            body: JSON.stringify({
              title:
                lessonForm.title.trim(),
              description:
                lessonForm.description.trim() ||
                undefined,
              content:
                lessonForm.content.trim() ||
                undefined,
              videoUrl:
                lessonForm.videoUrl.trim() ||
                undefined,
              documentUrl:
                lessonForm.documentUrl.trim() ||
                undefined,
            }),
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to create lesson."
        );
      }

      const createdLesson =
        result.data as Lesson;

      if (
        createdLesson?.id &&
        (selectedVideoFile ||
          selectedDocumentFile)
      ) {
        await uploadSelectedLessonFiles(
          createdLesson.id
        );
      }

      cancelLessonForm();

      setSuccess(
        selectedVideoFile ||
          selectedDocumentFile
          ? "Lesson created and selected files uploaded successfully."
          : result?.message ||
              "Lesson created successfully."
      );

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Create lesson error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to create lesson."
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleUpdateLesson(
    event: React.FormEvent<HTMLFormElement>,
    lessonId: number
  ) {
    event.preventDefault();

    if (!lessonForm.title.trim()) {
      setActionError(
        "Lesson title is required."
      );

      return;
    }

    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/lessons/${lessonId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              title:
                lessonForm.title.trim(),
              description:
                lessonForm.description.trim() ||
                undefined,
              content:
                lessonForm.content.trim() ||
                undefined,
              videoUrl:
                lessonForm.videoUrl.trim() ||
                undefined,
              documentUrl:
                lessonForm.documentUrl.trim() ||
                undefined,
            }),
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to update lesson."
        );
      }

      if (
        selectedVideoFile ||
        selectedDocumentFile
      ) {
        await uploadSelectedLessonFiles(
          lessonId
        );
      }

      cancelLessonForm();

      setSuccess(
        selectedVideoFile ||
          selectedDocumentFile
          ? "Lesson updated and selected files uploaded successfully."
          : result?.message ||
              "Lesson updated successfully."
      );

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Update lesson error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update lesson."
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleDeleteLesson(
    lesson: Lesson
  ) {
    const confirmed =
      window.confirm(
        `Delete "${lesson.title}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/lessons/${lesson.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to delete lesson."
        );
      }

      if (
        editingLessonId ===
        lesson.id
      ) {
        cancelLessonForm();
      }

      setSuccess(
        result?.message ||
          "Lesson deleted successfully."
      );

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Delete lesson error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to delete lesson."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderLesson(
    lessonId: number,
    direction: "UP" | "DOWN"
  ) {
    try {
      setSaving(true);
      setActionError("");
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/course-content/lessons/${lessonId}/reorder`,
          {
            method: "PATCH",
            body: JSON.stringify({
              direction,
            }),
          }
        );

      const result =
        await parseResponse(response);

      if (
        response.status === 403
      ) {
        setActionError(
          result?.message ||
            "You do not have permission to manage content for this course."
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Failed to reorder lesson."
        );
      }

      await loadCourseContent(
        Number(selectedCourseId)
      );
    } catch (err) {
      console.error(
        "Reorder lesson error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to reorder lesson."
      );
    } finally {
      setSaving(false);
    }
  }

  function renderModuleForm() {
    const isEditing =
      editingModuleId !== null;

    return (
      <form
        onSubmit={(event) =>
          isEditing
            ? handleUpdateModule(
                event,
                editingModuleId
              )
            : handleCreateModule(event)
        }
        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              {isEditing
                ? "Edit Module"
                : "Create Module"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Organize lessons under a course module.
            </p>
          </div>

          <button
            type="button"
            onClick={cancelModuleForm}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
            aria-label="Close module form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Module Title
            </span>

            <input
              value={moduleForm.title}
              onChange={(event) =>
                setModuleForm(
                  (current) => ({
                    ...current,
                    title:
                      event.target.value,
                  })
                )
              }
              placeholder="e.g. Introduction to Java"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </span>

            <input
              value={
                moduleForm.description
              }
              onChange={(event) =>
                setModuleForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  })
                )
              }
              placeholder="Optional module description"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelModuleForm}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving || uploading
            }
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {isEditing
              ? "Save Module"
              : "Create Module"}
          </button>
        </div>
      </form>
    );
  }

  function renderLessonForm(
    moduleId: number
  ) {
    const isEditing =
      editingLessonId !== null;

    return (
      <form
        onSubmit={(event) =>
          isEditing
            ? handleUpdateLesson(
                event,
                editingLessonId
              )
            : handleCreateLesson(
                event,
                moduleId
              )
        }
        className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">
              {isEditing
                ? "Edit Lesson"
                : "Create Lesson"}
            </h4>

            <p className="mt-1 text-xs text-slate-500">
              Add lesson content, video and document links or upload files.
            </p>
          </div>

          <button
            type="button"
            onClick={cancelLessonForm}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close lesson form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Lesson Title
            </span>

            <input
              value={lessonForm.title}
              onChange={(event) =>
                setLessonForm(
                  (current) => ({
                    ...current,
                    title:
                      event.target.value,
                  })
                )
              }
              placeholder="e.g. Variables and Data Types"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </span>

            <input
              value={
                lessonForm.description
              }
              onChange={(event) =>
                setLessonForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  })
                )
              }
              placeholder="Short lesson description"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Lesson Content
          </span>

          <textarea
            value={lessonForm.content}
            onChange={(event) =>
              setLessonForm(
                (current) => ({
                  ...current,
                  content:
                    event.target.value,
                })
              )
            }
            placeholder="Enter the lesson content..."
            rows={7}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Video className="h-4 w-4" />
              Video URL
            </span>

            <input
              type="url"
              value={
                lessonForm.videoUrl
              }
              onChange={(event) =>
                setLessonForm(
                  (current) => ({
                    ...current,
                    videoUrl:
                      event.target.value,
                  })
                )
              }
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <p className="mt-1 text-xs text-slate-500">
              Optional external video URL.
            </p>
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileText className="h-4 w-4" />
              Document URL
            </span>

            <input
              type="url"
              value={
                lessonForm.documentUrl
              }
              onChange={(event) =>
                setLessonForm(
                  (current) => ({
                    ...current,
                    documentUrl:
                      event.target.value,
                  })
                )
              }
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <p className="mt-1 text-xs text-slate-500">
              Optional external document URL.
            </p>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-slate-600" />

              <span className="text-sm font-semibold text-slate-800">
                Upload Video
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              MP4, WebM or MOV. Maximum 500 MB.
            </p>

            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(event) =>
                handleVideoFileChange(
                  event.target.files?.[0] ||
                    null
                )
              }
              className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />

            {selectedVideoFile && (
              <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                Selected:{" "}
                <span className="font-medium text-slate-900">
                  {selectedVideoFile.name}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />

              <span className="text-sm font-semibold text-slate-800">
                Upload Document
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              PDF, DOC, DOCX, PPT or PPTX. Maximum 20 MB.
            </p>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(event) =>
                handleDocumentFileChange(
                  event.target.files?.[0] ||
                    null
                )
              }
              className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />

            {selectedDocumentFile && (
              <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                Selected:{" "}
                <span className="font-medium text-slate-900">
                  {selectedDocumentFile.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {(uploading ||
          selectedVideoFile ||
          selectedDocumentFile) && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading selected files...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Selected files will be uploaded when you save the lesson.
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelLessonForm}
            disabled={
              saving || uploading
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving || uploading
            }
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {uploading
              ? "Uploading..."
              : isEditing
                ? "Save Lesson"
                : "Create Lesson"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900 p-2.5 text-white">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Course Content
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage modules, lessons, videos and documents for courses assigned to you.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadCourseContent(
                  Number(selectedCourseId)
                )
              }
              disabled={
                loadingContent ||
                !selectedCourseId
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingContent
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {actionError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your course permissions...
            </div>
          </div>
        ) : allowedCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <BookOpen className="h-6 w-6 text-slate-500" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              No course content permissions
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              You currently do not have the{" "}
              <span className="font-medium">
                Can Manage Content
              </span>{" "}
              permission for an active course. Ask an administrator to assign the required course permission.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Course
                  </span>

                  <select
                    value={
                      selectedCourseId
                    }
                    onChange={(event) => {
                      resetForms();

                      setSelectedCourseId(
                        event.target.value
                      );
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  >
                    {allowedCourses.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.title}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    Content management access
                  </div>

                  <div className="mt-1">
                    {selectedPermission?.canManageContent
                      ? "Enabled for this course"
                      : "Not enabled for this course"}
                  </div>
                </div>
              </div>
            </div>

            {course && (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Course
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {course.title}
                    </h2>

                    {course.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={
                      startCreateModule
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add Module
                  </button>
                </div>

                {(course.mode ||
                  course.duration) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.mode && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {course.mode}
                      </span>
                    )}

                    {course.duration && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {course.duration}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {showModuleForm && (
              <div className="mb-6">
                {renderModuleForm()}
              </div>
            )}

            {loadingContent ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading course content...
                </div>
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-slate-400" />

                <h3 className="mt-3 font-semibold text-slate-900">
                  No modules yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create the first module for this course.
                </p>

                <button
                  type="button"
                  onClick={
                    startCreateModule
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Create Module
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map(
                  (
                    module,
                    moduleIndex
                  ) => {
                    const isExpanded =
                      expandedModules.includes(
                        module.id
                      );

                    const isEditing =
                      editingModuleId ===
                      module.id;

                    const showLessonForm =
                      showLessonFormForModuleId ===
                      module.id;

                    return (
                      <section
                        key={module.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              toggleModule(
                                module.id
                              )
                            }
                            className="flex min-w-0 items-start gap-3 text-left"
                          >
                            <div className="mt-0.5 rounded-lg bg-slate-100 p-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-slate-600" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Module{" "}
                                  {moduleIndex +
                                    1}
                                </span>

                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                  {
                                    module
                                      .lessons
                                      .length
                                  }{" "}
                                  lesson
                                  {module
                                    .lessons
                                    .length ===
                                  1
                                    ? ""
                                    : "s"}
                                </span>
                              </div>

                              <h3 className="mt-1 truncate font-semibold text-slate-900">
                                {module.title}
                              </h3>

                              {module.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                  {
                                    module.description
                                  }
                                </p>
                              )}
                            </div>
                          </button>

                          <div className="flex flex-wrap items-center gap-1 md:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                handleReorderModule(
                                  module.id,
                                  "UP"
                                )
                              }
                              disabled={
                                saving ||
                                uploading ||
                                moduleIndex ===
                                  0
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Move module up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleReorderModule(
                                  module.id,
                                  "DOWN"
                                )
                              }
                              disabled={
                                saving ||
                                uploading ||
                                moduleIndex ===
                                  modules.length -
                                    1
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Move module down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                startEditModule(
                                  module
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteModule(
                                  module
                                )
                              }
                              disabled={
                                saving ||
                                uploading
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="border-b border-slate-100 p-4">
                            {renderModuleForm()}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="bg-slate-50/60 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4 className="font-semibold text-slate-800">
                                  Lessons
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                  Add and organize the learning material inside this module.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  startCreateLesson(
                                    module.id
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <Plus className="h-4 w-4" />
                                Add Lesson
                              </button>
                            </div>

                            {showLessonForm &&
                              renderLessonForm(
                                module.id
                              )}

                            {module.lessons
                              .length ===
                            0 ? (
                              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                                <FileText className="mx-auto h-6 w-6 text-slate-400" />

                                <p className="mt-2 text-sm text-slate-500">
                                  No lessons in this module yet.
                                </p>
                              </div>
                            ) : (
                              <div className="mt-4 space-y-3">
                                {module.lessons.map(
                                  (
                                    lesson,
                                    lessonIndex
                                  ) => {
                                    const editingThisLesson =
                                      editingLessonId ===
                                      lesson.id;

                                    return (
                                      <div
                                        key={
                                          lesson.id
                                        }
                                        className="rounded-xl border border-slate-200 bg-white p-4"
                                      >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                          <div className="flex min-w-0 gap-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                              {lessonIndex +
                                                1}
                                            </div>

                                            <div className="min-w-0">
                                              <h5 className="font-medium text-slate-900">
                                                {
                                                  lesson.title
                                                }
                                              </h5>

                                              {lesson.description && (
                                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                                  {
                                                    lesson.description
                                                  }
                                                </p>
                                              )}

                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {lesson.videoUrl && (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                                    <Video className="h-3.5 w-3.5" />
                                                    Video
                                                  </span>
                                                )}

                                                {lesson.documentUrl && (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Document
                                                  </span>
                                                )}

                                                {lesson.content && (
                                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                                    Content
                                                  </span>
                                                )}
                                              </div>

                                              {(lesson.videoUrl ||
                                                lesson.documentUrl) && (
                                                <div className="mt-3 flex flex-wrap gap-3">
                                                  {lesson.videoUrl && (
                                                    <a
                                                      href={
                                                        lesson.videoUrl.startsWith(
                                                          "http"
                                                        )
                                                          ? lesson.videoUrl
                                                          : `${API_URL.replace(
                                                              "/api",
                                                              ""
                                                            )}${lesson.videoUrl}`
                                                      }
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 underline hover:text-slate-900"
                                                    >
                                                      <Video className="h-3.5 w-3.5" />
                                                      Open Video
                                                    </a>
                                                  )}

                                                  {lesson.documentUrl && (
                                                    <a
                                                      href={
                                                        lesson.documentUrl.startsWith(
                                                          "http"
                                                        )
                                                          ? lesson.documentUrl
                                                          : `${API_URL.replace(
                                                              "/api",
                                                              ""
                                                            )}${lesson.documentUrl}`
                                                      }
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 underline hover:text-slate-900"
                                                    >
                                                      <FileText className="h-3.5 w-3.5" />
                                                      Open Document
                                                    </a>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-1 md:justify-end">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleReorderLesson(
                                                  lesson.id,
                                                  "UP"
                                                )
                                              }
                                              disabled={
                                                saving ||
                                                uploading ||
                                                lessonIndex ===
                                                  0
                                              }
                                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                              title="Move lesson up"
                                            >
                                              <ChevronUp className="h-4 w-4" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleReorderLesson(
                                                  lesson.id,
                                                  "DOWN"
                                                )
                                              }
                                              disabled={
                                                saving ||
                                                uploading ||
                                                lessonIndex ===
                                                  module
                                                    .lessons
                                                    .length -
                                                    1
                                              }
                                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                              title="Move lesson down"
                                            >
                                              <ChevronDown className="h-4 w-4" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                startEditLesson(
                                                  lesson
                                                )
                                              }
                                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                            >
                                              <Pencil className="h-4 w-4" />
                                              Edit
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteLesson(
                                                  lesson
                                                )
                                              }
                                              disabled={
                                                saving ||
                                                uploading
                                              }
                                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                              Delete
                                            </button>
                                          </div>
                                        </div>

                                        {editingThisLesson &&
                                          renderLessonForm(
                                            module.id
                                          )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    );
                  }
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}