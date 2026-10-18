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
  CheckCircle2,
  Sun,
  Hourglass,
  Search,
  X,
} from "lucide-react";
import {
  DetailPanel,
  Modal,
  SkStyles,
  SkTile,
  reveal,
  usePreview,
} from "@/components/student/skce-ui";
import {
  AdminPageHeader,
  ADMIN_BTN_GHOST,
} from "@/components/dashboard/admin/AdminPageHeader";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type MeetingType =
  | "BATCH_MEETING"
  | "STUDENT_MEETING"
  | "INTERNAL_MEETING"
  | "ONE_TO_ONE"
  | "OTHER";
type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
type CalendarMeetingType = MeetingType;
type CalendarMeetingStatus = MeetingStatus | "LIVE";
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

type CalendarMeeting = Omit<Meeting, "meetingType" | "status"> & {
  meetingType: CalendarMeetingType;
  status: CalendarMeetingStatus;
  calendarSource: "MEETING";
};
type CalendarView = "month" | "week" | "day" | "agenda";
type TileKey = "total" | "scheduled" | "today" | "upcoming";
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
async function authenticatedFetch(path: string) {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication required. Please login again.");
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
function sameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function meetingTypeLabel(type: CalendarMeetingType) {
  switch (type) {
    case "BATCH_MEETING":
      return "Batch Meeting";
    case "STUDENT_MEETING":
      return "Student Meeting";
    case "ONE_TO_ONE":
      return "One-to-One";
    case "INTERNAL_MEETING":
      return "Internal Meeting";
    default:
      return "Meeting";
  }
}
function statusLabel(status: CalendarMeetingStatus) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}
function eventIsUpcoming(event: CalendarMeeting) {
  return (
    event.status === "SCHEDULED" &&
    new Date(event.endAt).getTime() >= Date.now()
  );
}
function eventIsToday(event: CalendarMeeting) {
  return sameDay(new Date(event.startAt), new Date());
}
function eventTone(event: CalendarMeeting) {
  if (event.status === "CANCELLED") {
    return "stc-ev-cancel";
  }
  if (event.meetingType === "ONE_TO_ONE") {
    return "stc-ev-one";
  }
  if (event.meetingType === "STUDENT_MEETING") {
    return "stc-ev-student";
  }
  if (event.meetingType === "INTERNAL_MEETING") {
    return "stc-ev-internal";
  }
  return "stc-ev-batch";
}
function buildMonthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDay = first.getDay();
  const start = addDays(first, -firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
function eventOccursOnDay(event: CalendarMeeting, day: Date) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  return (
    sameDay(start, day) ||
    sameDay(end, day) ||
    (start < startOfDay(day) && end > endOfDay(day))
  );
}
function eventsForDay(events: CalendarMeeting[], day: Date) {
  return events
    .filter((event) => eventOccursOnDay(event, day))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
}
function calendarTitle(
  view: CalendarView,
  month: Date,
  weekDate: Date,
  dayDate: Date
) {
  if (view === "month") {
    return month.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }
  if (view === "day") {
    return dayDate.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (view === "week") {
    const start = startOfWeek(weekDate);
    const end = addDays(start, 6);
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString("en-IN", {
        month: "long",
      })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })} – ${end.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }
  return "Upcoming Events";
}
export default function StudentCalendarPage() {
  const tilePreview = usePreview<TileKey>("total");
  const dayPreview = usePreview<string>(String(startOfDay(new Date()).getTime()));
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedMeeting, setSelectedMeeting] =
    useState<CalendarMeeting | null>(null);
  const [remoteAssistId, setRemoteAssistId] = useState("");
  const [remoteAssistPassword, setRemoteAssistPassword] = useState("");
  const [showRemoteAssistPassword, setShowRemoteAssistPassword] =
    useState(false);
  const [remoteAssistCopyMessage, setRemoteAssistCopyMessage] = useState("");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarWeekDate, setCalendarWeekDate] = useState(new Date());
  const [calendarDayDate, setCalendarDayDate] = useState(new Date());
  const agendaTodayRef = useRef<HTMLDivElement | null>(null);
  const loadCalendar = useCallback(async (showRefresh = false) => {
    try {
      setError("");
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const meetingResponse = await authenticatedFetch(`${API_URL}/meetings`);
      const meetingResult: ApiResponse<Meeting[]> = await meetingResponse.json();
      if (!meetingResponse.ok || !meetingResult.success) {
        throw new Error(
          meetingResult.message || "Failed to load student calendar meetings."
        );
      }
      setMeetings(Array.isArray(meetingResult.data) ? meetingResult.data : []);
    } catch (err) {
      console.error("Failed to load student calendar:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load student calendar."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const filtersActive =
    filterSearch.trim() !== "" || filterType !== "ALL" || filterStatus !== "ALL";
  const clearFilters = () => {
    setFilterSearch("");
    setFilterType("ALL");
    setFilterStatus("ALL");
  };
  const allMeetings = useMemo<CalendarMeeting[]>(() => {
    return meetings
      .map((meeting): CalendarMeeting => ({
        ...meeting,
        calendarSource: "MEETING",
      }))
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
  }, [meetings]);
  const calendarMeetings = useMemo<CalendarMeeting[]>(() => {
    const q = filterSearch.trim().toLowerCase();
    return allMeetings.filter((m) => {
      if (filterType !== "ALL" && m.meetingType !== filterType) return false;
      if (filterStatus !== "ALL" && m.status !== filterStatus) return false;
      if (q) {
        const hay = `${m.title} ${m.description ?? ""} ${meetingTypeLabel(m.meetingType)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allMeetings, filterSearch, filterType, filterStatus]);
  const todayEvents = useMemo(
    () => calendarMeetings.filter(eventIsToday),
    [calendarMeetings]
  );
  const upcomingEvents = useMemo(
    () =>
      calendarMeetings
        .filter(eventIsUpcoming)
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        ),
    [calendarMeetings]
  );
  const scheduledEvents = useMemo(
    () =>
      calendarMeetings.filter(
        (event) => event.status === "SCHEDULED"
      ),
    [calendarMeetings]
  );
  const scheduledCount = scheduledEvents.length;
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
      setCalendarMonth(addMonths(calendarMonth, -1));
      return;
    }
    if (calendarView === "week") {
      setCalendarWeekDate(addDays(calendarWeekDate, -7));
      return;
    }
    if (calendarView === "day") {
      setCalendarDayDate(addDays(calendarDayDate, -1));
      return;
    }
    setCalendarMonth(addMonths(calendarMonth, -1));
  }
  function goNext() {
    if (calendarView === "month") {
      setCalendarMonth(addMonths(calendarMonth, 1));
      return;
    }
    if (calendarView === "week") {
      setCalendarWeekDate(addDays(calendarWeekDate, 7));
      return;
    }
    if (calendarView === "day") {
      setCalendarDayDate(addDays(calendarDayDate, 1));
      return;
    }
    setCalendarMonth(addMonths(calendarMonth, 1));
  }
  function openMeeting(event: CalendarMeeting) {
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
  async function copyRemoteAssistValue(value: string, label: string) {
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
      setRemoteAssistCopyMessage(`Unable to copy the ${label.toLowerCase()}.`);
    }
  }
  function renderEvent(event: CalendarMeeting, compact = false) {
    return (
      <button
        key={`${event.calendarSource}-${event.id}`}
        type="button"
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          openMeeting(event);
        }}
        className={`stc-ev ${eventTone(event)}`}
      >
        <div className="stc-ev-top">
          <CalendarDays size={16} />
          <span>
            {formatTime(event.startAt)} {event.title}
          </span>
        </div>
        {!compact && (
          <div className="stc-ev-sub">{meetingTypeLabel(event.meetingType)}</div>
        )}
      </button>
    );
  }
  function renderMonthView() {
    const days = buildMonthDays(calendarMonth);
    return (
      <div
        className="stc-zone"
        style={{ marginBottom: 0 }}
        onMouseLeave={() => dayPreview.setHover(null)}
      >
        <div className="stc-board">
          <div className="stc-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}>
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="stc-month" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}>
            {days.map((day) => {
              const outside = day.getMonth() !== calendarMonth.getMonth();
              const isToday = sameDay(day, new Date());
              const dayEvents = eventsForDay(calendarMeetings, day);
              const dayKey = String(startOfDay(day).getTime());
              return (
                <div
                  key={day.toISOString()}
                  className={`stc-cell${outside ? " is-outside" : ""}${
                    dayPreview.shown === dayKey ? " is-active" : ""
                  }${dayPreview.pinned === dayKey ? " is-pinned" : ""}`}
                  onMouseEnter={() => dayPreview.setHover(dayKey)}
                  onClick={() => dayPreview.toggle(dayKey)}
                >
                  <div className="stc-cell-top">
                    <span className={isToday ? "stc-today" : "stc-num"}>
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="stc-count">{dayEvents.length}</span>
                    )}
                  </div>
                  <div className="stc-cell-events">
                    {dayEvents.slice(0, 3).map((event) => renderEvent(event, true))}
                    {dayEvents.length > 3 && (
                      <button
                        type="button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          setCalendarDayDate(day);
                          setCalendarView("day");
                        }}
                        className="stc-more"
                      >
                        +{dayEvents.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {(() => {
          const previewDay = new Date(Number(dayPreview.last));
          const previewEvents = eventsForDay(calendarMeetings, previewDay);
          return (
            <DetailPanel
              open={Boolean(dayPreview.shown)}
              itemKey={dayPreview.last}
              icon={CalendarDays}
              title={previewDay.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              subtitle={`${previewEvents.length} event${
                previewEvents.length === 1 ? "" : "s"
              } on this day`}
              pinned={dayPreview.pinned === dayPreview.last}
              onUnpin={() => dayPreview.setPinned(null)}
            >
              {previewEvents.length === 0 ? (
                <p className="sk-detail-empty">Nothing scheduled on this day.</p>
              ) : (
                <div className="sk-rows">
                  {previewEvents.map((event) => (
                    <button
                      key={`${event.calendarSource}-${event.id}`}
                      type="button"
                      className="sk-row"
                      onClick={() => openMeeting(event)}
                    >
                      <div className={`stc-dot ${eventTone(event)}`}>
                        <CalendarDays size={16} />
                      </div>
                      <div className="sk-min0 sk-grow">
                        <span className="sk-row-title">{event.title}</span>
                        <span className="sk-row-sub">
                          {formatTime(event.startAt)} – {formatTime(event.endAt)} ·{" "}
                          {meetingTypeLabel(event.meetingType)}
                        </span>
                      </div>
                      <ChevronRight size={15} className="sk-arrow" />
                    </button>
                  ))}
                </div>
              )}
            </DetailPanel>
          );
        })()}
      </div>
    );
  }
  function renderWeekView() {
    const start = startOfWeek(calendarWeekDate);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    return (
      <div className="stc-board stc-scroll">
        <div className="stc-week">
          <div className="stc-week-head" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}>
            {days.map((day) => {
              const isToday = sameDay(day, new Date());
              return (
                <div key={day.toISOString()}>
                  <span>
                    {day.toLocaleDateString("en-IN", {
                      weekday: "short",
                    })}
                  </span>
                  <b className={isToday ? "stc-today" : "stc-num"}>{day.getDate()}</b>
                </div>
              );
            })}
          </div>
          <div className="stc-week-body" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", width: "100%" }}>
            {days.map((day) => (
              <div key={day.toISOString()} className="stc-week-col">
                {eventsForDay(calendarMeetings, day).map((event) =>
                  renderEvent(event)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  function renderDayView() {
    const events = eventsForDay(calendarMeetings, calendarDayDate);
    return (
      <div className="stc-board">
        <div className="stc-day-head">
          {calendarDayDate.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="stc-day-body">
          {events.length === 0 ? (
            <div className="stc-day-empty">
              No meetings scheduled for this day.
            </div>
          ) : (
            <div className="stc-stack">{events.map((event) => renderEvent(event))}</div>
          )}
        </div>
      </div>
    );
  }
  function renderAgendaView() {
    const grouped = new Map<string, { day: Date; events: CalendarMeeting[] }>();
    for (const event of calendarMeetings) {
      const day = startOfDay(new Date(event.startAt));
      const key = day.toISOString();
      if (!grouped.has(key)) {
        grouped.set(key, {
          day,
          events: [],
        });
      }
      grouped.get(key)!.events.push(event);
    }
    const groups = Array.from(grouped.values()).sort(
      (a, b) => a.day.getTime() - b.day.getTime()
    );
    return (
      <div className="stc-stack">
        {groups.length === 0 ? (
          <div className="sk-empty">
            <div className="sk-empty-icon">
              <CalendarDays size={22} />
            </div>
            <strong>{filtersActive ? "No events match the current filters." : "No calendar events available"}</strong>
            <span>{filtersActive ? "Try changing or clearing the filters." : "Meetings and batch activities will appear here once scheduled."}</span>
          </div>
        ) : (
          groups.map((group) => {
            const isToday = sameDay(group.day, new Date());
            return (
              <div
                key={group.day.toISOString()}
                ref={isToday ? agendaTodayRef : undefined}
                className={`stc-agenda${isToday ? " is-today" : ""}`}
              >
                <div className="stc-agenda-head">
                  <div className={`stc-agenda-date${isToday ? " is-today" : ""}`}>
                    {group.day.getDate()}
                  </div>
                  <div>
                    <b>
                      {group.day.toLocaleDateString("en-IN", {
                        weekday: "long",
                      })}
                    </b>
                    <span>
                      {group.day.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {isToday && <span className="sk-badge tone-green">Today</span>}
                </div>
                <div className="stc-stack stc-agenda-body">
                  {group.events.map((event) => renderEvent(event))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }
  const tileEvents =
    tilePreview.last === "scheduled"
      ? scheduledEvents
      : tilePreview.last === "today"
      ? todayEvents
      : tilePreview.last === "upcoming"
      ? upcomingEvents
      : calendarMeetings;
  const tileMeta: Record<TileKey, { title: string; subtitle: string }> = {
    total: { title: "All events", subtitle: `${calendarMeetings.length} in your calendar` },
    scheduled: { title: "Scheduled events", subtitle: `${scheduledCount} scheduled` },
    today: { title: "Today's events", subtitle: `${todayEvents.length} happening today` },
    upcoming: { title: "Upcoming events", subtitle: `${upcomingEvents.length} still to come` },
  };
  const tileProps = (key: TileKey) => ({
    active: tilePreview.shown === key,
    pinned: tilePreview.pinned === key,
    onEnter: () => tilePreview.setHover(key),
    onToggle: () => tilePreview.toggle(key),
  });
  return (
    <>
      <main id="stc-page" className="sk-page">
        <div className="sk-container">
          <AdminPageHeader
            className="mb-6"
            label="Student learning"
            title="Calendar"
            subtitle="View your meetings and batch activities."
            icon={CalendarDays}
            actions={
              <button
                type="button"
                onClick={() => void loadCalendar(true)}
                disabled={refreshing}
                className={ADMIN_BTN_GHOST}
              >
                <RefreshCw size={15} className={refreshing ? "sk-spin" : "sk-refresh-icon"} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            }
          />
          {error && (
            <div className="sk-alert is-error" role="alert">
              <XCircle size={18} />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Close error">
                <XCircle size={16} />
              </button>
            </div>
          )}
          <div className="stc-stats" onMouseLeave={() => tilePreview.setHover(null)}>
            <section className="stc-tiles">
              <div className="stc-tile-slot" style={{ minWidth: 0 }}>
              <SkTile
                index={1}
                icon={CalendarDays}
                label="Total Events"
                value={calendarMeetings.length}
                helper="Meetings and batch activities"
                tone="blue"
                {...tileProps("total")}
              />
              </div>
              <div className="stc-tile-slot" style={{ minWidth: 0 }}>
              <SkTile
                index={2}
                icon={CheckCircle2}
                label="Scheduled"
                value={scheduledCount}
                helper="Scheduled meetings"
                tone="green"
                {...tileProps("scheduled")}
              />
              </div>
              <div className="stc-tile-slot" style={{ minWidth: 0 }}>
              <SkTile
                index={3}
                icon={Sun}
                label="Today's Events"
                value={todayEvents.length}
                helper="Happening today"
                tone="orange"
                {...tileProps("today")}
              />
              </div>
              <div className="stc-tile-slot" style={{ minWidth: 0 }}>
              <SkTile
                index={4}
                icon={Hourglass}
                label="Upcoming"
                value={upcomingEvents.length}
                helper="Still to come"
                tone="navy"
                {...tileProps("upcoming")}
              />
              </div>
            </section>
            <DetailPanel
              open={Boolean(tilePreview.shown)}
              itemKey={tilePreview.last}
              icon={CalendarDays}
              title={tileMeta[tilePreview.last].title}
              subtitle={tileMeta[tilePreview.last].subtitle}
              pinned={tilePreview.pinned === tilePreview.last}
              onUnpin={() => tilePreview.setPinned(null)}
            >
              {tileEvents.length === 0 ? (
                <p className="sk-detail-empty">Nothing here yet.</p>
              ) : (
                <div className="sk-rows">
                  {tileEvents.slice(0, 6).map((event) => (
                    <button
                      key={`${event.calendarSource}-${event.id}`}
                      type="button"
                      className="sk-row"
                      onClick={() => openMeeting(event)}
                    >
                      <div className={`stc-dot ${eventTone(event)}`}>
                        <CalendarDays size={16} />
                      </div>
                      <div className="sk-min0 sk-grow">
                        <span className="sk-row-title">{event.title}</span>
                        <span className="sk-row-sub">
                          {formatDateTime(event.startAt)} ·{" "}
                          {meetingTypeLabel(event.meetingType)}
                        </span>
                      </div>
                      <ChevronRight size={15} className="sk-arrow" />
                    </button>
                  ))}
                </div>
              )}
              {tileEvents.length > 6 ? (
                <p className="sk-detail-empty" style={{ marginTop: 12 }}>
                  +{tileEvents.length - 6} more in the calendar below.
                </p>
              ) : null}
            </DetailPanel>
          </div>
          <div className="sk-filterbar sk-reveal" style={reveal(4)} role="search" aria-label="Filter calendar events">
            <label className="sk-fsearch">
              <Search size={15} />
              <input
                type="search"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search meetings by title or description"
                aria-label="Search meetings"
              />
            </label>
            <select className="sk-fselect" value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Meeting type">
              <option value="ALL">All types</option>
              <option value="BATCH_MEETING">Batch meeting</option>
              <option value="STUDENT_MEETING">Student meeting</option>
              <option value="INTERNAL_MEETING">Internal meeting</option>
              <option value="ONE_TO_ONE">One to one</option>
              <option value="OTHER">Other</option>
            </select>
            <select className="sk-fselect" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Meeting status">
              <option value="ALL">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {filtersActive && (
              <button type="button" className="sk-clear" onClick={clearFilters}>
                <X size={14} /> Clear filters
              </button>
            )}
            <span className="sk-count" aria-live="polite">
              {calendarMeetings.length} of {allMeetings.length} events
            </span>
          </div>
          <section className="sk-reveal" style={reveal(5)}>
            <div
              className="stc-toolbar"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, textAlign: "left" }}
            >
              <div>
                <h2>Your Schedule</h2>
                <p>View meetings by month, week, day, or agenda.</p>
              </div>
              <div
                className="stc-controls"
                style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 8 }}
              >
                <div className="sk-seg" role="tablist" aria-label="Calendar view">
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
                      role="tab"
                      aria-selected={calendarView === value}
                      onClick={() => setCalendarView(value)}
                      className={`sk-seg-btn${calendarView === value ? " is-active" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goToCurrentPeriod}
                  className="sk-btn sk-btn-secondary sk-btn-sm"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goPrevious}
                  className="sk-btn sk-btn-secondary sk-btn-sm stc-nav"
                  aria-label="Previous period"
                >
                  <ChevronLeft size={18} style={{ flex: "0 0 auto" }} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="sk-btn sk-btn-secondary sk-btn-sm stc-nav"
                  aria-label="Next period"
                >
                  <ChevronRight size={18} style={{ flex: "0 0 auto" }} />
                </button>
              </div>
            </div>
            <div className="stc-period">
              {calendarTitle(
                calendarView,
                calendarMonth,
                calendarWeekDate,
                calendarDayDate
              )}
            </div>
            {loading ? (
              <div className="sk-skel" style={{ height: 340 }} aria-busy="true">
                <span className="sk-sr">Loading calendar</span>
              </div>
            ) : (
              <div
                key={`${calendarView}-${calendarMonth.getMonth()}-${calendarWeekDate.getTime()}-${calendarDayDate.getTime()}`}
                className="sk-swap"
              >
                {calendarView === "month" && renderMonthView()}
                {calendarView === "week" && renderWeekView()}
                {calendarView === "day" && renderDayView()}
                {calendarView === "agenda" && renderAgendaView()}
              </div>
            )}
          </section>
        </div>
      </main>
      {selectedMeeting && (
        <Modal onClose={closeMeetingDetails} maxWidth={600} labelledBy="meeting-title">
          {(close) => (
            <>
              <div className="sk-modal-head">
                <div className="sk-min0">
                  <div className="stc-modal-type">
                    <CalendarDays size={20} />
                    {meetingTypeLabel(selectedMeeting.meetingType)}
                  </div>
                  <h2 id="meeting-title">{selectedMeeting.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="sk-modal-close"
                  aria-label="Close details"
                >
                  <XCircle size={18} />
                </button>
              </div>
              <div className="sk-modal-body">
                <div className="stc-two">
                  <div className="stc-info">
                    <span>
                      <Clock3 size={14} />
                      Start
                    </span>
                    <strong>{formatDateTime(selectedMeeting.startAt)}</strong>
                  </div>
                  <div className="stc-info">
                    <span>
                      <Clock3 size={14} />
                      End
                    </span>
                    <strong>{formatDateTime(selectedMeeting.endAt)}</strong>
                  </div>
                </div>
                <div className="stc-chips">
                  <span className="sk-badge">{statusLabel(selectedMeeting.status)}</span>
                  {selectedMeeting.course?.title && (
                    <span className="sk-badge tone-blue">{selectedMeeting.course.title}</span>
                  )}
                  {selectedMeeting.batch?.name && (
                    <span className="sk-badge tone-navy">{selectedMeeting.batch.name}</span>
                  )}
                </div>
                {selectedMeeting.description && (
                  <div className="stc-section">
                    <h3>Description</h3>
                    <p>{selectedMeeting.description}</p>
                  </div>
                )}
                {selectedMeeting.calendarSource === "MEETING" &&
                  selectedMeeting.meetingPlatform && (
                    <div className="stc-line">
                      <Video size={22} />
                      <div>
                        <span>Meeting Platform</span>
                        <strong>
                          {selectedMeeting.meetingPlatform === "GOOGLE_MEET"
                            ? "Google Meet"
                            : selectedMeeting.meetingPlatform === "MICROSOFT_TEAMS"
                            ? "Microsoft Teams"
                            : selectedMeeting.meetingPlatform === "ZOOM"
                            ? "Zoom"
                            : selectedMeeting.meetingPlatform === "WHATSAPP"
                            ? "WhatsApp"
                            : "Other"}
                        </strong>
                      </div>
                    </div>
                  )}
                {selectedMeeting.organizer && (
                  <div className="stc-line">
                    <UserCircle size={22} />
                    <div>
                      <span>Organizer</span>
                      <strong>{selectedMeeting.organizer.name || "Organizer"}</strong>
                      {selectedMeeting.organizer.email && (
                        <em>{selectedMeeting.organizer.email}</em>
                      )}
                    </div>
                  </div>
                )}
                {selectedMeeting.batch?.name && (
                  <div className="stc-line">
                    <Users size={22} />
                    <div>
                      <span>Batch</span>
                      <strong>{selectedMeeting.batch.name}</strong>
                    </div>
                  </div>
                )}
                {selectedMeeting.calendarSource === "MEETING" &&
                  selectedMeeting.participants &&
                  selectedMeeting.participants.length > 0 && (
                    <div className="stc-section">
                      <h3>Participants</h3>
                      <div className="stc-stack">
                        {selectedMeeting.participants.map((participant) => (
                          <div key={participant.id} className="stc-person">
                            <strong>{participant.name || "Participant"}</strong>
                            {participant.email && <em>{participant.email}</em>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedMeeting.calendarSource === "MEETING" &&
                  selectedMeeting.status === "SCHEDULED" && (
                    <div className="stc-remote">
                      <div className="stc-remote-head">
                        <div className="sk-icon sk-tone-navy">
                          <MonitorUp size={19} />
                        </div>
                        <div className="sk-min0 sk-grow">
                          <strong>Remote Assistance · UltraViewer</strong>
                          <p>
                            Keep the video call running and use UltraViewer when your
                            trainer needs to work directly on your computer. Share your
                            current UltraViewer ID and temporary password with the trainer
                            through the meeting chat.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              "https\://www.ultraviewer.net/",
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                          className="sk-btn sk-btn-secondary sk-btn-sm"
                        >
                          <ExternalLink size={13} />
                          UltraViewer
                        </button>
                      </div>
                      <div className="stc-two" style={{ marginTop: 14 }}>
                        <label>
                          <span className="sk-label">Your UltraViewer ID</span>
                          <div className="stc-copy">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={remoteAssistId}
                              onChange={(event) => setRemoteAssistId(event.target.value)}
                              placeholder="Enter current ID"
                              className="sk-input"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                void copyRemoteAssistValue(remoteAssistId, "UltraViewer ID")
                              }
                              className="sk-btn sk-btn-secondary stc-icon-btn"
                              aria-label="Copy UltraViewer ID"
                              title="Copy UltraViewer ID"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </label>
                        <label>
                          <span className="sk-label">Temporary Password</span>
                          <div className="stc-copy">
                            <div className="stc-pass">
                              <input
                                type={showRemoteAssistPassword ? "text" : "password"}
                                value={remoteAssistPassword}
                                onChange={(event) =>
                                  setRemoteAssistPassword(event.target.value)
                                }
                                placeholder="Enter current password"
                                autoComplete="off"
                                className="sk-input"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowRemoteAssistPassword((current) => !current)
                                }
                                aria-label={
                                  showRemoteAssistPassword ? "Hide password" : "Show password"
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
                              className="sk-btn sk-btn-secondary stc-icon-btn"
                              aria-label="Copy UltraViewer password"
                              title="Copy UltraViewer password"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </label>
                      </div>
                      <div className="sk-alert is-warn" style={{ margin: "14px 0 0" }}>
                        <ShieldCheck size={17} />
                        <span>
                          SK Computer Education does not save these UltraViewer credentials. Enter the
                          current values from the UltraViewer application and share them
                          only with your trainer.
                        </span>
                      </div>
                      {remoteAssistCopyMessage && (
                        <div className="stc-copy-msg">{remoteAssistCopyMessage}</div>
                      )}
                    </div>
                  )}
                {selectedMeeting.meetingUrl &&
                  selectedMeeting.status === "SCHEDULED" && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          selectedMeeting.meetingUrl!,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="sk-btn sk-btn-primary sk-btn-block"
                    >
                      <ExternalLink size={16} />
                      Join Meeting
                    </button>
                  )}
              </div>
            </>
          )}
        </Modal>
      )}
      <SkStyles />
      <style dangerouslySetInnerHTML={{ __html: calendarCss }} />
    </>
  );
}
const calendarCss = `
.stc-title-wrap{display:flex;align-items:center;gap:16px}
.stc-title-icon{width:44px;height:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:linear-gradient(135deg,var(--navy),var(--blue));color:#fff;box-shadow:0 8px 20px rgba(15,47,95,.25)}
.stc-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.stc-toolbar h2{margin:0;font-size:17px;font-weight:700;color:var(--navy)}
.stc-toolbar p{margin:3px 0 0;font-size:13px;color:var(--muted)}
.stc-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.stc-controls .sk-seg{padding:3px}
.stc-controls .sk-seg-btn{flex:0 0 auto;height:34px}
.stc-nav{width:36px;padding:0}
.stc-period{margin-bottom:10px;padding:9px 16px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:center;font-size:16px;font-weight:700;color:var(--navy)}
.stc-board{overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03)}
.stc-scroll{overflow-x:auto}
.stc-weekdays,.stc-month,.stc-week-head,.stc-week-body{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.stc-weekdays{border-bottom:1px solid var(--line);background:#F8FAFD}
.stc-weekdays div{padding:12px 8px;text-align:center;font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--muted)}
.stc-cell{min-height:98px;padding:8px;border-right:1px solid var(--line-2);border-bottom:1px solid var(--line-2);background:#fff;cursor:pointer;transition:background .2s ease,box-shadow .2s ease}
.stc-cell:nth-child(7n){border-right:0}
.stc-cell.is-outside{background:#FAFBFD}
.stc-cell:hover,.stc-cell.is-active{background:#F5F9FF;box-shadow:inset 0 0 0 2px rgba(37,99,235,.35)}
.stc-cell.is-pinned{background:var(--orange-tint);box-shadow:inset 0 0 0 2px rgba(249,115,22,.5)}
.stc-cell-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.stc-num{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;font-size:13px;font-weight:600;color:var(--navy)}
.stc-cell.is-outside .stc-num{color:#B6C0CF}
.stc-today{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--orange);color:#fff;font-size:13px;font-weight:700;box-shadow:0 4px 10px rgba(249,115,22,.35)}
.stc-count{min-width:20px;height:20px;padding:0 6px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:11px;font-weight:700}
.stc-cell-events{display:flex;flex-direction:column;gap:5px}
.stc-more{align-self:flex-start;padding:2px 4px;border:0;background:transparent;color:var(--blue);font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.stc-more:hover{text-decoration:underline}
.stc-ev{display:block;width:100%;padding:6px 8px;border:1px solid;border-radius:9px;text-align:left;font:inherit;cursor:pointer;transition:transform .2s var(--ease),box-shadow .2s ease}
.stc-ev:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(15,47,95,.12)}
.stc-ev-top{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600}
.stc-ev-top span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stc-ev-sub{margin-top:3px;font-size:11.5px;opacity:.8}
.stc-ev-live{border-color:#FFD2B0;background:var(--orange-tint);color:var(--orange-2)}
.stc-ev-batch{border-color:#CFE0FA;background:var(--blue-tint);color:var(--blue)}
.stc-ev-student{border-color:#C9D3E3;background:#E6ECF5;color:var(--navy)}
.stc-ev-one{border-color:#BFE6CD;background:var(--green-tint);color:var(--green)}
.stc-ev-internal{border-color:#DCE3EE;background:#F1F4F9;color:var(--muted)}
.stc-ev-cancel{border-color:#F3C9C9;background:var(--red-tint);color:var(--red);text-decoration:line-through}
.stc-dot{width:36px;height:36px;flex:0 0 36px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:1px solid}
.stc-week{min-width:980px}
.stc-week-head{border-bottom:1px solid var(--line);background:#F8FAFD}
.stc-week-head div{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-right:1px solid var(--line-2);font-size:12px;font-weight:700;color:var(--muted)}
.stc-week-col{min-height:260px;display:flex;flex-direction:column;gap:8px;padding:8px;border-right:1px solid var(--line-2)}
.stc-day-head{padding:16px 20px;border-bottom:1px solid var(--line);background:#F8FAFD;font-size:15px;font-weight:700;color:var(--navy)}
.stc-day-body{min-height:220px;padding:14px}
.stc-day-empty{display:flex;align-items:center;justify-content:center;min-height:180px;font-size:14px;color:var(--muted)}
.stc-stack{display:flex;flex-direction:column;gap:10px}
.stc-agenda{overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#fff;transition:box-shadow .25s ease}
.stc-agenda:hover{box-shadow:0 10px 24px rgba(15,47,95,.08)}
.stc-agenda.is-today{border-color:var(--orange);box-shadow:0 0 0 3px rgba(249,115,22,.12)}
.stc-agenda-head{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--line-2)}
.stc-agenda-head b{display:block;font-size:14.5px;color:var(--navy)}
.stc-agenda-head span:not(.sk-badge){font-size:12.5px;color:var(--muted)}
.stc-agenda-date{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:#EDF1F7;color:var(--muted);font-weight:700}
.stc-agenda-date.is-today{background:var(--orange);color:#fff}
.stc-agenda-body{padding:10px}
.stc-modal-type{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12.5px;font-weight:600;color:var(--orange-2);text-transform:uppercase;letter-spacing:.05em}
.stc-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:16px}
.stc-info{padding:14px;border:1px solid var(--line-2);border-radius:12px;background:#F8FAFD}
.stc-info span{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:12px;font-weight:600;color:var(--muted)}
.stc-info strong{font-size:14px;color:var(--navy)}
.stc-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.stc-section{margin-bottom:16px}
.stc-section h3{margin:0 0 6px;font-size:14.5px;font-weight:700;color:var(--navy)}
.stc-section p{margin:0;white-space:pre-wrap;font-size:14px;line-height:1.65;color:var(--muted)}
.stc-line{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding:14px;border:1px solid var(--line);border-radius:12px;color:var(--blue);transition:border-color .2s ease,transform .2s var(--ease)}
.stc-line:hover{border-color:#9DBBEA;transform:translateX(3px)}
.stc-line span{display:block;font-size:12px;color:var(--soft)}
.stc-line strong{display:block;font-size:14px;color:var(--navy)}
.stc-line em,.stc-person em{display:block;font-style:normal;font-size:12.5px;color:var(--muted)}
.stc-person{padding:10px 12px;border:1px solid var(--line);border-radius:10px}
.stc-person strong{font-size:14px;color:var(--navy)}
.stc-remote{margin-bottom:12px;padding:14px;border:1px solid #CFE0FA;border-radius:14px;background:linear-gradient(135deg,#F5F9FF,#FFFFFF)}
.stc-remote-head{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap}
.stc-remote-head strong{font-size:14.5px;color:var(--navy)}
.stc-remote-head p{margin:4px 0 0;font-size:13px;line-height:1.55;color:var(--muted)}
.stc-copy{display:flex;gap:8px}
.stc-copy .sk-input{flex:1;min-width:0}
.stc-icon-btn{width:44px;padding:0;flex:0 0 44px}
.stc-pass{position:relative;flex:1;min-width:0}
.stc-pass .sk-input{padding-right:42px}
.stc-pass button{position:absolute;right:6px;top:50%;transform:translateY(-50%);display:flex;padding:6px;border:0;border-radius:8px;background:transparent;color:var(--soft);cursor:pointer}
.stc-pass button:hover{background:var(--line-2);color:var(--navy)}
.stc-copy-msg{margin-top:10px;font-size:13px;font-weight:600;color:var(--blue);animation:sk-swap .25s var(--ease) both}
@media (max-width:760px){
  .stc-two{grid-template-columns:minmax(0,1fr)}
  .stc-cell{min-height:96px}
  .stc-controls{width:100%}
  .stc-controls .sk-seg{width:100%}
}
/* ---- Student calendar layout: isolated from shared grid rules ---- */
#stc-page .stc-stats { display:block !important; width:100% !important; min-width:0 !important; margin:0 0 26px !important; }
#stc-page .stc-tiles { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; grid-auto-flow:row !important; gap:16px !important; align-items:stretch !important; justify-items:stretch !important; width:100% !important; max-width:none !important; min-width:0 !important; margin:0 !important; padding:0 !important; }
#stc-page .stc-tiles > .stc-tile-slot { display:block !important; grid-column:auto !important; grid-row:auto !important; min-width:0 !important; width:100% !important; max-width:none !important; margin:0 !important; }
#stc-page .stc-tile-slot > * { width:100% !important; max-width:none !important; min-width:0 !important; margin:0 !important; box-sizing:border-box !important; }
#stc-page .stc-stats .sk-detail, #stc-page .stc-zone .sk-detail { width:100%; max-width:none; margin-top:14px; }
#stc-page .stc-zone { display:block; width:100%; min-width:0; }
#stc-page .stc-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; width:100%; margin:0 0 14px; }
#stc-page .stc-toolbar h2 { margin:0; font-size:20px; font-weight:750; color:var(--navy); }
#stc-page .stc-toolbar p { margin:4px 0 0; font-size:13px; color:var(--muted); }
#stc-page .stc-controls { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
#stc-page .stc-controls .sk-seg { display:inline-flex; width:auto; padding:3px; }
#stc-page .stc-controls .sk-seg-btn { flex:0 0 auto; min-width:78px; height:36px; padding:0 16px; }
#stc-page .stc-nav { width:38px; min-width:38px; padding:0; justify-content:center; }
#stc-page .stc-period { display:flex; align-items:center; justify-content:center; margin-bottom:12px; padding:12px 16px; border:1px solid var(--line); border-radius:14px; background:linear-gradient(135deg,#fff,#F5F9FF); font-size:17px; font-weight:750; color:var(--navy); box-shadow:0 1px 2px rgba(15,47,95,.04); }
#stc-page .stc-weekdays, #stc-page .stc-month, #stc-page .stc-week-head, #stc-page .stc-week-body { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); width:100%; min-width:0; }
#stc-page .stc-weekdays div { padding:12px 6px; }
#stc-page .stc-cell { min-height:112px; padding:8px; min-width:0; }
#stc-page .stc-cell-top { min-height:30px; }
#stc-page .stc-num, #stc-page .stc-today { flex:0 0 30px; width:30px; height:30px; line-height:1; border-radius:50%; }
#stc-page .stc-ev { min-width:0; }
#stc-page .stc-ev svg, #stc-page .stc-title-icon svg, #stc-page .stc-nav svg { flex:0 0 auto; }
#stc-page .stc-week-col:last-child, #stc-page .stc-week-head div:last-child { border-right:0; }
#stc-page .stc-weekdays::before, #stc-page .stc-weekdays::after, #stc-page .stc-month::before, #stc-page .stc-month::after, #stc-page .stc-week-head::before, #stc-page .stc-week-head::after, #stc-page .stc-week-body::before, #stc-page .stc-week-body::after, #stc-page .stc-tiles::before, #stc-page .stc-tiles::after, #stc-page .stc-toolbar::before, #stc-page .stc-toolbar::after, #stc-page .stc-controls::before, #stc-page .stc-controls::after, #stc-page .stc-title-wrap::before, #stc-page .stc-title-wrap::after { display:none !important; content:none !important; }
#stc-page .stc-tiles > :empty, #stc-page .stc-weekdays > :empty, #stc-page .stc-month > :empty { display:none !important; }
#stc-page .stc-controls .sk-btn, #stc-page .stc-controls .sk-seg { flex:0 0 auto !important; }
@media (max-width: 1100px) { #stc-page .stc-tiles { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } }
@media (max-width: 760px) {
  #stc-page .stc-tiles { gap:12px !important; }
  #stc-page .stc-toolbar { align-items:flex-start; flex-direction:column; }
  #stc-page .stc-controls { width:100%; justify-content:flex-start; }
  #stc-page .stc-controls .sk-seg { width:100%; }
  #stc-page .stc-controls .sk-seg-btn { flex:1; min-width:0; padding:0 8px; }
  #stc-page .stc-cell { min-height:76px; padding:4px; }
  #stc-page .stc-cell .stc-ev { padding:3px 4px; }
  #stc-page .stc-cell .stc-ev-top span, #stc-page .stc-count { display:none; }
}
@media (max-width: 480px) { #stc-page .stc-tiles { grid-template-columns:minmax(0,1fr) !important; } }
`;
