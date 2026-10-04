"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  MonitorUp,
  ShieldCheck,
  UserCircle,
  Users,
  Video,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type MeetingType =
  | "BATCH_MEETING"
  | "STUDENT_MEETING"
  | "INTERNAL_MEETING"
  | "ONE_TO_ONE"
  | "OTHER";

type MeetingStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

type CalendarMeetingType =
  | MeetingType
  | "LIVE_CLASS";

type CalendarMeetingStatus =
  | MeetingStatus
  | "LIVE";

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
  meetingPlatform?:
    | "GOOGLE_MEET"
    | "MICROSOFT_TEAMS"
    | "ZOOM"
    | "WHATSAPP"
    | "OTHER"
    | null;
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
    slug?: string | null;
    title?: string | null;
  } | null;
  batch?: {
    id: number;
    name?: string | null;
    displayId?: string | null;
  } | null;
  participants?: MeetingParticipant[];
}

interface LiveSession {
  id: number;
  courseId: number;
  trainerId: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  status:
    | "SCHEDULED"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";
  isPublished: boolean;
  course?: {
    id: number;
    slug?: string | null;
    title?: string | null;
  } | null;
  trainer?: {
    id: number;
    userId: number;
    name?: string | null;
    email?: string | null;
  } | null;
}

type CalendarMeeting = Omit<
  Meeting,
  "meetingType" | "status"
> & {
  meetingType: CalendarMeetingType;
  status: CalendarMeetingStatus;
  calendarSource: "MEETING" | "LIVE_SESSION";
};

type CalendarView =
  | "month"
  | "week"
  | "day"
  | "agenda";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

async function authenticatedFetch(
  path: string
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Authentication required. Please login again."
    );
  }

  const response = await fetch(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("student");
    localStorage.removeItem("studentId");

    window.location.href = "/login";
    throw new Error("Authentication required.");
  }

  return response;
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfWeek(date: Date) {
  const value = startOfDay(date);
  const day = value.getDay();
  value.setDate(value.getDate() - day);
  return value;
}

function addDays(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

function addMonths(date: Date, amount: number) {
  const value = new Date(date);
  value.setMonth(value.getMonth() + amount);
  return value;
}

function sameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function meetingTypeLabel(
  type: CalendarMeetingType
) {
  switch (type) {
    case "BATCH_MEETING":
      return "Batch Meeting";
    case "STUDENT_MEETING":
      return "Student Meeting";
    case "ONE_TO_ONE":
      return "One-to-One";
    case "INTERNAL_MEETING":
      return "Internal Meeting";
    case "LIVE_CLASS":
      return "Live Class";
    default:
      return "Meeting";
  }
}

function statusLabel(
  status: CalendarMeetingStatus
) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function eventIsUpcoming(
  event: CalendarMeeting
) {
  return (
    event.status === "SCHEDULED" ||
    event.status === "LIVE"
  ) && new Date(event.endAt).getTime() >=
    Date.now();
}

function eventIsToday(
  event: CalendarMeeting
) {
  return sameDay(
    new Date(event.startAt),
    new Date()
  );
}

function eventColor(
  event: CalendarMeeting
) {
  if (event.meetingType === "LIVE_CLASS") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (event.status === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (event.meetingType === "ONE_TO_ONE") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (event.meetingType === "STUDENT_MEETING") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (event.meetingType === "INTERNAL_MEETING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function buildMonthDays(date: Date) {
  const first = new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
  const firstDay = first.getDay();

  const start = addDays(first, -firstDay);
  return Array.from(
    { length: 42 },
    (_, index) => addDays(start, index)
  );
}

function eventOccursOnDay(
  event: CalendarMeeting,
  day: Date
) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  return (
    sameDay(start, day) ||
    sameDay(end, day) ||
    (start < startOfDay(day) &&
      end > endOfDay(day))
  );
}

function eventsForDay(
  events: CalendarMeeting[],
  day: Date
) {
  return events
    .filter((event) =>
      eventOccursOnDay(event, day)
    )
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() -
        new Date(b.startAt).getTime()
    );
}

function calendarTitle(
  view: CalendarView,
  month: Date,
  weekDate: Date,
  dayDate: Date
) {
  if (view === "month") {
    return month.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  }

  if (view === "day") {
    return dayDate.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  if (view === "week") {
    const start = startOfWeek(weekDate);
    const end = addDays(start, 6);

    if (
      start.getMonth() === end.getMonth()
    ) {
      return `${start.toLocaleDateString(
        "en-IN",
        {
          month: "long",
        }
      )} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${start.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    )} – ${end.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )}`;
  }

  return "Upcoming Events";
}

export default function StudentCalendarPage() {
  const [meetings, setMeetings] =
    useState<Meeting[]>([]);
  const [liveSessions, setLiveSessions] =
    useState<LiveSession[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");
  const [selectedMeeting, setSelectedMeeting] =
    useState<CalendarMeeting | null>(null);
  const [remoteAssistId, setRemoteAssistId] =
    useState("");
  const [remoteAssistPassword, setRemoteAssistPassword] =
    useState("");
  const [showRemoteAssistPassword, setShowRemoteAssistPassword] =
    useState(false);
  const [remoteAssistCopyMessage, setRemoteAssistCopyMessage] =
    useState("");

  const [calendarView, setCalendarView] =
    useState<CalendarView>("month");
  const [calendarMonth, setCalendarMonth] =
    useState(new Date());
  const [calendarWeekDate, setCalendarWeekDate] =
    useState(new Date());
  const [calendarDayDate, setCalendarDayDate] =
    useState(new Date());

  const agendaTodayRef =
    useRef<HTMLDivElement | null>(null);

  const loadCalendar = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const meetingResponse =
          await authenticatedFetch(
            `${API_URL}/meetings`
          );

        const meetingResult: ApiResponse<
          Meeting[]
        > = await meetingResponse.json();

        if (
          !meetingResponse.ok ||
          !meetingResult.success
        ) {
          throw new Error(
            meetingResult.message ||
              "Failed to load student calendar meetings."
          );
        }

        setMeetings(
          Array.isArray(meetingResult.data)
            ? meetingResult.data
            : []
        );

        try {
          const liveResponse =
            await authenticatedFetch(
              `${API_URL}/live-sessions`
            );

          const liveResult: ApiResponse<
            LiveSession[]
          > = await liveResponse.json();

          if (
            liveResponse.ok &&
            liveResult.success
          ) {
            setLiveSessions(
              Array.isArray(liveResult.data)
                ? liveResult.data
                : []
            );
          } else {
            setLiveSessions([]);
          }
        } catch (liveError) {
          console.warn(
            "Student live sessions could not be loaded:",
            liveError
          );
          setLiveSessions([]);
        }
      } catch (err) {
        console.error(
          "Failed to load student calendar:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load student calendar."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const calendarMeetings =
    useMemo<CalendarMeeting[]>(() => {
      const normalMeetings =
        meetings.map((meeting) => ({
          ...meeting,
          calendarSource: "MEETING" as const,
        }));

      const liveMeetingEvents =
        liveSessions
          .filter(
            (session) =>
              session.isPublished !== false
          )
          .map(
            (session): CalendarMeeting => ({
              id: -session.id,
              organizerUserId:
                session.trainer?.userId ?? 0,
              title: session.title,
              description: session.description,
              startAt: session.startAt,
              endAt: session.endAt,
              meetingUrl: session.meetingUrl,
              meetingType: "LIVE_CLASS",
              status: session.status,
              courseId: session.courseId,
              batchId: null,
              organizer: session.trainer
                ? {
                    id:
                      session.trainer.userId,
                    name:
                      session.trainer.name,
                    email:
                      session.trainer.email,
                    role: "TRAINER",
                  }
                : null,
              course: session.course
                ? {
                    id: session.course.id,
                    slug:
                      session.course.slug,
                    title:
                      session.course.title,
                  }
                : null,
              batch: null,
              participants: [],
              calendarSource:
                "LIVE_SESSION",
            })
          );

      return [
        ...normalMeetings,
        ...liveMeetingEvents,
      ].sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime()
      );
    }, [meetings, liveSessions]);

  const todayEvents = useMemo(
    () =>
      calendarMeetings.filter(eventIsToday),
    [calendarMeetings]
  );

  const upcomingEvents = useMemo(
    () =>
      calendarMeetings
        .filter(eventIsUpcoming)
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() -
            new Date(b.startAt).getTime()
        ),
    [calendarMeetings]
  );

  const scheduledCount = useMemo(
    () =>
      calendarMeetings.filter(
        (event) =>
          event.status === "SCHEDULED" ||
          event.status === "LIVE"
      ).length,
    [calendarMeetings]
  );

  function goToCurrentPeriod() {
    const today = new Date();

    if (calendarView === "agenda") {
      setCalendarMonth(today);
      setCalendarWeekDate(today);
      setCalendarDayDate(today);

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
      setCalendarMonth(today);
      return;
    }

    if (calendarView === "week") {
      setCalendarWeekDate(today);
      return;
    }

    setCalendarDayDate(today);
  }

  function goPrevious() {
    if (calendarView === "month") {
      setCalendarMonth(
        addMonths(calendarMonth, -1)
      );
      return;
    }

    if (calendarView === "week") {
      setCalendarWeekDate(
        addDays(calendarWeekDate, -7)
      );
      return;
    }

    if (calendarView === "day") {
      setCalendarDayDate(
        addDays(calendarDayDate, -1)
      );
      return;
    }

    setCalendarMonth(
      addMonths(calendarMonth, -1)
    );
  }

  function goNext() {
    if (calendarView === "month") {
      setCalendarMonth(
        addMonths(calendarMonth, 1)
      );
      return;
    }

    if (calendarView === "week") {
      setCalendarWeekDate(
        addDays(calendarWeekDate, 7)
      );
      return;
    }

    if (calendarView === "day") {
      setCalendarDayDate(
        addDays(calendarDayDate, 1)
      );
      return;
    }

    setCalendarMonth(
      addMonths(calendarMonth, 1)
    );
  }

  function openMeeting(
    event: CalendarMeeting
  ) {
    setSelectedMeeting(event);
    setRemoteAssistId("");
    setRemoteAssistPassword("");
    setShowRemoteAssistPassword(false);
    setRemoteAssistCopyMessage("");
  }

  function closeMeetingDetails() {
    setSelectedMeeting(null);
    setRemoteAssistId("");
    setRemoteAssistPassword("");
    setShowRemoteAssistPassword(false);
    setRemoteAssistCopyMessage("");
  }

  async function copyRemoteAssistValue(
    value: string,
    label: string
  ) {
    if (!value.trim()) {
      setRemoteAssistCopyMessage(`Enter the ${label} first.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setRemoteAssistCopyMessage(`${label} copied.`);
      window.setTimeout(() => {
        setRemoteAssistCopyMessage("");
      }, 1800);
    } catch {
      setRemoteAssistCopyMessage(
        `Unable to copy the ${label.toLowerCase()}.`
      );
    }
  }

  function renderEvent(
    event: CalendarMeeting,
    compact = false
  ) {
    return (
      <button
        key={`${event.calendarSource}-${event.id}`}
        type="button"
        onClick={() => openMeeting(event)}
        className={`w-full rounded-lg border px-2.5 py-2 text-left transition hover:shadow-sm ${eventColor(
          event
        )}`}
      >
        <div className="flex items-center gap-1.5">
          {event.meetingType ===
          "LIVE_CLASS" ? (
            <Video size={13} />
          ) : (
            <CalendarDays size={13} />
          )}

          <span className="truncate text-xs font-semibold">
            {formatTime(event.startAt)}{" "}
            {event.title}
          </span>
        </div>

        {!compact && (
          <div className="mt-1 truncate text-[11px] opacity-75">
            {meetingTypeLabel(
              event.meetingType
            )}
          </div>
        )}
      </button>
    );
  }

  function renderMonthView() {
    const days = buildMonthDays(
      calendarMonth
    );

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {[
            "SUN",
            "MON",
            "TUE",
            "WED",
            "THU",
            "FRI",
            "SAT",
          ].map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-semibold text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const outside =
              day.getMonth() !==
              calendarMonth.getMonth();

            const isToday = sameDay(
              day,
              new Date()
            );

            const dayEvents =
              eventsForDay(
                calendarMeetings,
                day
              );

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[145px] border-b border-r border-slate-200 p-2 ${
                  outside
                    ? "bg-slate-50/60"
                    : "bg-white"
                }`}
              >
                <div className="mb-2 flex justify-between">
                  <span
                    className={`text-xs ${
                      outside
                        ? "text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {isToday ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#173B67] font-semibold text-white">
                        {day.getDate()}
                      </span>
                    ) : (
                      day.getDate()
                    )}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {dayEvents
                    .slice(0, 4)
                    .map((event) =>
                      renderEvent(
                        event,
                        true
                      )
                    )}

                  {dayEvents.length > 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarDayDate(
                          day
                        );
                        setCalendarView(
                          "day"
                        );
                      }}
                      className="text-xs font-medium text-[#173B67] hover:underline"
                    >
                      +{dayEvents.length - 4} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWeekView() {
    const start = startOfWeek(
      calendarWeekDate
    );
    const days = Array.from(
      { length: 7 },
      (_, index) => addDays(start, index)
    );

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {days.map((day) => {
              const isToday = sameDay(
                day,
                new Date()
              );

              return (
                <div
                  key={day.toISOString()}
                  className="border-r border-slate-200 px-3 py-3 text-center"
                >
                  <div className="text-xs font-semibold text-slate-500">
                    {day.toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "short",
                      }
                    )}
                  </div>
                  <div
                    className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-[#173B67] text-white"
                        : "text-slate-700"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="min-h-[500px] border-r border-slate-200 p-2"
              >
                <div className="space-y-2">
                  {eventsForDay(
                    calendarMeetings,
                    day
                  ).map((event) =>
                    renderEvent(event)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderDayView() {
    const events =
      eventsForDay(
        calendarMeetings,
        calendarDayDate
      );

    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="text-sm font-semibold text-slate-800">
            {calendarDayDate.toLocaleDateString(
              "en-IN",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </div>
        </div>

        <div className="min-h-[520px] p-5">
          {events.length === 0 ? (
            <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
              No meetings or live classes
              scheduled for this day.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) =>
                renderEvent(event)
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAgendaView() {
    const grouped = new Map<
      string,
      {
        day: Date;
        events: CalendarMeeting[];
      }
    >();

    for (const event of calendarMeetings) {
      const day = startOfDay(
        new Date(event.startAt)
      );
      const key = day.toISOString();

      if (!grouped.has(key)) {
        grouped.set(key, {
          day,
          events: [],
        });
      }

      grouped
        .get(key)!
        .events.push(event);
    }

    const groups = Array.from(
      grouped.values()
    ).sort(
      (a, b) =>
        a.day.getTime() -
        b.day.getTime()
    );

    return (
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No calendar events available.
          </div>
        ) : (
          groups.map((group) => {
            const isToday = sameDay(
              group.day,
              new Date()
            );

            return (
              <div
                key={group.day.toISOString()}
                ref={
                  isToday
                    ? agendaTodayRef
                    : undefined
                }
                className={`rounded-xl border bg-white ${
                  isToday
                    ? "border-[#173B67] shadow-sm"
                    : "border-slate-200"
                }`}
              >
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isToday
                          ? "bg-[#173B67] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {group.day.getDate()}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {group.day.toLocaleDateString(
                          "en-IN",
                          {
                            weekday: "long",
                          }
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {group.day.toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>

                    {isToday && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  {group.events.map(
                    (event) =>
                      renderEvent(event)
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-4 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#173B67] text-white">
              <CalendarDays size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Calendar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                View your meetings, batch activities,
                and live classes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadCalendar(true)
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
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
      </div>

      <div className="space-y-6 px-8 py-6">
        {error && (
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Total Events
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {calendarMeetings.length}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Scheduled
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">
              {scheduledCount}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Today's Events
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {todayEvents.length}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Upcoming
            </div>
            <div className="mt-2 text-3xl font-bold text-[#173B67]">
              {upcomingEvents.length}
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Calendar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View meetings and live classes by
                month, week, day, or agenda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white">
                {(
                  [
                    ["month", "Month"],
                    ["week", "Week"],
                    ["day", "Day"],
                    ["agenda", "Agenda"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setCalendarView(value)
                    }
                    className={`px-4 py-2 text-sm font-medium ${
                      calendarView === value
                        ? "bg-[#173B67] text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goToCurrentPeriod}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>

              <button
                type="button"
                onClick={goPrevious}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                aria-label="Previous period"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={goNext}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                aria-label="Next period"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {calendarTitle(
                calendarView,
                calendarMonth,
                calendarWeekDate,
                calendarDayDate
              )}
            </h3>
          </div>

          {loading ? (
            <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
              Loading calendar...
            </div>
          ) : (
            <>
              {calendarView === "month" &&
                renderMonthView()}
              {calendarView === "week" &&
                renderWeekView()}
              {calendarView === "day" &&
                renderDayView()}
              {calendarView === "agenda" &&
                renderAgendaView()}
            </>
          )}
        </section>
      </div>

      {selectedMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() =>
            setSelectedMeeting(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  {selectedMeeting.meetingType ===
                  "LIVE_CLASS" ? (
                    <Video
                      size={18}
                      className="text-sky-600"
                    />
                  ) : (
                    <CalendarDays
                      size={18}
                      className="text-[#173B67]"
                    />
                  )}

                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {meetingTypeLabel(
                      selectedMeeting.meetingType
                    )}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  {selectedMeeting.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeMeetingDetails}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close details"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock3 size={14} />
                    Start
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedMeeting.startAt
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock3 size={14} />
                    End
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedMeeting.endAt
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {statusLabel(
                    selectedMeeting.status
                  )}
                </span>

                {selectedMeeting.course?.title && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {selectedMeeting.course.title}
                  </span>
                )}

                {selectedMeeting.batch?.name && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    {selectedMeeting.batch.name}
                  </span>
                )}
              </div>

              {selectedMeeting.description && (
                <div>
                  <div className="mb-1 text-sm font-semibold text-slate-800">
                    Description
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedMeeting.description}
                  </p>
                </div>
              )}

              {selectedMeeting.calendarSource ===
                "MEETING" &&
                selectedMeeting.meetingPlatform && (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
                    <Video
                      size={22}
                      className="text-slate-500"
                    />
                    <div>
                      <div className="text-xs text-slate-500">
                        Meeting Platform
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedMeeting.meetingPlatform ===
                        "GOOGLE_MEET"
                          ? "Google Meet"
                          : selectedMeeting.meetingPlatform ===
                            "MICROSOFT_TEAMS"
                          ? "Microsoft Teams"
                          : selectedMeeting.meetingPlatform ===
                            "ZOOM"
                          ? "Zoom"
                          : selectedMeeting.meetingPlatform ===
                            "WHATSAPP"
                          ? "WhatsApp"
                          : "Other"}
                      </div>
                    </div>
                  </div>
                )}

              {selectedMeeting.organizer && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
                  <UserCircle
                    size={22}
                    className="text-slate-500"
                  />
                  <div>
                    <div className="text-xs text-slate-500">
                      Organizer
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {selectedMeeting.organizer
                        .name ||
                        "Organizer"}
                    </div>
                    {selectedMeeting.organizer
                      .email && (
                      <div className="text-xs text-slate-500">
                        {
                          selectedMeeting
                            .organizer.email
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedMeeting.batch?.name && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
                  <Users
                    size={22}
                    className="text-slate-500"
                  />
                  <div>
                    <div className="text-xs text-slate-500">
                      Batch
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {selectedMeeting.batch.name}
                    </div>
                  </div>
                </div>
              )}

              {selectedMeeting.calendarSource ===
                "MEETING" &&
                selectedMeeting.participants &&
                selectedMeeting.participants
                  .length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-800">
                      Participants
                    </div>
                    <div className="space-y-2">
                      {selectedMeeting.participants.map(
                        (participant) => (
                          <div
                            key={
                              participant.id
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <div className="text-sm font-medium text-slate-800">
                              {participant.name ||
                                "Participant"}
                            </div>
                            {participant.email && (
                              <div className="text-xs text-slate-500">
                                {
                                  participant.email
                                }
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedMeeting.calendarSource ===
                "MEETING" &&
                (selectedMeeting.status === "SCHEDULED" ||
                  selectedMeeting.status === "LIVE") && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <MonitorUp size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              Remote Assistance · UltraViewer
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              Keep the video call running and use UltraViewer when your trainer needs to work directly on your computer. Share your current UltraViewer ID and temporary password with the trainer through the meeting chat.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                "https://www.ultraviewer.net/",
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                          >
                            <ExternalLink size={13} />
                            UltraViewer
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Your UltraViewer ID
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={remoteAssistId}
                                onChange={(event) =>
                                  setRemoteAssistId(event.target.value)
                                }
                                placeholder="Enter current ID"
                                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  void copyRemoteAssistValue(
                                    remoteAssistId,
                                    "UltraViewer ID"
                                  )
                                }
                                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-slate-600 hover:bg-slate-50"
                                aria-label="Copy UltraViewer ID"
                                title="Copy UltraViewer ID"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </label>

                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Temporary Password
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
                                  onChange={(event) =>
                                    setRemoteAssistPassword(event.target.value)
                                  }
                                  placeholder="Enter current password"
                                  autoComplete="off"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowRemoteAssistPassword((current) => !current)
                                  }
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-slate-600 hover:bg-slate-50"
                                aria-label="Copy UltraViewer password"
                                title="Copy UltraViewer password"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </label>
                        </div>

                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                          <span>
                            SKCE does not save these UltraViewer credentials. Enter the current values from the UltraViewer application and share them only with your trainer.
                          </span>
                        </div>

                        {remoteAssistCopyMessage && (
                          <div className="mt-2 text-xs font-medium text-violet-700">
                            {remoteAssistCopyMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {selectedMeeting.meetingUrl &&
                (selectedMeeting.status ===
                  "SCHEDULED" ||
                  selectedMeeting.status ===
                    "LIVE") && (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        selectedMeeting.meetingUrl!,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#173B67] px-4 py-3 text-sm font-semibold text-white hover:bg-[#102c4f]"
                  >
                    <ExternalLink size={16} />
                    Join Meeting
                  </button>
                )}

              {selectedMeeting.calendarSource ===
                "LIVE_SESSION" &&
                selectedMeeting.meetingUrl &&
                (selectedMeeting.status ===
                  "SCHEDULED" ||
                  selectedMeeting.status ===
                    "LIVE") && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700">
                    This event is a published live
                    class. Joining is available through
                    the Live Sessions flow.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
