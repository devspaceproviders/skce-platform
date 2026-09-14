"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  X,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Monitor,
  GraduationCap,
} from "lucide-react";

type CourseStatus = "Active" | "Inactive";

type Course = {
  id: string;
  name: string;
  description: string;
  duration: string;
  mode: string;
  fees: number;
  modules: string[];
  students: number;
  status: CourseStatus;
};

type CourseForm = {
  name: string;
  description: string;
  duration: string;
  mode: string;
  fees: string;
  modules: string;
  status: CourseStatus;
};

/* ============================================================
   COURSE DATA
============================================================ */

const INITIAL_COURSES: Course[] = [
  {
    id: "C001",
    name: "Computer Basics",
    description:
      "Fundamental computer knowledge for beginners.",
    duration: "1 Month",
    mode: "Online & Offline",
    fees: 1500,
    modules: [
      "Computer Fundamentals",
      "Windows Basics",
      "Internet Basics",
      "File Management",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C002",
    name: "Typing Course - Basics",
    description:
      "Build typing speed and accuracy from the basics.",
    duration: "1 Month",
    mode: "Online & Offline",
    fees: 1000,
    modules: [
      "Keyboard Basics",
      "Typing Practice",
      "Speed Building",
      "Accuracy",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C003",
    name: "MS Office",
    description:
      "Practical training in Microsoft Office applications.",
    duration: "2 Months",
    mode: "Online & Offline",
    fees: 3000,
    modules: [
      "MS Word",
      "MS Excel",
      "MS PowerPoint",
      "MS Outlook",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C004",
    name: "DCA",
    description:
      "Diploma in Computer Applications.",
    duration: "6 Months",
    mode: "Online & Offline",
    fees: 8000,
    modules: [
      "Computer Fundamentals",
      "MS Office",
      "Internet",
      "Programming Basics",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C005",
    name: "PGDCA",
    description:
      "Post Graduate Diploma in Computer Applications.",
    duration: "1 Year",
    mode: "Online & Offline",
    fees: 15000,
    modules: [
      "Programming",
      "Database",
      "Web Technologies",
      "Computer Applications",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C006",
    name: "AI Skills",
    description:
      "Learn practical artificial intelligence skills and tools.",
    duration: "3 Months",
    mode: "Online & Offline",
    fees: 6000,
    modules: [
      "AI Fundamentals",
      "Generative AI",
      "Prompt Engineering",
      "AI Tools",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C007",
    name: "Digital Marketing",
    description:
      "Learn modern digital marketing strategies and tools.",
    duration: "3 Months",
    mode: "Online & Offline",
    fees: 6000,
    modules: [
      "SEO",
      "Social Media Marketing",
      "Content Marketing",
      "Digital Advertising",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C008",
    name: "C Programming",
    description:
      "Learn programming fundamentals using C.",
    duration: "2 Months",
    mode: "Online & Offline",
    fees: 3000,
    modules: [
      "C Fundamentals",
      "Variables",
      "Functions",
      "Arrays",
      "Pointers",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C009",
    name: "C++",
    description:
      "Learn object-oriented programming using C++.",
    duration: "2 Months",
    mode: "Online & Offline",
    fees: 3500,
    modules: [
      "C++ Fundamentals",
      "OOP",
      "Classes",
      "Inheritance",
      "Polymorphism",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C010",
    name: "MS DOS",
    description:
      "Introduction to MS DOS commands and concepts.",
    duration: "1 Month",
    mode: "Online & Offline",
    fees: 1000,
    modules: [
      "DOS Fundamentals",
      "Commands",
      "Files & Directories",
      "Batch Files",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C011",
    name: "HTML",
    description:
      "Learn the fundamentals of web page development using HTML.",
    duration: "1 Month",
    mode: "Online & Offline",
    fees: 2000,
    modules: [
      "HTML Basics",
      "Elements",
      "Forms",
      "Tables",
      "Page Structure",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C012",
    name: "Python",
    description:
      "Learn Python programming from fundamentals to practical applications.",
    duration: "3 Months",
    mode: "Online & Offline",
    fees: 5000,
    modules: [
      "Python Basics",
      "Functions",
      "OOP",
      "File Handling",
      "Projects",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C013",
    name: "JAVA",
    description:
      "Learn Java programming and object-oriented concepts.",
    duration: "3 Months",
    mode: "Online & Offline",
    fees: 6000,
    modules: [
      "Java Basics",
      "OOP",
      "Collections",
      "Exception Handling",
      "Projects",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C014",
    name: "Job Oriented Courses",
    description:
      "Practical courses focused on career and employment skills.",
    duration: "6 Months",
    mode: "Online & Offline",
    fees: 10000,
    modules: [
      "Technical Skills",
      "Practical Training",
      "Interview Preparation",
      "Career Guidance",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C015",
    name: "Abacus",
    description:
      "Abacus training for children to improve calculation skills.",
    duration: "6 Months",
    mode: "Offline",
    fees: 5000,
    modules: [
      "Number Concepts",
      "Abacus Basics",
      "Mental Calculation",
      "Speed Practice",
    ],
    students: 0,
    status: "Active",
  },
  {
    id: "C016",
    name: "Spoken English",
    description:
      "Improve spoken English, communication and confidence.",
    duration: "3 Months",
    mode: "Online & Offline",
    fees: 4000,
    modules: [
      "Basic Grammar",
      "Vocabulary",
      "Conversation",
      "Communication Skills",
    ],
    students: 0,
    status: "Active",
  },
];

const EMPTY_FORM: CourseForm = {
  name: "",
  description: "",
  duration: "",
  mode: "Online & Offline",
  fees: "",
  modules: "",
  status: "Active",
};

/* ============================================================
   MAIN PAGE
============================================================ */

export default function CoursesPage() {
  const [courses, setCourses] =
    useState<Course[]>(INITIAL_COURSES);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | CourseStatus>("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedCourse, setSelectedCourse] =
    useState<Course | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [form, setForm] =
    useState<CourseForm>(EMPTY_FORM);

  /* ----------------------------------------------------------
     FILTERING
  ---------------------------------------------------------- */

  const filteredCourses = useMemo(() => {
    const text = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !text ||
        course.name.toLowerCase().includes(text) ||
        course.id.toLowerCase().includes(text) ||
        course.mode.toLowerCase().includes(text) ||
        course.modules.some((module) =>
          module.toLowerCase().includes(text)
        );

      const matchesStatus =
        statusFilter === "All" ||
        course.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  /* ----------------------------------------------------------
     SUMMARY
  ---------------------------------------------------------- */

  const activeCourses = courses.filter(
    (course) => course.status === "Active"
  ).length;

  const inactiveCourses = courses.filter(
    (course) => course.status === "Inactive"
  ).length;

  const totalStudents = courses.reduce(
    (total, course) => total + course.students,
    0
  );

  /* ----------------------------------------------------------
     FORM
  ---------------------------------------------------------- */

  const updateForm = (
    field: keyof CourseForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ----------------------------------------------------------
     CREATE COURSE
  ---------------------------------------------------------- */

  const createCourse = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter course name.");
      return;
    }

    if (!form.duration.trim()) {
      alert("Please enter course duration.");
      return;
    }

    if (!form.fees.trim()) {
      alert("Please enter course fee.");
      return;
    }

    const modules = form.modules
      .split(",")
      .map((module) => module.trim())
      .filter(Boolean);

    const newCourse: Course = {
      id: `C${String(courses.length + 1).padStart(3, "0")}`,
      name: form.name.trim(),
      description: form.description.trim(),
      duration: form.duration.trim(),
      mode: form.mode,
      fees: Number(form.fees) || 0,
      modules,
      students: 0,
      status: form.status,
    };

    setCourses((current) => [
      ...current,
      newCourse,
    ]);

    setForm(EMPTY_FORM);
    setShowAddModal(false);
  };

  /* ----------------------------------------------------------
     EDIT
  ---------------------------------------------------------- */

  const openEditModal = (course: Course) => {
    setOpenMenuId(null);
    setSelectedCourse(course);

    setForm({
      name: course.name,
      description: course.description,
      duration: course.duration,
      mode: course.mode,
      fees: String(course.fees),
      modules: course.modules.join(", "),
      status: course.status,
    });

    setShowEditModal(true);
  };

  const updateCourse = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedCourse) {
      return;
    }

    if (!form.name.trim()) {
      alert("Please enter course name.");
      return;
    }

    if (!form.duration.trim()) {
      alert("Please enter course duration.");
      return;
    }

    const modules = form.modules
      .split(",")
      .map((module) => module.trim())
      .filter(Boolean);

    setCourses((current) =>
      current.map((course) =>
        course.id === selectedCourse.id
          ? {
              ...course,
              name: form.name.trim(),
              description: form.description.trim(),
              duration: form.duration.trim(),
              mode: form.mode,
              fees: Number(form.fees) || 0,
              modules,
              status: form.status,
            }
          : course
      )
    );

    setShowEditModal(false);
    setSelectedCourse(null);
    setForm(EMPTY_FORM);
  };

  /* ----------------------------------------------------------
     DELETE
  ---------------------------------------------------------- */

  const deleteCourse = (course: Course) => {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setCourses((current) =>
      current.filter(
        (item) => item.id !== course.id
      )
    );
  };

  /* ----------------------------------------------------------
     STATUS
  ---------------------------------------------------------- */

  const toggleCourseStatus = (course: Course) => {
    setOpenMenuId(null);

    setCourses((current) =>
      current.map((item) =>
        item.id === course.id
          ? {
              ...item,
              status:
                item.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : item
      )
    );
  };

  /* ----------------------------------------------------------
     VIEW
  ---------------------------------------------------------- */

  const openViewModal = (course: Course) => {
    setOpenMenuId(null);
    setSelectedCourse(course);
    setShowViewModal(true);
  };

  /* ----------------------------------------------------------
     MORE MENU
  ---------------------------------------------------------- */

  const openMoreMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    courseId: string
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const menuWidth = 230;
    const menuHeight = 160;
    const gap = 8;
    const padding = 12;

    let left = rect.right - menuWidth;

    if (left < padding) {
      left = padding;
    }

    if (
      left + menuWidth >
      window.innerWidth - padding
    ) {
      left =
        window.innerWidth -
        menuWidth -
        padding;
    }

    let top = rect.bottom + gap;

    if (
      top + menuHeight >
      window.innerHeight - padding
    ) {
      top =
        rect.top -
        menuHeight -
        gap;
    }

    if (top < padding) {
      top = padding;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(
      openMenuId === courseId
        ? null
        : courseId
    );
  };

  /* ----------------------------------------------------------
     CLOSE
  ---------------------------------------------------------- */

  const closeAll = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedCourse(null);
    setOpenMenuId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Course Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Courses
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage SKCE courses, fees, modules and student enrollment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
          >
            <Plus size={18} />
            Add Course
          </button>
        </div>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<BookOpen size={21} />}
            value={courses.length}
            title="Total Courses"
            description="Courses in catalog"
          />

          <SummaryCard
            icon={<CheckCircle2 size={21} />}
            value={activeCourses}
            title="Active Courses"
            description="Currently available"
          />

          <SummaryCard
            icon={<XCircle size={21} />}
            value={inactiveCourses}
            title="Inactive Courses"
            description="Currently disabled"
          />

          <SummaryCard
            icon={<Users size={21} />}
            value={totalStudents}
            title="Total Enrollments"
            description="Across all courses"
          />
        </div>

        {/* ====================================================
            COURSE TABLE
        ==================================================== */}

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
                  setSearch(e.target.value)
                }
                placeholder="Search by course name, ID, mode or module..."
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

          {/* TABLE */}
          {filteredCourses.length === 0 ? (
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
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
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
                      Fees
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

                              <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">
                                {course.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* ID */}
                        <TableCell>
                          <span className="font-semibold text-[#173B67]">
                            {course.id}
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

                        {/* FEE */}
                        <TableCell>
                          <div className="flex items-center gap-0.5 font-semibold text-slate-800">
                            <IndianRupee
                              size={14}
                            />

                            {course.fees.toLocaleString(
                              "en-IN"
                            )}
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
                            <ActionButton
                              title="View course"
                              onClick={() =>
                                openViewModal(
                                  course
                                )
                              }
                            >
                              <Eye size={16} />
                            </ActionButton>

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

                            <ActionButton
                              title="More actions"
                              onClick={(e) =>
                                openMoreMenu(
                                  e,
                                  course.id
                                )
                              }
                            >
                              <MoreVertical
                                size={16}
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

        {/* ====================================================
            DEVELOPMENT NOTICE
        ==================================================== */}

        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <p className="text-xs font-semibold text-orange-800">
            Development Mode
          </p>

          <p className="mt-1 text-xs leading-5 text-orange-700/80">
            Course data is currently stored in frontend state.
            Permanent course management, student enrollment counts
            and database synchronization will be connected when
            the backend is implemented.
          </p>
        </div>
      </div>

      {/* ======================================================
          FLOATING MORE MENU
      ====================================================== */}

      {openMenuId && (
        <div
          className="fixed z-[99999] w-[230px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {(() => {
            const course = courses.find(
              (item) =>
                item.id === openMenuId
            );

            if (!course) {
              return null;
            }

            return (
              <>
                <MoreMenuItem
                  icon={
                    course.status ===
                    "Active" ? (
                      <XCircle size={17} />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )
                  }
                  label={
                    course.status ===
                    "Active"
                      ? "Deactivate Course"
                      : "Activate Course"
                  }
                  onClick={() =>
                    toggleCourseStatus(
                      course
                    )
                  }
                />

                <MoreMenuItem
                  icon={<Eye size={17} />}
                  label="View Course"
                  onClick={() =>
                    openViewModal(course)
                  }
                />

                <MoreMenuItem
                  icon={
                    <Trash2 size={17} />
                  }
                  label="Delete Course"
                  danger
                  onClick={() =>
                    deleteCourse(course)
                  }
                />
              </>
            );
          })()}
        </div>
      )}

      {/* ======================================================
          ADD
      ====================================================== */}

      {showAddModal && (
        <CourseFormModal
          title="Add New Course"
          subtitle="Create a new SKCE training course."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={createCourse}
          submitLabel="Create Course"
        />
      )}

      {/* ======================================================
          EDIT
      ====================================================== */}

      {showEditModal && (
        <CourseFormModal
          title="Edit Course"
          subtitle="Update course information and modules."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={updateCourse}
          submitLabel="Save Changes"
          isEdit
        />
      )}

      {/* ======================================================
          VIEW
      ====================================================== */}

      {showViewModal && selectedCourse && (
        <ModalOverlay onClose={closeAll}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Course Details"
              subtitle="Complete course information."
              onClose={closeAll}
            />

            <div className="p-6">
              {/* COURSE TITLE */}
              <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <BookOpen size={25} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[#173B67]">
                    {selectedCourse.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
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
                  {selectedCourse.status}
                </span>
              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">
                <p className="text-sm leading-6 text-slate-600">
                  {selectedCourse.description}
                </p>
              </div>

              {/* DETAILS */}
              <div className="grid gap-3 sm:grid-cols-3">
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
                  value={selectedCourse.mode}
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

              {/* FEE */}
              <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <IndianRupee
                    size={17}
                    className="text-orange-500"
                  />

                  Course Fee
                </div>

                <div className="mt-2 text-2xl font-bold text-[#173B67]">
                  ₹
                  {selectedCourse.fees.toLocaleString(
                    "en-IN"
                  )}
                </div>
              </div>

              {/* MODULES */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <GraduationCap
                    size={18}
                    className="text-orange-500"
                  />

                  <p className="text-sm font-semibold text-slate-700">
                    Course Modules
                  </p>
                </div>

                {selectedCourse.modules.length ===
                0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                    No modules added.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.modules.map(
                      (module) => (
                        <span
                          key={module}
                          className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600"
                        >
                          {module}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <ModalFooter
              onClose={closeAll}
            />
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

/* ============================================================
   COURSE FORM MODAL
============================================================ */

function CourseFormModal({
  title,
  subtitle,
  form,
  setForm,
  onClose,
  onSubmit,
  submitLabel,
  isEdit = false,
}: {
  title: string;
  subtitle: string;
  form: CourseForm;
  setForm: React.Dispatch<
    React.SetStateAction<CourseForm>
  >;
  onClose: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const updateForm = (
    field: keyof CourseForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <ModalHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
        />

        <form onSubmit={onSubmit}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">

            <FormField
              label="Course Name"
              required
              value={form.name}
              onChange={(value) =>
                updateForm("name", value)
              }
              placeholder="Enter course name"
            />

            <FormField
              label="Duration"
              required
              value={form.duration}
              onChange={(value) =>
                updateForm(
                  "duration",
                  value
                )
              }
              placeholder="Example: 3 Months"
            />

            {/* MODE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mode
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                required
                value={form.mode}
                onChange={(e) =>
                  updateForm(
                    "mode",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option>
                  Online & Offline
                </option>

                <option>
                  Online
                </option>

                <option>
                  Offline
                </option>
              </select>
            </div>

            {/* FEE */}
            <FormField
              label="Course Fee"
              type="number"
              required
              value={form.fees}
              onChange={(value) =>
                updateForm("fees", value)
              }
              placeholder="Enter fee"
            />

            {/* DESCRIPTION */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateForm(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Enter course description"
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* MODULES */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Modules / Topics
              </label>

              <textarea
                value={form.modules}
                onChange={(e) =>
                  updateForm(
                    "modules",
                    e.target.value
                  )
                }
                placeholder="Enter modules separated by commas. Example: HTML Basics, Forms, Tables, CSS"
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Separate each module with a comma.
              </p>
            </div>

            {/* STATUS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              {isEdit ? (
                <Save size={17} />
              ) : (
                <Plus size={17} />
              )}

              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

/* ============================================================
   MODAL
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
        if (e.target === e.currentTarget) {
          onClose();
        }
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

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
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

function ModalFooter({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end border-t border-slate-100 px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Close
      </button>
    </div>
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
}: {
  icon: React.ReactNode;
  value: number;
  title: string;
  description: string;
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
   TABLE
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
  onClick?: () => void;
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
   MORE MENU
============================================================ */

function MoreMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}