"use client";

import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  FileText,
  HelpCircle,
  Send,
  XCircle,
  CheckCircle2,
  X,
  Save,
  ClipboardList,
  Users,
  Clock3,
} from "lucide-react";

type AssessmentType = "Assignment" | "Quiz";
type AssessmentStatus = "Draft" | "Published";

type Assessment = {
  id: string;
  title: string;
  type: AssessmentType;
  course: string;
  batch: string;
  trainer: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  submissions: number;
  status: AssessmentStatus;
};

type AssessmentForm = {
  title: string;
  type: AssessmentType;
  course: string;
  batch: string;
  trainer: string;
  description: string;
  dueDate: string;
  totalMarks: string;
  status: AssessmentStatus;
};

const COURSES = [
  "Computer Basics",
  "Typing Course - Basics",
  "MS Office",
  "DCA",
  "PGDCA",
  "AI Skills",
  "Digital Marketing",
  "C Programming",
  "C++",
  "MS DOS",
  "HTML",
  "Python",
  "JAVA",
  "Job Oriented Courses",
  "Abacus",
  "Spoken English",
];

const BATCHES = ["No Batches Available"];
const TRAINERS = ["Not Assigned"];

const EMPTY_FORM: AssessmentForm = {
  title: "",
  type: "Assignment",
  course: "",
  batch: "",
  trainer: "",
  description: "",
  dueDate: "",
  totalMarks: "100",
  status: "Draft",
};

const INITIAL_ASSESSMENTS: Assessment[] = [];

export default function AssignmentsPage() {
  const [assessments, setAssessments] =
    useState<Assessment[]>(INITIAL_ASSESSMENTS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<"All" | AssessmentType>("All");
  const [statusFilter, setStatusFilter] =
    useState<"All" | AssessmentStatus>("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [form, setForm] = useState<AssessmentForm>(EMPTY_FORM);

  const filteredAssessments = useMemo(() => {
    const q = search.toLowerCase().trim();

    return assessments.filter((assessment) => {
      const matchesSearch =
        !q ||
        [
          assessment.title,
          assessment.id,
          assessment.course,
          assessment.batch,
          assessment.trainer,
        ].some((value) => value.toLowerCase().includes(q));

      return (
        matchesSearch &&
        (typeFilter === "All" || assessment.type === typeFilter) &&
        (statusFilter === "All" || assessment.status === statusFilter)
      );
    });
  }, [assessments, search, typeFilter, statusFilter]);

  const totalAssignments = assessments.filter(
    (item) => item.type === "Assignment"
  ).length;
  const totalQuizzes = assessments.filter(
    (item) => item.type === "Quiz"
  ).length;
  const totalDrafts = assessments.filter(
    (item) => item.status === "Draft"
  ).length;

  const updateForm = (field: keyof AssessmentForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeAll = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowSubmissionsModal(false);
    setSelectedAssessment(null);
    setOpenMenuId(null);
    setForm(EMPTY_FORM);
  };

  const createAssessment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter assignment or quiz title.");
      return;
    }

    if (!form.course) {
      alert("Please select a course.");
      return;
    }

    if (!form.dueDate) {
      alert("Please select a due date.");
      return;
    }

    const newAssessment: Assessment = {
      id: `ASM${String(assessments.length + 1).padStart(3, "0")}`,
      title: form.title.trim(),
      type: form.type,
      course: form.course,
      batch: form.batch || "Not Assigned",
      trainer: form.trainer || "Not Assigned",
      description: form.description.trim(),
      dueDate: form.dueDate,
      totalMarks: Number(form.totalMarks) || 100,
      submissions: 0,
      status: form.status,
    };

    setAssessments((current) => [...current, newAssessment]);
    closeAll();
  };

  const openEditModal = (assessment: Assessment) => {
    setOpenMenuId(null);
    setSelectedAssessment(assessment);
    setForm({
      title: assessment.title,
      type: assessment.type,
      course: assessment.course,
      batch: assessment.batch === "Not Assigned" ? "" : assessment.batch,
      trainer:
        assessment.trainer === "Not Assigned" ? "" : assessment.trainer,
      description: assessment.description,
      dueDate: assessment.dueDate,
      totalMarks: String(assessment.totalMarks),
      status: assessment.status,
    });
    setShowEditModal(true);
  };

  const updateAssessment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedAssessment) return;

    if (!form.title.trim()) {
      alert("Please enter assignment or quiz title.");
      return;
    }

    if (!form.course) {
      alert("Please select a course.");
      return;
    }

    setAssessments((current) =>
      current.map((assessment) =>
        assessment.id === selectedAssessment.id
          ? {
              ...assessment,
              title: form.title.trim(),
              type: form.type,
              course: form.course,
              batch: form.batch || "Not Assigned",
              trainer: form.trainer || "Not Assigned",
              description: form.description.trim(),
              dueDate: form.dueDate,
              totalMarks: Number(form.totalMarks) || 100,
              status: form.status,
            }
          : assessment
      )
    );

    closeAll();
  };

  const togglePublish = (assessment: Assessment) => {
    setOpenMenuId(null);

    setAssessments((current) =>
      current.map((item) =>
        item.id === assessment.id
          ? {
              ...item,
              status:
                item.status === "Published" ? "Draft" : "Published",
            }
          : item
      )
    );
  };

  const deleteAssessment = (assessment: Assessment) => {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${assessment.title}"?`
    );

    if (!confirmed) return;

    setAssessments((current) =>
      current.filter((item) => item.id !== assessment.id)
    );
  };

  const openViewModal = (assessment: Assessment) => {
    setOpenMenuId(null);
    setSelectedAssessment(assessment);
    setShowViewModal(true);
  };

  const openSubmissions = (assessment: Assessment) => {
    setOpenMenuId(null);
    setSelectedAssessment(assessment);
    setShowSubmissionsModal(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
              <ClipboardList size={14} />
              Assessments
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Assignments &amp; Quizzes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage assignments, quizzes and student submissions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Create Assessment
          </button>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<ClipboardList size={20} />}
            value={assessments.length}
            title="Total"
          />
          <SummaryCard
            icon={<FileText size={20} />}
            value={totalAssignments}
            title="Assignments"
          />
          <SummaryCard
            icon={<HelpCircle size={20} />}
            value={totalQuizzes}
            title="Quizzes"
          />
          <SummaryCard
            icon={<Clock3 size={20} />}
            value={totalDrafts}
            title="Drafts"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-2xl">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, ID, course, batch or trainer..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "All" | AssessmentType)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Types</option>
                <option value="Assignment">Assignments</option>
                <option value="Quiz">Quizzes</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "All" | AssessmentStatus
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Assessment",
                    "Type",
                    "Course",
                    "Batch",
                    "Trainer",
                    "Due Date",
                    "Submissions",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-20 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                        <ClipboardList size={27} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        No assessments found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Click “Create Assessment” to create the first assignment
                        or quiz.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((assessment) => (
                    <tr
                      key={assessment.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="font-semibold text-slate-800">
                          {assessment.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {assessment.id}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <TypeBadge type={assessment.type} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        {assessment.course}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        {assessment.batch}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        {assessment.trainer}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                        {formatDate(assessment.dueDate)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-700">
                        {assessment.submissions}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <StatusBadge status={assessment.status} />
                      </td>
                      <td className="relative border-b border-slate-100 px-4 py-4">
                        <div className="flex gap-1.5">
                          <ActionButton
                            title="View assessment"
                            onClick={() => openViewModal(assessment)}
                          >
                            <Eye size={16} />
                          </ActionButton>
                          <ActionButton
                            title="Edit assessment"
                            onClick={() => openEditModal(assessment)}
                          >
                            <Pencil size={16} />
                          </ActionButton>
                          <ActionButton
                            title="More actions"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === assessment.id
                                  ? null
                                  : assessment.id
                              )
                            }
                          >
                            <MoreVertical size={16} />
                          </ActionButton>
                        </div>

                        {openMenuId === assessment.id && (
                          <div className="absolute right-4 top-14 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                            <MenuItem
                              icon={
                                assessment.status === "Published" ? (
                                  <XCircle size={17} />
                                ) : (
                                  <Send size={17} />
                                )
                              }
                              label={
                                assessment.status === "Published"
                                  ? "Unpublish"
                                  : "Publish"
                              }
                              onClick={() => togglePublish(assessment)}
                            />
                            <MenuItem
                              icon={<Users size={17} />}
                              label="View Submissions"
                              onClick={() => openSubmissions(assessment)}
                            />
                            <MenuItem
                              icon={<Trash2 size={17} />}
                              label="Delete"
                              danger
                              onClick={() => deleteAssessment(assessment)}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <strong>Development mode:</strong> Assessment data is currently
          stored locally in the page state. Detailed submissions, grading and
          feedback will be connected to the backend later.
        </div>
      </div>

      {showAddModal && (
        <AssessmentFormModal
          title="Create Assessment"
          subtitle="Create an assignment or quiz for students."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={createAssessment}
          submitLabel="Create Assessment"
        />
      )}

      {showEditModal && (
        <AssessmentFormModal
          title="Edit Assessment"
          subtitle="Update assessment details."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={updateAssessment}
          submitLabel="Save Changes"
          isEdit
        />
      )}

      {showViewModal && selectedAssessment && (
        <Modal
          title="Assessment Details"
          subtitle="Complete assignment or quiz information."
          onClose={closeAll}
        >
          <div className="mb-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                {selectedAssessment.type === "Assignment" ? (
                  <FileText size={23} />
                ) : (
                  <HelpCircle size={23} />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedAssessment.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAssessment.id}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={selectedAssessment.status} />
              </div>
            </div>
          </div>

          {selectedAssessment.description && (
            <div className="mb-4 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-400">
                Description
              </p>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">
                {selectedAssessment.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Type" value={selectedAssessment.type} />
            <Detail label="Course" value={selectedAssessment.course} />
            <Detail label="Batch" value={selectedAssessment.batch} />
            <Detail label="Trainer" value={selectedAssessment.trainer} />
            <Detail label="Due Date" value={formatDate(selectedAssessment.dueDate)} />
            <Detail label="Total Marks" value={String(selectedAssessment.totalMarks)} />
            <Detail label="Submissions" value={String(selectedAssessment.submissions)} />
            <Detail label="Status" value={selectedAssessment.status} />
          </div>
        </Modal>
      )}

      {showSubmissionsModal && selectedAssessment && (
        <Modal
          title="View Submissions"
          subtitle={`Student submissions for ${selectedAssessment.title}.`}
          onClose={closeAll}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat
              value={String(selectedAssessment.submissions)}
              label="Submitted"
            />
            <MiniStat value="0" label="Pending" />
            <MiniStat value="0" label="Graded" />
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Detailed student submissions, grading and feedback will be
            connected to the backend later.
          </p>
        </Modal>
      )}
    </main>
  );
}

function AssessmentFormModal({
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
  form: AssessmentForm;
  setForm: Dispatch<SetStateAction<AssessmentForm>>;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const update = (field: keyof AssessmentForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Title"
              required
              value={form.title}
              onChange={(v) => update("title", v)}
              placeholder="Example: Java OOP Assignment"
            />
          </div>

          <SelectField
            label="Type"
            required
            value={form.type}
            onChange={(v) => update("type", v)}
            options={["Assignment", "Quiz"]}
          />

          <SelectField
            label="Course"
            required
            value={form.course}
            onChange={(v) => update("course", v)}
            options={COURSES}
          />

          <SelectField
            label="Batch"
            value={form.batch}
            onChange={(v) => update("batch", v)}
            options={BATCHES}
          />

          <SelectField
            label="Trainer"
            value={form.trainer}
            onChange={(v) => update("trainer", v)}
            options={TRAINERS}
          />

          <Field
            label="Due Date"
            type="date"
            required
            value={form.dueDate}
            onChange={(v) => update("dueDate", v)}
          />

          <Field
            label="Total Marks"
            type="number"
            value={form.totalMarks}
            onChange={(v) => update("totalMarks", v)}
            placeholder="100"
          />

          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => update("status", v)}
            options={["Draft", "Published"]}
          />

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter instructions or assessment description..."
              rows={5}
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {isEdit ? <Save size={17} /> : <Plus size={17} />}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-[#173B67]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({
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
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 text-center">
      <div className="text-2xl font-bold text-[#173B67]">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  title,
}: {
  icon: ReactNode;
  value: number;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#173B67]">{value}</div>
        <div className="text-sm text-slate-500">{title}</div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: AssessmentType }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        type === "Assignment"
          ? "bg-blue-50 text-blue-700"
          : "bg-purple-50 text-purple-700"
      }`}
    >
      {type === "Assignment" ? (
        <FileText size={13} />
      ) : (
        <HelpCircle size={13} />
      )}
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "Published"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
    >
      {children}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function formatDate(date: string) {
  if (!date) return "Not set";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
