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
  ) {
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
      const response =
        await authenticatedFetch(
          `${API_URL}/assessments/${assessment.id}/submissions`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to load submissions."
        );
      }

      setSubmissions(
        Array.isArray(
          json.data
        )
          ? json.data
          : []
      );
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

      await openSubmissions(
        selectedAssessment
      );

      const refreshedSubmission =
        Array.isArray(
          json.data
        )
          ? null
          : json.data;

      if (
        refreshedSubmission?.id
      ) {
        const updated =
          refreshedSubmission as Submission;

        setSelectedSubmission(
          updated
        );

        setGradeScore(
          updated.score ===
            null
            ? ""
            : String(
                updated.score
              )
        );

        setGradeFeedback(
          updated.feedback ||
            ""
        );
      } else {
        setSelectedSubmission(
          null
        );
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

          {question.options
            .filter(
              (option) =>
                option.trim()
            )
            .map(
              (option) => (
                <option
                  key={option}
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
  onSelectSubmission: (
    submission: Submission
  ) => void;
  onScoreChange: (
    value: string
  ) => void;
  onFeedbackChange: (
    value: string
  ) => void;
  onGrade: () => Promise<void>;
  onOpenFile: (
    submission: Submission
  ) => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          type="button"
          onClick={
            onBack
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]"
        >
          <ArrowLeft
            size={16}
          />
          Back to Assignments
        </button>

        {error && (
          <ErrorBanner
            error={error}
          />
        )}

        {successMessage && (
          <SuccessBanner
            message={successMessage}
          />
        )}

        <div className="mb-6 rounded-2xl bg-[#173B67] p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
            Assignment Submissions
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            {
              assessment.title
            }
          </h1>

          <p className="mt-1 text-sm text-blue-100">
            {assessment.courseTitle ||
              "Course unavailable"}{" "}
            · Total Marks:{" "}
            {
              assessment.totalMarks
            }
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Student Submissions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select a submission to review and grade.
              </p>
            </div>

            {submissions.length ===
            0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Users
                    size={25}
                  />
                </div>

                <h3 className="mt-4 text-base font-semibold text-[#173B67]">
                  No submissions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No students have submitted this assignment yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissions.map(
                  (
                    submission
                  ) => (
                    <button
                      type="button"
                      key={
                        submission.id
                      }
                      onClick={() =>
                        onSelectSubmission(
                          submission
                        )
                      }
                      className={`w-full p-4 text-left transition hover:bg-slate-50 ${
                        selectedSubmission?.id ===
                        submission.id
                          ? "bg-orange-50/60"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {
                              submission.studentName
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {submission.studentId ||
                              submission.studentEmail}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Submitted:{" "}
                            {formatDateTime(
                              submission.submittedAt
                            )}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${submissionStatusClasses(
                              submission.status
                            )}`}
                          >
                            {submissionStatusLabel(
                              submission.status
                            )}
                          </span>

                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            {submission.score ===
                            null
                              ? "Not graded"
                              : `${submission.score}/${assessment.totalMarks}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {!selectedSubmission ? (
              <div className="flex min-h-[350px] items-center justify-center text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ClipboardList
                      size={25}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-[#173B67]">
                    Select a submission
                  </h3>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    Choose a student submission from the left to review the work and save a grade.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#173B67]">
                      {
                        selectedSubmission.studentName
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedSubmission.studentEmail
                      }
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${submissionStatusClasses(
                      selectedSubmission.status
                    )}`}
                  >
                    {submissionStatusLabel(
                      selectedSubmission.status
                    )}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    label="Submitted"
                    value={formatDateTime(
                      selectedSubmission.submittedAt
                    )}
                  />

                  <DetailBox
                    label="Attempt"
                    value={String(
                      selectedSubmission.attemptNumber
                    )}
                  />
                </div>

                {selectedSubmission.submissionComment && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Student Comment
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {
                        selectedSubmission.submissionComment
                      }
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  {selectedSubmission.submissionFileUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenFile(
                          selectedSubmission
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Download
                        size={17}
                      />
                      Open Submission File
                    </button>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No uploaded submission file.
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Trainer Feedback
                  </label>

                  <textarea
                    value={
                      gradeFeedback
                    }
                    onChange={(
                      event
                    ) =>
                      onFeedbackChange(
                        event
                          .target
                          .value
                      )
                    }
                    rows={5}
                    placeholder="Enter feedback for the student..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Marks
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max={
                        assessment.totalMarks
                      }
                      value={
                        gradeScore
                      }
                      onChange={(
                        event
                      ) =>
                        onScoreChange(
                          event
                            .target
                            .value
                        )
                      }
                      className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />

                    <span className="text-sm text-slate-500">
                      /{" "}
                      {
                        assessment.totalMarks
                      }
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void onGrade()
                  }
                  disabled={
                    saving
                  }
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving Grade..."
                    : "Save Grade"}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function QuizResultsPage({
  assessment,
  submissions,
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
}: {
  assessment: Assessment;
  submissions: Submission[];
  error: string;
  successMessage: string;
  onBack: () => void;
  onGrade: (
    submission: Submission
  ) => void;
  selectedSubmission: Submission | null;
  gradeScore: string;
  gradeFeedback: string;
  saving: boolean;
  onScoreChange: (
    value: string
  ) => void;
  onFeedbackChange: (
    value: string
  ) => void;
  onSaveGrade: () => Promise<void>;
}) {
  const scored =
    submissions.filter(
      (submission) =>
        submission.score !==
        null
    );

  const totalMarks =
    assessment.totalMarks ||
    1;

  const average =
    scored.length === 0
      ? 0
      : (
          scored.reduce(
            (sum, submission) =>
              sum +
              Number(
                submission.score ||
                  0
              ),
            0
          ) /
          scored.length
        ).toFixed(1);

  const highest =
    scored.length === 0
      ? 0
      : Math.max(
          ...scored.map(
            (submission) =>
              Number(
                submission.score ||
                  0
              )
          )
        );

  const pending =
    submissions.filter(
      (submission) =>
        submission.status ===
          "SUBMITTED" ||
        submission.score ===
          null
    ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          type="button"
          onClick={
            onBack
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#173B67]"
        >
          <ArrowLeft
            size={16}
          />
          Back to Assignments
        </button>

        {error && (
          <ErrorBanner
            error={error}
          />
        )}

        {successMessage && (
          <SuccessBanner
            message={successMessage}
          />
        )}

        <div className="mb-6 rounded-2xl bg-[#173B67] p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
            Quiz Results
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            {
              assessment.title
            }
          </h1>

          <p className="mt-1 text-sm text-blue-100">
            {assessment.courseTitle ||
              "Course unavailable"}{" "}
            ·{" "}
            {assessment.totalMarks}{" "}
            marks
            {assessment.durationMinutes &&
              ` · ${assessment.durationMinutes} minutes`}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResultCard
            icon={
              <Users size={18} />
            }
            label="Submissions"
            value={
              submissions.length
            }
          />

          <ResultCard
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label="Average Score"
            value={`${average} / ${totalMarks}`}
          />

          <ResultCard
            icon={
              <FileText size={18} />
            }
            label="Highest Score"
            value={`${highest} / ${totalMarks}`}
          />

          <ResultCard
            icon={
              <Clock3 size={18} />
            }
            label="Pending Review"
            value={pending}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Student Results
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review actual quiz submissions and scores.
              </p>
            </div>

            {submissions.length ===
            0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <HelpCircle
                    size={25}
                  />
                </div>

                <h3 className="mt-4 text-base font-semibold text-[#173B67]">
                  No quiz submissions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No students have submitted this quiz yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <TableHeader>
                        Student
                      </TableHeader>

                      <TableHeader>
                        Score
                      </TableHeader>

                      <TableHeader>
                        Percentage
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>

                      <TableHeader>
                        Action
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {submissions.map(
                      (
                        submission
                      ) => {
                        const score =
                          submission.score;

                        const percentage =
                          score ===
                          null
                            ? "—"
                            : `${Math.round(
                                (Number(
                                  score
                                ) /
                                  totalMarks) *
                                  100
                              )}%`;

                        return (
                          <tr
                            key={
                              submission.id
                            }
                            className="border-t border-slate-100"
                          >
                            <TableCell>
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {
                                    submission.studentName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    submission.studentEmail
                                  }
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              {score ===
                              null
                                ? "—"
                                : `${score}/${totalMarks}`}
                            </TableCell>

                            <TableCell>
                              {
                                percentage
                              }
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${submissionStatusClasses(
                                  submission.status
                                )}`}
                              >
                                {submissionStatusLabel(
                                  submission.status
                                )}
                              </span>
                            </TableCell>

                            <TableCell>
                              <button
                                type="button"
                                onClick={() =>
                                  onGrade(
                                    submission
                                  )
                                }
                                className="rounded-lg bg-[#173B67] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#123052]"
                              >
                                {score ===
                                  null ||
                                submission.status ===
                                  "SUBMITTED"
                                  ? "Review"
                                  : "Update Grade"}
                              </button>
                            </TableCell>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {!selectedSubmission ? (
              <div className="flex min-h-[320px] items-center justify-center text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Eye
                      size={25}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-[#173B67]">
                    Select a result
                  </h3>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    Select a student to review or update the recorded score and feedback.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#173B67]">
                      {
                        selectedSubmission.studentName
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedSubmission.studentEmail
                      }
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${submissionStatusClasses(
                      selectedSubmission.status
                    )}`}
                  >
                    {submissionStatusLabel(
                      selectedSubmission.status
                    )}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Submission
                  </p>

                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <DetailBox
                      label="Submitted"
                      value={formatDateTime(
                        selectedSubmission.submittedAt
                      )}
                    />

                    <DetailBox
                      label="Current Score"
                      value={
                        selectedSubmission.score ===
                        null
                          ? `Not graded / ${totalMarks}`
                          : `${selectedSubmission.score}/${totalMarks}`
                      }
                    />
                  </div>
                </div>

                {selectedSubmission.answers && (
                  <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                      View submitted answers
                    </summary>

                    <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      {
                        selectedSubmission.answers
                      }
                    </pre>
                  </details>
                )}

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Trainer Feedback
                  </label>

                  <textarea
                    value={
                      gradeFeedback
                    }
                    onChange={(
                      event
                    ) =>
                      onFeedbackChange(
                        event
                          .target
                          .value
                      )
                    }
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    placeholder="Enter feedback..."
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Score
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max={
                        totalMarks
                      }
                      value={
                        gradeScore
                      }
                      onChange={(
                        event
                      ) =>
                        onScoreChange(
                          event
                            .target
                            .value
                        )
                      }
                      className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />

                    <span className="text-sm text-slate-500">
                      /{" "}
                      {
                        totalMarks
                      }
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    void onSaveGrade()
                  }
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving Grade..."
                    : "Save Grade"}
                </button>
              </>
            )}
          </section>
        </div>
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
