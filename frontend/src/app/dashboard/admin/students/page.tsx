"use client";

import {
  AdminPageHeader,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LIGHT,
} from "@/components/dashboard/admin/AdminPageHeader";


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  ClipboardList,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Inbox,
  Info,
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

import CountUp from "@/components/CountUp";
import { useToast } from "@/components/Toast";

type StudentStatus = "Active" | "Inactive";

type Student = {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  email: string;
  phone: string;
  dob: string;
  courses: string[];
  packages: string[];
  joinedDate: string;
  /** Raw ISO date from the API — used for correct date sorting. */
  joinedRaw: string;
  status: StudentStatus;
  state: string;
  referralId: string;
};

type StudentApiRow = {
  id?: string;
  studentId?: string;
  name?: string;
  avatarUrl?: string;
  avatar?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  profileImage?: string;
  profileImageUrl?: string;
  profilePicture?: string;
  profilePictureUrl?: string;
  imageUrl?: string;
  photoUrl?: string;
  imagePath?: string;
  picture?: string;
  image?: string;
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

type ExtraField = { label: string; value: string };

type StudentDetails = Student & {
  enrollments: any[];
  payments: any[];
  /** Every other (non-sensitive) field the API returned for this student. */
  extras: ExtraField[];
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

const PAGE_SIZES = [10, 25, 50, 100];

/* Shared focus ring (SKCE orange) */
const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/40";

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

function formatMoney(amount: unknown, currency?: string) {
  const number = Number(amount);
  const shown = Number.isFinite(number)
    ? number.toLocaleString("en-IN")
    : "—";
  return `${currency || "INR"} ${shown}`;
}

function isPaidStatus(status: unknown) {
  return /(PAID|SUCCESS|CAPTURED|COMPLETED)/.test(
    String(status ?? "").toUpperCase()
  );
}

/** camelCase / snake_case → "Title Case" */
function humanize(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Fields already shown elsewhere, internal ids, or sensitive values. */
const HIDDEN_FIELD =
  /^(id|userid|studentid|name|email|phone|dob|state|referralid|isactive|enrollments|payments|courses|packages|createdat|updatedat|__v)$|password|token|secret|hash|salt|otp|session|refresh/i;

function formatExtraValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (/(date|dob|at)$/i.test(key) && !Number.isNaN(Date.parse(value))) {
      return /(dob|date)$/i.test(key) ? formatDate(value) : formatDateTime(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => ["string", "number"].includes(typeof item))
      .join(", ");
  }
  return "";
}

/** Turns the raw student API object into labelled rows so nothing is hidden from the admin. */
function buildExtras(details: Record<string, unknown>): ExtraField[] {
  const rows: ExtraField[] = [];

  Object.entries(details || {}).forEach(([key, value]) => {
    if (HIDDEN_FIELD.test(key)) return;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value as Record<string, unknown>).forEach(
        ([childKey, childValue]) => {
          if (HIDDEN_FIELD.test(childKey)) return;
          const text = formatExtraValue(childKey, childValue);
          if (text) {
            rows.push({
              label: `${humanize(key)} · ${humanize(childKey)}`,
              value: text,
            });
          }
        }
      );
      return;
    }

    const text = formatExtraValue(key, value);
    if (text) rows.push({ label: humanize(key), value: text });
  });

  return rows;
}

function escapeExcelXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mapStudent(student: StudentApiRow): Student {
  return {
    id: student.studentId || student.id || "",
    userId: student.id || "",
    name: student.name || "Unnamed Student",
    avatarUrl: student.avatarUrl || student.avatar || student.profilePhotoUrl || student.profilePhoto || student.profileImageUrl || student.profileImage || student.profilePictureUrl || student.profilePicture || student.imageUrl || student.photoUrl || student.imagePath || student.picture || student.image || "",
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
    joinedRaw: student.createdAt || "",
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

/* Avatar colors: SKCE logo family + semantic green */
const AVATAR_TONES = [
  "bg-[#0F2F5F]",
  "bg-[#173B67]",
  "bg-[#173B67]",
  "bg-emerald-600",
  "bg-[#F97316]",
  "bg-[#123B6D]",
];

function avatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export default function StudentsPage() {
  const { notify, toastContainer } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [columnFilters, setColumnFilters] =
    useState<ColumnFilters>(EMPTY_FILTERS);

  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Ignores late responses when the admin switches students quickly.
  const detailsRequestRef = useRef(0);

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

      if (refresh) {
        notify(
          "success",
          "Students refreshed",
          `${rows.length} registered student${rows.length === 1 ? "" : "s"} loaded.`,
          3000
        );
      }
    } catch (error) {
      console.error("Failed to load students:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load registered students from the database."
      );
      notify(
        "error",
        "Couldn't load students",
        "Please check your connection and try again."
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

    const requestId = (detailsRequestRef.current += 1);
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

      if (requestId !== detailsRequestRef.current) return;

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
        avatarUrl: details.avatarUrl || details.avatar || details.profilePhotoUrl || details.profilePhoto || details.profileImageUrl || details.profileImage || details.profilePictureUrl || details.profilePicture || details.imageUrl || details.photoUrl || details.imagePath || details.picture || details.image || student.avatarUrl,
        email: details.email || student.email,
        phone: details.phone || student.phone,
        dob: details.dob || student.dob,
        createdAt: details.createdAt || student.joinedRaw,
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
        extras: buildExtras(details),
      });

      setProgressData(progressResult?.data || null);
    } catch (error) {
      if (requestId !== detailsRequestRef.current) return;
      console.error("Failed to load student details:", error);
      notify(
        "error",
        "Couldn't load student details",
        "Use Retry in the panel to try again."
      );
      setStudentLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load student details."
      );
    } finally {
      if (requestId === detailsRequestRef.current) {
        setIsStudentLoading(false);
      }
    }
  };

  // Dropdown options are derived from the loaded student records; no manual text search is needed.
  const studentFilterOptions = useMemo(
    () => [...students]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((student) => ({
        value: student.userId || student.id,
        label: student.email ? `${student.name} — ${student.email}` : student.name,
      }))
      .filter((option, index, all) => option.value && all.findIndex((item) => item.value === option.value) === index),
    [students]
  );
  const studentIdFilterOptions = useMemo(
    () => [...new Set(students.map((student) => student.id).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [students]
  );
  const phoneFilterOptions = useMemo(
    () => [...new Set(students.map((student) => student.phone).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [students]
  );
  const packageFilterOptions = useMemo(
    () => [...new Set(students.flatMap((student) => student.packages).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [students]
  );
  const joinedFilterOptions = useMemo(
    () => [...new Map(students.filter((student) => (student.joinedRaw || "").slice(0, 10)).map((student) => [(student.joinedRaw || "").slice(0, 10), student.joinedDate])).entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label })),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const filtered = students.filter((student) => (
      (!columnFilters.student || (student.userId || student.id) === columnFilters.student) &&
      (!columnFilters.studentId || student.id === columnFilters.studentId) &&
      (!columnFilters.phone || student.phone === columnFilters.phone) &&
      (!columnFilters.package || student.packages.includes(columnFilters.package)) &&
      (!columnFilters.joined || (student.joinedRaw || "").slice(0, 10) === columnFilters.joined) &&
      (columnFilters.status === "All" || student.status === columnFilters.status)
    ));

    return [...filtered].sort((a, b) => {
      if (sortKey === "joined") {
        const leftTime = new Date(a.joinedRaw).getTime();
        const rightTime = new Date(b.joinedRaw).getTime();

        if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
          return sortDirection === "asc"
            ? leftTime - rightTime
            : rightTime - leftTime;
        }
      }

      const pick = (student: Student) => {
        switch (sortKey) {
          case "student":
            return student.name;
          case "studentId":
            return student.id;
          case "phone":
            return student.phone;
          case "package":
            return student.packages.join(", ");
          case "status":
            return student.status;
          default:
            return student.joinedDate;
        }
      };

      const comparison = pick(a)
        .toLowerCase()
        .localeCompare(pick(b).toLowerCase(), undefined, {
          numeric: true,
          sensitivity: "base",
        });

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [students, columnFilters, sortKey, sortDirection]);

  // Back to page 1 whenever the result set changes shape.
  useEffect(() => {
    setPage(1);
  }, [columnFilters, sortKey, sortDirection, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedStudents = filteredStudents.slice(
    pageStart,
    pageStart + pageSize
  );

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  const inactiveCount = students.filter(
    (student) => student.status === "Inactive"
  ).length;

  const hasFilters =
    columnFilters.student !== "" ||
    columnFilters.studentId !== "" ||
    columnFilters.phone !== "" ||
    columnFilters.package !== "" ||
    columnFilters.joined !== "" ||
    columnFilters.status !== "All";

  const openViewModal = (student: Student) => {
    setSelectedStudent(student);
    setActiveStudentTab("overview");
    setShowViewModal(true);
    void loadStudentDetails(student);
  };

  const closeViewModal = () => {
    detailsRequestRef.current += 1;
    setSelectedStudent(null);
    setStudentDetails(null);
    setProgressData(null);
    setStudentLoadError("");
    setShowViewModal(false);
  };

  // Previous / next student inside the open panel (follows the current filtered list).
  const selectedIndex = selectedStudent
    ? filteredStudents.findIndex(
        (item) => (item.userId || item.id) === (selectedStudent.userId || selectedStudent.id)
      )
    : -1;

  const stepStudent = (delta: number) => {
    const next = filteredStudents[selectedIndex + delta];
    if (next) openViewModal(next);
  };

  const closePackageModal = () => {
    setSelectedPackage(null);
    setPackageError("");
  };

  const exportExcel = () => {
    if (filteredStudents.length === 0) {
      notify("warning", "Nothing to export", "There are no students in the current view.");
      return;
    }

    const header = [
      "Student ID",
      "Name",
      "Email",
      "Phone",
      "Date of Birth",
      "State",
      "Packages",
      "Courses",
      "Joined",
      "Status",
    ];

    const rows = filteredStudents.map((student) => [
      student.id,
      student.name,
      student.email,
      student.phone,
      student.dob ? formatDate(student.dob) : "",
      student.state,
      student.packages.join("; "),
      student.courses.join("; "),
      student.joinedDate,
      student.status,
    ]);

    // SpreadsheetML is a native Excel-readable workbook format. Using explicit
    // String cells keeps user-provided values as text rather than formulas.
    const xmlRows = [header, ...rows]
      .map((row, rowIndex) => {
        const style = rowIndex === 0 ? ' ss:StyleID="Header"' : "";
        const cells = row
          .map((cell) => `<Cell><Data ss:Type="String">${escapeExcelXml(String(cell ?? ""))}</Data></Cell>`)
          .join("");
        return `<Row${style}>${cells}</Row>`;
      })
      .join("");

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Aptos" ss:Size="10"/><Interior/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#173B67" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style></Styles><Worksheet ss:Name="Students"><Table>${xmlRows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet></Workbook>`;

    const blob = new Blob(["\uFEFF", workbook], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    notify(
      "success",
      "Excel export ready",
      `${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"} exported to an Excel workbook.`,
      3500
    );
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
      notify(
        "error",
        "Couldn't load package courses",
        "Please close this panel and try again."
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

  const totalPaid = payments
    .filter((payment: any) => isPaidStatus(payment?.status))
    .reduce((sum: number, payment: any) => sum + (Number(payment?.amount) || 0), 0);

  const tabs: Array<{
    key: StudentTab;
    label: string;
    icon: typeof Users;
    count?: number;
  }> = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "progress", label: "Progress", icon: BarChart3 },
    {
      key: "assessments",
      label: "Assessments",
      icon: ClipboardList,
      count: studentDetails ? assessments.length : undefined,
    },
    {
      key: "enrollments",
      label: "Enrollments",
      icon: GraduationCap,
      count: studentDetails ? enrollments.length : undefined,
    },
    {
      key: "payments",
      label: "Payments",
      icon: CreditCard,
      count: studentDetails ? payments.length : undefined,
    },
  ];

  const rangeStart = filteredStudents.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredStudents.length);

  return (
    <main className="sk-page-in min-h-screen bg-[#F4F7FB] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      {toastContainer}

      <div className="mx-auto w-full max-w-[1680px] space-y-6">
        {/* ============ SKCE BRANDED PAGE BANNER ============ */}
        <AdminPageHeader
          icon={Users}
          label="Administration Portal · Student Management"
          title="Students"
          subtitle="Manage every registered student at SK Computer Education — profiles, learning progress, assessments, enrollments and payments in one place."
          chips={[
            { label: "Total students", value: isLoading ? "…" : students.length },
            { label: "Active students", value: isLoading ? "…" : activeCount },
            { label: "Inactive students", value: isLoading ? "…" : inactiveCount },
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={exportExcel}
                disabled={isLoading || students.length === 0}
                className={ADMIN_BTN_GHOST}
              >
                <Download size={17} />
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => void loadStudents(true)}
                disabled={isRefreshing || isLoading}
                className={ADMIN_BTN_PRIMARY}
              >
                <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </>
          }
        />

        {/* ============ SUMMARY CARDS (click to filter) ============ */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Students"
            value={students.length}
            icon={Users}
            description="Registered in database"
            tone="blue"
            loading={isLoading}
            index={0}
            selected={columnFilters.status === "All"}
            onClick={() => updateColumnFilter("status", "All")}
          />
          <SummaryCard
            title="Active Students"
            value={activeCount}
            icon={UserCheck}
            description="Currently active"
            tone="green"
            loading={isLoading}
            index={1}
            selected={columnFilters.status === "Active"}
            onClick={() => updateColumnFilter("status", "Active")}
          />
          <SummaryCard
            title="Inactive Students"
            value={inactiveCount}
            icon={UserX}
            description="Currently inactive"
            tone="orange"
            loading={isLoading}
            index={2}
            selected={columnFilters.status === "Inactive"}
            onClick={() => updateColumnFilter("status", "Inactive")}
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
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition duration-200 hover:-translate-y-px hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ============ STUDENTS TABLE ============ */}
        <section className="sk-fade-up overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04),0_4px_14px_rgba(15,47,95,0.03)]" style={{ animationDelay: "120ms" }}>
          {/* Result count */}
          {!isLoading && students.length > 0 && (
            <div className="flex flex-col gap-2 border-b border-[#EDF1F7] bg-[#F8FAFD] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-[#0F2F5F]">{filteredStudents.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-[#0F2F5F]">{students.length}</span>{" "}
                students
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Use the dropdowns in each column heading to filter students.</span>
                {hasFilters && (
                  <span className="sk-pop rounded-full bg-[#FFF3EA] px-2.5 py-1 text-[11px] font-semibold text-[#EA580C]">Filters applied</span>
                )}
              </div>
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
            <div className="sk-fade-up px-6 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3EA] ring-8 ring-[#FFF3EA]/60">
                {students.length === 0 ? (
                  <Users size={28} className="text-[#F97316]" />
                ) : (
                  <Search size={28} className="text-[#F97316]" />
                )}
              </div>

              <h3 className="mt-6 text-lg font-semibold text-[#0F2F5F]">
                {students.length === 0
                  ? "No registered students found"
                  : "No students match these filters"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {students.length === 0
                  ? "Students will appear here automatically after they register through the SK Computer Education registration process."
                  : "Choose different dropdown values or clear the filters to see more students."}
              </p>

              {students.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className={`ad-btn-primary mt-6 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white ${FOCUS}`}
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
                    <tr className="bg-[#F8FAFD] align-top">
                      <SortableTableHeader
                        label="Student"
                        sortKey="student"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        filter={<TableFilterSelect value={columnFilters.student} onChange={(value) => updateColumnFilter("student", value)} placeholder="All students" options={studentFilterOptions} />}
                      />
                      <SortableTableHeader
                        label="Student ID"
                        sortKey="studentId"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        filter={<TableFilterSelect value={columnFilters.studentId} onChange={(value) => updateColumnFilter("studentId", value)} placeholder="All IDs" options={studentIdFilterOptions.map((value) => ({ value, label: value }))} />}
                      />
                      <SortableTableHeader
                        label="Phone"
                        sortKey="phone"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        filter={<TableFilterSelect value={columnFilters.phone} onChange={(value) => updateColumnFilter("phone", value)} placeholder="All phones" options={phoneFilterOptions.map((value) => ({ value, label: value }))} />}
                      />
                      <SortableTableHeader
                        label="Packages"
                        sortKey="package"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        filter={<TableFilterSelect value={columnFilters.package} onChange={(value) => updateColumnFilter("package", value)} placeholder="All packages" options={packageFilterOptions.map((value) => ({ value, label: value }))} />}
                      />
                      <SortableTableHeader
                        label="Joined"
                        sortKey="joined"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        filter={<TableFilterSelect value={columnFilters.joined} onChange={(value) => updateColumnFilter("joined", value)} placeholder="All dates" options={joinedFilterOptions} />}
                      />
                      <SortableTableHeader
                        label="Status"
                        sortKey="status"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        filter={<TableFilterStatusCell value={columnFilters.status} onChange={(value) => updateColumnFilter("status", value)} />}
                      />
                      <th className="px-3 py-3.5 text-left">
                        <div className="flex min-w-[76px] flex-col items-start gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Action</span>
                          <button
                            type="button"
                            onClick={clearAllFilters}
                            disabled={!hasFilters}
                            className="ad-btn-secondary h-9 whitespace-nowrap rounded-lg border border-[#E2E8F1] bg-white px-3 text-xs font-semibold text-[#173B67] transition hover:border-[#FFB36D] hover:bg-[#FFF3EA] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Clear filters
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  {/* key re-triggers the row entrance on page / sort change */}
                  <tbody key={`${currentPage}-${sortKey}-${sortDirection}-${pageSize}`}>
                    {pagedStudents.map((student, index) => (
                      <tr
                        key={student.userId || student.id}
                        className="sk-row-in ad-row group border-t border-[#EDF1F7]"
                        style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                      >
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => openViewModal(student)}
                            className={`flex min-w-[230px] items-center gap-3 rounded-lg text-left ${FOCUS}`}
                            aria-label={`Open ${student.name}`}
                          >
                            <Avatar name={student.name} src={student.avatarUrl} />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-slate-800 transition-colors duration-200 group-hover:text-[#F97316]">
                                {student.name}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-slate-500">
                                {student.email || "Email not provided"}
                              </span>
                            </span>
                          </button>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-[#0F2F5F]">
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
                            <PackageButtons student={student} onOpen={openPackageCourses} />
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="whitespace-nowrap">{student.joinedDate}</span>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={student.status} />
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            title="View full student profile"
                            aria-label={`View details for ${student.name}`}
                            onClick={() => openViewModal(student)}
                            className={`ad-eye flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F1] bg-white text-slate-500 ${FOCUS}`}
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
              <ul className="divide-y divide-[#EDF1F7] md:hidden" key={`m-${currentPage}-${sortKey}-${sortDirection}`}>
                {pagedStudents.map((student, index) => (
                  <li
                    key={student.userId || student.id}
                    className="sk-row-in p-4"
                    style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={student.name} src={student.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">{student.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {student.email || "Email not provided"}
                            </p>
                          </div>
                          <StatusBadge status={student.status} />
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <dt className="text-slate-400">Student ID</dt>
                            <dd className="mt-0.5 font-semibold text-[#0F2F5F]">{student.id || "Not assigned"}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-400">Joined</dt>
                            <dd className="mt-0.5 font-medium text-slate-700">{student.joinedDate}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-slate-400">Phone</dt>
                            <dd className="mt-0.5 font-medium text-slate-700">{student.phone || "Not provided"}</dd>
                          </div>
                        </dl>

                        <div className="mt-3">
                          <PackageButtons student={student} onOpen={openPackageCourses} />
                        </div>

                        <button
                          type="button"
                          onClick={() => openViewModal(student)}
                          className={`ad-btn-secondary mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F1] bg-white text-sm font-semibold text-[#173B67] ${FOCUS}`}
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* ---------- PAGINATION ---------- */}
              <div className="flex flex-col gap-3 border-t border-[#EDF1F7] bg-[#F8FAFD] px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <span>
                    <span className="font-semibold text-[#0F2F5F]">
                      {rangeStart}–{rangeEnd}
                    </span>{" "}
                    of {filteredStudents.length}
                  </span>
                  <label className="flex items-center gap-2">
                    <span className="hidden sm:inline">Rows</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      aria-label="Rows per page"
                      className="h-8 rounded-lg border border-[#E2E8F1] bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition duration-200 hover:border-[#FFC999] focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </section>

        {/* ============ INFO NOTE ============ */}
        <div className="sk-fade-up mt-6 flex items-start gap-3 rounded-2xl border border-[#FFD9BD] bg-[#FFF3EA]/70 p-4" style={{ animationDelay: "200ms" }}>
          <Info size={18} className="mt-0.5 shrink-0 text-[#173B67]" />
          <div>
            <p className="text-xs font-semibold text-[#0F2F5F]">
              Registered Students Only
            </p>
            <p className="mt-1 text-xs leading-5 text-[#173B67]/80">
              This page is read-only for student registration. Student records
              come directly from the SK Computer Education database. Students
              are created through the normal registration process, not
              manually from the Admin portal.
            </p>
          </div>
        </div>
      </div>

      {/* ============ PACKAGE COURSES MODAL ============ */}
      {selectedPackage && (
        <ModalOverlay
          onClose={closePackageModal}
          label={selectedPackage.title}
          size="md"
        >
          <ModalHeader
            title={selectedPackage.title}
            subtitle="Courses included in this registered package."
            icon={<Package size={20} />}
          />

          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {isPackageLoading ? (
              <div className="py-10 text-center" aria-busy="true">
                <RefreshCw size={26} className="mx-auto animate-spin text-[#F97316]" />
                <p className="mt-4 text-sm font-semibold text-[#0F2F5F]">
                  Loading package courses...
                </p>
              </div>
            ) : packageError ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Unable to load package courses
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">{packageError}</p>
              </div>
            ) : selectedPackage.courses.length === 0 ? (
              <EmptyBox text="No courses found in this package." />
            ) : (
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Included Courses{" "}
                  <span className="ml-1 rounded-md bg-[#FFF3EA] px-2 py-0.5 text-xs font-bold text-[#EA580C]">
                    {selectedPackage.courses.length}
                  </span>
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedPackage.courses.map((course, index) => (
                    <div
                      key={course}
                      className="sk-row-in ad-lift flex items-center gap-3 rounded-xl border border-[#FFD9BD] bg-[#FFF3EA]/70 px-4 py-3 hover:border-[#FFC999] hover:bg-[#FFF3EA]"
                      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <GraduationCap size={15} className="text-[#F97316]" />
                      </div>
                      <span className="text-sm font-semibold text-[#0F2F5F]">{course}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ModalFooter />
        </ModalOverlay>
      )}

      {/* ============ STUDENT DETAILS MODAL ============ */}
      {showViewModal && selectedStudent && (
        <ModalOverlay
          onClose={closeViewModal}
          label={`Student details: ${selectedStudent.name}`}
          size="xl"
        >
          {/* Profile hero — stays fixed, only the tab content scrolls */}
          <div className="ad-hero relative shrink-0 overflow-hidden bg-[linear-gradient(120deg,#0F2F5F_0%,#123B6D_45%,#173B67_100%)] px-5 pb-0 pt-5 text-white sm:px-6 sm:pt-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#F97316]/25 blur-3xl" />

            <ModalCloseX />

            <div className="relative flex flex-wrap items-center gap-4 pr-10">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ring-4 ring-white/20 ${avatarTone(selectedStudent.name)}`}
              >
                {selectedStudent.avatarUrl ? (
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={`${selectedStudent.name} profile`}
                    className="h-full w-full rounded-2xl object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  selectedStudent.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-bold sm:text-2xl">
                    {selectedStudent.name}
                  </h2>
                  <StatusBadge status={selectedStudent.status} />
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-blue-50">
                  <HeroChip
                    icon={<UserCheck size={13} />}
                    text={selectedStudent.id || "ID not assigned"}
                    copy={selectedStudent.id}
                  />
                  {selectedStudent.email && (
                    <HeroChip icon={<Mail size={13} />} text={selectedStudent.email} copy={selectedStudent.email} />
                  )}
                  {selectedStudent.phone && (
                    <HeroChip icon={<Phone size={13} />} text={selectedStudent.phone} copy={selectedStudent.phone} />
                  )}
                  {selectedStudent.state && (
                    <HeroChip icon={<MapPin size={13} />} text={selectedStudent.state} />
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeroStat label="Courses" value={isStudentLoading || !studentDetails ? "—" : String(summary.totalCourses ?? selectedStudent.courses.length)} />
              <HeroStat label="Overall progress" value={isStudentLoading || !progressData ? "—" : `${summary.averageProgress ?? 0}%`} />
              <HeroStat label="Certificates" value={isStudentLoading || !progressData ? "—" : String(summary.totalCertificates ?? certificates.length)} />
              <HeroStat label="Total paid" value={isStudentLoading || !studentDetails ? "—" : formatMoney(totalPaid)} />
            </div>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Student detail sections"
              className="relative -mx-5 mt-5 flex gap-1 overflow-x-auto px-5 sm:-mx-6 sm:px-6"
            >
              {tabs.map(({ key, label, icon: Icon, count }) => {
                const active = activeStudentTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveStudentTab(key)}
                    className={`relative inline-flex h-11 shrink-0 items-center gap-2 rounded-t-xl px-4 text-sm font-semibold transition-all duration-200 ${FOCUS} ${
                      active
                        ? "bg-white text-[#0F2F5F]"
                        : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-[#F97316]" : ""} />
                    {label}
                    {typeof count === "number" && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors duration-200 ${
                          active ? "bg-[#FFF3EA] text-[#EA580C]" : "bg-white/15 text-white"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {active && (
                      <span className="sk-grow-x absolute inset-x-3 top-0 h-0.5 rounded-full bg-[#F97316]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrolling content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {isStudentLoading ? (
              <div aria-busy="true" className="space-y-4 py-2">
                <span className="sr-only">Loading student details...</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="sk-shimmer h-[84px] rounded-xl" />
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
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Unable to load student details</p>
                    <p className="mt-1 text-xs leading-5 text-red-700">{studentLoadError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadStudentDetails(selectedStudent)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition duration-200 hover:-translate-y-px hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : (
              <div key={activeStudentTab} className="sk-fade-up">
                {activeStudentTab === "overview" && (
                  <OverviewTab student={details as Student} extras={studentDetails?.extras ?? []} />
                )}

                {activeStudentTab === "progress" && (
                  <ProgressTab summary={summary} courses={courses} assessments={assessments} certificates={certificates} />
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

          <ModalFooter
            left={
              filteredStudents.length > 1 && selectedIndex >= 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepStudent(-1)}
                    disabled={selectedIndex <= 0}
                    aria-label="Previous student"
                    className={`ad-btn-secondary flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F1] bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="min-w-[64px] text-center text-xs font-semibold text-slate-500">
                    {selectedIndex + 1} / {filteredStudents.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => stepStudent(1)}
                    disabled={selectedIndex >= filteredStudents.length - 1}
                    aria-label="Next student"
                    className={`ad-btn-secondary flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F1] bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : null
            }
          />
        </ModalOverlay>
      )}

      {/* ============ PAGE-LEVEL ANIMATIONS ============ */}
      <style jsx global>{`
        @keyframes skPageIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes skFadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes skFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes skFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes skModalIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes skModalOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(10px) scale(0.985); }
        }
        @keyframes skGrow {
          from { width: 0; }
        }
        @keyframes skGrowX {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes skShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes skPop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes adSheen {
          from { transform: translateX(-120%) skewX(-18deg); }
          to { transform: translateX(260%) skewX(-18deg); }
        }
        @keyframes adPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes adFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        /* "backwards" (not "both"): after the entrance finishes the element goes
           back to its normal style, so hover lift / transforms keep working. */
        .sk-page-in { animation: skPageIn 0.3s ease-out backwards; }
        .sk-fade-up { animation: skFadeUp 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .sk-row-in { animation: skFadeUp 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .sk-pop { animation: skPop 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .sk-overlay-in { animation: skFadeIn 0.2s ease-out both; }
        .sk-modal-in { animation: skModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .sk-grow { animation: skGrow 1s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .sk-grow-x { transform-origin: left; animation: skGrowX 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }

        [data-closing="true"].sk-overlay-in { animation: skFadeOut 0.16s ease-in both; }
        [data-closing="true"] .sk-modal-in { animation: skModalOut 0.16s ease-in both; }

        .sk-shimmer {
          background-color: #f6e9df;
          background-image: linear-gradient(90deg, #f6e9df 0%, #f6f8fc 50%, #f6e9df 100%);
          background-size: 800px 100%;
          background-repeat: no-repeat;
          animation: skShimmer 1.3s ease-in-out infinite;
        }

        /* ---------- SKCE buttons (same feel as My Courses) ---------- */
        .ad-btn-primary {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #FB923C 0%, #F97316 55%, #EA580C 100%);
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .ad-btn-primary::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: translateX(-120%) skewX(-18deg);
          pointer-events: none;
        }
        .ad-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(249, 115, 22, 0.35);
        }
        .ad-btn-primary:hover:not(:disabled)::after { animation: adSheen 0.7s ease; }
        .ad-btn-primary:active:not(:disabled) { transform: scale(0.98); }

        .ad-btn-secondary {
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.2s ease,
            border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }
        .ad-btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          background-color: #fff3ea;
          border-color: #bfd3f2;
          box-shadow: 0 6px 14px rgba(20, 89, 184, 0.12);
        }
        .ad-btn-secondary:active:not(:disabled) { transform: scale(0.98); }
        .ad-refresh-icon { transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .ad-btn-primary:hover .ad-refresh-icon { transform: rotate(180deg); }

        /* ---------- Cards / tiles ---------- */
        .ad-tile {
          transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .ad-tile:hover {
          transform: translateY(-4px);
          border-color: #ffd9bd;
          box-shadow: 0 14px 28px rgba(15, 47, 95, 0.12);
        }
        .ad-tile-icon { transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.2s ease; }
        .ad-tile:hover .ad-tile-icon { transform: scale(1.12) rotate(-6deg); }

        .ad-lift { transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease; }
        .ad-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(15, 47, 95, 0.1); }

        /* ---------- Table rows ---------- */
        .ad-row { transition: background-color 0.2s ease; }
        .ad-row:hover { background-color: #fff8f2; }
        .ad-row > td:first-child { box-shadow: inset 0 0 0 0 #F97316; transition: box-shadow 0.25s ease; }
        .ad-row:hover > td:first-child { box-shadow: inset 3px 0 0 0 #F97316; }
        .ad-row .ad-avatar { transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .ad-row:hover .ad-avatar { transform: scale(1.08); }

        .ad-eye { transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease; }
        .ad-eye:hover { transform: translateY(-2px); background-color: #fff3ea; border-color: #ffc999; color: #F97316; box-shadow: 0 6px 14px rgba(249, 115, 22, 0.18); }
        .ad-eye:active { transform: scale(0.95); }

        .ad-pkg { transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
        .ad-pkg:hover { transform: translateX(3px); background-color: #ffe2cf; border-color: #ffc999; box-shadow: 0 6px 14px rgba(20, 89, 184, 0.12); }

        .ad-live-dot { animation: adPulse 2s infinite; }

        .ad-hero { background-size: 220% 220%; animation: adFlow 14s ease-in-out infinite alternate; }
        .ad-hero::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #F97316 0%, #F97316 16%, transparent 16%);
        }

        @media (prefers-reduced-motion: reduce) {
          .sk-page-in,
          .sk-fade-up,
          .sk-row-in,
          .sk-pop,
          .sk-overlay-in,
          .sk-modal-in,
          .sk-grow,
          .sk-grow-x,
          .sk-shimmer,
          .ad-hero,
          .ad-live-dot {
            animation: none !important;
          }
          .ad-btn-primary,
          .ad-btn-secondary,
          .ad-tile,
          .ad-lift,
          .ad-row,
          .ad-eye,
          .ad-pkg {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}

/* =====================================================================
   OVERVIEW TAB
   ===================================================================== */

function OverviewTab({
  student,
  extras,
}: {
  student: Student;
  extras: ExtraField[];
}) {
  return (
    <div className="space-y-7">
      <section>
        <SectionTitle icon={<Users size={15} />} title="Personal information" />
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem icon={<Users size={16} />} label="Full Name" value={student.name} />
          <DetailItem icon={<UserCheck size={16} />} label="Student ID" value={student.id || "Not assigned"} copy={student.id} />
          <DetailItem icon={<Mail size={16} />} label="Email" value={student.email || "Not provided"} copy={student.email} />
          <DetailItem icon={<Phone size={16} />} label="Phone" value={student.phone || "Not provided"} copy={student.phone} />
          <DetailItem icon={<CalendarDays size={16} />} label="Date of Birth" value={student.dob ? formatDate(student.dob) : "Not provided"} />
          <DetailItem icon={<CalendarDays size={16} />} label="Joined Date" value={student.joinedDate} />
          <DetailItem icon={<MapPin size={16} />} label="State" value={student.state || "Not provided"} />
          <DetailItem icon={<FileText size={16} />} label="Referral ID" value={student.referralId || "Not provided"} copy={student.referralId} />
        </div>
      </section>

      {extras.length > 0 && (
        <section>
          <SectionTitle
            icon={<Info size={15} />}
            title="Additional registration details"
            hint="Everything else stored for this student"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {extras.map((field) => (
              <DetailItem
                key={field.label}
                icon={<FileText size={16} />}
                label={field.label}
                value={field.value}
              />
            ))}
          </div>
        </section>
      )}

      <ListSection title="Enrolled Courses" items={student.courses} emptyText="No courses enrolled." tone="orange" />
      <ListSection title="Enrolled Packages" items={student.packages} emptyText="No package enrolled." tone="blue" />
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <p className="flex items-center gap-2 text-sm font-bold text-[#0F2F5F]">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF3EA] text-[#F97316]">
          {icon}
        </span>
        {title}
      </p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
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
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressMetric label="Overall Progress" value={`${summary?.averageProgress ?? 0}%`} icon={<BarChart3 size={18} />} />
        <ProgressMetric label="Completed Courses" value={`${summary?.completedCourses ?? 0}/${summary?.totalCourses ?? 0}`} icon={<GraduationCap size={18} />} />
        <ProgressMetric label="Lessons Completed" value={`${summary?.completedLessons ?? 0}/${summary?.totalLessons ?? 0}`} icon={<CheckCircle2 size={18} />} />
        <ProgressMetric label="Certificates" value={summary?.totalCertificates ?? certificates.length} icon={<Award size={18} />} />
      </div>

      <section>
        <SectionTitle icon={<BarChart3 size={15} />} title="Course progress" hint="Calculated from actual lesson completion records" />

        {courses.length ? (
          <div className="space-y-3">
            {courses.map((course, index) => {
              const progress = Math.min(
                100,
                Math.max(0, Number(course.progressPercentage ?? course.progress ?? 0) || 0)
              );

              const title =
                course.courseTitle ||
                course.title ||
                course.course?.title ||
                `Course ${index + 1}`;

              const totalLessons = course.totalLessons ?? course.lessonCount ?? 0;
              const completedLessons = course.completedLessons ?? 0;

              const state =
                progress >= 100 ? "Completed" : progress > 0 ? "In progress" : "Not started";

              return (
                <div
                  key={course.id || `${title}-${index}`}
                  className="sk-row-in ad-lift rounded-2xl border border-[#E2E8F1] bg-white p-4 hover:border-[#FFC999]"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F2F5F]">{title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <ToneBadge text={state} />
                      <span className="w-12 text-right text-sm font-bold text-[#173B67]">{progress}%</span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E6ECF5]">
                    <div
                      className={`sk-grow h-full rounded-full ${
                        progress >= 100
                          ? "bg-gradient-to-r from-[#16A05D] to-[#22C176]"
                          : "bg-gradient-to-r from-[#173B67] to-[#173B67]"
                      }`}
                      style={{ width: `${progress}%`, animationDelay: `${Math.min(index, 8) * 60}ms` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyBox text="No course progress available yet." />
        )}
      </section>

      <section>
        <SectionTitle icon={<ClipboardList size={15} />} title="Assessments" />

        {assessments.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[#E2E8F1]">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="bg-[#F8FAFD] text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                  const submission = item.submission || item.latestSubmission || item;
                  const title = assessment.title || item.title || `Assessment ${index + 1}`;

                  return (
                    <tr key={item.id || assessment.id || index} className="border-t border-[#EDF1F7] transition-colors duration-200 hover:bg-[#FFF8F2]">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{title}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{assessment.course?.title || item.courseTitle || "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#0F2F5F]">
                        {submission.score ?? "—"}
                        {assessment.totalMarks ? ` / ${assessment.totalMarks}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <ToneBadge text={submission.status || "Not submitted"} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {submission.submittedAt ? formatDateTime(submission.submittedAt) : "—"}
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
        <SectionTitle icon={<Award size={15} />} title="Certificates & achievements" />

        {certificates.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {certificates.map((certificate, index) => (
              <div
                key={certificate.id || index}
                className="sk-row-in ad-lift rounded-2xl border border-[#FFD9BD] bg-[#FFF3EA]/60 p-4 hover:border-[#FFC999]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#F97316] shadow-sm">
                    <Award size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F2F5F]">{certificate.title || "Certificate"}</p>
                    <p className="mt-1 break-all text-[11px] text-slate-500">
                      {certificate.certificateNumber || "Certificate number unavailable"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">Issued {formatDateTime(certificate.issuedAt)}</p>
                  </div>
                </div>

                {certificate.certificateUrl && (
                  <a
                    href={certificate.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#173B67] transition-all duration-200 hover:gap-2 hover:text-[#F97316]"
                  >
                    View certificate <ChevronRight size={13} />
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
   ASSESSMENTS TAB
   ===================================================================== */

type AssessmentFilter = "ALL" | "QUIZ" | "ASSIGNMENT";

function parseAnswers(answers: unknown): Record<string, string> {
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
}

const normalizeAnswer = (value: unknown) =>
  String(value ?? "").trim().toUpperCase();

function AssessmentsTab({ assessments }: { assessments: any[] }) {
  const [openAssessmentId, setOpenAssessmentId] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<AssessmentFilter>("ALL");

  if (!assessments.length) {
    return <EmptyBox text="No assessments available for this student." />;
  }

  const typeOf = (assessment: any) =>
    String(assessment.type || assessment.assessment?.type || "ASSESSMENT").toUpperCase();

  const attemptedCount = assessments.filter((item) => {
    const attempts = Array.isArray(item.attempts) ? item.attempts : [];
    return attempts.length > 0 || item.attemptCount > 0;
  }).length;

  const visible = assessments.filter(
    (item) => filter === "ALL" || typeOf(item) === filter
  );

  const filterOptions: Array<[AssessmentFilter, string]> = [
    ["ALL", `All (${assessments.length})`],
    ["QUIZ", `Quizzes (${assessments.filter((a) => typeOf(a) === "QUIZ").length})`],
    ["ASSIGNMENT", `Assignments (${assessments.filter((a) => typeOf(a) === "ASSIGNMENT").length})`],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <AssessmentInfo label="Total assessments" value={String(assessments.length)} />
        <AssessmentInfo label="Attempted" value={`${attemptedCount} / ${assessments.length}`} />
        <AssessmentInfo label="Not attempted" value={String(assessments.length - attemptedCount)} />
      </div>

      <div role="group" aria-label="Filter assessments" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-1">
        {filterOptions.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`h-8 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-all duration-200 ${FOCUS} ${
              filter === value ? "bg-[#173B67] text-white shadow-[0_6px_14px_rgba(20,89,184,0.25)]" : "text-slate-500 hover:bg-white hover:text-[#173B67]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && <EmptyBox text="No assessments of this type." />}

      {visible.map((assessment, index) => {
        const key = String(assessment.assessmentId ?? assessment.id ?? index);
        const attempts = Array.isArray(assessment.attempts) ? assessment.attempts : [];
        const isOpen = openAssessmentId === key;
        const attemptIndex = selectedAttempt[key] ?? Math.max(attempts.length - 1, 0);
        const attempt = attempts[attemptIndex] ?? null;
        const answers = parseAnswers(attempt?.answers);
        const title = assessment.title || assessment.assessment?.title || `Assessment ${index + 1}`;
        const courseTitle =
          assessment.courseTitle ||
          assessment.course?.title ||
          assessment.assessment?.course?.title ||
          "—";
        const type = typeOf(assessment);
        const totalMarks = assessment.totalMarks ?? assessment.assessment?.totalMarks ?? null;
        const questions = Array.isArray(assessment.questions) ? assessment.questions : [];
        const status = attempt?.status || assessment.submissionStatus || "NOT_ATTEMPTED";

        const correctCount =
          type === "QUIZ"
            ? questions.filter((question: any, questionIndex: number) => {
                const selected = normalizeAnswer(
                  answers[String(question.id)] ?? answers[question.id] ?? answers[String(questionIndex)] ?? answers[questionIndex]
                );
                return selected && selected === normalizeAnswer(question.correctAnswer);
              }).length
            : 0;

        return (
          <section
            key={key}
            className={`sk-row-in overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
              isOpen
                ? "border-[#FFC999] shadow-[0_10px_24px_rgba(15,47,95,0.08)]"
                : "border-[#E2E8F1] hover:border-[#FFC999] hover:shadow-sm"
            }`}
            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenAssessmentId(isOpen ? null : key)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors duration-200 hover:bg-[#FFF8F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316]/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-[#0F2F5F]">{title}</h3>
                  <span className="rounded-md bg-[#FFF3EA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#EA580C]">{type}</span>
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
                <ToneBadge text={String(status).replace(/_/g, " ")} />
                <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-[#F97316]" : "text-slate-400"}`} />
              </div>
            </button>

            {/* animated expand */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                {isOpen && (
                  <div className="border-t border-[#EDF1F7] p-4">
                    {attempts.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {attempts.map((item: any, attemptIdx: number) => (
                          <button
                            key={item.id ?? attemptIdx}
                            type="button"
                            onClick={() => setSelectedAttempt((current) => ({ ...current, [key]: attemptIdx }))}
                            className={`h-9 rounded-xl px-3.5 text-xs font-bold transition-all duration-200 ${FOCUS} ${
                              attemptIdx === attemptIndex
                                ? "bg-[#0F2F5F] text-white shadow-sm"
                                : "border border-[#E2E8F1] bg-white text-slate-600 hover:-translate-y-px hover:border-[#FFC999] hover:bg-[#FFF3EA] hover:text-[#173B67]"
                            }`}
                          >
                            Attempt {item.attemptNumber ?? attemptIdx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {attempt ? (
                      <div key={attemptIndex} className="sk-fade-up space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <AssessmentInfo label="Attempt" value={String(attempt.attemptNumber ?? attemptIndex + 1)} />
                          <AssessmentInfo label="Score" value={`${attempt.score ?? "—"}${totalMarks ? ` / ${totalMarks}` : ""}`} />
                          <AssessmentInfo label="Status" value={String(attempt.status ?? "—").replace(/_/g, " ")} />
                          <AssessmentInfo label="Submitted" value={attempt.submittedAt ? formatDateTime(attempt.submittedAt) : "Not submitted"} />
                        </div>

                        {attempt.feedback && (
                          <div className="rounded-xl border border-[#FFD9BD] bg-[#FFF3EA] p-3">
                            <p className="text-xs font-bold text-[#0F2F5F]">Feedback</p>
                            <p className="mt-1 text-sm text-[#173B67]">{attempt.feedback}</p>
                          </div>
                        )}

                        {attempt.submissionComment && (
                          <div className="rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-3">
                            <p className="text-xs font-bold text-slate-600">Student Comment</p>
                            <p className="mt-1 text-sm text-slate-600">{attempt.submissionComment}</p>
                          </div>
                        )}

                        {attempt.submissionFileName && (
                          <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-3">
                            <FileText size={18} className="shrink-0 text-[#F97316]" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-600">Assignment File</p>
                              <p className="mt-0.5 break-all text-sm text-slate-700">{attempt.submissionFileName}</p>
                            </div>
                          </div>
                        )}

                        {type === "QUIZ" && questions.length > 0 ? (
                          <div>
                            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-[#0F2F5F]">Quiz Answers</p>
                                <p className="mt-0.5 text-xs text-slate-400">Selected answers are compared with the stored correct answers.</p>
                              </div>
                              <span className="sk-pop rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                {correctCount} / {questions.length} correct
                              </span>
                            </div>

                            <div className="space-y-3">
                              {questions.map((question: any, questionIndex: number) => {
                                const selected = normalizeAnswer(
                                  answers[String(question.id)] ?? answers[question.id] ?? answers[String(questionIndex)] ?? answers[questionIndex]
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
                                  <div
                                    key={question.id ?? questionIndex}
                                    className="sk-row-in rounded-xl border border-[#E2E8F1] p-4 transition-colors duration-200 hover:border-[#FFC999]"
                                    style={{ animationDelay: `${Math.min(questionIndex, 8) * 40}ms` }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0F2F5F]/5 text-xs font-bold text-[#0F2F5F]">
                                        {questionIndex + 1}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-700">{question.question}</p>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                          {options.map(([letter, option]) =>
                                            option ? (
                                              <div
                                                key={letter}
                                                className={`rounded-lg border px-3 py-2 text-xs transition-colors duration-200 ${
                                                  correct === letter
                                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                    : selected === letter
                                                      ? "border-red-300 bg-red-50 text-red-800"
                                                      : "border-[#E2E8F1] bg-[#F8FAFD] text-slate-600"
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
                          <div className="rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-4">
                            <p className="text-sm font-semibold text-slate-600">
                              {type === "QUIZ"
                                ? "No quiz questions are available for this assessment."
                                : "Assignment submission details are shown above."}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#CBD6E6] p-6 text-center">
                        <p className="text-sm font-semibold text-slate-600">This assessment has not been attempted yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AssessmentInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="ad-lift rounded-xl border border-[#EDF1F7] bg-[#F8FAFD] p-3 hover:border-[#FFC999]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0F2F5F]">{value}</p>
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
        const course = enrollment.course?.title || enrollment.courseTitle || "Course enrollment";
        const pkg = enrollment.package?.title || enrollment.packageTitle;
        const packageCourses: string[] = Array.isArray(enrollment.package?.courses)
          ? enrollment.package.courses
              .map((item: any) => item?.course?.title)
              .filter((title: unknown): title is string => typeof title === "string" && title.trim() !== "")
          : [];

        return (
          <div
            key={enrollment.id || index}
            className="sk-row-in ad-lift rounded-2xl border border-[#E2E8F1] bg-white p-4 hover:border-[#FFC999]"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EA] text-[#F97316]">
                  {pkg ? <Package size={19} /> : <GraduationCap size={19} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F2F5F]">{pkg || course}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{pkg ? "Package enrollment" : "Course enrollment"}</p>
                </div>
              </div>

              <ToneBadge text={enrollment.status || "Active"} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoValue label="Course" value={course} />
              <InfoValue label="Enrolled" value={enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : "—"} />
              <InfoValue label="Completed" value={enrollment.completedAt ? formatDate(enrollment.completedAt) : "Not completed"} />
            </div>

            {packageCourses.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Courses in this package
                </p>
                <div className="flex flex-wrap gap-2">
                  {packageCourses.map((title) => (
                    <span key={title} className="rounded-lg bg-[#FFF3EA] px-3 py-1.5 text-xs font-semibold text-[#0F2F5F] transition-colors duration-200 hover:bg-[#ffe2cf]">
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

  const paid = payments.filter((payment) => isPaidStatus(payment.status));
  const paidTotal = paid.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const currency = payments[0]?.currency || "INR";
  const failed = payments.filter((payment) =>
    /(FAILED|REJECTED|CANCEL|EXPIRED)/i.test(String(payment.status ?? ""))
  ).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <AssessmentInfo label="Total paid" value={formatMoney(paidTotal, currency)} />
        <AssessmentInfo label="Successful payments" value={`${paid.length} of ${payments.length}`} />
        <AssessmentInfo label="Failed / cancelled" value={String(failed)} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-[#E2E8F1] md:block">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-[#F8FAFD] text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                className="sk-row-in border-t border-[#EDF1F7] transition-colors duration-200 hover:bg-[#FFF8F2]"
                style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
              >
                <td className="px-4 py-4 text-sm font-bold text-[#0F2F5F]">{formatMoney(payment.amount, payment.currency)}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{payment.method || "—"}</td>
                <td className="px-4 py-4"><ToneBadge text={payment.status || "—"} /></td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="break-all">{payment.providerPaymentId || payment.providerOrderId || "—"}</span>
                    {(payment.providerPaymentId || payment.providerOrderId) && (
                      <CopyButton value={String(payment.providerPaymentId || payment.providerOrderId)} label="Copy payment ID" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">{formatDateTime(payment.paidAt || payment.createdAt || "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {payments.map((payment, index) => (
          <div
            key={payment.id || index}
            className="sk-row-in rounded-2xl border border-[#E2E8F1] p-4"
            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-bold text-[#0F2F5F]">{formatMoney(payment.amount, payment.currency)}</p>
              <ToneBadge text={payment.status || "—"} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-400">Method</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{payment.method || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Date</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{formatDateTime(payment.paidAt || payment.createdAt || "")}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Payment ID</dt>
                <dd className="mt-0.5 break-all font-medium text-slate-700">{payment.providerPaymentId || payment.providerOrderId || "—"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   SHARED UI PIECES
   ===================================================================== */

function Avatar({ name, src }: { name: string; src?: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={`${name} profile`}
        className="ad-avatar h-10 w-10 shrink-0 rounded-full border border-[#E2E8F1] object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`ad-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarTone(name)}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "ad-live-dot bg-emerald-500" : "bg-red-500"
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
    tone = "bg-[#FFF3EA] text-[#EA580C]";
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
          className={`ad-pkg flex w-full items-start gap-2 rounded-xl border border-[#FFD9BD] bg-[#FFF3EA]/70 px-3 py-2.5 text-left ${FOCUS}`}
          title="Click to view courses in this package"
        >
          <Package size={15} className="mt-0.5 shrink-0 text-[#173B67]" />
          <span className="text-xs font-semibold leading-4 text-[#0F2F5F]">
            {pkg}
          </span>
        </button>
      ))}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="sk-fade-up rounded-2xl border border-dashed border-[#CBD6E6] bg-[#FAFBFE] p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3EA] text-[#173B67] shadow-sm">
        <Inbox size={20} />
      </div>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function SortableTableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  filter,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  filter: ReactNode;
}) {
  const active = activeSortKey === sortKey;

  return (
    <th
      className="px-3 py-3.5 text-left align-top"
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <div className="flex min-w-[110px] flex-col items-stretch gap-2.5">
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={`inline-flex min-h-4 items-center gap-1.5 self-start rounded text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 ${FOCUS} ${
            active
              ? "text-[#EA580C]"
              : "text-slate-400 hover:text-[#F97316]"
          }`}
        >
          <span>{label}</span>
          {active ? (
            direction === "asc" ? (
              <ChevronUp size={14} className="text-[#F97316]" />
            ) : (
              <ChevronDown size={14} className="text-[#F97316]" />
            )
          ) : (
            <ChevronsUpDown size={13} className="text-slate-300" />
          )}
        </button>
        {filter}
      </div>
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
  return (
    <td className="px-4 py-4 align-top text-sm text-slate-600">{children}</td>
  );
}

function TableFilterSelect({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label={placeholder}
      className="h-9 w-full min-w-0 rounded-lg border border-[#E2E8F1] bg-white px-2 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none transition duration-200 hover:border-[#FFC999] focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/15 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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
    <select
      value={value}
      aria-label="Filter by status"
      onChange={(e) => onChange(e.target.value as "All" | StudentStatus)}
      className="h-9 w-full min-w-0 rounded-lg border border-[#E2E8F1] bg-white px-2 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none transition duration-200 hover:border-[#FFC999] focus:border-[#173B67] focus:bg-white focus:ring-2 focus:ring-[#173B67]/15"
    >
      <option value="All">All statuses</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  );
}


function ProgressMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="ad-tile rounded-2xl border border-[#E2E8F1] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="ad-tile-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EA] text-[#173B67]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-[#0F2F5F]">{value}</p>
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
      ? "bg-[#FFF3EA] text-[#EA580C] hover:bg-[#FFE3CD]"
      : "bg-[#FFF3EA] text-[#0F2F5F] hover:bg-[#ffe2cf]";

  return (
    <section>
      <SectionTitle
        icon={tone === "orange" ? <GraduationCap size={15} /> : <Package size={15} />}
        title={title}
        hint={items.length ? `${items.length} total` : undefined}
      />

      <div className="rounded-xl border border-[#E2E8F1] p-4">
        {items.length ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span key={item} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-px ${styles}`}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function InfoValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#EDF1F7] bg-[#F8FAFD] p-3 transition-colors duration-200 hover:border-[#FFC999]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
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
  selected,
  onClick,
}: {
  title: string;
  value: number;
  description: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  tone: "blue" | "green" | "orange";
  loading: boolean;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const tones = {
    blue: { box: "bg-[#FFF3EA]", icon: "text-[#173B67]", ring: "ring-[#F97316]/45", bar: "from-[#F97316] to-[#FF9A3D]" },
    green: { box: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-300", bar: "from-emerald-500 to-emerald-400" },
    orange: { box: "bg-[#FFF3EA]", icon: "text-[#F97316]", ring: "ring-[#F97316]/40", bar: "from-[#F97316] to-[#FFA24D]" },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={`Show ${title.toLowerCase()}`}
      className={`sk-fade-up ad-tile group relative overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,47,95,0.04)] ${FOCUS} ${
        selected ? `ring-2 ${tones.ring} border-[#F97316]/40` : ""
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tones.bar} transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div className="sk-shimmer mt-3 h-8 w-16 rounded" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F2F5F]">
              <CountUp end={value} duration={900} />
            </p>
          )}

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className={`ad-tile-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones.box}`}>
          <Icon size={21} className={tones.icon} />
        </div>
      </div>
    </button>
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

  const base = `flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all duration-200 ${FOCUS}`;

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${base} border border-[#E2E8F1] bg-white text-slate-600 hover:-translate-y-px hover:border-[#FFC999] hover:bg-[#FFF3EA] hover:text-[#173B67] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
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
                ? "bg-[#173B67] text-white shadow-[0_6px_14px_rgba(20,89,184,0.25)]"
                : "border border-[#E2E8F1] bg-white text-slate-600 hover:-translate-y-px hover:border-[#FFC999] hover:bg-[#FFF3EA] hover:text-[#173B67]"
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
        className={`${base} border border-[#E2E8F1] bg-white text-slate-600 hover:-translate-y-px hover:border-[#FFC999] hover:bg-[#FFF3EA] hover:text-[#173B67] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

/* ---------- Modal system ---------- */

const ModalCloseContext = createContext<() => void>(() => undefined);

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function ModalOverlay({
  children,
  onClose,
  label,
  size = "lg",
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  size?: "md" | "lg" | "xl";
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(() => onCloseRef.current(), 160);
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog.
    dialogRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
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
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, [requestClose]);

  const width =
    size === "xl" ? "max-w-5xl" : size === "md" ? "max-w-2xl" : "max-w-3xl";

  return (
    <ModalCloseContext.Provider value={requestClose}>
      <div
        data-closing={closing}
        className="sk-overlay-in fixed inset-0 z-[1000] flex items-end justify-center bg-[#0F2F5F]/55 backdrop-blur-sm sm:items-center sm:p-4"
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
          className={`sk-modal-in flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_28px_70px_rgba(15,47,95,0.35)] outline-none sm:rounded-2xl`}
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
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#EDF1F7] px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EA] text-[#F97316]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-[#0F2F5F] sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className={`group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F4F9] text-slate-500 transition-all duration-200 hover:bg-[#FFF3EA] hover:text-[#F97316] ${FOCUS}`}
      >
        <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
      </button>
    </div>
  );
}

/** Close button for the dark profile hero. */
function ModalCloseX() {
  const close = useContext(ModalCloseContext);

  return (
    <button
      type="button"
      onClick={close}
      aria-label="Close"
      className={`group absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-200 hover:bg-white/20 ${FOCUS}`}
    >
      <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
    </button>
  );
}

function ModalFooter({ left }: { left?: ReactNode }) {
  const close = useContext(ModalCloseContext);

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#EDF1F7] bg-[#FBFCFE] px-5 py-3.5 sm:px-6">
      <div>{left}</div>
      <button
        type="button"
        onClick={close}
        className={`ad-btn-secondary inline-flex h-10 items-center justify-center rounded-xl border border-[#E2E8F1] bg-white px-5 text-sm font-semibold text-[#173B67] ${FOCUS}`}
      >
        Close
      </button>
    </div>
  );
}

/* ---------- Small helpers ---------- */

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

  const copy = async (event: ReactMouseEvent) => {
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
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-150 ${FOCUS} ${
        copied ? "sk-pop text-emerald-500" : "text-slate-400 hover:bg-slate-100 hover:text-[#F97316]"
      } ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function HeroChip({
  icon,
  text,
  copy,
}: {
  icon: ReactNode;
  text: string;
  copy?: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-white/10 py-1 pl-2.5 pr-1.5 backdrop-blur transition-colors duration-200 hover:bg-white/15">
      {icon}
      <span className="truncate">{text}</span>
      {copy ? (
        <CopyButton value={copy} label="Copy" className="!text-blue-100 hover:!bg-white/15 hover:!text-white" />
      ) : (
        <span className="w-1" />
      )}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 backdrop-blur transition-all duration-200 hover:-translate-y-px hover:bg-white/15">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/70">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold text-white sm:text-lg">{value}</p>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
  copy,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  copy?: string;
}) {
  return (
    <div className="ad-lift group rounded-xl border border-[#E2E8F1] p-4 hover:border-[#FFC999] hover:bg-[#F8FAFE]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="text-[#F97316]/70 transition-colors duration-200 group-hover:text-[#F97316]">{icon}</span>
          {label}
        </div>
        {copy ? (
          <CopyButton value={copy} label={`Copy ${label.toLowerCase()}`} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100" />
        ) : null}
      </div>
      <p className="mt-2 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
