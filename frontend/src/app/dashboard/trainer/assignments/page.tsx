"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  ClipboardList,
  HelpCircle,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

type ItemType = "Assignment" | "Quiz";

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

type View =
  | "list"
  | "create"
  | "edit"
  | "grade"
  | "results";

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
        options: [
          "useEffect",
          "useState",
          "useContext",
          "useRef",
        ],
        correctAnswer: "useState",
        marks: 2,
      },
      {
        id: "Q2",
        question:
          "Which hook is commonly used for side effects?",
        options: [
          "useState",
          "useMemo",
          "useEffect",
          "useCallback",
        ],
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
  const [items, setItems] =
    useState<AssignmentQuiz[]>(INITIAL_ITEMS);

  const [view, setView] = useState<View>("list");

  const [selectedItem, setSelectedItem] =
    useState<AssignmentQuiz | null>(null);

  const [createType, setCreateType] =
    useState<ItemType | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] =
    useState<"All" | ItemType>("All");
  const [filterBatch, setFilterBatch] =
    useState("All");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems(INITIAL_ITEMS);
      }
    }
  }, []);

  const saveItems = (updated: AssignmentQuiz[]) => {
    setItems(updated);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  };

  const handleCreate = (item: AssignmentQuiz) => {
    const updated = [...items, item];

    saveItems(updated);

    setView("list");
    setCreateType(null);
  };

  const handleEdit = (item: AssignmentQuiz) => {
    const updated = items.map((existing) =>
      existing.id === item.id ? item : existing
    );

    saveItems(updated);

    setView("list");
    setSelectedItem(null);
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    const updated = items.filter(
      (item) => item.id !== id
    );

    saveItems(updated);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.batch
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType =
      filterType === "All" ||
      item.type === filterType;

    const matchesBatch =
      filterBatch === "All" ||
      item.batch === filterBatch;

    return (
      matchesSearch &&
      matchesType &&
      matchesBatch
    );
  });

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

  if (
    view === "edit" &&
    selectedItem
  ) {
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

  if (
    view === "grade" &&
    selectedItem
  ) {
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

  if (
    view === "results" &&
    selectedItem
  ) {
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
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 4px",
            }}
          >
            Assignments & Quizzes
          </h1>

          <p
            style={{
              color: "#6B7280",
              fontSize: 14,
              margin: 0,
            }}
          >
            Created assignments and quizzes across your
            batches.
          </p>
        </div>

        <button
          onClick={() => setCreateType(null)}
          style={createButton}
        >
          <Plus size={16} />
          Create New
        </button>
      </div>

      {/* FILTERS */}

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #EEF0F4",
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search assignments or quizzes..."
          style={{
            flex: 1,
            border: "1px solid #DDE2EA",
            borderRadius: 7,
            padding: "9px 11px",
            fontSize: 13,
            outline: "none",
          }}
        />

        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(
              e.target.value as
                | "All"
                | ItemType
            )
          }
          style={selectStyle}
        >
          <option value="All">All Types</option>
          <option value="Assignment">
            Assignments
          </option>
          <option value="Quiz">Quizzes</option>
        </select>

        <select
          value={filterBatch}
          onChange={(e) =>
            setFilterBatch(e.target.value)
          }
          style={selectStyle}
        >
          <option value="All">All Batches</option>

          {BATCHES.map((batch) => (
            <option key={batch}>
              {batch}
            </option>
          ))}
        </select>
      </div>

      {/* ITEMS */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04)",
              border:
                "1px solid #EEF0F4",
            }}
          >
            {/* LEFT */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9,
                  background:
                    item.type === "Assignment"
                      ? "#EEF3FF"
                      : "#F0FDF4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.type ===
                "Assignment" ? (
                  <ClipboardList
                    size={19}
                    color="#2F6BFF"
                  />
                ) : (
                  <HelpCircle
                    size={19}
                    color="#16A34A"
                  />
                )}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                    marginTop: 3,
                  }}
                >
                  {item.type} · {item.batch} · Due:{" "}
                  {item.due}
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  background: "#FDF3E3",
                  color: "#B4790E",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 6,
                }}
              >
                {item.submissions} submissions
              </span>

              <button
                onClick={() => {
                  setSelectedItem(item);
                  setView(
                    item.type ===
                      "Assignment"
                      ? "grade"
                      : "results"
                  );
                }}
                style={actionButton}
              >
                {item.type ===
                "Assignment"
                  ? "Grade →"
                  : "View Results →"}
              </button>

              <button
                onClick={() => {
                  setSelectedItem(item);
                  setView("edit");
                }}
                style={iconButton}
                title="Edit"
              >
                <Pencil size={15} />
              </button>

              <button
                onClick={() =>
                  handleDelete(item.id)
                }
                style={{
                  ...iconButton,
                  color: "#DC2626",
                }}
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div
            style={{
              background: "#FFFFFF",
              border:
                "1px solid #EEF0F4",
              borderRadius: 12,
              padding: 50,
              textAlign: "center",
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            No assignments or quizzes
            found.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}

      {createType === null &&
        view === "list" && (
          <CreateChoiceModal
            onClose={() =>
              setCreateType("Assignment")
            }
            onSelect={(type) => {
              setCreateType(type);
              setView("create");
            }}
          />
        )}
    </main>
  );
}

/* =========================================================
   CREATE CHOICE MODAL
========================================================= */

function CreateChoiceModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (type: ItemType) => void;
}) {
  return (
    <div style={overlayStyle}>
      <div
        style={{
          width: 450,
          background: "#FFFFFF",
          borderRadius: 14,
          padding: 24,
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: "#111827",
              }}
            >
              Create New
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6B7280",
                fontSize: 13,
              }}
            >
              Choose what you want to create.
            </p>
          </div>

          <button
            onClick={onClose}
            style={closeButton}
          >
            <X size={17} />
          </button>
        </div>

        <ChoiceCard
          icon={
            <ClipboardList
              size={22}
              color="#2F6BFF"
            />
          }
          title="Assignment"
          description="Create an assignment for students in a batch."
          onClick={() =>
            onSelect("Assignment")
          }
        />

        <ChoiceCard
          icon={
            <HelpCircle
              size={22}
              color="#16A34A"
            />
          }
          title="Quiz"
          description="Create questions and assess student knowledge."
          onClick={() =>
            onSelect("Quiz")
          }
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border:
          "1px solid #E5E7EB",
        background: "#FFFFFF",
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 9,
          background: "#F5F7FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontWeight: 600,
            color: "#111827",
            fontSize: 14,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#6B7280",
            fontSize: 12.5,
            marginTop: 3,
          }}
        >
          {description}
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   CREATE / EDIT FORM
========================================================= */

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

  const [title, setTitle] = useState(
    editItem?.title || ""
  );

  const [batch, setBatch] = useState(
    editItem?.batch || BATCHES[0]
  );

  const [description, setDescription] =
    useState(
      editItem?.description || ""
    );

  const [due, setDue] = useState(
    editItem?.due || ""
  );

  const [totalMarks, setTotalMarks] =
    useState(
      editItem?.totalMarks?.toString() ||
        "20"
    );

  const [duration, setDuration] =
    useState(
      editItem?.duration?.toString() ||
        "20"
    );

  const [questions, setQuestions] =
    useState<Question[]>(
      editItem?.questions || []
    );

  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      {
        id: `Q-${Date.now()}`,
        question: "",
        options: [
          "",
          "",
          "",
          "",
        ],
        correctAnswer: "",
        marks: 2,
      },
    ]);
  };

  const updateQuestion = (
    id: string,
    field: keyof Question,
    value: any
  ) => {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === id
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  };

  const updateOption = (
    questionId: string,
    index: number,
    value: string
  ) => {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options:
                question.options.map(
                  (option, i) =>
                    i === index
                      ? value
                      : option
                ),
            }
          : question
      )
    );
  };

  const removeQuestion = (
    id: string
  ) => {
    setQuestions((previous) =>
      previous.filter(
        (question) =>
          question.id !== id
      )
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (type === "Assignment" && !due) {
      alert("Please select a due date.");
      return;
    }

    if (
      type === "Quiz" &&
      questions.length === 0
    ) {
      alert(
        "Please add at least one question."
      );
      return;
    }

    const item: AssignmentQuiz = {
      id:
        editItem?.id ||
        `${type === "Assignment" ? "ASSIGN" : "QUIZ"}-${Date.now()}`,
      title,
      type,
      batch,
      due:
        type === "Quiz"
          ? "Open"
          : due,
      submissions:
        editItem?.submissions || 0,
      description,
      totalMarks:
        Number(totalMarks) || 20,
      duration:
        type === "Quiz"
          ? Number(duration) || 20
          : undefined,
      questions:
        type === "Quiz"
          ? questions
          : undefined,
    };

    onCreate(item);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "28px 32px",
      }}
    >
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "transparent",
          color: "#374151",
          display: "flex",
          alignItems: "center",
          gap: 7,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 18,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div
        style={{
          maxWidth: 850,
          background: "#FFFFFF",
          border:
            "1px solid #EEF0F4",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div
          style={{
            marginBottom: 22,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {isEdit
              ? `Edit ${type}`
              : `Create ${type}`}
          </h1>

          <p
            style={{
              margin:
                "5px 0 0",
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            {type ===
            "Assignment"
              ? "Create an assignment for students in a selected batch."
              : "Create a quiz with multiple-choice questions."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              type === "Assignment"
                ? "1fr 1fr"
                : "1fr 1fr",
            gap: 18,
          }}
        >
          <FormField
            label={
              type === "Assignment"
                ? "Assignment Title"
                : "Quiz Title"
            }
          >
            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder={
                type ===
                "Assignment"
                  ? "Node.js CRUD API"
                  : "React Hooks Quiz"
              }
              style={inputStyle}
            />
          </FormField>

          <FormField label="Batch">
            <select
              value={batch}
              onChange={(e) =>
                setBatch(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              {BATCHES.map(
                (batchName) => (
                  <option
                    key={batchName}
                  >
                    {batchName}
                  </option>
                )
              )}
            </select>
          </FormField>

          {type ===
            "Assignment" && (
            <FormField label="Due Date">
              <input
                type="date"
                value={due}
                onChange={(e) =>
                  setDue(
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          )}

          <FormField label="Total Marks">
            <input
              type="number"
              min="1"
              value={totalMarks}
              onChange={(e) =>
                setTotalMarks(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </FormField>

          {type === "Quiz" && (
            <FormField label="Duration">
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    e.target.value
                  )
                }
                style={inputStyle}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#6B7280",
                }}
              >
                Duration in minutes
              </span>
            </FormField>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
          }}
        >
          <FormField
            label={
              type === "Assignment"
                ? "Description"
                : "Instructions"
            }
          >
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder={
                type ===
                "Assignment"
                  ? "Enter assignment description..."
                  : "Enter quiz instructions..."
              }
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </FormField>
        </div>

        {type === "Quiz" && (
          <div
            style={{
              marginTop: 25,
              borderTop:
                "1px solid #EEF0F4",
              paddingTop: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: "#111827",
                  }}
                >
                  Questions
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    color:
                      "#6B7280",
                    fontSize: 12,
                  }}
                >
                  Add multiple-choice
                  questions.
                </p>
              </div>

              <button
                onClick={
                  addQuestion
                }
                style={
                  secondaryButton
                }
              >
                <Plus size={15} />
                Add Question
              </button>
            </div>

            {questions.map(
              (question, index) => (
                <div
                  key={
                    question.id
                  }
                  style={{
                    border:
                      "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 13,
                        color:
                          "#111827",
                      }}
                    >
                      Question{" "}
                      {index + 1}
                    </strong>

                    <button
                      onClick={() =>
                        removeQuestion(
                          question.id
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          "#DC2626",
                        cursor:
                          "pointer",
                      }}
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>

                  <input
                    value={
                      question.question
                    }
                    onChange={(e) =>
                      updateQuestion(
                        question.id,
                        "question",
                        e.target
                          .value
                      )
                    }
                    placeholder="Enter your question"
                    style={
                      inputStyle
                    }
                  />

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    {question.options.map(
                      (
                        option,
                        optionIndex
                      ) => (
                        <input
                          key={
                            optionIndex
                          }
                          value={
                            option
                          }
                          onChange={(
                            e
                          ) =>
                            updateOption(
                              question.id,
                              optionIndex,
                              e.target
                                .value
                            )
                          }
                          placeholder={`Option ${
                            optionIndex +
                            1
                          }`}
                          style={
                            inputStyle
                          }
                        />
                      )
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 120px",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <select
                      value={
                        question.correctAnswer
                      }
                      onChange={(e) =>
                        updateQuestion(
                          question.id,
                          "correctAnswer",
                          e.target
                            .value
                        )
                      }
                      style={
                        inputStyle
                      }
                    >
                      <option value="">
                        Select Correct
                        Answer
                      </option>

                      {question.options
                        .filter(
                          (option) =>
                            option.trim()
                        )
                        .map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>
                          )
                        )}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={
                        question.marks
                      }
                      onChange={(
                        e
                      ) =>
                        updateQuestion(
                          question.id,
                          "marks",
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                      style={
                        inputStyle
                      }
                      placeholder="Marks"
                    />
                  </div>
                </div>
              )
            )}

            {questions.length ===
              0 && (
              <div
                style={{
                  border:
                    "1px dashed #CBD5E1",
                  borderRadius: 10,
                  padding: 30,
                  textAlign:
                    "center",
                  color:
                    "#6B7280",
                  fontSize: 13,
                }}
              >
                No questions added
                yet.
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 10,
            marginTop: 25,
            borderTop:
              "1px solid #EEF0F4",
            paddingTop: 20,
          }}
        >
          <button
            onClick={onBack}
            style={
              secondaryButton
            }
          >
            Cancel
          </button>

          <button
            onClick={
              handleSubmit
            }
            style={
              createButton
            }
          >
            {isEdit
              ? "Save Changes"
              : `Create ${type}`}
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   GRADE PAGE
========================================================= */

function GradePage({
  item,
  onBack,
}: {
  item: AssignmentQuiz;
  onBack: () => void;
}) {
  const students = [
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
  ];

  const [selectedStudent, setSelectedStudent] =
    useState(students[0]);

  const [marks, setMarks] = useState(
    "18"
  );

  const [feedback, setFeedback] =
    useState(
      "Good implementation. Improve error handling for invalid IDs."
    );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "28px 32px",
      }}
    >
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "#374151",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          marginBottom: 18,
        }}
      >
        <ArrowLeft size={16} />
        Back to Assignments
      </button>

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            color: "#111827",
          }}
        >
          {item.title}
        </h1>

        <p
          style={{
            margin: "5px 0 0",
            color: "#6B7280",
            fontSize: 13,
          }}
        >
          {item.batch} · Due:{" "}
          {item.due} · Total Marks:{" "}
          {item.totalMarks || 20}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.4fr 1fr",
          gap: 18,
        }}
      >
        {/* STUDENTS */}

        <div
          style={{
            background: "#FFFFFF",
            border:
              "1px solid #EEF0F4",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom:
                "1px solid #EEF0F4",
              fontWeight: 600,
              color: "#111827",
              fontSize: 14,
            }}
          >
            Student Submissions
          </div>

          {students.map(
            (student) => (
              <button
                key={student.roll}
                onClick={() => {
                  setSelectedStudent(
                    student
                  );
                  setMarks(
                    student.marks
                      .split("/")[0] ===
                      "--"
                      ? ""
                      : student.marks.split(
                          "/"
                        )[0]
                  );
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom:
                    "1px solid #F1F2F5",
                  background:
                    selectedStudent.roll ===
                    student.roll
                      ? "#F5F8FF"
                      : "#FFFFFF",
                  padding:
                    "14px 16px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color:
                          "#111827",
                      }}
                    >
                      {
                        student.name
                      }
                    </div>

                    <div
                      style={{
                        fontSize: 11.5,
                        color:
                          "#6B7280",
                        marginTop: 3,
                      }}
                    >
                      {
                        student.roll
                      }{" "}
                      ·{" "}
                      {
                        student.submitted
                      }
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          student.status ===
                          "Graded"
                            ? "#16A34A"
                            : "#B4790E",
                      }}
                    >
                      {
                        student.status
                      }
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 3,
                        color:
                          "#374151",
                      }}
                    >
                      {
                        student.marks
                      }
                    </div>
                  </div>
                </div>
              </button>
            )
          )}
        </div>

        {/* GRADE */}

        <div
          style={{
            background: "#FFFFFF",
            border:
              "1px solid #EEF0F4",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: 16,
              color: "#111827",
            }}
          >
            {selectedStudent.name}
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            {selectedStudent.roll}
          </p>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 8,
              padding: 13,
              marginBottom: 18,
              fontSize: 12.5,
              color: "#374151",
            }}
          >
            Submitted:{" "}
            {
              selectedStudent.submitted
            }
          </div>

          <FormField label="Trainer Feedback">
            <textarea
              value={feedback}
              onChange={(e) =>
                setFeedback(
                  e.target.value
                )
              }
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </FormField>

          <FormField label="Marks">
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 8,
              }}
            >
              <input
                type="number"
                value={marks}
                onChange={(e) =>
                  setMarks(
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  width: 100,
                }}
              />

              <span
                style={{
                  fontSize: 13,
                  color:
                    "#6B7280",
                }}
              >
                /{" "}
                {item.totalMarks ||
                  20}
              </span>
            </div>
          </FormField>

          <button
            onClick={() =>
              alert(
                "Grade saved successfully."
              )
            }
            style={{
              ...createButton,
              width: "100%",
              justifyContent:
                "center",
              marginTop: 8,
            }}
          >
            Save Grade
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   QUIZ RESULTS
========================================================= */

function QuizResultsPage({
  item,
  onBack,
}: {
  item: AssignmentQuiz;
  onBack: () => void;
}) {
  const results = [
    {
      name: "Ananya Reddy",
      score: "19/20",
      percentage: "95%",
      status: "Passed",
    },
    {
      name: "Vikram Rao",
      score: "17/20",
      percentage: "85%",
      status: "Passed",
    },
    {
      name: "Sneha Patil",
      score: "14/20",
      percentage: "70%",
      status: "Passed",
    },
    {
      name: "Rahul Kumar",
      score: "9/20",
      percentage: "45%",
      status: "Failed",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "28px 32px",
      }}
    >
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "#374151",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          marginBottom: 18,
        }}
      >
        <ArrowLeft size={16} />
        Back to Assignments
      </button>

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            color: "#111827",
          }}
        >
          {item.title}
        </h1>

        <p
          style={{
            margin: "5px 0 0",
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          {item.batch} ·{" "}
          {item.questions?.length ||
            10} Questions ·{" "}
          {item.totalMarks || 20} Marks
        </p>
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <ResultCard
          icon={
            <Users size={17} />
          }
          label="Submissions"
          value={item.submissions}
        />

        <ResultCard
          icon={
            <CheckCircle2
              size={17}
            />
          }
          label="Average Score"
          value="15.8 / 20"
        />

        <ResultCard
          icon={<Clock size={17} />}
          label="Highest Score"
          value="20 / 20"
        />

        <ResultCard
          icon={
            <ClipboardList
              size={17}
            />
          }
          label="Passed"
          value="15 / 18"
        />
      </div>

      {/* RESULTS */}

      <div
        style={{
          background: "#FFFFFF",
          border:
            "1px solid #EEF0F4",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom:
              "1px solid #EEF0F4",
            fontSize: 14,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Student Results
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr 1fr 1fr",
            padding:
              "12px 18px",
            background:
              "#FAFBFC",
            fontSize: 12,
            fontWeight: 600,
            color: "#6B7280",
          }}
        >
          <span>Student</span>
          <span>Score</span>
          <span>Percentage</span>
          <span>Status</span>
        </div>

        {results.map(
          (result) => (
            <div
              key={result.name}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "2fr 1fr 1fr 1fr",
                padding:
                  "14px 18px",
                borderTop:
                  "1px solid #F1F2F5",
                alignItems:
                  "center",
                fontSize: 13,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color:
                    "#111827",
                }}
              >
                {result.name}
              </span>

              <span>
                {result.score}
              </span>

              <span>
                {
                  result.percentage
                }
              </span>

              <span
                style={{
                  color:
                    result.status ===
                    "Passed"
                      ? "#16A34A"
                      : "#DC2626",
                  fontWeight: 600,
                }}
              >
                {result.status}
              </span>
            </div>
          )
        )}
      </div>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border:
          "1px solid #EEF0F4",
        borderRadius: 10,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 11,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: "#EEF3FF",
          color: "#2F6BFF",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 11.5,
            color: "#6B7280",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#111827",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const createButton: React.CSSProperties = {
  border: "none",
  background: "#2F6BFF",
  color: "#fff",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 7,
};

const actionButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#16A34A",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: "5px 2px",
};

const iconButton: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid #DDE2EA",
  background: "#FFFFFF",
  borderRadius: 7,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#2F6BFF",
  cursor: "pointer",
};

const closeButton: React.CSSProperties = {
  width: 30,
  height: 30,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  borderRadius: 7,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#6B7280",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid #DDE2EA",
  background: "#FFFFFF",
  color: "#374151",
  borderRadius: 7,
  padding: "9px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #DDE2EA",
  background: "#FFFFFF",
  borderRadius: 7,
  padding: "9px 10px",
  fontSize: 13,
  color: "#111827",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  border: "1px solid #DDE2EA",
  background: "#FFFFFF",
  borderRadius: 7,
  padding: "9px 10px",
  fontSize: 13,
  color: "#374151",
  outline: "none",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};