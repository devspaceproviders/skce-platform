"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  ListFilter,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  CountUp,
  Modal,
  SkStyles,
  reveal,
  useToasts,
} from "@/components/student/skce-ui";
import {
  AdminPageHeader,
  ADMIN_BTN_GHOST,
} from "@/components/dashboard/admin/AdminPageHeader";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* ==================================================================
 * BUSINESS RULES (attempts, status, filters, sorting, answer review)
 * The BACKEND must enforce the same rules; this file only displays them.
 * ================================================================== */
/*
 * Rules for the student Assignments & Quizzes module (kept in this file).
 *
 * IMPORTANT: these mirror the rules that the BACKEND must enforce.
 * The frontend only uses them to display the right state and to avoid
 * offering an action the server would reject. The server is the authority.
 */

const MAX_QUIZ_ATTEMPTS = 3;

type BackendAssessmentType = "ASSIGNMENT" | "QUIZ";
type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

type DisplayStatus =
  | "Not started"
  | "In progress"
  | "Submitted"
  | "Graded"
  | "Overdue";

type SubmissionLike = {
  attemptNumber: number;
  score: number | null;
  status: SubmissionStatus | string;
} | null;

/* ------------------------------------------------------------------
 * Attempts
 * ------------------------------------------------------------------ */

type AttemptPhase = "none" | "retry" | "perfect" | "final";

type AttemptState = {
  max: number;
  used: number;
  remaining: number;
  perfect: boolean;
  closed: boolean;
  canAttempt: boolean;
  phase: AttemptPhase;
};

/*
 * latestScore === maximumScore  -> closed (no more attempts)
 * attempts >= 3                 -> closed
 * otherwise                     -> attempt allowed
 */
function getAttemptState(input: {
  type: BackendAssessmentType;
  totalMarks: number;
  attemptsUsed?: number | null;
  latest: SubmissionLike;
}): AttemptState {
  if (input.type !== "QUIZ") {
    return {
      max: 0,
      used: input.latest?.attemptNumber ?? 0,
      remaining: 0,
      perfect: false,
      closed: false,
      canAttempt: true,
      phase: "none",
    };
  }

  const max = MAX_QUIZ_ATTEMPTS;
  const rawUsed = Math.max(
    Number(input.attemptsUsed ?? 0) || 0,
    Number(input.latest?.attemptNumber ?? 0) || 0
  );
  const used = Math.min(rawUsed, max);

  const score = input.latest?.score;
  const perfect =
    typeof score === "number" &&
    input.totalMarks > 0 &&
    score >= input.totalMarks;

  const closed = perfect || rawUsed >= max;
  const remaining = closed ? 0 : Math.max(max - used, 0);

  let phase: AttemptPhase = "none";

  if (used > 0) {
    phase = perfect ? "perfect" : closed ? "final" : "retry";
  }

  return {
    max,
    used,
    remaining,
    perfect,
    closed,
    canAttempt: !closed,
    phase,
  };
}

function attemptHeadline(state: AttemptState): {
  title: string;
  line: string;
} {
  if (state.phase === "perfect") {
    return {
      title: "Quiz completed",
      line: "No further attempts required",
    };
  }

  if (state.phase === "final") {
    return {
      title: "Final attempt submitted",
      line: "No attempts remaining",
    };
  }

  return {
    title: "Attempt submitted",
    line: `${state.remaining} attempt${state.remaining === 1 ? "" : "s"} remaining`,
  };
}

/* ------------------------------------------------------------------
 * Status / due date
 * ------------------------------------------------------------------ */

function baseStatus(latest: SubmissionLike): DisplayStatus {
  if (!latest) {
    return "Not started";
  }

  if (latest.status === "GRADED") {
    return "Graded";
  }

  if (latest.status === "SUBMITTED") {
    return "Submitted";
  }

  return "In progress";
}

function isPastDue(dueAt: string | null, now = Date.now()): boolean {
  if (!dueAt) {
    return false;
  }

  const time = new Date(dueAt).getTime();

  return !Number.isNaN(time) && time < now;
}

/* Overdue only applies to work that has not been submitted yet. */
function effectiveStatus(
  latest: SubmissionLike,
  dueAt: string | null,
  now = Date.now()
): DisplayStatus {
  const status = baseStatus(latest);

  if ((status === "Not started" || status === "In progress") && isPastDue(dueAt, now)) {
    return "Overdue";
  }

  return status;
}

type DueFilter = "all" | "none" | "today" | "week" | "overdue";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function matchesDue(
  dueAt: string | null,
  status: DisplayStatus,
  filter: DueFilter,
  now = Date.now()
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "none") {
    return !dueAt;
  }

  if (filter === "overdue") {
    return status === "Overdue";
  }

  if (!dueAt) {
    return false;
  }

  const due = new Date(dueAt);

  if (Number.isNaN(due.getTime())) {
    return false;
  }

  if (filter === "today") {
    return sameDay(due, new Date(now));
  }

  /* week: from the start of today until 7 days ahead */
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return due.getTime() >= start.getTime() && due.getTime() <= end.getTime();
}

/* ------------------------------------------------------------------
 * Sorting
 * ------------------------------------------------------------------ */

type SortKey = "newest" | "oldest" | "due" | "name" | "status";

const STATUS_ORDER: Record<DisplayStatus, number> = {
  Overdue: 0,
  "Not started": 1,
  "In progress": 2,
  Submitted: 3,
  Graded: 4,
};

function compareBy<
  T extends { title: string; dueAt: string | null; createdAt: string },
>(
  sort: SortKey,
  statusOf: (item: T) => DisplayStatus
): (a: T, b: T) => number {
  const time = (value: string | null) => {
    if (!value) {
      return Number.POSITIVE_INFINITY;
    }

    const parsed = new Date(value).getTime();

    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };

  return (a, b) => {
    if (sort === "oldest") {
      return time(a.createdAt) - time(b.createdAt);
    }

    if (sort === "due") {
      const diff = time(a.dueAt) - time(b.dueAt);

      return diff === 0 || Number.isNaN(diff)
        ? a.title.localeCompare(b.title)
        : diff;
    }

    if (sort === "name") {
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }

    if (sort === "status") {
      const diff = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)];

      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    }

    /* newest (default) */
    return time(b.createdAt) - time(a.createdAt);
  };
}

/* ------------------------------------------------------------------
 * Answer review
 *
 * correct selected  -> ONLY that option is "correct" (green)
 * wrong selected    -> selected "wrong" (red) + real answer "correct" (green)
 * everything else   -> "neutral"
 * No correct key available (not revealed yet) -> selected stays "selected"
 * ------------------------------------------------------------------ */

type OptionState = "correct" | "wrong" | "selected" | "neutral";

function reviewOptionState(
  optionKey: string,
  selectedKey: string | undefined,
  correctKey: string | null | undefined
): OptionState {
  const option = optionKey.toUpperCase();
  const selected = selectedKey?.toUpperCase();
  const correct = correctKey?.toUpperCase();

  if (correct) {
    if (option === correct) {
      return "correct";
    }

    if (selected === option) {
      return "wrong";
    }

    return "neutral";
  }

  return selected === option ? "selected" : "neutral";
}

/* Keep technical backend text away from students. */
function safeMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : "";

  if (
    !raw ||
    raw.length > 140 ||
    /prisma|sql|stack|econn|enotfound|fetch failed|<|undefined|null|exception|at\s+\S+\.\S+/i.test(
      raw
    )
  ) {
    return fallback;
  }

  return raw;
}

/* ------------------------------------------------------------------
 * Types (API shapes unchanged)
 * ------------------------------------------------------------------ */

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
  /* Optional: full attempt history, when the backend provides it. */
  attempts?: StudentSubmission[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type TileKey = "all" | "pending" | "submitted" | "quizzes" | "assignments";

const STATUS_TONE: Record<DisplayStatus, string> = {
  "Not started": "tone-orange",
  "In progress": "tone-blue",
  Submitted: "tone-green",
  Graded: "at-st-graded",
  Overdue: "tone-red",
};

const STATUS_ICON: Record<DisplayStatus, ReactNode> = {
  "Not started": <CircleAlert size={13} />,
  "In progress": <Clock3 size={13} />,
  Submitted: <CheckCircle2 size={13} />,
  Graded: <Award size={13} />,
  Overdue: <AlertCircle size={13} />,
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
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

function attemptStateOf(item: AssessmentListItem): AttemptState {
  return getAttemptState({
    type: item.type,
    totalMarks: item.totalMarks,
    attemptsUsed: item.attemptsUsed,
    latest: item.latestSubmission,
  });
}

/* One place decides the label of the main action (table row + hero). */
function getAction(
  item: AssessmentListItem,
  status: DisplayStatus
): { label: string; viewOnly: boolean } {
  const isQuiz = item.type === "QUIZ";
  const attempt = attemptStateOf(item);

  if (status === "Graded" || (isQuiz && attempt.closed)) {
    return { label: "View Result", viewOnly: true };
  }

  if (status === "Submitted") {
    return { label: "View Submission", viewOnly: true };
  }

  if (status === "In progress") {
    return { label: "Continue", viewOnly: false };
  }

  return { label: "Open", viewOnly: false };
}

/* ------------------------------------------------------------------
 * Small shared components
 * ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`sk-badge at-status ${STATUS_TONE[status]}`}>
      {STATUS_ICON[status]}
      {status}
    </span>
  );
}

type FilterOption = { value: string; label: string };

function FilterSelect({
  label,
  icon: Icon = ListFilter,
  value,
  options,
  onChange,
}: {
  label: string;
  icon?: typeof ListFilter;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);

    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const openList = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openList();
      } else {
        setActive((index) => Math.min(index + 1, options.length - 1));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openList();
      } else {
        setActive((index) => Math.max(index - 1, 0));
      }
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(options[active].value);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab" && open) {
      setOpen(false);
    }
  };

  const isFiltered = options[0]?.value !== value;

  return (
    <div className="at-fs" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`at-fs-btn${open ? " is-open" : ""}${isFiltered ? " is-set" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${selected?.label ?? ""}`}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <Icon size={15} className="at-fs-icon" />
        <span className="at-fs-text">
          <small>{label}</small>
          <b>{selected?.label}</b>
        </span>
        <ChevronDown size={15} className="at-fs-caret" />
      </button>

      {open ? (
        <ul className="at-fs-pop" role="listbox" id={listId} aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`${index === active ? "is-active" : ""}${
                option.value === value ? " is-selected" : ""
              }`}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value ? <Check size={14} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SummaryTile({
  index,
  icon: Icon,
  label,
  value,
  helper,
  tone,
  active,
  onClick,
}: {
  index: number;
  icon: typeof ClipboardList;
  label: string;
  value: number;
  helper: string;
  tone: "blue" | "orange" | "green" | "navy";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sk-tile at-tile sk-reveal${active ? " is-active" : ""}`}
      style={reveal(index)}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className={`sk-icon sk-icon-sm sk-tone-${tone}`}>
        <Icon size={18} />
      </div>
      <div className="sk-min0 sk-grow">
        <span className="sk-tile-label">{label}</span>
        <strong className="sk-tile-value">
          <CountUp value={value} />
        </strong>
        <span className="sk-tile-helper">{helper}</span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------ */

export default function AssignmentsPage() {
  const router = useRouter();
  const toasts = useToasts();

  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentListItem | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [tile, setTile] = useState<TileKey>("all");

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

      const json: ApiResponse<AssessmentListItem[]> = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Unable to load assignments.");
      }

      setAssessments(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Load student assessments error:", err);

      /* Never show raw backend/technical text to a student. */
      setError("Unable to load assignments and quizzes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAssessments();
  }, []);

  /* -------- derived data -------- */

  const statusById = useMemo(() => {
    const now = Date.now();
    const map = new Map<number, DisplayStatus>();

    for (const item of assessments) {
      map.set(item.id, effectiveStatus(item.latestSubmission, item.dueAt, now));
    }

    return map;
  }, [assessments]);

  const counts = useMemo(() => {
    let quizzes = 0;
    let assignments = 0;
    let submitted = 0;

    for (const item of assessments) {
      if (item.type === "QUIZ") quizzes += 1;
      else assignments += 1;

      const status = effectiveStatus(item.latestSubmission, null);

      if (status === "Submitted" || status === "Graded") {
        submitted += 1;
      }
    }

    return {
      total: assessments.length,
      quizzes,
      assignments,
      submitted,
      pending: assessments.length - submitted,
    };
  }, [assessments]);

  /* Most urgent pending item: overdue first, then the nearest due date. */
  const nextUp = useMemo(() => {
    const timeOf = (value: string | null) => {
      if (!value) {
        return Number.POSITIVE_INFINITY;
      }

      const parsed = new Date(value).getTime();

      return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
    };

    const pending = assessments.filter((item) => {
      const status = statusById.get(item.id);

      return status !== "Submitted" && status !== "Graded";
    });

    if (pending.length === 0) {
      return null;
    }

    const rank = (item: AssessmentListItem) =>
      statusById.get(item.id) === "Overdue" ? 0 : 1;

    return (
      [...pending].sort((a, b) => {
        const byRank = rank(a) - rank(b);

        if (byRank !== 0) {
          return byRank;
        }

        const byDue = timeOf(a.dueAt) - timeOf(b.dueAt);

        return Number.isNaN(byDue) || byDue === 0
          ? a.title.localeCompare(b.title)
          : byDue;
      })[0] ?? null
    );
  }, [assessments, statusById]);

  const hovered = hoverId !== null ? assessments.find((item) => item.id === hoverId) ?? null : null;
  const featured = hovered ?? nextUp;
  const completionPercent =
    counts.total > 0 ? Math.round((counts.submitted / counts.total) * 100) : 0;

  const courseOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<string, string>();

    for (const item of assessments) {
      seen.set(String(item.courseId), item.courseTitle);
    }

    return [
      { value: "all", label: "All courses" },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [assessments]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    return assessments
      .filter((item) => {
        const status = statusById.get(item.id) ?? "Not started";
        const submitted = status === "Submitted" || status === "Graded";

        if (
          query &&
          !item.title.toLowerCase().includes(query) &&
          !item.courseTitle.toLowerCase().includes(query)
        ) {
          return false;
        }

        if (typeFilter === "quiz" && item.type !== "QUIZ") return false;
        if (typeFilter === "assignment" && item.type !== "ASSIGNMENT") return false;
        if (courseFilter !== "all" && String(item.courseId) !== courseFilter) return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (!matchesDue(item.dueAt, status, dueFilter, now)) return false;

        if (tile === "pending" && submitted) return false;
        if (tile === "submitted" && !submitted) return false;
        if (tile === "quizzes" && item.type !== "QUIZ") return false;
        if (tile === "assignments" && item.type !== "ASSIGNMENT") return false;

        return true;
      })
      .sort(
        compareBy<AssessmentListItem>(
          sortBy,
          (item) => statusById.get(item.id) ?? "Not started"
        )
      );
  }, [
    assessments,
    statusById,
    search,
    typeFilter,
    courseFilter,
    statusFilter,
    dueFilter,
    sortBy,
    tile,
  ]);

  const hasFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    courseFilter !== "all" ||
    statusFilter !== "all" ||
    dueFilter !== "all" ||
    tile !== "all";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCourseFilter("all");
    setStatusFilter("all");
    setDueFilter("all");
    setTile("all");
  };

  const toggleTile = (key: TileKey) =>
    setTile((current) => (current === key ? "all" : key));

  const handleSubmitted = async () => {
    await loadAssessments(true);
  };

  /* -------- render -------- */

  return (
    <>
      <main className="sk-page">
        <div className="sk-container">
          <AdminPageHeader
            className="mb-6"
            label="Student learning"
            title="Assignments & Quizzes"
            subtitle="Track your assigned work, quiz attempts, submissions and results in one place."
            icon={ClipboardList}
            actions={
              <button
                type="button"
                onClick={() => void loadAssessments(true)}
                disabled={refreshing}
                className={ADMIN_BTN_GHOST}
              >
                <RefreshCw size={15} className={refreshing ? "sk-spin" : "sk-refresh-icon"} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            }
          />

          {/* Summary */}
          <section className="at-tiles" aria-label="Summary">
            <SummaryTile
              index={1}
              icon={ClipboardList}
              label="Total"
              value={counts.total}
              helper="All items"
              tone="blue"
              active={false}
              onClick={resetFilters}
            />
            <SummaryTile
              index={2}
              icon={CircleAlert}
              label="Pending"
              value={counts.pending}
              helper="Still to complete"
              tone="orange"
              active={tile === "pending"}
              onClick={() => toggleTile("pending")}
            />
            <SummaryTile
              index={3}
              icon={CheckCircle2}
              label="Submitted"
              value={counts.submitted}
              helper="Submitted or graded"
              tone="green"
              active={tile === "submitted"}
              onClick={() => toggleTile("submitted")}
            />
            <SummaryTile
              index={4}
              icon={HelpCircle}
              label="Quizzes"
              value={counts.quizzes}
              helper="MCQ assessments"
              tone="navy"
              active={tile === "quizzes"}
              onClick={() => toggleTile("quizzes")}
            />
            <SummaryTile
              index={5}
              icon={FileText}
              label="Assignments"
              value={counts.assignments}
              helper="File submissions"
              tone="blue"
              active={tile === "assignments"}
              onClick={() => toggleTile("assignments")}
            />
          </section>

          {/* Brand hero: next up / hovered item (same idea as My Courses) */}
          {loading ? (
            <div className="sk-skel at-hero-skel" aria-hidden="true" />
          ) : !error && assessments.length > 0 ? (
            <section className="at-hero sk-reveal" style={reveal(6)} aria-live="polite">
              <div className="at-hero-glow" aria-hidden="true" />

              {featured ? (
                (() => {
                  const featuredStatus = statusById.get(featured.id) ?? "Not started";
                  const action = getAction(featured, featuredStatus);
                  const isQuiz = featured.type === "QUIZ";

                  return (
                    <div className="at-hero-inner" key={featured.id}>
                      <div className="at-hero-main at-swap">
                        <div className="at-hero-icon">
                          {isQuiz ? <HelpCircle size={30} /> : <ClipboardList size={30} />}
                        </div>

                        <div className="sk-min0">
                          <div className="at-hero-eyebrow">
                            {hovered ? <MousePointerClick size={14} /> : <Sparkles size={14} />}
                            {hovered ? "Previewing" : "Next up"}
                            <span className="at-hero-chip">{isQuiz ? "QUIZ" : "ASSIGNMENT"}</span>
                          </div>
                          <h2>{featured.title}</h2>
                          <p>{featured.courseTitle}</p>
                          <div className="at-hero-meta">
                            <span>
                              <Award size={14} />
                              {featured.totalMarks} marks
                            </span>
                            {isQuiz ? (
                              <span>
                                <HelpCircle size={14} />
                                {featured.questionCount}{" "}
                                {featured.questionCount === 1 ? "question" : "questions"}
                              </span>
                            ) : null}
                            {isQuiz && featured.durationMinutes ? (
                              <span>
                                <Clock3 size={14} />
                                {featured.durationMinutes} min
                              </span>
                            ) : null}
                            <span className={featuredStatus === "Overdue" ? "is-late" : undefined}>
                              <CalendarDays size={14} />
                              {featured.dueAt ? `Due ${formatDate(featured.dueAt)}` : "No due date"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="at-hero-action at-swap">
                        <span className={`at-hero-pill is-${featuredStatus.replace(" ", "-").toLowerCase()}`}>
                          {STATUS_ICON[featuredStatus]}
                          {featuredStatus}
                        </span>
                        <button
                          type="button"
                          className="sk-btn sk-btn-primary"
                          onClick={() => setSelectedAssessment(featured)}
                        >
                          {action.label}
                          {action.viewOnly ? <Eye size={15} /> : <ArrowRight size={15} />}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="at-hero-inner">
                  <div className="at-hero-main at-swap">
                    <div className="at-hero-icon">
                      <Award size={30} />
                    </div>
                    <div className="sk-min0">
                      <div className="at-hero-eyebrow">
                        <Sparkles size={14} />
                        All caught up
                      </div>
                      <h2>Everything is submitted</h2>
                      <p>You have no pending assignments or quizzes right now. Great work!</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="at-hero-foot">
                <div className="at-hero-track" aria-hidden="true">
                  <i style={{ width: `${completionPercent}%` }} />
                </div>
                <span>
                  <strong>{counts.submitted}</strong> of {counts.total} completed ({completionPercent}%)
                </span>
                <span className="at-hero-hint">
                  <MousePointerClick size={13} />
                  Hover a row below to preview it here
                </span>
              </div>
            </section>
          ) : null}

          {/* Content */}
          {loading ? (
            <div className="at-table" aria-busy="true">
              <div className="at-head" />
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="at-skel-row">
                  <div className="sk-skel" style={{ height: 18, width: 28 }} />
                  <div className="sk-skel" style={{ height: 22, width: 76 }} />
                  <div className="sk-skel" style={{ height: 18, width: "70%" }} />
                  <div className="sk-skel" style={{ height: 18, width: "60%" }} />
                  <div className="sk-skel" style={{ height: 18, width: 60 }} />
                  <div className="sk-skel" style={{ height: 24, width: 90 }} />
                  <div className="sk-skel" style={{ height: 34, width: 100 }} />
                </div>
              ))}
              <span className="sk-sr">Loading your assessments</span>
            </div>
          ) : error ? (
            <div className="sk-error-card" role="alert">
              <div className="sk-error-icon">
                <AlertCircle size={24} />
              </div>
              <h2>Unable to load assignments</h2>
              <p>Something went wrong while loading your work. Please try again.</p>
              <button
                type="button"
                className="sk-btn sk-btn-primary"
                onClick={() => void loadAssessments()}
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          ) : assessments.length === 0 ? (
            <div className="sk-empty">
              <div className="sk-empty-icon">
                <ClipboardList size={22} />
              </div>
              <strong>No assignments or quizzes yet</strong>
              <span>
                Published assessments for your enrolled courses will appear here.
              </span>
            </div>
          ) : rows.length === 0 ? (
            <div className="sk-empty">
              <div className="sk-empty-icon">
                <Search size={22} />
              </div>
              <strong>No assignments found</strong>
              <span>Try changing your filters or search criteria.</span>
              <button type="button" className="sk-btn sk-btn-secondary" onClick={resetFilters}>
                <RotateCcw size={14} />
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className="at-table"
              role="table"
              aria-label="Assignments and quizzes"
              onMouseLeave={() => setHoverId(null)}
            >
              <div className="at-head at-head-filters" role="row">
                <span role="columnheader">#</span>
                <span role="columnheader" className="at-filter-heading">
                  <span>Type</span>
                  <FilterSelect
                    label="Type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                      { value: "all", label: "All types" },
                      { value: "assignment", label: "Assignment" },
                      { value: "quiz", label: "Quiz" },
                    ]}
                  />
                </span>
                <span role="columnheader" className="at-filter-heading at-search-heading">
                  <span>Assignment / Quiz</span>
                  <label className="sk-search at-search at-heading-search">
                    <Search size={14} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search assignments or courses..."
                      aria-label="Search assignments and quizzes"
                    />
                    {search ? (
                      <button type="button" className="at-clear" onClick={() => setSearch("")} aria-label="Clear search">
                        <X size={12} />
                      </button>
                    ) : null}
                  </label>
                </span>
                <span role="columnheader" className="at-h-course at-filter-heading">
                  <span>Course</span>
                  <FilterSelect label="Course" value={courseFilter} onChange={setCourseFilter} options={courseOptions} />
                </span>
                <span role="columnheader">Marks</span>
                <span role="columnheader" className="at-filter-heading">
                  <span>Due Date</span>
                  <FilterSelect
                    label="Due"
                    value={dueFilter}
                    onChange={(value) => setDueFilter(value as DueFilter)}
                    options={[
                      { value: "all", label: "Any date" },
                      { value: "none", label: "No due date" },
                      { value: "today", label: "Due today" },
                      { value: "week", label: "Due this week" },
                      { value: "overdue", label: "Overdue" },
                    ]}
                  />
                </span>
                <span role="columnheader" className="at-filter-heading">
                  <span>Status</span>
                  <FilterSelect
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "all", label: "All statuses" },
                      { value: "Not started", label: "Not started" },
                      { value: "In progress", label: "In progress" },
                      { value: "Submitted", label: "Submitted" },
                      { value: "Graded", label: "Graded" },
                      { value: "Overdue", label: "Overdue" },
                    ]}
                  />
                </span>
                <span role="columnheader" className="at-h-action at-filter-heading">
                  <span>Action</span>
                  <FilterSelect
                    label="Sort by"
                    icon={ArrowUpDown}
                    value={sortBy}
                    onChange={(value) => setSortBy(value as SortKey)}
                    options={[
                      { value: "newest", label: "Newest" },
                      { value: "oldest", label: "Oldest" },
                      { value: "due", label: "Due date" },
                      { value: "name", label: "Name" },
                      { value: "status", label: "Status" },
                    ]}
                  />
                  {hasFilters ? (
                    <button type="button" onClick={resetFilters} className="at-heading-clear">Clear</button>
                  ) : null}
                </span>
              </div>
              <div className="at-table-summary" aria-live="polite">
                Showing <strong>{rows.length}</strong> of {assessments.length} items
              </div>

              <div role="rowgroup" key={`${sortBy}-${rows.length}`}>
                {rows.map((item, index) => (
                  <AssignmentRow
                    key={item.id}
                    index={index}
                    item={item}
                    status={statusById.get(item.id) ?? "Not started"}
                    previewing={hoverId === item.id}
                    onHover={() => setHoverId(item.id)}
                    onOpen={() => setSelectedAssessment(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedAssessment ? (
        <AssessmentModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onSubmitted={handleSubmitted}
          onNotify={toasts.push}
        />
      ) : null}

      {toasts.node}
      <SkStyles />
      <style dangerouslySetInnerHTML={{ __html: assignmentsCss }} />
    </>
  );
}

/* ------------------------------------------------------------------
 * Table row
 * ------------------------------------------------------------------ */

function AssignmentRow({
  index,
  item,
  status,
  previewing,
  onHover,
  onOpen,
}: {
  index: number;
  item: AssessmentListItem;
  status: DisplayStatus;
  previewing: boolean;
  onHover: () => void;
  onOpen: () => void;
}) {
  const isQuiz = item.type === "QUIZ";
  const attempt = attemptStateOf(item);
  const score = item.latestSubmission?.score;
  const hasScore = typeof score === "number";
  const action = getAction(item, status);

  return (
    <div
      role="row"
      className={`at-row${status === "Overdue" ? " is-overdue" : ""}${previewing ? " is-previewing" : ""}`}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
      onMouseEnter={onHover}
      onClick={onOpen}
    >
      <div role="cell" className="at-c-num">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div role="cell" className="at-c-type">
        <span className={`sk-badge ${isQuiz ? "tone-navy" : "tone-blue"} at-type`}>
          {isQuiz ? <HelpCircle size={12} /> : <ClipboardList size={12} />}
          {isQuiz ? "QUIZ" : "ASSIGNMENT"}
        </span>
      </div>

      <div role="cell" className="at-c-title">
        <strong>{item.title}</strong>
        <span className="at-course-inline">{item.courseTitle}</span>
        {isQuiz ? (
          <span className="at-meta">
            <span>
              <HelpCircle size={12} />
              {item.questionCount} {item.questionCount === 1 ? "question" : "questions"}
            </span>
            {item.durationMinutes ? (
              <span>
                <Clock3 size={12} />
                {item.durationMinutes} min
              </span>
            ) : null}
            {attempt.used > 0 ? (
              <span>
                <RotateCcw size={12} />
                Attempt {attempt.used}/{attempt.max}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div role="cell" className="at-c-course">
        <span title={item.courseTitle}>{item.courseTitle}</span>
      </div>

      <div role="cell" className="at-c-marks">
        <strong>{item.totalMarks}</strong>
        <span>marks</span>
        {hasScore ? (
          <em className={attempt.perfect ? "is-perfect" : undefined}>
            Latest score: {score}/{item.totalMarks}
          </em>
        ) : null}
      </div>

      <div role="cell" className={`at-c-due${status === "Overdue" ? " is-late" : ""}`}>
        {item.dueAt ? formatDate(item.dueAt) : "No due date"}
      </div>

      <div role="cell" className="at-c-status">
        <StatusBadge status={status} />
      </div>

      <div role="cell" className="at-c-action">
        <button
          type="button"
          className={`sk-btn sk-btn-sm ${action.viewOnly ? "sk-btn-secondary" : "sk-btn-primary"}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          aria-label={`${action.label}: ${item.title}`}
        >
          {action.label}
          {action.viewOnly ? <Eye size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Assessment panel (modal)
 * ------------------------------------------------------------------ */

function AssessmentModal({
  assessment,
  onClose,
  onSubmitted,
  onNotify,
}: {
  assessment: AssessmentListItem;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
  onNotify: (kind: "success" | "error", text: string) => void;
}) {
  const [details, setDetails] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDetails(silent = false) {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/assessments/${assessment.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const json: ApiResponse<AssessmentDetails> = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Unable to load assessment details.");
      }

      setDetails(json.data);
    } catch (err) {
      console.error("Load assessment details error:", err);
      setError("Unable to load this assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDetails();
  }, [assessment.id]);

  const isQuiz = assessment.type === "QUIZ";

  return (
    <Modal onClose={onClose} maxWidth={920} labelledBy="assessment-modal-title">
      {(close) => (
        <>
          <div className="sk-modal-head at-modal-head">
            <div className="sk-min0">
              <button type="button" className="at-back" onClick={close}>
                <ArrowLeft size={14} />
                Back to Assignments
              </button>

              <div className="at-modal-kicker">
                <span className={`sk-badge ${isQuiz ? "tone-navy" : "tone-blue"}`}>
                  {isQuiz ? "QUIZ" : "ASSIGNMENT"}
                </span>
                <span>ASM-{String(assessment.id).padStart(4, "0")}</span>
              </div>

              <h2 id="assessment-modal-title">{assessment.title}</h2>
              <p>{assessment.courseTitle}</p>
            </div>

            <button
              type="button"
              onClick={close}
              className="sk-modal-close"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="sk-modal-body at-modal-body" id="at-modal-body">
            {loading ? (
              <div className="at-modal-loading">
                <div className="sk-skel" style={{ height: 70 }} />
                <div className="sk-skel" style={{ height: 160 }} />
                <span className="sk-sr">Loading assessment</span>
              </div>
            ) : error ? (
              <div className="sk-error-card" role="alert" style={{ minHeight: 200 }}>
                <div className="sk-error-icon">
                  <AlertCircle size={22} />
                </div>
                <h2>Couldn&apos;t open this assessment</h2>
                <p>{error}</p>
                <button
                  type="button"
                  className="sk-btn sk-btn-primary"
                  onClick={() => void loadDetails()}
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            ) : details ? (
              <AssessmentContent
                details={details}
                onNotify={onNotify}
                onSubmitted={async () => {
                  await onSubmitted();
                  await loadDetails(true);
                }}
              />
            ) : null}
          </div>
        </>
      )}
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="at-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AssessmentContent({
  details,
  onSubmitted,
  onNotify,
}: {
  details: AssessmentDetails;
  onSubmitted: () => Promise<void>;
  onNotify: (kind: "success" | "error", text: string) => void;
}) {
  const isQuiz = details.type === "QUIZ";
  const latest = details.latestSubmission;
  const attempt = getAttemptState({
    type: details.type,
    totalMarks: details.totalMarks,
    attemptsUsed: details.attemptsUsed,
    latest,
  });
  const status = effectiveStatus(latest, details.dueAt);
  const instructions = splitInstructions(details.instructions);

  return (
    <>
      <div className="at-facts">
        <Fact label="Maximum Marks" value={String(details.totalMarks)} />
        {isQuiz ? (
          <>
            <Fact
              label="Questions"
              value={String(details.questions.length || details.questionCount)}
            />
            <Fact
              label="Duration"
              value={details.durationMinutes ? `${details.durationMinutes} min` : "Not set"}
            />
            <Fact label="Attempts" value={`${MAX_QUIZ_ATTEMPTS} maximum`} />
          </>
        ) : (
          <Fact label="Status" value={status} />
        )}
        <Fact label="Due Date" value={formatDate(details.dueAt)} />
      </div>

      {details.description ? (
        <div className="at-block">
          <h3>Description</h3>
          <p className="at-text">{details.description}</p>
        </div>
      ) : null}

      {instructions.length > 0 ? (
        <div className="at-block">
          <h3>Instructions</h3>
          <div className="at-steps">
            {instructions.map((instruction, index) => (
              <div
                key={`${instruction}-${index}`}
                className="at-step"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <span>{index + 1}</span>
                <p>{instruction}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isQuiz ? (
        <QuizSection
          details={details}
          attempt={attempt}
          onSubmitted={onSubmitted}
          onNotify={onNotify}
        />
      ) : (
        <AssignmentSection
          details={details}
          status={status}
          onSubmitted={onSubmitted}
          onNotify={onNotify}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------
 * Quiz
 * ------------------------------------------------------------------ */

function parseAnswers(value: unknown): Record<string, string> {
  if (!value) {
    return {};
  }

  let data: unknown = value;

  if (typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch {
      return {};
    }
  }

  /* JSON string OR an already-parsed object, e.g. { "12": "B" } */
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, answer]) => [
        key,
        String(answer),
      ])
    );
  }

  return {};
}

function optionsOf(question: AssessmentQuestion): [string, string][] {
  return (
    [
      ["A", question.optionA],
      ["B", question.optionB],
      ["C", question.optionC],
      ["D", question.optionD],
    ] as [string, string | null][]
  ).filter((item): item is [string, string] => Boolean(item[1]?.trim()));
}

function AnswerOption({
  name,
  optionKey,
  label,
  state,
  selected,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  optionKey: string;
  label: string;
  state: OptionState;
  selected: boolean;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`at-opt is-${state}${disabled ? " is-static" : ""}`}>
      <input
        type="radio"
        name={name}
        value={optionKey}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="at-opt-mark" aria-hidden="true">
        {state === "correct" ? <Check size={13} /> : state === "wrong" ? <X size={13} /> : null}
      </span>
      <span className="at-opt-text">
        <b>{optionKey}.</b> {label}
      </span>
      {state === "correct" ? (
        <em className="at-tag is-ok">
          <Check size={12} />
          {selected ? "Your answer · Correct" : "Correct answer"}
        </em>
      ) : null}
      {state === "wrong" ? (
        <em className="at-tag is-bad">
          <X size={12} />
          Your answer · Incorrect
        </em>
      ) : null}
    </label>
  );
}

function ConfirmSubmit({
  answered,
  total,
  attemptNumber,
  submitting,
  onCancel,
  onConfirm,
}: {
  answered: number;
  total: number;
  attemptNumber: number;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    /* Capture phase so the parent modal does not also close on Escape. */
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();

        if (!submitting) {
          onCancel();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);

    return () => document.removeEventListener("keydown", onKey, true);
  }, [submitting, onCancel]);

  const unanswered = total - answered;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="sk-overlay"
      style={{ zIndex: 1200 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onCancel();
        }
      }}
    >
      <div
        className="sk-modal"
        style={{ maxWidth: 440 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-submit-title"
      >
        <div className="sk-modal-body at-confirm">
          <div className="at-confirm-icon">
            <HelpCircle size={22} />
          </div>
          <h2 id="confirm-submit-title">Submit Quiz?</h2>
          <p className="at-confirm-main">
            You have answered {answered} of {total} questions.
          </p>
          <p className={unanswered > 0 ? "at-confirm-warn" : "at-confirm-ok"}>
            {unanswered > 0
              ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}.`
              : "You have answered all questions."}
          </p>
          <p className="at-confirm-note">
            Once submitted, this attempt (attempt {attemptNumber} of {MAX_QUIZ_ATTEMPTS}) will be
            recorded.
          </p>
        </div>

        <div className="sk-modal-foot">
          <button
            type="button"
            className="sk-btn sk-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sk-btn sk-btn-primary"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={15} className="sk-spin" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function QuizSection({
  details,
  attempt,
  onSubmitted,
  onNotify,
}: {
  details: AssessmentDetails;
  attempt: AttemptState;
  onSubmitted: () => Promise<void>;
  onNotify: (kind: "success" | "error", text: string) => void;
}) {
  const latest = details.latestSubmission;
  const questions = details.questions;
  const total = questions.length;

  const [mode, setMode] = useState<"attempt" | "result">(latest ? "result" : "attempt");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const lockRef = useRef(false);

  /* A closed quiz can never go back to attempt mode. */
  const view: "attempt" | "result" =
    attempt.closed && latest ? "result" : latest && mode === "result" ? "result" : "attempt";

  const answeredCount = questions.filter((question) => answers[String(question.id)]).length;
  const nextAttemptNumber = Math.min(attempt.used + 1, MAX_QUIZ_ATTEMPTS);

  useEffect(() => {
    document.getElementById("at-modal-body")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const requestSubmit = () => {
    if (lockRef.current || submitting || !attempt.canAttempt) {
      return;
    }

    if (total === 0) {
      setSubmitError("This quiz does not have any questions yet.");
      return;
    }

    setSubmitError("");
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    /* Synchronous lock: blocks double-clicks before React re-renders. */
    if (lockRef.current) {
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    lockRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_URL}/assessments/${details.id}/quiz-submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      const json = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(json?.message || "Unable to submit quiz.");
      }

      setConfirmOpen(false);
      setAnswers({});
      setStep(0);
      setMode("result");

      onNotify("success", "Your quiz attempt has been submitted.");

      await onSubmitted();
    } catch (err) {
      console.error("Submit quiz error:", err);

      setConfirmOpen(false);
      setSubmitError(safeMessage(err, "We couldn't submit your quiz. Please try again."));
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  };

  if (total === 0) {
    return (
      <div className="sk-alert is-warn">
        <AlertCircle size={18} />
        <span>
          This quiz has no questions yet. Please check again after your trainer adds the
          questions.
        </span>
      </div>
    );
  }

  /* -------------------------- RESULT VIEW -------------------------- */

  if (view === "result" && latest) {
    return (
      <QuizResult
        details={details}
        attempt={attempt}
        onRetry={() => {
          setAnswers({});
          setStep(0);
          setSubmitError("");
          setMode("attempt");
        }}
      />
    );
  }

  /* -------------------------- ATTEMPT VIEW ------------------------- */

  const question = questions[step];
  const options = optionsOf(question);
  const percent = (answeredCount / total) * 100;

  return (
    <div className="at-block">
      {attempt.used > 0 ? (
        <div className="sk-alert is-warn" style={{ marginBottom: 14 }}>
          <AlertCircle size={18} />
          <span>
            This is attempt {nextAttemptNumber} of {MAX_QUIZ_ATTEMPTS}. {attempt.remaining}{" "}
            attempt{attempt.remaining === 1 ? "" : "s"} remaining including this one.
          </span>
        </div>
      ) : null}

      {submitError ? (
        <div className="sk-alert is-error" role="alert">
          <AlertCircle size={18} />
          <span>{submitError}</span>
          <button type="button" onClick={() => setSubmitError("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      ) : null}

      <div className="at-qhead">
        <strong>
          Question {step + 1} of {total}
        </strong>
        <span className="sk-badge tone-blue">
          {answeredCount} / {total} answered
        </span>
      </div>

      <div
        className="at-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answeredCount}
        aria-label="Questions answered"
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className="at-dots" role="group" aria-label="Question navigation">
        {questions.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`at-dot${index === step ? " is-current" : ""}${
              answers[String(item.id)] ? " is-done" : ""
            }`}
            onClick={() => setStep(index)}
            aria-label={`Question ${index + 1}${
              answers[String(item.id)] ? ", answered" : ", not answered"
            }`}
            aria-current={index === step ? "step" : undefined}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="at-question" key={question.id}>
        <div className="at-question-top">
          <span>Question {step + 1}</span>
          <span className="sk-badge">
            {question.marks} mark{question.marks === 1 ? "" : "s"}
          </span>
        </div>

        <p className="at-question-text" id={`q-${question.id}`}>
          {question.question}
        </p>

        <div className="at-options" role="radiogroup" aria-labelledby={`q-${question.id}`}>
          {options.map(([key, label]) => {
            const checked = answers[String(question.id)] === key;

            return (
              <AnswerOption
                key={key}
                name={`question-${question.id}`}
                optionKey={key}
                label={label}
                state={checked ? "selected" : "neutral"}
                selected={checked}
                checked={checked}
                disabled={submitting}
                onChange={() =>
                  setAnswers((current) => ({
                    ...current,
                    [String(question.id)]: key,
                  }))
                }
              />
            );
          })}
        </div>
      </div>

      <div className="at-nav">
        <button
          type="button"
          className="sk-btn sk-btn-secondary sk-btn-sm"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0}
        >
          <ChevronLeft size={15} />
          Previous
        </button>

        <button
          type="button"
          className="sk-btn sk-btn-secondary sk-btn-sm"
          onClick={() => setStep((current) => Math.min(current + 1, total - 1))}
          disabled={step === total - 1}
        >
          Next
          <ChevronRight size={15} />
        </button>

        <span className="at-nav-info">
          Attempt {nextAttemptNumber} of {MAX_QUIZ_ATTEMPTS}
        </span>

        <button
          type="button"
          className="sk-btn sk-btn-primary"
          onClick={requestSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <RefreshCw size={15} className="sk-spin" />
              Submitting...
            </>
          ) : (
            <>
              <HelpCircle size={15} />
              Submit Quiz
            </>
          )}
        </button>
      </div>

      {confirmOpen ? (
        <ConfirmSubmit
          answered={answeredCount}
          total={total}
          attemptNumber={nextAttemptNumber}
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void confirmSubmit()}
        />
      ) : null}
    </div>
  );
}

function QuizResult({
  details,
  attempt,
  onRetry,
}: {
  details: AssessmentDetails;
  attempt: AttemptState;
  onRetry: () => void;
}) {
  const latest = details.latestSubmission!;
  const [selectedReviewAttemptId, setSelectedReviewAttemptId] = useState(latest.id);
  const score = typeof latest.score === "number" ? latest.score : 0;
  const percent = details.totalMarks > 0 ? Math.round((score / details.totalMarks) * 100) : 0;
  const headline = attemptHeadline(attempt);
  const tone = attempt.perfect ? "ok" : attempt.phase === "final" ? "bad" : "info";
  const hasCorrectKeys = details.questions.some((question) => Boolean(question.correctAnswer));
  const history = (details.attempts ?? [])
    .slice()
    .sort((a, b) => a.attemptNumber - b.attemptNumber);

  return (
    <div className="at-result-wrap">
      <section className={`at-result is-${tone}`} aria-live="polite">
        <div className="at-result-icon">
          {attempt.perfect ? (
            <Award size={26} />
          ) : attempt.phase === "final" ? (
            <CircleAlert size={26} />
          ) : (
            <CheckCircle2 size={26} />
          )}
        </div>

        <div className="sk-min0 sk-grow">
          <h3>{headline.title}</h3>
          <p>
            {attempt.perfect ? "Perfect score" : "Score"}: {score}/{details.totalMarks}
          </p>
          <p className="at-result-line">{headline.line}</p>
          <div className="at-result-chips">
            <span className="sk-badge">
              Attempt {attempt.used} of {attempt.max}
            </span>
            <span className="sk-badge">Attempts remaining: {attempt.remaining}</span>
            <span className="sk-badge">Submitted: {formatDateTime(latest.submittedAt)}</span>
          </div>
        </div>

        <div className="at-score">
          <strong>
            <CountUp value={score} />
            <small> / {details.totalMarks}</small>
          </strong>
          <span>{percent}%</span>
          <div className="at-score-bar">
            <i style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      {attempt.canAttempt ? (
        <div className="at-retry">
          <p>
            You can improve your score. {attempt.remaining} attempt
            {attempt.remaining === 1 ? "" : "s"} remaining.
          </p>
          <button type="button" className="sk-btn sk-btn-primary" onClick={onRetry}>
            <RotateCcw size={15} />
            Try Again
          </button>
        </div>
      ) : null}

      {latest.feedback ? (
        <div className="at-feedback">
          <strong>Trainer feedback:</strong> {latest.feedback}
        </div>
      ) : null}

      {attempt.closed ? (
        <div className="at-block">
          <h3>Answer review</h3>

          {!hasCorrectKeys ? (
            <div className="sk-alert is-warn">
              <AlertCircle size={18} />
              <span>Detailed answer review isn&apos;t available for this quiz yet.</span>
            </div>
          ) : null}

          <div className="at-rv">
            <div className="at-rv-tabs" role="tablist" aria-label="Attempts">
              {history.map((entry) => {
                const active = selectedReviewAttemptId === entry.id;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-pressed={active}
                    onClick={() => setSelectedReviewAttemptId(entry.id)}
                    className={`at-rv-tab${active ? " is-active" : ""}`}
                  >
                    Attempt {entry.attemptNumber}
                  </button>
                );
              })}
            </div>

            {(() => {
              const entry = history.find((item) => item.id === selectedReviewAttemptId) ?? latest;
              const submitted = parseAnswers(entry.answers);
              const entryScore = typeof entry.score === "number" ? entry.score : 0;

              return (
                <div className="at-rv-body" key={entry.id}>
                  <div className="at-rv-stats">
                    <div className="at-rv-stat">
                      <span>ATTEMPT</span>
                      <strong>{entry.attemptNumber}</strong>
                    </div>
                    <div className="at-rv-stat">
                      <span>SCORE</span>
                      <strong>
                        {entryScore} / {details.totalMarks}
                      </strong>
                    </div>
                    <div className="at-rv-stat">
                      <span>STATUS</span>
                      <strong>{entry.status === "GRADED" ? "Graded" : "Submitted"}</strong>
                    </div>
                    <div className="at-rv-stat">
                      <span>SUBMITTED</span>
                      <strong>{formatDateTime(entry.submittedAt)}</strong>
                    </div>
                  </div>

                  <div className="at-rv-title">
                    <h4>Submitted Answers</h4>
                    <p>Green indicates the correct answer. Red indicates a selected incorrect answer.</p>
                  </div>

                  <div className="at-rv-list">
                    {details.questions.map((question, index) => {
                      const selectedKey = submitted[String(question.id)]?.toUpperCase();
                      const correctKey = question.correctAnswer?.toUpperCase();
                      const isRight = Boolean(correctKey) && selectedKey === correctKey;

                      return (
                        <div
                          key={`${entry.id}-${question.id}`}
                          className="at-rv-q"
                          style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                        >
                          <div className="at-rv-q-head">
                            <strong>
                              {index + 1}. {question.question}
                            </strong>
                            <span className="sk-badge">
                              {question.marks} {question.marks === 1 ? "mark" : "marks"}
                            </span>
                          </div>

                          <div className="at-rv-opts">
                            {optionsOf(question).map(([key, label]) => {
                              const isSelected = selectedKey === key;
                              const isCorrect = correctKey === key;
                              const incorrectSelected =
                                isSelected && Boolean(correctKey) && !isCorrect;

                              return (
                                <div
                                  key={key}
                                  className={`at-rv-opt${isCorrect ? " is-correct" : ""}${
                                    incorrectSelected ? " is-wrong" : ""
                                  }${isSelected ? " is-picked" : ""}`}
                                >
                                  <strong>{key}.</strong>
                                  <span>{label}</span>
                                  {isSelected ? (
                                    <strong className="at-rv-tag">Selected</strong>
                                  ) : null}
                                  {isCorrect ? (
                                    <strong className="at-rv-tag is-ok">Correct answer</strong>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          <div className="at-rv-foot">
                            <span>
                              Student answer: <strong>{selectedKey ?? "Not answered"}</strong>
                            </span>
                            {correctKey ? (
                              <span>
                                Correct answer: <strong>{correctKey}</strong>
                              </span>
                            ) : null}
                            <span>
                              Marks: <strong>{question.marks}</strong>
                            </span>
                            {correctKey ? (
                              <strong className={isRight ? "at-rv-ok" : "at-rv-bad"}>
                                {isRight ? "✓ Correct" : "✕ Incorrect"}
                              </strong>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="sk-alert is-ok">
          <CheckCircle2 size={18} />
          <span>
            Correct answers are shown once the quiz is completed or all attempts are used.
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * Assignment
 * ------------------------------------------------------------------ */

function AssignmentSection({
  details,
  status,
  onSubmitted,
  onNotify,
}: {
  details: AssessmentDetails;
  status: DisplayStatus;
  onSubmitted: () => Promise<void>;
  onNotify: (kind: "success" | "error", text: string) => void;
}) {
  const latest = details.latestSubmission;
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const lockRef = useRef(false);

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadSubmissionFile = async () => {
    const token = getToken();
    const relativeUrl = latest?.submissionFileUrl;

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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Unable to download the submitted file.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = latest.submissionFileName || "assignment-file";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download submission file error:", err);
      setSubmitError("We couldn't download the file. Please try again.");
    }
  };

  const submitAssignment = async () => {
    if (lockRef.current) {
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!selectedFile) {
      setSubmitError("Please choose an assignment file.");
      return;
    }

    lockRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      if (comment.trim()) {
        formData.append("submissionComment", comment.trim());
      }

      const response = await fetch(
        `${API_URL}/assessments/${details.id}/assignment-submission`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
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
        throw new Error(json?.message || "Unable to submit assignment.");
      }

      removeFile();
      setComment("");

      onNotify("success", "Assignment submitted successfully.");

      await onSubmitted();
    } catch (err) {
      console.error("Submit assignment error:", err);
      setSubmitError(
        safeMessage(err, "We couldn't submit your assignment. Please try again.")
      );
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <>
      {latest ? (
        <div className={`at-latest${status === "Graded" ? " is-graded" : ""}`}>
          <div className="at-latest-title">
            <CheckCircle2 size={17} />
            Latest submission: {status}
          </div>

          <div className="at-latest-grid">
            <div>Submitted: {formatDateTime(latest.submittedAt)}</div>
            {typeof latest.score === "number" ? (
              <div>
                Score: {latest.score}/{details.totalMarks}
              </div>
            ) : null}
            {latest.submissionFileName ? (
              <div>
                File: {latest.submissionFileName}
                {latest.submissionFileUrl ? (
                  <button type="button" onClick={downloadSubmissionFile} className="at-link">
                    Download
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {latest.feedback ? (
            <div className="at-feedback">
              <strong>Trainer feedback:</strong> {latest.feedback}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="sk-alert is-warn">
          <AlertCircle size={18} />
          <span>You haven&apos;t submitted this assignment yet. Upload your file below.</span>
        </div>
      )}

      {submitError ? (
        <div className="sk-alert is-error" role="alert">
          <AlertCircle size={18} />
          <span>{submitError}</span>
          <button type="button" onClick={() => setSubmitError("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      ) : null}

      <div className="at-block">
        <h3>{latest ? "Submit again" : "Your submission"}</h3>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          style={{ display: "none" }}
          aria-label="Choose assignment file"
        />

        {!selectedFile ? (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="at-drop">
            <div className="at-drop-icon">
              <Upload size={22} />
            </div>
            <strong>Upload your assignment</strong>
            <span>Click to choose a file</span>
            <em>PDF, DOC, DOCX, ZIP, PPTX, XLSX, Images</em>
          </button>
        ) : (
          <div className="at-file">
            <div className="sk-icon sk-tone-blue">
              <FileText size={19} />
            </div>
            <div className="sk-min0 sk-grow">
              <span className="sk-row-title">{selectedFile.name}</span>
              <span className="sk-row-sub">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="sk-modal-close"
              aria-label="Remove file"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div className="sk-field" style={{ marginTop: 14 }}>
          <label className="sk-label" htmlFor="submission-comment">
            Submission Comment <span className="at-optional">(optional)</span>
          </label>
          <textarea
            id="submission-comment"
            className="sk-textarea"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add any comments for your trainer..."
            rows={3}
          />
        </div>

        <button
          type="button"
          onClick={submitAssignment}
          disabled={submitting}
          className="sk-btn sk-btn-primary"
        >
          {submitting ? (
            <>
              <RefreshCw size={15} className="sk-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload size={15} />
              Submit Assignment
            </>
          )}
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
 * Styles (SK Computer Education navy / blue / orange, matches My Courses)
 * ------------------------------------------------------------------ */

const assignmentsCss = `
/* summary tiles
   NOTE: entrance animations use "backwards" (not "both") so hover lift keeps working
   after the animation ends. */
.at-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}
.at-tile{padding:12px 14px}
.at-tile.sk-reveal{animation-fill-mode:backwards}
.at-tile .sk-tile-value{font-size:22px}
.at-tile.is-active{background:var(--blue-tint)}

/* Featured assessment stays below as a light card; the blue banner belongs above. */
.at-hero{
  position:relative;
  overflow:hidden;
  margin-bottom:14px;
  padding:18px 22px 14px;
  border:1px solid #F6D9C3;
  border-radius:16px;
  color:#0F2F5F;
  background:linear-gradient(135deg,#FFF6EE 0%,#F1F6FE 100%);
  box-shadow:0 5px 16px rgba(15,47,95,.06);
  animation:sk-rise 520ms var(--ease) backwards;
}
.at-hero::after{content:none}
.at-hero-glow{
  position:absolute;
  width:260px;
  height:260px;
  top:-160px;
  right:5%;
  border-radius:50%;
  background:rgba(37,99,235,.055);
  pointer-events:none;
}
.at-hero-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:24px}
.at-hero-main{display:flex;align-items:center;gap:18px;min-width:0;flex:1}
.at-swap{animation:sk-swap .4s var(--ease) backwards}
.at-hero-icon{
  width:68px;height:68px;flex:0 0 68px;
  display:flex;align-items:center;justify-content:center;
  border-radius:18px;background:#EAF1FD;border:1px solid #D6E4FA;
  color:#1459B8;
}
.at-hero-eyebrow{display:flex;align-items:center;gap:7px;margin-bottom:5px;font-size:13px;font-weight:700;color:#526987}
.at-hero-chip{margin-left:6px;padding:3px 9px;border-radius:999px;background:#EAF1FD;font-size:11px;font-weight:800;letter-spacing:.04em;color:#1459B8}
.at-hero h2{margin:0;font-size:24px;line-height:1.25;font-weight:750;letter-spacing:-.01em;color:#0F2F5F;overflow-wrap:anywhere}
.at-hero p{margin:5px 0 0;font-size:14px;line-height:1.5;color:#64748B}
.at-hero-meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:13px;color:#526987}
.at-hero-meta span{display:inline-flex;align-items:center;gap:6px}
.at-hero-meta .is-late{font-weight:700;color:#C62828}
.at-hero-action{display:flex;flex-direction:column;align-items:flex-end;gap:12px;min-width:200px}
.at-hero-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:#EDF2F8;border:1px solid #DCE5F2;font-size:12.5px;font-weight:700;color:#526987}
.at-hero-pill.is-overdue{background:#FDECEC;border-color:#F5CACA;color:#B42323}
.at-hero-pill.is-submitted,.at-hero-pill.is-graded{background:#E8F6EE;border-color:#BFE7CF;color:#15803D}
.at-hero-foot{position:relative;z-index:1;display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid #E5EBF4;font-size:12.5px;color:#64748B}
.at-hero-foot strong{color:#0F2F5F}
.at-hero-track{flex:0 1 280px;min-width:120px;height:6px;overflow:hidden;border-radius:999px;background:#E1E8F2}
.at-hero-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#1459B8,#3B82F6);transform-origin:left;animation:sk-grow-x 900ms var(--ease) 200ms backwards}
.at-hero-hint{display:inline-flex;align-items:center;gap:6px;margin-left:auto;color:#71829B}
.at-hero-skel{height:120px;margin-bottom:14px}

/* custom select */
.at-clear{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:50%;background:var(--line-2);color:var(--muted);cursor:pointer;transition:background .2s ease,transform .25s var(--ease)}
.at-clear:hover{background:#D9E3F2;transform:rotate(90deg)}
.at-search{flex:1 1 260px;min-width:200px;height:46px}
.at-fs{position:relative}
.at-fs-btn{display:flex;align-items:center;gap:9px;min-width:150px;height:46px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:#fff;font:inherit;text-align:left;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,background .2s ease}
.at-fs-btn:hover{border-color:#BFD3F2;background:#FAFCFF}
.at-fs-btn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.at-fs-btn.is-open{border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.at-fs-btn.is-set{border-color:#BFD3F2;background:var(--blue-tint)}
.at-fs-icon{flex:0 0 auto;color:var(--blue)}
.at-fs-text{display:flex;flex-direction:column;min-width:0;flex:1;line-height:1.2}
.at-fs-text small{font-size:11px;color:var(--soft)}
.at-fs-text b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;color:var(--navy)}
.at-fs-caret{flex:0 0 auto;color:var(--soft);transition:transform .25s var(--ease)}
.at-fs-btn.is-open .at-fs-caret{transform:rotate(180deg);color:var(--orange)}
.at-fs-pop{position:absolute;top:calc(100% + 6px);left:0;z-index:40;min-width:100%;width:max-content;max-width:300px;max-height:280px;overflow-y:auto;margin:0;padding:5px;list-style:none;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 16px 36px rgba(15,47,95,.18);transform-origin:top left;animation:sk-modal-in .18s var(--ease) both}
.at-fs-pop li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;border-radius:8px;font-size:13.5px;color:var(--navy);cursor:pointer;transition:background .15s ease}
.at-fs-pop li.is-active{background:var(--blue-tint)}
.at-fs-pop li.is-selected{font-weight:600;color:var(--blue)}

/* table */
.at-table{overflow:visible;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03)}
.at-head,.at-row,.at-skel-row{display:grid;grid-template-columns:46px 120px minmax(0,1.9fr) minmax(0,1.2fr) 108px 118px 130px 150px;align-items:center;gap:12px;padding:0 16px}
.at-head{min-height:42px;border-bottom:1px solid var(--line);border-radius:16px 16px 0 0;background:linear-gradient(180deg,#F5F9FF 0%,#EEF4FD 100%);box-shadow:inset 0 3px 0 0 var(--blue);font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--navy)}
.at-head-filters{align-items:start;min-height:78px;padding-top:12px;padding-bottom:10px;gap:10px}
.at-filter-heading{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:7px;min-width:0;min-height:0;text-transform:none;letter-spacing:normal}
.at-head-filters>.at-filter-heading{align-self:start}
.at-head-filters>.at-filter-heading:not(.at-search-heading){overflow:visible}
.at-head-filters>.at-search-heading{min-width:0;align-self:start}
.at-filter-heading>span:first-child{font-size:11px;font-weight:700;letter-spacing:.045em;text-transform:uppercase;white-space:nowrap}
.at-filter-heading .at-fs{min-width:0;width:100%}
.at-filter-heading .at-fs-btn{width:100%;min-width:0;height:34px;padding:0 7px;gap:5px;border-radius:8px}
.at-filter-heading .at-fs-icon{display:none}
.at-filter-heading .at-fs-text small{display:none}
.at-filter-heading .at-fs-text b{font-size:11px}
.at-filter-heading .at-fs-caret{width:13px}
.at-head-filters .at-heading-search{display:flex!important;flex-direction:row!important;align-items:center!important;align-self:start!important;box-sizing:border-box;width:100%;min-width:0!important;min-height:34px!important;height:34px!important;max-height:34px!important;margin:0;padding:0 8px;gap:5px;overflow:hidden;border-radius:8px;font-size:12px}
.at-head-filters .at-heading-search input{display:block;flex:1 1 auto;min-width:0;width:100%;height:30px;min-height:0;margin:0;padding:0;border:0;outline:0;font-size:12px}
.at-head-filters .at-heading-search svg{flex:0 0 auto;width:14px;height:14px}
.at-head-filters .at-fs-btn{box-sizing:border-box;height:34px;min-height:34px;max-height:34px}
.at-head-filters>[role="columnheader"]:first-child{align-self:start;padding-top:3px}
.at-heading-clear{border:0;background:transparent;color:var(--blue);font-size:11px;font-weight:600;cursor:pointer;text-align:left;padding:0;transition:color .2s ease}
.at-heading-clear:hover{color:var(--orange)}
.at-table-summary{padding:7px 16px;border-bottom:1px solid var(--line-2);font-size:12px;color:var(--muted);background:#fff}
.at-table-summary strong{color:var(--navy)}
.at-h-action{text-align:right}
.at-row{position:relative;min-height:64px;padding-top:10px;padding-bottom:10px;border-bottom:1px solid var(--line-2);cursor:pointer;animation:sk-swap .35s var(--ease) backwards;transition:background .2s ease,box-shadow .2s ease}
.at-row:last-child{border-bottom:0;border-radius:0 0 16px 16px}
.at-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--orange);transform:scaleY(0);transition:transform .25s var(--ease)}
.at-row:hover,.at-row.is-previewing{background:#F5F9FF}
.at-row:hover::before,.at-row.is-previewing::before{transform:scaleY(1)}
.at-row.is-overdue::before{background:var(--red);transform:scaleY(1)}
.at-row .at-c-title strong{transition:color .2s ease}
.at-row:hover .at-c-title strong{color:var(--blue)}
.at-c-num{font-size:13px;font-weight:600;color:var(--soft);font-variant-numeric:tabular-nums}
.at-type{font-size:11px;letter-spacing:.03em}
.at-c-title{display:flex;flex-direction:column;gap:3px;min-width:0}
.at-c-title strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14.5px;font-weight:600;color:var(--navy)}
.at-course-inline{display:none;font-size:12.5px;color:var(--muted)}
.at-meta{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:12px;color:var(--muted)}
.at-meta span{display:inline-flex;align-items:center;gap:4px}
.at-c-course{min-width:0;font-size:13.5px;color:var(--muted)}
.at-c-course span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.at-c-marks{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 5px;font-size:13px;color:var(--muted)}
.at-c-marks strong{font-size:15px;color:var(--navy)}
.at-c-marks em{flex-basis:100%;margin-top:2px;font-style:normal;font-size:11.5px;font-weight:600;color:var(--blue)}
.at-c-marks em.is-perfect{color:var(--green)}
.at-c-due{font-size:13px;color:var(--muted)}
.at-c-due.is-late{font-weight:600;color:var(--red)}
.at-c-action{display:flex;justify-content:flex-end}
.at-status{font-size:12px}
.sk-badge.at-st-graded{background:#E3F5F2;color:#0F766E}
.at-skel-row{min-height:64px;border-bottom:1px solid var(--line-2)}

/* modal: branded header (logo blue + orange accent) */
.at-modal-head{position:relative;padding-bottom:16px;border-bottom:0;background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 55%,#1459B8 100%);color:#fff}
.at-modal-head::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 16%,transparent 16%)}
.at-back{display:inline-flex;align-items:center;gap:6px;margin:0 0 8px;padding:4px 10px 4px 6px;border:0;border-radius:8px;background:transparent;color:#CFE0FA;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s ease,color .2s ease,transform .2s var(--ease)}
.at-back:hover{background:rgba(255,255,255,.14);color:#fff;transform:translateX(-2px)}
.at-modal-kicker{display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px;font-weight:600;color:#FFB070;letter-spacing:.04em}
.at-modal-head .sk-badge{background:rgba(255,255,255,.16);color:#fff}
.at-modal-head h2{margin:0;font-size:22px;color:#fff}
.at-modal-head p{margin:4px 0 0;font-size:14px;color:#C9DBF5}
.at-modal-head .sk-modal-close{border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.12);color:#fff}
.at-modal-head .sk-modal-close:hover{background:rgba(255,255,255,.24);color:#fff}
.at-modal-loading{display:flex;flex-direction:column;gap:12px}
.at-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:14px}
.at-fact{padding:10px 12px;border:1px solid var(--line-2);border-radius:12px;background:#F8FAFD;transition:border-color .2s ease,transform .2s var(--ease),box-shadow .2s ease}
.at-fact:hover{border-color:#BFD3F2;transform:translateY(-2px);box-shadow:0 8px 16px rgba(15,47,95,.08)}
.at-fact span{display:block;margin-bottom:3px;font-size:12px;color:var(--soft)}
.at-fact strong{font-size:15px;color:var(--navy)}
.at-block{margin-bottom:16px}
.at-block h3{margin:0 0 8px;font-size:15px;font-weight:700;color:var(--navy)}
.at-text{margin:0;font-size:14px;line-height:1.65;color:var(--muted)}
.at-steps{display:flex;flex-direction:column;gap:7px}
.at-step{display:flex;align-items:flex-start;gap:10px;animation:sk-swap .35s var(--ease) backwards}
.at-step span{width:22px;height:22px;flex:0 0 22px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--blue-tint);color:var(--blue);font-size:11.5px;font-weight:700}
.at-step p{margin:1px 0 0;font-size:14px;line-height:1.5;color:var(--muted)}

/* quiz attempt */
.at-qhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:15px;color:var(--navy)}
.at-bar{height:8px;overflow:hidden;border-radius:999px;background:#E6ECF5}
.at-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transition:width .45s var(--ease)}
.at-dots{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.at-dot{width:32px;height:32px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--muted);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s ease,border-color .2s ease,color .2s ease,transform .2s var(--ease)}
.at-dot:hover{border-color:#9DBBEA;transform:translateY(-2px)}
.at-dot.is-done{background:var(--blue-tint);border-color:#BFD3F2;color:var(--blue)}
.at-dot.is-current{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 6px 14px rgba(20,89,184,.25)}
.at-dot:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.at-question{padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:#fff;animation:sk-swap .35s var(--ease) backwards}
.at-question-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:12.5px;font-weight:600;color:var(--soft)}
.at-question-text{margin:0 0 12px;font-size:16px;font-weight:600;line-height:1.5;color:var(--navy)}
.at-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.at-opt{position:relative;display:flex;align-items:center;gap:10px;min-height:46px;padding:9px 12px;border:1px solid var(--line);border-radius:11px;background:#fff;font-size:14px;line-height:1.4;color:#334155;cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s var(--ease),box-shadow .2s ease}
.at-opt input{position:absolute;opacity:0;pointer-events:none}
.at-opt-mark{width:20px;height:20px;flex:0 0 20px;display:flex;align-items:center;justify-content:center;border:2px solid #C3CEDF;border-radius:50%;color:#fff;transition:border-color .2s ease,background .2s ease,box-shadow .2s ease}
.at-opt:hover:not(.is-static){border-color:#9DBBEA;background:#FAFCFF;transform:translateX(3px)}
.at-opt:focus-within{box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.at-opt.is-selected{border-color:var(--blue-2);background:var(--blue-tint);box-shadow:0 0 0 2px rgba(37,99,235,.12)}
.at-opt.is-selected .at-opt-mark{border-color:var(--blue-2);background:var(--blue-2);box-shadow:inset 0 0 0 3px var(--blue-tint);animation:sk-pop .3s var(--ease) backwards}
.at-opt.is-correct{border:2px solid #16A34A;background:#E8F6EE}
.at-opt.is-correct .at-opt-mark{border-color:#16A34A;background:#16A34A}
.at-opt.is-wrong{border:2px solid var(--red);background:var(--red-tint)}
.at-opt.is-wrong .at-opt-mark{border-color:var(--red);background:var(--red)}
.at-opt.is-static{cursor:default}
.at-opt-text{flex:1;min-width:0}
.at-tag{display:inline-flex;align-items:center;gap:4px;flex:0 0 auto;font-style:normal;font-size:12px;font-weight:700}
.at-tag.is-ok{color:#15803D}
.at-tag.is-bad{color:var(--red)}
.at-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px}
.at-nav-info{margin-left:auto;font-size:13px;color:var(--muted)}

/* result */
.at-result-wrap{animation:sk-swap .4s var(--ease) backwards}
.at-result{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:14px;padding:16px 18px;border:1px solid;border-radius:16px}
.at-result.is-ok{border-color:#BFE6CD;background:linear-gradient(135deg,#F5FCF8,#E8F6EE)}
.at-result.is-info{border-color:#CFE0FA;background:linear-gradient(135deg,#F5F9FF,#EAF1FD)}
.at-result.is-bad{border-color:#FFD2B0;background:linear-gradient(135deg,#FFFBF6,#FFF3EA)}
.at-result-icon{width:52px;height:52px;flex:0 0 52px;display:flex;align-items:center;justify-content:center;border-radius:16px;background:#fff;box-shadow:0 6px 16px rgba(15,47,95,.12);animation:sk-pop .5s var(--ease) backwards}
.at-result.is-ok .at-result-icon{color:var(--green)}
.at-result.is-info .at-result-icon{color:var(--blue)}
.at-result.is-bad .at-result-icon{color:var(--orange)}
.at-result h3{margin:0;font-size:18px;color:var(--navy)}
.at-result p{margin:3px 0 0;font-size:14px;color:var(--muted)}
.at-result .at-result-line{font-weight:600;color:var(--navy)}
.at-result-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.at-score{min-width:130px;text-align:right}
.at-score strong{display:block;font-size:34px;line-height:1;color:var(--navy);font-variant-numeric:tabular-nums}
.at-score small{font-size:16px;font-weight:600;color:var(--muted)}
.at-score>span{display:block;margin-top:4px;font-size:14px;font-weight:700;color:var(--blue)}
.at-score-bar{height:6px;margin-top:8px;overflow:hidden;border-radius:999px;background:rgba(15,47,95,.12)}
.at-score-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transform-origin:left;animation:sk-grow-x 900ms var(--ease) 200ms backwards}
.at-retry{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;border:1px dashed #FFC999;border-radius:12px;background:var(--orange-tint)}
.at-retry p{margin:0;font-size:14px;color:#9A3412}
.at-feedback{margin-bottom:14px;padding:10px 13px;border-radius:10px;background:#F8FAFD;border:1px solid var(--line-2);font-size:13.5px;color:var(--muted)}

/* answer review (attempt tabs) */
.at-rv{overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#fff;animation:sk-swap .35s var(--ease) backwards}
.at-rv-tabs{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px;border-bottom:1px solid var(--line-2);background:#F8FAFD}
.at-rv-tab{padding:9px 16px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--navy);font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s ease,color .2s ease,border-color .2s ease,transform .2s var(--ease),box-shadow .2s ease}
.at-rv-tab:hover{border-color:#9DBBEA;background:var(--blue-tint);transform:translateY(-2px)}
.at-rv-tab:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.at-rv-tab.is-active{border-color:var(--navy);background:var(--navy);color:#fff;box-shadow:0 6px 14px rgba(15,47,95,.25)}
.at-rv-body{padding:18px;animation:sk-swap .35s var(--ease) backwards}
.at-rv-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px}
.at-rv-stat{padding:10px 12px;border:1px solid var(--line-2);border-radius:12px;background:#F8FAFD;transition:border-color .2s ease,transform .2s var(--ease)}
.at-rv-stat:hover{border-color:#BFD3F2;transform:translateY(-2px)}
.at-rv-stat span{display:block;margin-bottom:4px;font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--soft)}
.at-rv-stat strong{font-size:15px;color:var(--navy)}
.at-rv-title{margin-bottom:14px}
.at-rv-title h4{margin:0 0 4px;font-size:16px;color:var(--navy)}
.at-rv-title p{margin:0;font-size:13px;color:var(--muted)}
.at-rv-list{display:grid;gap:12px}
.at-rv-q{padding:16px;border:1px solid var(--line);border-radius:14px;background:#fff;animation:sk-swap .4s var(--ease) backwards;transition:border-color .2s ease,box-shadow .2s ease}
.at-rv-q:hover{border-color:#BFD3F2;box-shadow:0 8px 18px rgba(15,47,95,.07)}
.at-rv-q-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.at-rv-q-head>strong{font-size:15.5px;line-height:1.45;color:var(--navy)}
.at-rv-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:8px}
.at-rv-opt{display:flex;align-items:center;gap:10px;min-height:44px;padding:9px 13px;border:1px solid var(--line);border-radius:11px;background:#fff;font-size:14px;color:var(--navy);transition:border-color .2s ease,background .2s ease,transform .2s var(--ease)}
.at-rv-opt:hover{transform:translateX(3px)}
.at-rv-opt.is-picked{border-color:#9DBBEA;background:var(--blue-tint)}
.at-rv-opt.is-correct{border:2px solid #16A34A;background:#E8F6EE;color:#166534}
.at-rv-opt.is-wrong{border:2px solid var(--red);background:var(--red-tint);color:#9B1C1C}
.at-rv-tag{margin-left:4px;font-size:12px}
.at-rv-tag.is-ok{margin-left:auto}
.at-rv-foot{display:flex;flex-wrap:wrap;align-items:center;gap:6px 20px;margin-top:14px;font-size:13px;color:var(--muted)}
.at-rv-foot strong{color:var(--navy)}
.at-rv-foot .at-rv-ok{color:#15803D}
.at-rv-foot .at-rv-bad{color:var(--red)}

/* assignment */
.at-latest{margin-bottom:14px;padding:12px 14px;border:1px solid #BFE6CD;border-radius:14px;background:#F5FCF8;color:#166534;animation:sk-swap .35s var(--ease) backwards}
.at-latest.is-graded{border-color:#CFE0FA;background:var(--blue-tint);color:var(--navy)}
.at-latest-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
.at-latest-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px;margin-top:8px;font-size:13px;color:#475569}
.at-link{margin-left:8px;padding:0;border:0;background:transparent;color:var(--blue);font:inherit;font-weight:700;cursor:pointer}
.at-link:hover{text-decoration:underline;color:var(--orange)}
.at-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:100%;min-height:120px;padding:16px;border:2px dashed #BFCBDD;border-radius:14px;background:#FAFBFE;font:inherit;cursor:pointer;transition:border-color .25s ease,background .25s ease,transform .25s var(--ease)}
.at-drop:hover{border-color:var(--blue-2);background:var(--blue-tint);transform:translateY(-2px)}
.at-drop:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.at-drop-icon{width:46px;height:46px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;border-radius:50%;background:var(--blue-tint);color:var(--blue);transition:transform .3s var(--ease)}
.at-drop:hover .at-drop-icon{transform:translateY(-4px) scale(1.08)}
.at-drop strong{font-size:15px;color:var(--navy)}
.at-drop span{font-size:13px;color:var(--muted)}
.at-drop em{margin-top:3px;font-size:12px;font-style:normal;color:var(--soft)}
.at-file{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:#F9FBFF;animation:sk-swap .3s var(--ease) backwards}
.at-optional{font-weight:400;color:var(--soft)}

/* confirm */
.at-confirm{text-align:center;padding:26px 24px 12px}
.at-confirm-icon{width:50px;height:50px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border-radius:14px;background:var(--orange-tint);color:var(--orange);animation:sk-pop .4s var(--ease) backwards}
.at-confirm h2{margin:0;font-size:19px;color:var(--navy)}
.at-confirm-main{margin:10px 0 0;font-size:15px;font-weight:600;color:var(--navy)}
.at-confirm-warn{margin:4px 0 0;font-size:14px;font-weight:600;color:var(--orange-2)}
.at-confirm-ok{margin:4px 0 0;font-size:14px;font-weight:600;color:var(--green)}
.at-confirm-note{margin:10px 0 0;font-size:13px;color:var(--muted)}

/* responsive */
@media (max-width:1240px){
  .at-head,.at-row,.at-skel-row{grid-template-columns:40px 112px minmax(0,1.8fr) 100px 112px 124px 140px}
  .at-h-course,.at-c-course{display:none}
  .at-course-inline{display:block}
}
@media (max-width:1100px){.at-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){
      .at-hero-inner{flex-direction:column;align-items:stretch}
  .at-hero-action{align-items:stretch;min-width:0}
  .at-hero-action .sk-btn{width:100%}
  .at-hero-hint{display:none}
}
@media (max-width:820px){
  .at-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
  .at-head{display:none}
  .at-table{border:0;background:transparent;box-shadow:none;overflow:visible}
  .at-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"type status" "title title" "marks due" "action action";gap:8px 10px;margin-bottom:10px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,47,95,.04)}
  .at-row:last-child{border-bottom:1px solid var(--line);border-radius:14px}
  .at-row::before{display:none}
  .at-c-num{display:none}
  .at-c-type{grid-area:type}
  .at-c-status{grid-area:status;justify-self:end}
  .at-c-title{grid-area:title}
  .at-c-title strong{white-space:normal}
  .at-c-marks{grid-area:marks}
  .at-c-due{grid-area:due;justify-self:end}
  .at-c-action{grid-area:action}
  .at-c-action .sk-btn{width:100%}
  .at-skel-row{grid-template-columns:1fr 1fr;gap:10px}
  .at-options{grid-template-columns:minmax(0,1fr)}
  .at-result{flex-direction:column;align-items:flex-start}
  .at-score{text-align:left}
  .at-latest-grid{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:560px){
          .at-tiles{grid-template-columns:minmax(0,1fr)}
  .at-fs{flex:1 1 calc(50% - 5px)}
  .at-fs-btn{min-width:0;width:100%}
  .at-nav .sk-btn{flex:1}
  .at-nav-info{order:5;width:100%;margin:2px 0 0;text-align:center}
  .at-hero{padding:16px 16px 12px}
  .at-hero h2{font-size:20px}
  .at-hero-icon{width:54px;height:54px;flex-basis:54px}
}
@media (prefers-reduced-motion:reduce){
  .at-row,.at-step,.at-question,.at-result-wrap,.at-result-icon,.at-score-bar i,.at-fs-pop,.at-confirm-icon,.at-latest,.at-file,.at-hero,.at-hero-track i,.at-swap,.at-rv,.at-rv-body,.at-rv-q,.at-opt-mark{animation:none!important}
  .at-row,.at-opt,.at-dot,.at-bar span,.at-fs-btn,.at-fact,.at-rv-tab,.at-rv-q,.at-rv-opt,.at-rv-stat,.at-back{transition:none!important}
}
`;
