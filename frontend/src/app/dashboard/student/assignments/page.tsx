"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import {

  ClipboardList,

  HelpCircle,

  CalendarDays,

  Clock3,

  CheckCircle2,

  CircleAlert,

  ChevronRight,

  GraduationCap,

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

  answers: string | null;

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

  maxAttempts: number | null;

  attemptsUsed?: number;

  attemptsRemaining?: number;

  canRetry?: boolean;

  showCorrectAnswers?: boolean;

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

  correctAnswer?: string | null;

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

    .map((item) => item.trim().replace(/^[-\*]\s\*/, ""))

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

      const response = await fetch(
        `${API_URL}/assessments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const json: ApiResponse<AssessmentListItem[]> =
        await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(
          json.message ||
            "Unable to load assignments and quizzes."
        );
      }

      setAssessments(
        Array.isArray(json.data) ? json.data : []
      );
    } catch (err) {
      console.error(
        "Load student assessments error:",
        err
      );

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
    void loadAssessments();
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

    return (
      status === "Submitted" ||
      status === "Graded"
    );
  }).length;

  const pending = assessments.length - completed;

  const graded = assessments.filter(
    (item) =>
      displayStatus(item.latestSubmission) === "Graded"
  ).length;

  const inProgress = assessments.filter(
    (item) =>
      displayStatus(item.latestSubmission) === "In progress"
  ).length;

  const openAssessment = (
    assessment: AssessmentListItem
  ) => {
    setSelectedAssessment(assessment);
  };

  const handleSubmitted = async () => {
    await loadAssessments(true);
  };

  return (
    <>
      <main
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
          padding: "28px 32px 40px",
          background: "#F5F7FB",
        }}
      >
        {/* Header */}
        <section
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                marginBottom: 6,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#A01441",
              }}
            >
              STUDENT LEARNING
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 27,
                lineHeight: 1.2,
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}
            >
              Assignments &amp; Quizzes
            </h1>

            <p
              style={{
                maxWidth: 700,
                margin: "6px 0 0",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#7D8796",
              }}
            >
              Keep track of your assigned work, quiz attempts,
              submissions and results in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAssessments(true)}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              flex: "0 0 auto",
              border: "1px solid #D7DDE7",
              background: "#FFFFFF",
              color: "#374151",
              borderRadius: 9,
              padding: "9px 12px",
              fontSize: 11,
              fontWeight: 750,
              cursor: refreshing
                ? "not-allowed"
                : "pointer",
              opacity: refreshing ? 0.65 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={
                refreshing
                  ? {
                      animation:
                        "studentAssessmentsSpin 0.8s linear infinite",
                    }
                  : undefined
              }
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {/* Snapshot */}
        <section
          className="student-assessment-summary"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <AssessmentStatCard
            label="Total"
            value={assessments.length}
            detail={`${totalAssignments} assignments · ${totalQuizzes} quizzes`}
            icon={<ClipboardList size={18} />}
            iconBg="#F8E8EF"
            iconColor="#A01441"
          />

          <AssessmentStatCard
            label="Pending"
            value={pending}
            detail={
              pending === 0
                ? "Nothing waiting"
                : "Still to complete"
            }
            icon={<CircleAlert size={18} />}
            iconBg="#FFF4DC"
            iconColor="#B4790E"
          />

          <AssessmentStatCard
            label="Submitted"
            value={completed}
            detail={`${graded} graded · ${inProgress} in progress`}
            icon={<CheckCircle2 size={18} />}
            iconBg="#EAF8F0"
            iconColor="#198A55"
          />

          <AssessmentStatCard
            label="Quizzes"
            value={totalQuizzes}
            detail="MCQ assessments"
            icon={<HelpCircle size={18} />}
            iconBg="#F0EBFF"
            iconColor="#7A56D6"
          />
        </section>

        {/* Filter bar */}
        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
            }}
          >
            {(
              ["All", "Assignment", "Quiz"] as FilterType[]
            ).map((item) => {
              const isActive = filter === item;

              const count =
                item === "All"
                  ? assessments.length
                  : item === "Assignment"
                    ? totalAssignments
                    : totalQuizzes;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    border: isActive
                      ? "1px solid #2F6BFF"
                      : "1px solid #D9DFE8",
                    background: isActive
                      ? "#2F6BFF"
                      : "#FFFFFF",
                    color: isActive
                      ? "#FFFFFF"
                      : "#4B5563",
                    borderRadius: 999,
                    padding: "7px 11px",
                    fontSize: 10.5,
                    fontWeight: 750,
                    cursor: "pointer",
                  }}
                >
                  {item === "All"
                    ? "All"
                    : item === "Assignment"
                      ? "Assignments"
                      : "Quizzes"}

                  <span
                    style={{
                      minWidth: 18,
                      padding: "2px 5px",
                      borderRadius: 999,
                      background: isActive
                        ? "rgba(255,255,255,0.18)"
                        : "#F2F4F7",
                      color: isActive
                        ? "#FFFFFF"
                        : "#697386",
                      fontSize: 9,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              fontSize: 10.5,
              color: "#8E98A8",
            }}
          >
            Showing {filteredAssessments.length} of{" "}
            {assessments.length}
          </div>
        </section>

        {/* Error */}
        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: "11px 13px",
              border: "1px solid #F2C7C7",
              borderRadius: 10,
              background: "#FFF5F5",
              color: "#B42318",
              fontSize: 11.5,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        ) : null}

        {/* Content */}
        {loading ? (
          <div
            style={{
              minHeight: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E4E8EF",
              borderRadius: 17,
              background: "#FFFFFF",
              boxShadow:
                "0 4px 14px rgba(15,23,42,0.035)",
            }}
          >
            <RefreshCw
              size={24}
              color="#2F6BFF"
              style={{
                animation:
                  "studentAssessmentsSpin 0.8s linear infinite",
              }}
            />

            <strong
              style={{
                marginTop: 12,
                fontSize: 14,
                color: "#334155",
              }}
            >
              Loading your assessments
            </strong>

            <span
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#98A1AE",
              }}
            >
              Fetching assignments and quizzes.
            </span>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div
            style={{
              minHeight: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
              border: "1px dashed #D9E0EA",
              borderRadius: 17,
              background: "#FFFFFF",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 13,
                background: "#F0F3F8",
                color: "#929DAD",
              }}
            >
              <ClipboardList size={22} />
            </div>

            <h2
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                fontWeight: 800,
                color: "#374151",
              }}
            >
              No {filter === "All"
                ? "assessments"
                : filter === "Assignment"
                  ? "assignments"
                  : "quizzes"}{" "}
              found
            </h2>

            <p
              style={{
                maxWidth: 440,
                margin: "6px 0 0",
                fontSize: 11.5,
                lineHeight: 1.6,
                color: "#99A2AF",
              }}
            >
              Published assessments assigned to your enrolled
              courses will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {filteredAssessments.map((assessment) => {
              const type = displayType(
                assessment.type
              );

              const assessmentStatus =
                displayStatus(
                  assessment.latestSubmission
                );

              const status =
                STATUS_STYLES[assessmentStatus];

              const score =
                assessment.latestSubmission?.score;

              const dueDate = assessment.dueAt
                ? new Date(assessment.dueAt)
                : null;

              const isPastDue =
                assessment.dueAt !== null &&
                dueDate !== null &&
                !Number.isNaN(
                  dueDate.getTime()
                ) &&
                dueDate.getTime() < Date.now() &&
                assessmentStatus === "Not started";

              return (
                <article
                  key={assessment.id}
                  className="student-assessment-card"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) auto",
                    gap: 18,
                    padding: "17px 18px",
                    border: "1px solid #E4E8EF",
                    borderRadius: 15,
                    background: "#FFFFFF",
                    boxShadow:
                      "0 4px 12px rgba(15,23,42,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 13,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 44px",
                        borderRadius: 12,
                        background:
                          type === "Quiz"
                            ? "#F0EBFF"
                            : "#EAF0FF",
                        color:
                          type === "Quiz"
                            ? "#7A56D6"
                            : "#316CF2",
                      }}
                    >
                      {type === "Quiz" ? (
                        <HelpCircle size={21} />
                      ) : (
                        <ClipboardList size={21} />
                      )}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            color: "#8993A2",
                          }}
                        >
                          {type}
                        </span>

                        <span
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: "50%",
                            background: "#CBD2DC",
                          }}
                        />

                        <span
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: 10.5,
                            color: "#8A94A4",
                          }}
                        >
                          {assessment.courseTitle}
                        </span>
                      </div>

                      <h2
                        style={{
                          margin: "5px 0 0",
                          fontSize: 15,
                          lineHeight: 1.35,
                          fontWeight: 800,
                          color: "#172033",
                          wordBreak: "break-word",
                        }}
                      >
                        {assessment.title}
                      </h2>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 7,
                        }}
                      >
                        <MetaItem
                          icon={
                            <ClipboardList size={12} />
                          }
                          text={`${assessment.totalMarks} marks`}
                        />

                        {type === "Quiz" ? (
                          <MetaItem
                            icon={
                              <HelpCircle size={12} />
                            }
                            text={`${assessment.questionCount} ${
                              assessment.questionCount === 1
                                ? "question"
                                : "questions"
                            }`}
                          />
                        ) : null}

                        {assessment.durationMinutes ? (
                          <MetaItem
                            icon={
                              <Clock3 size={12} />
                            }
                            text={`${assessment.durationMinutes} min`}
                          />
                        ) : null}

                        <MetaItem
                          icon={
                            <CalendarDays size={12} />
                          }
                          text={
                            assessment.dueAt
                              ? `Due ${formatDate(
                                  assessment.dueAt
                                )}`
                              : "No due date"
                          }
                          emphasized={isPastDue}
                        />
                      </div>

                      {score !== null &&
                      score !== undefined ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 8,
                            padding: "5px 8px",
                            borderRadius: 8,
                            background: "#F5F0FF",
                            color: "#6D28D9",
                            fontSize: 10.5,
                            fontWeight: 800,
                          }}
                        >
                          <Award size={12} />
                          Latest score: {score}/
                          {assessment.totalMarks}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 12,
                      minWidth: 126,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 9px",
                        borderRadius: 999,
                        background: status.bg,
                        color: status.fg,
                        fontSize: 10,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {status.icon}
                      {assessmentStatus}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        openAssessment(assessment)
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        minWidth: 112,
                        border: "1px solid #D9DFE8",
                        borderRadius: 9,
                        padding: "8px 11px",
                        background: "#FFFFFF",
                        color: "#334155",
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <Eye size={14} />
                      {assessmentStatus === "Graded"
                        ? "View Result"
                        : assessmentStatus === "Submitted"
                          ? "View Submission"
                          : "Open"}
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 15,
            padding: "11px 13px",
            border: "1px solid #E7EBF1",
            borderRadius: 11,
            background: "#FBFCFE",
            color: "#8993A3",
            fontSize: 10.5,
            lineHeight: 1.5,
          }}
        >
          <GraduationCap
            size={15}
            color="#A01441"
          />

          <span>
            Assessment access is based on your enrolled
            courses. Open an item to view instructions,
            submit your work, or review your result.
          </span>
        </div>
      </main>

      {selectedAssessment ? (
        <AssessmentModal
          assessment={selectedAssessment}
          onClose={() =>
            setSelectedAssessment(null)
          }
          onSubmitted={handleSubmitted}
        />
      ) : null}

      <style jsx global>{`
        @keyframes studentAssessmentsSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .student-assessment-card {
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            border-color 150ms ease;
        }

        .student-assessment-card:hover {
          transform: translateY(-1px);
          border-color: #d7deea !important;
          box-shadow:
            0 8px 20px rgba(15, 23, 42, 0.06) !important;
        }

        @media (max-width: 1050px) {
          .student-assessment-summary {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          .student-assessment-card {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 620px) {
          .student-assessment-summary {
            grid-template-columns:
              minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}

function AssessmentStatCard({
  label,
  value,
  detail,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        minWidth: 0,
        padding: "15px 16px",
        border: "1px solid #E4E8EF",
        borderRadius: 14,
        background: "#FFFFFF",
        boxShadow:
          "0 4px 12px rgba(15,23,42,0.03)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 40px",
          borderRadius: 11,
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            color: "#8A94A4",
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 19,
            lineHeight: 1.15,
            fontWeight: 800,
            color: "#172033",
          }}
        >
          {value}
        </div>

        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
            fontSize: 9.5,
            color: "#9AA2AE",
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  text,
  emphasized = false,
}: {
  icon: React.ReactNode;
  text: string;
  emphasized?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        color: emphasized
          ? "#B42318"
          : "#8A94A4",
        fontWeight: emphasized ? 700 : 500,
      }}
    >
      {icon}
      {text}
    </span>
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



      setDetails(json.data);

    } catch (err) {

      console.error("Load assessment details error:", err);

      setError(

        err instanceof Error

          ? err.message

          : "Unable to load assessment details."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    void loadDetails();

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

              onSubmitted={async () => {

                await onSubmitted();

                await loadDetails();

              }}

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

  const fileInputRef = useRef<HTMLInputElement>(null!);



  const latestSubmission = details.latestSubmission;

  const isQuiz = details.type === "QUIZ";

  const status = displayStatus(latestSubmission);

  const instructions = splitInstructions(details.instructions);

  const maxAttempts = details.maxAttempts ?? (isQuiz ? 3 : null);

  const attemptsUsed = details.attemptsUsed ?? latestSubmission?.attemptNumber ?? 0;

  const attemptsRemaining =

    details.attemptsRemaining ??

    (maxAttempts === null ? 0 : Math.max(maxAttempts - attemptsUsed, 0));

  const canRetry =

    isQuiz &&

    (details.canRetry ?? attemptsRemaining > 0);

  const showCorrectAnswers =

    isQuiz &&

    Boolean(details.showCorrectAnswers);

  const isQuizFinal = isQuiz && showCorrectAnswers;



  let submittedAnswers: Record<string, string> = {};



  if (latestSubmission?.answers) {

    try {

      const parsed = JSON.parse(latestSubmission.answers);



      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {

        submittedAnswers = Object.fromEntries(

          Object.entries(parsed).map(([key, value]) => [

            key,

            String(value),

          ])

        );

      }

    } catch {

      submittedAnswers = {};

    }

  }



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



      setAnswers({});

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

            <div>

              Attempt: {latestSubmission.attemptNumber}

              {isQuiz && maxAttempts

                ? ` / ${maxAttempts}`

                : ""}

            </div>

            <div>

              Submitted: {formatDateTime(latestSubmission.submittedAt)}

            </div>

            {isQuiz && !isQuizFinal && (

              <div>Attempts remaining: {attemptsRemaining}</div>

            )}



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

          answers={

            isQuizFinal

              ? submittedAnswers

              : answers

          }

          setAnswer={setAnswer}

          onSubmit={submitQuiz}

          submitting={submitting}

          readOnly={isQuizFinal}

          showCorrectAnswers={showCorrectAnswers}

          attemptsRemaining={attemptsRemaining}

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

  fileInputRef: React.RefObject<HTMLInputElement>;

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

  readOnly,

  showCorrectAnswers,

  attemptsRemaining,

}: {

  details: AssessmentDetails;

  answers: Record<string, string>;

  setAnswer: (questionId: number, answer: string) => void;

  onSubmit: () => Promise<void>;

  submitting: boolean;

  readOnly: boolean;

  showCorrectAnswers: boolean;

  attemptsRemaining: number;

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

                  const correct =

                    showCorrectAnswers &&

                    question.correctAnswer?.toUpperCase() === key;

                  const wrongSelected =

                    showCorrectAnswers && checked && !correct;



                  return (

                    <label

                      key={key}

                      style={{

                        display: "flex",

                        alignItems: "flex-start",

                        gap: "8px",

                        border: correct

                          ? "2px solid #16A34A"

                          : wrongSelected

                          ? "2px solid #DC2626"

                          : checked

                          ? "1px solid #2F6BFF"

                          : "1px solid #E5E7EB",

                        background: correct

                          ? "#DCFCE7"

                          : wrongSelected

                          ? "#FEE2E2"

                          : checked

                          ? "#EFF6FF"

                          : "#FFFFFF",

                        borderRadius: "9px",

                        padding: "10px",

                        cursor: readOnly ? "default" : "pointer",

                        opacity: readOnly ? 0.98 : 1,

                      }}

                    >

                      <input

                        type="radio"

                        name={`question-${question.id}`}

                        value={key}

                        checked={checked}

                        onChange={() => {

                          if (!readOnly) {

                            setAnswer(question.id, key);

                          }

                        }}

                        disabled={readOnly}

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

                        {correct && (

                          <span style={{ marginLeft: "6px", color: "#15803D", fontWeight: 700 }}>

                            Correct answer

                          </span>

                        )}

                        {wrongSelected && (

                          <span style={{ marginLeft: "6px", color: "#B91C1C", fontWeight: 700 }}>

                            Your answer

                          </span>

                        )}

                      </span>

                    </label>

                  );

                })}

              </div>

            </div>

          );

        })}

      </div>



      {readOnly ? (

        <div

          style={{

            marginTop: "16px",

            padding: "12px 14px",

            borderRadius: "9px",

            background: "#ECFDF5",

            border: "1px solid #A7F3D0",

            color: "#047857",

            fontSize: "12px",

            lineHeight: 1.5,

          }}

        >

          <strong>Maximum {details.maxAttempts ?? 3} attempts reached.</strong>

          <div style={{ marginTop: "3px" }}>

            Your final score is {details.latestSubmission?.score ?? 0}/{details.totalMarks}.

            The selected answer and correct answer are shown above.

          </div>

        </div>

      ) : (

        <div>

          <div style={{ marginBottom: "8px", fontSize: "11px", color: "#6B7280" }}>

            Attempts remaining: {attemptsRemaining}

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

      )}

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