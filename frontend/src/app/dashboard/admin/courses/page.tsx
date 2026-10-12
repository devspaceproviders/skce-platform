"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  Copy,
  Eye,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  Users,
  X,
  XCircle,
} from "lucide-react";

import CountUp from "@/components/CountUp";
import { useToast } from "@/components/Toast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type CourseStatus = "Active" | "Inactive";

type CourseMode = "ONLINE" | "OFFLINE" | "HYBRID";

type BackendCourse = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  mode: string | null;
  duration: string | null;
  modules: number;
  students?: number;
  price?: number | null;
  isActive: boolean;
  imageUrl?: string | null;
};

type Course = {
  id: number;
  slug: string;
  name: string;
  description: string;
  duration: string;
  mode: string;
  modules: number;
  students: number;
  status: CourseStatus;
  imageUrl: string | null;
};

type CourseForm = {
  title: string;
  description: string;
  duration: string;
  mode: CourseMode;
  isActive: boolean;
};

type FormErrors = {
  title?: string;
  duration?: string;
};

type SortKey = "name" | "id" | "duration" | "mode" | "modules" | "students" | "status";
type SortDirection = "asc" | "desc";

type ConfirmState = {
  kind: "delete" | "deactivate" | "discard";
  course?: Course;
};

const EMPTY_FORM: CourseForm = {
  title: "",
  description: "",
  duration: "",
  mode: "ONLINE",
  isActive: true,
};

const PAGE_SIZES = [10, 25, 50];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function getImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;

  const baseUrl = API_URL.replace(/\/api$/, "");

  return imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateForm(form: CourseForm): FormErrors {
  const errors: FormErrors = {};
  const title = form.title.trim();

  if (!title) errors.title = "Enter the course name.";
  else if (title.length < 3) errors.title = "Course name must be at least 3 characters.";
  else if (title.length > 120) errors.title = "Course name must be 120 characters or fewer.";

  if (form.duration.trim().length > 60) {
    errors.duration = "Duration must be 60 characters or fewer.";
  }

  return errors;
}

const MODE_TONES: Record<string, string> = {
  ONLINE: "bg-blue-50 text-blue-700",
  OFFLINE: "bg-slate-100 text-slate-600",
  HYBRID: "bg-violet-50 text-violet-700",
};

export default function CoursesPage() {
  const router = useRouter();
  const { notify, toastContainer } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [courseFilter, setCourseFilter] = useState("All");
  const [courseIdFilter, setCourseIdFilter] = useState("All");
  const [durationFilter, setDurationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CourseStatus>("All");
  const [modeFilter, setModeFilter] = useState<"All" | CourseMode>("All");
  const [modulesFilter, setModulesFilter] = useState("All");
  const [studentsFilter, setStudentsFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<CourseForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragging, setDragging] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  const skipGuardRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  /* ============================================================
     AUTH HELPERS (unchanged behaviour)
     ============================================================ */

  const handleAuthFailure = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("skce_admin_logged_in");
    router.push("/admin/login");
  }, [router]);

  /* ============================================================
     LOAD COURSES
     ============================================================ */

  async function loadCourses(mode: "initial" | "refresh" | "silent" = "initial") {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setLoadError("");

      const response = await fetch(`${API_URL}/admin/courses`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure();
          return;
        }

        throw new Error(result?.message || "Unable to retrieve courses");
      }

      const backendCourses: BackendCourse[] = result?.data || [];

      const mappedCourses: Course[] = backendCourses.map((course) => ({
        id: course.id,
        slug: course.slug,
        name: course.title,
        description: course.description || "",
        duration: course.duration || "Not specified",
        mode: course.mode || "Not specified",
        modules: Number(course.modules) || 0,
        students: Number(course.students) || 0,
        status: course.isActive ? "Active" : "Inactive",
        imageUrl: course.imageUrl || null,
      }));

      setCourses(mappedCourses);

      if (mode === "refresh") {
        notify(
          "success",
          "Courses refreshed",
          `${mappedCourses.length} course${mappedCourses.length === 1 ? "" : "s"} loaded.`,
          2800
        );
      }
    } catch (err) {
      console.error("Load courses error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to retrieve courses";
      setLoadError(message);
      if (mode !== "initial") notify("error", "Couldn't load courses", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     COURSE IMAGE
     ============================================================ */

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  useEffect(() => clearPreviewUrl, []);

  function acceptImage(file: File | undefined | null) {
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(
        `This image is ${formatBytes(file.size)}. Course images must be 5 MB or smaller.`
      );
      return;
    }

    setImageError("");
    setFormError("");
    clearPreviewUrl();

    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;

    setImageFile(file);
    setImagePreview(url);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    acceptImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function removeSelectedImage() {
    clearPreviewUrl();
    setImageFile(null);
    setImagePreview(existingImage);
    setImageError("");
  }

  async function uploadCourseImage(courseId: number, file: File) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      throw new Error("Authentication required.");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_URL}/admin/courses/${courseId}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleAuthFailure();
        throw new Error("Authentication required.");
      }

      throw new Error(result?.message || "Unable to upload course image.");
    }

    return result;
  }

  /* ============================================================
     FILTER + SORT + PAGE
     ============================================================ */

  const courseOptions = useMemo(
    () => Array.from(new Set(courses.map((course) => course.name).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [courses]
  );
  const courseIdOptions = useMemo(
    () => [...courses].sort((a, b) => a.id - b.id).map((course) => String(course.id)),
    [courses]
  );
  const durationOptions = useMemo(
    () => Array.from(new Set(courses.map((course) => course.duration).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [courses]
  );
  const modulesOptions = useMemo(
    () => Array.from(new Set(courses.map((course) => String(course.modules)))).sort((a, b) => Number(a) - Number(b)),
    [courses]
  );
  const studentsOptions = useMemo(
    () => Array.from(new Set(courses.map((course) => String(course.students)))).sort((a, b) => Number(a) - Number(b)),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const filtered = courses.filter((course) => {
      const matchesCourse = courseFilter === "All" || course.name === courseFilter;
      const matchesId = courseIdFilter === "All" || String(course.id) === courseIdFilter;
      const matchesDuration = durationFilter === "All" || course.duration === durationFilter;
      const matchesStatus = statusFilter === "All" || course.status === statusFilter;
      const matchesMode = modeFilter === "All" || course.mode.toUpperCase() === modeFilter;
      const matchesModules = modulesFilter === "All" || String(course.modules) === modulesFilter;
      const matchesStudents = studentsFilter === "All" || String(course.students) === studentsFilter;

      return matchesCourse && matchesId && matchesDuration && matchesStatus && matchesMode && matchesModules && matchesStudents;
    });

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case "id": result = a.id - b.id; break;
        case "modules": result = a.modules - b.modules; break;
        case "students": result = a.students - b.students; break;
        case "name": result = a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }); break;
        case "duration": result = a.duration.localeCompare(b.duration, undefined, { numeric: true }); break;
        case "mode": result = a.mode.localeCompare(b.mode); break;
        case "status": result = a.status.localeCompare(b.status); break;
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [courses, courseFilter, courseIdFilter, durationFilter, statusFilter, modeFilter, modulesFilter, studentsFilter, sortKey, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [courseFilter, courseIdFilter, durationFilter, statusFilter, modeFilter, modulesFilter, studentsFilter, sortKey, sortDirection, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedCourses = filteredCourses.slice(pageStart, pageStart + pageSize);

  const hasFilters =
    courseFilter !== "All" || courseIdFilter !== "All" || durationFilter !== "All" ||
    statusFilter !== "All" || modeFilter !== "All" || modulesFilter !== "All" ||
    studentsFilter !== "All" || sortKey !== null;

  function clearFilters() {
    setCourseFilter("All");
    setCourseIdFilter("All");
    setDurationFilter("All");
    setStatusFilter("All");
    setModeFilter("All");
    setModulesFilter("All");
    setStudentsFilter("All");
    setSortKey(null);
    setSortDirection("asc");
  }

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection("asc");
    }
  }

  /* ============================================================
     SUMMARY
     ============================================================ */

  const activeCourses = courses.filter((course) => course.status === "Active").length;
  const inactiveCourses = courses.filter((course) => course.status === "Inactive").length;
  const totalStudents = courses.reduce((total, course) => total + course.students, 0);

  /* ============================================================
     VIEW / CONTENT
     ============================================================ */

  function openViewModal(course: Course) {
    setSelectedCourse(course);
    setShowViewModal(true);
  }

  function closeViewModal() {
    setSelectedCourse(null);
    setShowViewModal(false);
  }

  function openContent(courseId: number) {
    router.push(`/dashboard/admin/course-content/${courseId}`);
  }

  /* ============================================================
     ADD / EDIT FORM
     ============================================================ */

  function resetImageState(existing: string | null) {
    clearPreviewUrl();
    setImageFile(null);
    setExistingImage(existing);
    setImagePreview(existing);
    setImageError("");
  }

  function openAddModal() {
    skipGuardRef.current = false;
    setFormError("");
    setFormErrors({});
    setEditingCourseId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    resetImageState(null);
    setShowFormModal(true);
  }

  function openEditModal(course: Course) {
    skipGuardRef.current = false;
    setFormError("");
    setFormErrors({});
    setEditingCourseId(course.id);

    const next: CourseForm = {
      title: course.name,
      description: course.description || "",
      duration: course.duration === "Not specified" ? "" : course.duration,
      mode:
        course.mode === "ONLINE" || course.mode === "OFFLINE" || course.mode === "HYBRID"
          ? course.mode
          : "ONLINE",
      isActive: course.status === "Active",
    };

    setForm(next);
    setInitialForm(next);
    resetImageState(getImageUrl(course.imageUrl));
    setShowFormModal(true);
  }

  function closeFormModal() {
    if (saving) return;

    setShowFormModal(false);
    setEditingCourseId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setFormErrors({});
    setFormError("");
    resetImageState(null);
  }

  const formDirty =
    imageFile !== null ||
    form.title !== initialForm.title ||
    form.description !== initialForm.description ||
    form.duration !== initialForm.duration ||
    form.mode !== initialForm.mode ||
    form.isActive !== initialForm.isActive;

  // Called before the form popup closes by Esc / backdrop / X / Cancel.
  function guardFormClose() {
    if (saving || imageUploading) return false;
    if (skipGuardRef.current || !formDirty) return true;
    setConfirm({ kind: "discard" });
    return false;
  }

  function updateForm<K extends keyof CourseForm>(key: K, value: CourseForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
    if (key === "title" || key === "duration") {
      setFormErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  /* ============================================================
     SAVE COURSE
     ============================================================ */

  async function saveCourse() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Please fix the highlighted fields.");
      document.getElementById(errors.title ? "course-title" : "course-duration")?.focus();
      return;
    }

    const title = form.title.trim();
    let savedCourseId: number | null = null;

    try {
      setSaving(true);
      setFormError("");

      const isEditing = editingCourseId !== null;

      const url = isEditing
        ? `${API_URL}/admin/courses/${editingCourseId}`
        : `${API_URL}/admin/courses`;

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: form.description.trim() || null,
          duration: form.duration.trim() || null,
          mode: form.mode,
          isActive: form.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure();
          return;
        }

        throw new Error(result?.message || "Unable to save course.");
      }

      savedCourseId = isEditing ? editingCourseId : Number(result?.data?.id);

      if (imageFile) {
        if (!savedCourseId) {
          throw new Error(
            "Course was saved, but the course ID was not returned for image upload."
          );
        }

        // The course now exists: switch to edit mode so a retry updates it
        // instead of creating a duplicate.
        if (!isEditing) setEditingCourseId(savedCourseId);

        setImageUploading(true);

        try {
          await uploadCourseImage(savedCourseId, imageFile);
        } catch (uploadError) {
          await loadCourses("silent");
          setInitialForm({ ...form });
          setFormError(
            `The course was saved, but its image could not be uploaded: ${
              uploadError instanceof Error ? uploadError.message : "unknown error"
            }. Choose the image again and press Save Changes.`
          );
          notify("warning", "Course saved without image", "Image upload failed — you can retry in this window.", 6500);
          return;
        } finally {
          setImageUploading(false);
        }
      }

      await loadCourses("silent");

      skipGuardRef.current = true;
      closeFormModal();

      notify(
        "success",
        isEditing ? "Course updated" : "Course created",
        isEditing
          ? `"${title}" was saved successfully.`
          : `"${title}" is now in your course list. Use Content to add modules and lessons.`
      );
    } catch (err) {
      console.error("Save course error:", err);

      setFormError(
        err instanceof Error ? err.message : "Unable to save course."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     DELETE COURSE
     ============================================================ */

  async function deleteCourse(course: Course) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setDeletingId(course.id);

      const response = await fetch(`${API_URL}/admin/courses/${course.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure();
          return;
        }

        throw new Error(result?.message || "Unable to delete course.");
      }

      setConfirm(null);
      await loadCourses("silent");
      notify("success", "Course deleted", `"${course.name}" was removed.`);
    } catch (err) {
      console.error("Delete course error:", err);
      setConfirm(null);
      notify(
        "error",
        "Couldn't delete course",
        err instanceof Error ? err.message : "Unable to delete course."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ============================================================
     ACTIVATE / DEACTIVATE
     ============================================================ */

  async function toggleCourseStatus(course: Course) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setTogglingId(course.id);

      const response = await fetch(`${API_URL}/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: course.status !== "Active" }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthFailure();
          return;
        }

        throw new Error(result?.message || "Unable to update course status.");
      }

      setConfirm(null);
      await loadCourses("silent");
      notify(
        "success",
        course.status === "Active" ? "Course deactivated" : "Course activated",
        course.status === "Active"
          ? `"${course.name}" is no longer available for new enrollment.`
          : `"${course.name}" is now available for packages and enrollment.`
      );
    } catch (err) {
      console.error("Toggle course status error:", err);
      setConfirm(null);
      notify(
        "error",
        "Couldn't update status",
        err instanceof Error ? err.message : "Unable to update course status."
      );
    } finally {
      setTogglingId(null);
    }
  }

  function requestToggle(course: Course) {
    // Activating is harmless; deactivating asks first.
    if (course.status === "Active") setConfirm({ kind: "deactivate", course });
    else void toggleCourseStatus(course);
  }

  function toggleCourseDetails(courseId: number) {
    setExpandedCourseId((current) => (current === courseId ? null : courseId));
  }

  const rangeStart = filteredCourses.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredCourses.length);

  return (
    <main className="sk-page-in min-h-screen bg-[#F7F9FC] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {toastContainer}

      <div className="mx-auto max-w-[1500px]">
        {/* ============ SKCE BRANDED COURSE BANNER ============ */}
        <section className="sk-fade-up relative isolate mb-6 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#102F55] via-[#173B67] to-[#24558A] px-5 py-5 text-white shadow-[0_12px_28px_rgba(23,59,103,0.16)] sm:px-7 sm:py-6 lg:px-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 -z-10 h-64 w-64 rounded-full border border-orange-300/25 shadow-[0_0_0_18px_rgba(255,255,255,0.035),0_0_0_42px_rgba(255,255,255,0.025)]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-1 w-40 bg-gradient-to-r from-orange-500 via-amber-300 to-transparent" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-orange-300 sm:text-xs">
                <BookOpen size={15} />
                Administration Portal <span className="text-white/40">·</span> Course Management
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Courses
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-blue-100/90">
                Manage SK Computer Education courses, learning content and student enrollment.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur">
                  Total courses: <strong className="ml-1">{courses.length}</strong>
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur">
                  Active: <strong className="ml-1">{activeCourses}</strong>
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur">
                  Inactive: <strong className="ml-1">{inactiveCourses}</strong>
                </span>
              </div>
            </div>

            <div className="relative flex shrink-0 flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => void loadCourses("refresh")}
                disabled={loading || refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-md shadow-orange-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B67] active:translate-y-0"
              >
                <Plus size={17} />
                Add New Course
              </button>
            </div>
          </div>
        </section>

        {/* ============ SUMMARY ============ */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<BookOpen size={21} />}
            value={courses.length}
            title="Total Courses"
            description="Courses in database"
            loading={loading}
            index={0}
            selected={statusFilter === "All"}
            onClick={() => setStatusFilter("All")}
          />
          <SummaryCard
            icon={<CheckCircle2 size={21} />}
            value={activeCourses}
            title="Active Courses"
            description="Currently available"
            loading={loading}
            index={1}
            selected={statusFilter === "Active"}
            onClick={() => setStatusFilter("Active")}
          />
          <SummaryCard
            icon={<XCircle size={21} />}
            value={inactiveCourses}
            title="Inactive Courses"
            description="Currently disabled"
            loading={loading}
            index={2}
            selected={statusFilter === "Inactive"}
            onClick={() => setStatusFilter("Inactive")}
          />
          <SummaryCard
            icon={<Users size={21} />}
            value={totalStudents}
            title="Total Enrollments"
            description="Across all courses"
            loading={loading}
            index={3}
          />
        </div>

        {/* ============ LOAD ERROR ============ */}
        {loadError && (
          <div
            role="alert"
            className="sk-fade-up mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start"
          >
            <div className="flex flex-1 items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-800">Unable to load courses</p>
                <p className="mt-1 text-xs leading-5 text-red-700">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadCourses("refresh")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ============ COURSE TABLE ============ */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04)]">
          {/* FILTER PANEL — dropdown filters replace free-text search */}
          <div className="flex flex-col gap-2 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Filter courses</h2>
              <p className="mt-0.5 text-xs text-slate-500">Choose values from the dropdowns under each column. Results update automatically.</p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>
          </div>

          {/* Mobile filters: the table-column dropdowns are mirrored here for small screens. */}
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/50 p-4 md:hidden">
            <MobileFilterSelect label="Course" value={courseFilter} onChange={setCourseFilter} options={courseOptions.map((value) => ({ value, label: value }))} />
            <MobileFilterSelect label="Course ID" value={courseIdFilter} onChange={setCourseIdFilter} options={courseIdOptions.map((value) => ({ value, label: `#${value}` }))} />
            <MobileFilterSelect label="Duration" value={durationFilter} onChange={setDurationFilter} options={durationOptions.map((value) => ({ value, label: value }))} />
            <MobileFilterSelect label="Mode" value={modeFilter} onChange={(value) => setModeFilter(value as "All" | CourseMode)} options={[{ value: "ONLINE", label: "Online" }, { value: "OFFLINE", label: "Offline" }, { value: "HYBRID", label: "Hybrid" }]} />
            <MobileFilterSelect label="Modules" value={modulesFilter} onChange={setModulesFilter} options={modulesOptions.map((value) => ({ value, label: value }))} />
            <MobileFilterSelect label="Students" value={studentsFilter} onChange={setStudentsFilter} options={studentsOptions.map((value) => ({ value, label: value }))} />
            <MobileFilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as "All" | CourseStatus)} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
          </div>

          {!loading && courses.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
              <span>
                Showing <span className="font-semibold text-[#173B67]">{filteredCourses.length}</span> of{" "}
                <span className="font-semibold text-[#173B67]">{courses.length}</span> courses
              </span>
              {hasFilters && <span className="hidden font-medium text-orange-600 sm:inline">Filters applied</span>}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div aria-busy="true" aria-live="polite">
              <span className="sr-only">Loading courses...</span>
              <div className="divide-y divide-slate-100">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex items-center gap-4 px-4 py-5 sm:px-5">
                    <div className="sk-shimmer h-12 w-12 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="sk-shimmer h-3.5 w-1/3 rounded" />
                      <div className="sk-shimmer h-3 w-1/2 rounded" />
                    </div>
                    <div className="sk-shimmer hidden h-6 w-14 rounded-lg md:block" />
                    <div className="sk-shimmer hidden h-4 w-24 rounded lg:block" />
                    <div className="sk-shimmer h-6 w-16 rounded-full" />
                    <div className="sk-shimmer hidden h-9 w-40 rounded-lg lg:block" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMPTY */}
          {!loading && !loadError && filteredCourses.length === 0 && (
            <div className="sk-fade-up px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 ring-8 ring-orange-50/60">
                {courses.length === 0 ? <BookOpen size={28} className="text-orange-500" /> : <Search size={28} className="text-orange-500" />}
              </div>

              <h3 className="mt-6 text-lg font-semibold text-[#173B67]">
                {courses.length === 0 ? "No courses yet" : "No courses found"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {courses.length === 0
                  ? "Create your first course, then use Content to add modules and lessons."
                  : "Try changing the dropdown filters or clear them to see all courses."}
              </p>

              {courses.length === 0 ? (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                >
                  <Plus size={16} /> Add New Course
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* TABLE (md and up) */}
          {!loading && filteredCourses.length > 0 && (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <SortableTableHeader label="Course" sortKey="name" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTableHeader label="Course ID" sortKey="id" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTableHeader label="Duration" sortKey="duration" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTableHeader label="Mode" sortKey="mode" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTableHeader label="Modules" sortKey="modules" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTableHeader label="Students" sortKey="students" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTableHeader label="Status" sortKey="status" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <TableHeader>Actions</TableHeader>
                    </tr>
                    <tr className="border-t border-slate-100 bg-white">
                      <FilterSelectCell label="Filter by course" value={courseFilter} onChange={setCourseFilter} options={courseOptions.map((value) => ({ value, label: value }))} />
                      <FilterSelectCell label="Filter by course ID" value={courseIdFilter} onChange={setCourseIdFilter} options={courseIdOptions.map((value) => ({ value, label: `#${value}` }))} />
                      <FilterSelectCell label="Filter by duration" value={durationFilter} onChange={setDurationFilter} options={durationOptions.map((value) => ({ value, label: value }))} />
                      <FilterSelectCell label="Filter by mode" value={modeFilter} onChange={(value) => setModeFilter(value as "All" | CourseMode)} options={[{ value: "ONLINE", label: "Online" }, { value: "OFFLINE", label: "Offline" }, { value: "HYBRID", label: "Hybrid" }]} />
                      <FilterSelectCell label="Filter by modules" value={modulesFilter} onChange={setModulesFilter} options={modulesOptions.map((value) => ({ value, label: value }))} />
                      <FilterSelectCell label="Filter by students" value={studentsFilter} onChange={setStudentsFilter} options={studentsOptions.map((value) => ({ value, label: value }))} />
                      <FilterSelectCell label="Filter by status" value={statusFilter} onChange={(value) => setStatusFilter(value as "All" | CourseStatus)} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
                      <th className="px-3 py-2"><span className="sr-only">No action filter</span></th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedCourses.map((course, index) => {
                      const expanded = expandedCourseId === course.id;

                      return (
                        <CourseRows
                          key={course.id}
                          course={course}
                          index={index}
                          expanded={expanded}
                          deleting={deletingId === course.id}
                          toggling={togglingId === course.id}
                          onView={() => openViewModal(course)}
                          onEdit={() => openEditModal(course)}
                          onContent={() => openContent(course.id)}
                          onToggleStatus={() => requestToggle(course)}
                          onDelete={() => setConfirm({ kind: "delete", course })}
                          onExpand={() => toggleCourseDetails(course.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {pagedCourses.map((course, index) => (
                  <li key={course.id} className="sk-row-in p-4" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
                    <div className="flex items-start gap-3">
                      <CourseThumb course={course} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{course.name}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">#{course.id} · {course.slug}</p>
                          </div>
                          <StatusBadge status={course.status} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {course.duration}</span>
                          <span className="inline-flex items-center gap-1.5"><Monitor size={13} /> {course.mode}</span>
                          <span className="inline-flex items-center gap-1.5"><Layers size={13} /> {course.modules} modules</span>
                          <span className="inline-flex items-center gap-1.5"><Users size={13} /> {course.students} students</span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openContent(course.id)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-600 transition hover:bg-orange-100"
                          >
                            <BookOpen size={15} /> Content
                          </button>
                          <ActionButton title="View course" onClick={() => openViewModal(course)}><Eye size={16} /></ActionButton>
                          <ActionButton title="Edit course" onClick={() => openEditModal(course)}><Pencil size={16} /></ActionButton>
                          <ActionButton title={course.status === "Active" ? "Deactivate course" : "Activate course"} onClick={() => requestToggle(course)} disabled={togglingId === course.id}>
                            {togglingId === course.id ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                          </ActionButton>
                          <ActionButton title="Delete course" danger onClick={() => setConfirm({ kind: "delete", course })}><Trash2 size={16} /></ActionButton>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* PAGINATION */}
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <span>
                    <span className="font-semibold text-[#173B67]">{rangeStart}–{rangeEnd}</span> of {filteredCourses.length}
                  </span>
                  <label className="flex items-center gap-2">
                    <span className="hidden sm:inline">Rows</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      aria-label="Rows per page"
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    >
                      {PAGE_SIZES.map((size) => (<option key={size} value={size}>{size}</option>))}
                    </select>
                  </label>
                </div>

                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
              </div>
            </>
          )}
        </section>

        {/* INFO */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <GraduationCap size={18} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="text-xs font-semibold text-blue-800">LMS Content Management</p>
            <p className="mt-1 text-xs leading-5 text-blue-700/80">
              Select <strong>Content</strong> for any course to manage its
              modules and lessons. Module counts are calculated from the
              course content stored in the SK Computer Education database.
            </p>
          </div>
        </div>
      </div>

      {/* ============ VIEW MODAL ============ */}
      {showViewModal && selectedCourse && (
        <ModalOverlay onClose={closeViewModal} label={`Course details: ${selectedCourse.name}`} size="lg">
          <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#102f55_0%,#173b67_60%,#2465c6_130%)] px-5 py-5 text-white sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-orange-500/25 blur-3xl" />
            <ModalCloseX />

            <div className="relative flex flex-wrap items-center gap-4 pr-10">
              <CourseThumb course={selectedCourse} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold sm:text-2xl">{selectedCourse.name}</h2>
                  <StatusBadge status={selectedCourse.status} />
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-blue-100/80">
                  <span>Course ID #{selectedCourse.id}</span>
                  <span className="inline-flex items-center gap-1">
                    {selectedCourse.slug}
                    <CopyButton value={selectedCourse.slug} label="Copy slug" className="!text-blue-100 hover:!bg-white/15 hover:!text-white" />
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <div className="sk-fade-up">
              <p className="mb-5 text-sm leading-6 text-slate-600">
                {selectedCourse.description || "No course description available."}
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailBox icon={<Clock size={17} />} label="Duration" value={selectedCourse.duration} />
                <DetailBox icon={<Monitor size={17} />} label="Mode" value={selectedCourse.mode} />
                <DetailBox icon={<Layers size={17} />} label="Modules" value={String(selectedCourse.modules)} />
                <DetailBox icon={<Users size={17} />} label="Students" value={String(selectedCourse.students)} />
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-orange-500" />
                  <p className="text-sm font-semibold text-slate-700">LMS Content</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">
                    This course currently has <strong>{selectedCourse.modules}</strong> module
                    {selectedCourse.modules === 1 ? "" : "s"}.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedCourse.id;
                      closeViewModal();
                      openContent(id);
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                  >
                    <BookOpen size={16} /> Manage LMS Content
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => {
                const course = selectedCourse;
                closeViewModal();
                openEditModal(course);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <Pencil size={16} /> Edit Course
            </button>

            <ModalCloseButton>Close</ModalCloseButton>
          </div>
        </ModalOverlay>
      )}

      {/* ============ ADD / EDIT MODAL ============ */}
      {showFormModal && (
        <ModalOverlay
          onClose={closeFormModal}
          guard={guardFormClose}
          label={editingCourseId ? "Edit course" : "Add new course"}
          size="lg"
        >
          <ModalHeader
            title={editingCourseId ? "Edit Course" : "Add New Course"}
            subtitle={editingCourseId ? "Update the course information." : "Create a new course for SK Computer Education."}
            icon={editingCourseId ? <Pencil size={20} /> : <Plus size={20} />}
          />

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void saveCourse();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
              {formError && (
                <div role="alert" className="sk-fade-up mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* NAME */}
              <FormField id="course-title" label="Course Name" required error={formErrors.title}>
                <input
                  id="course-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  onBlur={() => setFormErrors((c) => ({ ...c, title: validateForm(form).title }))}
                  placeholder="Example: Advanced Python"
                  autoFocus
                  maxLength={140}
                  aria-invalid={Boolean(formErrors.title)}
                  aria-describedby={formErrors.title ? "course-title-error" : undefined}
                  className={inputClass(Boolean(formErrors.title))}
                />
              </FormField>

              {/* DESCRIPTION */}
              <div className="mt-5">
                <FormField id="course-description" label="Description" hint={`${form.description.length} characters`}>
                  <textarea
                    id="course-description"
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    rows={4}
                    placeholder="Describe what students will learn..."
                    className={`${inputClass(false)} resize-none`}
                  />
                </FormField>
              </div>

              {/* DURATION + MODE */}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <FormField id="course-duration" label="Duration" error={formErrors.duration}>
                  <input
                    id="course-duration"
                    type="text"
                    value={form.duration}
                    onChange={(e) => updateForm("duration", e.target.value)}
                    placeholder="Example: 3 Months"
                    aria-invalid={Boolean(formErrors.duration)}
                    aria-describedby={formErrors.duration ? "course-duration-error" : undefined}
                    className={inputClass(Boolean(formErrors.duration))}
                  />
                </FormField>

                <FormField id="course-mode" label="Mode">
                  <select
                    id="course-mode"
                    value={form.mode}
                    onChange={(e) => updateForm("mode", e.target.value as CourseMode)}
                    className={inputClass(false)}
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </FormField>
              </div>

              {/* IMAGE */}
              <div className="mt-5">
                <p className="mb-2 block text-sm font-semibold text-slate-700">Course Image</p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (!saving && !imageUploading) acceptImage(e.dataTransfer.files?.[0]);
                  }}
                  className={`rounded-xl border-2 border-dashed p-4 transition-colors duration-200 ${
                    dragging ? "border-orange-400 bg-orange-50" : imageError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt="Course preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                          <ImageIcon size={24} />
                          <span className="mt-1 text-[11px] font-medium">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <UploadCloud size={16} className="text-orange-500" />
                        {dragging ? "Drop the image here" : "Upload course image"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Drag and drop, or choose a file. JPG, PNG or WEBP, up to 5 MB.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-600 transition hover:bg-orange-100 focus-within:ring-2 focus-within:ring-orange-300">
                          <ImageIcon size={15} />
                          {imageFile ? "Change Image" : imagePreview ? "Replace Image" : "Choose Image"}
                          <input
                            id="course-image-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            disabled={saving || imageUploading}
                            className="sr-only"
                          />
                        </label>

                        {imageFile && (
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            disabled={saving || imageUploading}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                          >
                            <X size={14} /> Remove
                          </button>
                        )}
                      </div>

                      {imageFile && (
                        <p className="mt-2 truncate text-[11px] text-slate-500">
                          Selected: <span className="font-semibold">{imageFile.name}</span> · {formatBytes(imageFile.size)}
                        </p>
                      )}

                      {imageError && (
                        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600">
                          <AlertCircle size={14} className="mt-px shrink-0" /> {imageError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUS */}
              <div className="mt-5">
                <p className="mb-2 block text-sm font-semibold text-slate-700">Course Status</p>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/40">
                  <span>
                    <span className="block text-sm font-semibold text-slate-700">Active Course</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Active courses are available for packages and student enrollment.
                    </span>
                  </span>

                  <span className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => updateForm("isActive", e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="block h-6 w-11 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-300 peer-focus-visible:ring-offset-2" />
                    <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
                  </span>
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800">Course Content</p>
                <p className="mt-1 text-xs leading-5 text-blue-700/80">
                  After creating the course, use the <strong>Content</strong> button
                  to add modules and lessons. Module counts are maintained from the
                  LMS content.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5 sm:px-6">
              <ModalCloseButton disabled={saving || imageUploading}>Cancel</ModalCloseButton>

              <button
                type="submit"
                disabled={saving || imageUploading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {imageUploading ? "Uploading image..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingCourseId ? "Save Changes" : "Create Course"}
                  </>
                )}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ============ CONFIRM DIALOGS ============ */}
      {confirm?.kind === "delete" && confirm.course && (
        <ConfirmDialog
          tone="danger"
          title="Delete this course?"
          confirmLabel="Delete Course"
          loading={deletingId === confirm.course.id}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void deleteCourse(confirm.course as Course)}
        >
          <p>
            <strong className="text-slate-800">&ldquo;{confirm.course.name}&rdquo;</strong> will be permanently
            removed. This cannot be undone.
          </p>
          {(confirm.course.students > 0 || confirm.course.modules > 0) && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              This course has {confirm.course.students} enrolled student{confirm.course.students === 1 ? "" : "s"} and{" "}
              {confirm.course.modules} module{confirm.course.modules === 1 ? "" : "s"}. Consider deactivating it instead.
            </p>
          )}
        </ConfirmDialog>
      )}

      {confirm?.kind === "deactivate" && confirm.course && (
        <ConfirmDialog
          tone="warning"
          title="Deactivate this course?"
          confirmLabel="Deactivate"
          loading={togglingId === confirm.course.id}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void toggleCourseStatus(confirm.course as Course)}
        >
          <p>
            <strong className="text-slate-800">&ldquo;{confirm.course.name}&rdquo;</strong> will no longer be
            available for packages or new enrollment. You can activate it again at any time.
          </p>
        </ConfirmDialog>
      )}

      {confirm?.kind === "discard" && (
        <ConfirmDialog
          tone="warning"
          title="Discard your changes?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            skipGuardRef.current = true;
            closeFormModal();
          }}
        >
          <p>You have unsaved changes in this course. If you close now, they will be lost.</p>
        </ConfirmDialog>
      )}

      {/* ============ ANIMATIONS ============ */}
      <style jsx global>{`
        @keyframes skPageIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes skFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes skFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes skFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes skModalIn { from { opacity: 0; transform: translateY(14px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes skModalOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(10px) scale(0.985); } }
        @keyframes skShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes skShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }

        .sk-page-in { animation: skPageIn 0.25s ease-out both; }
        .sk-fade-up { animation: skFadeUp 0.25s ease-out both; }
        .sk-row-in { animation: skFadeUp 0.22s ease-out both; }
        .sk-overlay-in { animation: skFadeIn 0.2s ease-out both; }
        .sk-modal-in { animation: skModalIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) both; }

        [data-closing="true"].sk-overlay-in { animation: skFadeOut 0.16s ease-in both; }
        [data-closing="true"] .sk-modal-in { animation: skModalOut 0.16s ease-in both; }

        .sk-shimmer {
          background-color: #eef2f7;
          background-image: linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%);
          background-size: 800px 100%;
          background-repeat: no-repeat;
          animation: skShimmer 1.3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .sk-page-in, .sk-fade-up, .sk-row-in, .sk-overlay-in, .sk-modal-in, .sk-shimmer { animation: none !important; }
        }
      `}</style>
    </main>
  );
}

/* =====================================================================
   TABLE ROWS (course row + animated details row)
   ===================================================================== */

function CourseRows({
  course,
  index,
  expanded,
  deleting,
  toggling,
  onView,
  onEdit,
  onContent,
  onToggleStatus,
  onDelete,
  onExpand,
}: {
  course: Course;
  index: number;
  expanded: boolean;
  deleting: boolean;
  toggling: boolean;
  onView: () => void;
  onEdit: () => void;
  onContent: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onExpand: () => void;
}) {
  return (
    <>
      <tr
        className={`sk-row-in border-t border-slate-100 transition-colors duration-150 hover:bg-[#F4F8FE] ${expanded ? "bg-[#F8FAFE]" : ""}`}
        style={{ animationDelay: `${Math.min(index, 10) * 25}ms` }}
      >
        <TableCell>
          <button
            type="button"
            onClick={onView}
            aria-label={`View ${course.name}`}
            className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <CourseThumb course={course} size="md" />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-800">{course.name}</span>
              <span className="mt-1 block max-w-[260px] truncate text-xs text-slate-500">
                {course.description || "No description"}
              </span>
              <span className="mt-1 block text-[11px] text-slate-400">{course.slug}</span>
            </span>
          </button>
        </TableCell>

        <TableCell>
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-[#173B67]">#{course.id}</span>
        </TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2">
            <Clock size={15} className="text-slate-400" />
            {course.duration}
          </span>
        </TableCell>

        <TableCell>
          <ModeBadge mode={course.mode} />
        </TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2">
            <Layers size={15} className="text-slate-400" />
            {course.modules}
          </span>
        </TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2">
            <Users size={15} className="text-slate-400" />
            {course.students}
          </span>
        </TableCell>

        <TableCell>
          <StatusBadge status={course.status} />
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1.5">
            <ActionButton title="View course" onClick={onView}><Eye size={16} /></ActionButton>
            <ActionButton title="Edit course" onClick={onEdit}><Pencil size={16} /></ActionButton>

            <button
              type="button"
              title="Manage LMS content"
              onClick={onContent}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-600 transition duration-200 hover:-translate-y-px hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0"
            >
              <BookOpen size={15} />
              Content
            </button>

            <ActionButton
              title={course.status === "Active" ? "Deactivate course" : "Activate course"}
              onClick={onToggleStatus}
              disabled={toggling}
            >
              {toggling ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
            </ActionButton>

            <ActionButton title="Delete course" danger onClick={onDelete} disabled={deleting}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </ActionButton>

            <ActionButton title={expanded ? "Hide details" : "Show details"} onClick={onExpand} ariaExpanded={expanded}>
              <ChevronRight size={16} className={`transition-transform duration-300 ${expanded ? "rotate-90" : ""}`} />
            </ActionButton>
          </div>
        </TableCell>
      </tr>

      {/* Animated details row */}
      <tr aria-hidden={!expanded} className={expanded ? "border-t border-slate-100 bg-[#F8FAFE]" : ""}>
        <td colSpan={8} className="p-0">
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              {expanded && (
                <div className="sk-fade-up flex flex-col gap-5 px-6 py-5 lg:flex-row">
                  <div className="h-32 w-52 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <CourseThumb course={course} size="fill" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
                    <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
                      {course.description || "No course description available."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600">
                        Slug: <span className="font-semibold text-[#173B67]">{course.slug}</span>
                      </span>
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600">
                        {course.modules} module{course.modules === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600">
                        {course.students} enrolled student{course.students === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 lg:flex-col">
                    <button type="button" onClick={onContent} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-bold text-white transition hover:bg-orange-600">
                      <BookOpen size={15} /> Manage Content
                    </button>
                    <button type="button" onClick={onEdit} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                      <Pencil size={14} /> Edit Course
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

/* =====================================================================
   SHARED UI PIECES
   ===================================================================== */

function CourseThumb({
  course,
  size,
}: {
  course: Course;
  size: "md" | "lg" | "fill";
}) {
  const [failed, setFailed] = useState(false);
  const src = getImageUrl(course.imageUrl);

  const box =
    size === "fill"
      ? "h-full w-full"
      : size === "lg"
        ? "h-16 w-16 rounded-2xl ring-4 ring-white/20"
        : "h-12 w-12 rounded-xl";

  return (
    <div className={`${box} shrink-0 overflow-hidden bg-orange-50 text-orange-500`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={course.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen size={size === "lg" ? 26 : 20} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
      {status}
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const tone = MODE_TONES[mode.toUpperCase()] || "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
      <Monitor size={13} />
      {mode}
    </span>
  );
}

function SummaryCard({
  icon,
  value,
  title,
  description,
  loading,
  index,
  selected = false,
  onClick,
}: {
  icon: ReactNode;
  value: number;
  title: string;
  description: string;
  loading: boolean;
  index: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": selected } : {})}
      className={`sk-fade-up group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,47,95,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
        selected && onClick ? "ring-2 ring-orange-200" : ""
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400 transition-opacity ${selected && onClick ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div className="sk-shimmer mt-3 h-8 w-16 rounded" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-[#173B67]">
              <CountUp end={value} duration={900} />
            </p>
          )}

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
          {icon}
        </div>
      </div>
    </Wrapper>
  );
}

function DetailBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 transition duration-200 hover:border-blue-200 hover:bg-[#F8FAFE]">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="text-orange-400">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function inputClass(invalid: boolean) {
  return `w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:ring-4 ${
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
  }`;
}

function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>

      {children}

      {error && (
        <p id={`${id}-error`} role="alert" className="sk-fade-up mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={13} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SortableTableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey | null;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = activeSortKey === sortKey;

  return (
    <th className="px-4 py-3.5 text-left" aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
          active ? "text-orange-600" : "text-slate-400 hover:text-orange-500"
        }`}
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? <ChevronUp size={14} className="text-orange-500" /> : <ChevronDown size={14} className="text-orange-500" />
        ) : (
          <ChevronsUpDown size={13} className="text-slate-300" />
        )}
      </button>
    </th>
  );
}

function MobileFilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        aria-label={`Filter by ${label.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        <option value="All">All</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function FilterSelectCell({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <th className="min-w-[125px] px-2 py-2 align-top">
      <select
        aria-label={label}
        title={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </th>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 align-middle text-sm text-slate-600">{children}</td>;
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
  disabled = false,
  ariaExpanded,
}: {
  children: ReactNode;
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  danger?: boolean;
  disabled?: boolean;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-200 hover:-translate-y-px hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
        danger
          ? "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          : "hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
      }`}
    >
      {children}
    </button>
  );
}

/* =====================================================================
   MODAL SYSTEM
   ===================================================================== */

const ModalCloseContext = createContext<() => void>(() => undefined);

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Only the top-most popup reacts to Esc / Tab (e.g. a confirm over the form).
const overlayStack: symbol[] = [];

function ModalOverlay({
  children,
  onClose,
  label,
  size = "lg",
  guard,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Return false to stop the popup from closing (unsaved changes, saving…). */
  guard?: () => boolean;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const guardRef = useRef(guard);
  guardRef.current = guard;

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    if (guardRef.current && !guardRef.current()) return;

    closingRef.current = true;
    setClosing(true);
    window.setTimeout(() => onCloseRef.current(), 160);
  }, []);

  useEffect(() => {
    const token = Symbol("overlay");
    overlayStack.push(token);

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Respect autoFocus inside the dialog; otherwise focus the dialog itself.
    if (!dialogRef.current?.contains(document.activeElement)) {
      dialogRef.current?.focus();
    }

    const handleKey = (event: KeyboardEvent) => {
      if (overlayStack[overlayStack.length - 1] !== token) return;

      if (event.key === "Escape") {
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);

      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      const at = overlayStack.indexOf(token);
      if (at >= 0) overlayStack.splice(at, 1);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, [requestClose]);

  const width =
    size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-2xl" : size === "md" ? "max-w-xl" : "max-w-md";

  return (
    <ModalCloseContext.Provider value={requestClose}>
      <div
        data-closing={closing}
        className="sk-overlay-in fixed inset-0 z-[1000] flex items-end justify-center bg-[#0B1B33]/60 backdrop-blur-sm sm:items-center sm:p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className={`sk-modal-in flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl`}
        >
          {children}
        </div>
      </div>
    </ModalCloseContext.Provider>
  );
}

function ModalHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}) {
  const close = useContext(ModalCloseContext);

  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-[#173B67] sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition duration-200 hover:bg-orange-50 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalCloseX() {
  const close = useContext(ModalCloseContext);

  return (
    <button
      type="button"
      onClick={close}
      aria-label="Close"
      className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition duration-200 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:right-5 sm:top-5"
    >
      <X size={18} />
    </button>
  );
}

function ModalCloseButton({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  const close = useContext(ModalCloseContext);

  return (
    <button
      type="button"
      onClick={close}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ConfirmDialog({
  tone,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: {
  tone: "danger" | "warning";
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const danger = tone === "danger";

  return (
    <ModalOverlay onClose={onCancel} guard={() => !loading} label={title} size="sm">
      <div className="p-6">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
            danger ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
          }`}
        >
          {danger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
        </div>

        <h3 className="mt-4 text-center text-lg font-bold text-[#173B67]">{title}</h3>
        <div className="mt-2 text-center text-sm leading-6 text-slate-500">{children}</div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
        <ModalCloseButton disabled={loading}>{cancelLabel}</ModalCloseButton>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          autoFocus
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            danger
              ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300"
              : "bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-300"
          }`}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Working..." : confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // 1 … (p-1) p (p+1) … N
  const pages: Array<number | "gap-left" | "gap-right"> = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (i < page && pages[pages.length - 1] !== "gap-left") pages.push("gap-left");
    else if (i > page && pages[pages.length - 1] !== "gap-right") pages.push("gap-right");
  }

  const base =
    "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300";

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${base} border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((item, index) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${
              item === page
                ? "bg-[#173B67] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            {item}
          </button>
        ) : (
          <span key={`${item}-${index}`} className="px-1 text-slate-400">…</span>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={`${base} border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
        copied ? "text-emerald-500" : "text-slate-400 hover:bg-slate-100 hover:text-orange-500"
      } ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

