"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Users,
  X,
  Download,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type AssessmentType =
  | "ASSIGNMENT"
  | "QUIZ";

type AssessmentStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED";

type View =
  | "list"
  | "create"
  | "edit"
  | "submissions"
  | "results";

type Course = {
  id: number;
  slug: string;
  title: string;
  isActive: boolean;
};

type TrainerCoursePermission = {
  courseId: number;
  canCreateAssessments: boolean;
};

type Question = {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
};

type Assessment = {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  type: AssessmentType;
  description: string | null;
  instructions: string | null;
  dueAt: string | null;
  totalMarks: number;
  durationMinutes: number | null;
  isActive: boolean;
  questionCount: number;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
};

type AssessmentDetails =
  Assessment & {
    course: {
      id: number;
      slug: string;
      title: string;
      isActive: boolean;
    };
    questions: BackendQuestion[];
  };

type BackendQuestion = {
  id: number;
  assessmentId: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  marks: number;
  sortOrder: number;
};

type Submission = {
  id: number;
  assessmentId: number;
  userId: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptNumber: number;
  answers: string | null;
  submissionFileName: string | null;
  submissionFileUrl: string | null;
  submissionComment: string | null;
  score: number | null;
  status: AssessmentStatus;
  feedback: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AssessmentForm = {
  title: string;
  courseId: string;
  description: string;
  dueAt: string;
  totalMarks: string;
  durationMinutes: string;
  isActive: boolean;
  questions: Question[];
};

const EMPTY_FORM: AssessmentForm = {
  title: "",
  courseId: "",
  description: "",
  dueAt: "",
  totalMarks: "20",
  durationMinutes: "20",
  isActive: true,
  questions: [],
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toLocalDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

function typeLabel(type: AssessmentType) {
  return type === "ASSIGNMENT"
    ? "Assignment"
    : "Quiz";
}

function typeClasses(type: AssessmentType) {
  return type === "ASSIGNMENT"
    ? "bg-blue-50 text-blue-700"
    : "bg-emerald-50 text-emerald-700";
}

function submissionStatusLabel(
  status: AssessmentStatus
) {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    case "SUBMITTED":
      return "Submitted";
    case "GRADED":
      return "Graded";
  }
}

function submissionStatusClasses(
  status: AssessmentStatus
) {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-slate-100 text-slate-600";
    case "SUBMITTED":
      return "bg-orange-50 text-orange-700";
    case "GRADED":
      return "bg-emerald-50 text-emerald-700";
  }
}

export default function TrainerAssignmentsPage() {
  const router = useRouter();

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [permissions, setPermissions] =
    useState<TrainerCoursePermission[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filterType, setFilterType] =
    useState<"All" | AssessmentType>(
      "All"
    );

  const [view, setView] =
    useState<View>("list");

  const [createType, setCreateType] =
    useState<AssessmentType | null>(null);

  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);

  const [assessmentDetails, setAssessmentDetails] =
    useState<AssessmentDetails | null>(null);

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [showCreateChoice, setShowCreateChoice] =
    useState(false);

  const [gradeScore, setGradeScore] =
    useState("");

  const [gradeFeedback, setGradeFeedback] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      throw new Error(
        "Authentication required"
      );
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("student");
      localStorage.removeItem("studentId");

      router.push("/login");

      throw new Error(
        "Authentication required"
      );
    }

    return response;
  }

  async function loadPermissions() {
    const response =
      await authenticatedFetch(
        `${API_URL}/trainer/course-permissions`
      );

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(
        json?.message ||
          "Unable to load trainer course permissions."
      );
    }

    const data = Array.isArray(
      json.data
    )
      ? json.data
      : [];

    setPermissions(
      data.map(
        (permission: any) => ({
          courseId: Number(
            permission.courseId
          ),
          canCreateAssessments:
            Boolean(
              permission.canCreateAssessments
            ),
        })
      )
    );
  }

  async function loadCourses() {
    const response =
      await authenticatedFetch(
        `${API_URL}/courses`
      );

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(
        json?.message ||
          "Unable to load courses."
      );
    }

    const data = Array.isArray(
      json.data
    )
      ? json.data
      : [];

    setCourses(
      data.map(
        (course: any) => ({
          id: Number(course.id),
          slug: course.slug,
          title: course.title,
          isActive:
            Boolean(
              course.isActive
            ),
        })
      )
    );
  }

  async function loadAssessments(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/assessments`
        );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to load assignments and quizzes."
        );
      }

      const data = Array.isArray(
        json.data
      )
        ? json.data
        : [];

      setAssessments(
        data.map(
          (item: any) => ({
            ...item,
            id: Number(item.id),
            courseId:
              Number(item.courseId),
            type:
              item.type ===
              "QUIZ"
                ? "QUIZ"
                : "ASSIGNMENT",
            totalMarks:
              Number(
                item.totalMarks ??
                  0
              ),
            durationMinutes:
              item.durationMinutes ===
                null ||
              item.durationMinutes ===
                undefined
                ? null
                : Number(
                    item.durationMinutes
                  ),
            questionCount:
              Number(
                item.questionCount ??
                  0
              ),
            submissionCount:
              Number(
                item.submissionCount ??
                  0
              ),
            isActive:
              Boolean(
                item.isActive
              ),
          })
        )
      );
    } catch (err) {
      console.error(
        "Load trainer assessments error:",
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
  }

  async function loadPage(
    isRefresh = false
  ) {
    try {
      setError("");

      await Promise.all([
        loadPermissions(),
        loadCourses(),
        loadAssessments(
          isRefresh
        ),
      ]);
    } catch (err) {
      console.error(
        "Load trainer assessment page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the assessment page."
      );
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  const filteredAssessments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return assessments.filter(
        (assessment) => {
          const matchesSearch =
            !query ||
            assessment.title
              .toLowerCase()
              .includes(query) ||
            assessment.courseTitle
              .toLowerCase()
              .includes(query);

          const matchesType =
            filterType === "All" ||
            assessment.type ===
              filterType;

          return (
            matchesSearch &&
            matchesType
          );
        }
      );
    }, [
      assessments,
      search,
      filterType,
    ]);

  const totalAssignments =
    assessments.filter(
      (item) =>
        item.type ===
        "ASSIGNMENT"
    ).length;

  const totalQuizzes =
    assessments.filter(
      (item) =>
        item.type === "QUIZ"
    ).length;

  const totalSubmissions =
    assessments.reduce(
      (sum, item) =>
        sum +
        item.submissionCount,
      0
    );

  const activeAssessments =
    assessments.filter(
      (item) => item.isActive
    ).length;

  function resetViewState() {
    setSuccessMessage("");
    setView("list");
    setCreateType(null);
    setSelectedAssessment(null);
    setAssessmentDetails(null);
    setSubmissions([]);
    setSelectedSubmission(null);
    setGradeScore("");
    setGradeFeedback("");
  }

  const allowedCreateCourses =
    useMemo(
      () =>
        courses.filter(
          (course) =>
            course.isActive &&
            permissions.some(
              (permission) =>
                permission.courseId ===
                  course.id &&
                permission.canCreateAssessments
            )
        ),
      [courses, permissions]
    );

  function canManageAssessment(
    courseId: number
  ) {
    return permissions.some(
      (permission) =>
        permission.courseId ===
          courseId &&
        permission.canCreateAssessments
    );
  }

  function openCreate(
    type: AssessmentType
  ) {
    if (allowedCreateCourses.length === 0) {
      setShowCreateChoice(false);
      setError(
        "You do not have permission to create assessments for any assigned course."
      );
      return;
    }

    setError("");
    setCreateType(type);
    setSelectedAssessment(null);
    setAssessmentDetails(null);
    setView("create");
    setShowCreateChoice(false);
  }

  async function openEdit(
    assessment: Assessment
  ) {
    setError("");
    setSaving(true);

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/assessments/${assessment.id}`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to load assessment details."
        );
      }

      setSelectedAssessment(
        assessment
      );
      setAssessmentDetails(
        json.data
      );
      setCreateType(
        assessment.type
      );
      setView("edit");
    } catch (err) {
      console.error(
        "Load assessment details error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assessment details."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment(
    assessment: Assessment
  ) {
    const confirmed =
      window.confirm(
        `Delete "${assessment.title}"? This will also remove its questions and submissions.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      assessment.id
    );
    setError("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/assessments/${assessment.id}`,
          {
            method: "DELETE",
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to delete assessment."
        );
      }

      await loadPage(true);
    } catch (err) {
      console.error(
        "Delete assessment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete assessment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function openSubmissions(
    assessment: Assessment
  ): Promise<Submission[]> {
    setError("");
    setSuccessMessage("");
    setSelectedAssessment(
      assessment
    );
    setSelectedSubmission(
      null
    );
    setSubmissions([]);
    setView(
      assessment.type ===
        "QUIZ"
        ? "results"
        : "submissions"
    );

    try {
      const [submissionsResponse, detailsResponse] =
        await Promise.all([
          authenticatedFetch(
            `${API_URL}/assessments/${assessment.id}/submissions`
          ),
          authenticatedFetch(
            `${API_URL}/assessments/${assessment.id}`
          ),
        ]);

      const submissionsJson = await submissionsResponse.json();
      const detailsJson = await detailsResponse.json();

      if (
        !submissionsResponse.ok ||
        !submissionsJson?.success
      ) {
        throw new Error(
          submissionsJson?.message ||
            "Unable to load submissions."
        );
      }

      if (
        !detailsResponse.ok ||
        !detailsJson?.success
      ) {
        throw new Error(
          detailsJson?.message ||
            "Unable to load assessment questions."
        );
      }

      const rows: Submission[] = Array.isArray(
        submissionsJson.data
      )
        ? submissionsJson.data
        : [];

      setSubmissions(rows);
      setAssessmentDetails(detailsJson.data);
      return rows;
    } catch (err) {
      console.error(
        "Load submissions error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submissions."
      );
      return [];
    }
  }

  function startGrading(
    submission: Submission
  ) {
    setError("");
    setSuccessMessage("");
    setSelectedSubmission(
      submission
    );

    setGradeScore(
      submission.score ===
        null
        ? ""
        : String(
            submission.score
          )
    );

    setGradeFeedback(
      submission.feedback ||
        ""
    );
  }

  async function gradeSubmission() {
    if (
      !selectedSubmission ||
      !selectedAssessment
    ) {
      return;
    }

    const score =
      Number(gradeScore);

    if (
      !Number.isInteger(
        score
      ) ||
      score < 0 ||
      score >
        selectedAssessment.totalMarks
    ) {
      setError(
        `Score must be between 0 and ${selectedAssessment.totalMarks}.`
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/assessments/submissions/${selectedSubmission.id}/grade`,
          {
            method: "POST",
            body: JSON.stringify({
              score,
              feedback:
                gradeFeedback.trim() ||
                null,
            }),
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to grade submission."
        );
      }

      const refreshedRows = await openSubmissions(
        selectedAssessment
      );

      const updated = refreshedRows.find(
        (submission) =>
          submission.id === selectedSubmission.id
      );

      if (updated) {
        setSelectedSubmission(updated);
        setGradeScore(
          updated.score === null
            ? ""
            : String(updated.score)
        );
        setGradeFeedback(updated.feedback || "");
      } else {
        setSelectedSubmission(null);
      }

      setSuccessMessage(
        "Grade saved successfully."
      );

      await loadAssessments();
    } catch (err) {
      console.error(
        "Grade submission error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to grade submission."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openFile(
    submission: Submission
  ) {
    if (
      !submission.submissionFileUrl
    ) {
      return;
    }

    /*
     * The submission-file API is protected by the
     * existing authentication middleware. A normal
     * window.open() does not send the Bearer token,
     * so the browser was receiving:
     * {"success":false,"message":"Authentication required"}
     *
     * Fetch the file with the logged-in token first,
     * then open the authenticated response as a blob.
     */
    let fileUrl =
      submission.submissionFileUrl;

    if (
      !/^https?:\/\//i.test(
        fileUrl
      )
    ) {
      if (
        fileUrl.startsWith(
          "/api/"
        )
      ) {
        fileUrl =
          `${API_URL}${fileUrl.slice(4)}`;
      } else {
        fileUrl =
          `${API_URL}${
            fileUrl.startsWith("/")
              ? fileUrl
              : `/${fileUrl}`
          }`;
      }
    }

    const popup =
      window.open(
        "about:blank",
        "_blank"
      );

    if (!popup) {
      setError(
        "Please allow pop-ups for localhost to open the submission file."
      );
      return;
    }

    popup.document.title =
      "Opening submission file...";

    try {
      setError("");

      const token =
        getToken();

      if (!token) {
        popup.close();
        router.push(
          "/login"
        );
        return;
      }

      const response =
        await fetch(
          fileUrl,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        popup.close();

        localStorage.removeItem(
          "token"
        );
        localStorage.removeItem(
          "user"
        );
        localStorage.removeItem(
          "role"
        );
        localStorage.removeItem(
          "student"
        );
        localStorage.removeItem(
          "studentId"
        );

        router.push(
          "/login"
        );
        return;
      }

      if (!response.ok) {
        let message =
          "Unable to open submission file.";

        try {
          const json =
            await response.json();

          message =
            json?.message ||
            message;
        } catch {
          // The server may return
          // a non-JSON error response.
        }

        popup.close();
        throw new Error(
          message
        );
      }

      const blob =
        await response.blob();

      if (
        !blob.size
      ) {
        popup.close();
        throw new Error(
          "The submission file is empty."
        );
      }

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      popup.location.href =
        objectUrl;

      /*
       * Keep the blob URL alive long enough for
       * the new tab to load the document.
       */
      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            objectUrl
          ),
        60_000
      );
    } catch (err) {
      popup.close();

      console.error(
        "Open submission file error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to open submission file."
      );
    }
  }

  if (
    view === "create" ||
    view === "edit"
  ) {
    return (
      <AssessmentFormPage
        type={
          createType ||
          assessmentDetails?.type ||
          "ASSIGNMENT"
        }
        courses={
          view === "create"
            ? allowedCreateCourses
            : courses
        }
        assessment={
          assessmentDetails
        }
        isEdit={
          view === "edit"
        }
        saving={saving}
        onBack={
          resetViewState
        }
        onSaved={async () => {
          resetViewState();
          await loadPage(
            true
          );
        }}
        setError={setError}
      />
    );
  }

  if (
    view === "submissions" &&
    selectedAssessment
  ) {
    return (
      <SubmissionsPage
        assessment={
          selectedAssessment
        }
        submissions={
          submissions
        }
        selectedSubmission={
          selectedSubmission
        }
        gradeScore={
          gradeScore
        }
        gradeFeedback={
          gradeFeedback
        }
        saving={saving}
        error={error}
        successMessage={successMessage}
        onBack={resetViewState}
        onSelectSubmission={
          startGrading
        }
        onScoreChange={
          setGradeScore
        }
        onFeedbackChange={
          setGradeFeedback
        }
        onGrade={gradeSubmission}
        onOpenFile={openFile}
      />
    );
  }

  if (
    view === "results" &&
    selectedAssessment
  ) {
    return (
      <QuizResultsPage
        assessment={
          selectedAssessment
        }
        submissions={
          submissions
        }
        assessmentDetails={assessmentDetails}
        error={error}
        onBack={resetViewState}
        onGrade={
          startGrading
        }
        selectedSubmission={
          selectedSubmission
        }
        gradeScore={
          gradeScore
        }
        gradeFeedback={
          gradeFeedback
        }
        saving={saving}
        successMessage={successMessage}
        onScoreChange={
          setGradeScore
        }
        onFeedbackChange={
          setGradeFeedback
        }
        onSaveGrade={
          gradeSubmission
        }
        onOpenFile={openFile}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <header className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <ClipboardList
                  size={17}
                />
                Trainer Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Assignments &amp; Quizzes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Create, manage and grade course-based assignments and quizzes.
              </p>
            </div>

            {allowedCreateCourses.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setShowCreateChoice(
                    true
                  )
                }
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <Plus size={17} />
                Create New
              </button>
            )}
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Assignments &amp; Quizzes
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={
              <ClipboardList
                size={20}
              />
            }
            label="Assignments"
            value={
              loading
                ? "—"
                : totalAssignments
            }
          />

          <SummaryCard
            icon={
              <HelpCircle size={20} />
            }
            label="Quizzes"
            value={
              loading
                ? "—"
                : totalQuizzes
            }
          />

          <SummaryCard
            icon={
              <Users size={20} />
            }
            label="Submissions"
            value={
              loading
                ? "—"
                : totalSubmissions
            }
          />

          <SummaryCard
            icon={
              <CheckCircle2
                size={20}
              />
            }
            label="Active Assessments"
            value={
              loading
                ? "—"
                : activeAssessments
            }
          />
        </div>

        {/* FILTERS */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search assignments or quizzes by title or course..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(
                  event.target.value as
                    | "All"
                    | AssessmentType
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-400"
            >
              <option value="All">
                All Types
              </option>
              <option value="ASSIGNMENT">
                Assignments
              </option>
              <option value="QUIZ">
                Quizzes
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                void loadPage(
                  true
                )
              }
              disabled={
                loading ||
                refreshing
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </section>

        {/* LIST */}
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />
              Loading assignments and quizzes...
            </div>
          </div>
        ) : filteredAssessments.length ===
          0 ? (
          <EmptyState
            search={search}
            filterType={
              filterType
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map(
              (assessment) => (
                <AssessmentCard
                  key={
                    assessment.id
                  }
                  assessment={
                    assessment
                  }
                  canManage={
                    canManageAssessment(
                      assessment.courseId
                    )
                  }
                  deleting={
                    deletingId ===
                    assessment.id
                  }
                  onView={() =>
                    void openSubmissions(
                      assessment
                    )
                  }
                  onEdit={() =>
                    void openEdit(
                      assessment
                    )
                  }
                  onDelete={() =>
                    void deleteAssessment(
                      assessment
                    )
                  }
                />
              )
            )}
          </div>
        )}

        {/* CREATE CHOICE */}
        {showCreateChoice && (
          <CreateChoiceModal
            onClose={() =>
              setShowCreateChoice(
                false
              )
            }
            onSelect={
              openCreate
            }
          />
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <div>
          <div className="text-2xl font-bold text-[#173B67]">
            {value}
          </div>

          <div className="mt-0.5 text-sm text-slate-500">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentCard({
  assessment,
  canManage,
  deleting,
  onView,
  onEdit,
  onDelete,
}: {
  assessment: Assessment;
  canManage: boolean;
  deleting: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAssignment =
    assessment.type ===
    "ASSIGNMENT";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isAssignment
                ? "bg-blue-50 text-blue-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isAssignment ? (
              <ClipboardList
                size={20}
              />
            ) : (
              <HelpCircle
                size={20}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {
                  assessment.title
                }
              </h2>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${typeClasses(
                  assessment.type
                )}`}
              >
                {typeLabel(
                  assessment.type
                )}
              </span>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  assessment.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {assessment.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              {assessment.courseTitle ||
                "Course unavailable"}{" "}
              · Total Marks:{" "}
              {
                assessment.totalMarks
              }
              {assessment.type ===
                "QUIZ" &&
                assessment.durationMinutes && (
                  <>
                    {" "}
                    ·{" "}
                    {
                      assessment.durationMinutes
                    }{" "}
                    min
                  </>
                )}
              {assessment.dueAt && (
                <>
                  {" "}
                  · Due:{" "}
                  {formatDate(
                    assessment.dueAt
                  )}
                </>
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {assessment.questionCount} question
              {assessment.questionCount ===
              1
                ? ""
                : "s"}{" "}
              ·{" "}
              {
                assessment.submissionCount
              }{" "}
              submission
              {assessment.submissionCount ===
              1
                ? ""
                : "s"}
            </p>

            {(assessment.description ||
              assessment.instructions) && (
              <p className="mt-2 max-w-3xl truncate text-xs text-slate-400">
                {assessment.description ||
                  assessment.instructions}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          {canManage ? (
            <>
              <button
                type="button"
                onClick={onView}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#173B67] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#123052]"
              >
                <Eye size={15} />
                {isAssignment
                  ? "Submissions"
                  : "View Results"}
              </button>

              <button
                type="button"
                onClick={onEdit}
                title="Edit"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <Pencil size={15} />
              </button>

              <button
                type="button"
                onClick={onDelete}
                title="Delete"
                disabled={deleting}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={15}
                  />
                )}
              </button>
            </>
          ) : (
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
              No assessment management permission
            </span>
          )}
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
  onSelect: (
    type: AssessmentType
  ) => void;
}) {
  return (
    <ModalOverlay
      onClose={onClose}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <ModalHeader
          title="Create New"
          subtitle="Choose what you want to create."
          onClose={onClose}
        />

        <div className="space-y-3">
          <ChoiceCard
            icon={
              <ClipboardList
                size={22}
              />
            }
            title="Assignment"
            description="Create a course-based assignment for students."
            iconClass="bg-blue-50 text-blue-600"
            onClick={() =>
              onSelect(
                "ASSIGNMENT"
              )
            }
          />

          <ChoiceCard
            icon={
              <HelpCircle
                size={22}
              />
            }
            title="Quiz"
            description="Create a multiple-choice quiz with questions and marks."
            iconClass="bg-emerald-50 text-emerald-600"
            onClick={() =>
              onSelect(
                "QUIZ"
              )
            }
          />
        </div>
      </div>
    </ModalOverlay>
  );
}

function AssessmentFormPage({
  type,
  courses,
  assessment,
  isEdit,
  saving,
  onBack,
  onSaved,
  setError,
}: {
  type: AssessmentType;
  courses: Course[];
  assessment: AssessmentDetails | null;
  isEdit: boolean;
  saving: boolean;
  onBack: () => void;
  onSaved: () => Promise<void>;
  setError: (
    value: string
  ) => void;
}) {
  const [title, setTitle] =
    useState(
      assessment?.title || ""
    );

  const [courseId, setCourseId] =
    useState(
      assessment
        ? String(
            assessment.courseId
          )
        : ""
    );

  const [description, setDescription] =
    useState(
      assessment?.description ||
        assessment?.instructions ||
        ""
    );

  const [dueAt, setDueAt] =
    useState(
      toLocalDateTime(
        assessment?.dueAt ||
          null
      )
    );

  const [totalMarks, setTotalMarks] =
    useState(
      String(
        assessment?.totalMarks ??
          20
      )
    );

  const [durationMinutes, setDurationMinutes] =
    useState(
      String(
        assessment?.durationMinutes ??
          20
      )
    );

  const [isActive, setIsActive] =
    useState(
      assessment?.isActive ??
        true
    );

  const [questions, setQuestions] =
    useState<Question[]>(
      assessment?.questions
        ?.sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        )
        .map(
          (question) => ({
            id: question.id,
            question:
              question.question,
            options: [
              question.optionA ||
                "",
              question.optionB ||
                "",
              question.optionC ||
                "",
              question.optionD ||
                "",
            ],
            correctAnswer:
              question.correctAnswer ||
              "",
            marks:
              Number(
                question.marks
              ) || 1,
          })
        ) || []
    );

  function addQuestion() {
    setQuestions(
      (current) => [
        ...current,
        {
          question: "",
          options: [
            "",
            "",
            "",
            "",
          ],
          correctAnswer:
            "",
          marks: 1,
        },
      ]
    );
  }

  function updateQuestion(
    index: number,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, questionIndex) =>
            questionIndex ===
            index
              ? {
                  ...question,
                  question:
                    value,
                }
              : question
        )
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, index) =>
            index ===
            questionIndex
              ? {
                  ...question,
                  options:
                    question.options.map(
                      (
                        option,
                        currentIndex
                      ) =>
                        currentIndex ===
                        optionIndex
                          ? value
                          : option
                    ),
                }
              : question
        )
    );
  }

  function updateCorrectAnswer(
    index: number,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question, questionIndex) =>
            questionIndex ===
            index
              ? {
                  ...question,
                  correctAnswer:
                    value,
                }
              : question
        )
    );
  }

  function updateQuestionMarks(
    index: number,
    value: string
  ) {
    const marks =
      Number(value);

    setQuestions(
      (current) =>
        current.map(
          (question, questionIndex) =>
            questionIndex ===
            index
              ? {
                  ...question,
                  marks:
                    Number.isFinite(
                      marks
                    ) && marks > 0
                      ? Math.trunc(
                          marks
                        )
                      : 1,
                }
              : question
        )
    );
  }

  function removeQuestion(
    index: number
  ) {
    setQuestions(
      (current) =>
        current.filter(
          (_, questionIndex) =>
            questionIndex !==
            index
        )
    );
  }

  async function saveAssessment() {
    if (!title.trim()) {
      setError(
        "Assessment title is required."
      );
      return;
    }

    if (
      !courseId ||
      !Number.isInteger(
        Number(courseId)
      ) ||
      Number(courseId) <= 0
    ) {
      setError(
        "Please select a course."
      );
      return;
    }

    const parsedTotalMarks =
      Number(totalMarks);

    if (
      !Number.isInteger(
        parsedTotalMarks
      ) ||
      parsedTotalMarks <= 0
    ) {
      setError(
        "Total marks must be a positive integer."
      );
      return;
    }

    let parsedDuration:
      | number
      | null = null;

    if (type === "QUIZ") {
      parsedDuration =
        Number(
          durationMinutes
        );

      if (
        !Number.isInteger(
          parsedDuration
        ) ||
        parsedDuration <= 0
      ) {
        setError(
          "Quiz duration must be a positive integer."
        );
        return;
      }

      if (
        questions.length ===
        0
      ) {
        setError(
          "Please add at least one quiz question."
        );
        return;
      }

      const invalidQuestion =
        questions.find(
          (question) =>
            !question.question.trim() ||
            question.options.some(
              (option) =>
                !option.trim()
            ) ||
            !question.correctAnswer ||
            !question.marks ||
            question.marks <= 0
        );

      if (invalidQuestion) {
        setError(
          "Please complete every quiz question, all four options, the correct answer and marks."
        );
        return;
      }
    }

    setError("");

    try {
      setError("");

      const body = {
        ...(isEdit
          ? {}
          : {
              courseId:
                Number(
                  courseId
                ),
            }),
        title: title.trim(),
        type,
        description:
          type ===
          "ASSIGNMENT"
            ? description.trim() ||
              null
            : null,
        instructions:
          type === "QUIZ"
            ? description.trim() ||
              null
            : null,
        dueAt: dueAt
          ? new Date(
              dueAt
            ).toISOString()
          : null,
        totalMarks:
          parsedTotalMarks,
        durationMinutes:
          type === "QUIZ"
            ? parsedDuration
            : null,
        isActive,
      };

      const endpoint = isEdit &&
        assessment
        ? `${API_URL}/assessments/${assessment.id}`
        : `${API_URL}/assessments`;

      const response =
        await fetch(
          endpoint,
          {
            method: isEdit
              ? "PATCH"
              : "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              body
            ),
          }
        );

      if (response.status === 401) {
        localStorage.removeItem(
          "token"
        );
        localStorage.removeItem(
          "user"
        );
        localStorage.removeItem(
          "role"
        );
        window.location.href =
          "/login";
        return;
      }

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to save assessment."
        );
      }

      const assessmentId =
        Number(
          json.data?.id ??
            assessment?.id
        );

      if (
        !assessmentId ||
        !Number.isInteger(
          assessmentId
        )
      ) {
        throw new Error(
          "Assessment was saved but its ID could not be determined."
        );
      }

      /*
       * Quiz questions are persisted separately
       * because the backend stores them in
       * AssessmentQuestion.
       */
      if (type === "QUIZ") {
        const existingQuestions =
          assessment?.questions ??
          [];

        const keptExistingIds =
          new Set<number>();

        for (
          let index = 0;
          index < questions.length;
          index += 1
        ) {
          const question =
            questions[index];

          const payload = {
            question:
              question.question.trim(),
            optionA:
              question.options[0].trim(),
            optionB:
              question.options[1].trim(),
            optionC:
              question.options[2].trim(),
            optionD:
              question.options[3].trim(),
            correctAnswer:
              question.correctAnswer.trim(),
            marks:
              question.marks,
            sortOrder:
              index,
          };

          if (
            question.id
          ) {
            keptExistingIds.add(
              question.id
            );

            const questionResponse =
              await fetch(
                `${API_URL}/assessments/questions/${question.id}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify(
                    payload
                  ),
                }
              );

            const questionJson =
              await questionResponse.json();

            if (
              !questionResponse.ok ||
              !questionJson?.success
            ) {
              throw new Error(
                questionJson?.message ||
                  `Unable to update quiz question ${index + 1}.`
              );
            }
          } else {
            const questionResponse =
              await fetch(
                `${API_URL}/assessments/${assessmentId}/questions`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify(
                    payload
                  ),
                }
              );

            const questionJson =
              await questionResponse.json();

            if (
              !questionResponse.ok ||
              !questionJson?.success
            ) {
              throw new Error(
                questionJson?.message ||
                  `Unable to create quiz question ${index + 1}.`
              );
            }
          }
        }

        for (
          const existingQuestion of existingQuestions
        ) {
          if (
            !keptExistingIds.has(
              existingQuestion.id
            )
          ) {
            const deleteResponse =
              await fetch(
                `${API_URL}/assessments/questions/${existingQuestion.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${getToken()}`,
                  },
                }
              );

            const deleteJson =
              await deleteResponse.json();

            if (
              !deleteResponse.ok ||
              !deleteJson?.success
            ) {
              throw new Error(
                deleteJson?.message ||
                  "Unable to remove deleted quiz question."
              );
            }
          }
        }
      }

      await onSaved();
    } catch (err) {
      console.error(
        "Save assessment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save assessment."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={
            saving
              ? undefined
              : onBack
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67] disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Back to Assignments
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#173B67] p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
              Trainer Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              {isEdit
                ? `Edit ${typeLabel(
                    type
                  )}`
                : `Create ${typeLabel(
                    type
                  )}`}
            </h1>

            <p className="mt-1 text-sm leading-6 text-blue-100">
              {type ===
              "ASSIGNMENT"
                ? "Create an assignment for students enrolled in a selected course."
                : "Create a multiple-choice quiz with questions and marks."}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label={
                  type ===
                  "ASSIGNMENT"
                    ? "Assignment Title"
                    : "Quiz Title"
                }
                value={title}
                onChange={
                  setTitle
                }
                placeholder={
                  type ===
                  "ASSIGNMENT"
                    ? "Node.js CRUD API"
                    : "React Hooks Quiz"
                }
                required
              />

              <SelectField
                label="Course"
                value={courseId}
                onChange={
                  isEdit
                    ? () => {}
                    : setCourseId
                }
                options={
                  courses
                    .filter(
                      (course) =>
                        course.isActive ||
                        String(
                          course.id
                        ) ===
                          courseId
                    )
                    .map(
                      (course) => ({
                        value:
                          String(
                            course.id
                          ),
                        label:
                          course.title,
                      })
                    )
                }
                disabled={isEdit}
              />

              {type ===
                "ASSIGNMENT" && (
                <Field
                  label="Due Date"
                  type="datetime-local"
                  value={dueAt}
                  onChange={
                    setDueAt
                  }
                />
              )}

              {type ===
                "QUIZ" && (
                <Field
                  label="Due Date"
                  type="datetime-local"
                  value={dueAt}
                  onChange={
                    setDueAt
                  }
                />
              )}

              <Field
                label="Total Marks"
                type="number"
                value={
                  totalMarks
                }
                onChange={
                  setTotalMarks
                }
                required
              />

              {type ===
                "QUIZ" && (
                <Field
                  label="Duration (minutes)"
                  type="number"
                  value={
                    durationMinutes
                  }
                  onChange={
                    setDurationMinutes
                  }
                  required
                />
              )}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {type ===
                "ASSIGNMENT"
                  ? "Description"
                  : "Instructions"}
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event
                ) =>
                  setDescription(
                    event
                      .target
                      .value
                  )
                }
                rows={4}
                placeholder={
                  type ===
                  "ASSIGNMENT"
                    ? "Enter assignment description..."
                    : "Enter quiz instructions..."
                }
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    isActive
                  }
                  onChange={(
                    event
                  ) =>
                    setIsActive(
                      event
                        .target
                        .checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-700">
                    Active
                  </span>

                  <span className="mt-0.5 block text-xs text-slate-500">
                    Active assessments can be accessed by eligible students.
                  </span>
                </span>
              </label>
            </div>

            {type ===
              "QUIZ" && (
              <div className="mt-7 border-t border-slate-100 pt-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Questions
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Add single-answer multiple-choice questions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addQuestion
                    }
                    disabled={
                      saving
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus
                      size={15}
                    />
                    Add Question
                  </button>
                </div>

                {questions.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                    No questions added yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map(
                      (
                        question,
                        index
                      ) => (
                        <QuestionEditor
                          key={
                            question.id ??
                            `new-${index}`
                          }
                          question={
                            question
                          }
                          index={
                            index
                          }
                          onQuestionChange={
                            updateQuestion
                          }
                          onOptionChange={
                            updateOption
                          }
                          onCorrectAnswerChange={
                            updateCorrectAnswer
                          }
                          onMarksChange={
                            updateQuestionMarks
                          }
                          onRemove={
                            removeQuestion
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  onBack
                }
                disabled={
                  saving
                }
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveAssessment()
                }
                disabled={
                  saving
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : isEdit ? (
                  <Save size={16} />
                ) : (
                  <Plus size={16} />
                )}

                {saving
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : `Create ${typeLabel(
                        type
                      )}`}
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
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onMarksChange,
  onRemove,
}: {
  question: Question;
  index: number;
  onQuestionChange: (
    index: number,
    value: string
  ) => void;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => void;
  onCorrectAnswerChange: (
    index: number,
    value: string
  ) => void;
  onMarksChange: (
    index: number,
    value: string
  ) => void;
  onRemove: (
    index: number
  ) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[#173B67]">
          Question{" "}
          {index + 1}
        </p>

        <button
          type="button"
          onClick={() =>
            onRemove(index)
          }
          title="Remove question"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
        >
          <Trash2
            size={15}
          />
        </button>
      </div>

      <textarea
        value={
          question.question
        }
        onChange={(
          event
        ) =>
          onQuestionChange(
            index,
            event.target.value
          )
        }
        rows={3}
        placeholder="Enter your question"
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map(
          (
            option,
            optionIndex
          ) => (
            <input
              key={`${index}-${optionIndex}`}
              value={
                option
              }
              onChange={(
                event
              ) =>
                onOptionChange(
                  index,
                  optionIndex,
                  event
                    .target
                    .value
                )
              }
              placeholder={`Option ${
                optionIndex +
                1
              }`}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          )
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
        <select
          value={
            question.correctAnswer
          }
          onChange={(
            event
          ) =>
            onCorrectAnswerChange(
              index,
              event
                .target
                .value
            )
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">
            Select Correct Answer
          </option>

          {question.options.map(
            (option, optionIndex) => {
              if (!option.trim()) {
                return null;
              }

              const answerKey =
                String.fromCharCode(
                  65 + optionIndex
                );

              return (
                <option
                  key={`${answerKey}-${option}`}
                  value={answerKey}
                >
                  {answerKey}. {option}
                </option>
              );
            }
          )}
        </select>

        <input
          type="number"
          min="1"
          value={
            question.marks
          }
          onChange={(
            event
          ) =>
            onMarksChange(
              index,
              event
                .target
                .value
            )
          }
          placeholder="Marks"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>
    </div>
  );
}

function SubmissionsPage({
  assessment,
  submissions,
  selectedSubmission,
  gradeScore,
  gradeFeedback,
  saving,
  error,
  successMessage,
  onBack,
  onSelectSubmission,
  onScoreChange,
  onFeedbackChange,
  onGrade,
  onOpenFile,
}: {
  assessment: Assessment;
  submissions: Submission[];
  selectedSubmission: Submission | null;
  gradeScore: string;
  gradeFeedback: string;
  saving: boolean;
  error: string;
  successMessage: string;
  onBack: () => void;
  onSelectSubmission: (submission: Submission) => void;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onGrade: () => Promise<void>;
  onOpenFile: (submission: Submission) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, Submission[]>();

    for (const submission of submissions) {
      const key = String(submission.userId);
      const current = map.get(key) ?? [];
      current.push(submission);
      map.set(key, current);
    }

    return Array.from(map.values()).map((items) =>
      items.sort((a, b) => a.attemptNumber - b.attemptNumber)
    );
  }, [submissions]);

  const pending = submissions.filter(
    (submission) => submission.status === "SUBMITTED" || submission.score === null
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]">
          <ArrowLeft size={16} /> Back to Assignments
        </button>

        {error && <ErrorBanner error={error} />}
        {successMessage && <SuccessBanner message={successMessage} />}

        <div className="mb-6 rounded-2xl bg-[#173B67] p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">Assignment Submissions</p>
          <h1 className="mt-1 text-2xl font-bold">{assessment.title}</h1>
          <p className="mt-1 text-sm text-blue-100">
            {assessment.courseTitle || "Course unavailable"} · Total Marks: {assessment.totalMarks}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultCard icon={<Users size={18} />} label="Students" value={grouped.length} />
          <ResultCard icon={<ClipboardList size={18} />} label="Attempts" value={submissions.length} />
          <ResultCard icon={<Clock3 size={18} />} label="Pending Review" value={pending} />
          <ResultCard icon={<CheckCircle2 size={18} />} label="Graded" value={submissions.length - pending} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Students &amp; Attempts</h2>
              <p className="mt-1 text-xs text-slate-500">Every student is shown once, with all attempts kept separately.</p>
            </div>

            {grouped.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users size={25} className="mx-auto text-slate-300" />
                <h3 className="mt-4 text-base font-semibold text-[#173B67]">No submissions</h3>
                <p className="mt-1 text-sm text-slate-500">No students have submitted this assignment yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {grouped.map((attempts) => {
                  const student = attempts[0];
                  return (
                    <div key={student.userId} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{student.studentName}</p>
                          <p className="mt-1 text-xs text-slate-500">{student.studentEmail}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                          {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {attempts.map((submission) => (
                          <button
                            key={submission.id}
                            type="button"
                            onClick={() => onSelectSubmission(submission)}
                            className={`flex w-full items-center justify-between gap-4 rounded-xl border p-3 text-left transition ${selectedSubmission?.id === submission.id ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#173B67] text-xs font-bold text-white">
                                {submission.attemptNumber}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800">Attempt {submission.attemptNumber}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(submission.submittedAt)}</p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${submissionStatusClasses(submission.status)}`}>
                                {submissionStatusLabel(submission.status)}
                              </span>
                              <p className="mt-1 text-xs font-semibold text-slate-700">
                                {submission.score === null ? `Not graded / ${assessment.totalMarks}` : `${submission.score}/${assessment.totalMarks}`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <SubmissionGradePanel
            assessment={assessment}
            selectedSubmission={selectedSubmission}
            gradeScore={gradeScore}
            gradeFeedback={gradeFeedback}
            saving={saving}
            onScoreChange={onScoreChange}
            onFeedbackChange={onFeedbackChange}
            onGrade={onGrade}
            onOpenFile={onOpenFile}
          />
        </div>
      </div>
    </main>
  );
}

function SubmissionGradePanel({
  assessment,
  selectedSubmission,
  gradeScore,
  gradeFeedback,
  saving,
  onScoreChange,
  onFeedbackChange,
  onGrade,
  onOpenFile,
}: {
  assessment: Assessment;
  selectedSubmission: Submission | null;
  gradeScore: string;
  gradeFeedback: string;
  saving: boolean;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onGrade: () => Promise<void>;
  onOpenFile: (submission: Submission) => void;
}) {
  if (!selectedSubmission) {
    return (
      <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ClipboardList size={25} /></div>
          <h3 className="mt-4 text-base font-semibold text-[#173B67]">Select an attempt</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Choose Attempt 1, 2 or 3 to review and save its grade independently.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Attempt {selectedSubmission.attemptNumber}</p>
          <h2 className="mt-1 text-lg font-bold text-[#173B67]">{selectedSubmission.studentName}</h2>
          <p className="mt-1 text-sm text-slate-500">{selectedSubmission.studentEmail}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${submissionStatusClasses(selectedSubmission.status)}`}>
          {submissionStatusLabel(selectedSubmission.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DetailBox label="Attempt" value={`${selectedSubmission.attemptNumber}`} />
        <DetailBox label="Submitted" value={formatDateTime(selectedSubmission.submittedAt)} />
        <DetailBox label="Current Score" value={selectedSubmission.score === null ? `Not graded / ${assessment.totalMarks}` : `${selectedSubmission.score}/${assessment.totalMarks}`} />
      </div>

      {selectedSubmission.submissionFileName ? (
        <button type="button" onClick={() => onOpenFile(selectedSubmission)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#173B67] hover:bg-slate-50">
          <Download size={14} /> Open submitted file
        </button>
      ) : null}

      {selectedSubmission.submissionComment ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student Comment</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{selectedSubmission.submissionComment}</p>
        </div>
      ) : null}

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Trainer Feedback</label>
        <textarea value={gradeFeedback} onChange={(event) => onFeedbackChange(event.target.value)} rows={5} className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="Enter feedback..." />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Score</label>
        <div className="flex items-center gap-3">
          <input type="number" min="0" max={assessment.totalMarks} value={gradeScore} onChange={(event) => onScoreChange(event.target.value)} className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          <span className="text-sm text-slate-500">/ {assessment.totalMarks}</span>
        </div>
      </div>

      <button type="button" disabled={saving} onClick={() => void onGrade()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {saving ? "Saving Grade..." : `Save Attempt ${selectedSubmission.attemptNumber} Grade`}
      </button>
    </section>
  );
}

function MiniStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#173B67]">{value}</p>
    </div>
  );
}

function QuizResultsPage({
  assessment,
  submissions,
  assessmentDetails,
  error,
  onBack,
  onGrade,
  selectedSubmission,
  gradeScore,
  gradeFeedback,
  saving,
  successMessage,
  onScoreChange,
  onFeedbackChange,
  onSaveGrade,
  onOpenFile,
}: {
  assessment: Assessment;
  submissions: Submission[];
  assessmentDetails: AssessmentDetails | null;
  error: string;
  successMessage: string;
  onBack: () => void;
  onGrade: (submission: Submission) => void;
  selectedSubmission: Submission | null;
  gradeScore: string;
  gradeFeedback: string;
  saving: boolean;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onSaveGrade: () => Promise<void>;
  onOpenFile: (submission: Submission) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<number, Submission[]>();

    for (const submission of submissions) {
      const current = map.get(submission.userId) ?? [];
      current.push(submission);
      map.set(submission.userId, current);
    }

    return Array.from(map.values()).map((items) =>
      items.sort((a, b) => a.attemptNumber - b.attemptNumber)
    );
  }, [submissions]);

  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(
    () => new Set(grouped.length > 0 ? [grouped[0][0].userId] : [])
  );
  const [selectedAttemptByStudent, setSelectedAttemptByStudent] = useState<
    Map<number, number>
  >(
    () =>
      new Map(
        grouped.length > 0
          ? [[grouped[0][0].userId, grouped[0][0].id]]
          : []
      )
  );
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);

  useEffect(() => {
    const firstSelections = new Map<number, number>();
    for (const attempts of grouped) {
      if (attempts.length > 0) {
        firstSelections.set(attempts[0].userId, attempts[0].id);
      }
    }

    setExpandedStudents(
      grouped.length > 0 ? new Set([grouped[0][0].userId]) : new Set()
    );
    setSelectedAttemptByStudent(firstSelections);
    setGradingSubmissionId(null);
  }, [grouped]);

  const scored = submissions.filter((submission) => submission.score !== null);
  const totalMarks = assessment.totalMarks || 1;
  const average = scored.length
    ? (
        scored.reduce(
          (sum, submission) => sum + Number(submission.score || 0),
          0
        ) / scored.length
      ).toFixed(1)
    : "0.0";
  const pending = submissions.filter(
    (submission) =>
      submission.status === "SUBMITTED" || submission.score === null
  ).length;

  function toggleStudent(userId: number, attempts: Submission[]) {
    setExpandedStudents((current) => {
      const next = new Set(current);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        setSelectedAttemptByStudent((selected) => {
          const nextSelected = new Map(selected);
          if (!nextSelected.has(userId) && attempts.length > 0) {
            nextSelected.set(userId, attempts[0].id);
          }
          return nextSelected;
        });
      }
      return next;
    });
  }

  function selectAttempt(userId: number, submissionId: number) {
    setSelectedAttemptByStudent((current) => {
      const next = new Map(current);
      next.set(userId, submissionId);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]"
        >
          <ArrowLeft size={17} /> Back to Assignments
        </button>

        <section className="rounded-2xl bg-[#173B67] p-6 text-white shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
            Quiz Results
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{assessment.title}</h1>
          <p className="mt-1 text-sm text-blue-100">
            {assessment.courseTitle} · Total Marks: {assessment.totalMarks}
            {assessment.durationMinutes ? ` · ${assessment.durationMinutes} minutes` : ""}
          </p>
        </section>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat value={String(new Set(submissions.map((s) => s.userId)).size)} label="Students" />
          <MiniStat value={String(submissions.length)} label="Attempts" />
          <MiniStat value={String(pending)} label="Pending Review" />
          <MiniStat value={`${average}/${totalMarks}`} label="Average Score" />
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">Students &amp; Attempts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Expand a student, then select a particular attempt to review its submitted answers.
            </p>
          </div>

          {grouped.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users size={25} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-semibold text-[#173B67]">No submissions</h3>
              <p className="mt-1 text-sm text-slate-500">
                No students have submitted this quiz yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {grouped.map((attempts) => {
                const student = attempts[0];
                const studentExpanded = expandedStudents.has(student.userId);
                const selectedId = selectedAttemptByStudent.get(student.userId);
                const selectedAttempt =
                  attempts.find((attempt) => attempt.id === selectedId) ?? attempts[0];

                return (
                  <div key={student.userId}>
                    <button
                      type="button"
                      onClick={() => toggleStudent(student.userId, attempts)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {student.studentName || "Student"}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                            {attempts.length} attempt{attempts.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {student.studentId || "No student ID"}
                          {student.studentEmail ? ` • ${student.studentEmail}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-slate-400">{studentExpanded ? "⌃" : "⌄"}</span>
                    </button>

                    {studentExpanded && selectedAttempt ? (
                      <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5">
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                          <div className="border-b border-slate-100 p-4 sm:p-5">
                            <div className="flex flex-wrap gap-2">
                              {attempts.map((attempt) => {
                                const active = attempt.id === selectedAttempt.id;
                                return (
                                  <button
                                    key={attempt.id}
                                    type="button"
                                    onClick={() => selectAttempt(student.userId, attempt.id)}
                                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                      active
                                        ? "bg-[#173B67] text-white"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    Attempt {attempt.attemptNumber}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attempt</p>
                                <p className="mt-1 text-lg font-bold text-[#173B67]">{selectedAttempt.attemptNumber}</p>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-3">
                                <DetailBox
                                  label="Score"
                                  value={selectedAttempt.score === null ? `0 / ${totalMarks}` : `${selectedAttempt.score} / ${totalMarks}`}
                                />
                                <DetailBox
                                  label="Status"
                                  value={submissionStatusLabel(selectedAttempt.status)}
                                />
                                <DetailBox
                                  label="Submitted"
                                  value={formatDateTime(selectedAttempt.submittedAt)}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onGrade(selectedAttempt);
                                  setGradingSubmissionId(selectedAttempt.id);
                                }}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173B67] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#123052]"
                              >
                                <CheckCircle2 size={16} />
                                Grade Submission
                              </button>
                            </div>

                            {selectedAttempt.submissionComment ? (
                              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student Comment</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{selectedAttempt.submissionComment}</p>
                              </div>
                            ) : null}

                            {selectedAttempt.submissionFileName ? (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => onOpenFile(selectedAttempt)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#173B67] hover:bg-slate-50"
                                >
                                  <Download size={14} /> Open submitted file
                                </button>
                              </div>
                            ) : null}

                            {assessmentDetails ? (
                              <QuizSubmittedAnswers
                                details={assessmentDetails}
                                submission={selectedAttempt}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {gradingSubmissionId !== null && selectedSubmission ? (
        <GradeSubmissionModal
          assessment={assessment}
          submission={selectedSubmission}
          gradeScore={gradeScore}
          gradeFeedback={gradeFeedback}
          saving={saving}
          onScoreChange={onScoreChange}
          onFeedbackChange={onFeedbackChange}
          onSave={async () => {
            await onSaveGrade();
            setGradingSubmissionId(null);
          }}
          onClose={() => setGradingSubmissionId(null)}
        />
      ) : null}
    </main>
  );
}

function QuizSubmittedAnswers({
  details,
  submission,
}: {
  details: AssessmentDetails;
  submission: Submission;
}) {
  let answers: Record<string, string> = {};
  try {
    answers = submission.answers ? JSON.parse(submission.answers) : {};
  } catch {
    answers = {};
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Submitted Answers</h3>
          <p className="mt-1 text-xs text-slate-500">
            Green indicates the correct answer. Red indicates a selected incorrect answer.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {details.questions.map((question, index) => {
          const selected = String(answers[String(question.id)] ?? "").toUpperCase();
          const correct = String(question.correctAnswer ?? "").toUpperCase();
          const options = [
            ["A", question.optionA],
            ["B", question.optionB],
            ["C", question.optionC],
            ["D", question.optionD],
          ].filter(
            (item): item is [string, string] => Boolean(item[1]?.trim())
          );

          const answeredCorrectly = Boolean(selected && correct && selected === correct);

          return (
            <div key={question.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  {index + 1}. {question.question}
                </p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                  {question.marks} marks
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {options.map(([letter, label]) => {
                  const isSelected = selected === letter;
                  const isCorrect = correct === letter;
                  const classes =
                    isSelected && isCorrect
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : isSelected
                        ? "border-red-300 bg-red-50 text-red-800"
                        : isCorrect
                          ? "border-emerald-200 bg-emerald-50/60 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600";

                  return (
                    <div
                      key={letter}
                      className={`rounded-lg border px-3 py-2.5 text-xs ${classes}`}
                    >
                      <span className="mr-2 font-bold">{letter}.</span>
                      {label}
                      {isSelected && (
                        <span className="ml-2 font-bold">Selected</span>
                      )}
                      {isCorrect && (
                        <span className="ml-2 font-bold">Correct answer</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                <span>
                  Student answer: <strong>{selected || "Not answered"}</strong>
                </span>
                <span>
                  Correct answer: <strong>{correct || "—"}</strong>
                </span>
                <span>
                  Marks: <strong>{question.marks}</strong>
                </span>
                {selected && correct && (
                  <span
                    className={
                      answeredCorrectly
                        ? "font-bold text-emerald-600"
                        : "font-bold text-red-600"
                    }
                  >
                    {answeredCorrectly ? "✓ Correct" : "✕ Incorrect"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GradeSubmissionModal({
  assessment,
  submission,
  gradeScore,
  gradeFeedback,
  saving,
  onScoreChange,
  onFeedbackChange,
  onSave,
  onClose,
}: {
  assessment: Assessment;
  submission: Submission;
  gradeScore: string;
  gradeFeedback: string;
  saving: boolean;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              Grade Submission
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#173B67]">
              Attempt {submission.attemptNumber}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {submission.studentName} · {assessment.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Score
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max={assessment.totalMarks}
              value={gradeScore}
              onChange={(event) => onScoreChange(event.target.value)}
              className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <span className="text-sm text-slate-500">
              / {assessment.totalMarks}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Trainer Feedback
          </label>
          <textarea
            value={gradeFeedback}
            onChange={(event) => onFeedbackChange(event.target.value)}
            rows={5}
            className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter feedback..."
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Grade"}
          </button>
        </div>
      </div>
    </div>
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
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-lg font-bold text-[#173B67]">
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </p>
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
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="text-red-500">
            {" "}
            *
          </span>
        )}
      </span>

      <input
        type={type}
        required={
          required
        }
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        <span className="text-red-500">
          {" "}
          *
        </span>
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      >
        <option value="">
          Select Course
        </option>

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
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
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {
            description
          }
        </p>
      </div>
    </button>
  );
}

function EmptyState({
  search,
  filterType,
}: {
  search: string;
  filterType:
    | "All"
    | AssessmentType;
}) {
  const filtered =
    search ||
    filterType !==
      "All";

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        <ClipboardList
          size={29}
        />
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-900">
        No assignments or quizzes found
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {filtered
          ? "Try changing the search or type filter."
          : "Create your first assignment or quiz to get started."}
      </p>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

function SuccessBanner({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle2
        size={18}
        className="shrink-0"
      />

      <p className="font-semibold">
        {message}
      </p>
    </div>
  );
}

function ErrorBanner({
  error,
}: {
  error: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle
        size={18}
        className="mt-0.5 shrink-0"
      />

      <div>
        <p className="font-semibold">
          Error
        </p>

        <p className="mt-0.5">
          {error}
        </p>
      </div>
    </div>
  );
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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
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
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
      >
        <X size={18} />
      </button>
    </div>
  );
}
