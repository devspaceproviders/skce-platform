"use client";

import type {
  Dispatch,
  FormEvent,
  MouseEvent,
  ReactNode,
  SetStateAction,
} from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  X,
  Save,
  ClipboardList,
  Users,
  Clock3,
  RefreshCw,
  CheckCircle2,
  CircleAlert,
  Download,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type AssessmentType = "Assignment" | "Quiz";
type AssessmentStatus = "Draft" | "Published";
type BackendAssessmentType = "ASSIGNMENT" | "QUIZ";
type SubmissionStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED";

type Course = {
  id: number;
  title: string;
  slug?: string | null;
  isActive?: boolean;
};

type Assessment = {
  id: number;
  courseId: number;
  title: string;
  type: AssessmentType;
  course: string;
  description: string;
  instructions: string;
  dueAt: string | null;
  totalMarks: number;
  durationMinutes: number | null;
  questionCount: number;
  submissions: number;
  status: AssessmentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AssessmentForm = {
  title: string;
  type: AssessmentType;
  courseId: string;
  description: string;
  instructions: string;
  dueAt: string;
  totalMarks: string;
  durationMinutes: string;
  status: AssessmentStatus;
};

type Question = {
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

type QuestionForm = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: string;
  sortOrder: string;
};

type AssessmentDetails = {
  id: number;
  courseId: number;
  title: string;
  type: BackendAssessmentType;
  description: string | null;
  instructions: string | null;
  dueAt: string | null;
  totalMarks: number;
  durationMinutes: number | null;
  isActive: boolean;
  questions: Question[];
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
  course: {
    id: number;
    slug: string;
    title: string;
    isActive: boolean;
  };
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
  status: SubmissionStatus;
  feedback: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_FORM: AssessmentForm = {
  title: "",
  type: "Assignment",
  courseId: "",
  description: "",
  instructions: "",
  dueAt: "",
  totalMarks: "100",
  durationMinutes: "",
  status: "Draft",
};

const EMPTY_QUESTION: QuestionForm = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  marks: "1",
  sortOrder: "0",
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function displayType(
  type: BackendAssessmentType
): AssessmentType {
  return type === "QUIZ"
    ? "Quiz"
    : "Assignment";
}

function backendType(
  type: AssessmentType
): BackendAssessmentType {
  return type === "Quiz"
    ? "QUIZ"
    : "ASSIGNMENT";
}

function displayStatus(
  isActive: boolean
): AssessmentStatus {
  return isActive ? "Published" : "Draft";
}

function toDateTimeLocal(
  value: string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatDate(
  value: string | null | undefined
) {
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

function formatDateTime(
  value: string | null | undefined
) {
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

function normalizeAssessment(
  item: any
): Assessment {
  return {
    id: Number(item.id),
    courseId: Number(item.courseId),
    title: item.title ?? "",
    type: displayType(item.type),
    course: item.courseTitle ?? "",
    description: item.description ?? "",
    instructions: item.instructions ?? "",
    dueAt: item.dueAt ?? null,
    totalMarks: Number(item.totalMarks ?? 0),
    durationMinutes:
      item.durationMinutes === null ||
      item.durationMinutes === undefined
        ? null
        : Number(item.durationMinutes),
    questionCount: Number(item.questionCount ?? 0),
    submissions: Number(item.submissionCount ?? 0),
    status: displayStatus(Boolean(item.isActive)),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
  };
}

export default function AssignmentsPage() {
  const router = useRouter();

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<"All" | AssessmentType>("All");
  const [statusFilter, setStatusFilter] =
    useState<"All" | AssessmentStatus>("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [showAddModal, setShowAddModal] =
    useState(false);
  const [showEditModal, setShowEditModal] =
    useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);
  const [showQuestionsModal, setShowQuestionsModal] =
    useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] =
    useState(false);
  const [showQuestionForm, setShowQuestionForm] =
    useState(false);

  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [selectedDetails, setSelectedDetails] =
    useState<AssessmentDetails | null>(null);

  const [openMenu, setOpenMenu] = useState<{
    assessmentId: number;
    top: number;
    left: number;
  } | null>(null);

  const [form, setForm] =
    useState<AssessmentForm>(EMPTY_FORM);

  const [questionForm, setQuestionForm] =
    useState<QuestionForm>(EMPTY_QUESTION);
  const [editingQuestionId, setEditingQuestionId] =
    useState<number | null>(null);

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [gradingId, setGradingId] =
    useState<number | null>(null);
  const [gradeScore, setGradeScore] =
    useState("");
  const [gradeFeedback, setGradeFeedback] =
    useState("");

  const [error, setError] = useState("");

  const filteredAssessments = useMemo(() => {
    const query = search.toLowerCase().trim();

    return assessments.filter((assessment) => {
      const matchesSearch =
        !query ||
        [
          assessment.title,
          String(assessment.id),
          assessment.course,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (typeFilter === "All" ||
          assessment.type === typeFilter) &&
        (statusFilter === "All" ||
          assessment.status === statusFilter)
      );
    });
  }, [
    assessments,
    search,
    typeFilter,
    statusFilter,
  ]);

  const totalAssignments = assessments.filter(
    (item) => item.type === "Assignment"
  ).length;

  const totalQuizzes = assessments.filter(
    (item) => item.type === "Quiz"
  ).length;

  const totalDrafts = assessments.filter(
    (item) => item.status === "Draft"
  ).length;

  const updateForm = (
    field: keyof AssessmentForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const closeAll = () => {
    if (saving) {
      return;
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowQuestionsModal(false);
    setShowSubmissionsModal(false);
    setShowQuestionForm(false);
    setSelectedAssessment(null);
    setSelectedDetails(null);
    setOpenMenu(null);
    setForm(EMPTY_FORM);
    setQuestionForm(EMPTY_QUESTION);
    setEditingQuestionId(null);
    setSubmissions([]);
    setGradingId(null);
    setGradeScore("");
    setGradeFeedback("");
    setError("");
  };

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      router.push("/admin/login");
      throw new Error("Authentication required");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("student");
      localStorage.removeItem("studentId");
      router.push("/admin/login");
      throw new Error("Authentication required");
    }

    return response;
  }

  async function handleDownloadSubmissionFile(
    submission: Submission
  ) {
    if (!submission.submissionFileUrl) {
      return;
    }

    try {
      const relativeUrl = submission.submissionFileUrl;
      const fileUrl = relativeUrl.startsWith("/api/")
        ? `${API_URL}${relativeUrl.slice(4)}`
        : relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")
        ? relativeUrl
        : `${API_URL}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;

      const response = await authenticatedFetch(fileUrl);

      if (!response.ok) {
        throw new Error("Unable to download submission file.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = submission.submissionFileName || "submission-file";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download submission file error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download submission file."
      );
    }
  }

  async function loadCourses() {
    const response = await authenticatedFetch(
      `${API_URL}/admin/courses`
    );

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(
        json?.message ||
          "Unable to load courses."
      );
    }

    setCourses(
      (json.data || []).map((course: Course) => ({
        id: Number(course.id),
        title: course.title,
        slug: course.slug,
        isActive: course.isActive,
      }))
    );
  }

  async function loadAssessments() {
    const response = await authenticatedFetch(
      `${API_URL}/admin/assessments`
    );

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(
        json?.message ||
          "Unable to load assessments."
      );
    }

    setAssessments(
      (json.data || []).map(normalizeAssessment)
    );
  }

  async function loadPage() {
    try {
      setError("");

      await Promise.all([
        loadCourses(),
        loadAssessments(),
      ]);
    } catch (err) {
      console.error(
        "Load assessment page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assessments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handleViewportChange = () => {
      setOpenMenu(null);
    };

    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
      window.removeEventListener(
        "resize",
        handleViewportChange
      );
    };
  }, [openMenu]);

  async function refreshPage() {
    setRefreshing(true);
    await loadPage();
  }

  function openActionMenu(
    event: MouseEvent<HTMLButtonElement>,
    assessmentId: number
  ) {
    event.stopPropagation();

    if (openMenu?.assessmentId === assessmentId) {
      setOpenMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 248;
    const gap = 8;
    const viewportPadding = 10;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuWidth - viewportPadding;
    }

    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = rect.top - menuHeight - gap;
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    setOpenMenu({
      assessmentId,
      top,
      left,
    });
  }

  function closeActionMenu() {
    setOpenMenu(null);
  }

  function openCreateModal(type: AssessmentType) {
    setForm({
      ...EMPTY_FORM,
      type,
    });
    setError("");
    setShowAddModal(true);
  }

  function openEditModal(
    assessment: Assessment
  ) {
    setOpenMenu(null);
    setSelectedAssessment(assessment);
    setForm({
      title: assessment.title,
      type: assessment.type,
      courseId: String(assessment.courseId),
      description: assessment.description,
      instructions: assessment.instructions,
      dueAt: toDateTimeLocal(
        assessment.dueAt
      ),
      totalMarks: String(
        assessment.totalMarks
      ),
      durationMinutes:
        assessment.durationMinutes ===
        null
          ? ""
          : String(
              assessment.durationMinutes
            ),
      status: assessment.status,
    });
    setError("");
    setShowEditModal(true);
  }

  async function createAssessment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setError(
        "Assessment title is required."
      );
      return;
    }

    const courseId = Number(form.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Please select a course.");
      return;
    }

    const totalMarks = Number(
      form.totalMarks
    );

    if (
      !Number.isInteger(totalMarks) ||
      totalMarks <= 0
    ) {
      setError(
        "Total marks must be a positive integer."
      );
      return;
    }

    let durationMinutes:
      | number
      | null = null;

    if (form.durationMinutes.trim()) {
      durationMinutes = Number(
        form.durationMinutes
      );

      if (
        !Number.isInteger(
          durationMinutes
        ) ||
        durationMinutes <= 0
      ) {
        setError(
          "Duration must be a positive number of minutes."
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              courseId,
              title,
              type: backendType(
                form.type
              ),
              description:
                form.description.trim() ||
                null,
              instructions:
                form.instructions.trim() ||
                null,
              dueAt:
                form.dueAt
                  ? new Date(
                      form.dueAt
                    ).toISOString()
                  : null,
              totalMarks,
              durationMinutes,
              isActive:
                form.status ===
                "Published",
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to create assessment."
        );
      }

      setShowAddModal(false);
      setForm(EMPTY_FORM);
      await loadAssessments();
    } catch (err) {
      console.error(
        "Create assessment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create assessment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateAssessment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedAssessment) {
      return;
    }

    const title = form.title.trim();

    if (!title) {
      setError(
        "Assessment title is required."
      );
      return;
    }

    const totalMarks = Number(
      form.totalMarks
    );

    if (
      !Number.isInteger(totalMarks) ||
      totalMarks <= 0
    ) {
      setError(
        "Total marks must be a positive integer."
      );
      return;
    }

    let durationMinutes:
      | number
      | null = null;

    if (form.durationMinutes.trim()) {
      durationMinutes = Number(
        form.durationMinutes
      );

      if (
        !Number.isInteger(
          durationMinutes
        ) ||
        durationMinutes <= 0
      ) {
        setError(
          "Duration must be a positive number of minutes."
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments/${selectedAssessment.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title,
              type: backendType(
                form.type
              ),
              description:
                form.description.trim() ||
                null,
              instructions:
                form.instructions.trim() ||
                null,
              dueAt:
                form.dueAt
                  ? new Date(
                      form.dueAt
                    ).toISOString()
                  : null,
              totalMarks,
              durationMinutes,
              isActive:
                form.status ===
                "Published",
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to update assessment."
        );
      }

      setShowEditModal(false);
      setSelectedAssessment(null);
      setForm(EMPTY_FORM);
      await loadAssessments();
    } catch (err) {
      console.error(
        "Update assessment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update assessment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(
    assessment: Assessment
  ) {
    setOpenMenu(null);

    try {
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments/${assessment.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              isActive:
                !assessment.isActive,
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to change assessment status."
        );
      }

      await loadAssessments();
    } catch (err) {
      console.error(
        "Toggle assessment status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to change assessment status."
      );
    }
  }

  async function deleteAssessment(
    assessment: Assessment
  ) {
    setOpenMenu(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${assessment.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(assessment.id);
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments/${assessment.id}`,
          {
            method: "DELETE",
          }
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to delete assessment."
        );
      }

      await loadAssessments();
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

  async function loadAssessmentDetails(
    assessmentId: number
  ) {
    const response =
      await authenticatedFetch(
        `${API_URL}/admin/assessments/${assessmentId}`
      );

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(
        json?.message ||
          "Unable to load assessment details."
      );
    }

    setSelectedDetails(json.data);
    return json.data as AssessmentDetails;
  }

  async function openViewModal(
    assessment: Assessment
  ) {
    setOpenMenu(null);
    setSelectedAssessment(assessment);
    setSelectedDetails(null);
    setShowViewModal(true);
    setError("");

    try {
      await loadAssessmentDetails(
        assessment.id
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assessment details."
      );
    }
  }

  async function openQuestionsModal(
    assessment: Assessment
  ) {
    setOpenMenu(null);
    setSelectedAssessment(assessment);
    setSelectedDetails(null);
    setShowQuestionsModal(true);
    setShowQuestionForm(false);
    setEditingQuestionId(null);
    setQuestionForm(EMPTY_QUESTION);
    setError("");

    try {
      await loadAssessmentDetails(
        assessment.id
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load questions."
      );
    }
  }

  async function submitQuestion(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedAssessment) {
      return;
    }

    const question =
      questionForm.question.trim();
    const optionA =
      questionForm.optionA.trim();
    const optionB =
      questionForm.optionB.trim();
    const optionC =
      questionForm.optionC.trim();
    const optionD =
      questionForm.optionD.trim();
    const correctAnswer =
      questionForm.correctAnswer;
    const marks = Number(
      questionForm.marks
    );
    const sortOrder = Number(
      questionForm.sortOrder
    );

    if (!question) {
      setError("Question text is required.");
      return;
    }

    if (!optionA || !optionB || !optionC || !optionD) {
      setError(
        "All four answer options are required."
      );
      return;
    }

    if (
      !Number.isInteger(marks) ||
      marks <= 0
    ) {
      setError(
        "Question marks must be a positive integer."
      );
      return;
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      setError(
        "Sort order must be a non-negative integer."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing =
        editingQuestionId !== null;

      const url = isEditing
        ? `${API_URL}/admin/assessments/questions/${editingQuestionId}`
        : `${API_URL}/admin/assessments/${selectedAssessment.id}/questions`;

      const response =
        await authenticatedFetch(url, {
          method: isEditing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question,
            optionA,
            optionB,
            optionC,
            optionD,
            correctAnswer,
            marks,
            sortOrder,
          }),
        });

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to save question."
        );
      }

      setShowQuestionForm(false);
      setQuestionForm(EMPTY_QUESTION);
      setEditingQuestionId(null);

      await loadAssessmentDetails(
        selectedAssessment.id
      );
      await loadAssessments();
    } catch (err) {
      console.error(
        "Save assessment question error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save question."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditQuestion(
    question: Question
  ) {
    setEditingQuestionId(question.id);
    setQuestionForm({
      question: question.question,
      optionA: question.optionA ?? "",
      optionB: question.optionB ?? "",
      optionC: question.optionC ?? "",
      optionD: question.optionD ?? "",
      correctAnswer:
        question.correctAnswer ||
        "A",
      marks: String(question.marks),
      sortOrder: String(
        question.sortOrder
      ),
    });
    setShowQuestionForm(true);
    setError("");
  }

  async function deleteQuestion(
    question: Question
  ) {
    const confirmed = window.confirm(
      "Delete this question?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments/questions/${question.id}`,
          {
            method: "DELETE",
          }
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to delete question."
        );
      }

      if (selectedAssessment) {
        await loadAssessmentDetails(
          selectedAssessment.id
        );
      }

      await loadAssessments();
    } catch (err) {
      console.error(
        "Delete question error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete question."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openSubmissions(
    assessment: Assessment
  ) {
    setOpenMenu(null);
    setSelectedAssessment(assessment);
    setSubmissions([]);
    setShowSubmissionsModal(true);
    setError("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments/${assessment.id}/submissions`
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to load submissions."
        );
      }

      setSubmissions(
        json.data || []
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

  async function gradeSubmission(
    submissionId: number
  ) {
    if (!selectedAssessment) {
      return;
    }

    const score = Number(
      gradeScore
    );

    if (
      !Number.isInteger(score) ||
      score < 0 ||
      score > selectedAssessment.totalMarks
    ) {
      setError(
        `Score must be between 0 and ${selectedAssessment.totalMarks}.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/assessments/submissions/${submissionId}/grade`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
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

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to grade submission."
        );
      }

      setGradingId(null);
      setGradeScore("");
      setGradeFeedback("");

      await openSubmissions(
        selectedAssessment
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

  function startGrading(
    submission: Submission
  ) {
    setGradingId(submission.id);
    setGradeScore(
      submission.score === null
        ? ""
        : String(submission.score)
    );
    setGradeFeedback(
      submission.feedback ?? ""
    );
    setError("");
  }

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
              Create and manage real assignments, quizzes and student submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshPage}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                openCreateModal("Assignment")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173B67] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102d50]"
            >
              <FileText size={17} />
              Create Assignment
            </button>

            <button
              type="button"
              onClick={() =>
                openCreateModal("Quiz")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6D28D9]"
            >
              <HelpCircle size={17} />
              Create Quiz
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert
              size={18}
              className="mt-0.5 shrink-0"
            />
            <div>{error}</div>
          </div>
        )}

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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by title, ID or course..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as
                      | "All"
                      | AssessmentType
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Types</option>
                <option value="Assignment">
                  Assignments
                </option>
                <option value="Quiz">
                  Quizzes
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "All"
                      | AssessmentStatus
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Published">
                  Published
                </option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Assessment",
                    "Type",
                    "Course",
                    "Due Date",
                    "Questions",
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-20 text-center"
                    >
                      <div className="mx-auto flex items-center justify-center gap-2 text-sm text-slate-500">
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />
                        Loading assessments...
                      </div>
                    </td>
                  </tr>
                ) : filteredAssessments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-20 text-center"
                    >
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                        <ClipboardList size={27} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        No assessments found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Create an assignment or quiz to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map(
                    (assessment) => (
                      <tr
                        key={assessment.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="border-b border-slate-100 px-4 py-4">
                          <div className="font-semibold text-slate-800">
                            {assessment.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            ASM-{String(
                              assessment.id
                            ).padStart(4, "0")}
                          </div>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4">
                          <TypeBadge
                            type={assessment.type}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                          {assessment.course ||
                            "Unknown course"}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                          {formatDate(
                            assessment.dueAt
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-700">
                          {assessment.type ===
                          "Quiz"
                            ? assessment.questionCount
                            : "—"}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-700">
                          {assessment.submissions}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4">
                          <StatusBadge
                            status={assessment.status}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {assessment.type === "Quiz" && (
                              <ActionButton
                                title="Manage Questions"
                                ariaLabel="Manage Questions"
                                onClick={() =>
                                  openQuestionsModal(assessment)
                                }
                              >
                                <HelpCircle size={17} />
                              </ActionButton>
                            )}

                            <ActionButton
                              title="Assessment actions"
                              ariaLabel="Assessment actions"
                              onClick={(event) =>
                                openActionMenu(
                                  event,
                                  assessment.id
                                )
                              }
                            >
                              <MoreVertical size={17} />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {openMenu && (() => {
          const assessment = assessments.find(
            (item) => item.id === openMenu.assessmentId
          );

          if (!assessment) {
            return null;
          }

          return (
            <>
              <button
                type="button"
                aria-label="Close assessment actions"
                onClick={closeActionMenu}
                className="fixed inset-0 z-[998] cursor-default bg-transparent"
              />

              <div
                className="fixed z-[999] w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-black/5"
                style={{
                  top: openMenu.top,
                  left: openMenu.left,
                }}
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {assessment.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {assessment.type}
                    {assessment.course
                      ? ` · ${assessment.course}`
                      : ""}
                  </p>
                </div>

                <div className="mt-1 space-y-0.5">
                  <MenuItem
                    icon={<Eye size={17} />}
                    label="View Assessment"
                    onClick={() =>
                      openViewModal(assessment)
                    }
                  />

                  <MenuItem
                    icon={<Pencil size={17} />}
                    label="Edit Assessment"
                    onClick={() =>
                      openEditModal(assessment)
                    }
                  />

                  {assessment.type === "Quiz" && (
                    <MenuItem
                      icon={<HelpCircle size={17} />}
                      label="Manage Questions"
                      onClick={() =>
                        openQuestionsModal(assessment)
                      }
                    />
                  )}

                  <MenuItem
                    icon={<Users size={17} />}
                    label="View Submissions"
                    onClick={() =>
                      openSubmissions(assessment)
                    }
                  />

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
                    onClick={() =>
                      togglePublish(assessment)
                    }
                  />

                  <div className="my-1 border-t border-slate-100" />

                  <MenuItem
                    icon={<Trash2 size={17} />}
                    label={
                      deletingId === assessment.id
                        ? "Deleting..."
                        : "Delete Assessment"
                    }
                    danger
                    onClick={() =>
                      deleteAssessment(assessment)
                    }
                  />
                </div>
              </div>
            </>
          );
        })()}

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Backend connected:</strong>{" "}
          assignments, quizzes, questions, submissions and grading are stored through the SKCE API and PostgreSQL. The current first version is course-based; batch and trainer assignments are not stored in the Assessment database model yet.
        </div>
      </div>

      {showAddModal && (
        <AssessmentFormModal
          title={
            form.type === "Quiz"
              ? "Create Quiz"
              : "Create Assignment"
          }
          subtitle={
            form.type === "Quiz"
              ? "Create a quiz for students in the selected course."
              : "Create an assignment for students in the selected course."
          }
          form={form}
          setForm={setForm}
          courses={courses}
          onClose={closeAll}
          onSubmit={createAssessment}
          submitLabel={
            form.type === "Quiz"
              ? "Create Quiz"
              : "Create Assignment"
          }
          saving={saving}
        />
      )}

      {showEditModal && (
        <AssessmentFormModal
          title={
            form.type === "Quiz"
              ? "Edit Quiz"
              : "Edit Assignment"
          }
          subtitle={
            form.type === "Quiz"
              ? "Update quiz details and keep its type fixed."
              : "Update assignment details and keep its type fixed."
          }
          form={form}
          setForm={setForm}
          courses={courses}
          onClose={closeAll}
          onSubmit={updateAssessment}
          submitLabel="Save Changes"
          isEdit
          saving={saving}
        />
      )}

      {showViewModal && selectedAssessment && (
        <Modal
          title="Assessment Details"
          subtitle="Details loaded from the backend."
          onClose={closeAll}
          wide
        >
          {!selectedDetails ? (
            <LoadingBlock text="Loading assessment..." />
          ) : (
            <AssessmentDetailsPanel
              details={selectedDetails}
              onManageQuestions={
                selectedAssessment.type ===
                "Quiz"
                  ? () => {
                      setShowViewModal(false);
                      setShowQuestionsModal(true);
                    }
                  : undefined
              }
              onViewSubmissions={() => {
                setShowViewModal(false);
                openSubmissions(
                  selectedAssessment
                );
              }}
            />
          )}
        </Modal>
      )}

      {showQuestionsModal && selectedAssessment && (
        <Modal
          title="Manage Quiz Questions"
          subtitle={`Questions for ${selectedAssessment.title}.`}
          onClose={closeAll}
          wide
        >
          {selectedDetails ? (
            <QuestionsPanel
              assessment={selectedDetails}
              showQuestionForm={showQuestionForm}
              setShowQuestionForm={
                setShowQuestionForm
              }
              questionForm={questionForm}
              setQuestionForm={
                setQuestionForm
              }
              editingQuestionId={
                editingQuestionId
              }
              saving={saving}
              onSubmit={submitQuestion}
              onEdit={startEditQuestion}
              onDelete={deleteQuestion}
              onCancelQuestionForm={() => {
                setShowQuestionForm(false);
                setEditingQuestionId(null);
                setQuestionForm(
                  EMPTY_QUESTION
                );
              }}
            />
          ) : (
            <LoadingBlock text="Loading questions..." />
          )}
        </Modal>
      )}

      {showSubmissionsModal && selectedAssessment && (
        <Modal
          title="View Submissions"
          subtitle={`Student submissions for ${selectedAssessment.title}.`}
          onClose={closeAll}
          wide
        >
          <SubmissionsPanel
            assessment={selectedAssessment}
            submissions={submissions}
            gradingId={gradingId}
            gradeScore={gradeScore}
            gradeFeedback={gradeFeedback}
            setGradeScore={setGradeScore}
            setGradeFeedback={
              setGradeFeedback
            }
            saving={saving}
            onStartGrading={startGrading}
            onGrade={gradeSubmission}
            onDownloadFile={handleDownloadSubmissionFile}
            onCancelGrading={() => {
              setGradingId(null);
              setGradeScore("");
              setGradeFeedback("");
            }}
          />
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
  courses,
  onClose,
  onSubmit,
  submitLabel,
  isEdit = false,
  saving,
}: {
  title: string;
  subtitle: string;
  form: AssessmentForm;
  setForm: Dispatch<
    SetStateAction<AssessmentForm>
  >;
  courses: Course[];
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
  submitLabel: string;
  isEdit?: boolean;
  saving: boolean;
}) {
  const update = (
    field: keyof AssessmentForm,
    value: string
  ) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      wide
    >
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Title"
              required
              value={form.title}
              onChange={(value) =>
                update("title", value)
              }
              placeholder="Example: Python Basics Assignment"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Type
            </label>
            <div className={`flex min-h-[46px] items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${
              form.type === "Quiz"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}>
              {form.type === "Quiz" ? (
                <HelpCircle size={17} />
              ) : (
                <FileText size={17} />
              )}
              {form.type}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Type is selected from the separate create action.
            </p>
          </div>

          <SelectField
            label="Course"
            required
            value={form.courseId}
            onChange={(value) =>
              update("courseId", value)
            }
            options={courses.map((course) => ({
              value: String(course.id),
              label: course.title,
            }))}
            emptyLabel="No courses available"
          />

          <Field
            label="Due Date"
            type="datetime-local"
            value={form.dueAt}
            onChange={(value) =>
              update("dueAt", value)
            }
          />

          <Field
            label="Total Marks"
            type="number"
            min="1"
            value={form.totalMarks}
            onChange={(value) =>
              update("totalMarks", value)
            }
            placeholder="100"
          />

          <Field
            label="Duration (minutes)"
            type="number"
            min="1"
            value={form.durationMinutes}
            onChange={(value) =>
              update(
                "durationMinutes",
                value
              )
            }
            placeholder="Optional"
          />

          <SelectField
            label="Status"
            value={form.status}
            onChange={(value) =>
              update("status", value)
            }
            options={["Draft", "Published"]}
          />

          <div className="sm:col-span-2">
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(value) =>
                update("description", value)
              }
              placeholder="Describe what students need to complete..."
              rows={4}
            />
          </div>

          <div className="sm:col-span-2">
            <TextAreaField
              label="Instructions"
              value={form.instructions}
              onChange={(value) =>
                update("instructions", value)
              }
              placeholder="Enter instructions shown to students..."
              rows={5}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw
                size={17}
                className="animate-spin"
              />
            ) : isEdit ? (
              <Save size={17} />
            ) : (
              <Plus size={17} />
            )}
            {saving
              ? "Saving..."
              : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssessmentDetailsPanel({
  details,
  onManageQuestions,
  onViewSubmissions,
}: {
  details: AssessmentDetails;
  onManageQuestions?: () => void;
  onViewSubmissions: () => void;
}) {
  return (
    <div>
      <div className="mb-5 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            {details.type ===
            "ASSIGNMENT" ? (
              <FileText size={23} />
            ) : (
              <HelpCircle size={23} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              {details.title}
            </h3>
            <p className="text-xs text-slate-500">
              ASM-
              {String(details.id).padStart(
                4,
                "0"
              )}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge
              status={displayStatus(
                details.isActive
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Detail
          label="Type"
          value={displayType(details.type)}
        />
        <Detail
          label="Course"
          value={details.course.title}
        />
        <Detail
          label="Due Date"
          value={formatDateTime(
            details.dueAt
          )}
        />
        <Detail
          label="Total Marks"
          value={String(details.totalMarks)}
        />
        <Detail
          label="Duration"
          value={
            details.durationMinutes
              ? `${details.durationMinutes} minutes`
              : "Not specified"
          }
        />
        <Detail
          label="Questions"
          value={String(
            details.questions.length
          )}
        />
        <Detail
          label="Submissions"
          value={String(
            details.submissionCount
          )}
        />
        <Detail
          label="Created"
          value={formatDateTime(
            details.createdAt
          )}
        />
      </div>

      {details.description && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400">
            Description
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-700">
            {details.description}
          </p>
        </div>
      )}

      {details.instructions && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400">
            Instructions
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {details.instructions}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        {onManageQuestions && (
          <button
            type="button"
            onClick={onManageQuestions}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <HelpCircle size={17} />
            Manage Questions
          </button>
        )}

        <button
          type="button"
          onClick={onViewSubmissions}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Users size={17} />
          View Submissions
        </button>
      </div>
    </div>
  );
}

function QuestionsPanel({
  assessment,
  showQuestionForm,
  setShowQuestionForm,
  questionForm,
  setQuestionForm,
  editingQuestionId,
  saving,
  onSubmit,
  onEdit,
  onDelete,
  onCancelQuestionForm,
}: {
  assessment: AssessmentDetails;
  showQuestionForm: boolean;
  setShowQuestionForm: (value: boolean) => void;
  questionForm: QuestionForm;
  setQuestionForm: Dispatch<
    SetStateAction<QuestionForm>
  >;
  editingQuestionId: number | null;
  saving: boolean;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void | Promise<void>;
  onCancelQuestionForm: () => void;
}) {
  const update = (
    field: keyof QuestionForm,
    value: string
  ) =>
    setQuestionForm((current) => ({
      ...current,
      [field]: value,
    }));

  const questions = [...assessment.questions].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {questions.length} question
            {questions.length === 1
              ? ""
              : "s"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Correct answers are visible only to admin/trainer users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setQuestionForm(
              EMPTY_QUESTION
            );
            setShowQuestionForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus size={17} />
          Add Question
        </button>
      </div>

      {showQuestionForm && (
        <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">
                {editingQuestionId
                  ? "Edit Question"
                  : "Add Question"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Single-answer multiple-choice question.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelQuestionForm}
              className="rounded-lg p-2 text-slate-500 hover:bg-white"
            >
              <X size={17} />
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Question"
                  required
                  value={questionForm.question}
                  onChange={(value) =>
                    update("question", value)
                  }
                  placeholder="Example: Which keyword defines a function in Python?"
                  rows={3}
                />
              </div>

              <Field
                label="Option A"
                required
                value={questionForm.optionA}
                onChange={(value) =>
                  update("optionA", value)
                }
              />

              <Field
                label="Option B"
                required
                value={questionForm.optionB}
                onChange={(value) =>
                  update("optionB", value)
                }
              />

              <Field
                label="Option C"
                required
                value={questionForm.optionC}
                onChange={(value) =>
                  update("optionC", value)
                }
              />

              <Field
                label="Option D"
                required
                value={questionForm.optionD}
                onChange={(value) =>
                  update("optionD", value)
                }
              />

              <SelectField
                label="Correct Answer"
                required
                value={questionForm.correctAnswer}
                onChange={(value) =>
                  update(
                    "correctAnswer",
                    value
                  )
                }
                options={[
                  "A",
                  "B",
                  "C",
                  "D",
                ]}
              />

              <Field
                label="Marks"
                type="number"
                min="1"
                required
                value={questionForm.marks}
                onChange={(value) =>
                  update("marks", value)
                }
              />

              <Field
                label="Sort Order"
                type="number"
                min="0"
                required
                value={questionForm.sortOrder}
                onChange={(value) =>
                  update("sortOrder", value)
                }
              />
            </div>

            <div className="mt-5 flex justify-end gap-3 border-t border-orange-200 pt-4">
              <button
                type="button"
                onClick={onCancelQuestionForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}
                {saving
                  ? "Saving..."
                  : editingQuestionId
                  ? "Save Question"
                  : "Add Question"}
              </button>
            </div>
          </form>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <HelpCircle
            size={28}
            className="mx-auto text-slate-400"
          />
          <p className="mt-3 font-semibold text-slate-700">
            No questions yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Add the questions students should answer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-semibold leading-6 text-slate-800">
                      {question.question}
                    </p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {question.marks} mark
                      {question.marks === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <OptionBox
                      label="A"
                      value={question.optionA}
                      correct={
                        question.correctAnswer ===
                        "A"
                      }
                    />
                    <OptionBox
                      label="B"
                      value={question.optionB}
                      correct={
                        question.correctAnswer ===
                        "B"
                      }
                    />
                    <OptionBox
                      label="C"
                      value={question.optionC}
                      correct={
                        question.correctAnswer ===
                        "C"
                      }
                    />
                    <OptionBox
                      label="D"
                      value={question.optionD}
                      correct={
                        question.correctAnswer ===
                        "D"
                      }
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(question)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onDelete(question)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionsPanel({
  assessment,
  submissions,
  gradingId,
  gradeScore,
  gradeFeedback,
  setGradeScore,
  setGradeFeedback,
  saving,
  onStartGrading,
  onGrade,
  onDownloadFile,
  onCancelGrading,
}: {
  assessment: Assessment;
  submissions: Submission[];
  gradingId: number | null;
  gradeScore: string;
  gradeFeedback: string;
  setGradeScore: (value: string) => void;
  setGradeFeedback: (value: string) => void;
  saving: boolean;
  onStartGrading: (submission: Submission) => void;
  onGrade: (submissionId: number) => void | Promise<void>;
  onDownloadFile: (submission: Submission) => void | Promise<void>;
  onCancelGrading: () => void;
}) {
  const submitted = submissions.filter(
    (submission) =>
      submission.status === "SUBMITTED"
  ).length;

  const graded = submissions.filter(
    (submission) =>
      submission.status === "GRADED"
  ).length;

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          value={String(submissions.length)}
          label="Total submissions"
        />
        <MiniStat
          value={String(submitted)}
          label="Submitted"
        />
        <MiniStat
          value={String(graded)}
          label="Graded"
        />
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <Users
            size={28}
            className="mx-auto text-slate-400"
          />
          <p className="mt-3 font-semibold text-slate-700">
            No submissions yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Student submissions will appear here when they are submitted.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-800">
                      {submission.studentName ||
                        "Student"}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Attempt {submission.attemptNumber}
                    </span>
                    <SubmissionBadge
                      status={submission.status}
                    />
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {submission.studentId ||
                      "No student ID"}
                    {submission.studentEmail
                      ? ` • ${submission.studentEmail}`
                      : ""}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Submitted: {formatDateTime(
                      submission.submittedAt
                    )}
                  </p>

                  {submission.submissionComment && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <span className="font-semibold">
                        Comment:
                      </span>{" "}
                      {submission.submissionComment}
                    </div>
                  )}

                  {submission.submissionFileUrl && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onDownloadFile(submission)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Download size={14} />
                        {submission.submissionFileName ||
                          "Download submission file"}
                      </button>
                    </div>
                  )}

                  {assessment.type ===
                    "Quiz" &&
                    submission.answers && (
                      <details className="mt-3 rounded-lg border border-slate-200 p-3">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                          View submitted answers
                        </summary>
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-slate-500">
                          {submission.answers}
                        </pre>
                      </details>
                    )}

                  {submission.feedback && (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <span className="font-semibold">
                        Feedback:
                      </span>{" "}
                      {submission.feedback}
                    </div>
                  )}
                </div>

                <div className="shrink-0 rounded-xl bg-slate-50 p-4 lg:min-w-[210px]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#173B67]">
                    {submission.score ===
                    null
                      ? "Not graded"
                      : `${submission.score}/${assessment.totalMarks}`}
                  </p>

                  {gradingId ===
                  submission.id ? (
                    <div className="mt-4 space-y-3">
                      <Field
                        label="Score"
                        type="number"
                        min="0"
                        max={String(
                          assessment.totalMarks
                        )}
                        value={gradeScore}
                        onChange={setGradeScore}
                      />
                      <TextAreaField
                        label="Feedback"
                        value={gradeFeedback}
                        onChange={
                          setGradeFeedback
                        }
                        placeholder="Optional feedback"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onCancelGrading()
                          }
                          disabled={saving}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onGrade(
                              submission.id
                            )
                          }
                          disabled={saving}
                          className="flex-1 rounded-lg bg-[#F97316] px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                          {saving
                            ? "Saving..."
                            : "Save Grade"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onStartGrading(
                          submission
                        )
                      }
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#173B67] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#102d50]"
                    >
                      <CheckCircle2
                        size={14}
                      />
                      {submission.status ===
                      "GRADED"
                        ? "Update Grade"
                        : "Grade Submission"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
          wide
            ? "max-w-5xl"
            : "max-w-2xl"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">
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
            className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function LoadingBlock({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-12 text-sm text-slate-500">
      <RefreshCw
        size={17}
        className="animate-spin"
      />
      {text}
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
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}
      </label>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}
      </label>
      <textarea
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options:
    | string[]
    | { value: string; label: string }[];
  required?: boolean;
  emptyLabel?: string;
}) {
  const normalizedOptions =
    options.map((option) =>
      typeof option === "string"
        ? {
            value: option,
            label: option,
          }
        : option
    );

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}
      </label>
      <select
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        <option value="">
          {emptyLabel ||
            `Select ${label.toLowerCase()}`}
        </option>
        {normalizedOptions.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
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
    <div className="rounded-xl border border-slate-200 p-4 text-center">
      <div className="text-2xl font-bold text-[#173B67]">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {label}
      </div>
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
        <div className="text-2xl font-bold text-[#173B67]">
          {value}
        </div>
        <div className="text-sm text-slate-500">
          {title}
        </div>
      </div>
    </div>
  );
}

function TypeBadge({
  type,
}: {
  type: AssessmentType;
}) {
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

function StatusBadge({
  status,
}: {
  status: AssessmentStatus;
}) {
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

function SubmissionBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  const label =
    status === "GRADED"
      ? "Graded"
      : status === "SUBMITTED"
      ? "Submitted"
      : "In progress";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "GRADED"
          ? "bg-emerald-50 text-emerald-700"
          : status === "SUBMITTED"
          ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {label}
    </span>
  );
}

function OptionBox({
  label,
  value,
  correct,
}: {
  label: string;
  value: string | null;
  correct: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        correct
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="font-bold text-slate-500">
          {label}.
        </span>
        <span className="text-sm text-slate-700">
          {value || "—"}
        </span>
        {correct && (
          <CheckCircle2
            size={15}
            className="ml-auto shrink-0 text-emerald-600"
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  title,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  title: string;
  ariaLabel?: string;
  onClick: (
    event: MouseEvent<HTMLButtonElement>
  ) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title}
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
