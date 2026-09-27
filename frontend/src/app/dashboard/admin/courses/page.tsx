"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Eye,
  Clock,
  Monitor,
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
  X,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Power,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type CourseStatus = "Active" | "Inactive";

type CourseMode =
  | "ONLINE"
  | "OFFLINE"
  | "HYBRID";

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
};

type SummaryCardProps = {
  icon: React.ReactNode;
  value: number;
  title: string;
  description: string;
};

type CourseForm = {
  title: string;
  description: string;
  duration: string;
  mode: CourseMode;
  isActive: boolean;
};

const EMPTY_FORM: CourseForm = {
  title: "",
  description: "",
  duration: "",
  mode: "ONLINE",
  isActive: true,
};

export default function CoursesPage() {
  const router = useRouter();

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | CourseStatus>("All");

  const [selectedCourse, setSelectedCourse] =
    useState<Course | null>(null);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [editingCourseId, setEditingCourseId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<CourseForm>(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [expandedCourseId, setExpandedCourseId] =
    useState<number | null>(null);

  /*
   * ============================================================
   * LOAD COURSES
   * ============================================================
   */

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
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
        `${API_URL}/admin/courses`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem(
            "skce_admin_logged_in"
          );

          router.push("/admin/login");
          return;
        }

        throw new Error(
          result?.message ||
            "Unable to retrieve courses"
        );
      }

      const backendCourses: BackendCourse[] =
        result?.data || [];

      const mappedCourses: Course[] =
        backendCourses.map((course) => ({
          id: course.id,
          slug: course.slug,
          name: course.title,
          description:
            course.description || "",
          duration:
            course.duration ||
            "Not specified",
          mode:
            course.mode ||
            "Not specified",
          modules:
            Number(course.modules) || 0,
          students:
            Number(course.students) || 0,
          status: course.isActive
            ? "Active"
            : "Inactive",
        }));

      setCourses(mappedCourses);
    } catch (err) {
      console.error(
        "Load courses error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve courses"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * FILTER
   * ============================================================
   */

  const filteredCourses = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !text ||
        course.name
          .toLowerCase()
          .includes(text) ||
        course.slug
          .toLowerCase()
          .includes(text) ||
        String(course.id).includes(text) ||
        course.mode
          .toLowerCase()
          .includes(text);

      const matchesStatus =
        statusFilter === "All" ||
        course.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    courses,
    search,
    statusFilter,
  ]);

  /*
   * ============================================================
   * SUMMARY
   * ============================================================
   */

  const activeCourses =
    courses.filter(
      (course) =>
        course.status === "Active"
    ).length;

  const inactiveCourses =
    courses.filter(
      (course) =>
        course.status === "Inactive"
    ).length;

  const totalStudents =
    courses.reduce(
      (total, course) =>
        total + course.students,
      0
    );

  /*
   * ============================================================
   * VIEW
   * ============================================================
   */

  function openViewModal(
    course: Course
  ) {
    setSelectedCourse(course);
    setShowViewModal(true);
  }

  function closeViewModal() {
    setSelectedCourse(null);
    setShowViewModal(false);
  }

  /*
   * ============================================================
   * CONTENT
   * ============================================================
   */

  function openContent(
    courseId: number
  ) {
    router.push(
      `/dashboard/admin/course-content/${courseId}`
    );
  }

  /*
   * ============================================================
   * ADD COURSE
   * ============================================================
   */

  function openAddModal() {
    setError("");
    setEditingCourseId(null);
    setForm(EMPTY_FORM);
    setShowFormModal(true);
  }

  /*
   * ============================================================
   * EDIT COURSE
   * ============================================================
   */

  function openEditModal(
    course: Course
  ) {
    setError("");

    setEditingCourseId(course.id);

    setForm({
      title: course.name,
      description:
        course.description || "",
      duration:
        course.duration ===
        "Not specified"
          ? ""
          : course.duration,
      mode:
        course.mode === "ONLINE" ||
        course.mode === "OFFLINE" ||
        course.mode === "HYBRID"
          ? course.mode
          : "ONLINE",
      isActive:
        course.status === "Active",
    });

    setShowFormModal(true);
  }

  function closeFormModal() {
    if (saving) return;

    setShowFormModal(false);
    setEditingCourseId(null);
    setForm(EMPTY_FORM);
  }

  /*
   * ============================================================
   * SAVE COURSE
   * ============================================================
   */

  async function saveCourse() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const title =
      form.title.trim();

    if (!title) {
      setError(
        "Course title is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing =
        editingCourseId !== null;

      const url = isEditing
        ? `${API_URL}/admin/courses/${editingCourseId}`
        : `${API_URL}/admin/courses`;

      const method = isEditing
        ? "PATCH"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description:
              form.description.trim() ||
              null,
            duration:
              form.duration.trim() ||
              null,
            mode: form.mode,
            isActive:
              form.isActive,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "skce_admin_logged_in"
          );

          router.push("/admin/login");
          return;
        }

        throw new Error(
          result?.message ||
            "Unable to save course."
        );
      }

      await loadCourses();

      closeFormModal();
    } catch (err) {
      console.error(
        "Save course error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save course."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * DELETE COURSE
   * ============================================================
   */

  async function handleDeleteCourse(
    course: Course
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${course.name}"?`
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
      setDeletingId(course.id);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/courses/${course.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "skce_admin_logged_in"
          );

          router.push("/admin/login");
          return;
        }

        throw new Error(
          result?.message ||
            "Unable to delete course."
        );
      }

      await loadCourses();
    } catch (err) {
      console.error(
        "Delete course error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete course."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * ============================================================
   * ACTIVATE / DEACTIVATE
   * ============================================================
   */

  async function toggleCourseStatus(
    course: Course
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/admin/courses/${course.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive:
              course.status !== "Active",
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "skce_admin_logged_in"
          );

          router.push("/admin/login");
          return;
        }

        throw new Error(
          result?.message ||
            "Unable to update course status."
        );
      }

      await loadCourses();
    } catch (err) {
      console.error(
        "Toggle course status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update course status."
      );
    }
  }

  /*
   * ============================================================
   * EXPAND DETAILS
   * ============================================================
   */

  function toggleCourseDetails(
    courseId: number
  ) {
    setExpandedCourseId(
      (current) =>
        current === courseId
          ? null
          : courseId
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Course Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Courses
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage SKCE courses, content and
              student enrollment.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Add New Course
          </button>
        </div>

        {/* =====================================================
            SUMMARY
            ===================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={
              <BookOpen size={21} />
            }
            value={courses.length}
            title="Total Courses"
            description="Courses in database"
          />

          <SummaryCard
            icon={
              <CheckCircle2 size={21} />
            }
            value={activeCourses}
            title="Active Courses"
            description="Currently available"
          />

          <SummaryCard
            icon={
              <XCircle size={21} />
            }
            value={inactiveCourses}
            title="Inactive Courses"
            description="Currently disabled"
          />

          <SummaryCard
            icon={
              <Users size={21} />
            }
            value={totalStudents}
            title="Total Enrollments"
            description="Enrollment count"
          />
        </div>

        {/* =====================================================
            ERROR
            ===================================================== */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div>
              <p className="text-sm font-semibold text-red-700">
                Course operation failed
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* =====================================================
            COURSE TABLE
            ===================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-xl">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by course name, ID, slug or mode..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "All"
                    | CourseStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <BookOpen
                  size={26}
                  className="animate-pulse text-orange-500"
                />
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Loading courses...
              </p>
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            filteredCourses.length ===
              0 && (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                  <BookOpen
                    size={28}
                    className="text-orange-500"
                  />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
                  No courses found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try changing your search or
                  status filter.
                </p>
              </div>
            )}

          {/* TABLE */}
          {!loading &&
            filteredCourses.length >
              0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">

                  <thead>
                    <tr className="bg-slate-50">
                      <TableHeader>
                        Course
                      </TableHeader>

                      <TableHeader>
                        Course ID
                      </TableHeader>

                      <TableHeader>
                        Duration
                      </TableHeader>

                      <TableHeader>
                        Mode
                      </TableHeader>

                      <TableHeader>
                        Modules
                      </TableHeader>

                      <TableHeader>
                        Students
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>

                      <TableHeader>
                        Actions
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCourses.map(
                      (course) => (
                        <tr
                          key={course.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/60"
                        >
                          {/* COURSE */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                <BookOpen
                                  size={20}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {course.name}
                                </p>

                                <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                                  {course.description ||
                                    "No description"}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  {course.slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* ID */}
                          <TableCell>
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-[#173B67]">
                              #{course.id}
                            </span>
                          </TableCell>

                          {/* DURATION */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock
                                size={15}
                                className="text-slate-400"
                              />

                              <span>
                                {course.duration}
                              </span>
                            </div>
                          </TableCell>

                          {/* MODE */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Monitor
                                size={15}
                                className="text-slate-400"
                              />

                              <span>
                                {course.mode}
                              </span>
                            </div>
                          </TableCell>

                          {/* MODULES */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GraduationCap
                                size={15}
                                className="text-slate-400"
                              />

                              <span>
                                {course.modules}
                              </span>
                            </div>
                          </TableCell>

                          {/* STUDENTS */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users
                                size={15}
                                className="text-slate-400"
                              />

                              <span>
                                {course.students}
                              </span>
                            </div>
                          </TableCell>

                          {/* STATUS */}
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                course.status ===
                                "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {course.status}
                            </span>
                          </TableCell>

                          {/* ACTIONS */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">

                              {/* VIEW */}
                              <ActionButton
                                title="View course"
                                onClick={() =>
                                  openViewModal(
                                    course
                                  )
                                }
                              >
                                <Eye
                                  size={16}
                                />
                              </ActionButton>

                              {/* EDIT */}
                              <ActionButton
                                title="Edit course"
                                onClick={() =>
                                  openEditModal(
                                    course
                                  )
                                }
                              >
                                <Pencil
                                  size={16}
                                />
                              </ActionButton>

                              {/* CONTENT */}
                              <button
                                type="button"
                                title="Manage LMS content"
                                onClick={() =>
                                  openContent(
                                    course.id
                                  )
                                }
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-600 transition hover:bg-orange-100"
                              >
                                <BookOpen
                                  size={15}
                                />
                                Content
                              </button>

                              {/* STATUS */}
                              <ActionButton
                                title={
                                  course.status ===
                                  "Active"
                                    ? "Deactivate course"
                                    : "Activate course"
                                }
                                onClick={() =>
                                  toggleCourseStatus(
                                    course
                                  )
                                }
                              >
                                <Power
                                  size={16}
                                />
                              </ActionButton>

                              {/* DELETE */}
                              <ActionButton
                                title="Delete course"
                                onClick={() =>
                                  handleDeleteCourse(
                                    course
                                  )
                                }
                              >
                                {deletingId ===
                                course.id ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={16}
                                  />
                                )}
                              </ActionButton>

                              {/* EXPAND */}
                              <ActionButton
                                title="Course details"
                                onClick={() =>
                                  toggleCourseDetails(
                                    course.id
                                  )
                                }
                              >
                                <ChevronRight
                                  size={16}
                                  className={
                                    expandedCourseId ===
                                    course.id
                                      ? "rotate-90 transition"
                                      : "transition"
                                  }
                                />
                              </ActionButton>
                            </div>
                          </TableCell>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        {/* INFO */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-800">
            LMS Content Management
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700/80">
            Select <strong>Content</strong> for
            any course to manage its modules and
            lessons. Module counts are calculated
            from the course content stored in the
            SKCE PostgreSQL database.
          </p>
        </div>
      </div>

      {/* ========================================================
          VIEW MODAL
          ======================================================== */}

      {showViewModal &&
        selectedCourse && (
          <ModalOverlay
            onClose={closeViewModal}
          >
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-[#173B67]">
                    Course Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Complete course information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeViewModal}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">

                {/* TITLE */}
                <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <BookOpen
                      size={25}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#173B67]">
                      {selectedCourse.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Database Course ID:{" "}
                      {selectedCourse.id}
                    </p>
                  </div>

                  <span
                    className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedCourse.status ===
                      "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {
                      selectedCourse.status
                    }
                  </span>
                </div>

                {/* DESCRIPTION */}
                <div className="mb-6">
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedCourse.description ||
                      "No course description available."}
                  </p>
                </div>

                {/* DETAILS */}
                <div className="grid gap-3 sm:grid-cols-4">
                  <DetailBox
                    icon={
                      <Clock size={17} />
                    }
                    label="Duration"
                    value={
                      selectedCourse.duration
                    }
                  />

                  <DetailBox
                    icon={
                      <Monitor size={17} />
                    }
                    label="Mode"
                    value={
                      selectedCourse.mode
                    }
                  />

                  <DetailBox
                    icon={
                      <GraduationCap
                        size={17}
                      />
                    }
                    label="Modules"
                    value={String(
                      selectedCourse.modules
                    )}
                  />

                  <DetailBox
                    icon={
                      <Users size={17} />
                    }
                    label="Students"
                    value={String(
                      selectedCourse.students
                    )}
                  />
                </div>

                {/* LMS CONTENT */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <GraduationCap
                      size={18}
                      className="text-orange-500"
                    />

                    <p className="text-sm font-semibold text-slate-700">
                      LMS Content
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                      This course currently has{" "}
                      <strong>
                        {
                          selectedCourse.modules
                        }
                      </strong>{" "}
                      module
                      {selectedCourse.modules ===
                      1
                        ? ""
                        : "s"}
                      .
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        closeViewModal();

                        openContent(
                          selectedCourse.id
                        );
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                    >
                      <BookOpen
                        size={16}
                      />
                      Manage LMS Content
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    closeViewModal();

                    openEditModal(
                      selectedCourse
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                >
                  <Pencil
                    size={16}
                  />
                  Edit Course
                </button>

                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

      {/* ========================================================
          ADD / EDIT COURSE MODAL
          ======================================================== */}

      {showFormModal && (
        <ModalOverlay
          onClose={closeFormModal}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#173B67]">
                  {editingCourseId
                    ? "Edit Course"
                    : "Add New Course"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingCourseId
                    ? "Update the course information."
                    : "Create a new course for SKCE."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="max-h-[75vh] overflow-y-auto p-6">

              {/* COURSE NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Course Name
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title:
                        e.target.value,
                    })
                  }
                  placeholder="Example: Advanced Python"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe what students will learn..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* DURATION + MODE */}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Duration
                  </label>

                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration:
                          e.target.value,
                      })
                    }
                    placeholder="Example: 3 Months"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mode
                  </label>

                  <select
                    value={form.mode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mode:
                          e.target.value as CourseMode,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="ONLINE">
                      Online
                    </option>

                    <option value="OFFLINE">
                      Offline
                    </option>

                    <option value="HYBRID">
                      Hybrid
                    </option>
                  </select>
                </div>
              </div>

              {/* STATUS */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Course Status
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isActive:
                          e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Active Course
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Active courses are available
                      for packages and student
                      enrollment.
                    </p>
                  </div>
                </label>
              </div>

              {/* INFORMATION */}
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800">
                  Course Content
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700/80">
                  After creating the course, use
                  the <strong>Content</strong>{" "}
                  button to add modules and lessons.
                  Module counts are maintained from
                  the LMS content.
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCourse}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={16}
                    />
                    {editingCourseId
                      ? "Save Changes"
                      : "Create Course"}
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  icon,
  value,
  title,
  description,
}: SummaryCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#173B67]">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL BOX
   ============================================================ */

function DetailBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   TABLE HEADER
   ============================================================ */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================
   TABLE CELL
   ============================================================ */

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

/* ============================================================
   ACTION BUTTON
   ============================================================ */

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
    >
      {children}
    </button>
  );
}

/* ============================================================
   MODAL OVERLAY
   ============================================================ */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}