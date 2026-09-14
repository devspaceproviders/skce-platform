"use client";

import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Eye,
  Pencil,
  UserX,
  Users,
  X,
  Save,
  KeyRound,
  Activity,
  Star,
  Mail,
  Phone,
  CalendarDays,
} from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

type StudentStatus = "Active" | "Inactive";

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  courses: string[];
  joinedDate: string;
  status: StudentStatus;
};

type StudentForm = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  courses: string[];
  password: string;
  status: StudentStatus;
};

const EMPTY_FORM: StudentForm = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  courses: [],
  password: "",
  status: "Active",
};

const INITIAL_STUDENTS: Student[] = [];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | StudentStatus>("All");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [feedback, setFeedback] = useState("");

  const filteredStudents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !searchText ||
        student.name.toLowerCase().includes(searchText) ||
        student.email.toLowerCase().includes(searchText) ||
        student.id.toLowerCase().includes(searchText) ||
        student.phone.includes(search) ||
        student.courses.some((course) =>
          course.toLowerCase().includes(searchText)
        );

      const matchesStatus =
        statusFilter === "All" ||
        student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  const inactiveCount = students.filter(
    (student) => student.status === "Inactive"
  ).length;

  const toggleCourse = (course: string) => {
    setForm((current) => ({
      ...current,
      courses: current.courses.includes(course)
        ? current.courses.filter((item) => item !== course)
        : [...current.courses, course],
    }));
  };

  const createStudent = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter the student's name.");
      return;
    }

    if (!form.email.trim()) {
      alert("Please enter the student's email.");
      return;
    }

    if (!form.phone.trim()) {
      alert("Please enter the student's phone number.");
      return;
    }

    if (!form.password.trim()) {
      alert("Please create a password.");
      return;
    }

    if (form.courses.length === 0) {
      alert("Please select at least one course.");
      return;
    }

    const newStudent: Student = {
      // Development-only ID.
      // Production Student ID will come from the backend.
      id: `SKCE${String(students.length + 1).padStart(4, "0")}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dob: form.dob,
      courses: form.courses,
      joinedDate: new Date().toLocaleDateString("en-IN"),
      status: form.status,
    };

    setStudents((current) => [newStudent, ...current]);
    setForm(EMPTY_FORM);
    setShowAddForm(false);
  };

  const openViewModal = (student: Student) => {
    setOpenMenuId(null);
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const openEditModal = (student: Student) => {
    setOpenMenuId(null);
    setSelectedStudent(student);

    setForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      dob: student.dob,
      courses: [...student.courses],
      password: "",
      status: student.status,
    });

    setShowEditForm(true);
  };

  const updateStudent = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedStudent) return;

    if (!form.courses.length) {
      alert("Please select at least one course.");
      return;
    }

    setStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              dob: form.dob,
              courses: form.courses,
              status: form.status,
            }
          : student
      )
    );

    setShowEditForm(false);
    setSelectedStudent(null);
    setForm(EMPTY_FORM);
  };

  const toggleStatus = (id: string) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === id
          ? {
              ...student,
              status:
                student.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : student
      )
    );
  };

  const handleMoreAction = (
    action: "reset-password" | "activity" | "feedback",
    student: Student
  ) => {
    setOpenMenuId(null);

    if (action === "reset-password") {
      alert(
        `Password reset for ${student.name} will be connected to the backend later.`
      );
      return;
    }

    if (action === "activity") {
      alert(
        `Student activity for ${student.name} will be connected to the backend later.`
      );
      return;
    }

    setSelectedStudent(student);
    setFeedback("");
    setShowFeedbackModal(true);
  };

  const submitFeedback = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedStudent) return;

    if (!feedback.trim()) {
      alert("Please enter appreciation or feedback.");
      return;
    }

    alert(`Feedback saved for ${selectedStudent.name}.`);

    setFeedback("");
    setShowFeedbackModal(false);
    setSelectedStudent(null);
  };

  const closeAllModals = () => {
    setShowAddForm(false);
    setShowViewModal(false);
    setShowEditForm(false);
    setShowFeedbackModal(false);
    setSelectedStudent(null);
    setOpenMenuId(null);
    setForm(EMPTY_FORM);
    setFeedback("");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Student Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Students
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage student accounts, courses and status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowAddForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
          >
            <UserPlus size={18} />
            Add Student
          </button>
        </div>

        {/* SUMMARY */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Students"
            value={students.length}
            icon={Users}
            description="All registered students"
          />

          <SummaryCard
            title="Active Students"
            value={activeCount}
            icon={UserCheckIcon}
            description="Currently active"
          />

          <SummaryCard
            title="Inactive Students"
            value={inactiveCount}
            icon={UserX}
            description="Currently inactive"
          />
        </div>

        {/* TABLE */}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, ID or course..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "All" | StudentStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* EMPTY STATE */}
          {filteredStudents.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                <Users
                  size={28}
                  className="text-orange-500"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
                No students found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {students.length === 0
                  ? 'Click "Add Student" to create the first student.'
                  : "Try changing your search or status filter."}
              </p>

              {students.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <UserPlus size={17} />
                  Add Student
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50">
                    <TableHeader>Student</TableHeader>
                    <TableHeader>Student ID</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Courses</TableHeader>
                    <TableHeader>Joined</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/60"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-sm font-bold text-white">
                            {student.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {student.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-[#173B67]">
                          {student.id}
                        </span>
                      </TableCell>

                      <TableCell>
                        {student.phone}
                      </TableCell>

                      <TableCell>
                        <div className="flex max-w-[350px] flex-wrap gap-1.5">
                          {student.courses.map((course) => (
                            <span
                              key={course}
                              className="rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600"
                            >
                              {course}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        {student.joinedDate}
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
                        <div className="flex items-center gap-1.5">
                          <ActionButton
                            title="View student"
                            onClick={() =>
                              openViewModal(student)
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Edit student"
                            onClick={() =>
                              openEditModal(student)
                            }
                          >
                            <Pencil size={16} />
                          </ActionButton>

                          <ActionButton
                            title={
                              student.status === "Active"
                                ? "Deactivate student"
                                : "Activate student"
                            }
                            onClick={() =>
                              toggleStatus(student.id)
                            }
                          >
                            <UserX size={16} />
                          </ActionButton>

                          <div className="relative">
                            <ActionButton
                              title="More actions"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === student.id
                                    ? null
                                    : student.id
                                )
                              }
                            >
                              <MoreVertical size={16} />
                            </ActionButton>

                            {openMenuId === student.id && (
                              <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                <MoreMenuItem
                                  icon={
                                    <KeyRound size={17} />
                                  }
                                  label="Reset Password"
                                  onClick={() =>
                                    handleMoreAction(
                                      "reset-password",
                                      student
                                    )
                                  }
                                />

                                <MoreMenuItem
                                  icon={
                                    <Activity size={17} />
                                  }
                                  label="View Student Activity"
                                  onClick={() =>
                                    handleMoreAction(
                                      "activity",
                                      student
                                    )
                                  }
                                />

                                <MoreMenuItem
                                  icon={
                                    <Star size={17} />
                                  }
                                  label="Appreciation & Feedback"
                                  onClick={() =>
                                    handleMoreAction(
                                      "feedback",
                                      student
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DEVELOPMENT NOTICE */}
        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <p className="text-xs font-semibold text-orange-800">
            Development Mode
          </p>

          <p className="mt-1 text-xs leading-5 text-orange-700/80">
            Student records are currently stored in frontend state.
            Registration, database storage, authentication, password
            reset and permanent Student ID generation will be connected
            when the backend is implemented.
          </p>
        </div>
      </div>

      {/* ADD */}
      {showAddForm && (
        <StudentFormModal
          title="Add New Student"
          subtitle="Create a student account for SKCE."
          form={form}
          setForm={setForm}
          toggleCourse={toggleCourse}
          onClose={closeAllModals}
          onSubmit={createStudent}
          submitLabel="Create Student"
        />
      )}

      {/* EDIT */}
      {showEditForm && (
        <StudentFormModal
          title="Edit Student"
          subtitle="Update student information and courses."
          form={form}
          setForm={setForm}
          toggleCourse={toggleCourse}
          onClose={closeAllModals}
          onSubmit={updateStudent}
          submitLabel="Save Changes"
          isEdit
        />
      )}

      {/* VIEW */}
      {showViewModal && selectedStudent && (
        <ModalOverlay onClose={closeAllModals}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Student Details"
              subtitle="Complete student information."
              onClose={closeAllModals}
            />

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xl font-bold text-white">
                  {selectedStudent.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[#173B67]">
                    {selectedStudent.name}
                  </h3>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {selectedStudent.id}
                  </p>
                </div>

                <span
                  className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedStudent.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {selectedStudent.status}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={<Users size={16} />}
                  label="Full Name"
                  value={selectedStudent.name}
                />

                <DetailItem
                  icon={<Users size={16} />}
                  label="Student ID"
                  value={selectedStudent.id}
                />

                <DetailItem
                  icon={<Mail size={16} />}
                  label="Email"
                  value={selectedStudent.email}
                />

                <DetailItem
                  icon={<Phone size={16} />}
                  label="Phone"
                  value={selectedStudent.phone}
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Date of Birth"
                  value={
                    selectedStudent.dob || "Not provided"
                  }
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Joined Date"
                  value={selectedStudent.joinedDate}
                />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Enrolled Courses
                </p>

                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-4">
                  {selectedStudent.courses.map((course) => (
                    <span
                      key={course}
                      className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <ModalFooter onClose={closeAllModals} />
          </div>
        </ModalOverlay>
      )}

      {/* FEEDBACK */}
      {showFeedbackModal && selectedStudent && (
        <ModalOverlay onClose={closeAllModals}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Appreciation & Feedback"
              subtitle={`Give feedback to ${selectedStudent.name}.`}
              onClose={closeAllModals}
            />

            <form onSubmit={submitFeedback}>
              <div className="p-6">
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-orange-50 p-4">
                  <Star
                    size={20}
                    className="text-orange-500"
                  />

                  <p className="text-xs leading-5 text-orange-800">
                    Recognize good performance or provide
                    constructive feedback.
                  </p>
                </div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appreciation / Feedback
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  required
                  rows={6}
                  value={feedback}
                  onChange={(e) =>
                    setFeedback(e.target.value)
                  }
                  placeholder="Write appreciation or feedback for the student..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <Star size={16} />
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

/* ============================================================
   STUDENT FORM MODAL
============================================================ */

function StudentFormModal({
  title,
  subtitle,
  form,
  setForm,
  toggleCourse,
  onClose,
  onSubmit,
  submitLabel,
  isEdit = false,
}: {
  title: string;
  subtitle: string;
  form: StudentForm;
  setForm: React.Dispatch<
    React.SetStateAction<StudentForm>
  >;
  toggleCourse: (course: string) => void;
  onClose: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const updateForm = (
    field: keyof StudentForm,
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
              label="Full Name"
              required
              value={form.name}
              onChange={(value) =>
                updateForm("name", value)
              }
              placeholder="Enter student name"
            />

            <FormField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(value) =>
                updateForm("email", value)
              }
              placeholder="student@example.com"
            />

            <FormField
              label="Phone"
              required
              value={form.phone}
              onChange={(value) =>
                updateForm("phone", value)
              }
              placeholder="Enter phone number"
            />

            <FormField
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(value) =>
                updateForm("dob", value)
              }
            />

            {/* COURSES */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Courses
                <span className="ml-1 text-red-500">*</span>
              </label>

              <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {COURSE_OPTIONS.map((course) => {
                  const selected =
                    form.courses.includes(course.title);

                  return (
                    <label
                      key={course.slug}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                        selected
                          ? "border-orange-200 bg-orange-50 text-orange-700"
                          : "border-transparent bg-white text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleCourse(course.title)
                        }
                        className="h-4 w-4 accent-orange-500"
                      />

                      <span>{course.title}</span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {form.courses.length} course
                {form.courses.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            <FormField
              label={isEdit ? "New Password" : "Password"}
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(value) =>
                updateForm("password", value)
              }
              placeholder={
                isEdit
                  ? "Leave blank to keep current password"
                  : "Create login password"
              }
            />

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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
                <UserPlus size={17} />
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

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

/* ============================================================
   SUMMARY CARD
============================================================ */

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
          <Icon
            size={21}
            className="text-orange-500"
          />
        </div>
      </div>
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
   ACTIONS
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

function MoreMenuItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* Small icon wrapper for summary card */
function UserCheckIcon({
  size = 20,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) {
  return <Users size={size} className={className} />;
}