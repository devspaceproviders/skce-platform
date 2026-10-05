"use client";



import { useEffect, useMemo, useState } from "react";

import {

  AlertCircle,

  Award,

  BarChart3,

  CalendarDays,

  CheckCircle2,

  ChevronDown,

  ChevronUp,

  ClipboardList,

  Eye,

  GraduationCap,

  Mail,

  MapPin,

  Package,

  Phone,

  RefreshCw,

  Search,

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



type StudentTab = "overview" | "progress" | "assessments" | "enrollments" | "payments";



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



export default function StudentsPage() {

  const [students, setStudents] = useState<Student[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [loadError, setLoadError] = useState("");



  const [search, setSearch] = useState("");

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({

    student: "",

    studentId: "",

    phone: "",

    package: "",

    joined: "",

    status: "All",

  });



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

  }, [

    students,

    search,

    columnFilters,

    sortKey,

    sortDirection,

  ]);



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



  return (

    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1550px]">

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">

              Student Management

            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">

              Students

            </h1>

            <p className="mt-1 text-sm text-slate-500">

              Registered students from the SKCE database.

            </p>

          </div>



          <button

            type="button"

            onClick={() => void loadStudents(true)}

            disabled={isRefreshing || isLoading}

            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"

          >

            <RefreshCw

              size={17}

              className={isRefreshing ? "animate-spin" : ""}

            />

            {isRefreshing ? "Refreshing..." : "Refresh Students"}

          </button>

        </div>



        <div className="mb-7 grid gap-4 sm:grid-cols-3">

          <SummaryCard

            title="Total Students"

            value={students.length}

            icon={Users}

            description="Registered in database"

          />

          <SummaryCard

            title="Active Students"

            value={activeCount}

            icon={Users}

            description="Currently active"

          />

          <SummaryCard

            title="Inactive Students"

            value={inactiveCount}

            icon={Users}

            description="Currently inactive"

          />

        </div>



        {loadError && (

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

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

            <button

              type="button"

              onClick={() => void loadStudents(true)}

              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"

            >

              Retry

            </button>

          </div>

        )}



        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

            <div className="relative w-full sm:max-w-xl">

              <Search

                size={18}

                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

              />

              <input

                type="text"

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                placeholder="Search all student details..."

                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"

              />

            </div>



            <button

              type="button"

              onClick={() => {

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

              }}

              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"

            >

              Clear Filters

            </button>

          </div>



          {isLoading ? (

            <div className="px-6 py-20 text-center">

              <RefreshCw

                size={28}

                className="mx-auto animate-spin text-orange-500"

              />

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">

                Loading registered students...

              </h3>

              <p className="mt-2 text-sm text-slate-500">

                Fetching student records from the database.

              </p>

            </div>

          ) : filteredStudents.length === 0 ? (

            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">

                <Users size={28} className="text-orange-500" />

              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">

                {students.length === 0

                  ? "No registered students found"

                  : "No students match your search"}

              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                {students.length === 0

                  ? "Students will appear here automatically after they register through the SKCE registration process."

                  : "Try changing your search text or status filter."}

              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

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

                  {filteredStudents.map((student) => (

                    <tr

                      key={student.userId || student.id}

                      className="border-t border-slate-100 transition hover:bg-slate-50/60"

                    >

                      <TableCell>

                        <div className="flex min-w-[230px] items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-sm font-bold text-white">

                            {student.name.charAt(0).toUpperCase()}

                          </div>

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

                          {student.packages.length > 0 ? (

                            <div className="space-y-2">

                              {student.packages.map((pkg) => (

                                <button

                                  key={pkg}

                                  type="button"

                                  onClick={() =>

                                    void openPackageCourses(student, pkg)

                                  }

                                  className="flex w-full items-start gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-left transition hover:border-violet-300 hover:bg-violet-100"

                                  title="Click to view courses in this package"

                                >

                                  <Package

                                    size={15}

                                    className="mt-0.5 shrink-0 text-violet-600"

                                  />

                                  <span className="text-xs font-semibold leading-4 text-violet-700">

                                    {pkg}

                                  </span>

                                </button>

                              ))}

                            </div>

                          ) : (

                            <span className="text-xs text-slate-400">

                              No package

                            </span>

                          )}

                        </div>

                      </TableCell>



                      <TableCell>

                        <span className="whitespace-nowrap">

                          {student.joinedDate}

                        </span>

                      </TableCell>



                      <TableCell>

                        <span

                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${

                            student.status === "Active"

                              ? "bg-emerald-50 text-emerald-700"

                              : "bg-red-50 text-red-700"

                          }`}

                        >

                          {student.status}

                        </span>

                      </TableCell>



                      <TableCell>

                        <button

                          type="button"

                          title="View student details"

                          onClick={() => openViewModal(student)}

                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"

                        >

                          <Eye size={16} />

                        </button>

                      </TableCell>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>



        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">

          <p className="text-xs font-semibold text-blue-800">

            Registered Students Only

          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700/80">

            This page is read-only for student registration. Student records

            shown here come directly from the SKCE database. Students are

            created through the normal registration process, not manually from

            the Admin portal.

          </p>

        </div>

      </div>



      {selectedPackage && (

        <ModalOverlay

          onClose={() => {

            setSelectedPackage(null);

            setPackageError("");

          }}

        >

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <ModalHeader

              title={selectedPackage.title}

              subtitle="Courses included in this registered package."

              onClose={() => {

                setSelectedPackage(null);

                setPackageError("");

              }}

            />



            <div className="p-6">

              {isPackageLoading ? (

                <div className="py-10 text-center">

                  <RefreshCw

                    size={26}

                    className="mx-auto animate-spin text-violet-600"

                  />

                  <p className="mt-4 text-sm font-semibold text-[#173B67]">

                    Loading package courses...

                  </p>

                </div>

              ) : packageError ? (

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                  <p className="text-sm font-semibold text-red-800">

                    Unable to load package courses

                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">

                    {packageError}

                  </p>

                </div>

              ) : selectedPackage.courses.length === 0 ? (

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">

                  <Package

                    size={28}

                    className="mx-auto text-violet-500"

                  />

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

                        className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3"

                      >

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">

                          <Users size={15} className="text-orange-500" />

                        </div>

                        <span className="text-sm font-semibold text-orange-700">

                          {course}

                        </span>

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </div>



            <div className="flex justify-end border-t border-slate-100 px-6 py-4">

              <button

                type="button"

                onClick={() => {

                  setSelectedPackage(null);

                  setPackageError("");

                }}

                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"

              >

                Close

              </button>

            </div>

          </div>

        </ModalOverlay>

      )}



      {showViewModal && selectedStudent && (

        <ModalOverlay onClose={closeViewModal}>

          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader

              title="Student Details"

              subtitle="Student profile, progress, enrollments and payments."

              onClose={closeViewModal}

            />



            <div className="p-6">

              <div className="mb-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xl font-bold text-white">

                  {selectedStudent.name.charAt(0).toUpperCase()}

                </div>

                <div className="min-w-0">

                  <h3 className="truncate text-lg font-bold text-[#173B67]">

                    {selectedStudent.name}

                  </h3>

                  <p className="mt-0.5 text-sm text-slate-500">

                    {selectedStudent.id || "Student ID not assigned"}

                  </p>

                </div>

                <span

                  className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${

                    selectedStudent.status === "Active"

                      ? "bg-emerald-50 text-emerald-700"

                      : "bg-red-50 text-red-700"

                  }`}

                >

                  {selectedStudent.status}

                </span>

              </div>



              <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-100 pb-2">

                {(

                  [

                    ["overview", "Overview", Users],

                    ["progress", "Progress", BarChart3],

                    ["assessments", "Assessments", ClipboardList],

                    ["enrollments", "Enrollments", GraduationCap],

                    ["payments", "Payments", Package],

                  ] as const

                ).map(([tab, label, Icon]) => (

                  <button

                    key={tab}

                    type="button"

                    onClick={() => setActiveStudentTab(tab)}

                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${

                      activeStudentTab === tab

                        ? "bg-[#173B67] text-white"

                        : "text-slate-500 hover:bg-slate-50 hover:text-[#173B67]"

                    }`}

                  >

                    <Icon size={16} />

                    {label}

                  </button>

                ))}

              </div>



              {isStudentLoading ? (

                <div className="py-16 text-center">

                  <RefreshCw

                    size={30}

                    className="mx-auto animate-spin text-orange-500"

                  />

                  <p className="mt-4 text-sm font-semibold text-[#173B67]">

                    Loading student details...

                  </p>

                </div>

              ) : studentLoadError ? (

                <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                  <p className="text-sm font-semibold text-red-800">

                    Unable to load student details

                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">

                    {studentLoadError}

                  </p>

                </div>

              ) : (

                <>

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

                </>

              )}

            </div>



            <div className="flex justify-end border-t border-slate-100 px-6 py-4">

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

    </main>

  );

}




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
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenAssessmentId(isOpen ? null : key)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-[#173B67]">{title}</h3>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-600">
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
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                  {String(status).replaceAll("_", " ")}
                </span>
                {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 p-4">
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
                        className={`rounded-xl px-3 py-2 text-xs font-bold ${
                          attemptIdx === attemptIndex
                            ? "bg-[#173B67] text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
                        <p className="mt-1 text-sm text-slate-700">{attempt.submissionFileName}</p>
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
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
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
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
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
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#173B67]">{value}</p>
    </div>
  );
}

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

        tone="violet"

      />

    </div>

  );

}



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

    <div className="space-y-6">

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

          <p className="text-sm font-semibold text-slate-700">

            Course Progress

          </p>

          <p className="mt-0.5 text-xs text-slate-400">

            Calculated from actual lesson completion records.

          </p>

        </div>



        {courses.length ? (

          <div className="space-y-3">

            {courses.map((course, index) => {

              const progress = Number(

                course.progressPercentage ??

                  course.progress ??

                  0

              );

              const title =

                course.courseTitle ||

                course.title ||

                course.course?.title ||

                `Course ${index + 1}`;

              const totalLessons =

                course.totalLessons ??

                course.lessonCount ??

                0;

              const completedLessons =

                course.completedLessons ??

                0;



              return (

                <div

                  key={course.id || `${title}-${index}`}

                  className="rounded-2xl border border-slate-200 p-4"

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

                      className="h-full rounded-full bg-orange-500"

                      style={{

                        width: `${Math.min(

                          100,

                          Math.max(0, progress)

                        )}%`,

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

          <p className="text-sm font-semibold text-slate-700">

            Assessments

          </p>

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

                  const assessment =

                    item.assessment || item;

                  const submission =

                    item.submission ||

                    item.latestSubmission ||

                    item;

                  const title =

                    assessment.title ||

                    item.title ||

                    `Assessment ${index + 1}`;



                  return (

                    <tr

                      key={item.id || assessment.id || index}

                      className="border-t border-slate-100"

                    >

                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">

                        {title}

                      </td>

                      <td className="px-4 py-3 text-sm text-slate-500">

                        {assessment.course?.title ||

                          item.courseTitle ||

                          "—"}

                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-[#173B67]">

                        {submission.score ?? "—"}

                        {assessment.totalMarks

                          ? ` / ${assessment.totalMarks}`

                          : ""}

                      </td>

                      <td className="px-4 py-3">

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">

                          {submission.status || "Not submitted"}

                        </span>

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

                className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"

              >

                <div className="flex items-start gap-3">

                  <Award

                    size={22}

                    className="mt-1 text-amber-600"

                  />

                  <div>

                    <p className="text-sm font-semibold text-amber-800">

                      {certificate.title || "Certificate"}

                    </p>

                    <p className="mt-1 text-[11px] text-amber-700/70">

                      {certificate.certificateNumber ||

                        "Certificate number unavailable"}

                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">

                      Issued{" "}

                      {formatDateTime(certificate.issuedAt)}

                    </p>

                  </div>

                </div>



                {certificate.certificateUrl && (

                  <a

                    href={certificate.certificateUrl}

                    target="_blank"

                    rel="noreferrer"

                    className="mt-3 inline-flex text-xs font-semibold text-[#173B67] hover:text-orange-600"

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

        const pkg =

          enrollment.package?.title ||

          enrollment.packageTitle;



        return (

          <div

            key={enrollment.id || index}

            className="rounded-2xl border border-slate-200 p-4"

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



              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

                {enrollment.status || "Active"}

              </span>

            </div>



            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              <InfoValue

                label="Course"

                value={course}

              />

              <InfoValue

                label="Enrolled"

                value={

                  enrollment.enrolledAt

                    ? formatDate(enrollment.enrolledAt)

                    : "—"

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

              className="border-t border-slate-100"

            >

              <td className="px-4 py-4 text-sm font-bold text-[#173B67]">

                {payment.currency || "INR"}{" "}

                {payment.amount ?? "—"}

              </td>

              <td className="px-4 py-4 text-sm text-slate-600">

                {payment.method || "—"}

              </td>

              <td className="px-4 py-4">

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">

                  {payment.status || "—"}

                </span>

              </td>

              <td className="px-4 py-4 text-xs text-slate-500">

                {payment.providerPaymentId ||

                  payment.providerOrderId ||

                  "—"}

              </td>

              <td className="px-4 py-4 text-xs text-slate-500">

                {formatDateTime(

                  payment.paidAt || payment.createdAt || ""

                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

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

    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">

          {icon}

        </div>

        <div>

          <p className="text-xs font-medium text-slate-400">

            {label}

          </p>

          <p className="mt-1 text-xl font-bold text-[#173B67]">

            {value}

          </p>

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

  tone: "orange" | "violet";

}) {

  const styles =

    tone === "orange"

      ? "bg-orange-50 text-orange-600"

      : "bg-violet-50 text-violet-700";



  return (

    <div className="mt-6">

      <p className="mb-3 text-sm font-semibold text-slate-700">

        {title}

      </p>



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

    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">

        {label}

      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">

        {value}

      </p>

    </div>

  );

}



function EmptyBox({ text }: { text: string }) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">

      {text}

    </div>

  );

}



function SummaryCard({

  title,

  value,

  description,

  icon: Icon,

}: {

  title: string;

  value: number;

  description: string;

  icon: React.ComponentType<{

    size?: number | string;

    className?: string;

  }>;

}) {

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



        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-orange-100">

          <Icon size={21} className="text-orange-500" />

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

    <th className="px-4 py-3.5 text-left">

      <button

        type="button"

        onClick={() => onSort(sortKey)}

        className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition ${

          active

            ? "text-orange-600"

            : "text-slate-400 hover:text-orange-500"

        }`}

      >

        <span>{label}</span>

        <span

          className={`text-[12px] ${

            active ? "text-orange-500" : "text-slate-300"

          }`}

        >

          {active

            ? direction === "asc"

              ? "▲"

              : "▼"

            : "↕"}

        </span>

      </button>

    </th>

  );

}



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



function TableCell({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <td className="px-4 py-4 align-top text-sm text-slate-600">

      {children}

    </td>

  );

}



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

    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

      <div>

        <h2 className="text-xl font-bold text-[#173B67]">

          {title}

        </h2>

        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

      </div>



      <button

        type="button"

        onClick={onClose}

        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-500"

      >

        <X size={18} />

      </button>

    </div>

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

    <td className="px-3 py-2">

      <input

        type="text"

        value={value}

        disabled={disabled}

        onChange={(e) => onChange(e.target.value)}

        placeholder={placeholder}

        className="w-full min-w-[120px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"

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

    <td className="px-3 py-2">

      <select

        value={value}

        onChange={(e) =>

          onChange(e.target.value as "All" | StudentStatus)

        }

        className="w-full min-w-[105px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"

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

    <div className="rounded-xl border border-slate-200 p-4">

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">

        {icon}

        {label}

      </div>

      <p className="mt-2 break-words text-sm font-medium text-slate-800">

        {value}

      </p>

    </div>

  );

}
