"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ClipboardList,
  Eye,
  GraduationCap,
  Inbox,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
  XCircle,
} from "lucide-react";

type StudentStatus = "Active" | "Inactive";

type Student = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  courses: string[];
  packages: string[];
  joinedDate: string;
  status: StudentStatus;
  state: string;
  referralId: string;
};

type StudentApiRow = {
  id?: string;
  studentId?: string;
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  courses?: unknown;
  packages?: unknown;
  createdAt?: string;
  isActive?: boolean;
  state?: string;
  referralId?: string;
};

type ColumnFilters = {
  student: string;
  studentId: string;
  phone: string;
  package: string;
  joined: string;
  status: "All" | StudentStatus;
};

type SortKey =
  | "student"
  | "studentId"
  | "phone"
  | "package"
  | "joined"
  | "status";

type SortDirection = "asc" | "desc";

type PackageDetails = {
  title: string;
  courses: string[];
};

type StudentDetails = Student & {
  enrollments: any[];
  payments: any[];
};

type ProgressData = {
  summary?: {
    averageProgress?: number;
    totalCourses?: number;
    completedCourses?: number;
    totalLessons?: number;
    completedLessons?: number;
    totalCertificates?: number;
  };

  /**
   * The admin progress API returns course-wise progress under `courseProgress`.
   * `courses` is kept as a backward-compatible fallback.
   */
  courseProgress?: any[];

  courses?: any[];

  assessments?: any[];

  certificates?: any[];
};

type StudentTab =
  | "overview"
  | "progress"
  | "assessments"
  | "enrollments"
  | "payments";

function formatDate(value: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN");
}

function formatDateTime(value: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN");
}

function mapStudent(student: StudentApiRow): Student {
  return {
    id: student.studentId || student.id || "",
    userId: student.id || "",
    name: student.name || "Unnamed Student",
    email: student.email || "",
    phone: student.phone || "",
    dob: student.dob || "",
    courses: Array.isArray(student.courses)
      ? student.courses.filter(
          (item): item is string => typeof item === "string"
        )
      : [],
    packages: Array.isArray(student.packages)
      ? student.packages.filter(
          (item): item is string => typeof item === "string"
        )
      : [],
    joinedDate: formatDate(student.createdAt || ""),
    status: student.isActive ? "Active" : "Inactive",
    state: student.state || "",
    referralId: student.referralId || "",
  };
}

const EMPTY_FILTERS: ColumnFilters = {
  student: "",
  studentId: "",
  phone: "",
  package: "",
  joined: "",
  status: "All",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] =
    useState<ColumnFilters>(EMPTY_FILTERS);

  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedPackage, setSelectedPackage] =
    useState<PackageDetails | null>(null);
  const [isPackageLoading, setIsPackageLoading] = useState(false);
  const [packageError, setPackageError] = useState("");

  const [activeStudentTab, setActiveStudentTab] =
    useState<StudentTab>("overview");
  const [studentDetails, setStudentDetails] =
    useState<StudentDetails | null>(null);
  const [progressData, setProgressData] =
    useState<ProgressData | null>(null);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState("");

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const logoutAdmin = () => {
    if (typeof window === "undefined") return;
    [
      "token",
      "skce_admin_logged_in",
      "user",
      "role",
      "student",
      "studentId",
    ].forEach((key) => localStorage.removeItem(key));
    window.location.href = "/admin/login";
  };

  const getApiUrl = () =>
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const loadStudents = async (refresh = false) => {
    const token = getToken();

    if (!token) {
      logoutAdmin();
      return;
    }

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    setLoadError("");

    try {
      const response = await fetch(`${getApiUrl()}/students`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        logoutAdmin();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load students (${response.status})`);
      }

      const result = await response.json();
      const rows: StudentApiRow[] = Array.isArray(result?.data)
        ? result.data
        : [];

      setStudents(rows.map(mapStudent));
    } catch (error) {
      console.error("Failed to load students:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load registered students from the database."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const loadStudentDetails = async (student: Student) => {
    const token = getToken();

    if (!token) {
      logoutAdmin();
      return;
    }

    setIsStudentLoading(true);
    setStudentLoadError("");
    setStudentDetails(null);
    setProgressData(null);

    try {
      const encodedStudentId = encodeURIComponent(student.id);
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [detailsResponse, progressResponse] = await Promise.all([
        fetch(`${getApiUrl()}/students/${encodedStudentId}`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
        fetch(`${getApiUrl()}/students/${encodedStudentId}/progress`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
      ]);

      if (
        detailsResponse.status === 401 ||
        detailsResponse.status === 403 ||
        progressResponse.status === 401 ||
        progressResponse.status === 403
      ) {
        logoutAdmin();
        return;
      }

      const detailsResult = await detailsResponse.json();
      const progressResult = await progressResponse.json();

      if (!detailsResponse.ok) {
        throw new Error(
          detailsResult?.message ||
            `Failed to load student details (${detailsResponse.status})`
        );
      }

      if (!progressResponse.ok) {
        throw new Error(
          progressResult?.message ||
            `Failed to load student progress (${progressResponse.status})`
        );
      }

      const details = detailsResult?.data || {};
      const mapped = mapStudent({
        id: details.id || student.userId,
        studentId: details.studentId || student.id,
        name: details.name || student.name,
        email: details.email || student.email,
        phone: details.phone || student.phone,
        dob: details.dob || student.dob,
        createdAt: details.createdAt,
        isActive:
          typeof details.isActive === "boolean"
            ? details.isActive
            : student.status === "Active",
        state: details.state || student.state,
        referralId: details.referralId || student.referralId,
        courses: student.courses,
        packages: student.packages,
      });

      setStudentDetails({
        ...mapped,
        enrollments: Array.isArray(details.enrollments)
          ? details.enrollments
          : [],
        payments: Array.isArray(details.payments)
          ? details.payments
          : [],
      });

      setProgressData(progressResult?.data || null);
    } catch (error) {
      console.error("Failed to load student details:", error);
      setStudentLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load student details."
      );
    } finally {
      setIsStudentLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const matches = (value: string, filterValue: string) =>
      !filterValue ||
      value.toLowerCase().includes(filterValue.toLowerCase());

    const filtered = students.filter((student) => {
      const matchesSearch =
        !searchText ||
        student.name.toLowerCase().includes(searchText) ||
        student.email.toLowerCase().includes(searchText) ||
        student.id.toLowerCase().includes(searchText) ||
        student.phone.toLowerCase().includes(searchText) ||
        student.courses.some((course) =>
          course.toLowerCase().includes(searchText)
        ) ||
        student.packages.some((pkg) =>
          pkg.toLowerCase().includes(searchText)
        );

      return (
        matchesSearch &&
        matches(student.name, columnFilters.student) &&
        matches(student.id, columnFilters.studentId) &&
        matches(student.phone, columnFilters.phone) &&
        matches(student.packages.join(" "), columnFilters.package) &&
        matches(student.joinedDate, columnFilters.joined) &&
        (columnFilters.status === "All" ||
          student.status === columnFilters.status)
      );
    });

    return [...filtered].sort((a, b) => {
      let left = "";
      let right = "";

      switch (sortKey) {
        case "student":
          left = a.name;
          right = b.name;
          break;
        case "studentId":
          left = a.id;
          right = b.id;
          break;
        case "phone":
          left = a.phone;
          right = b.phone;
          break;
        case "package":
          left = a.packages.join(", ");
          right = b.packages.join(", ");
          break;
        case "joined":
          left = a.joinedDate;
          right = b.joinedDate;
          break;
        case "status":
          left = a.status;
          right = b.status;
          break;
      }

      if (sortKey === "joined") {
        const leftTime = new Date(left).getTime();
        const rightTime = new Date(right).getTime();

        if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
          return sortDirection === "asc"
            ? leftTime - rightTime
            : rightTime - leftTime;
        }
      }

      const comparison = left.toLowerCase().localeCompare(
        right.toLowerCase(),
        undefined,
        { numeric: true, sensitivity: "base" }
      );

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [students, search, columnFilters, sortKey, sortDirection]);

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  const inactiveCount = students.filter(
    (student) => student.status === "Inactive"
  ).length;

  const openViewModal = (student: Student) => {
    setSelectedStudent(student);
    setActiveStudentTab("overview");
    setShowViewModal(true);
    void loadStudentDetails(student);
  };

  const closeViewModal = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
    setProgressData(null);
    setStudentLoadError("");
    setShowViewModal(false);
  };

  const closePackageModal = () => {
    setSelectedPackage(null);
    setPackageError("");
  };

  const openPackageCourses = async (
    student: Student,
    packageTitle: string
  ) => {
    const token = getToken();

    if (!token) {
      logoutAdmin();
      return;
    }

    setSelectedPackage({ title: packageTitle, courses: [] });
    setPackageError("");
    setIsPackageLoading(true);

    try {
      const response = await fetch(
        `${getApiUrl()}/students/${encodeURIComponent(student.id)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401 || response.status === 403) {
        logoutAdmin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to load package details (${response.status})`
        );
      }

      const result = await response.json();
      const details = result?.data;
      const courses = new Set<string>();

      if (Array.isArray(details?.enrollments)) {
        for (const enrollment of details.enrollments) {
          const pkg = enrollment?.package;

          if (
            pkg &&
            typeof pkg.title === "string" &&
            pkg.title === packageTitle &&
            Array.isArray(pkg.courses)
          ) {
            for (const item of pkg.courses) {
              const title = item?.course?.title;
              if (typeof title === "string" && title.trim()) {
                courses.add(title.trim());
              }
            }
          }
        }
      }

      setSelectedPackage({
        title: packageTitle,
        courses: Array.from(courses),
      });
    } catch (error) {
      console.error("Failed to load package courses:", error);
      setPackageError(
        error instanceof Error
          ? error.message
          : "Unable to load the courses in this package."
      );
    } finally {
      setIsPackageLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const updateColumnFilter = <K extends keyof ColumnFilters>(
    field: K,
    value: ColumnFilters[K]
  ) => {
    setColumnFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearAllFilters = () => {
    setSearch("");
    setColumnFilters({
      student: "",
      studentId: "",
      phone: "",
      package: "",
      joined: "",
      status: "All",
    });
    setSortKey("joined");
    setSortDirection("desc");
  };

  const details = studentDetails || selectedStudent;
  const summary = progressData?.summary || {};

  // The backend returns the real course-wise progress under `courseProgress`.
  // Keep `courses` as a fallback so the UI also works with older response shapes.
  const courses = Array.isArray(progressData?.courseProgress)
    ? progressData.courseProgress
    : Array.isArray(progressData?.courses)
      ? progressData.courses
      : [];

  // Assessments may be returned either at the top level or alongside a course.
  const assessments = Array.isArray(progressData?.assessments)
    ? progressData.assessments
    : courses.flatMap((course: any) => {
        if (Array.isArray(course?.assessments)) {
          return course.assessments.map((assessment: any) => ({
            ...assessment,
            courseId: course.courseId,
            courseTitle:
              course.courseTitle ||
              course.title ||
              course.course?.title ||
              "—",
          }));
        }

        if (course?.assessment) {
          return [
            {
              ...course.assessment,
              courseId: course.courseId,
              courseTitle:
                course.courseTitle ||
                course.title ||
                course.course?.title ||
                "—",
              submission:
                course.assessment.latestSubmission ||
                course.latestSubmission ||
                course.submission ||
                null,
            },
          ];
        }

        return [];
      });

  const certificates = Array.isArray(progressData?.certificates)
    ? progressData.certificates
    : [];

  const enrollments = studentDetails?.enrollments || [];

  const payments = studentDetails?.payments || [];

  const statusOptions: Array<"All" | StudentStatus> = [
    "All",
    "Active",
    "Inactive",
  ];

  return (
    <main className="sk-page-in min-h-screen bg-[#F7F9FC] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1550px]">
        {/* ============ PAGE HEADER ============ */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Student Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Students
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Registered students from the SK Computer Education database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadStudents(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#173B67] shadow-sm transition duration-200 hover:-translate-y-px hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <RefreshCw
              size={17}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Students"}
          </button>
        </div>

        {/* ============ SUMMARY CARDS ============ */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Students"
            value={students.length}
            icon={Users}
            description="Registered in database"
            tone="blue"
            loading={isLoading}
            index={0}
          />
          <SummaryCard
            title="Active Students"
            value={activeCount}
            icon={UserCheck}
            description="Currently active"
            tone="green"
            loading={isLoading}
            index={1}
          />
          <SummaryCard
            title="Inactive Students"
            value={inactiveCount}
            icon={UserX}
            description="Currently inactive"
            tone="orange"
            loading={isLoading}
            index={2}
          />
        </div>

        {/* ============ LOAD ERROR ============ */}
        {loadError && (
          <div
            role="alert"
            className="sk-fade-up mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start"
          >
            <div className="flex flex-1 items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Unable to load registered students
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  {loadError}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadStudents(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ============ STUDENTS TABLE ============ */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all student details..."
                aria-label="Search students"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Status segmented control (mirrors the Status column filter) */}
              <div
                role="group"
                aria-label="Filter by status"
                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
              >
                {statusOptions.map((option) => {
                  const selected = columnFilters.status === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateColumnFilter("status", option)}
                      className={`h-9 flex-1 rounded-lg px-4 text-xs font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:flex-none ${
                        selected
                          ? "bg-white text-[#173B67] shadow-sm"
                          : "text-slate-500 hover:text-[#173B67]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition duration-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Result count */}
          {!isLoading && students.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
              <span>
                Showing{" "}
                <span className="font-semibold text-[#173B67]">
                  {filteredStudents.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#173B67]">
                  {students.length}
                </span>{" "}
                students
              </span>
            </div>
          )}

          {isLoading ? (
            <div aria-busy="true" aria-live="polite">
              <span className="sr-only">Loading registered students...</span>
              <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-4 md:block">
                <div className="sk-shimmer h-3 w-1/3 rounded" />
              </div>
              <div className="divide-y divide-slate-100">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-4 px-4 py-5 sm:px-5"
                  >
                    <div className="sk-shimmer h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="sk-shimmer h-3.5 w-1/3 rounded" />
                      <div className="sk-shimmer h-3 w-1/2 rounded" />
                    </div>
                    <div className="sk-shimmer hidden h-3.5 w-24 rounded md:block" />
                    <div className="sk-shimmer hidden h-3.5 w-28 rounded lg:block" />
                    <div className="sk-shimmer hidden h-8 w-40 rounded-xl lg:block" />
                    <div className="sk-shimmer h-6 w-16 rounded-md" />
                    <div className="sk-shimmer h-9 w-9 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="sk-fade-up px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 ring-8 ring-orange-50/60">
                {students.length === 0 ? (
                  <Users size={28} className="text-orange-500" />
                ) : (
                  <Search size={28} className="text-orange-500" />
                )}
              </div>

              <h3 className="mt-6 text-lg font-semibold text-[#173B67]">
                {students.length === 0
                  ? "No registered students found"
                  : "No students match your search"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {students.length === 0
                  ? "Students will appear here automatically after they register through the SK Computer Education registration process."
                  : "Try changing your search text or status filter."}
              </p>

              {students.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ---------- DESKTOP / TABLET TABLE ---------- */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1120px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <SortableTableHeader
                        label="Student"
                        sortKey="student"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHeader
                        label="Student ID"
                        sortKey="studentId"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHeader
                        label="Phone"
                        sortKey="phone"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHeader
                        label="Packages"
                        sortKey="package"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHeader
                        label="Joined"
                        sortKey="joined"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHeader
                        label="Status"
                        sortKey="status"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHeader>Action</TableHeader>
                    </tr>

                    <tr className="border-t border-slate-100 bg-white">
                      <TableFilterCell
                        value={columnFilters.student}
                        onChange={(value) =>
                          updateColumnFilter("student", value)
                        }
                        placeholder="Filter student..."
                      />
                      <TableFilterCell
                        value={columnFilters.studentId}
                        onChange={(value) =>
                          updateColumnFilter("studentId", value)
                        }
                        placeholder="Filter ID..."
                      />
                      <TableFilterCell
                        value={columnFilters.phone}
                        onChange={(value) =>
                          updateColumnFilter("phone", value)
                        }
                        placeholder="Filter phone..."
                      />
                      <TableFilterCell
                        value={columnFilters.package}
                        onChange={(value) =>
                          updateColumnFilter("package", value)
                        }
                        placeholder="Filter package..."
                      />
                      <TableFilterCell
                        value={columnFilters.joined}
                        onChange={(value) =>
                          updateColumnFilter("joined", value)
                        }
                        placeholder="Filter date..."
                      />
                      <TableFilterStatusCell
                        value={columnFilters.status}
                        onChange={(value) =>
                          updateColumnFilter("status", value)
                        }
                      />
                      <TableFilterCell
                        disabled
                        value=""
                        onChange={() => undefined}
                        placeholder="—"
                      />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr
                        key={student.userId || student.id}
                        className="sk-row-in border-t border-slate-100 transition-colors duration-150 hover:bg-[#F4F8FE]"
                        style={{
                          animationDelay: `${Math.min(index, 10) * 25}ms`,
                        }}
                      >
                        <TableCell>
                          <div className="flex min-w-[230px] items-center gap-3">
                            <Avatar name={student.name} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">
                                {student.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {student.email || "Email not provided"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-[#173B67]">
                            {student.id || "Not assigned"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="whitespace-nowrap">
                            {student.phone || "Not provided"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="w-[280px]">
                            <PackageButtons
                              student={student}
                              onOpen={openPackageCourses}
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="whitespace-nowrap">
                            {student.joinedDate}
                          </span>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={student.status} />
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            title="View student details"
                            aria-label={`View details for ${student.name}`}
                            onClick={() => openViewModal(student)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-200 hover:-translate-y-px hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0"
                          >
                            <Eye size={16} />
                          </button>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---------- MOBILE CARD LIST ---------- */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {filteredStudents.map((student, index) => (
                  <li
                    key={student.userId || student.id}
                    className="sk-row-in p-4"
                    style={{
                      animationDelay: `${Math.min(index, 8) * 30}ms`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={student.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {student.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {student.email || "Email not provided"}
                            </p>
                          </div>
                          <StatusBadge status={student.status} />
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <dt className="text-slate-400">Student ID</dt>
                            <dd className="mt-0.5 font-semibold text-[#173B67]">
                              {student.id || "Not assigned"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-400">Joined</dt>
                            <dd className="mt-0.5 font-medium text-slate-700">
                              {student.joinedDate}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-slate-400">Phone</dt>
                            <dd className="mt-0.5 font-medium text-slate-700">
                              {student.phone || "Not provided"}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-3">
                          <PackageButtons
                            student={student}
                            onOpen={openPackageCourses}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => openViewModal(student)}
                          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#173B67] transition duration-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:scale-[0.99]"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ============ INFO NOTE ============ */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-blue-600"
          />
          <div>
            <p className="text-xs font-semibold text-blue-800">
              Registered Students Only
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-700/80">
              This page is read-only for student registration. Student
              records shown here come directly from the SK Computer
              Education database. Students are created through the normal
              registration process, not manually from the Admin portal.
            </p>
          </div>
        </div>
      </div>

      {/* ============ PACKAGE COURSES MODAL ============ */}
      {selectedPackage && (
        <ModalOverlay onClose={closePackageModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedPackage.title}
            className="sk-modal-in flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <ModalHeader
              title={selectedPackage.title}
              subtitle="Courses included in this registered package."
              onClose={closePackageModal}
            />

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {isPackageLoading ? (
                <div className="py-10 text-center" aria-busy="true">
                  <RefreshCw
                    size={26}
                    className="mx-auto animate-spin text-orange-500"
                  />
                  <p className="mt-4 text-sm font-semibold text-[#173B67]">
                    Loading package courses...
                  </p>
                </div>
              ) : packageError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load package courses
                  </p>
                  <p className="mt-1 text-xs leading-5 text-red-700">
                    {packageError}
                  </p>
                </div>
              ) : selectedPackage.courses.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Package size={24} className="text-blue-600" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#173B67]">
                    No courses found
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Included Courses
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedPackage.courses.map((course) => (
                      <div
                        key={course}
                        className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/70 px-4 py-3 transition duration-200 hover:border-orange-200 hover:bg-orange-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                          <GraduationCap
                            size={15}
                            className="text-orange-500"
                          />
                        </div>
                        <span className="text-sm font-semibold text-[#173B67]">
                          {course}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
              <CloseButton onClick={closePackageModal} />
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ============ STUDENT DETAILS MODAL ============ */}
      {showViewModal && selectedStudent && (
        <ModalOverlay onClose={closeViewModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Student Details"
            className="sk-modal-in flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <ModalHeader
              title="Student Details"
              subtitle="Student profile, progress, enrollments and payments."
              onClose={closeViewModal}
            />

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xl font-bold text-white ring-4 ring-white">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-[#173B67]">
                    {selectedStudent.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {selectedStudent.id || "Student ID not assigned"}
                  </p>
                </div>
                <StatusBadge status={selectedStudent.status} />
              </div>

              <div
                role="tablist"
                aria-label="Student detail sections"
                className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-slate-100 px-1"
              >
                {(
                  [
                    ["overview", "Overview", Users],
                    ["progress", "Progress", BarChart3],
                    ["assessments", "Assessments", ClipboardList],
                    ["enrollments", "Enrollments", GraduationCap],
                    ["payments", "Payments", Package],
                  ] as const
                ).map(([tab, label, Icon]) => {
                  const active = activeStudentTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveStudentTab(tab)}
                      className={`relative inline-flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-orange-300 ${
                        active
                          ? "text-[#173B67]"
                          : "text-slate-500 hover:text-[#173B67]"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={active ? "text-orange-500" : ""}
                      />
                      {label}
                      <span
                        className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-orange-500 transition-all duration-200 ${
                          active
                            ? "scale-x-100 opacity-100"
                            : "scale-x-0 opacity-0"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {isStudentLoading ? (
                <div aria-busy="true" className="space-y-4 py-2">
                  <span className="sr-only">Loading student details...</span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="sk-shimmer h-[84px] rounded-xl"
                      />
                    ))}
                  </div>
                  <div className="sk-shimmer h-24 rounded-xl" />
                </div>
              ) : studentLoadError ? (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-start"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-red-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Unable to load student details
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-700">
                        {studentLoadError}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadStudentDetails(selectedStudent)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              ) : (
                <div key={activeStudentTab} className="sk-fade-up">
                  {activeStudentTab === "overview" && (
                    <OverviewTab student={details as Student} />
                  )}

                  {activeStudentTab === "progress" && (
                    <ProgressTab
                      summary={summary}
                      courses={courses}
                      assessments={assessments}
                      certificates={certificates}
                    />
                  )}

                  {activeStudentTab === "assessments" && (
                    <AssessmentsTab assessments={assessments} />
                  )}

                  {activeStudentTab === "enrollments" && (
                    <EnrollmentsTab enrollments={enrollments} />
                  )}

                  {activeStudentTab === "payments" && (
                    <PaymentsTab payments={payments} />
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
              <CloseButton onClick={closeViewModal} />
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ============ PAGE-LEVEL ANIMATIONS ============ */}
      <style jsx global>{`
        @keyframes skPageIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes skFadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes skFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes skModalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes skShimmer {
          0% {
            background-position: -400px 0;
          }
          100% {
            background-position: 400px 0;
          }
        }

        .sk-page-in {
          animation: skPageIn 0.25s ease-out both;
        }

        .sk-fade-up {
          animation: skFadeUp 0.25s ease-out both;
        }

        .sk-row-in {
          animation: skFadeUp 0.22s ease-out both;
        }

        .sk-overlay-in {
          animation: skFadeIn 0.2s ease-out both;
        }

        .sk-modal-in {
          animation: skModalIn 0.22s ease-out both;
        }

        .sk-shimmer {
          background-color: #eef2f7;
          background-image: linear-gradient(
            90deg,
            #eef2f7 0%,
            #f8fafc 50%,
            #eef2f7 100%
          );
          background-size: 800px 100%;
          background-repeat: no-repeat;
          animation: skShimmer 1.3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .sk-page-in,
          .sk-fade-up,
          .sk-row-in,
          .sk-overlay-in,
          .sk-modal-in,
          .sk-shimmer {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

/* =====================================================================
   ASSESSMENTS TAB
   ===================================================================== */

function AssessmentsTab({ assessments }: { assessments: any[] }) {
  const [openAssessmentId, setOpenAssessmentId] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<Record<string, number>>({});

  if (!assessments.length) {
    return <EmptyBox text="No assessments available for this student." />;
  }

  const parseAnswers = (answers: unknown): Record<string, string> => {
    if (!answers) return {};
    if (typeof answers === "object" && answers !== null) {
      return answers as Record<string, string>;
    }
    if (typeof answers === "string") {
      try {
        const parsed = JSON.parse(answers);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  const normalizeAnswer = (value: unknown) =>
    String(value ?? "").trim().toUpperCase();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
            <ClipboardList size={19} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#173B67]">Student Assessments</p>
            <p className="mt-0.5 text-xs text-slate-500">
              View assignments, quizzes, every submitted attempt, scores and quiz answers.
            </p>
          </div>
        </div>
      </div>

      {assessments.map((assessment, index) => {
        const key = String(assessment.assessmentId ?? assessment.id ?? index);
        const attempts = Array.isArray(assessment.attempts)
          ? assessment.attempts
          : [];
        const isOpen = openAssessmentId === key;
        const attemptIndex = selectedAttempt[key] ?? Math.max(attempts.length - 1, 0);
        const attempt = attempts[attemptIndex] ?? null;
        const answers = parseAnswers(attempt?.answers);
        const title =
          assessment.title ||
          assessment.assessment?.title ||
          `Assessment ${index + 1}`;
        const courseTitle =
          assessment.courseTitle ||
          assessment.course?.title ||
          assessment.assessment?.course?.title ||
          "—";
        const type = assessment.type || assessment.assessment?.type || "ASSESSMENT";
        const totalMarks =
          assessment.totalMarks ?? assessment.assessment?.totalMarks ?? null;
        const questions = Array.isArray(assessment.questions)
          ? assessment.questions
          : [];
        const status =
          attempt?.status ||
          assessment.submissionStatus ||
          "NOT_ATTEMPTED";

        return (
          <section
            key={key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-sm"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenAssessmentId(isOpen ? null : key)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-[#173B67]">{title}</h3>
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600">
                    {type}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Course: {courseTitle}</span>
                  <span>Attempts: {assessment.attemptCount ?? attempts.length}</span>
                  <span>
                    Score: {attempt?.score ?? assessment.score ?? "—"}
                    {totalMarks ? ` / ${totalMarks}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ToneBadge text={String(status).replaceAll("_", " ")} />
                {isOpen ? (
                  <ChevronUp size={18} className="text-slate-400" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="sk-fade-up border-t border-slate-100 p-4">
                {attempts.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {attempts.map((item: any, attemptIdx: number) => (
                      <button
                        key={item.id ?? attemptIdx}
                        type="button"
                        onClick={() =>
                          setSelectedAttempt((current) => ({
                            ...current,
                            [key]: attemptIdx,
                          }))
                        }
                        className={`h-9 rounded-xl px-3.5 text-xs font-bold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                          attemptIdx === attemptIndex
                            ? "bg-[#173B67] text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        }`}
                      >
                        Attempt {item.attemptNumber ?? attemptIdx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {attempt ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <AssessmentInfo label="Attempt" value={String(attempt.attemptNumber ?? attemptIndex + 1)} />
                      <AssessmentInfo
                        label="Score"
                        value={`${attempt.score ?? "—"}${totalMarks ? ` / ${totalMarks}` : ""}`}
                      />
                      <AssessmentInfo
                        label="Status"
                        value={String(attempt.status ?? "—").replaceAll("_", " ")}
                      />
                      <AssessmentInfo
                        label="Submitted"
                        value={attempt.submittedAt ? formatDateTime(attempt.submittedAt) : "Not submitted"}
                      />
                    </div>

                    {attempt.feedback && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs font-bold text-blue-800">Feedback</p>
                        <p className="mt-1 text-sm text-blue-700">{attempt.feedback}</p>
                      </div>
                    )}

                    {attempt.submissionComment && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-600">Student Comment</p>
                        <p className="mt-1 text-sm text-slate-600">{attempt.submissionComment}</p>
                      </div>
                    )}

                    {attempt.submissionFileName && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-600">Assignment File</p>
                        <p className="mt-1 break-all text-sm text-slate-700">{attempt.submissionFileName}</p>
                      </div>
                    )}

                    {type === "QUIZ" && questions.length > 0 ? (
                      <div>
                        <div className="mb-3">
                          <p className="text-sm font-bold text-[#173B67]">Quiz Answers</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Selected answers are compared with the stored correct answers.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {questions.map((question: any, questionIndex: number) => {
                            const selected = normalizeAnswer(
                              answers[String(question.id)] ??
                                answers[question.id] ??
                                answers[String(questionIndex)] ??
                                answers[questionIndex]
                            );
                            const correct = normalizeAnswer(question.correctAnswer);
                            const hasAnswer = Boolean(selected);
                            const isCorrect = hasAnswer && selected === correct;
                            const options = [
                              ["A", question.optionA],
                              ["B", question.optionB],
                              ["C", question.optionC],
                              ["D", question.optionD],
                            ] as const;

                            return (
                              <div key={question.id ?? questionIndex} className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/5 text-xs font-bold text-[#173B67]">
                                    {questionIndex + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-700">{question.question}</p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                      {options.map(([letter, option]) =>
                                        option ? (
                                          <div
                                            key={letter}
                                            className={`rounded-lg border px-3 py-2 text-xs ${
                                              correct === letter
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                : selected === letter
                                                  ? "border-red-300 bg-red-50 text-red-800"
                                                  : "border-slate-200 bg-slate-50 text-slate-600"
                                            }`}
                                          >
                                            <span className="font-bold">{letter}.</span> {option}
                                            {selected === letter && <span className="ml-2 font-bold">— Selected</span>}
                                            {correct === letter && <span className="ml-2 font-bold">— Correct</span>}
                                          </div>
                                        ) : null
                                      )}
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                                      <span className="font-semibold text-slate-500">
                                        Student answer: <span className="text-slate-700">{hasAnswer ? selected : "Not answered"}</span>
                                      </span>
                                      <span className="font-semibold text-slate-500">
                                        Correct answer: <span className="text-emerald-700">{correct || "Not available"}</span>
                                      </span>
                                      <span className="font-semibold text-slate-500">
                                        Marks: <span className="text-slate-700">{question.marks ?? "—"}</span>
                                      </span>
                                      {hasAnswer && isCorrect ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                          <CheckCircle2 size={14} /> Correct
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 font-bold text-red-600">
                                          <XCircle size={14} /> {hasAnswer ? "Incorrect" : "Not answered"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-600">
                          {type === "QUIZ"
                            ? "No quiz questions are available for this assessment."
                            : "Assignment submission details are shown above."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      This assessment has not been attempted yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function AssessmentInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#173B67]">{value}</p>
    </div>
  );
}

/* =====================================================================
   OVERVIEW TAB
   ===================================================================== */

function OverviewTab({ student }: { student: Student }) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem
          icon={<Users size={16} />}
          label="Full Name"
          value={student.name}
        />

        <DetailItem
          icon={<Users size={16} />}
          label="Student ID"
          value={student.id || "Not assigned"}
        />

        <DetailItem
          icon={<Mail size={16} />}
          label="Email"
          value={student.email || "Not provided"}
        />

        <DetailItem
          icon={<Phone size={16} />}
          label="Phone"
          value={student.phone || "Not provided"}
        />

        <DetailItem
          icon={<CalendarDays size={16} />}
          label="Date of Birth"
          value={student.dob ? formatDate(student.dob) : "Not provided"}
        />

        <DetailItem
          icon={<CalendarDays size={16} />}
          label="Joined Date"
          value={student.joinedDate}
        />

        <DetailItem
          icon={<MapPin size={16} />}
          label="State"
          value={student.state || "Not provided"}
        />

        <DetailItem
          icon={<Users size={16} />}
          label="Referral ID"
          value={student.referralId || "Not provided"}
        />
      </div>

      <ListSection
        title="Enrolled Courses"
        items={student.courses}
        emptyText="No courses enrolled."
        tone="orange"
      />

      <ListSection
        title="Enrolled Packages"
        items={student.packages}
        emptyText="No package enrolled."
        tone="blue"
      />
    </div>
  );
}

/* =====================================================================
   PROGRESS TAB
   ===================================================================== */

function ProgressTab({
  summary,
  courses,
  assessments,
  certificates,
}: {
  summary: ProgressData["summary"];
  courses: any[];
  assessments: any[];
  certificates: any[];
}) {
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressMetric
          label="Overall Progress"
          value={`${summary?.averageProgress ?? 0}%`}
          icon={<BarChart3 size={18} />}
        />

        <ProgressMetric
          label="Completed Courses"
          value={`${summary?.completedCourses ?? 0}/${summary?.totalCourses ?? 0}`}
          icon={<GraduationCap size={18} />}
        />

        <ProgressMetric
          label="Lessons Completed"
          value={`${summary?.completedLessons ?? 0}/${summary?.totalLessons ?? 0}`}
          icon={<CheckCircle2 size={18} />}
        />

        <ProgressMetric
          label="Certificates"
          value={summary?.totalCertificates ?? certificates.length}
          icon={<Award size={18} />}
        />
      </div>

      <section>
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-700">Course Progress</p>

          <p className="mt-0.5 text-xs text-slate-400">
            Calculated from actual lesson completion records.
          </p>
        </div>

        {courses.length ? (
          <div className="space-y-3">
            {courses.map((course, index) => {
              const progress = Number(
                course.progressPercentage ?? course.progress ?? 0
              );

              const title =
                course.courseTitle ||
                course.title ||
                course.course?.title ||
                `Course ${index + 1}`;

              const totalLessons =
                course.totalLessons ?? course.lessonCount ?? 0;

              const completedLessons = course.completedLessons ?? 0;

              return (
                <div
                  key={course.id || `${title}-${index}`}
                  className="rounded-2xl border border-slate-200 p-4 transition-shadow duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[#173B67]">
                      {title}
                    </p>

                    <span className="text-sm font-bold text-orange-600">
                      {progress}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-[width] duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {completedLessons} of {totalLessons} lessons completed
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyBox text="No course progress available yet." />
        )}
      </section>

      <section>
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-700">Assessments</p>
        </div>

        {assessments.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((item, index) => {
                  const assessment = item.assessment || item;
                  const submission =
                    item.submission || item.latestSubmission || item;
                  const title =
                    assessment.title || item.title || `Assessment ${index + 1}`;

                  return (
                    <tr
                      key={item.id || assessment.id || index}
                      className="border-t border-slate-100 transition-colors hover:bg-[#F4F8FE]"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                        {title}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-500">
                        {assessment.course?.title || item.courseTitle || "—"}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-[#173B67]">
                        {submission.score ?? "—"}
                        {assessment.totalMarks
                          ? ` / ${assessment.totalMarks}`
                          : ""}
                      </td>

                      <td className="px-4 py-3">
                        <ToneBadge text={submission.status || "Not submitted"} />
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">
                        {submission.submittedAt
                          ? formatDateTime(submission.submittedAt)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBox text="No assessment records available yet." />
        )}
      </section>

      <section>
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-700">
            Certificates & Achievements
          </p>
        </div>

        {certificates.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {certificates.map((certificate, index) => (
              <div
                key={certificate.id || index}
                className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 transition-shadow duration-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Award size={22} className="mt-1 shrink-0 text-amber-600" />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      {certificate.title || "Certificate"}
                    </p>

                    <p className="mt-1 break-all text-[11px] text-amber-700/70">
                      {certificate.certificateNumber ||
                        "Certificate number unavailable"}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Issued {formatDateTime(certificate.issuedAt)}
                    </p>
                  </div>
                </div>

                {certificate.certificateUrl && (
                  <a
                    href={certificate.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs font-semibold text-[#173B67] transition-colors hover:text-orange-600"
                  >
                    View certificate
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyBox text="No certificates issued yet." />
        )}
      </section>
    </div>
  );
}

/* =====================================================================
   ENROLLMENTS TAB
   ===================================================================== */

function EnrollmentsTab({ enrollments }: { enrollments: any[] }) {
  if (!enrollments.length) {
    return <EmptyBox text="No enrollment records found." />;
  }

  return (
    <div className="space-y-3">
      {enrollments.map((enrollment, index) => {
        const course =
          enrollment.course?.title ||
          enrollment.courseTitle ||
          "Course enrollment";
        const pkg = enrollment.package?.title || enrollment.packageTitle;

        return (
          <div
            key={enrollment.id || index}
            className="rounded-2xl border border-slate-200 p-4 transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-[#173B67]">
                  {pkg || course}
                </p>

                {pkg && (
                  <p className="mt-1 text-xs text-slate-500">
                    Package enrollment
                  </p>
                )}
              </div>

              <ToneBadge text={enrollment.status || "Active"} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoValue label="Course" value={course} />
              <InfoValue
                label="Enrolled"
                value={
                  enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : "—"
                }
              />
              <InfoValue
                label="Completed"
                value={
                  enrollment.completedAt
                    ? formatDate(enrollment.completedAt)
                    : "Not completed"
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =====================================================================
   PAYMENTS TAB
   ===================================================================== */

function PaymentsTab({ payments }: { payments: any[] }) {
  if (!payments.length) {
    return <EmptyBox text="No payment records found." />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Payment ID</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr
              key={payment.id || index}
              className="border-t border-slate-100 transition-colors hover:bg-[#F4F8FE]"
            >
              <td className="px-4 py-4 text-sm font-bold text-[#173B67]">
                {payment.currency || "INR"} {payment.amount ?? "—"}
              </td>

              <td className="px-4 py-4 text-sm text-slate-600">
                {payment.method || "—"}
              </td>

              <td className="px-4 py-4">
                <ToneBadge text={payment.status || "—"} />
              </td>

              <td className="px-4 py-4 text-xs text-slate-500">
                {payment.providerPaymentId || payment.providerOrderId || "—"}
              </td>

              <td className="px-4 py-4 text-xs text-slate-500">
                {formatDateTime(payment.paidAt || payment.createdAt || "")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================================
   SHARED UI PIECES
   ===================================================================== */

function Avatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-sm font-bold text-white"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {status}
    </span>
  );
}

/**
 * Generic status badge for assessment / enrollment / payment states.
 * The text shown is exactly what the backend returned; only the tint is derived.
 */
function ToneBadge({ text }: { text: string }) {
  const value = String(text).toUpperCase();

  let tone = "bg-slate-100 text-slate-600";

  if (/(GRADED|COMPLETED|SUCCESS|PAID|CAPTURED|ACTIVE|PASSED|APPROVED)/.test(value)) {
    tone = "bg-emerald-50 text-emerald-700";
  } else if (/(PENDING|SUBMITTED|PROCESSING|CREATED|IN PROGRESS|IN_PROGRESS)/.test(value)) {
    tone = "bg-amber-50 text-amber-700";
  } else if (/(FAILED|REJECTED|CANCELLED|CANCELED|EXPIRED|REFUND)/.test(value)) {
    tone = "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {text}
    </span>
  );
}

function PackageButtons({
  student,
  onOpen,
}: {
  student: Student;
  onOpen: (student: Student, packageTitle: string) => void | Promise<void>;
}) {
  if (student.packages.length === 0) {
    return <span className="text-xs text-slate-400">No package</span>;
  }

  return (
    <div className="space-y-2">
      {student.packages.map((pkg) => (
        <button
          key={pkg}
          type="button"
          onClick={() => void onOpen(student, pkg)}
          className="flex w-full items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-left transition duration-200 hover:border-blue-300 hover:bg-blue-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          title="Click to view courses in this package"
        >
          <Package size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <span className="text-xs font-semibold leading-4 text-[#173B67]">
            {pkg}
          </span>
        </button>
      ))}
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-[#173B67]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string;
  items: string[];
  emptyText: string;
  tone: "orange" | "blue";
}) {
  const styles =
    tone === "orange"
      ? "bg-orange-50 text-orange-600"
      : "bg-blue-50 text-[#173B67]";

  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>

      <div className="rounded-xl border border-slate-200 p-4">
        {items.length ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${styles}`}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function InfoValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Inbox size={20} />
      </div>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  loading,
  index,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{
    size?: number | string;
    className?: string;
  }>;
  tone: "blue" | "green" | "orange";
  loading: boolean;
  index: number;
}) {
  const tones = {
    blue: {
      box: "bg-blue-50 group-hover:bg-blue-100",
      icon: "text-blue-600",
    },
    green: {
      box: "bg-emerald-50 group-hover:bg-emerald-100",
      icon: "text-emerald-600",
    },
    orange: {
      box: "bg-orange-50 group-hover:bg-orange-100",
      icon: "text-orange-500",
    },
  }[tone];

  return (
    <div
      className="sk-fade-up group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,47,95,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div className="sk-shimmer mt-3 h-8 w-16 rounded" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#173B67]">
              {value}
            </p>
          )}

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${tones.box}`}
        >
          <Icon size={21} className={tones.icon} />
        </div>
      </div>
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
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = activeSortKey === sortKey;

  return (
    <th
      className="px-4 py-3.5 text-left"
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
          active
            ? "text-orange-600"
            : "text-slate-400 hover:text-orange-500"
        }`}
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ChevronUp size={14} className="text-orange-500" />
          ) : (
            <ChevronDown size={14} className="text-orange-500" />
          )
        ) : (
          <ChevronsUpDown size={13} className="text-slate-300" />
        )}
      </button>
    </th>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-4 align-top text-sm text-slate-600">{children}</td>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div
      className="sk-overlay-in fixed inset-0 z-[1000] flex items-end justify-center bg-[#0B1B33]/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-[#173B67] sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition duration-200 hover:bg-orange-50 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
    >
      Close
    </button>
  );
}

function TableFilterCell({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <td className="px-3 py-2.5">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder.replace("...", "")}
        className="h-9 w-full min-w-[120px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 outline-none transition duration-200 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </td>
  );
}

function TableFilterStatusCell({
  value,
  onChange,
}: {
  value: "All" | StudentStatus;
  onChange: (value: "All" | StudentStatus) => void;
}) {
  return (
    <td className="px-3 py-2.5">
      <select
        value={value}
        aria-label="Filter by status"
        onChange={(e) => onChange(e.target.value as "All" | StudentStatus)}
        className="h-9 w-full min-w-[105px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 outline-none transition duration-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
      >
        <option value="All">All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </td>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 transition duration-200 hover:border-blue-200 hover:bg-[#F8FAFE]">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="text-orange-400">{icon}</span>
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}
