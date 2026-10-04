"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  UserCircle,
  Users,
  Video,
  BookOpen,
  Layers,
  XCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
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

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarWeekDate, setCalendarWeekDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<
    "month" | "week" | "day" | "agenda"
  >("month");

  const agendaTodayRef = useRef<HTMLDivElement | null>(null);

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

  async function openCreateMeetingModal() {
    setSelectedMeeting(null);
    setSelectedMeetingError("");
    setEditingMeeting(null);
    setError("");
    setFormError("");
    setRemoteAssistId("");
    setRemoteAssistPassword("");
    setShowRemoteAssistPassword(false);
    setRemoteAssistMessage("");

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
    setRemoteAssistId("");
    setRemoteAssistPassword("");
    setShowRemoteAssistPassword(false);
    setRemoteAssistMessage("");
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
    setRemoteAssistId("");
    setRemoteAssistPassword("");
    setShowRemoteAssistPassword(false);
    setRemoteAssistMessage("");
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

  async function handleCreateMeeting(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setFormError("");
    setError("");

    const title = form.title.trim();

    if (!title) {
      setFormError("Meeting title is required.");
      return;
    }

    if (!form.startAt || !form.endAt) {
      setFormError("Start time and end time are required.");
      return;
    }

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setFormError("Please enter valid start and end times.");
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setFormError("End time must be after start time.");
      return;
    }

    if (
      form.meetingUrl.trim() &&
      !/^https?:\/\//i.test(form.meetingUrl.trim())
    ) {
      setFormError(
        "Meeting URL must start with http:// or https://."
      );
      return;
    }

    if (
      (form.meetingType === "BATCH_MEETING" ||
        form.meetingType === "STUDENT_MEETING") &&
      !form.batchId
    ) {
      setFormError(
        "Please select a batch for this meeting type."
      );
      return;
    }

    if (
      form.meetingType === "ONE_TO_ONE" &&
      form.participantUserIds.length !== 1
    ) {
      setFormError("Please select exactly one student.");
      return;
    }

    if (
      form.meetingType === "STUDENT_MEETING" &&
      form.participantUserIds.length === 0
    ) {
      setFormError("Please select at least one student.");
      return;
    }

    if (
      form.meetingType === "INTERNAL_MEETING" &&
      form.participantUserIds.length === 0
    ) {
      setFormError("Please select at least one trainer.");
      return;
    }

    try {
      setSavingMeeting(true);

      const payload = {
        title,
        description: form.description.trim() || null,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        meetingUrl: form.meetingUrl.trim() || null,
        meetingPlatform: form.meetingPlatform,
        meetingType: form.meetingType,
        status: "SCHEDULED",
        courseId: form.courseId ? Number(form.courseId) : null,
        batchId: form.batchId ? Number(form.batchId) : null,
        participantUserIds: form.participantUserIds,
      };

      const response = await authenticatedFetch(
        `${API_URL}/trainer/meetings`,
        {
          method: "POST",
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
          result.message || "Failed to schedule the meeting."
        );
      }

      setShowCreateModal(false);
      setEditingMeeting(null);
      resetMeetingForm();
      await loadCalendar(true);
    } catch (err) {
      console.error("Create trainer meeting error:", err);

      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to schedule the meeting."
      );
    } finally {
      setSavingMeeting(false);
    }
  }

  async function handleUpdateMeeting(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!editingMeeting) {
      return;
    }

    setFormError("");
    setError("");

    const title = form.title.trim();

    if (!title) {
      setFormError("Meeting title is required.");
      return;
    }

    if (!form.startAt || !form.endAt) {
      setFormError("Start time and end time are required.");
      return;
    }

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setFormError("Please enter valid start and end times.");
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setFormError("End time must be after start time.");
      return;
    }

    if (
      form.meetingUrl.trim() &&
      !/^https?:\/\//i.test(form.meetingUrl.trim())
    ) {
      setFormError(
        "Meeting URL must start with http:// or https://."
      );
      return;
    }

    if (
      (form.meetingType === "BATCH_MEETING" ||
        form.meetingType === "STUDENT_MEETING") &&
      !form.batchId
    ) {
      setFormError(
        "Please select a batch for this meeting type."
      );
      return;
    }

    if (
      form.meetingType === "ONE_TO_ONE" &&
      form.participantUserIds.length !== 1
    ) {
      setFormError(
        "Please select exactly one student."
      );
      return;
    }

    if (
      form.meetingType === "STUDENT_MEETING" &&
      form.participantUserIds.length === 0
    ) {
      setFormError(
        "Please select at least one student."
      );
      return;
    }

    if (
      form.meetingType === "INTERNAL_MEETING" &&
      form.participantUserIds.length === 0
    ) {
      setFormError(
        "Please select at least one trainer."
      );
      return;
    }

    try {
      setSavingMeeting(true);

      const payload = {
        title,
        description: form.description.trim() || null,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        meetingUrl: form.meetingUrl.trim() || null,
        meetingPlatform: form.meetingPlatform,
        meetingType: form.meetingType,
        status: editingMeeting.status,
        courseId: form.courseId ? Number(form.courseId) : null,
        batchId: form.batchId ? Number(form.batchId) : null,
        participantUserIds:
          form.meetingType === "BATCH_MEETING"
            ? []
            : form.participantUserIds,
      };

      const response = await authenticatedFetch(
        `${API_URL}/trainer/meetings/${editingMeeting.id}`,
        {
          method: "PATCH",
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
          result.message || "Failed to update the meeting."
        );
      }

      setShowCreateModal(false);
      setEditingMeeting(null);
      resetMeetingForm();
      await loadCalendar(true);
    } catch (err) {
      console.error("Update trainer meeting error:", err);

      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to update the meeting."
      );
    } finally {
      setSavingMeeting(false);
    }
  }

  async function handleCancelMeeting(meeting: CalendarMeeting) {
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

    const confirmed = window.confirm(
      `Are you sure you want to cancel meeting "${meeting.title}"?`
    );

    if (!confirmed) {
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

      setSelectedMeeting(
        result.data || {
          ...meeting,
          status: "CANCELLED",
        }
      );

      await loadCalendar(true);
    } catch (err) {
      console.error("Cancel trainer meeting error:", err);

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
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const calendarMeetings = useMemo<CalendarMeeting[]>(() => meetings, [meetings]);

  const sortedCalendarMeetings = useMemo(
    () =>
      [...calendarMeetings].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [calendarMeetings]
  );

  const upcomingMeetings = useMemo(() => {
    const now = Date.now();

    return sortedCalendarMeetings.filter(
      (meeting) =>
        (meeting.status === "SCHEDULED") &&
        new Date(meeting.endAt).getTime() >= now
    );
  }, [sortedCalendarMeetings]);

  const todayMeetings = useMemo(() => {
    const today = new Date();

    return sortedCalendarMeetings.filter((meeting) =>
      isSameCalendarDay(new Date(meeting.startAt), today)
    );
  }, [sortedCalendarMeetings]);

  const scheduledCount = meetings.filter(
    (meeting) => meeting.status === "SCHEDULED"
  ).length;

  const completedCount = meetings.filter(
    (meeting) => meeting.status === "COMPLETED"
  ).length;

  const cancelledCount = meetings.filter(
    (meeting) => meeting.status === "CANCELLED"
  ).length;

  const calendarMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(calendarMonth),
    [calendarMonth]
  );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );

    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [calendarMonth]);

  const meetingsByCalendarDay = useMemo(() => {
    const grouped = new Map<string, CalendarMeeting[]>();

    for (const meeting of sortedCalendarMeetings) {
      const key = getCalendarDayKey(new Date(meeting.startAt));
      const existing = grouped.get(key) || [];
      existing.push(meeting);
      grouped.set(key, existing);
    }

    return grouped;
  }, [sortedCalendarMeetings]);

  const agendaMeetings = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    return sortedCalendarMeetings.filter((meeting) => {
      const date = new Date(meeting.startAt);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [calendarMonth, sortedCalendarMeetings]);

  const agendaDates = useMemo(() => {
    const grouped = new Map<string, CalendarMeeting[]>();

    for (const meeting of agendaMeetings) {
      const key = getCalendarDayKey(new Date(meeting.startAt));
      const existing = grouped.get(key) || [];
      existing.push(meeting);
      grouped.set(key, existing);
    }

    const today = new Date();

    if (
      today.getFullYear() === calendarMonth.getFullYear() &&
      today.getMonth() === calendarMonth.getMonth()
    ) {
      const todayKey = getCalendarDayKey(today);

      if (!grouped.has(todayKey)) {
        grouped.set(todayKey, []);
      }
    }

    return Array.from(grouped.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [agendaMeetings, calendarMonth]);

  const calendarWeekStart = useMemo(() => {
    const start = new Date(calendarWeekDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }, [calendarWeekDate]);

  const calendarWeekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(calendarWeekStart);
        date.setDate(calendarWeekStart.getDate() + index);
        return date;
      }),
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
      }).format(calendarWeekDate),
    [calendarWeekDate]
  );

  const weekHourRows = useMemo(
    () => Array.from({ length: 13 }, (_, index) => 8 + index),
    []
  );

  const weekStartMinutes = 8 * 60;
  const weekEndMinutes = 21 * 60;
  const weekHourHeight = 72;

  function getMeetingsForCalendarDay(date: Date) {
    return meetingsByCalendarDay.get(getCalendarDayKey(date)) || [];
  }

  function getCalendarEventStyle(meeting: CalendarMeeting) {
    const startMinutes = getMinutesFromMidnight(meeting.startAt);
    const endMinutes = getMinutesFromMidnight(meeting.endAt);

    const visibleStart = Math.max(startMinutes, weekStartMinutes);
    const visibleEnd = Math.min(endMinutes, weekEndMinutes);

    const top =
      ((visibleStart - weekStartMinutes) / 60) * weekHourHeight;

    const height = Math.max(
      42,
      ((visibleEnd - visibleStart) / 60) * weekHourHeight
    );

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  }

  function goToPreviousMonth() {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  }

  function goToCurrentMonth() {
    const today = new Date();
    setCalendarMonth(today);
    setCalendarWeekDate(today);
  }

  function goToPreviousWeek() {
    setCalendarWeekDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() - 7);
      return next;
    });
  }

  function goToNextWeek() {
    setCalendarWeekDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }

  function goToPreviousDay() {
    setCalendarWeekDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function goToNextDay() {
    setCalendarWeekDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function goToCurrentPeriod() {
    const today = new Date();

    if (calendarView === "agenda") {
      setCalendarMonth(today);
      setCalendarWeekDate(today);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          agendaTodayRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      });

      return;
    }

    if (calendarView === "month") {
      goToCurrentMonth();
      return;
    }

    setCalendarWeekDate(today);
  }

  function goToPreviousPeriod() {
    if (calendarView === "month" || calendarView === "agenda") {
      goToPreviousMonth();
      return;
    }

    if (calendarView === "week") {
      goToPreviousWeek();
      return;
    }

    goToPreviousDay();
  }

  function goToNextPeriod() {
    if (calendarView === "month" || calendarView === "agenda") {
      goToNextMonth();
      return;
    }

    if (calendarView === "week") {
      goToNextWeek();
      return;
    }

    goToNextDay();
  }

  function handleCalendarViewChange(
    view: "month" | "week" | "day" | "agenda"
  ) {
    setCalendarView(view);

    if (view === "month" || view === "agenda") {
      setCalendarMonth(calendarWeekDate);
      return;
    }

    if (view === "week") {
      setCalendarWeekDate(calendarMonth);
      return;
    }

    setCalendarWeekDate(
      calendarView === "month" || calendarView === "agenda"
        ? calendarMonth
        : calendarWeekDate
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6FA]">
      <div className="border-b border-slate-200 bg-white">
        <div className="px-8 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173B67] text-white">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Calendar
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    View your meetings and batch activities.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button type="button" onClick={openCreateMeetingModal} className="inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102c4f]">
                <Plus size={16} /> Create Meeting
              </button>

              <button
              type="button"
              onClick={() => loadCalendar(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        {!showCreateModal && !selectedMeeting && error && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-500 hover:text-red-700"
              aria-label="Close error"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Meetings</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {meetings.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Scheduled</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {scheduledCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Today&apos;s Events
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {todayMeetings.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Upcoming</p>
            <p className="mt-2 text-2xl font-bold text-[#173B67]">
              {upcomingMeetings.length}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Calendar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View meetings by month, week, day, or agenda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white p-1">
                {(["month", "week", "day", "agenda"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => handleCalendarViewChange(view)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                      calendarView === view
                        ? "bg-[#173B67] text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goToCurrentPeriod}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Today
              </button>

              <button
                type="button"
                onClick={goToPreviousPeriod}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Previous period"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={goToNextPeriod}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Next period"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {calendarView === "month" ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-center border-b border-slate-200 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  {calendarMonthLabel}
                </h3>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="border-r border-slate-200 px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 last:border-r-0"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((date) => {
                  const isCurrentMonth =
                    date.getMonth() === calendarMonth.getMonth() &&
                    date.getFullYear() === calendarMonth.getFullYear();

                  const isToday = isSameCalendarDay(date, new Date());
                  const dayMeetings = getMeetingsForCalendarDay(date);

                  return (
                    <div
                      key={getCalendarDayKey(date)}
                      className={`min-h-[132px] border-b border-r border-slate-200 p-2 ${
                        isCurrentMonth ? "bg-white" : "bg-slate-50/70"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-[#173B67] text-white"
                              : isCurrentMonth
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {date.getDate()}
                        </span>

                        {dayMeetings.length > 0 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            {dayMeetings.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayMeetings.slice(0, 3).map((meeting) => (
                          <button
                            key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                            type="button"
                            onClick={() => setSelectedMeeting(meeting)}
                            className={`block w-full truncate rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition hover:shadow-sm ${
                              meeting.status === "CANCELLED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : meeting.status === "COMPLETED"
                                ? "border-slate-200 bg-slate-100 text-slate-700"
                                : "border-blue-200 bg-blue-50 text-[#173B67]"
                            }`}
                          >
                            <span className="font-semibold">
                              {formatTime(meeting.startAt)}
                            </span>{" "}
                            {meeting.title}
                          </button>
                        ))}

                        {dayMeetings.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setSelectedMeeting(dayMeetings[3])}
                            className="px-2 text-[11px] font-semibold text-[#173B67] hover:underline"
                          >
                            +{dayMeetings.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : calendarView === "week" ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-center border-b border-slate-200 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  {calendarWeekLabel}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
                    <div className="border-r border-slate-200" />

                    {calendarWeekDays.map((date) => {
                      const isToday = isSameCalendarDay(date, new Date());

                      return (
                        <div
                          key={getCalendarDayKey(date)}
                          className="border-r border-slate-200 px-2 py-3 text-center last:border-r-0"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {new Intl.DateTimeFormat("en-IN", {
                              weekday: "short",
                            }).format(date)}
                          </p>

                          <div
                            className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday
                                ? "bg-[#173B67] text-white"
                                : "text-slate-800"
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                    <div className="relative border-r border-slate-200 bg-slate-50">
                      {weekHourRows.map((hour) => (
                        <div
                          key={hour}
                          className="flex h-[72px] items-start justify-end border-b border-slate-200 px-2 pt-1 text-[10px] font-medium text-slate-400"
                        >
                          {new Intl.DateTimeFormat("en-IN", {
                            hour: "numeric",
                          }).format(new Date(2026, 0, 1, hour, 0))}
                        </div>
                      ))}
                    </div>

                    {calendarWeekDays.map((date) => {
                      const dayMeetings = getMeetingsForCalendarDay(date);
                      const isToday = isSameCalendarDay(date, new Date());

                      return (
                        <div
                          key={getCalendarDayKey(date)}
                          className={`relative border-r border-slate-200 last:border-r-0 ${
                            isToday ? "bg-blue-50/20" : "bg-white"
                          }`}
                          style={{
                            height: `${weekHourRows.length * weekHourHeight}px`,
                          }}
                        >
                          {weekHourRows.map((hour) => (
                            <div
                              key={hour}
                              className="h-[72px] border-b border-slate-200"
                            />
                          ))}

                          {dayMeetings.map((meeting) => {
                            const style = getCalendarEventStyle(meeting);

                            return (
                              <button
                                key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                                type="button"
                                onClick={() => setSelectedMeeting(meeting)}
                                className={`absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-left text-[10px] font-medium shadow-sm ${
                                  meeting.status === "CANCELLED"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : meeting.status === "COMPLETED"
                                    ? "border-slate-200 bg-slate-100 text-slate-700"
                                    : "border-blue-200 bg-blue-50 text-[#173B67]"
                                }`}
                                style={style}
                              >
                                <div className="truncate font-semibold">
                                  {formatTime(meeting.startAt)}{" "}
                                  {meeting.title}
                                </div>

                                <div className="mt-0.5 truncate opacity-80">
                                  {getMeetingTypeLabel(meeting.meetingType)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : calendarView === "day" ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4 text-center">
                <h3 className="text-base font-semibold text-slate-900">
                  {calendarDayLabel}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <div className="grid min-w-[760px] grid-cols-[80px_1fr]">
                  <div className="border-r border-slate-200 bg-slate-50">
                    {weekHourRows.map((hour) => (
                      <div
                        key={hour}
                        className="flex h-[72px] items-start justify-end border-b border-slate-200 px-2 pt-1 text-[10px] font-medium text-slate-400"
                      >
                        {new Intl.DateTimeFormat("en-IN", {
                          hour: "numeric",
                        }).format(new Date(2026, 0, 1, hour, 0))}
                      </div>
                    ))}
                  </div>

                  <div
                    className="relative bg-white"
                    style={{
                      height: `${weekHourRows.length * weekHourHeight}px`,
                    }}
                  >
                    {weekHourRows.map((hour) => (
                      <div
                        key={hour}
                        className="h-[72px] border-b border-slate-200"
                      />
                    ))}

                    {getMeetingsForCalendarDay(calendarWeekDate).map(
                      (meeting) => {
                        const style = getCalendarEventStyle(meeting);

                        return (
                          <button
                            key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                            type="button"
                            onClick={() => setSelectedMeeting(meeting)}
                            className={`absolute left-2 right-2 overflow-hidden rounded-lg border px-3 py-2 text-left text-xs font-medium shadow-sm ${
                              meeting.status === "CANCELLED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : meeting.status === "COMPLETED"
                                ? "border-slate-200 bg-slate-100 text-slate-700"
                                : "border-blue-200 bg-blue-50 text-[#173B67]"
                            }`}
                            style={style}
                          >
                            <div className="truncate font-semibold">
                              {meeting.title}
                            </div>
                            <div className="mt-1 truncate">
                              {formatTime(meeting.startAt)} –{" "}
                              {formatTime(meeting.endAt)}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  {calendarMonthLabel}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Trainer meetings for this month.
                </p>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                {agendaDates.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-slate-500">
                    No calendar events for this month.
                  </div>
                ) : (
                  agendaDates.map(([dateKey, dateMeetings]) => {
                    const date = new Date(`${dateKey}T00:00:00`);
                    const isToday = isSameCalendarDay(date, new Date());

                    return (
                      <div
                        key={dateKey}
                        ref={isToday ? agendaTodayRef : undefined}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <div
                          className={`sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 px-5 py-3 ${
                            isToday ? "bg-blue-50" : "bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {new Intl.DateTimeFormat("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              }).format(date)}
                            </p>
                          </div>

                          {isToday && (
                            <span className="rounded-full bg-[#173B67] px-2.5 py-1 text-[11px] font-semibold text-white">
                              Today
                            </span>
                          )}
                        </div>

                        {dateMeetings.length === 0 ? (
                          <div className="px-5 py-4 text-sm text-slate-400">
                            No events scheduled.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {dateMeetings.map((meeting) => {
                              const Icon = getMeetingTypeIcon(
                                meeting.meetingType
                              );

                              return (
                                <button
                                  key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                                  type="button"
                                  onClick={() => setSelectedMeeting(meeting)}
                                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                                >
                                  <div className="w-20 shrink-0 text-sm font-semibold text-slate-700">
                                    {formatTime(meeting.startAt)}
                                  </div>

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/10 text-[#173B67]">
                                    <Icon size={18} />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {meeting.title}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                      {getMeetingTypeLabel(meeting.meetingType)}
                                      {meeting.course?.title
                                        ? ` • ${meeting.course.title}`
                                        : ""}
                                      {meeting.batch?.name
                                        ? ` • ${meeting.batch.name}`
                                        : ""}
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
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
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Upcoming Events
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your next scheduled meetings.
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Loading calendar...
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No upcoming events.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingMeetings.slice(0, 8).map((meeting) => {
                const Icon = getMeetingTypeIcon(meeting.meetingType);

                return (
                  <button
                    key={`${meeting.calendarSource || "MEETING"}-${meeting.id}`}
                    type="button"
                    onClick={() => setSelectedMeeting(meeting)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/10 text-[#173B67]">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
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

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
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
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#173B67]/10 px-2.5 py-1 text-[11px] font-semibold text-[#173B67]">
                    {editingMeeting ? "Edit Meeting" : "Create Meeting"}
                  </span>
                  {editingMeeting && (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                        editingMeeting.status
                      )}`}
                    >
                      {editingMeeting.status}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {editingMeeting ? "Update Meeting" : "Schedule Meeting"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingMeeting
                    ? "Update the meeting details. The system will re-check participant, batch, trainer, and organizer conflicts."
                    : "Schedule a meeting with your assigned students, batch, or trainers."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateMeetingModal}
                disabled={savingMeeting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close meeting form"
              >
                <XCircle size={20} />
              </button>
            </div>

            {formError && (
              <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-3.5">
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
                      formError
                        .toLowerCase()
                        .includes("scheduled meeting")) && (
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
              onSubmit={
                editingMeeting
                  ? handleUpdateMeeting
                  : handleCreateMeeting
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                {optionsLoading ? (
                  <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Loader2
                        size={24}
                        className="animate-spin text-[#173B67]"
                      />
                      <p className="text-sm font-medium text-slate-600">
                        Loading meeting options...
                      </p>
                    </div>
                  </div>
                ) : meetingOptions ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Meeting Title *
                        </span>
                        <input
                          value={form.title}
                          maxLength={255}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                        />
                      </label>

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Meeting Type *
                        </span>
                        <select
                          value={form.meetingType}
                          onChange={(event) => {
                            const meetingType =
                              event.target.value as MeetingType;

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
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                        >
                          <option value="BATCH_MEETING">
                            Batch Meeting
                          </option>
                          <option value="STUDENT_MEETING">
                            Student Meeting
                          </option>
                          <option value="ONE_TO_ONE">
                            One-to-One
                          </option>
                          <option value="INTERNAL_MEETING">
                            Internal Meeting
                          </option>
                        </select>
                      </label>

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Meeting Platform
                        </span>
                        <select
                          value={form.meetingPlatform}
                          onChange={(event) => {
                            setForm((current) => ({
                              ...current,
                              meetingPlatform:
                                event.target.value as MeetingPlatform,
                            }));
                            setFormError("");
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                        >
                          <option value="GOOGLE_MEET">
                            Google Meet
                          </option>
                          <option value="MICROSOFT_TEAMS">
                            Microsoft Teams
                          </option>
                          <option value="ZOOM">Zoom</option>
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Description
                      </span>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                      />
                    </label>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Start *
                        </span>
                        <input
                          type="datetime-local"
                          value={form.startAt}
                          onChange={(event) => {
                            setForm((current) => ({
                              ...current,
                              startAt: event.target.value,
                            }));
                            setFormError("");
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                        />
                      </label>

                      <label>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          End *
                        </span>
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
                          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Course
                        </span>
                        <select
                          value={form.courseId}
                          onChange={(event) => {
                            setForm((current) => ({
                              ...current,
                              courseId: event.target.value,
                            }));
                            setFormError("");
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                        >
                          <option value="">No course</option>
                          {meetingOptions.courses.map((course) => (
                            <option
                              key={course.id}
                              value={course.id}
                            >
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </label>

                      {(form.meetingType === "BATCH_MEETING" ||
                        form.meetingType === "STUDENT_MEETING") && (
                        <label>
                          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Batch *
                          </span>
                          <select
                            value={form.batchId}
                            onChange={(event) => {
                              const batchId = event.target.value;
                              const batch =
                                meetingOptions.batches.find(
                                  (item) =>
                                    String(item.id) === batchId
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
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                          >
                            <option value="">Select batch</option>
                            {meetingOptions.batches.map((batch) => (
                              <option
                                key={batch.id}
                                value={batch.id}
                              >
                                {batch.displayId
                                  ? `${batch.displayId} • `
                                  : ""}
                                {batch.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>

                    {(form.meetingType === "STUDENT_MEETING" ||
                      form.meetingType === "ONE_TO_ONE") && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Student Participants
                              <span className="ml-1 text-red-500">
                                *
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {form.meetingType === "ONE_TO_ONE"
                                ? "Select one student for this meeting."
                                : "Select one or more students for this meeting."}
                            </p>
                          </div>

                          <span className="rounded-full bg-[#173B67]/10 px-2.5 py-1 text-xs font-semibold text-[#173B67]">
                            {form.participantUserIds.length} selected
                          </span>
                        </div>

                        {form.meetingType === "ONE_TO_ONE" ? (
                          <select
                            value={
                              form.participantUserIds[0] ?? ""
                            }
                            onChange={(event) =>
                              toggleParticipant(
                                Number(event.target.value)
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                          >
                            <option value="">
                              Select a student
                            </option>
                            {meetingOptions.students.map(
                              (student) => (
                                <option
                                  key={student.userId}
                                  value={student.userId}
                                >
                                  {student.name} — {student.email}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                            {meetingOptions.students.map(
                              (student) => {
                                const selected =
                                  form.participantUserIds.includes(
                                    student.userId
                                  );

                                return (
                                  <label
                                    key={student.userId}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() =>
                                        toggleParticipant(
                                          student.userId
                                        )
                                      }
                                      className="h-4 w-4 rounded border-slate-300 text-[#173B67] focus:ring-[#173B67]"
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
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {form.meetingType === "INTERNAL_MEETING" && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Internal Participants
                              <span className="ml-1 text-red-500">
                                *
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Select one or more trainers for this internal meeting.
                            </p>
                          </div>

                          <span className="rounded-full bg-[#173B67]/10 px-2.5 py-1 text-xs font-semibold text-[#173B67]">
                            {form.participantUserIds.length} selected
                          </span>
                        </div>

                        {meetingOptions.trainers.length === 0 ? (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                            No active trainers are available.
                          </p>
                        ) : (
                          <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                            {meetingOptions.trainers.map(
                              (trainer) => {
                                const selected =
                                  form.participantUserIds.includes(
                                    trainer.userId
                                  );

                                return (
                                  <label
                                    key={trainer.userId}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() =>
                                        toggleParticipant(
                                          trainer.userId
                                        )
                                      }
                                      className="h-4 w-4 rounded border-slate-300 text-[#173B67] focus:ring-[#173B67]"
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
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {form.meetingType === "BATCH_MEETING" && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-[#173B67]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#173B67]">
                              Batch meeting
                            </p>
                            <p className="mt-1 text-xs leading-5 text-blue-700">
                              The selected batch determines the meeting audience.
                              The trainer, batch students, and organizer are
                              checked for overlapping scheduled meetings.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Meeting URL
                      </span>
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
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
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

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={closeCreateMeetingModal}
                  disabled={savingMeeting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={
                    savingMeeting ||
                    optionsLoading ||
                    !meetingOptions
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102c4f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingMeeting ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
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
          </div>
        </div>
      )}

      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      selectedMeeting.status
                    )}`}
                  >
                    {selectedMeeting.status}
                  </span>

                  <span className="text-xs font-medium text-slate-500">
                    {getMeetingTypeLabel(
                      selectedMeeting.meetingType
                    )}
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  {selectedMeeting.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeSelectedMeetingModal}
                disabled={cancellingMeeting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close meeting details"
              >
                <XCircle size={20} />
              </button>
            </div>

            {selectedMeetingError && (
              <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-3.5">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
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

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Clock3 size={14} />
                      Start
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTime(selectedMeeting.startAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Clock3 size={14} />
                      End
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTime(selectedMeeting.endAt)}
                    </p>
                  </div>
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
                  {selectedMeeting.course?.title && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <BookOpen size={14} />
                        Course
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedMeeting.course.title}
                      </p>
                    </div>
                  )}

                  {selectedMeeting.batch?.name && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <Layers size={14} />
                        Batch
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedMeeting.batch.displayId
                          ? `${selectedMeeting.batch.displayId} • `
                          : ""}
                        {selectedMeeting.batch.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <UserCircle size={14} />
                    Scheduled By
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getOrganizerLabel(selectedMeeting)}
                  </p>
                  {getOrganizerRole(selectedMeeting) ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {getOrganizerRole(selectedMeeting)}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Remote Assistance • UltraViewer
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Use UltraViewer alongside {getMeetingPlatformLabel(
                            selectedMeeting.meetingPlatform
                          )} when the trainer needs to work directly on the student's Windows PC.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://www.ultraviewer.net/en/download.html"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
                              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                void copyRemoteAssistValue(
                                  remoteAssistId,
                                  "UltraViewer ID"
                                )
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-slate-600 transition hover:bg-slate-100"
                              title="Copy UltraViewer ID"
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
                                type={
                                  showRemoteAssistPassword
                                    ? "text"
                                    : "password"
                                }
                                value={remoteAssistPassword}
                                onChange={(event) => {
                                  setRemoteAssistPassword(event.target.value);
                                  setRemoteAssistMessage("");
                                }}
                                autoComplete="off"
                                placeholder="Enter current password"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowRemoteAssistPassword(
                                    (current) => !current
                                  )
                                }
                                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
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
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-slate-600 transition hover:bg-slate-100"
                              title="Copy UltraViewer password"
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
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <ExternalLink size={15} />
                          Start Remote Assistance
                        </button>
                      </div>

                      {remoteAssistMessage && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
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
                        {selectedMeeting.participants.map(
                          (participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {participant.name ||
                                    "Participant"}
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
                          )
                        )}
                      </div>
                    </div>
                  )}

                {selectedMeeting.meetingUrl && (
                  <a
                    href={selectedMeeting.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102c4f]"
                  >
                    <Video size={16} />
                    Join Meeting
                  </a>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">
                  {selectedMeeting.status === "SCHEDULED"
                    ? "Scheduled meetings can be updated or cancelled by their organizer."
                    : selectedMeeting.status === "CANCELLED"
                    ? "This meeting has been cancelled."
                    : "This meeting is completed."}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {selectedMeeting.status === "SCHEDULED" &&
                    (() => {
                      const currentUserId = getCurrentUserId();
                      const canManage =
                        currentUserId === null ||
                        selectedMeeting.organizerUserId ===
                          currentUserId;

                      return canManage;
                    })() && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            openEditMeetingModal(
                              selectedMeeting
                            )
                          }
                          disabled={cancellingMeeting}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Pencil size={16} />
                          Update Meeting
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleCancelMeeting(
                              selectedMeeting
                            )
                          }
                          disabled={cancellingMeeting}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingMeeting ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Ban size={16} />
                          )}
                          {cancellingMeeting
                            ? "Cancelling..."
                            : "Cancel Meeting"}
                        </button>
                      </>
                    )}

                  {selectedMeeting.status === "SCHEDULED" &&
                    (() => {
                      const currentUserId = getCurrentUserId();
                      return (
                        currentUserId !== null &&
                        selectedMeeting.organizerUserId !==
                          currentUserId
                      );
                    })() && (
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                        Only the organizer can update or cancel this meeting.
                      </span>
                    )}

                  <button
                    type="button"
                    onClick={closeSelectedMeetingModal}
                    disabled={cancellingMeeting}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
