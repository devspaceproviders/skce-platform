"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HelpCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

type ItemType = "Assignment" | "Quiz";
type View = "list" | "create" | "edit" | "grade" | "results";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
};

type AssignmentQuiz = {
  id: string;
  title: string;
  type: ItemType;
  batch: string;
  due: string;
  submissions: number;
  description?: string;
  totalMarks?: number;
  duration?: number;
  questions?: Question[];
};

type GradingStudent = {
  name: string;
  roll: string;
  submitted: string;
  status: "Graded" | "Pending";
  marks: string;
};

const INITIAL_ITEMS: AssignmentQuiz[] = [
  {
    id: "ASSIGN-001",
    title: "Node.js CRUD API",
    type: "Assignment",
    batch: "BATCH-FS-08",
    due: "25 Aug 2026",
    submissions: 12,
    description:
      "Build a CRUD REST API using Node.js, Express and MySQL.",
    totalMarks: 20,
  },
  {
    id: "ASSIGN-002",
    title: "Spring Boot REST Assignment",
    type: "Assignment",
    batch: "BATCH-JAVA-06",
    due: "28 Aug 2026",
    submissions: 8,
    description:
      "Create REST APIs using Spring Boot with CRUD operations.",
    totalMarks: 25,
  },
  {
    id: "ASSIGN-003",
    title: "React Mini Project",
    type: "Assignment",
    batch: "BATCH-FS-09",
    due: "30 Aug 2026",
    submissions: 5,
    description:
      "Create a responsive React application using reusable components.",
    totalMarks: 25,
  },
  {
    id: "QUIZ-001",
    title: "React Hooks Quiz",
    type: "Quiz",
    batch: "BATCH-FS-08",
    due: "Closed",
    submissions: 18,
    totalMarks: 20,
    duration: 20,
    questions: [
      {
        id: "Q1",
        question:
          "Which hook is used to manage state in a React component?",
        options: ["useEffect", "useState", "useContext", "useRef"],
        correctAnswer: "useState",
        marks: 2,
      },
      {
        id: "Q2",
        question:
          "Which hook is commonly used for side effects?",
        options: ["useState", "useMemo", "useEffect", "useCallback"],
        correctAnswer: "useEffect",
        marks: 2,
      },
    ],
  },
];

const BATCHES = [
  "BATCH-FS-08",
  "BATCH-JAVA-06",
  "BATCH-FS-09",
  "BATCH-FS-05",
];

const STORAGE_KEY = "skce_trainer_assignments_quizzes";

export default function AssignmentsQuizzesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssignmentQuiz[]>(INITIAL_ITEMS);
  const [view, setView] = useState<View>("list");
  const [selectedItem, setSelectedItem] =
    useState<AssignmentQuiz | null>(null);
  const [createType, setCreateType] = useState<ItemType | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] =
    useState<"All" | ItemType>("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [showCreateChoice, setShowCreateChoice] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return;

    try {
      setItems(JSON.parse(stored));
    } catch {
      setItems(INITIAL_ITEMS);
    }
  }, []);

  const saveItems = (updated: AssignmentQuiz[]) => {
    setItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCreate = (item: AssignmentQuiz) => {
    saveItems([...items, item]);
    setView("list");
    setCreateType(null);
  };

  const handleEdit = (item: AssignmentQuiz) => {
    saveItems(
      items.map((existing) =>
        existing.id === item.id ? item : existing
      )
    );
    setView("list");
    setSelectedItem(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    saveItems(items.filter((item) => item.id !== id));
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.batch.toLowerCase().includes(query);

      const matchesType =
        filterType === "All" || item.type === filterType;

      const matchesBatch =
        filterBatch === "All" || item.batch === filterBatch;

      return matchesSearch && matchesType && matchesBatch;
    });
  }, [items, search, filterType, filterBatch]);

  const openCreate = (type: ItemType) => {
    setCreateType(type);
    setView("create");
    setShowCreateChoice(false);
  };

  if (view === "create" && createType) {
    return (
      <CreateForm
        type={createType}
        onBack={() => {
          setView("list");
          setCreateType(null);
        }}
        onCreate={handleCreate}
      />
    );
  }

  if (view === "edit" && selectedItem) {
    return (
      <CreateForm
        type={selectedItem.type}
        editItem={selectedItem}
        onBack={() => {
          setView("list");
          setSelectedItem(null);
        }}
        onCreate={handleEdit}
      />
    );
  }

  if (view === "grade" && selectedItem) {
    return (
      <GradePage
        item={selectedItem}
        onBack={() => {
          setView("list");
          setSelectedItem(null);
        }}
      />
    );
  }

  if (view === "results" && selectedItem) {
    return (
      <QuizResultsPage
        item={selectedItem}
        onBack={() => {
          setView("list");
          setSelectedItem(null);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <ClipboardList size={17} />
                Trainer Portal
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Assignments &amp; Quizzes
              </h1>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Create, manage and grade assignments and quizzes across your
                batches.
              </p>
            </div>

            <button
              onClick={() => setShowCreateChoice(true)}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Plus size={17} />
              Create New
            </button>
          </div>
        </header>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <Clock3 className="mt-0.5 shrink-0 text-orange-500" size={18} />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Assignments, quizzes, grades and results are currently saved in
              browser local storage. Backend persistence will replace this
              storage later.
            </p>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <ClipboardList
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments or quizzes..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "All" | ItemType)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-400"
            >
              <option value="All">All Types</option>
              <option value="Assignment">Assignments</option>
              <option value="Quiz">Quizzes</option>
            </select>

            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-400"
            >
              <option value="All">All Batches</option>
              {BATCHES.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </section>

        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <AssessmentCard
                key={item.id}
                item={item}
                onGrade={() => {
                  setSelectedItem(item);
                  setView(
                    item.type === "Assignment"
                      ? "grade"
                      : "results"
                  );
                }}
                onEdit={() => {
                  setSelectedItem(item);
                  setView("edit");
                }}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}

        {showCreateChoice && (
          <CreateChoiceModal
            onClose={() => setShowCreateChoice(false)}
            onSelect={openCreate}
          />
        )}
      </div>
    </main>
  );
}

function AssessmentCard({
  item,
  onGrade,
  onEdit,
  onDelete,
}: {
  item: AssignmentQuiz;
  onGrade: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAssignment = item.type === "Assignment";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isAssignment
                ? "bg-blue-50 text-blue-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {isAssignment ? (
              <ClipboardList size={20} />
            ) : (
              <HelpCircle size={20} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {item.title}
              </h2>
              <TypeBadge type={item.type} />
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              {item.batch} · Due: {item.due} · Total Marks:{" "}
              {item.totalMarks ?? 20}
            </p>

            {item.description && (
              <p className="mt-1 max-w-3xl truncate text-xs text-slate-400">
                {item.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
            {item.submissions} submissions
          </span>

          <button
            onClick={onGrade}
            className="rounded-lg bg-[#173B67] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#123052]"
          >
            {isAssignment ? "Grade →" : "View Results →"}
          </button>

          <button
            onClick={onEdit}
            title="Edit"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={onDelete}
            title="Delete"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateChoiceModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (type: ItemType) => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <ModalHeader
          title="Create New"
          subtitle="Choose what you want to create."
          onClose={onClose}
        />

        <div className="space-y-3">
          <ChoiceCard
            icon={<ClipboardList size={22} />}
            title="Assignment"
            description="Create an assignment for students in a batch."
            iconClass="bg-blue-50 text-blue-600"
            onClick={() => onSelect("Assignment")}
          />
          <ChoiceCard
            icon={<HelpCircle size={22} />}
            title="Quiz"
            description="Create multiple-choice questions and assess student knowledge."
            iconClass="bg-green-50 text-green-600"
            onClick={() => onSelect("Quiz")}
          />
        </div>
      </div>
    </ModalOverlay>
  );
}

function CreateForm({
  type,
  editItem,
  onBack,
  onCreate,
}: {
  type: ItemType;
  editItem?: AssignmentQuiz;
  onBack: () => void;
  onCreate: (item: AssignmentQuiz) => void;
}) {
  const isEdit = !!editItem;
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [batch, setBatch] = useState(editItem?.batch ?? BATCHES[0]);
  const [description, setDescription] = useState(
    editItem?.description ?? ""
  );
  const [due, setDue] = useState(editItem?.due ?? "");
  const [totalMarks, setTotalMarks] = useState(
    editItem?.totalMarks?.toString() ?? "20"
  );
  const [duration, setDuration] = useState(
    editItem?.duration?.toString() ?? "20"
  );
  const [questions, setQuestions] = useState<Question[]>(
    editItem?.questions ?? []
  );

  const addQuestion = () => {
    setQuestions((current) => [
      ...current,
      {
        id: `Q-${Date.now()}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 2,
      },
    ]);
  };

  const updateQuestion = (
    id: string,
    field: keyof Question,
    value: string | number
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? { ...question, [field]: value }
          : question
      )
    );
  };

  const updateOption = (
    questionId: string,
    index: number,
    value: string
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, optionIndex) =>
                optionIndex === index ? value : option
              ),
            }
          : question
      )
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) =>
      current.filter((question) => question.id !== id)
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (!batch) {
      alert("Please select a batch.");
      return;
    }

    if (type === "Assignment" && !due) {
      alert("Please select a due date.");
      return;
    }

    if (type === "Quiz" && questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }

    if (
      type === "Quiz" &&
      questions.some(
        (question) =>
          !question.question.trim() ||
          question.options.some((option) => !option.trim()) ||
          !question.correctAnswer
      )
    ) {
      alert("Please complete every quiz question, option and correct answer.");
      return;
    }

    const item: AssignmentQuiz = {
      id:
        editItem?.id ??
        `${type === "Assignment" ? "ASSIGN" : "QUIZ"}-${Date.now()}`,
      title: title.trim(),
      type,
      batch,
      due: type === "Quiz" ? "Open" : due,
      submissions: editItem?.submissions ?? 0,
      description: description.trim(),
      totalMarks: Number(totalMarks) || 20,
      duration: type === "Quiz" ? Number(duration) || 20 : undefined,
      questions: type === "Quiz" ? questions : undefined,
    };

    onCreate(item);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-2xl bg-[#173B67] p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
              Trainer Portal
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              {isEdit ? `Edit ${type}` : `Create ${type}`}
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              {type === "Assignment"
                ? "Create an assignment for students in a selected batch."
                : "Create a quiz with multiple-choice questions."}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label={type === "Assignment" ? "Assignment Title" : "Quiz Title"}
                value={title}
                onChange={setTitle}
                placeholder={
                  type === "Assignment"
                    ? "Node.js CRUD API"
                    : "React Hooks Quiz"
                }
                required
              />

              <SelectField
                label="Batch"
                value={batch}
                onChange={setBatch}
                options={BATCHES}
              />

              {type === "Assignment" && (
                <Field
                  label="Due Date"
                  type="date"
                  value={due}
                  onChange={setDue}
                  required
                />
              )}

              <Field
                label="Total Marks"
                type="number"
                value={totalMarks}
                onChange={setTotalMarks}
              />

              {type === "Quiz" && (
                <Field
                  label="Duration (minutes)"
                  type="number"
                  value={duration}
                  onChange={setDuration}
                />
              )}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {type === "Assignment" ? "Description" : "Instructions"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={
                  type === "Assignment"
                    ? "Enter assignment description..."
                    : "Enter quiz instructions..."
                }
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {type === "Quiz" && (
              <div className="mt-7 border-t border-slate-100 pt-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Questions
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Add multiple-choice questions for the quiz.
                    </p>
                  </div>

                  <button
                    onClick={addQuestion}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-100"
                  >
                    <Plus size={15} />
                    Add Question
                  </button>
                </div>

                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                    No questions added yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <QuestionEditor
                        key={question.id}
                        question={question}
                        index={index}
                        onChange={updateQuestion}
                        onOptionChange={updateOption}
                        onRemove={removeQuestion}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                onClick={onBack}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                {isEdit ? <Save size={16} /> : <Plus size={16} />}
                {isEdit ? "Save Changes" : `Create ${type}`}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function QuestionEditor({
  question,
  index,
  onChange,
  onOptionChange,
  onRemove,
}: {
  question: Question;
  index: number;
  onChange: (
    id: string,
    field: keyof Question,
    value: string | number
  ) => void;
  onOptionChange: (
    questionId: string,
    index: number,
    value: string
  ) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[#173B67]">
          Question {index + 1}
        </p>
        <button
          onClick={() => onRemove(question.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
          title="Remove question"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <input
        value={question.question}
        onChange={(e) =>
          onChange(question.id, "question", e.target.value)
        }
        placeholder="Enter your question"
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, optionIndex) => (
          <input
            key={`${question.id}-${optionIndex}`}
            value={option}
            onChange={(e) =>
              onOptionChange(question.id, optionIndex, e.target.value)
            }
            placeholder={`Option ${optionIndex + 1}`}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
        <select
          value={question.correctAnswer}
          onChange={(e) =>
            onChange(question.id, "correctAnswer", e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Select Correct Answer</option>
          {question.options
            .filter((option) => option.trim())
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>

        <input
          type="number"
          min="1"
          value={question.marks}
          onChange={(e) =>
            onChange(question.id, "marks", Number(e.target.value))
          }
          placeholder="Marks"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>
    </div>
  );
}

function GradePage({
  item,
  onBack,
}: {
  item: AssignmentQuiz;
  onBack: () => void;
}) {
  const [students, setStudents] = useState<GradingStudent[]>([
    {
      name: "Ananya Reddy",
      roll: "FS08-01",
      submitted: "24 Aug 2026, 5:30 PM",
      status: "Graded",
      marks: "18/20",
    },
    {
      name: "Vikram Rao",
      roll: "FS08-02",
      submitted: "24 Aug 2026, 6:10 PM",
      status: "Graded",
      marks: "16/20",
    },
    {
      name: "Sneha Patil",
      roll: "FS08-03",
      submitted: "25 Aug 2026, 9:15 AM",
      status: "Pending",
      marks: "--",
    },
    {
      name: "Rahul Kumar",
      roll: "FS08-04",
      submitted: "25 Aug 2026, 10:20 AM",
      status: "Pending",
      marks: "--",
    },
  ]);

  const [selectedRoll, setSelectedRoll] = useState(students[0].roll);
  const selectedStudent =
    students.find((student) => student.roll === selectedRoll) ??
    students[0];

  const [marks, setMarks] = useState(
    selectedStudent.marks.split("/")[0] === "--"
      ? ""
      : selectedStudent.marks.split("/")[0]
  );
  const [feedback, setFeedback] = useState(
    "Good implementation. Improve error handling for invalid IDs."
  );

  const selectStudent = (student: GradingStudent) => {
    setSelectedRoll(student.roll);
    setMarks(
      student.marks.split("/")[0] === "--"
        ? ""
        : student.marks.split("/")[0]
    );
  };

  const saveGrade = () => {
    const maxMarks = item.totalMarks ?? 20;
    const numericMarks = Number(marks);

    if (
      !marks ||
      Number.isNaN(numericMarks) ||
      numericMarks < 0 ||
      numericMarks > maxMarks
    ) {
      alert(`Enter marks between 0 and ${maxMarks}.`);
      return;
    }

    setStudents((current) =>
      current.map((student) =>
        student.roll === selectedRoll
          ? {
              ...student,
              status: "Graded",
              marks: `${numericMarks}/${maxMarks}`,
            }
          : student
      )
    );

    alert("Grade saved successfully.");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]"
        >
          <ArrowLeft size={16} />
          Back to Assignments
        </button>

        <div className="mb-6 rounded-2xl bg-[#173B67] p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
            Grading
          </p>
          <h1 className="mt-1 text-2xl font-bold">{item.title}</h1>
          <p className="mt-1 text-sm text-blue-100">
            {item.batch} · Due: {item.due} · Total Marks:{" "}
            {item.totalMarks ?? 20}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Student Submissions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Select a student to review and grade.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map((student) => (
                <button
                  key={student.roll}
                  onClick={() => selectStudent(student)}
                  className={`w-full p-4 text-left transition hover:bg-slate-50 ${
                    selectedStudent.roll === student.roll
                      ? "bg-orange-50/60"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {student.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {student.roll} · {student.submitted}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-bold ${
                          student.status === "Graded"
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {student.status}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {student.marks}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-[#173B67]">
              {selectedStudent.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedStudent.roll}
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Submitted:</span>{" "}
              {selectedStudent.submitted}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Trainer Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Marks
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max={item.totalMarks ?? 20}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="h-11 w-24 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <span className="text-sm text-slate-500">
                  / {item.totalMarks ?? 20}
                </span>
              </div>
            </div>

            <button
              onClick={saveGrade}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
            >
              <Save size={16} />
              Save Grade
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function QuizResultsPage({
  item,
  onBack,
}: {
  item: AssignmentQuiz;
  onBack: () => void;
}) {
  const results = [
    { name: "Ananya Reddy", score: "19/20", percentage: "95%", status: "Passed" },
    { name: "Vikram Rao", score: "17/20", percentage: "85%", status: "Passed" },
    { name: "Sneha Patil", score: "14/20", percentage: "70%", status: "Passed" },
    { name: "Rahul Kumar", score: "9/20", percentage: "45%", status: "Failed" },
  ];

  const passed = results.filter((result) => result.status === "Passed").length;
  const average = (
    results.reduce(
      (sum, result) => sum + Number(result.score.split("/")[0]),
      0
    ) / results.length
  ).toFixed(1);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]"
        >
          <ArrowLeft size={16} />
          Back to Assignments
        </button>

        <div className="mb-6 rounded-2xl bg-[#173B67] p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
            Quiz Results
          </p>
          <h1 className="mt-1 text-2xl font-bold">{item.title}</h1>
          <p className="mt-1 text-sm text-blue-100">
            {item.batch} · {item.questions?.length ?? 10} Questions ·{" "}
            {item.totalMarks ?? 20} Marks
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResultCard
            icon={<Users size={18} />}
            label="Submissions"
            value={item.submissions}
          />
          <ResultCard
            icon={<CheckCircle2 size={18} />}
            label="Average Score"
            value={`${average} / ${item.totalMarks ?? 20}`}
          />
          <ResultCard
            icon={<Clock3 size={18} />}
            label="Highest Score"
            value="20 / 20"
          />
          <ResultCard
            icon={<ClipboardList size={18} />}
            label="Passed"
            value={`${passed} / ${results.length}`}
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Student Results</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Student</TableHeader>
                  <TableHeader>Score</TableHeader>
                  <TableHeader>Percentage</TableHeader>
                  <TableHeader>Status</TableHeader>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr
                    key={result.name}
                    className="border-t border-slate-100"
                  >
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.score}</TableCell>
                    <TableCell>{result.percentage}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          result.status === "Passed"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {result.status}
                      </span>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-bold text-[#173B67]">{value}</p>
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
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  iconClass,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  iconClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        <ClipboardList size={29} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">
        No assignments or quizzes found
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Try changing the search or filters, or create a new assessment.
      </p>
    </div>
  );
}

function TypeBadge({ type }: { type: ItemType }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
        type === "Assignment"
          ? "bg-blue-50 text-blue-700"
          : "bg-green-50 text-green-700"
      }`}
    >
      {type}
    </span>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-5 py-4 text-sm text-slate-600">{children}</td>;
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
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
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
      >
        <X size={18} />
      </button>
    </div>
  );
}
