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
        className="rounded-xl border border-[#DCE6F2] bg-[#F4F7FC] p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#173B67]">
              {isEditing
                ? "Edit Module"
                : "Create Module"}
            </h3>

            <p className="mt-1 text-xs text-[#647C99]">
              Organize lessons under a course module.
            </p>
          </div>

          <button
            type="button"
            onClick={cancelModuleForm}
            className="rounded-lg p-2 text-[#647C99] hover:bg-[#EAF0F8]"
            aria-label="Close module form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#24476E]">
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
              className="w-full rounded-lg border border-[#C8D7E9] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#24476E]">
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
              className="w-full rounded-lg border border-[#C8D7E9] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelModuleForm}
            className="rounded-lg border border-[#C8D7E9] bg-white px-4 py-2 text-sm font-medium text-[#24476E] hover:bg-[#FFF4EA]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving || uploading
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E85D04] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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
        className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-[#173B67]">
              {isEditing
                ? "Edit Lesson"
                : "Create Lesson"}
            </h4>

            <p className="mt-1 text-xs text-[#647C99]">
              Add lesson content, video and document links or upload files.
            </p>
          </div>

          <button
            type="button"
            onClick={cancelLessonForm}
            className="rounded-lg p-2 text-[#647C99] hover:bg-[#FFF0E3]"
            aria-label="Close lesson form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#24476E]">
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
              className="w-full rounded-lg border border-[#C8D7E9] px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#24476E]">
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
              className="w-full rounded-lg border border-[#C8D7E9] px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-[#24476E]">
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
            className="w-full rounded-lg border border-[#C8D7E9] px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-[#24476E]">
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
              className="w-full rounded-lg border border-[#C8D7E9] px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            />

            <p className="mt-1 text-xs text-[#647C99]">
              Optional external video URL.
            </p>
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-[#24476E]">
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
              className="w-full rounded-lg border border-[#C8D7E9] px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            />

            <p className="mt-1 text-xs text-[#647C99]">
              Optional external document URL.
            </p>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-[#C8D7E9] bg-[#F4F7FC] p-4">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#526B8A]" />

              <span className="text-sm font-semibold text-[#173B67]">
                Upload Video
              </span>
            </div>

            <p className="mt-1 text-xs text-[#647C99]">
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
              className="mt-3 block w-full text-sm text-[#526B8A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F97316] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#E85D04]"
            />

            {selectedVideoFile && (
              <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#526B8A]">
                Selected:{" "}
                <span className="font-medium text-[#173B67]">
                  {selectedVideoFile.name}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-[#C8D7E9] bg-[#F4F7FC] p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#526B8A]" />

              <span className="text-sm font-semibold text-[#173B67]">
                Upload Document
              </span>
            </div>

            <p className="mt-1 text-xs text-[#647C99]">
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
              className="mt-3 block w-full text-sm text-[#526B8A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F97316] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#E85D04]"
            />

            {selectedDocumentFile && (
              <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#526B8A]">
                Selected:{" "}
                <span className="font-medium text-[#173B67]">
                  {selectedDocumentFile.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {(uploading ||
          selectedVideoFile ||
          selectedDocumentFile) && (
          <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F4F7FC] px-3 py-2.5 text-xs text-[#526B8A]">
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
            className="rounded-lg border border-[#C8D7E9] bg-white px-4 py-2 text-sm font-medium text-[#24476E] hover:bg-[#FFF4EA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving || uploading
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E85D04] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="min-h-screen bg-gradient-to-b from-[#F3F7FC] via-[#F8FAFD] to-[#EEF3FA] p-3 sm:p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1500px]">
        <section className="relative isolate mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#17263F] via-[#173B67] to-[#0D2A50] px-5 py-6 text-white shadow-[0_18px_45px_-25px_rgba(23,59,103,0.65)] sm:px-7 sm:py-7 lg:px-8">
          <div className="pointer-events-none absolute -right-10 -top-28 -z-10 h-72 w-72 rounded-full border-[36px] border-white/[0.055]" />
          <div className="pointer-events-none absolute -right-2 -top-20 -z-10 h-56 w-56 rounded-full border-[18px] border-orange-400/10" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 -z-10 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl motion-safe:animate-pulse" />
          <div className="absolute bottom-0 left-0 h-1 w-32 rounded-r-full bg-gradient-to-r from-orange-500 to-amber-300 sm:w-48" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-orange-300 shadow-inner backdrop-blur-sm sm:h-14 sm:w-14">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-orange-300 sm:text-xs">Trainer Workspace</p>
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Course Content</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100/90 sm:text-[15px]">Manage modules, lessons, videos and learning documents for your assigned courses.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadCourseContent(Number(selectedCourseId))}
              disabled={loadingContent || !selectedCourseId}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingContent ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </section>

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
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[#DCE6F2] bg-white">
            <div className="flex items-center gap-3 text-sm text-[#647C99]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your course permissions...
            </div>
          </div>
        ) : allowedCourses.length === 0 ? (
          <div className="rounded-2xl border border-[#DCE6F2] bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF0F8]">
              <BookOpen className="h-6 w-6 text-[#647C99]" />
            </div>

            <h2 className="text-lg font-semibold text-[#173B67]">
              No course content permissions
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#647C99]">
              You currently do not have the{" "}
              <span className="font-medium">
                Can Manage Content
              </span>{" "}
              permission for an active course. Ask an administrator to assign the required course permission.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-[0_8px_24px_-20px_rgba(23,59,103,0.45)] transition-shadow duration-300 hover:shadow-md sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#24476E]">
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
                    className="w-full rounded-lg border border-[#C8D7E9] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
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

                <div className="rounded-lg bg-[#F4F7FC] px-4 py-3 text-sm text-[#526B8A]">
                  <div className="font-medium text-[#173B67]">
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
              <div className="group relative mb-6 overflow-hidden rounded-2xl border border-[#C9D9EC] bg-gradient-to-br from-white via-white to-[#FFF0E3] p-5 shadow-[0_12px_32px_-22px_rgba(23,59,103,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#F97316] via-[#FF9B42] to-[#173B67]" />
                <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-[#173B67]/[0.045]" />
                <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-[#173B67]/[0.07] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#173B67]">
                      <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Course
                    </p>

                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#173B67] sm:text-2xl">
                      {course.title}
                    </h2>

                    {course.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#526B8A]">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={
                      startCreateModule
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E85D04] hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Add Module
                  </button>
                </div>

                {(course.mode ||
                  course.duration) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.mode && (
                      <span className="rounded-full bg-[#EAF0F8] px-3 py-1 text-xs font-medium text-[#526B8A]">
                        {course.mode}
                      </span>
                    )}

                    {course.duration && (
                      <span className="rounded-full bg-[#EAF0F8] px-3 py-1 text-xs font-medium text-[#526B8A]">
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
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-[#DCE6F2] bg-white">
                <div className="flex items-center gap-3 text-sm text-[#647C99]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading course content...
                </div>
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#C8D7E9] bg-white p-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-[#8295AE]" />

                <h3 className="mt-3 font-semibold text-[#173B67]">
                  No modules yet
                </h3>

                <p className="mt-1 text-sm text-[#647C99]">
                  Create the first module for this course.
                </p>

                <button
                  type="button"
                  onClick={
                    startCreateModule
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E85D04] hover:shadow-md"
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
                    const moduleIsOrange = moduleIndex % 2 === 0;
                    const moduleAccent = moduleIsOrange
                      ? {
                          card: "border-[#F6C79F] hover:border-[#F97316]",
                          header: "from-[#FFF8F1] via-white to-[#FFE9D6]",
                          marker: "bg-[#F97316] text-white shadow-md shadow-orange-200/70",
                          label: "text-[#C65308]",
                          count: "border border-orange-200 bg-orange-100 text-[#A94300]",
                          stripe: "from-[#F97316] to-[#FFB15C]",
                        }
                      : {
                          card: "border-[#BDD0E7] hover:border-[#173B67]",
                          header: "from-[#F1F6FC] via-white to-[#E2ECF8]",
                          marker: "bg-[#173B67] text-white shadow-md shadow-blue-200/70",
                          label: "text-[#173B67]",
                          count: "border border-blue-200 bg-blue-100 text-[#173B67]",
                          stripe: "from-[#173B67] to-[#4777AD]",
                        };

                    return (
                      <section
                        key={module.id}
                        className={`group relative overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_-22px_rgba(23,59,103,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${moduleAccent.card}`}
                      >
                        <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${moduleAccent.stripe}`} />
                        <div className={`flex flex-col gap-3 border-b border-[#DCE6F2] bg-gradient-to-r p-4 pl-5 sm:p-5 sm:pl-6 md:flex-row md:items-center md:justify-between ${moduleAccent.header}`}>
                          <button
                            type="button"
                            onClick={() =>
                              toggleModule(
                                module.id
                              )
                            }
                            className="flex min-w-0 items-start gap-3 text-left"
                          >
                            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${moduleAccent.marker}`}>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronUp className="h-5 w-5" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-extrabold uppercase tracking-[0.13em] ${moduleAccent.label}`}>
                                  Module{" "}
                                  {moduleIndex +
                                    1}
                                </span>

                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${moduleAccent.count}`}>
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

                              <h3 className="mt-1 truncate text-base font-extrabold text-[#173B67]">
                                {module.title}
                              </h3>

                              {module.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-[#647C99]">
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
                              className="rounded-lg p-2 text-[#647C99] hover:bg-[#FFF0E3] disabled:cursor-not-allowed disabled:opacity-30"
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
                              className="rounded-lg p-2 text-[#647C99] hover:bg-[#FFF0E3] disabled:cursor-not-allowed disabled:opacity-30"
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
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-[#526B8A] hover:bg-[#FFF0E3]"
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
                          <div className="border-b border-[#E8EEF6] p-4">
                            {renderModuleForm()}
                          </div>
                        )}

                        {isExpanded && (
                          <div className={`border-t-2 p-4 sm:p-5 ${moduleIsOrange ? "border-t-orange-200 bg-gradient-to-b from-orange-50/70 to-white" : "border-t-[#C7D8EC] bg-gradient-to-b from-[#F0F5FB] to-white"}`}>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4 className="font-semibold text-[#173B67]">
                                  Lessons
                                </h4>

                                <p className="mt-1 text-xs text-[#647C99]">
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
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C8D7E9] bg-white px-3 py-2 text-sm font-semibold text-[#173B67] transition-all duration-200 hover:border-orange-300 hover:bg-orange-50 hover:text-[#C65308]"
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
                              <div className="mt-4 rounded-xl border border-dashed border-[#C8D7E9] bg-white p-6 text-center">
                                <FileText className="mx-auto h-6 w-6 text-[#8295AE]" />

                                <p className="mt-2 text-sm text-[#647C99]">
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
                                        className={`rounded-xl border bg-white p-4 shadow-[0_4px_16px_-14px_rgba(23,59,103,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${moduleIsOrange ? "border-orange-100 hover:border-orange-300" : "border-[#DCE6F2] hover:border-[#9DB8D9]"}`}
                                      >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                          <div className="flex min-w-0 gap-3">
                                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${moduleIsOrange ? "bg-orange-100 text-[#B84B00] ring-1 ring-orange-200" : "bg-[#173B67] text-white ring-1 ring-[#173B67]/20"}`}>
                                              {lessonIndex + 1}
                                            </div>

                                            <div className="min-w-0">
                                              <h5 className="font-medium text-[#173B67]">
                                                {
                                                  lesson.title
                                                }
                                              </h5>

                                              {lesson.description && (
                                                <p className="mt-1 text-sm leading-5 text-[#647C99]">
                                                  {
                                                    lesson.description
                                                  }
                                                </p>
                                              )}

                                              <div className="mt-2 flex flex-wrap gap-2">

                                                {lesson.videoUrl && (
                                                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#B84B00]">
                                                    <Video className="h-3.5 w-3.5" />
                                                    Video
                                                  </span>
                                                )}

                                                {lesson.documentUrl && (
                                                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#B84B00]">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Document
                                                  </span>
                                                )}

                                                {lesson.content && (
                                                  <span className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#B84B00]">
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
                                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173B67] underline decoration-orange-400 decoration-2 underline-offset-4 transition-colors hover:text-[#F97316]"
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
                                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173B67] underline decoration-orange-400 decoration-2 underline-offset-4 transition-colors hover:text-[#F97316]"
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
                                              className="rounded-lg p-2 text-[#647C99] hover:bg-[#FFF0E3] disabled:cursor-not-allowed disabled:opacity-30"
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
                                              className="rounded-lg p-2 text-[#647C99] hover:bg-[#FFF0E3] disabled:cursor-not-allowed disabled:opacity-30"
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
                                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-[#526B8A] hover:bg-[#FFF0E3]"
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