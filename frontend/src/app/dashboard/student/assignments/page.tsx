"use client";

import { useRef, useState } from "react";
import {
  ClipboardList,
  HelpCircle,
  CalendarDays,
  Clock3,
  CheckCircle2,
  CircleAlert,
  Eye,
  Upload,
  X,
  FileText,
  Award,
  Trash2,
} from "lucide-react";

type Assessment = {
  id: string;
  title: string;
  type: "Assignment" | "Quiz";
  course: string;
  batch: string;
  dueDate: string;
  dueTime: string;
  status: "Not started" | "In progress" | "Submitted" | "Graded";
  marks: number;
  score?: number;
  description: string;
  instructions: string[];
};

const INITIAL_ASSIGNMENTS: Assessment[] = [
  {
    id: "ASSIGN-001",
    title: "Node.js CRUD API",
    type: "Assignment",
    course: "Job Oriented Courses",
    batch: "BATCH-FS-08",
    dueDate: "25 Aug 2026",
    dueTime: "11:59 PM",
    status: "Not started",
    marks: 20,
    description:
      "Build a REST API implementing Create, Read, Update and Delete operations using Node.js.",
    instructions: [
      "Create a Node.js REST API.",
      "Implement CRUD operations.",
      "Use appropriate HTTP methods.",
      "Handle validation and errors.",
      "Submit the completed project before the due date.",
    ],
  },
  {
    id: "ASSIGN-002",
    title: "React Mini Project",
    type: "Assignment",
    course: "Job Oriented Courses",
    batch: "BATCH-FS-09",
    dueDate: "30 Aug 2026",
    dueTime: "11:59 PM",
    status: "In progress",
    marks: 25,
    description:
      "Develop a small React application demonstrating components, state management and API integration.",
    instructions: [
      "Create a React application.",
      "Use reusable components.",
      "Implement state management.",
      "Connect the application to an API.",
      "Submit the project files.",
    ],
  },
  {
    id: "QUIZ-001",
    title: "React Hooks Quiz",
    type: "Quiz",
    course: "Job Oriented Courses",
    batch: "BATCH-FS-08",
    dueDate: "Submitted",
    dueTime: "",
    status: "Submitted",
    marks: 10,
    description:
      "Test your understanding of React Hooks and their practical usage.",
    instructions: [
      "Answer all questions.",
      "Read each question carefully.",
      "Submit the quiz before leaving the assessment.",
    ],
  },
  {
    id: "QUIZ-002",
    title: "SQL Joins Quiz",
    type: "Quiz",
    course: "Job Oriented Courses",
    batch: "BATCH-FS-08",
    dueDate: "Graded",
    dueTime: "",
    status: "Graded",
    marks: 10,
    score: 8,
    description:
      "Evaluate your understanding of SQL joins, relationships and query results.",
    instructions: [
      "Answer all questions.",
      "Choose the best answer.",
      "Submit the quiz when finished.",
    ],
  },
];

const STATUS_STYLES: Record<
  Assessment["status"],
  { bg: string; fg: string; icon: React.ReactNode }
> = {
  "Not started": {
    bg: "#FFF7E8",
    fg: "#B4790E",
    icon: <CircleAlert size={14} />,
  },
  "In progress": {
    bg: "#EAF0FE",
    fg: "#3B6BF0",
    icon: <Clock3 size={14} />,
  },
  Submitted: {
    bg: "#E9F9EF",
    fg: "#22A555",
    icon: <CheckCircle2 size={14} />,
  },
  Graded: {
    bg: "#F1EAFE",
    fg: "#8A3FEB",
    icon: <Award size={14} />,
  },
};

type FilterType = "All" | "Assignment" | "Quiz";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assessment[]>(
    INITIAL_ASSIGNMENTS
  );

  const [filter, setFilter] = useState<FilterType>("All");

  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);

  const updateAssessmentStatus = (
    assessmentId: string,
    status: Assessment["status"]
  ) => {
    setAssignments((current) =>
      current.map((item) =>
        item.id === assessmentId
          ? {
              ...item,
              status,
              dueDate:
                status === "Submitted"
                  ? "Submitted"
                  : item.dueDate,
            }
          : item
      )
    );

    setSelectedAssessment((current) =>
      current && current.id === assessmentId
        ? {
            ...current,
            status,
            dueDate:
              status === "Submitted"
                ? "Submitted"
                : current.dueDate,
          }
        : current
    );
  };

  const filteredAssignments = assignments.filter((item) => {
    if (filter === "All") return true;
    return item.type === filter;
  });

  const totalAssignments = assignments.filter(
    (item) => item.type === "Assignment"
  ).length;

  const totalQuizzes = assignments.filter(
    (item) => item.type === "Quiz"
  ).length;

  const completed = assignments.filter(
    (item) =>
      item.status === "Submitted" || item.status === "Graded"
  ).length;

  const pending = assignments.filter(
    (item) =>
      item.status === "Not started" ||
      item.status === "In progress"
  ).length;

  return (
    <main
      style={{
        padding: "28px 32px 40px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 5px",
          }}
        >
          Assignments & Quizzes
        </h1>

        <p
          style={{
            color: "#6B7280",
            fontSize: "14px",
            margin: 0,
          }}
        >
          Track your assignments, quizzes, submissions and results.
        </p>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          icon={<ClipboardList size={19} />}
          label="Total Assessments"
          value={String(assignments.length)}
        />

        <SummaryCard
          icon={<FileText size={19} />}
          label="Assignments"
          value={String(totalAssignments)}
        />

        <SummaryCard
          icon={<HelpCircle size={19} />}
          label="Quizzes"
          value={String(totalQuizzes)}
        />

        <SummaryCard
          icon={<CheckCircle2 size={19} />}
          label="Completed"
          value={`${completed} / ${assignments.length}`}
          secondary={`${pending} pending`}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        {(["All", "Assignment", "Quiz"] as FilterType[]).map(
          (item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{
                border:
                  filter === item
                    ? "1px solid #2F6BFF"
                    : "1px solid #D7DCE5",
                background:
                  filter === item ? "#2F6BFF" : "#FFFFFF",
                color:
                  filter === item ? "#FFFFFF" : "#374151",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {item === "All"
                ? "All"
                : item === "Assignment"
                ? "Assignments"
                : "Quizzes"}
            </button>
          )
        )}
      </div>

      {/* Assessment List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {filteredAssignments.map((assessment) => {
          const status = STATUS_STYLES[assessment.status];

          return (
            <div
              key={assessment.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "13px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "18px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "13px",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background:
                        assessment.type === "Quiz"
                          ? "#F1EAFE"
                          : "#EAF0FE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {assessment.type === "Quiz" ? (
                      <HelpCircle
                        size={20}
                        color="#8A3FEB"
                      />
                    ) : (
                      <ClipboardList
                        size={20}
                        color="#2F6BFF"
                      />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <h2
                      style={{
                        margin: "0 0 5px",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {assessment.title}
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        flexWrap: "wrap",
                        fontSize: "11.5px",
                        color: "#6B7280",
                      }}
                    >
                      <span>{assessment.type}</span>
                      <span>•</span>
                      <span>{assessment.course}</span>
                      <span>•</span>
                      <span>{assessment.batch}</span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "7px",
                        fontSize: "11.5px",
                        color: "#6B7280",
                      }}
                    >
                      {assessment.status === "Submitted" ||
                      assessment.status === "Graded" ? (
                        <>
                          <CheckCircle2 size={13} />
                          {assessment.status}
                        </>
                      ) : (
                        <>
                          <CalendarDays size={13} />
                          Due {assessment.dueDate}
                        </>
                      )}

                      {assessment.dueTime && (
                        <>
                          <span>•</span>
                          <Clock3 size={13} />
                          {assessment.dueTime}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      background: status.bg,
                      color: status.fg,
                      fontSize: "11.5px",
                      fontWeight: 600,
                      padding: "6px 10px",
                      borderRadius: "7px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status.icon}
                    {assessment.status}
                  </span>

                  <button
                    onClick={() =>
                      setSelectedAssessment(assessment)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      border: "1px solid #D7DCE5",
                      background: "#FFFFFF",
                      color: "#374151",
                      borderRadius: "7px",
                      padding: "7px 11px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Eye size={14} />

                    {assessment.status === "Graded"
                      ? "View Result"
                      : assessment.status === "Submitted"
                      ? "View Submission"
                      : "Open"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "13px",
            padding: "50px 25px",
            textAlign: "center",
          }}
        >
          <ClipboardList
            size={40}
            color="#9CA3AF"
            style={{ marginBottom: "10px" }}
          />

          <h3
            style={{
              margin: "0 0 5px",
              fontSize: "16px",
              color: "#111827",
            }}
          >
            No Assessments Found
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#6B7280",
            }}
          >
            Assessments assigned to your courses will appear here.
          </p>
        </div>
      )}

      {selectedAssessment && (
        <AssessmentModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onSubmit={() =>
            updateAssessmentStatus(
              selectedAssessment.id,
              "Submitted"
            )
          }
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "11px",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "9px",
          background: "#EAF0FE",
          color: "#2F6BFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "10.5px",
            color: "#6B7280",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {value}
        </div>

        {secondary && (
          <div
            style={{
              marginTop: "2px",
              fontSize: "10px",
              color: "#9CA3AF",
            }}
          >
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assessment Modal                                                           */
/* -------------------------------------------------------------------------- */

function AssessmentModal({
  assessment,
  onClose,
  onSubmit,
}: {
  assessment: Assessment;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [submissionComment, setSubmissionComment] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const isQuiz = assessment.type === "Quiz";

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;

    setSubmitting(true);

    /*
     * Frontend-only simulation.
     *
     * Later:
     * await uploadAssignment(...)
     *
     * The backend will store the file and submission record.
     */
    setTimeout(() => {
      setSubmitting(false);
      onSubmit();
    }, 500);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "700px",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: "15px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "15px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                color: "#9CA3AF",
                marginBottom: "5px",
              }}
            >
              {assessment.id}
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
                fontWeight: 700,
              }}
            >
              {assessment.title}
            </h2>

            <div
              style={{
                marginTop: "6px",
                fontSize: "11.5px",
                color: "#6B7280",
              }}
            >
              {assessment.type} · {assessment.batch}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "22px" }}>
          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "14px",
                color: "#111827",
              }}
            >
              Description
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: "12.5px",
                lineHeight: 1.7,
                color: "#6B7280",
              }}
            >
              {assessment.description}
            </p>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{
                margin: "0 0 9px",
                fontSize: "14px",
                color: "#111827",
              }}
            >
              Instructions
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
              }}
            >
              {assessment.instructions.map(
                (instruction, index) => (
                  <div
                    key={instruction}
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#4B5563",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#EAF0FE",
                        color: "#2F6BFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </span>

                    <span>{instruction}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Marks */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                assessment.score !== undefined
                  ? "1fr 1fr"
                  : "1fr",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "11px",
                borderRadius: "9px",
                background: "#F9FAFB",
                border: "1px solid #F0F1F3",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#9CA3AF",
                  marginBottom: "3px",
                }}
              >
                Maximum Marks
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {assessment.marks}
              </div>
            </div>

            {assessment.score !== undefined && (
              <div
                style={{
                  padding: "11px",
                  borderRadius: "9px",
                  background: "#F5F0FF",
                  border: "1px solid #E7D8FF",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#8A3FEB",
                    marginBottom: "3px",
                  }}
                >
                  Your Score
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#6D28D9",
                  }}
                >
                  {assessment.score}/{assessment.marks}
                </div>
              </div>
            )}
          </div>

          {/* Assignment Submission */}
          {!isQuiz && (
            <div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                Submission
              </h3>

              {assessment.status === "Submitted" ||
              assessment.status === "Graded" ? (
                <div
                  style={{
                    padding: "15px",
                    borderRadius: "10px",
                    background: "#ECFDF3",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#15803D",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "10px",
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Your assignment has been submitted.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#374151",
                    }}
                  >
                    <FileText size={16} />

                    <span>
                      Submitted assignment
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload Area */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      style={{
                        width: "100%",
                        minHeight: "145px",
                        border: "1.5px dashed #BFC8D8",
                        borderRadius: "11px",
                        background: "#FAFBFD",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "#EAF0FE",
                          color: "#2F6BFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <Upload size={21} />
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#374151",
                          marginBottom: "4px",
                        }}
                      >
                        Upload your assignment
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9CA3AF",
                        }}
                      >
                        Click to choose a file
                      </div>

                      <div
                        style={{
                          fontSize: "10px",
                          color: "#9CA3AF",
                          marginTop: "6px",
                        }}
                      >
                        PDF, DOC, DOCX, ZIP, PPTX, XLSX,
                        Images
                      </div>
                    </button>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #D9E1EF",
                        borderRadius: "11px",
                        background: "#F9FBFF",
                        padding: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "8px",
                            background: "#EAF0FE",
                            color: "#2F6BFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={19} />
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#111827",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {selectedFile.name}
                          </div>

                          <div
                            style={{
                              fontSize: "10px",
                              color: "#9CA3AF",
                              marginTop: "3px",
                            }}
                          >
                            {(
                              selectedFile.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={removeFile}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          border: "1px solid #E5E7EB",
                          background: "#FFFFFF",
                          color: "#6B7280",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}

                  {/* Optional Comment */}
                  <div style={{ marginTop: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: "7px",
                      }}
                    >
                      Submission Comment
                      <span
                        style={{
                          fontWeight: 400,
                          color: "#9CA3AF",
                        }}
                      >
                        {" "}
                        (optional)
                      </span>
                    </label>

                    <textarea
                      value={submissionComment}
                      onChange={(e) =>
                        setSubmissionComment(
                          e.target.value
                        )
                      }
                      placeholder="Add any comments for your trainer..."
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        boxSizing: "border-box",
                        resize: "vertical",
                        padding: "11px",
                        borderRadius: "9px",
                        border: "1px solid #D1D5DB",
                        outline: "none",
                        fontSize: "12px",
                        color: "#374151",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || submitting}
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: "8px",
                      background:
                        selectedFile && !submitting
                          ? "#2F6BFF"
                          : "#D1D5DB",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor:
                        selectedFile && !submitting
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <Upload size={15} />

                    {submitting
                      ? "Submitting..."
                      : "Submit Assignment"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Quiz */}
          {isQuiz && (
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: "#F8FAFF",
                border: "1px solid #E2E8FF",
              }}
            >
              {assessment.status === "Submitted" ||
              assessment.status === "Graded" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#15803D",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={18} />

                  Quiz submitted successfully.
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: "5px",
                    }}
                  >
                    Ready to take the quiz?
                  </div>

                  <p
                    style={{
                      margin: "0 0 12px",
                      fontSize: "11.5px",
                      color: "#6B7280",
                    }}
                  >
                    The actual quiz questions and scoring
                    system will be connected later.
                  </p>

                  <button
                    onClick={() => onSubmit()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 15px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#2F6BFF",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <HelpCircle size={15} />
                    Start Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#374151",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}