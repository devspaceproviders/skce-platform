"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Ban,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Hourglass,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sun,
  UserCircle,
  Users,
  Video,
  X,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type MeetingType =
  | "BATCH_MEETING"
  | "STUDENT_MEETING"
  | "INTERNAL_MEETING"
  | "ONE_TO_ONE"
  | "OTHER";

type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

type MeetingPlatform =
  | "GOOGLE_MEET"
  | "MICROSOFT_TEAMS"
  | "ZOOM"
  | "WHATSAPP"
  | "OTHER";

interface MeetingParticipant {
  id: number;
  userId: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface Meeting {
  id: number;
  organizerUserId: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  meetingUrl?: string | null;
  meetingPlatform?: MeetingPlatform | null;
  meetingType: MeetingType;
  status: MeetingStatus;
  courseId?: number | null;
  batchId?: number | null;
  organizer?: {
    id: number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  course?: {
    id: number;
    title?: string | null;
  } | null;
  batch?: {
    id: number;
    name?: string | null;
    displayId?: string | null;
  } | null;
  participants?: MeetingParticipant[];
  createdAt?: string;
  updatedAt?: string;
}

type CalendarMeeting = Omit<Meeting, "meetingType" | "status"> & {
  meetingType: MeetingType;
  status: MeetingStatus;
  calendarSource?: "MEETING";
  trainer?: {
    id: number;
    userId: number;
    name?: string | null;
    email?: string | null;
  } | null;
};

interface ApiResponse {
  success: boolean;
  data?: Meeting[];
  message?: string;
}
interface MeetingOptions {
  courses: Array<{ id: number; slug?: string | null; title: string }>;
  batches: Array<{ id: number; displayId?: string | null; name: string; courseId: number; course?: { id: number; slug?: string | null; title: string } | null; trainerId?: number | null; status?: string | null; startDate?: string | null; endDate?: string | null }>;
  students: Array<{ id: number; userId: number; studentId?: string | null; name: string; email: string; phone?: string | null; isActive: boolean }>;
  trainers: Array<{ id: number; userId: number; name: string; email: string; isActive: boolean }>;
}
interface MeetingFormState {
  title: string; description: string; meetingType: MeetingType; startAt: string; endAt: string; meetingUrl: string; meetingPlatform: MeetingPlatform; courseId: string; batchId: string; participantUserIds: number[];
}

type CalendarView = "month" | "week" | "day" | "agenda";

/* ------------------------------------------------------------------
 * Shared class strings (SKCE navy #0F2F5F, blue #1459B8, orange #FF6B00)
 * ------------------------------------------------------------------ */

const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40";

const INPUT =
  "w-full rounded-lg border border-[#D5DEEB] bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-[#BFD3F2] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15";

const LABEL = "mb-1.5 block text-sm font-semibold text-[#0F2F5F]";

const HOUR_HEIGHT = 72;

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function getCurrentUserId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const token = getToken();
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          decodeURIComponent(
            Array.from(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
              .map((character) =>
                `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`
              )
              .join("")
          )
        ) as Record<string, unknown>;

        const tokenUserId = Number(
          payload.userId ?? payload.id ?? payload.sub
        );

        if (Number.isInteger(tokenUserId) && tokenUserId > 0) {
          return tokenUserId;
        }
      }
    }
  } catch {
    // Fall back to the locally stored user object below.
  }

  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as Record<string, unknown>;
      const storedUserId = Number(parsed.userId ?? parsed.id);

      if (Number.isInteger(storedUserId) && storedUserId > 0) {
        return storedUserId;
      }
    }
  } catch {
    // Backend authorization remains the final permission check.
  }

  return null;
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token not found. Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    throw new Error("Authentication required. Please log in again.");
  }

  return response;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function getMeetingPlatformLabel(platform?: MeetingPlatform | null) {
  switch (platform) {
    case "GOOGLE_MEET":
      return "Google Meet";
    case "MICROSOFT_TEAMS":
      return "Microsoft Teams";
    case "ZOOM":
      return "Zoom";
    case "WHATSAPP":
      return "WhatsApp";
    case "OTHER":
      return "Other";
    default:
      return "Not specified";
  }
}

function getMeetingTypeLabel(type: MeetingType) {
  switch (type) {
    case "BATCH_MEETING":
      return "Batch Meeting";
    case "STUDENT_MEETING":
      return "Student Meeting";
    case "INTERNAL_MEETING":
      return "Internal Meeting";
    case "ONE_TO_ONE":
      return "One-to-One";
    case "OTHER":
      return "Other";
    default:
      return type;
  }
}

function getMeetingTypeIcon(type: MeetingType) {
  switch (type) {
    case "BATCH_MEETING":
      return Layers;
    case "STUDENT_MEETING":
    case "ONE_TO_ONE":
      return UserCircle;
    case "INTERNAL_MEETING":
      return Users;
    default:
      return CalendarDays;
  }
}

function getStatusClasses(status: MeetingStatus) {
  switch (status) {
    case "SCHEDULED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getOrganizerLabel(meeting: CalendarMeeting) {
  const organizer = meeting.organizer;

  if (!organizer) {
    return "Not available";
  }

  return organizer.name || organizer.email || "Not available";
}

function getOrganizerRole(meeting: CalendarMeeting) {
  return meeting.organizer?.role || "";
}

function getCalendarDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameCalendarDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getMinutesFromMidnight(dateString: string) {
  const date = new Date(dateString);
  return date.getHours() * 60 + date.getMinutes();
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isLiveMeeting(meeting: CalendarMeeting, nowMs: number) {
  return (
    meeting.status === "SCHEDULED" &&
    new Date(meeting.startAt).getTime() <= nowMs &&
    new Date(meeting.endAt).getTime() >= nowMs
  );
}

function getRelativeStart(meeting: CalendarMeeting, nowMs: number) {
  if (isLiveMeeting(meeting, nowMs)) {
    return "Live now";
  }

  const diff = new Date(meeting.startAt).getTime() - nowMs;

  if (diff < 0) {
    return "";
  }

  const mins = Math.round(diff / 60_000);

  if (mins < 1) return "Starting now";
  if (mins < 60) return `in ${mins} min`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    const rest = mins % 60;
    return rest ? `in ${hours} h ${rest} m` : `in ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

/* Calendar chip colours (status + live) */
function getChipClasses(meeting: CalendarMeeting, live: boolean) {
  if (meeting.status === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700 line-through decoration-red-300";
  }

  if (meeting.status === "COMPLETED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (live) {
    return "border-[#FFC999] bg-[#FFF3EA] text-[#B84A00]";
  }

  return "border-[#CFE0FA] bg-[#EAF1FD] text-[#0F2F5F]";
}

function getAccentClass(meeting: CalendarMeeting, live: boolean) {
  if (meeting.status === "CANCELLED") return "bg-red-400";
  if (meeting.status === "COMPLETED") return "bg-slate-400";
  if (live) return "bg-[#FF6B00]";
  return "bg-[#1459B8]";
}

/* Lays out overlapping events side by side (like Google Calendar). */
function layoutDayEvents(list: CalendarMeeting[]) {
  const sorted = [...list].sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
      new Date(a.endAt).getTime() - new Date(b.endAt).getTime()
  );

  type Placed = { meeting: CalendarMeeting; col: number; cols: number };

  const result: Placed[] = [];
  let cluster: Placed[] = [];
  let colEnds: number[] = [];
  let clusterEnd = 0;

  const flush = () => {
    const cols = colEnds.length || 1;
    cluster.forEach((item) => {
      item.cols = cols;
    });
    result.push(...cluster);
    cluster = [];
    colEnds = [];
    clusterEnd = 0;
  };

  for (const meeting of sorted) {
    const start = new Date(meeting.startAt).getTime();
    const end = Math.max(new Date(meeting.endAt).getTime(), start + 30 * 60_000);

    if (cluster.length > 0 && start >= clusterEnd) {
      flush();
    }

    let col = colEnds.findIndex((value) => value <= start);

    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else {
      colEnds[col] = end;
    }

    clusterEnd = Math.max(clusterEnd, end);
    cluster.push({ meeting, col, cols: 1 });
  }

  flush();

  return result;
}

/* ------------------------------------------------------------------
 * Small UI pieces
 * ------------------------------------------------------------------ */

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - startedAt) / 800, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setShown(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown}</>;
}

function StatCard({
  index,
  icon: Icon,
  label,
  value,
  helper,
  tone,
  loading,
}: {
  index: number;
  icon: typeof CalendarDays;
  label: string;
  value: number;
  helper: string;
  tone: "blue" | "green" | "orange" | "navy";
  loading: boolean;
}) {
  const tones = {
    blue: { box: "bg-[#EAF1FD] text-[#1459B8]", bar: "from-[#1459B8] to-[#2563EB]" },
    green: { box: "bg-emerald-50 text-emerald-600", bar: "from-emerald-500 to-emerald-400" },
    orange: { box: "bg-[#FFF3EA] text-[#FF6B00]", bar: "from-[#FF6B00] to-[#FFA24D]" },
    navy: { box: "bg-[#E6ECF5] text-[#0F2F5F]", bar: "from-[#0F2F5F] to-[#1459B8]" },
  }[tone];

  return (
    <div
      className="cal-fade-up cal-lift group relative overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white p-5 shadow-[0_1px_2px_rgba(15,47,95,0.04)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tones.bar} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <div className="cal-shimmer mt-3 h-8 w-14 rounded" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F2F5F]">
              <AnimatedNumber value={value} />
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <div
          className={`cal-stat-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones.box}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ModalShell({
  label,
  maxWidth,
  locked = false,
  backdropClose = true,
  onClose,
  children,
}: {
  label: string;
  maxWidth: string;
  locked?: boolean;
  backdropClose?: boolean;
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);

  onCloseRef.current = onClose;
  lockedRef.current = locked;

  const requestClose = useCallback(() => {
    if (closingRef.current || lockedRef.current) {
      return;
    }

    closingRef.current = true;
    setClosing(true);
    window.setTimeout(() => onCloseRef.current(), 160);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [requestClose]);

  return (
    <div
      data-closing={closing}
      className="cal-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-[#0F2F5F]/55 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (backdropClose && event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`cal-modal-in flex max-h-[94vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_28px_70px_rgba(15,47,95,0.35)] outline-none sm:rounded-2xl`}
      >
        {children(requestClose)}
      </div>
    </div>
  );
}

function ModalHead({
  badges,
  title,
  subtitle,
  onClose,
  closeLabel,
  disabled,
}: {
  badges: ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="cal-head-accent relative flex shrink-0 items-start justify-between gap-4 bg-[linear-gradient(120deg,#0F2F5F_0%,#123B6D_55%,#1459B8_100%)] px-5 pb-5 pt-5 text-white sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">{badges}</div>
        <h2 className="mt-2.5 break-words text-xl font-bold sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 max-w-xl text-sm text-blue-100/80">{subtitle}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        aria-label={closeLabel}
        className={`group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
      >
        <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
      </button>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="cal-lift rounded-xl border border-[#E2E8F1] bg-white p-4 hover:border-[#BFD3F2]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span className="text-[#FF6B00]/80">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[#0F2F5F]">{children}</div>
    </div>
  );
}

export default function TrainerCalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Page-level errors are only for loading/refreshing the calendar itself.
  // Form and meeting-action errors stay inside their respective modals.
  const [error, setError] = useState("");

  const [selectedMeeting, setSelectedMeeting] =
    useState<CalendarMeeting | null>(null);
  const [selectedMeetingError, setSelectedMeetingError] = useState("");
  const [cancellingMeeting, setCancellingMeeting] = useState(false);
  const [confirmMeeting, setConfirmMeeting] =
    useState<CalendarMeeting | null>(null);

  // UltraViewer is used as an optional remote-control tool alongside
  // the normal meeting. The student supplies the current UltraViewer
  // ID/password at meeting time; the password is never persisted.
  const [remoteAssistId, setRemoteAssistId] = useState("");
  const [remoteAssistPassword, setRemoteAssistPassword] = useState("");
  const [showRemoteAssistPassword, setShowRemoteAssistPassword] =
    useState(false);
  const [remoteAssistMessage, setRemoteAssistMessage] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] =
    useState<CalendarMeeting | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [formError, setFormError] = useState("");

  const [meetingOptions, setMeetingOptions] =
    useState<MeetingOptions | null>(null);

  const [form, setForm] = useState<MeetingFormState>({
    title: "",
    description: "",
    meetingType: "BATCH_MEETING",
    startAt: "",
    endAt: "",
    meetingUrl: "",
    meetingPlatform: "OTHER",
    courseId: "",
    batchId: "",
    participantUserIds: [],
  });

  // One shared "focus" date drives month, week, day and agenda views.
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [navDir, setNavDir] = useState<"next" | "prev" | "none">("none");
  const [hiddenStatuses, setHiddenStatuses] = useState<MeetingStatus[]>([]);
  const [now, setNow] = useState(() => new Date());

  const [toast, setToast] = useState<{
    id: number;
    kind: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const agendaTodayRef = useRef<HTMLDivElement | null>(null);

  /* ---------- toast + clock ---------- */

  const notify = useCallback(
    (kind: "success" | "error" | "info", text: string) => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }

      setToast({ id: Date.now(), kind, text });
      toastTimer.current = window.setTimeout(() => setToast(null), 4200);
    },
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);

    return () => {
      window.clearInterval(interval);

      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  /* ---------- form helpers ---------- */

  function resetMeetingForm() {
    setForm({
      title: "",
      description: "",
      meetingType: "BATCH_MEETING",
      startAt: "",
      endAt: "",
      meetingUrl: "",
      meetingPlatform: "OTHER",
      courseId: "",
      batchId: "",
      participantUserIds: [],
    });
    setFormError("");
  }

  async function loadMeetingOptions() {
    try {
      setOptionsLoading(true);

      const response = await authenticatedFetch(
        `${API_URL}/trainer/meetings/options`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load meeting options."
        );
      }

      setMeetingOptions(result.data);
    } catch (err) {
      console.error("Failed to load trainer meeting options:", err);
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to load meeting options."
      );
    } finally {
      setOptionsLoading(false);
    }
  }

  function clearRemoteAssist() {
    setRemoteAssistId("");
    setRemoteAssistPassword("");
    setShowRemoteAssistPassword(false);
    setRemoteAssistMessage("");
  }

  async function openCreateMeetingModal(preset?: Date) {
    setSelectedMeeting(null);
    setSelectedMeetingError("");
    setEditingMeeting(null);
    setError("");
    setFormError("");
    clearRemoteAssist();

    let startAt = "";
    let endAt = "";

    if (preset) {
      const start = new Date(preset);
      const today = new Date();

      if (isSameCalendarDay(start, today)) {
        start.setHours(today.getHours() + 1, 0, 0, 0);
      } else {
        start.setHours(10, 0, 0, 0);
      }

      startAt = toDateTimeLocalValue(start);
      endAt = toDateTimeLocalValue(new Date(start.getTime() + 60 * 60_000));
    }

    setForm({
      title: "",
      description: "",
      meetingType: "BATCH_MEETING",
      startAt,
      endAt,
      meetingUrl: "",
      meetingPlatform: "OTHER",
      courseId: "",
      batchId: "",
      participantUserIds: [],
    });

    setShowCreateModal(true);

    if (!meetingOptions) {
      await loadMeetingOptions();
    }
  }

  function openEditMeetingModal(meeting: CalendarMeeting) {
    if (meeting.status !== "SCHEDULED") {
      return;
    }

    const currentUserId = getCurrentUserId();

    if (
      currentUserId !== null &&
      meeting.organizerUserId !== currentUserId
    ) {
      setSelectedMeetingError(
        "Only the trainer who organized this meeting can update or cancel it."
      );
      return;
    }

    setSelectedMeeting(null);
    setSelectedMeetingError("");
    setError("");
    setFormError("");
    clearRemoteAssist();
    setEditingMeeting(meeting);

    setForm({
      title: meeting.title || "",
      description: meeting.description || "",
      meetingType: meeting.meetingType,
      startAt: toDateTimeLocalValue(new Date(meeting.startAt)),
      endAt: toDateTimeLocalValue(new Date(meeting.endAt)),
      meetingUrl: meeting.meetingUrl || "",
      meetingPlatform: meeting.meetingPlatform || "OTHER",
      courseId: meeting.courseId ? String(meeting.courseId) : "",
      batchId: meeting.batchId ? String(meeting.batchId) : "",
      participantUserIds:
        meeting.participants?.map((participant) => participant.userId) || [],
    });

    setShowCreateModal(true);

    if (!meetingOptions) {
      void loadMeetingOptions();
    }
  }

  function closeCreateMeetingModal() {
    if (savingMeeting) {
      return;
    }

    setShowCreateModal(false);
    setEditingMeeting(null);
    resetMeetingForm();
  }

  function closeSelectedMeetingModal() {
    if (cancellingMeeting) {
      return;
    }

    setSelectedMeeting(null);
    setSelectedMeetingError("");
    clearRemoteAssist();
  }

  async function copyRemoteAssistValue(
    value: string,
    label: string
  ) {
    if (!value.trim()) {
      setRemoteAssistMessage(`${label} is empty.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value.trim());
      setRemoteAssistMessage(`${label} copied.`);
    } catch {
      setRemoteAssistMessage(`Unable to copy ${label.toLowerCase()}.`);
    }
  }

  async function prepareRemoteAssistance() {
    const id = remoteAssistId.trim();
    const password = remoteAssistPassword.trim();

    if (!id) {
      setRemoteAssistMessage(
        "Enter the student's current UltraViewer ID first."
      );
      return;
    }

    if (!password) {
      setRemoteAssistMessage(
        "Enter the student's current UltraViewer password first."
      );
      return;
    }

    try {
      const command = `UltraViewer_Desktop.exe -i:${id} -p:${password}`;
      await navigator.clipboard.writeText(command);
      setRemoteAssistMessage(
        "UltraViewer connection command copied. Open UltraViewer, or paste the command in Windows Command Prompt if command-line support is available on your installed version."
      );
      window.open(
        "https://www.ultraviewer.net/en/download.html",
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      setRemoteAssistMessage(
        "Unable to prepare the UltraViewer connection command."
      );
    }
  }

  function toggleParticipant(userId: number) {
    setFormError("");

    setForm((current) => {
      if (current.meetingType === "ONE_TO_ONE") {
        return {
          ...current,
          participantUserIds: [userId],
        };
      }

      const exists = current.participantUserIds.includes(userId);

      return {
        ...current,
        participantUserIds: exists
          ? current.participantUserIds.filter((id) => id !== userId)
          : [...current.participantUserIds, userId],
      };
    });
  }

  function setStartAt(value: string) {
    setFormError("");

    setForm((current) => {
      let endAt = current.endAt;

      if (value) {
        const start = new Date(value);
        const end = current.endAt ? new Date(current.endAt) : null;

        if (!end || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
          endAt = toDateTimeLocalValue(new Date(start.getTime() + 60 * 60_000));
        }
      }

      return { ...current, startAt: value, endAt };
    });
  }

  function setDuration(minutes: number) {
    if (!form.startAt) {
      setFormError("Choose a start time first.");
      return;
    }

    const start = new Date(form.startAt);

    if (Number.isNaN(start.getTime())) {
      return;
    }

    setFormError("");
    setForm((current) => ({
      ...current,
      endAt: toDateTimeLocalValue(new Date(start.getTime() + minutes * 60_000)),
    }));
  }

  /* Shared validation for create + update (same messages as before). */
  function validateMeetingForm(): string | null {
    if (!form.title.trim()) {
      return "Meeting title is required.";
    }

    if (!form.startAt || !form.endAt) {
      return "Start time and end time are required.";
    }

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Please enter valid start and end times.";
    }

    if (end.getTime() <= start.getTime()) {
      return "End time must be after start time.";
    }

    if (
      form.meetingUrl.trim() &&
      !/^https?:\/\//i.test(form.meetingUrl.trim())
    ) {
      return "Meeting URL must start with http:// or https://.";
    }

    if (
      (form.meetingType === "BATCH_MEETING" ||
        form.meetingType === "STUDENT_MEETING") &&
      !form.batchId
    ) {
      return "Please select a batch for this meeting type.";
    }

    if (
      form.meetingType === "ONE_TO_ONE" &&
      form.participantUserIds.length !== 1
    ) {
      return "Please select exactly one student.";
    }

    if (
      form.meetingType === "STUDENT_MEETING" &&
      form.participantUserIds.length === 0
    ) {
      return "Please select at least one student.";
    }

    if (
      form.meetingType === "INTERNAL_MEETING" &&
      form.participantUserIds.length === 0
    ) {
      return "Please select at least one trainer.";
    }

    return null;
  }

  async function handleSubmitMeeting(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setFormError("");
    setError("");

    const problem = validateMeetingForm();

    if (problem) {
      setFormError(problem);
      return;
    }

    const isEditing = Boolean(editingMeeting);
    const start = new Date(form.startAt);
    const end = new Date(form.endAt);

    try {
      setSavingMeeting(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        meetingUrl: form.meetingUrl.trim() || null,
        meetingPlatform: form.meetingPlatform,
        meetingType: form.meetingType,
        status: editingMeeting ? editingMeeting.status : "SCHEDULED",
        courseId: form.courseId ? Number(form.courseId) : null,
        batchId: form.batchId ? Number(form.batchId) : null,
        participantUserIds:
          isEditing && form.meetingType === "BATCH_MEETING"
            ? []
            : form.participantUserIds,
      };

      const response = await authenticatedFetch(
        isEditing
          ? `${API_URL}/trainer/meetings/${editingMeeting!.id}`
          : `${API_URL}/trainer/meetings`,
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 409) {
          setFormError(
            result.message ||
              "The selected time conflicts with another scheduled meeting. Change the time, participant, or batch and try again."
          );
          return;
        }

        throw new Error(
          result.message ||
            (isEditing
              ? "Failed to update the meeting."
              : "Failed to schedule the meeting.")
        );
      }

      setShowCreateModal(false);
      setEditingMeeting(null);
      resetMeetingForm();
      notify(
        "success",
        isEditing ? "Meeting updated successfully." : "Meeting scheduled successfully."
      );
      await loadCalendar(true);
    } catch (err) {
      console.error("Save trainer meeting error:", err);

      setFormError(
        err instanceof Error
          ? err.message
          : isEditing
          ? "Failed to update the meeting."
          : "Failed to schedule the meeting."
      );
    } finally {
      setSavingMeeting(false);
    }
  }

  /* Cancel = organizer check -> in-app confirm -> API call. */
  function requestCancelMeeting(meeting: CalendarMeeting) {
    if (meeting.status !== "SCHEDULED") {
      return;
    }

    const currentUserId = getCurrentUserId();

    if (
      currentUserId !== null &&
      meeting.organizerUserId !== currentUserId
    ) {
      setSelectedMeetingError(
        "Only the trainer who organized this meeting can update or cancel it."
      );
      return;
    }

    setConfirmMeeting(meeting);
  }

  async function performCancelMeeting() {
    const meeting = confirmMeeting;

    if (!meeting) {
      return;
    }

    try {
      setCancellingMeeting(true);
      setSelectedMeetingError("");
      setError("");

      const response = await authenticatedFetch(
        `${API_URL}/trainer/meetings/${meeting.id}/cancel`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to cancel the meeting."
        );
      }

      setConfirmMeeting(null);
      setSelectedMeeting(
        result.data || {
          ...meeting,
          status: "CANCELLED",
        }
      );
      notify("success", "Meeting cancelled.");

      await loadCalendar(true);
    } catch (err) {
      console.error("Cancel trainer meeting error:", err);

      setConfirmMeeting(null);
      setSelectedMeetingError(
        err instanceof Error
          ? err.message
          : "Failed to cancel the meeting."
      );
    } finally {
      setCancellingMeeting(false);
    }
  }

  const loadCalendar = useCallback(async (showRefresh = false) => {
    let ok = true;

    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const meetingResponse = await authenticatedFetch(
        `${API_URL}/trainer/meetings`
      );
      const meetingResult: ApiResponse = await meetingResponse.json();

      if (!meetingResponse.ok || !meetingResult.success) {
        throw new Error(
          meetingResult.message || "Failed to load trainer calendar meetings."
        );
      }

      setMeetings(
        Array.isArray(meetingResult.data) ? meetingResult.data : []
      );
    } catch (err) {
      ok = false;
      console.error("Failed to load trainer calendar:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load trainer calendar."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    return ok;
  }, []);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  async function handleRefresh() {
    const ok = await loadCalendar(true);

    if (ok) {
      notify("success", "Calendar refreshed.");
    }
  }

  /* ---------- derived data ---------- */

  const calendarMeetings = useMemo<CalendarMeeting[]>(() => meetings, [meetings]);

  const sortedCalendarMeetings = useMemo(
    () =>
      [...calendarMeetings].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [calendarMeetings]
  );

  /* Status chips can hide meetings from the calendar views. */
  const visibleMeetings = useMemo(
    () =>
      sortedCalendarMeetings.filter(
        (meeting) => !hiddenStatuses.includes(meeting.status)
      ),
    [sortedCalendarMeetings, hiddenStatuses]
  );

  const upcomingMeetings = useMemo(() => {
    const nowMs = now.getTime();

    return sortedCalendarMeetings.filter(
      (meeting) =>
        meeting.status === "SCHEDULED" &&
        new Date(meeting.endAt).getTime() >= nowMs
    );
  }, [sortedCalendarMeetings, now]);


  const todayMeetings = useMemo(
    () =>
      sortedCalendarMeetings.filter((meeting) =>
        isSameCalendarDay(new Date(meeting.startAt), now)
      ),
    [sortedCalendarMeetings, now]
  );

  const scheduledCount = meetings.filter(
    (meeting) => meeting.status === "SCHEDULED"
  ).length;

  const completedCount = meetings.filter(
    (meeting) => meeting.status === "COMPLETED"
  ).length;

  const cancelledCount = meetings.filter(
    (meeting) => meeting.status === "CANCELLED"
  ).length;

  const calendarMonth = useMemo(
    () => new Date(focusDate.getFullYear(), focusDate.getMonth(), 1),
    [focusDate]
  );

  const calendarMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(calendarMonth),
    [calendarMonth]
  );

  const calendarDays = useMemo(() => {
    const start = new Date(calendarMonth);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [calendarMonth]);

  const meetingsByCalendarDay = useMemo(() => {
    const grouped = new Map<string, CalendarMeeting[]>();

    for (const meeting of visibleMeetings) {
      const key = getCalendarDayKey(new Date(meeting.startAt));
      const existing = grouped.get(key) || [];
      existing.push(meeting);
      grouped.set(key, existing);
    }

    return grouped;
  }, [visibleMeetings]);

  const agendaDates = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const grouped = new Map<string, CalendarMeeting[]>();

    for (const meeting of visibleMeetings) {
      const date = new Date(meeting.startAt);

      if (date.getFullYear() !== year || date.getMonth() !== month) {
        continue;
      }

      const key = getCalendarDayKey(date);
      const existing = grouped.get(key) || [];
      existing.push(meeting);
      grouped.set(key, existing);
    }

    if (
      now.getFullYear() === year &&
      now.getMonth() === month
    ) {
      const todayKey = getCalendarDayKey(now);

      if (!grouped.has(todayKey)) {
        grouped.set(todayKey, []);
      }
    }

    return Array.from(grouped.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [visibleMeetings, calendarMonth, now]);

  const calendarWeekStart = useMemo(() => {
    const start = new Date(focusDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }, [focusDate]);

  const calendarWeekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => addDays(calendarWeekStart, index)),
    [calendarWeekStart]
  );

  const calendarWeekLabel = useMemo(() => {
    const start = calendarWeekDays[0];
    const end = calendarWeekDays[6];

    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return `${new Intl.DateTimeFormat("en-IN", {
        month: "short",
      }).format(start)} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
    }).format(start)} – ${new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(end)}`;
  }, [calendarWeekDays]);

  const calendarDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(focusDate),
    [focusDate]
  );

  function getMeetingsForCalendarDay(date: Date) {
    return meetingsByCalendarDay.get(getCalendarDayKey(date)) || [];
  }

  /* The time grid grows when a meeting falls outside 8:00 - 21:00. */
  const hourRange = useMemo(() => {
    const days = calendarView === "week" ? calendarWeekDays : [focusDate];
    let startHour = 8;
    let endHour = 21;

    for (const day of days) {
      for (const meeting of meetingsByCalendarDay.get(getCalendarDayKey(day)) || []) {
        const startMinutes = getMinutesFromMidnight(meeting.startAt);
        let endMinutes = getMinutesFromMidnight(meeting.endAt);

        if (endMinutes <= startMinutes) {
          endMinutes = 24 * 60;
        }

        startHour = Math.min(startHour, Math.floor(startMinutes / 60));
        endHour = Math.max(endHour, Math.ceil(endMinutes / 60));
      }
    }

    return { startHour, endHour: Math.min(endHour, 24) };
  }, [calendarView, calendarWeekDays, focusDate, meetingsByCalendarDay]);

  const hourRows = useMemo(
    () =>
      Array.from(
        { length: hourRange.endHour - hourRange.startHour },
        (_, index) => hourRange.startHour + index
      ),
    [hourRange]
  );

  const rangeStartMinutes = hourRange.startHour * 60;
  const rangeEndMinutes = hourRange.endHour * 60;
  const gridHeight = hourRows.length * HOUR_HEIGHT;

  function getEventBoxStyle(
    meeting: CalendarMeeting,
    col: number,
    cols: number
  ) {
    const startMinutes = getMinutesFromMidnight(meeting.startAt);
    let endMinutes = getMinutesFromMidnight(meeting.endAt);

    if (endMinutes <= startMinutes) {
      endMinutes = 24 * 60;
    }

    const visibleStart = Math.max(startMinutes, rangeStartMinutes);
    const visibleEnd = Math.min(endMinutes, rangeEndMinutes);

    const top = ((visibleStart - rangeStartMinutes) / 60) * HOUR_HEIGHT;
    const height = Math.max(
      44,
      ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT - 2
    );
    const width = 100 / cols;

    return {
      top: `${top + 1}px`,
      height: `${height}px`,
      left: `calc(${col * width}% + 3px)`,
      width: `calc(${width}% - 6px)`,
    };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowLineTop =
    nowMinutes >= rangeStartMinutes && nowMinutes <= rangeEndMinutes
      ? ((nowMinutes - rangeStartMinutes) / 60) * HOUR_HEIGHT
      : null;

  /* ---------- navigation ---------- */

  function goToPeriod(direction: 1 | -1) {
    setNavDir(direction === 1 ? "next" : "prev");

    setFocusDate((current) => {
      if (calendarView === "month" || calendarView === "agenda") {
        return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      }

      return addDays(current, (calendarView === "week" ? 7 : 1) * direction);
    });
  }

  function goToCurrentPeriod() {
    setNavDir("none");
    setFocusDate(new Date());

    if (calendarView === "agenda") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          agendaTodayRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      });
    }
  }

  function handleCalendarViewChange(view: CalendarView) {
    setNavDir("none");
    setCalendarView(view);
  }

  function openDay(date: Date) {
    setNavDir("none");
    setFocusDate(date);
    setCalendarView("day");
  }

  function toggleStatus(status: MeetingStatus) {
    setHiddenStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );
  }

  const bodyKey =
    calendarView === "week"
      ? `week-${getCalendarDayKey(calendarWeekStart)}`
      : calendarView === "day"
      ? `day-${getCalendarDayKey(focusDate)}`
      : `${calendarView}-${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`;

  const bodyAnim =
    navDir === "next"
      ? "cal-slide-next"
      : navDir === "prev"
      ? "cal-slide-prev"
      : "cal-view-in";

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const nowMs = now.getTime();

  /* ---------- reusable renderers ---------- */

  function renderTimeColumn() {
    return hourRows.map((hour) => (
      <div
        key={hour}
        className="flex h-[72px] items-start justify-end border-b border-[#E7EDF6] px-2 pt-1 text-[10px] font-medium text-slate-400"
      >
        {new Intl.DateTimeFormat("en-IN", {
          hour: "numeric",
        }).format(new Date(2026, 0, 1, hour, 0))}
      </div>
    ));
  }

  function renderEventColumn(date: Date, wide: boolean) {
    const dayMeetings = getMeetingsForCalendarDay(date);
    const isToday = isSameCalendarDay(date, now);
    const placed = layoutDayEvents(dayMeetings);

    return (
      <div
        className={`relative ${isToday ? "bg-[#FFF8F2]/60" : "bg-white"}`}
        style={{ height: `${gridHeight}px` }}
      >
        {hourRows.map((hour) => (
          <div
            key={hour}
            className="h-[72px] border-b border-[#E7EDF6] transition-colors duration-200 hover:bg-[#F5F9FF]"
          />
        ))}

        {placed.map(({ meeting, col, cols }, index) => {
          const live = isLiveMeeting(meeting, nowMs);

          return (
            <button
              key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
              type="button"
              onClick={() => setSelectedMeeting(meeting)}
              className={`cal-event cal-row-in absolute overflow-hidden rounded-lg border py-1.5 pl-3 pr-2 text-left shadow-sm ${getChipClasses(
                meeting,
                live
              )} ${wide ? "text-xs" : "text-[10px]"} font-medium`}
              style={{
                ...getEventBoxStyle(meeting, col, cols),
                animationDelay: `${Math.min(index, 8) * 40}ms`,
              }}
              title={`${meeting.title} • ${formatTime(meeting.startAt)} – ${formatTime(
                meeting.endAt
              )}`}
            >
              <span
                className={`absolute inset-y-1.5 left-1 w-1 rounded-full ${getAccentClass(
                  meeting,
                  live
                )}`}
              />
              <div className="flex items-center gap-1 truncate font-semibold">
                {live && (
                  <span className="cal-live-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
                )}
                <span className="truncate">
                  {wide
                    ? meeting.title
                    : `${formatTime(meeting.startAt)} ${meeting.title}`}
                </span>
              </div>
              <div className="mt-0.5 truncate opacity-80">
                {wide
                  ? `${formatTime(meeting.startAt)} – ${formatTime(meeting.endAt)}`
                  : getMeetingTypeLabel(meeting.meetingType)}
              </div>
            </button>
          );
        })}

        {isToday && nowLineTop !== null && (
          <div
            className="cal-now-line pointer-events-none absolute inset-x-0 z-10"
            style={{ top: `${nowLineTop}px` }}
          />
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */

  return (
    <main className="cal-page min-h-screen bg-[#F7F9FC]">
      {/* Toast */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`cal-toast-in fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-[0_16px_40px_rgba(15,47,95,0.2)] ${
            toast.kind === "success"
              ? "border-emerald-200"
              : toast.kind === "error"
              ? "border-red-200"
              : "border-[#CFE0FA]"
          }`}
        >
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              toast.kind === "success"
                ? "bg-emerald-50 text-emerald-600"
                : toast.kind === "error"
                ? "bg-red-50 text-red-600"
                : "bg-[#EAF1FD] text-[#1459B8]"
            }`}
          >
            {toast.kind === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
          </div>
          <p className="text-sm font-medium text-[#0F2F5F]">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-1 shrink-0 text-slate-400 transition hover:text-slate-700"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ============ HERO ============ */}
      <header className="cal-hero relative overflow-hidden text-white">
        <div className="relative mx-auto max-w-[1600px] px-4 pb-4 pt-4 sm:px-6 lg:px-8">
          <div className="cal-fade-up flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
                <CalendarDays size={24} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFB070]">
                  Trainer workspace
                </p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
                  Calendar
                </h1>
                <p className="mt-0.5 text-sm text-blue-100/80">
                  View your meetings and batch activities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void openCreateMeetingModal()}
                className={`cal-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white ${FOCUS}`}
              >
                <Plus size={17} />
                Create Meeting
              </button>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={refreshing}
                className={`cal-btn-glass inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : "cal-refresh-icon"}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {!showCreateModal && !selectedMeeting && error && (
          <div
            role="alert"
            className="cal-fade-up flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start"
          >
            <div className="flex flex-1 items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to load the calendar
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">{error}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void loadCalendar()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition duration-200 hover:-translate-y-px hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                <RefreshCw size={14} />
                Retry
              </button>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-md p-1.5 text-red-400 transition hover:bg-red-100 hover:text-red-700"
                aria-label="Close error"
              >
                <XCircle size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ============ STAT CARDS ============ */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} icon={CalendarDays} label="Total Meetings" value={meetings.length} helper="All scheduled and past" tone="blue" loading={loading} />
          <StatCard index={1} icon={CheckCircle2} label="Scheduled" value={scheduledCount} helper="Still to happen" tone="green" loading={loading} />
          <StatCard index={2} icon={Sun} label="Today's Events" value={todayMeetings.length} helper="Happening today" tone="orange" loading={loading} />
          <StatCard index={3} icon={Hourglass} label="Upcoming" value={upcomingMeetings.length} helper="Next on your calendar" tone="navy" loading={loading} />
        </section>

        {/* ============ CALENDAR ============ */}
        <section>
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0F2F5F]">Calendar</h2>
              <p className="mt-1 text-sm text-slate-500">
                View meetings by month, week, day, or agenda. Click an empty day to schedule.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-[#E2E8F1] bg-white p-1 shadow-sm">
                {(["month", "week", "day", "agenda"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => handleCalendarViewChange(view)}
                    aria-pressed={calendarView === view}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize transition-all duration-200 ${FOCUS} ${
                      calendarView === view
                        ? "bg-[#1459B8] text-white shadow-[0_6px_14px_rgba(20,89,184,0.28)]"
                        : "text-slate-600 hover:bg-[#EAF1FD] hover:text-[#1459B8]"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goToCurrentPeriod}
                className={`cal-btn-secondary rounded-xl border border-[#E2E8F1] bg-white px-4 py-2 text-sm font-semibold text-[#1459B8] ${FOCUS}`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => goToPeriod(-1)}
                className={`cal-btn-secondary flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F1] bg-white text-slate-600 ${FOCUS}`}
                aria-label="Previous period"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => goToPeriod(1)}
                className={`cal-btn-secondary flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F1] bg-white text-slate-600 ${FOCUS}`}
                aria-label="Next period"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Status legend / filter chips */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(
              [
                ["SCHEDULED", "Scheduled", scheduledCount, "bg-[#1459B8]"],
                ["COMPLETED", "Completed", completedCount, "bg-slate-400"],
                ["CANCELLED", "Cancelled", cancelledCount, "bg-red-400"],
              ] as const
            ).map(([status, label, count, dot]) => {
              const hidden = hiddenStatuses.includes(status);

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  aria-pressed={!hidden}
                  title={hidden ? `Show ${label.toLowerCase()} meetings` : `Hide ${label.toLowerCase()} meetings`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 hover:-translate-y-px ${FOCUS} ${
                    hidden
                      ? "border-[#E2E8F1] bg-white text-slate-400 line-through"
                      : "border-[#CFE0FA] bg-[#EAF1FD] text-[#0F2F5F]"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${hidden ? "bg-slate-300" : dot}`} />
                  {label}
                  <span className="rounded-full bg-white px-1.5 text-[10px] text-slate-500">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            key={bodyKey}
            className={bodyAnim}
          >
            {loading ? (
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white shadow-sm" aria-busy="true">
                <div className="border-b border-[#E2E8F1] px-4 py-5">
                  <div className="cal-shimmer mx-auto h-4 w-40 rounded" />
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: 28 }, (_, index) => (
                    <div key={index} className="min-h-[96px] border-b border-r border-[#EDF1F7] p-2">
                      <div className="cal-shimmer h-6 w-6 rounded-full" />
                    </div>
                  ))}
                </div>
                <span className="sr-only">Loading calendar...</span>
              </div>
            ) : calendarView === "month" ? (
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04),0_4px_14px_rgba(15,47,95,0.03)]">
                <div className="flex items-center justify-center border-b border-[#E2E8F1] px-4 py-4">
                  <h3 className="text-lg font-bold text-[#0F2F5F]">
                    {calendarMonthLabel}
                  </h3>
                </div>

                <div className="grid grid-cols-7 border-b border-[#E2E8F1] bg-[linear-gradient(180deg,#F5F9FF_0%,#EEF4FD_100%)]">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="border-r border-[#E2E8F1] px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-[#0F2F5F] last:border-r-0"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((date, index) => {
                    const isCurrentMonth =
                      date.getMonth() === calendarMonth.getMonth() &&
                      date.getFullYear() === calendarMonth.getFullYear();

                    const isToday = isSameCalendarDay(date, now);
                    const isPast = date.getTime() < startOfToday.getTime();
                    const dayMeetings = getMeetingsForCalendarDay(date);

                    return (
                      <div
                        key={getCalendarDayKey(date)}
                        className={`cal-cell cal-row-in group relative min-h-[92px] border-b border-r border-[#EDF1F7] p-1.5 sm:min-h-[128px] sm:p-2 [&:nth-child(7n)]:border-r-0 ${
                          isToday
                            ? "bg-[#FFF8F2]"
                            : isCurrentMonth
                            ? "bg-white"
                            : "bg-[#F8FAFD]"
                        }`}
                        style={{ animationDelay: `${Math.min(index, 20) * 12}ms` }}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => openDay(date)}
                            aria-label={`Open ${formatDate(date.toISOString())}`}
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition duration-200 hover:scale-110 ${FOCUS} ${
                              isToday
                                ? "bg-[#FF6B00] text-white shadow-[0_4px_10px_rgba(255,107,0,0.35)]"
                                : isCurrentMonth
                                ? "text-[#0F2F5F] hover:bg-[#EAF1FD]"
                                : "text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {date.getDate()}
                          </button>

                          <div className="flex items-center gap-1">
                            {dayMeetings.length > 0 && (
                              <span className="rounded-full bg-[#EAF1FD] px-1.5 text-[10px] font-bold text-[#1459B8]">
                                {dayMeetings.length}
                              </span>
                            )}
                            {!isPast && (
                              <button
                                type="button"
                                onClick={() => void openCreateMeetingModal(date)}
                                aria-label="Schedule a meeting on this day"
                                title="Schedule a meeting"
                                className={`cal-add flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00] text-white shadow-sm ${FOCUS}`}
                              >
                                <Plus size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* chips on tablet / desktop */}
                        <div className="hidden space-y-1 sm:block">
                          {dayMeetings.slice(0, 3).map((meeting) => {
                            const live = isLiveMeeting(meeting, nowMs);

                            return (
                              <button
                                key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                                type="button"
                                onClick={() => setSelectedMeeting(meeting)}
                                className={`cal-chip relative block w-full truncate rounded-md border py-1.5 pl-3 pr-2 text-left text-[11px] font-medium ${getChipClasses(
                                  meeting,
                                  live
                                )}`}
                                title={meeting.title}
                              >
                                <span
                                  className={`absolute inset-y-1 left-1 w-1 rounded-full ${getAccentClass(
                                    meeting,
                                    live
                                  )}`}
                                />
                                {live && (
                                  <span className="cal-live-dot mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                                )}
                                <span className="font-semibold">
                                  {formatTime(meeting.startAt)}
                                </span>{" "}
                                {meeting.title}
                              </button>
                            );
                          })}

                          {dayMeetings.length > 3 && (
                            <button
                              type="button"
                              onClick={() => openDay(date)}
                              className="px-2 text-[11px] font-bold text-[#1459B8] transition hover:text-[#FF6B00] hover:underline"
                            >
                              +{dayMeetings.length - 3} more
                            </button>
                          )}
                        </div>

                        {/* dots on phones */}
                        {dayMeetings.length > 0 && (
                          <button
                            type="button"
                            onClick={() => openDay(date)}
                            className="mt-1 flex flex-wrap gap-1 sm:hidden"
                            aria-label={`${dayMeetings.length} meetings`}
                          >
                            {dayMeetings.slice(0, 4).map((meeting) => (
                              <span
                                key={meeting.id}
                                className={`h-2 w-2 rounded-full ${getAccentClass(
                                  meeting,
                                  isLiveMeeting(meeting, nowMs)
                                )}`}
                              />
                            ))}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : calendarView === "week" ? (
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04),0_4px_14px_rgba(15,47,95,0.03)]">
                <div className="flex items-center justify-center border-b border-[#E2E8F1] px-4 py-4">
                  <h3 className="text-lg font-bold text-[#0F2F5F]">
                    {calendarWeekLabel}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[980px]">
                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-[#E2E8F1] bg-[linear-gradient(180deg,#F5F9FF_0%,#EEF4FD_100%)]">
                      <div className="border-r border-[#E2E8F1]" />

                      {calendarWeekDays.map((date) => {
                        const isToday = isSameCalendarDay(date, now);

                        return (
                          <button
                            key={getCalendarDayKey(date)}
                            type="button"
                            onClick={() => openDay(date)}
                            className="border-r border-[#E2E8F1] px-2 py-3 text-center transition-colors duration-200 last:border-r-0 hover:bg-white/70"
                            aria-label={`Open ${formatDate(date.toISOString())}`}
                          >
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F2F5F]">
                              {new Intl.DateTimeFormat("en-IN", {
                                weekday: "short",
                              }).format(date)}
                            </p>

                            <div
                              className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                isToday
                                  ? "bg-[#FF6B00] text-white shadow-[0_4px_10px_rgba(255,107,0,0.35)]"
                                  : "text-[#0F2F5F]"
                              }`}
                            >
                              {date.getDate()}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                      <div className="border-r border-[#E2E8F1] bg-[#F8FAFD]">
                        {renderTimeColumn()}
                      </div>

                      {calendarWeekDays.map((date) => (
                        <div
                          key={getCalendarDayKey(date)}
                          className="border-r border-[#E2E8F1] last:border-r-0"
                        >
                          {renderEventColumn(date, false)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : calendarView === "day" ? (
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F1] bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04),0_4px_14px_rgba(15,47,95,0.03)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F1] px-4 py-4">
                  <span className="hidden w-24 sm:block" />
                  <h3 className="text-center text-lg font-bold text-[#0F2F5F]">
                    {calendarDayLabel}
                  </h3>
                  <button
                    type="button"
                    onClick={() => void openCreateMeetingModal(focusDate)}
                    disabled={focusDate.getTime() < startOfToday.getTime() && !isSameCalendarDay(focusDate, now)}
                    className={`cal-btn-secondary inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F1] bg-white px-3 py-1.5 text-xs font-semibold text-[#1459B8] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>

                {getMeetingsForCalendarDay(focusDate).length === 0 && (
                  <div className="border-b border-[#EDF1F7] bg-[#FAFBFE] px-5 py-3 text-center text-sm text-slate-500">
                    No meetings on this day.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <div className="grid min-w-[640px] grid-cols-[80px_1fr]">
                    <div className="border-r border-[#E2E8F1] bg-[#F8FAFD]">
                      {renderTimeColumn()}
                    </div>

                    {renderEventColumn(focusDate, true)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E2E8F1] bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04),0_4px_14px_rgba(15,47,95,0.03)]">
                <div className="border-b border-[#E2E8F1] px-5 py-4">
                  <h3 className="text-lg font-bold text-[#0F2F5F]">
                    {calendarMonthLabel}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Trainer meetings for this month.
                  </p>
                </div>

                <div className="max-h-[720px] overflow-y-auto">
                  {agendaDates.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FD] text-[#1459B8]">
                        <CalendarDays size={26} />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[#0F2F5F]">
                        No calendar events for this month
                      </p>
                      <button
                        type="button"
                        onClick={() => void openCreateMeetingModal()}
                        className={`cal-btn-primary mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white ${FOCUS}`}
                      >
                        <Plus size={16} />
                        Create Meeting
                      </button>
                    </div>
                  ) : (
                    agendaDates.map(([dateKey, dateMeetings]) => {
                      const date = new Date(`${dateKey}T00:00:00`);
                      const isToday = isSameCalendarDay(date, now);

                      return (
                        <div
                          key={dateKey}
                          ref={isToday ? agendaTodayRef : undefined}
                          className="border-b border-[#E2E8F1] last:border-b-0"
                        >
                          <div
                            className={`sticky top-0 z-10 flex items-center justify-between border-b border-[#EDF1F7] px-5 py-3 ${
                              isToday ? "bg-[#FFF3EA]" : "bg-[#F8FAFD]"
                            }`}
                          >
                            <p className="text-sm font-bold text-[#0F2F5F]">
                              {new Intl.DateTimeFormat("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              }).format(date)}
                            </p>

                            {isToday && (
                              <span className="rounded-full bg-[#FF6B00] px-2.5 py-1 text-[11px] font-bold text-white">
                                Today
                              </span>
                            )}
                          </div>

                          {dateMeetings.length === 0 ? (
                            <div className="px-5 py-4 text-sm text-slate-400">
                              No events scheduled.
                            </div>
                          ) : (
                            <div className="divide-y divide-[#EDF1F7]">
                              {dateMeetings.map((meeting, index) => {
                                const Icon = getMeetingTypeIcon(meeting.meetingType);
                                const live = isLiveMeeting(meeting, nowMs);

                                return (
                                  <button
                                    key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                                    type="button"
                                    onClick={() => setSelectedMeeting(meeting)}
                                    className={`cal-row-in cal-agenda-row flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 ${FOCUS}`}
                                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                                  >
                                    <div className="w-[74px] shrink-0 text-sm font-bold text-[#0F2F5F]">
                                      {formatTime(meeting.startAt)}
                                      <span className="block text-[11px] font-medium text-slate-400">
                                        {formatTime(meeting.endAt)}
                                      </span>
                                    </div>

                                    <div className="cal-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FD] text-[#1459B8]">
                                      <Icon size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-[#0F2F5F]">
                                        {live && (
                                          <span className="cal-live-dot inline-block h-2 w-2 shrink-0 rounded-full bg-[#FF6B00]" />
                                        )}
                                        <span className="truncate">{meeting.title}</span>
                                      </p>
                                      <p className="mt-1 truncate text-xs text-slate-500">
                                        {getMeetingTypeLabel(meeting.meetingType)}
                                        {meeting.course?.title ? ` • ${meeting.course.title}` : ""}
                                        {meeting.batch?.name ? ` • ${meeting.batch.name}` : ""}
                                        {meeting.meetingPlatform
                                          ? ` • ${getMeetingPlatformLabel(meeting.meetingPlatform)}`
                                          : ""}
                                      </p>
                                    </div>

                                    <span
                                      className={`hidden rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline ${getStatusClasses(
                                        meeting.status
                                      )}`}
                                    >
                                      {meeting.status}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============ UPCOMING EVENTS ============ */}
        <section className="cal-fade-up rounded-2xl border border-[#E2E8F1] bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04),0_4px_14px_rgba(15,47,95,0.03)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F1] px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-[#0F2F5F]">
                Upcoming Events
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your next scheduled meetings.
              </p>
            </div>

            {upcomingMeetings.length > 0 && (
              <span className="rounded-full bg-[#EAF1FD] px-3 py-1 text-xs font-bold text-[#1459B8]">
                {upcomingMeetings.length} upcoming
              </span>
            )}
          </div>

          {loading ? (
            <div className="divide-y divide-[#EDF1F7]" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-4 px-5 py-4">
                  <div className="cal-shimmer h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="cal-shimmer h-3.5 w-1/3 rounded" />
                    <div className="cal-shimmer h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF3EA] text-[#FF6B00]">
                <CalendarCheck size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#0F2F5F]">
                No upcoming events
              </p>
              <p className="mt-1 text-xs text-slate-500">
                New meetings you schedule will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EDF1F7]">
              {upcomingMeetings.slice(0, 8).map((meeting, index) => {
                const Icon = getMeetingTypeIcon(meeting.meetingType);
                const live = isLiveMeeting(meeting, nowMs);

                return (
                  <div
                    key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                    className="cal-row-in cal-agenda-row flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5"
                    style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4 ${FOCUS}`}
                    >
                      <div className="cal-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FD] text-[#1459B8]">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F2F5F]">
                          {meeting.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(meeting.startAt)} •{" "}
                          {formatTime(meeting.startAt)} –{" "}
                          {formatTime(meeting.endAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Scheduled By: {getOrganizerLabel(meeting)}
                          {getOrganizerRole(meeting)
                            ? ` · ${getOrganizerRole(meeting)}`
                            : ""}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          live
                            ? "bg-[#FF6B00] text-white"
                            : "bg-[#EAF1FD] text-[#1459B8]"
                        }`}
                      >
                        {live && (
                          <span className="cal-live-dot-white inline-block h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                        {getRelativeStart(meeting, nowMs)}
                      </span>

                      {meeting.meetingUrl && (
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`cal-btn-secondary inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F1] bg-white px-3 text-xs font-semibold text-[#1459B8] ${FOCUS}`}
                        >
                          <Video size={13} />
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ============ CREATE / EDIT MODAL ============ */}
      {showCreateModal && (
        <ModalShell
          label={editingMeeting ? "Update meeting" : "Schedule meeting"}
          maxWidth="max-w-3xl"
          locked={savingMeeting}
          backdropClose={false}
          onClose={closeCreateMeetingModal}
        >
          {(close) => (
            <>
              <ModalHead
                badges={
                  <>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                      {editingMeeting ? "Edit Meeting" : "Create Meeting"}
                    </span>
                    {editingMeeting && (
                      <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
                        {editingMeeting.status}
                      </span>
                    )}
                  </>
                }
                title={editingMeeting ? "Update Meeting" : "Schedule Meeting"}
                subtitle={
                  editingMeeting
                    ? "Update the meeting details. The system will re-check participant, batch, trainer, and organizer conflicts."
                    : "Schedule a meeting with your assigned students, batch, or trainers."
                }
                onClose={close}
                closeLabel="Close meeting form"
                disabled={savingMeeting}
              />

              {formError && (
                <div className="cal-fade-up shrink-0 border-b border-red-200 bg-red-50 px-6 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <AlertTriangle size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-red-800">
                        {formError.toLowerCase().includes("conflict") ||
                        formError.toLowerCase().includes("scheduled meeting")
                          ? "Scheduling conflict"
                          : "Unable to continue"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-red-700">
                        {formError}
                      </p>
                      {(formError.toLowerCase().includes("conflict") ||
                        formError.toLowerCase().includes("scheduled meeting")) && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          Change the time, participant, or batch and try again. The form will remain open.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormError("")}
                      className="shrink-0 rounded-md p-1 text-red-400 transition hover:bg-red-100 hover:text-red-700"
                      aria-label="Dismiss form error"
                    >
                      <XCircle size={17} />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmitMeeting}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                  {optionsLoading ? (
                    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-[#E2E8F1] bg-[#F8FAFD]">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <Loader2 size={24} className="animate-spin text-[#FF6B00]" />
                        <p className="text-sm font-medium text-slate-600">
                          Loading meeting options...
                        </p>
                      </div>
                    </div>
                  ) : meetingOptions ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label>
                          <span className={LABEL}>Meeting Title *</span>
                          <input
                            value={form.title}
                            maxLength={255}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            className={INPUT}
                          />
                        </label>

                        <label>
                          <span className={LABEL}>Meeting Type *</span>
                          <select
                            value={form.meetingType}
                            onChange={(event) => {
                              const meetingType = event.target.value as MeetingType;

                              setForm((current) => ({
                                ...current,
                                meetingType,
                                batchId:
                                  meetingType === "BATCH_MEETING" ||
                                  meetingType === "STUDENT_MEETING"
                                    ? current.batchId
                                    : "",
                                participantUserIds: [],
                              }));
                              setFormError("");
                            }}
                            className={INPUT}
                          >
                            <option value="BATCH_MEETING">Batch Meeting</option>
                            <option value="STUDENT_MEETING">Student Meeting</option>
                            <option value="ONE_TO_ONE">One-to-One</option>
                            <option value="INTERNAL_MEETING">Internal Meeting</option>
                          </select>
                        </label>

                        <label>
                          <span className={LABEL}>Meeting Platform</span>
                          <select
                            value={form.meetingPlatform}
                            onChange={(event) => {
                              setForm((current) => ({
                                ...current,
                                meetingPlatform: event.target.value as MeetingPlatform,
                              }));
                              setFormError("");
                            }}
                            className={INPUT}
                          >
                            <option value="GOOGLE_MEET">Google Meet</option>
                            <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                            <option value="ZOOM">Zoom</option>
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </label>
                      </div>

                      <label className="block">
                        <span className={LABEL}>Description</span>
                        <textarea
                          rows={3}
                          value={form.description}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          className={INPUT}
                        />
                      </label>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label>
                          <span className={LABEL}>Start *</span>
                          <input
                            type="datetime-local"
                            value={form.startAt}
                            onChange={(event) => setStartAt(event.target.value)}
                            className={INPUT}
                          />
                        </label>

                        <div>
                          <label>
                            <span className={LABEL}>End *</span>
                            <input
                              type="datetime-local"
                              value={form.endAt}
                              onChange={(event) => {
                                setForm((current) => ({
                                  ...current,
                                  endAt: event.target.value,
                                }));
                                setFormError("");
                              }}
                              className={INPUT}
                            />
                          </label>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400">
                              Duration:
                            </span>
                            {[30, 60, 90, 120].map((minutes) => (
                              <button
                                key={minutes}
                                type="button"
                                onClick={() => setDuration(minutes)}
                                className={`rounded-full border border-[#CFE0FA] bg-[#EAF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#1459B8] transition duration-200 hover:-translate-y-px hover:bg-[#dbe8fb] ${FOCUS}`}
                              >
                                {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label>
                          <span className={LABEL}>Course</span>
                          <select
                            value={form.courseId}
                            onChange={(event) => {
                              setForm((current) => ({
                                ...current,
                                courseId: event.target.value,
                              }));
                              setFormError("");
                            }}
                            className={INPUT}
                          >
                            <option value="">No course</option>
                            {meetingOptions.courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title}
                              </option>
                            ))}
                          </select>
                        </label>

                        {(form.meetingType === "BATCH_MEETING" ||
                          form.meetingType === "STUDENT_MEETING") && (
                          <label>
                            <span className={LABEL}>Batch *</span>
                            <select
                              value={form.batchId}
                              onChange={(event) => {
                                const batchId = event.target.value;
                                const batch = meetingOptions.batches.find(
                                  (item) => String(item.id) === batchId
                                );

                                setForm((current) => ({
                                  ...current,
                                  batchId,
                                  courseId: batch?.courseId
                                    ? String(batch.courseId)
                                    : current.courseId,
                                }));
                                setFormError("");
                              }}
                              className={INPUT}
                            >
                              <option value="">Select batch</option>
                              {meetingOptions.batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.displayId ? `${batch.displayId} • ` : ""}
                                  {batch.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>

                      {(form.meetingType === "STUDENT_MEETING" ||
                        form.meetingType === "ONE_TO_ONE") && (
                        <div className="cal-fade-up rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#0F2F5F]">
                                Student Participants
                                <span className="ml-1 text-red-500">*</span>
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {form.meetingType === "ONE_TO_ONE"
                                  ? "Select one student for this meeting."
                                  : "Select one or more students for this meeting."}
                              </p>
                            </div>

                            <span className="rounded-full bg-[#EAF1FD] px-2.5 py-1 text-xs font-bold text-[#1459B8]">
                              {form.participantUserIds.length} selected
                            </span>
                          </div>

                          {form.meetingType === "ONE_TO_ONE" ? (
                            <select
                              value={form.participantUserIds[0] ?? ""}
                              onChange={(event) =>
                                toggleParticipant(Number(event.target.value))
                              }
                              className={INPUT}
                            >
                              <option value="">Select a student</option>
                              {meetingOptions.students.map((student) => (
                                <option key={student.userId} value={student.userId}>
                                  {student.name} — {student.email}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-[#E2E8F1] bg-white p-2">
                              {meetingOptions.students.map((student) => {
                                const selected = form.participantUserIds.includes(
                                  student.userId
                                );

                                return (
                                  <label
                                    key={student.userId}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition duration-200 ${
                                      selected ? "bg-[#EAF1FD]" : "hover:bg-[#F5F9FF]"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleParticipant(student.userId)}
                                      className="h-4 w-4 rounded border-slate-300 text-[#1459B8] focus:ring-[#1459B8]"
                                    />
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-medium text-slate-800">
                                        {student.name}
                                      </span>
                                      <span className="block truncate text-xs text-slate-500">
                                        {student.email}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {form.meetingType === "INTERNAL_MEETING" && (
                        <div className="cal-fade-up rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#0F2F5F]">
                                Internal Participants
                                <span className="ml-1 text-red-500">*</span>
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Select one or more trainers for this internal meeting.
                              </p>
                            </div>

                            <span className="rounded-full bg-[#EAF1FD] px-2.5 py-1 text-xs font-bold text-[#1459B8]">
                              {form.participantUserIds.length} selected
                            </span>
                          </div>

                          {meetingOptions.trainers.length === 0 ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                              No active trainers are available.
                            </p>
                          ) : (
                            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-[#E2E8F1] bg-white p-2">
                              {meetingOptions.trainers.map((trainer) => {
                                const selected = form.participantUserIds.includes(
                                  trainer.userId
                                );

                                return (
                                  <label
                                    key={trainer.userId}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition duration-200 ${
                                      selected ? "bg-[#EAF1FD]" : "hover:bg-[#F5F9FF]"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleParticipant(trainer.userId)}
                                      className="h-4 w-4 rounded border-slate-300 text-[#1459B8] focus:ring-[#1459B8]"
                                    />
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-medium text-slate-800">
                                        {trainer.name}
                                      </span>
                                      <span className="block truncate text-xs text-slate-500">
                                        {trainer.email}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {form.meetingType === "BATCH_MEETING" && (
                        <div className="cal-fade-up rounded-xl border border-[#CFE0FA] bg-[#EAF1FD] px-4 py-3">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1459B8]" />
                            <div>
                              <p className="text-sm font-semibold text-[#0F2F5F]">
                                Batch meeting
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[#1459B8]">
                                The selected batch determines the meeting audience.
                                The trainer, batch students, and organizer are
                                checked for overlapping scheduled meetings.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <label className="block">
                        <span className={LABEL}>Meeting URL</span>
                        <input
                          type="url"
                          value={form.meetingUrl}
                          onChange={(event) => {
                            setForm((current) => ({
                              ...current,
                              meetingUrl: event.target.value,
                            }));
                            setFormError("");
                          }}
                          className={INPUT}
                          placeholder="https://teams.microsoft.com/..."
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Meeting options could not be loaded. Close this window and try again.
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#EDF1F7] bg-[#FBFCFE] px-5 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={close}
                    disabled={savingMeeting}
                    className={`cal-btn-secondary rounded-xl border border-[#E2E8F1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1459B8] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={savingMeeting || optionsLoading || !meetingOptions}
                    className={`cal-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                  >
                    {savingMeeting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : editingMeeting ? (
                      <Pencil size={16} />
                    ) : (
                      <Save size={16} />
                    )}

                    {savingMeeting
                      ? editingMeeting
                        ? "Updating..."
                        : "Scheduling..."
                      : editingMeeting
                      ? "Update Meeting"
                      : "Schedule Meeting"}
                  </button>
                </div>
              </form>
            </>
          )}
        </ModalShell>
      )}

      {/* ============ MEETING DETAILS MODAL ============ */}
      {selectedMeeting && (
        <ModalShell
          label={`Meeting details: ${selectedMeeting.title}`}
          maxWidth="max-w-2xl"
          locked={cancellingMeeting || Boolean(confirmMeeting)}
          onClose={closeSelectedMeetingModal}
        >
          {(close) => {
            const live = isLiveMeeting(selectedMeeting, nowMs);
            const currentUserId = getCurrentUserId();
            const isOrganizer =
              currentUserId === null ||
              selectedMeeting.organizerUserId === currentUserId;

            return (
              <>
                <ModalHead
                  badges={
                    <>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          selectedMeeting.status === "SCHEDULED"
                            ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
                            : selectedMeeting.status === "CANCELLED"
                            ? "border-red-300/40 bg-red-400/20 text-red-100"
                            : "border-white/25 bg-white/15 text-white"
                        }`}
                      >
                        {selectedMeeting.status}
                      </span>
                      {live && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B00] px-2.5 py-1 text-[11px] font-bold">
                          <span className="cal-live-dot-white inline-block h-1.5 w-1.5 rounded-full bg-white" />
                          Live now
                        </span>
                      )}
                      <span className="text-xs font-semibold text-blue-100/90">
                        {getMeetingTypeLabel(selectedMeeting.meetingType)}
                      </span>
                    </>
                  }
                  title={selectedMeeting.title}
                  onClose={close}
                  closeLabel="Close meeting details"
                  disabled={cancellingMeeting}
                />

                {selectedMeetingError && (
                  <div className="cal-fade-up shrink-0 border-b border-red-200 bg-red-50 px-6 py-3.5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-red-800">
                          Meeting action failed
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-red-700">
                          {selectedMeetingError}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedMeetingError("")}
                        className="shrink-0 rounded-md p-1 text-red-400 transition hover:bg-red-100 hover:text-red-700"
                        aria-label="Dismiss meeting action error"
                      >
                        <XCircle size={17} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InfoCard icon={<Clock3 size={14} />} label="Start">
                        {formatDateTime(selectedMeeting.startAt)}
                      </InfoCard>
                      <InfoCard icon={<Clock3 size={14} />} label="End">
                        {formatDateTime(selectedMeeting.endAt)}
                      </InfoCard>
                    </div>

                    {selectedMeeting.description && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Description
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {selectedMeeting.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InfoCard icon={<Video size={14} />} label="Platform">
                        {getMeetingPlatformLabel(selectedMeeting.meetingPlatform)}
                      </InfoCard>

                      {selectedMeeting.course?.title && (
                        <InfoCard icon={<BookOpen size={14} />} label="Course">
                          {selectedMeeting.course.title}
                        </InfoCard>
                      )}

                      {selectedMeeting.batch?.name && (
                        <InfoCard icon={<Layers size={14} />} label="Batch">
                          {selectedMeeting.batch.displayId
                            ? `${selectedMeeting.batch.displayId} • `
                            : ""}
                          {selectedMeeting.batch.name}
                        </InfoCard>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#E2E8F1] bg-[#F8FAFD] p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <UserCircle size={14} className="text-[#FF6B00]/80" />
                        Scheduled By
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#0F2F5F]">
                        {getOrganizerLabel(selectedMeeting)}
                      </p>
                      {getOrganizerRole(selectedMeeting) ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {getOrganizerRole(selectedMeeting)}
                        </p>
                      ) : null}
                    </div>

                    {/* Remote assistance (UltraViewer) */}
                    <div className="rounded-2xl border border-[#E2E8F1] bg-[#F8FAFD] p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F2F5F] text-white">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0F2F5F]">
                              Remote Assistance • UltraViewer
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              Use UltraViewer alongside {getMeetingPlatformLabel(
                                selectedMeeting.meetingPlatform
                              )} when the trainer needs to work directly on the student&apos;s Windows PC.
                            </p>
                          </div>
                        </div>

                        <a
                          href="https://www.ultraviewer.net/en/download.html"
                          target="_blank"
                          rel="noreferrer"
                          className={`cal-btn-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E2E8F1] bg-white px-3 py-2 text-xs font-semibold text-[#1459B8] ${FOCUS}`}
                        >
                          <ExternalLink size={14} />
                          UltraViewer App
                        </a>
                      </div>

                      {selectedMeeting.status === "SCHEDULED" ? (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                            Ask the student to open UltraViewer and share the current ID and password. Do not save the password in SKCE. It is used only for this remote connection.
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Student UltraViewer ID
                              </span>
                              <div className="flex gap-2">
                                <input
                                  value={remoteAssistId}
                                  onChange={(event) => {
                                    setRemoteAssistId(event.target.value);
                                    setRemoteAssistMessage("");
                                  }}
                                  inputMode="numeric"
                                  autoComplete="off"
                                  placeholder="Enter current ID"
                                  className={`${INPUT} min-w-0 flex-1`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyRemoteAssistValue(
                                      remoteAssistId,
                                      "UltraViewer ID"
                                    )
                                  }
                                  className={`cal-btn-secondary inline-flex items-center justify-center rounded-lg border border-[#E2E8F1] bg-white px-3 text-slate-600 ${FOCUS}`}
                                  title="Copy UltraViewer ID"
                                  aria-label="Copy UltraViewer ID"
                                >
                                  <Copy size={15} />
                                </button>
                              </div>
                            </label>

                            <label className="block">
                              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Connection Password
                              </span>
                              <div className="flex gap-2">
                                <div className="relative min-w-0 flex-1">
                                  <input
                                    type={showRemoteAssistPassword ? "text" : "password"}
                                    value={remoteAssistPassword}
                                    onChange={(event) => {
                                      setRemoteAssistPassword(event.target.value);
                                      setRemoteAssistMessage("");
                                    }}
                                    autoComplete="off"
                                    placeholder="Enter current password"
                                    className={`${INPUT} pr-10`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowRemoteAssistPassword((current) => !current)
                                    }
                                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-[#1459B8]"
                                    aria-label={
                                      showRemoteAssistPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showRemoteAssistPassword ? (
                                      <EyeOff size={16} />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyRemoteAssistValue(
                                      remoteAssistPassword,
                                      "UltraViewer password"
                                    )
                                  }
                                  className={`cal-btn-secondary inline-flex items-center justify-center rounded-lg border border-[#E2E8F1] bg-white px-3 text-slate-600 ${FOCUS}`}
                                  title="Copy UltraViewer password"
                                  aria-label="Copy UltraViewer password"
                                >
                                  <Copy size={15} />
                                </button>
                              </div>
                            </label>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[11px] leading-5 text-slate-500">
                              The web browser cannot directly control a Windows desktop application. SKCE prepares the official UltraViewer connection command; UltraViewer performs the actual remote-control session.
                            </p>
                            <button
                              type="button"
                              onClick={() => void prepareRemoteAssistance()}
                              className={`cal-btn-navy inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}
                            >
                              <ExternalLink size={15} />
                              Start Remote Assistance
                            </button>
                          </div>

                          {remoteAssistMessage && (
                            <div className="cal-fade-up rounded-lg border border-[#CFE0FA] bg-[#EAF1FD] px-3 py-2.5 text-xs leading-5 text-[#0F2F5F]">
                              {remoteAssistMessage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-slate-500">
                          Remote assistance is available only while the meeting is scheduled.
                        </p>
                      )}
                    </div>

                    {selectedMeeting.participants &&
                      selectedMeeting.participants.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Participants
                          </p>

                          <div className="mt-2 space-y-2">
                            {selectedMeeting.participants.map((participant, index) => (
                              <div
                                key={participant.id}
                                className="cal-row-in flex items-center justify-between rounded-lg border border-[#E2E8F1] px-3 py-2 transition-colors duration-200 hover:border-[#BFD3F2] hover:bg-[#F5F9FF]"
                                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {participant.name || "Participant"}
                                  </p>
                                  {participant.email && (
                                    <p className="text-xs text-slate-500">
                                      {participant.email}
                                    </p>
                                  )}
                                </div>

                                {participant.role && (
                                  <span className="text-[11px] font-semibold uppercase text-slate-400">
                                    {participant.role}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedMeeting.meetingUrl && (
                      <a
                        href={selectedMeeting.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`cal-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${FOCUS}`}
                      >
                        <Video size={16} />
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#EDF1F7] bg-[#FBFCFE] px-5 py-4 sm:px-6">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-500">
                      {selectedMeeting.status === "SCHEDULED"
                        ? "Scheduled meetings can be updated or cancelled by their organizer."
                        : selectedMeeting.status === "CANCELLED"
                        ? "This meeting has been cancelled."
                        : "This meeting is completed."}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {selectedMeeting.status === "SCHEDULED" && isOrganizer && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditMeetingModal(selectedMeeting)}
                            disabled={cancellingMeeting}
                            className={`cal-btn-secondary inline-flex items-center gap-2 rounded-xl border border-[#E2E8F1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1459B8] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                          >
                            <Pencil size={16} />
                            Update Meeting
                          </button>

                          <button
                            type="button"
                            onClick={() => requestCancelMeeting(selectedMeeting)}
                            disabled={cancellingMeeting}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-px hover:bg-red-700 hover:shadow-[0_8px_18px_rgba(220,38,38,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Ban size={16} />
                            Cancel Meeting
                          </button>
                        </>
                      )}

                      {selectedMeeting.status === "SCHEDULED" && !isOrganizer && (
                        <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          Only the organizer can update or cancel this meeting.
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={close}
                        disabled={cancellingMeeting}
                        className={`cal-btn-secondary rounded-xl border border-[#E2E8F1] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        </ModalShell>
      )}

      {/* ============ CANCEL CONFIRM ============ */}
      {confirmMeeting && (
        <ModalShell
          label="Confirm cancel meeting"
          maxWidth="max-w-md"
          locked={cancellingMeeting}
          onClose={() => setConfirmMeeting(null)}
        >
          {(close) => (
            <>
              <div className="px-6 pb-2 pt-7 text-center">
                <div className="cal-pop mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Ban size={26} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-[#0F2F5F]">
                  Cancel this meeting?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Are you sure you want to cancel meeting{" "}
                  <span className="font-semibold text-[#0F2F5F]">
                    &ldquo;{confirmMeeting.title}&rdquo;
                  </span>
                  ? Participants will see it as cancelled.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 px-6 pb-6 pt-4">
                <button
                  type="button"
                  onClick={close}
                  disabled={cancellingMeeting}
                  className={`cal-btn-secondary rounded-xl border border-[#E2E8F1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1459B8] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                >
                  Keep Meeting
                </button>

                <button
                  type="button"
                  onClick={() => void performCancelMeeting()}
                  disabled={cancellingMeeting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-px hover:bg-red-700 hover:shadow-[0_8px_18px_rgba(220,38,38,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancellingMeeting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Ban size={16} />
                  )}
                  {cancellingMeeting ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </>
          )}
        </ModalShell>
      )}

      {/* ============ ANIMATIONS / BRAND STYLES ============ */}
      <style jsx global>{`
        @keyframes calFadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes calFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes calFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes calModalIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes calModalOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(10px) scale(0.985); }
        }
        @keyframes calSlideNext {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes calSlidePrev {
          from { opacity: 0; transform: translateX(-28px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes calViewIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes calPop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes calShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes calSheen {
          from { transform: translateX(-120%) skewX(-18deg); }
          to { transform: translateX(260%) skewX(-18deg); }
        }
        @keyframes calPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.6); }
          70% { box-shadow: 0 0 0 7px rgba(255, 107, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 107, 0, 0); }
        }
        @keyframes calPulseWhite {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 7px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        @keyframes calFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes calToastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        /* "backwards" (not "both") so hover transforms keep working afterwards */
        .cal-page { animation: calFadeIn 0.3s ease-out backwards; }
        .cal-fade-up { animation: calFadeUp 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .cal-row-in { animation: calFadeUp 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .cal-view-in { animation: calViewIn 0.3s ease backwards; }
        .cal-slide-next { animation: calSlideNext 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .cal-slide-prev { animation: calSlidePrev 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .cal-pop { animation: calPop 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .cal-toast-in { animation: calToastIn 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
        .cal-overlay-in { animation: calFadeIn 0.2s ease-out both; }
        .cal-modal-in { animation: calModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
        [data-closing="true"].cal-overlay-in { animation: calFadeOut 0.16s ease-in both; }
        [data-closing="true"] .cal-modal-in { animation: calModalOut 0.16s ease-in both; }

        .cal-shimmer {
          background-color: #e9eef6;
          background-image: linear-gradient(90deg, #e9eef6 0%, #f6f8fc 50%, #e9eef6 100%);
          background-size: 800px 100%;
          background-repeat: no-repeat;
          animation: calShimmer 1.3s ease-in-out infinite;
        }
        .cal-shimmer-dark {
          background-color: rgba(255, 255, 255, 0.12);
          background-image: linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.24) 50%, rgba(255,255,255,0.12) 100%);
          background-size: 800px 100%;
          background-repeat: no-repeat;
          animation: calShimmer 1.3s ease-in-out infinite;
        }

        /* Hero: SKCE logo blue + orange accent line */
        .cal-hero {
          /* Match the horizontal inset used by the summary cards below. */
          margin-inline: 32px;
          position: relative !important;
          isolation: isolate;
          overflow: hidden;
          min-width: 0;
          border-radius: 26px;
          background:
            radial-gradient(circle at 96% 0%, rgba(75,132,204,.38) 0%, rgba(75,132,204,0) 30%),
            radial-gradient(circle at 0% 110%, rgba(255,107,0,.15) 0%, rgba(255,107,0,0) 36%),
            linear-gradient(118deg, #071C3A 0%, #0F2F5F 45%, #1B4B82 100%);
          background-size: 220% 220%;
          animation: calFlow 14s ease-in-out infinite alternate;
          box-shadow: 0 12px 30px rgba(15, 47, 95, 0.18);
        }
        /* Subtle dotted texture and the same clipped concentric side rings as Student/Admin. */
        .cal-hero::before {
          content: "";
          position: absolute;
          z-index: 0;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.12) .8px, transparent .8px);
          background-size: 20px 20px;
          opacity: .34;
          pointer-events: none;
        }
        .cal-hero::after {
          content: "";
          position: absolute;
          z-index: 0;
          width: 360px;
          height: 360px;
          right: -12px;
          top: -174px;
          border: 1.5px solid rgba(255,255,255,.20);
          border-radius: 50%;
          box-shadow:
            0 0 0 34px rgba(255,255,255,.075),
            0 0 0 70px rgba(255,255,255,.055),
            0 0 0 108px rgba(255,255,255,.035);
          pointer-events: none;
        }
        .cal-hero > .relative {
          z-index: 1;
        }
        @media (max-width: 1023px) {
          .cal-hero { margin-inline: 24px; }
        }
        @media (max-width: 639px) {
          .cal-hero { margin-inline: 16px; }
        }
        @media (max-width: 640px) {
          .cal-hero { border-radius: 22px; }
          .cal-hero::after {
            width: 300px;
            height: 300px;
            right: -96px;
            top: -132px;
            box-shadow:
              0 0 0 26px rgba(255,255,255,.075),
              0 0 0 54px rgba(255,255,255,.05),
              0 0 0 82px rgba(255,255,255,.03);
          }
        }
        /* Keep the hero's concentric circles on ::after; use the accent pseudo-element only on section headers. */
        .cal-head-accent::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #ff6b00 0%, #ff6b00 16%, transparent 16%);
          pointer-events: none;
        }

        /* Buttons */
        .cal-btn-primary {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #ff8a12 0%, #ff6b00 55%, #f25a00 100%);
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .cal-btn-primary::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: translateX(-120%) skewX(-18deg);
          pointer-events: none;
        }
        .cal-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(255, 107, 0, 0.35); }
        .cal-btn-primary:hover:not(:disabled)::after { animation: calSheen 0.7s ease; }
        .cal-btn-primary:active:not(:disabled) { transform: scale(0.98); }

        .cal-btn-navy {
          background: linear-gradient(180deg, #123b6d 0%, #0f2f5f 100%);
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.2s ease;
        }
        .cal-btn-navy:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(15, 47, 95, 0.3); }
        .cal-btn-navy:active:not(:disabled) { transform: scale(0.98); }

        .cal-btn-glass {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.28);
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cal-btn-glass:hover:not(:disabled) { transform: translateY(-2px); background: rgba(255, 255, 255, 0.22); box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18); }
        .cal-btn-glass:active:not(:disabled) { transform: scale(0.98); }
        .cal-refresh-icon { transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .cal-btn-glass:hover .cal-refresh-icon { transform: rotate(180deg); }

        .cal-btn-secondary {
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.2s ease,
            border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }
        .cal-btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          background-color: #eaf1fd;
          border-color: #bfd3f2;
          box-shadow: 0 6px 14px rgba(20, 89, 184, 0.12);
        }
        .cal-btn-secondary:active:not(:disabled) { transform: scale(0.98); }

        /* Cards */
        .cal-lift { transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease; }
        .cal-lift:hover { transform: translateY(-4px); border-color: #c9d8ee; box-shadow: 0 14px 28px rgba(15, 47, 95, 0.12); }
        .cal-stat-icon { transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .cal-lift:hover .cal-stat-icon,
        .cal-agenda-row:hover .cal-stat-icon { transform: scale(1.12) rotate(-6deg); }

        /* Calendar cells / chips / events */
        .cal-cell { transition: background-color 0.2s ease, box-shadow 0.2s ease; }
        .cal-cell:hover { box-shadow: inset 0 0 0 1px #bfd3f2; background-color: #f5f9ff; }
        .cal-cell .cal-add { opacity: 0; transform: scale(0.7); transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .cal-cell:hover .cal-add,
        .cal-cell .cal-add:focus-visible { opacity: 1; transform: scale(1); }
        @media (hover: none) { .cal-cell .cal-add { opacity: 1; transform: scale(1); } }
        .cal-chip { transition: transform 0.18s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.18s ease; }
        .cal-chip:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15, 47, 95, 0.14); }
        .cal-event { transition: transform 0.18s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.18s ease, z-index 0s; }
        .cal-event:hover { transform: translateY(-1px) scale(1.01); z-index: 20; box-shadow: 0 10px 22px rgba(15, 47, 95, 0.2); }
        .cal-agenda-row { transition: background-color 0.2s ease; }
        .cal-agenda-row:hover { background-color: #f5f9ff; }

        .cal-live-dot { animation: calPulse 1.8s infinite; }
        .cal-live-dot-white { animation: calPulseWhite 1.8s infinite; }

        .cal-now-line { height: 2px; background: #ff6b00; box-shadow: 0 0 0 1px rgba(255, 107, 0, 0.15); }
        .cal-now-line::before {
          content: "";
          position: absolute;
          left: -4px;
          top: -4px;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: #ff6b00;
          animation: calPulse 2s infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cal-page,
          .cal-fade-up,
          .cal-row-in,
          .cal-view-in,
          .cal-slide-next,
          .cal-slide-prev,
          .cal-pop,
          .cal-toast-in,
          .cal-overlay-in,
          .cal-modal-in,
          .cal-shimmer,
          .cal-shimmer-dark,
          .cal-hero,
          .cal-live-dot,
          .cal-live-dot-white,
          .cal-now-line::before {
            animation: none !important;
          }
          .cal-btn-primary,
          .cal-btn-navy,
          .cal-btn-glass,
          .cal-btn-secondary,
          .cal-lift,
          .cal-cell,
          .cal-chip,
          .cal-event,
          .cal-agenda-row {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
