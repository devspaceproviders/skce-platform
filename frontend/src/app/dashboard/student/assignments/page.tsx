"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

function buildApiFileUrl(relativeUrl: string | null | undefined) {
  if (!relativeUrl) return null;

  if (
    relativeUrl.startsWith("http://") ||
    relativeUrl.startsWith("https://")
  ) {
    return relativeUrl;
  }

  if (relativeUrl.startsWith("/api/")) {
    return `${API_URL}/${relativeUrl.slice(5)}`;
  }

  return `${API_URL}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;
}

type BackendAssessmentType = "ASSIGNMENT" | "QUIZ";
type SubmissionStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED";

type FrontendAssessmentType = "Assignment" | "Quiz";
type FrontendStatus =
  | "Not started"
  | "In progress"
  | "Submitted"
  | "Graded";

type StudentSubmission = {
  id: number;
  attemptNumber: number;
  submissionFileName: string | null;
  submissionFileUrl: string | null;
  submissionComment: string | null;
  score: number | null;
  status: SubmissionStatus;
  feedback: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AssessmentListItem = {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  type: BackendAssessmentType;
  description: string | null;
  instructions: string | null;
  dueAt: string | null;
  totalMarks: number;
  durationMinutes: number | null;
  isActive: boolean;
  questionCount: number;
  latestSubmission: StudentSubmission | null;
  createdAt: string;
  updatedAt: string;
};

type AssessmentQuestion = {
  id: number;
  assessmentId: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  marks: number;
  sortOrder: number;
};

type AssessmentDetails = AssessmentListItem & {
  questions: AssessmentQuestion[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const STATUS_STYLES: Record<
  FrontendStatus,
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

type FilterType = "All" | FrontendAssessmentType;

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function displayType(
  type: BackendAssessmentType
): FrontendAssessmentType {
  return type === "QUIZ" ? "Quiz" : "Assignment";
}

function displayStatus(
  submission: StudentSubmission | null
): FrontendStatus {
  if (!submission) {
    return "Not started";
  }

  if (submission.status === "GRADED") {
    return "Graded";
  }

  if (submission.status === "SUBMITTED") {
    return "Submitted";
  }

  return "In progress";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitInstructions(value: string | null) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/\r?\n|•|(?<=\.)\s+(?=[A-Z][a-z])/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

export default function AssignmentsPage() {
  const router = useRouter();

  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("All");
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentListItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAssessments = async (showRefresh = false) => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/assessments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const json: ApiResponse<AssessmentListItem[]> =
        await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(
          json.message || "Unable to load assignments and quizzes."
        );
      }

      setAssessments(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Load student assessments error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assignments and quizzes."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const filteredAssessments = useMemo(() => {
    if (filter === "All") {
      return assessments;
    }

    return assessments.filter(
      (item) => displayType(item.type) === filter
    );
  }, [assessments, filter]);

  const totalAssignments = assessments.filter(
    (item) => item.type === "ASSIGNMENT"
  ).length;

  const totalQuizzes = assessments.filter(
    (item) => item.type === "QUIZ"
  ).length;

  const completed = assessments.filter((item) => {
    const status = displayStatus(item.latestSubmission);
    return status === "Submitted" || status === "Graded";
  }).length;

  const pending = assessments.length - completed;

  const openAssessment = (assessment: AssessmentListItem) => {
    setSelectedAssessment(assessment);
  };

  const handleSubmitted = async () => {
    setSelectedAssessment(null);
    await loadAssessments(true);
  };

  return (
    <main
      style={{
        padding: "28px 32px 40px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 5px",
              }}
            >
              Assignments &amp; Quizzes
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

          <button
            type="button"
            onClick={() => loadAssessments(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #D7DCE5",
              background: "#FFFFFF",
              color: "#374151",
              borderRadius: "8px",
              padding: "9px 13px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.65 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={
                refreshing
                  ? { animation: "spin 1s linear infinite" }
                  : undefined
              }
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

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
          value={String(assessments.length)}
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
          value={`${completed} / ${assessments.length}`}
          secondary={`${pending} pending`}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        {(["All", "Assignment", "Quiz"] as FilterType[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            style={{
              border:
                filter === item
                  ? "1px solid #2F6BFF"
                  : "1px solid #D7DCE5",
              background: filter === item ? "#2F6BFF" : "#FFFFFF",
              color: filter === item ? "#FFFFFF" : "#374151",
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
        ))}
      </div>

      {error && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 14px",
            borderRadius: "9px",
            border: "1px solid #FECACA",
            background: "#FEF2F2",
            color: "#B91C1C",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "13px",
            padding: "60px 25px",
            textAlign: "center",
            color: "#6B7280",
            fontSize: "13px",
          }}
        >
          Loading assignments and quizzes...
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {filteredAssessments.map((assessment) => {
            const type = displayType(assessment.type);
            const assessmentStatus = displayStatus(
              assessment.latestSubmission
            );
            const status = STATUS_STYLES[assessmentStatus];

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
                          type === "Quiz" ? "#F1EAFE" : "#EAF0FE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {type === "Quiz" ? (
                        <HelpCircle size={20} color="#8A3FEB" />
                      ) : (
                        <ClipboardList size={20} color="#2F6BFF" />
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
                        <span>{type}</span>
                        <span>•</span>
                        <span>{assessment.courseTitle}</span>
                        <span>•</span>
                        <span>{assessment.totalMarks} marks</span>
                        {type === "Quiz" && (
                          <>
                            <span>•</span>
                            <span>
                              {assessment.questionCount} question
                              {assessment.questionCount === 1 ? "" : "s"}
                            </span>
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "7px",
                          fontSize: "11.5px",
                          color: "#6B7280",
                          flexWrap: "wrap",
                        }}
                      >
                        {assessmentStatus === "Submitted" ||
                        assessmentStatus === "Graded" ? (
                          <>
                            <CheckCircle2 size={13} />
                            {assessmentStatus}
                            {assessment.latestSubmission?.score !== null &&
                              assessment.latestSubmission?.score !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Score {assessment.latestSubmission.score}/
                                    {assessment.totalMarks}
                                  </span>
                                </>
                              )}
                          </>
                        ) : (
                          <>
                            <CalendarDays size={13} />
                            Due {formatDate(assessment.dueAt)}
                          </>
                        )}

                        {assessment.durationMinutes && (
                          <>
                            <span>•</span>
                            <Clock3 size={13} />
                            {assessment.durationMinutes} min
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
                      {assessmentStatus}
                    </span>

                    <button
                      type="button"
                      onClick={() => openAssessment(assessment)}
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
                      {assessmentStatus === "Graded"
                        ? "View Result"
                        : assessmentStatus === "Submitted"
                        ? "View Submission"
                        : "Open"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredAssessments.length === 0 && (
        <div
          style={{
            marginTop: "12px",
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
            Published assessments assigned to your enrolled courses will appear here.
          </p>
        </div>
      )}

      {selectedAssessment && (
        <AssessmentModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onSubmitted={handleSubmitted}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

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

function AssessmentModal({
  assessment,
  onClose,
  onSubmitted,
}: {
  assessment: AssessmentListItem;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}) {
  const [details, setDetails] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/assessments/${assessment.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const json: ApiResponse<AssessmentDetails> =
          await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || "Unable to load assessment details."
          );
        }

        if (!cancelled) {
          setDetails(json.data);
        }
      } catch (err) {
        console.error("Load assessment details error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load assessment details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [assessment.id]);

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
          maxWidth: "760px",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: "15px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
        }}
      >
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
              ASM-{String(assessment.id).padStart(4, "0")}
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
              {displayType(assessment.type)} · {assessment.courseTitle}
            </div>
          </div>

          <button
            type="button"
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

        <div style={{ padding: "22px" }}>
          {loading ? (
            <div
              style={{
                padding: "45px 10px",
                textAlign: "center",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              Loading assessment...
            </div>
          ) : error ? (
            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          ) : details ? (
            <AssessmentContent
              details={details}
              onSubmitted={onSubmitted}
            />
          ) : null}
        </div>

        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
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

function AssessmentContent({
  details,
  onSubmitted,
}: {
  details: AssessmentDetails;
  onSubmitted: () => Promise<void>;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionComment, setSubmissionComment] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestSubmission = details.latestSubmission;
  const isQuiz = details.type === "QUIZ";
  const status = displayStatus(latestSubmission);
  const instructions = splitInstructions(details.instructions);

  const downloadSubmissionFile = async () => {
    const token = getToken();
    const relativeUrl = latestSubmission?.submissionFileUrl;

    if (!token || !relativeUrl) {
      return;
    }

    try {
      const fileUrl = relativeUrl.startsWith("/api/")
        ? `${API_URL}${relativeUrl.slice(4)}`
        : relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")
        ? relativeUrl
        : `${API_URL}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;

      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to download the submitted file.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = latestSubmission.submissionFileName || "assignment-file";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download submission file error:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to download the submitted file."
      );
    }
  };

  const setAnswer = (questionId: number, answer: string) => {
    setAnswers((current) => ({
      ...current,
      [String(questionId)]: answer,
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitAssignment = async () => {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!selectedFile) {
      setSubmitError("Please choose an assignment file.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      if (submissionComment.trim()) {
        formData.append(
          "submissionComment",
          submissionComment.trim()
        );
      }

      const response = await fetch(
        `${API_URL}/assessments/${details.id}/assignment-submission`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const json = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(
          json?.message || "Unable to submit assignment."
        );
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSubmissionComment("");

      await onSubmitted();
    } catch (err) {
      console.error("Submit assignment error:", err);

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to submit assignment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuiz = async () => {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (details.questions.length === 0) {
      setSubmitError("This quiz does not have any questions yet.");
      return;
    }

    const unanswered = details.questions.filter(
      (question) => !answers[String(question.id)]
    );

    if (unanswered.length > 0) {
      setSubmitError(
        `Please answer all questions. ${unanswered.length} question${
          unanswered.length === 1 ? "" : "s"
        } remaining.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const response = await fetch(
        `${API_URL}/assessments/${details.id}/quiz-submission`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        }
      );

      const json = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(
          json?.message || "Unable to submit quiz."
        );
      }

      await onSubmitted();
    } catch (err) {
      console.error("Submit quiz error:", err);

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to submit quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
          {details.description || "No description provided."}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <InfoCard label="Course" value={details.courseTitle} />
        <InfoCard label="Maximum Marks" value={String(details.totalMarks)} />
        <InfoCard label="Due Date" value={formatDate(details.dueAt)} />
      </div>

      {instructions.length > 0 && (
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
            {instructions.map((instruction, index) => (
              <div
                key={`${instruction}-${index}`}
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
            ))}
          </div>
        </div>
      )}

      {latestSubmission && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px",
            borderRadius: "10px",
            background:
              status === "Graded" ? "#F5F0FF" : "#ECFDF3",
            border:
              status === "Graded"
                ? "1px solid #E7D8FF"
                : "1px solid #BBF7D0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "12px",
              fontWeight: 700,
              color: status === "Graded" ? "#6D28D9" : "#15803D",
            }}
          >
            <CheckCircle2 size={16} />
            Latest attempt: {status}
          </div>

          <div
            style={{
              marginTop: "8px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              fontSize: "11px",
              color: "#4B5563",
            }}
          >
            <div>Attempt: {latestSubmission.attemptNumber}</div>
            <div>
              Submitted: {formatDateTime(latestSubmission.submittedAt)}
            </div>

            {latestSubmission.score !== null && (
              <div>
                Score: {latestSubmission.score}/{details.totalMarks}
              </div>
            )}

            {latestSubmission.submissionFileName && (
              <div>
                File: {latestSubmission.submissionFileName}
                {latestSubmission.submissionFileUrl && (
                  <button
                    type="button"
                    onClick={downloadSubmissionFile}
                    style={{
                      marginLeft: "8px",
                      border: "none",
                      background: "transparent",
                      color: "#2F6BFF",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Download
                  </button>
                )}
              </div>
            )}
          </div>

          {latestSubmission.feedback && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "rgba(255,255,255,0.7)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#4B5563",
              }}
            >
              <strong>Trainer feedback:</strong> {latestSubmission.feedback}
            </div>
          )}
        </div>
      )}

      {submitError && (
        <div
          style={{
            marginBottom: "15px",
            padding: "11px 13px",
            borderRadius: "9px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            fontSize: "11.5px",
          }}
        >
          {submitError}
        </div>
      )}

      {isQuiz ? (
        <QuizSection
          details={details}
          answers={answers}
          setAnswer={setAnswer}
          onSubmit={submitQuiz}
          submitting={submitting}
        />
      ) : (
        <AssignmentSection
          selectedFile={selectedFile}
          fileInputRef={fileInputRef}
          submissionComment={submissionComment}
          setSubmissionComment={setSubmissionComment}
          onFileChange={setSelectedFile}
          onRemoveFile={removeFile}
          onSubmit={submitAssignment}
          submitting={submitting}
        />
      )}
    </>
  );
}

function AssignmentSection({
  selectedFile,
  fileInputRef,
  submissionComment,
  setSubmissionComment,
  onFileChange,
  onRemoveFile,
  onSubmit,
  submitting,
}: {
  selectedFile: File | null;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  submissionComment: string;
  setSubmissionComment: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onRemoveFile: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}) {
  return (
    <div>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "14px",
          color: "#111827",
        }}
      >
        Assignment Submission
      </h3>

      <div
        style={{
          padding: "11px 13px",
          marginBottom: "14px",
          borderRadius: "9px",
          background: "#FFF7ED",
          border: "1px solid #FED7AA",
          color: "#9A3412",
          fontSize: "11px",
          lineHeight: 1.5,
        }}
      >
        Select your assignment file below. The current backend records the
        submission and file are now stored by the local SKCE backend during development. Secure S3 storage can be added during the AWS migration.
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
        onChange={(event) => {
          onFileChange(event.target.files?.[0] ?? null);
        }}
        style={{ display: "none" }}
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
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
            PDF, DOC, DOCX, ZIP, PPTX, XLSX, Images
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

            <div style={{ minWidth: 0 }}>
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
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveFile}
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
          Submission Comment <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
        </label>

        <textarea
          value={submissionComment}
          onChange={(e) => setSubmissionComment(e.target.value)}
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

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          background: submitting ? "#D1D5DB" : "#2F6BFF",
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        <Upload size={15} />
        {submitting ? "Submitting..." : "Submit Assignment"}
      </button>
    </div>
  );
}

function QuizSection({
  details,
  answers,
  setAnswer,
  onSubmit,
  submitting,
}: {
  details: AssessmentDetails;
  answers: Record<string, string>;
  setAnswer: (questionId: number, answer: string) => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}) {
  if (details.questions.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: "10px",
          background: "#F8FAFF",
          border: "1px solid #E2E8FF",
          color: "#6B7280",
          fontSize: "12px",
        }}
      >
        This quiz has no questions yet. Please check again after your trainer
        adds the questions.
      </div>
    );
  }

  return (
    <div>
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: "14px",
          color: "#111827",
        }}
      >
        Quiz Questions
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {details.questions.map((question, index) => {
          const options = [
            ["A", question.optionA],
            ["B", question.optionB],
            ["C", question.optionC],
            ["D", question.optionD],
          ].filter(
            (item): item is [string, string] =>
              Boolean(item[1]?.trim())
          );

          return (
            <div
              key={question.id}
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "11px",
                padding: "15px",
                background: "#FFFFFF",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "11px",
                }}
              >
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#111827",
                    lineHeight: 1.5,
                  }}
                >
                  {index + 1}. {question.question}
                </div>

                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "10px",
                    color: "#6B7280",
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "999px",
                    padding: "4px 7px",
                  }}
                >
                  {question.marks} mark{question.marks === 1 ? "" : "s"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {options.map(([key, label]) => {
                  const checked = answers[String(question.id)] === key;

                  return (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        border: checked
                          ? "1px solid #2F6BFF"
                          : "1px solid #E5E7EB",
                        background: checked ? "#EFF6FF" : "#FFFFFF",
                        borderRadius: "9px",
                        padding: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={key}
                        checked={checked}
                        onChange={() => setAnswer(question.id, key)}
                        style={{ marginTop: "2px" }}
                      />

                      <span
                        style={{
                          fontSize: "11.5px",
                          color: "#374151",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>{key}.</strong> {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          background: submitting ? "#D1D5DB" : "#2F6BFF",
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        <HelpCircle size={15} />
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
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
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}
