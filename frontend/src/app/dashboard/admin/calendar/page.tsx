"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {

  CalendarDays,

  Clock3,

  RefreshCw,

  Plus,

  Video,

  Users,

  UserCircle,

  BookOpen,

  Layers,

  XCircle,

  Save,

  ChevronLeft,

  ChevronRight,
  Filter,

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

type CalendarMeetingType = MeetingType;

type CalendarMeetingStatus = MeetingStatus;

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


  trainer?: {
    id: number;
    userId: number;
    name?: string | null;
    email?: string | null;
  } | null;

}



type CalendarMeeting = Omit<Meeting, "meetingType" | "status"> & {
  meetingType: CalendarMeetingType;
  status: CalendarMeetingStatus;
};




interface CourseOption {

  id: number;

  slug: string;

  title: string;

}



interface BatchOption {

  id: number;

  displayId?: string | null;

  name: string;

  courseId: number;

  course?: CourseOption | null;

  trainerId?: number | null;

  status?: string;

  startDate?: string;

  endDate?: string;

}

interface StudentOption {
  id: number;
  userId: number;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
}

interface TrainerOption {
  id: number;
  userId: number;
  trainerId?: string;
  name: string;
  email: string;
  isActive: boolean;
}



interface ApiResponse {

  success: boolean;

  data?: Meeting[];

  message?: string;

}



interface BatchOptionsResponse {

  success: boolean;

  data?: {

    courses?: CourseOption[];

    trainers?: TrainerOption[];

    students?: StudentOption[];

  };

  message?: string;

}



interface BatchListResponse {

  success: boolean;

  data?: BatchOption[];

  message?: string;

}



interface MeetingForm {

  title: string;

  description: string;

  meetingType: MeetingType;

  startAt: string;

  endAt: string;

  meetingUrl: string;

  meetingPlatform: MeetingPlatform;

  courseId: string;

  batchId: string;

}

type CalendarFilters = {
  meetingType: CalendarMeetingType | "";
  courseId: string;
  batchId: string;
  status: CalendarMeetingStatus | "";
};

const EMPTY_CALENDAR_FILTERS: CalendarFilters = {
  meetingType: "",
  courseId: "",
  batchId: "",
  status: "",
};




const EMPTY_FORM: MeetingForm = {

  title: "",

  description: "",

  meetingType: "OTHER",

  startAt: "",

  endAt: "",

  meetingUrl: "",

  meetingPlatform: "OTHER",

  courseId: "",

  batchId: "",

};



function getToken() {

  if (typeof window === "undefined") {

    return "";

  }



  return (

    localStorage.getItem("skce_admin_token") ||

    localStorage.getItem("token") ||

    ""

  );

}



async function authenticatedFetch(

  url: string,

  options: RequestInit = {}

): Promise<Response> {

  const token = getToken();



  const response = await fetch(url, {

    ...options,

    headers: {

      ...(options.headers || {}),

      Authorization: `Bearer ${token}`,

      "Content-Type": "application/json",

    },

  });



  if (response.status === 401 || response.status === 403) {

    window.location.href = "/admin/login";

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



function getMeetingTypeLabel(type: CalendarMeetingType) {

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



function getMeetingTypeIcon(type: CalendarMeetingType) {

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


function getStatusClasses(status: CalendarMeetingStatus) {

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



function toDateTimeLocalValue(date: Date) {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");



  return `${year}-${month}-${day}T${hours}:${minutes}`;

}



function getDefaultStartDateTime() {

  const date = new Date();



  date.setMinutes(date.getMinutes() + 30);

  date.setSeconds(0);

  date.setMilliseconds(0);



  return toDateTimeLocalValue(date);

}



function getDefaultEndDateTime() {

  const date = new Date();



  date.setMinutes(date.getMinutes() + 60);

  date.setSeconds(0);

  date.setMilliseconds(0);



  return toDateTimeLocalValue(date);

}



function localDateTimeToIso(value: string) {

  return new Date(value).toISOString();

}



export default function AdminCalendarPage() {

  const [meetings, setMeetings] = useState<Meeting[]>([]);


  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [batches, setBatches] = useState<BatchOption[]>([]);

  const [students, setStudents] = useState<StudentOption[]>([]);

  const [trainers, setTrainers] = useState<TrainerOption[]>([]);

  const [selectedParticipantUserIds, setSelectedParticipantUserIds] =
    useState<number[]>([]);



  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(false);



  const [error, setError] = useState("");

  const [conflictMessage, setConflictMessage] = useState("");



  const [selectedMeeting, setSelectedMeeting] =

    useState<CalendarMeeting | null>(null);



  const [showCreateModal, setShowCreateModal] = useState(false);

  const [saving, setSaving] = useState(false);



  const [form, setForm] = useState<MeetingForm>(EMPTY_FORM);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day" | "agenda">("month");
  const agendaTodayRef = useRef<HTMLDivElement | null>(null);
  const [calendarWeekDate, setCalendarWeekDate] = useState(() => new Date());
  const [calendarFilters, setCalendarFilters] =
    useState<CalendarFilters>(EMPTY_CALENDAR_FILTERS);




  const loadMeetings = useCallback(async (showRefresh = false) => {

    try {

      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const meetingResponse = await authenticatedFetch(
        `${API_URL}/admin/meetings`
      );
      const meetingResult: ApiResponse = await meetingResponse.json();

      if (!meetingResponse.ok || !meetingResult.success) {
        throw new Error(
          meetingResult.message || "Failed to load calendar meetings."
        );
      }

      setMeetings(Array.isArray(meetingResult.data) ? meetingResult.data : []);

    } catch (err) {
      console.error("Failed to load admin calendar:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load calendar meetings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);



  const loadMeetingOptions = useCallback(async () => {

    try {

      setLoadingOptions(true);



      const [batchOptionsResponse, batchesResponse] = await Promise.all([

        authenticatedFetch(`${API_URL}/admin/batches/options`),

        authenticatedFetch(`${API_URL}/admin/batches`),

      ]);



      const batchOptionsResult: BatchOptionsResponse =

        await batchOptionsResponse.json();



      const batchesResult: BatchListResponse =

        await batchesResponse.json();



      if (!batchOptionsResponse.ok || !batchOptionsResult.success) {

        throw new Error(

          batchOptionsResult.message ||

            "Failed to load course options."

        );

      }



      if (!batchesResponse.ok || !batchesResult.success) {

        throw new Error(

          batchesResult.message ||

            "Failed to load batch options."

        );

      }



      setCourses(

        Array.isArray(batchOptionsResult.data?.courses)

          ? batchOptionsResult.data.courses

          : []

      );



      setStudents(

        Array.isArray(batchOptionsResult.data?.students)

          ? batchOptionsResult.data.students.filter(

              (student) => student.isActive

            )

          : []

      );



      setTrainers(

        Array.isArray(batchOptionsResult.data?.trainers)

          ? batchOptionsResult.data.trainers.filter(

              (trainer) => trainer.isActive

            )

          : []

      );



      setBatches(

        Array.isArray(batchesResult.data)

          ? batchesResult.data

          : []

      );

    } catch (err) {

      console.error("Failed to load meeting options:", err);



      setError(

        err instanceof Error

          ? err.message

          : "Failed to load meeting options."

      );

    } finally {

      setLoadingOptions(false);

    }

  }, []);



  useEffect(() => {

    loadMeetings();
    loadMeetingOptions();

  }, [loadMeetings, loadMeetingOptions]);



  const filteredMeetings = useMemo(() => {

    return meetings.filter((meeting) => {
      if (calendarFilters.meetingType && meeting.meetingType !== calendarFilters.meetingType) {
        return false;
      }
      if (calendarFilters.courseId && String(meeting.courseId ?? "") !== calendarFilters.courseId) {
        return false;
      }
      if (calendarFilters.batchId && String(meeting.batchId ?? "") !== calendarFilters.batchId) {
        return false;
      }
      if (calendarFilters.status && meeting.status !== calendarFilters.status) {
        return false;
      }
      return true;
    });

  }, [meetings, calendarFilters]);



  const calendarMeetings = useMemo<CalendarMeeting[]>(() => {
    return meetings;
  }, [meetings]);

  const filteredCalendarMeetings = useMemo(() => {
    return calendarMeetings.filter((event) => {
      if (calendarFilters.meetingType && event.meetingType !== calendarFilters.meetingType) {
        return false;
      }
      if (calendarFilters.courseId && String(event.courseId ?? "") !== calendarFilters.courseId) {
        return false;
      }
      if (calendarFilters.batchId && String(event.batchId ?? "") !== calendarFilters.batchId) {
        return false;
      }
      if (calendarFilters.status && event.status !== calendarFilters.status) {
        return false;
      }
      return true;
    });
  }, [calendarMeetings, calendarFilters]);

  const sortedCalendarMeetings = useMemo(() => {
    return [...filteredCalendarMeetings].sort(
      (a, b) =>
        new Date(a.startAt).getTime() -
        new Date(b.startAt).getTime()
    );
  }, [filteredCalendarMeetings]);

  const sortedMeetings = useMemo(() => {

    return [...filteredMeetings].sort(

      (a, b) =>

        new Date(a.startAt).getTime() -

        new Date(b.startAt).getTime()

    );

  }, [filteredMeetings]);



  const upcomingMeetings = useMemo(() => {

    const now = Date.now();



    return sortedCalendarMeetings.filter(

      (meeting) =>

        meeting.status === "SCHEDULED" &&

        new Date(meeting.endAt).getTime() >= now

    );

  }, [sortedCalendarMeetings]);



  const todayMeetings = useMemo(() => {

    const today = new Date();



    return sortedCalendarMeetings.filter((meeting) => {

      const meetingDate = new Date(meeting.startAt);



      return (

        meetingDate.getFullYear() === today.getFullYear() &&

        meetingDate.getMonth() === today.getMonth() &&

        meetingDate.getDate() === today.getDate()

      );

    });

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



  const calendarMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(calendarMonth);
  }, [calendarMonth]);

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
      const date = new Date(meeting.startAt);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

  function getCalendarDayKey(date: Date) {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function isSameCalendarDay(first: Date, second: Date) {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  const calendarWeekStart = useMemo(() => {
    const start = new Date(calendarWeekDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }, [calendarWeekDate]);

  const calendarWeekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(calendarWeekStart);
      date.setDate(calendarWeekStart.getDate() + index);
      return date;
    });
  }, [calendarWeekStart]);

  const calendarWeekLabel = useMemo(() => {
    const start = calendarWeekDays[0];
    const end = calendarWeekDays[6];

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${new Intl.DateTimeFormat("en-IN", { month: "short" }).format(start)} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(start)} – ${new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", year: "numeric" }).format(end)}`;
  }, [calendarWeekDays]);

  const weekHourRows = useMemo(() => {
    return Array.from({ length: 13 }, (_, index) => 8 + index);
  }, []);

  const weekStartMinutes = 8 * 60;
  const weekEndMinutes = 21 * 60;
  const weekHourHeight = 72;

  const calendarDayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(calendarWeekDate);
  }, [calendarWeekDate]);

  const dayHourRows = weekHourRows;

  function getDayMeetingStyle(meeting: CalendarMeeting) {
    const startMinutes = getMinutesFromMidnight(meeting.startAt);
    const endMinutes = getMinutesFromMidnight(meeting.endAt);
    const visibleStart = Math.max(startMinutes, weekStartMinutes);
    const visibleEnd = Math.min(endMinutes, weekEndMinutes);
    const top = ((visibleStart - weekStartMinutes) / 60) * weekHourHeight;
    const height = Math.max(42, ((visibleEnd - visibleStart) / 60) * weekHourHeight);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  }

  function getMinutesFromMidnight(dateString: string) {
    const date = new Date(dateString);
    return date.getHours() * 60 + date.getMinutes();
  }

  function getWeekMeetingStyle(meeting: CalendarMeeting) {
    const startMinutes = getMinutesFromMidnight(meeting.startAt);
    const endMinutes = getMinutesFromMidnight(meeting.endAt);
    const visibleStart = Math.max(startMinutes, weekStartMinutes);
    const visibleEnd = Math.min(endMinutes, weekEndMinutes);
    const top = ((visibleStart - weekStartMinutes) / 60) * weekHourHeight;
    const height = Math.max(38, ((visibleEnd - visibleStart) / 60) * weekHourHeight);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  }

  function getMeetingsForCalendarDay(date: Date) {
    return meetingsByCalendarDay.get(getCalendarDayKey(date)) || [];
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



  const filteredCalendarBatches = useMemo(() => {

    if (!calendarFilters.courseId) {
      return batches;
    }

    return batches.filter(
      (batch) => String(batch.courseId) === calendarFilters.courseId
    );
  }, [batches, calendarFilters.courseId]);

  const hasCalendarFilters = Boolean(
    calendarFilters.meetingType ||
      calendarFilters.courseId ||
      calendarFilters.batchId ||
      calendarFilters.status
  );

  function updateCalendarFilter(
    field: keyof CalendarFilters,
    value: string
  ) {
    setCalendarFilters((current) => {
      const next = { ...current, [field]: value };
      if (field === "courseId" && value && current.batchId) {
        const selectedBatch = batches.find(
          (batch) => String(batch.id) === current.batchId
        );
        if (selectedBatch && String(selectedBatch.courseId) !== value) {
          next.batchId = "";
        }
      }
      return next;
    });
  }

  function clearCalendarFilters() {
    setCalendarFilters(EMPTY_CALENDAR_FILTERS);
  }

  const filteredBatches = useMemo(() => {

    if (!form.courseId) {

      return batches;

    }



    return batches.filter(

      (batch) => String(batch.courseId) === form.courseId

    );

  }, [batches, form.courseId]);



  function openCreateModal() {

    setError("");



    setForm({

      ...EMPTY_FORM,

      startAt: getDefaultStartDateTime(),

      endAt: getDefaultEndDateTime(),

    });



    setSelectedParticipantUserIds([]);

    setShowCreateModal(true);



    if (

      courses.length === 0 ||

      batches.length === 0 ||

      students.length === 0 ||

      trainers.length === 0

    ) {

      loadMeetingOptions();

    }

  }



  function closeCreateModal() {

    if (saving) {

      return;

    }



    setShowCreateModal(false);

    setForm(EMPTY_FORM);

    setSelectedParticipantUserIds([]);

  }



  function updateForm<K extends keyof MeetingForm>(

    field: K,

    value: MeetingForm[K]

  ) {

    setForm((current) => ({

      ...current,

      [field]: value,

    }));

  }



  function handleCourseChange(value: string) {

    setForm((current) => {

      const selectedBatch = current.batchId

        ? batches.find(

            (batch) =>

              String(batch.id) === current.batchId

          )

        : null;



      const batchStillMatchesCourse =

        selectedBatch &&

        String(selectedBatch.courseId) === value;



      return {

        ...current,

        courseId: value,

        batchId: batchStillMatchesCourse

          ? current.batchId

          : "",

      };

    });

  }



  function handleMeetingTypeChange(value: MeetingType) {
    setForm((current) => ({
      ...current,
      meetingType: value,
      batchId: value === "INTERNAL_MEETING" ? "" : current.batchId,
    }));
    setSelectedParticipantUserIds([]);
  }

  function toggleParticipant(userId: number) {
    setSelectedParticipantUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function selectOneToOneParticipant(value: string) {
    setSelectedParticipantUserIds(value ? [Number(value)] : []);
  }

  async function handleCancelMeeting(meeting: Meeting) {

    if (meeting.status !== "SCHEDULED") {

      return;

    }



    const confirmed = window.confirm(

      `Are you sure you want to cancel meeting "${meeting.title}"?`

    );



    if (!confirmed) {

      return;

    }



    try {

      setSaving(true);

      setError("");
      setConflictMessage("");



      const response = await authenticatedFetch(

        `${API_URL}/admin/meetings/${meeting.id}/cancel`,

        { method: "POST" }

      );



      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to cancel meeting.");

      }



      setSelectedMeeting(

        result.data ?? { ...meeting, status: "CANCELLED" }

      );

      await loadMeetings(true);

    } catch (err) {

      console.error("Cancel meeting error:", err);

      setError(

        err instanceof Error ? err.message : "Unable to cancel meeting."

      );

    } finally {

      setSaving(false);

    }

  }



  async function handleCreateMeeting(

    event: React.FormEvent<HTMLFormElement>

  ) {

    event.preventDefault();



    setError("");
    setConflictMessage("");



    const title = form.title.trim();



    if (!title) {

      setError("Meeting title is required.");

      return;

    }



    if (!form.startAt || !form.endAt) {

      setError("Start date/time and end date/time are required.");

      return;

    }



    const startDate = new Date(form.startAt);

    const endDate = new Date(form.endAt);



    if (

      Number.isNaN(startDate.getTime()) ||

      Number.isNaN(endDate.getTime())

    ) {

      setError("Please provide valid start and end date/time values.");

      return;

    }



    if (endDate.getTime() <= startDate.getTime()) {

      setError("End time must be after start time.");

      return;

    }



    if (

      form.meetingUrl.trim() &&

      !/^https?:\/\//i.test(form.meetingUrl.trim())

    ) {

      setError("Meeting URL must start with http:// or https://.");

      return;

    }



    if (

      form.meetingType === "BATCH_MEETING" &&

      !form.batchId

    ) {

      setError("Please select a batch for a batch meeting.");

      return;

    }



    if (

      form.meetingType === "ONE_TO_ONE" &&

      selectedParticipantUserIds.length !== 1

    ) {

      setError(

        "Please select exactly one student for a one-to-one meeting."

      );

      return;

    }



    if (

      form.meetingType === "STUDENT_MEETING" &&

      selectedParticipantUserIds.length === 0

    ) {

      setError(

        "Please select at least one student for a student meeting."

      );

      return;

    }



    if (

      form.meetingType === "INTERNAL_MEETING" &&

      selectedParticipantUserIds.length === 0

    ) {

      setError(

        "Please select at least one trainer for an internal meeting."

      );

      return;

    }



    try {

      setSaving(true);



      const payload = {

        title,

        description: form.description.trim() || null,

        startAt: localDateTimeToIso(form.startAt),

        endAt: localDateTimeToIso(form.endAt),

        meetingUrl: form.meetingUrl.trim() || null,

        meetingPlatform: form.meetingPlatform,

        meetingType: form.meetingType,

        status: "SCHEDULED",

        courseId: form.courseId

          ? Number(form.courseId)

          : null,

        batchId: form.batchId

          ? Number(form.batchId)

          : null,

        participantUserIds:

          form.meetingType === "BATCH_MEETING" ||

          form.meetingType === "OTHER"

            ? []

            : selectedParticipantUserIds,

      };



      const response = await authenticatedFetch(

        `${API_URL}/admin/meetings`,

        {

          method: "POST",

          body: JSON.stringify(payload),

        }

      );



      const result = await response.json();



      if (!response.ok || !result?.success) {

        if (response.status === 409) {
          setConflictMessage(
            result?.message ||
              "The selected time conflicts with another scheduled meeting."
          );
          return;
        }

        throw new Error(

          result?.message || "Unable to create meeting."

        );

      }



      setShowCreateModal(false);

      setForm(EMPTY_FORM);

      setSelectedParticipantUserIds([]);



      await loadMeetings(true);

    } catch (err) {

      console.error("Create meeting error:", err);



      setError(

        err instanceof Error

          ? err.message

          : "Unable to create meeting."

      );

    } finally {

      setSaving(false);

    }

  }



  return (

    <main className="min-h-screen bg-[#F4F6FA]">

      {/* Header */}

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

                    Manage meetings and scheduled activities across SKCE.

                  </p>

                </div>

              </div>

            </div>



            <div className="flex items-center gap-3">

              <button

                type="button"

                onClick={() => loadMeetings(true)}

                disabled={refreshing}

                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"

              >

                <RefreshCw

                  size={16}

                  className={refreshing ? "animate-spin" : ""}

                />

                Refresh

              </button>



              <button

                type="button"

                onClick={openCreateModal}

                className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#EA580C]"

              >

                <Plus size={17} />

                Create Meeting

              </button>

            </div>

          </div>

        </div>

      </div>



      <div className="space-y-6 px-8 py-6">

        {/* Error */}

        {error && (

          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>{error}</span>



            <button

              type="button"

              onClick={() => setError("")}

              className="shrink-0 text-red-500 hover:text-red-700"

            >

              <XCircle size={18} />

            </button>

          </div>

        )}



        {/* Summary */}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Total Meetings

                </p>



                <p className="mt-2 text-2xl font-bold text-slate-900">

                  {meetings.length}

                </p>

              </div>



              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#173B67]">

                <CalendarDays size={19} />

              </div>

            </div>

          </div>



          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Scheduled

                </p>



                <p className="mt-2 text-2xl font-bold text-slate-900">

                  {scheduledCount}

                </p>

              </div>



              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">

                <Clock3 size={19} />

              </div>

            </div>

          </div>



          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Completed

                </p>



                <p className="mt-2 text-2xl font-bold text-slate-900">

                  {completedCount}

                </p>

              </div>



              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">

                <CalendarDays size={19} />

              </div>

            </div>

          </div>



          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Cancelled

                </p>



                <p className="mt-2 text-2xl font-bold text-slate-900">

                  {cancelledCount}

                </p>

              </div>



              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">

                <XCircle size={19} />

              </div>

            </div>

          </div>

        </section>



        {/* Calendar Views */}
        <section>
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Calendar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View scheduled meetings by month, week, day, or agenda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white p-1">
                <button
                  type="button"
                  onClick={() => handleCalendarViewChange("month")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    calendarView === "month"
                      ? "bg-[#173B67] text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => handleCalendarViewChange("week")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    calendarView === "week"
                      ? "bg-[#173B67] text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => handleCalendarViewChange("day")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    calendarView === "day"
                      ? "bg-[#173B67] text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Day
                </button>
                <button
                  type="button"
                  onClick={() => handleCalendarViewChange("agenda")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    calendarView === "agenda"
                      ? "bg-[#173B67] text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Agenda
                </button>
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
                aria-label={
                  calendarView === "month"
                    ? "Previous month"
                    : calendarView === "week"
                    ? "Previous week"
                    : "Previous day"
                }
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goToNextPeriod}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label={
                  calendarView === "month"
                    ? "Next month"
                    : calendarView === "week"
                    ? "Next week"
                    : "Next day"
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#173B67]/10 text-[#173B67]">
                  <Filter size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Calendar Filters</p>
                  <p className="text-xs text-slate-500">Filter the Month, Week, Day, and Agenda views.</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 md:flex-row xl:justify-end">
                <select value={calendarFilters.meetingType} onChange={(event) => updateCalendarFilter("meetingType", event.target.value as CalendarFilters["meetingType"])} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#173B67]" aria-label="Filter by meeting type">
                  <option value="">All meeting types</option>
                  <option value="BATCH_MEETING">Batch Meeting</option>
                  <option value="STUDENT_MEETING">Student Meeting</option>
                  <option value="INTERNAL_MEETING">Internal Meeting</option>
                  <option value="ONE_TO_ONE">One-to-One</option>
                  <option value="OTHER">Other</option>
                </select>

                <select value={calendarFilters.courseId} onChange={(event) => updateCalendarFilter("courseId", event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#173B67]" aria-label="Filter by course">
                  <option value="">All courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>

                <select value={calendarFilters.batchId} onChange={(event) => updateCalendarFilter("batchId", event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#173B67]" aria-label="Filter by batch">
                  <option value="">All batches</option>
                  {filteredCalendarBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.displayId ? `${batch.displayId} • ` : ""}{batch.name}
                    </option>
                  ))}
                </select>

                <select value={calendarFilters.status} onChange={(event) => updateCalendarFilter("status", event.target.value as CalendarFilters["status"])} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#173B67]" aria-label="Filter by status">
                  <option value="">All statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="LIVE">Live</option>
                </select>

                {hasCalendarFilters && (
                  <button type="button" onClick={clearCalendarFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredCalendarMeetings.length}</span> of {calendarMeetings.length} calendar events
              </p>
              {hasCalendarFilters && (
                <span className="rounded-full bg-[#173B67]/10 px-2.5 py-1 text-[11px] font-semibold text-[#173B67]">Filters active</span>
              )}
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
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200 px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
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
                            key={meeting.id}
                            type="button"
                            onClick={() => setSelectedMeeting(meeting)}
                            className={`block w-full truncate rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition hover:shadow-sm ${
                              meeting.status === "CANCELLED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : meeting.status === "COMPLETED"
                                ? "border-slate-200 bg-slate-100 text-slate-700"
                                : "border-blue-200 bg-blue-50 text-[#173B67]"
                            }`}
                            title={`${meeting.title} • ${formatTime(
                              meeting.startAt
                            )}`}
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
                            {new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date)}
                          </p>
                          <div
                            className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday ? "bg-[#173B67] text-white" : "text-slate-800"
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
                          style={{ height: `${weekHourRows.length * weekHourHeight}px` }}
                        >
                          {weekHourRows.map((hour) => (
                            <div
                              key={hour}
                              className="h-[72px] border-b border-slate-200"
                            />
                          ))}

                          {dayMeetings.map((meeting) => {
                            const style = getWeekMeetingStyle(meeting);
                            const meetingClasses =
                              meeting.status === "CANCELLED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : meeting.status === "COMPLETED"
                                ? "border-slate-200 bg-slate-100 text-slate-700"
                                : "border-blue-200 bg-blue-50 text-[#173B67]";

                            return (
                              <button
                                key={meeting.id}
                                type="button"
                                onClick={() => setSelectedMeeting(meeting)}
                                className={`absolute left-1 right-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-[11px] shadow-sm transition hover:z-20 hover:shadow-md ${meetingClasses}`}
                                style={style}
                                title={`${meeting.title} • ${formatTime(
                                  meeting.startAt
                                )} – ${formatTime(meeting.endAt)}`}
                              >
                                <span className="block truncate font-semibold">
                                  {formatTime(meeting.startAt)}
                                </span>
                                <span className="block truncate font-medium">
                                  {meeting.title}
                                </span>
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
              <div className="flex flex-col items-center justify-center border-b border-slate-200 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  {calendarDayLabel}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {getMeetingsForCalendarDay(calendarWeekDate).length}{" "}
                  {getMeetingsForCalendarDay(calendarWeekDate).length === 1
                    ? "meeting"
                    : "meetings"}
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[80px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50">
                    <div className="border-r border-slate-200" />
                    <div className="px-4 py-3 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {new Intl.DateTimeFormat("en-IN", {
                          weekday: "short",
                        }).format(calendarWeekDate)}
                      </p>
                      <div
                        className={`mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          isSameCalendarDay(calendarWeekDate, new Date())
                            ? "bg-[#173B67] text-white"
                            : "text-slate-800"
                        }`}
                      >
                        {calendarWeekDate.getDate()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[80px_minmax(0,1fr)]">
                    <div className="relative border-r border-slate-200 bg-slate-50">
                      {dayHourRows.map((hour) => (
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
                      className={`relative ${
                        isSameCalendarDay(calendarWeekDate, new Date())
                          ? "bg-blue-50/20"
                          : "bg-white"
                      }`}
                      style={{
                        height: `${dayHourRows.length * weekHourHeight}px`,
                      }}
                    >
                      {dayHourRows.map((hour) => (
                        <div
                          key={hour}
                          className="h-[72px] border-b border-slate-200"
                        />
                      ))}

                      {getMeetingsForCalendarDay(calendarWeekDate).map(
                        (meeting) => {
                          const style = getDayMeetingStyle(meeting);
                          const meetingClasses =
                            meeting.status === "CANCELLED"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : meeting.status === "COMPLETED"
                              ? "border-slate-200 bg-slate-100 text-slate-700"
                              : "border-blue-200 bg-blue-50 text-[#173B67]";

                          return (
                            <button
                              key={meeting.id}
                              type="button"
                              onClick={() => setSelectedMeeting(meeting)}
                              className={`absolute left-2 right-2 z-10 overflow-hidden rounded-lg border px-3 py-2 text-left shadow-sm transition hover:z-20 hover:shadow-md ${meetingClasses}`}
                              style={style}
                              title={`${meeting.title} • ${formatTime(
                                meeting.startAt
                              )} – ${formatTime(meeting.endAt)}`}
                            >
                              <span className="block truncate text-xs font-semibold">
                                {formatTime(meeting.startAt)} –{" "}
                                {formatTime(meeting.endAt)}
                              </span>
                              <span className="mt-1 block truncate text-sm font-semibold">
                                {meeting.title}
                              </span>
                              <span className="mt-1 block truncate text-[11px]">
                                {getMeetingTypeLabel(meeting.meetingType)}
                              </span>
                            </button>
                          );
                        }
                      )}

                      {getMeetingsForCalendarDay(calendarWeekDate).length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                          No meetings scheduled for this day.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {new Intl.DateTimeFormat("en-IN", {
                      month: "long",
                      year: "numeric",
                    }).format(calendarMonth)}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {agendaMeetings.length}{" "}
                    {agendaMeetings.length === 1 ? "meeting" : "meetings"} scheduled this month
                  </p>
                </div>
              </div>

              {agendaDates.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <CalendarDays size={22} />
                  </div>
                  <p className="font-medium text-slate-700">
                    No meetings scheduled this month
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Meetings created for this month will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {agendaDates.map(([dateKey, dayMeetings]) => {
                    const date = new Date(`${dateKey}T00:00:00`);
                    const isToday = isSameCalendarDay(date, new Date());

                    return (
                      <div
                        key={dateKey}
                        ref={isToday ? agendaTodayRef : undefined}
                        className={`px-6 py-5 ${
                          isToday ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                              isToday
                                ? "bg-[#173B67] text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {date.getDate()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                              {new Intl.DateTimeFormat("en-IN", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              }).format(date)}
                              </p>
                              {isToday && (
                                <span className="rounded-full bg-[#173B67]/10 px-2 py-0.5 text-[10px] font-semibold text-[#173B67]">
                                  Today
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {dayMeetings.length}{" "}
                              {dayMeetings.length === 1 ? "meeting" : "meetings"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pl-[52px]">
                          {dayMeetings.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                              No meetings scheduled for today.
                            </p>
                          ) : (
                            dayMeetings.map((meeting) => {
                            const TypeIcon = getMeetingTypeIcon(meeting.meetingType);
                            const meetingClasses =
                              meeting.status === "CANCELLED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : meeting.status === "COMPLETED"
                                ? "border-slate-200 bg-slate-100 text-slate-700"
                                : "border-blue-200 bg-blue-50 text-[#173B67]";

                            return (
                              <button
                                key={meeting.id}
                                type="button"
                                onClick={() => setSelectedMeeting(meeting)}
                                className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition hover:shadow-sm ${meetingClasses}`}
                              >
                                <div className="flex w-28 shrink-0 flex-col">
                                  <span className="text-sm font-semibold">
                                    {formatTime(meeting.startAt)}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {formatTime(meeting.endAt)}
                                  </span>
                                </div>

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
                                  <TypeIcon size={17} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    {meeting.title}
                                  </p>
                                  <p className="mt-1 truncate text-xs opacity-75">
                                    {getMeetingTypeLabel(meeting.meetingType)}
                                    {meeting.batch?.name
                                      ? ` • ${meeting.batch.name}`
                                      : ""}
                                    {meeting.course?.title
                                      ? ` • ${meeting.course.title}`
                                      : ""}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-semibold">
                                  {meeting.status}
                                </span>
                              </button>
                            );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>



        {/* Today */}

        <section>

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold text-slate-900">

                Today

              </h2>



              <p className="mt-1 text-sm text-slate-500">

                Meetings scheduled for today.

              </p>

            </div>



            <span className="rounded-full bg-[#173B67]/10 px-3 py-1 text-xs font-semibold text-[#173B67]">

              {todayMeetings.length}{" "}

              {todayMeetings.length === 1 ? "meeting" : "meetings"}

            </span>

          </div>



          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

            {loading ? (

              <div className="flex items-center justify-center px-6 py-12 text-sm text-slate-500">

                Loading today&apos;s meetings...

              </div>

            ) : todayMeetings.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                  <CalendarDays size={22} />

                </div>



                <p className="font-medium text-slate-700">

                  No meetings scheduled today

                </p>



                <p className="mt-1 text-sm text-slate-500">

                  Today&apos;s scheduled meetings will appear here.

                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {todayMeetings.map((meeting) => {

                  const TypeIcon = getMeetingTypeIcon(

                    meeting.meetingType

                  );



                  return (

                    <button

                      key={meeting.id}

                      type="button"

                      onClick={() => setSelectedMeeting(meeting)}

                      className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50"

                    >

                      <div className="flex w-24 shrink-0 flex-col">

                        <span className="text-sm font-semibold text-slate-900">

                          {formatTime(meeting.startAt)}

                        </span>



                        <span className="text-xs text-slate-400">

                          {formatTime(meeting.endAt)}

                        </span>

                      </div>



                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/10 text-[#173B67]">

                        <TypeIcon size={18} />

                      </div>



                      <div className="min-w-0 flex-1">

                        <p className="truncate font-semibold text-slate-900">

                          {meeting.title}

                        </p>



                        <p className="mt-1 truncate text-sm text-slate-500">

                          {getMeetingTypeLabel(meeting.meetingType)}

                          {meeting.batch?.name

                            ? ` • ${meeting.batch.name}`

                            : ""}

                          {meeting.course?.title

                            ? ` • ${meeting.course.title}`

                            : ""}

                        </p>

                      </div>



                      <span

                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(

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

        </section>



        {/* Upcoming */}

        <section>

          <div className="mb-4">

            <h2 className="text-lg font-semibold text-slate-900">

              Upcoming Meetings

            </h2>



            <p className="mt-1 text-sm text-slate-500">

              Your next scheduled meetings across the platform.

            </p>

          </div>



          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {loading ? (

              <div className="flex items-center justify-center px-6 py-12 text-sm text-slate-500">

                Loading meetings...

              </div>

            ) : upcomingMeetings.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                  <CalendarDays size={22} />

                </div>



                <p className="font-medium text-slate-700">

                  No upcoming meetings

                </p>



                <p className="mt-1 text-sm text-slate-500">

                  Create a meeting to start building the calendar.

                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-slate-200 bg-slate-50">

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                        Meeting

                      </th>



                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                        Date & Time

                      </th>



                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                        Type

                      </th>



                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                        Organizer

                      </th>



                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                        Context

                      </th>



                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">

                        Status

                      </th>

                    </tr>

                  </thead>



                  <tbody className="divide-y divide-slate-100">

                    {upcomingMeetings.map((meeting) => {

                      const TypeIcon = getMeetingTypeIcon(

                        meeting.meetingType

                      );



                      return (

                        <tr

                          key={meeting.id}

                          onClick={() => setSelectedMeeting(meeting)}

                          className="cursor-pointer transition hover:bg-slate-50"

                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#173B67]/10 text-[#173B67]">

                                <TypeIcon size={17} />

                              </div>



                              <div className="min-w-0">

                                <p className="max-w-[280px] truncate text-sm font-semibold text-slate-900">

                                  {meeting.title}

                                </p>



                                {meeting.description && (

                                  <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">

                                    {meeting.description}

                                  </p>

                                )}

                              </div>

                            </div>

                          </td>



                          <td className="whitespace-nowrap px-6 py-4">

                            <p className="text-sm font-medium text-slate-800">

                              {formatDate(meeting.startAt)}

                            </p>



                            <p className="mt-1 text-xs text-slate-500">

                              {formatTime(meeting.startAt)} –{" "}

                              {formatTime(meeting.endAt)}

                            </p>

                          </td>



                          <td className="px-6 py-4">

                            <span className="text-sm text-slate-700">

                              {getMeetingTypeLabel(meeting.meetingType)}

                            </span>

                          </td>



                          <td className="px-6 py-4">

                            <div className="max-w-[180px]">

                              <p className="truncate text-sm font-medium text-slate-800">

                                {meeting.organizer?.name ||

                                  meeting.organizer?.email ||

                                  `User #${meeting.organizerUserId}`}

                              </p>



                              {meeting.organizer?.email && (

                                <p className="mt-1 truncate text-xs text-slate-500">

                                  {meeting.organizer.email}

                                </p>

                              )}

                            </div>

                          </td>



                          <td className="px-6 py-4">

                            <div className="space-y-1">

                              {meeting.batch && (

                                <div className="flex items-center gap-1.5 text-xs text-slate-600">

                                  <Layers size={13} />



                                  <span className="truncate">

                                    {meeting.batch.displayId

                                      ? `${meeting.batch.displayId} • `

                                      : ""}

                                    {meeting.batch.name}

                                  </span>

                                </div>

                              )}



                              {meeting.course && (

                                <div className="flex items-center gap-1.5 text-xs text-slate-600">

                                  <BookOpen size={13} />



                                  <span className="truncate">

                                    {meeting.course.title}

                                  </span>

                                </div>

                              )}



                              {!meeting.batch && !meeting.course && (

                                <span className="text-xs text-slate-400">

                                  No linked context

                                </span>

                              )}

                            </div>

                          </td>



                          <td className="px-6 py-4 text-right">

                            <span

                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(

                                meeting.status

                              )}`}

                            >

                              {meeting.status}

                            </span>

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

      </div>



      {/* Meeting details modal */}

      {selectedMeeting && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"

          onClick={() => setSelectedMeeting(null)}

        >

          <div

            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

              <div className="min-w-0 pr-4">

                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#F97316]">

                  {`Meeting #${selectedMeeting.id}`}

                </p>



                <h2 className="text-xl font-bold text-slate-900">

                  {selectedMeeting.title}

                </h2>

              </div>



              <button

                type="button"

                onClick={() => setSelectedMeeting(null)}

                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"

              >

                <XCircle size={20} />

              </button>

            </div>



            <div className="space-y-5 px-6 py-6">

              <div className="flex items-center justify-between">

                <span className="rounded-full bg-[#173B67]/10 px-3 py-1.5 text-xs font-semibold text-[#173B67]">

                  {getMeetingTypeLabel(selectedMeeting.meetingType)}

                </span>



                <span

                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(

                    selectedMeeting.status

                  )}`}

                >

                  {selectedMeeting.status}

                </span>

              </div>



              {selectedMeeting.description && (

                <div>

                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">

                    Description

                  </p>



                  <p className="text-sm leading-6 text-slate-700">

                    {selectedMeeting.description}

                  </p>

                </div>

              )}



              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div className="mb-2 flex items-center gap-2 text-slate-500">

                    <CalendarDays size={16} />



                    <span className="text-xs font-semibold uppercase tracking-wide">

                      Start

                    </span>

                  </div>



                  <p className="text-sm font-semibold text-slate-900">

                    {formatDateTime(selectedMeeting.startAt)}

                  </p>

                </div>



                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div className="mb-2 flex items-center gap-2 text-slate-500">

                    <Clock3 size={16} />



                    <span className="text-xs font-semibold uppercase tracking-wide">

                      End

                    </span>

                  </div>



                  <p className="text-sm font-semibold text-slate-900">

                    {formatDateTime(selectedMeeting.endAt)}

                  </p>

                </div>

              </div>



              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Organizer
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedMeeting.trainer?.name ||
                      selectedMeeting.organizer?.name ||
                      selectedMeeting.organizer?.email ||
                      `User #${selectedMeeting.organizerUserId}`}
                  </p>
                  {(selectedMeeting.trainer?.email ||
                    selectedMeeting.organizer?.email) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedMeeting.trainer?.email ||
                        selectedMeeting.organizer?.email}
                    </p>
                  )}
                </div>



                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Participants
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedMeeting.participants?.length || 0}
                  </p>
                </div>

              </div>



              {selectedMeeting.batch && (

                <div>

                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">

                    Batch

                  </p>



                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">

                    <Layers size={16} className="text-[#173B67]" />



                    {selectedMeeting.batch.displayId

                      ? `${selectedMeeting.batch.displayId} • `

                      : ""}

                    {selectedMeeting.batch.name}

                  </div>

                </div>

              )}



              {selectedMeeting.course && (

                <div>

                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">

                    Course

                  </p>



                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">

                    <BookOpen size={16} className="text-[#173B67]" />



                    {selectedMeeting.course.title}

                  </div>

                </div>

              )}



              {selectedMeeting.participants &&

                selectedMeeting.participants.length > 0 && (

                  <div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">

                      Participant List

                    </p>



                    <div className="space-y-2">

                      {selectedMeeting.participants.map(

                        (participant) => (

                          <div

                            key={participant.id}

                            className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"

                          >

                            <div>

                              <p className="text-sm font-medium text-slate-800">

                                {participant.name ||

                                  participant.email ||

                                  `User #${participant.userId}`}

                              </p>



                              {participant.email &&

                                participant.name && (

                                  <p className="mt-1 text-xs text-slate-500">

                                    {participant.email}

                                  </p>

                                )}

                            </div>



                            {participant.role && (

                              <span className="text-xs font-medium text-slate-500">

                                {participant.role}

                              </span>

                            )}

                          </div>

                        )

                      )}

                    </div>

                  </div>

                )}



              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Meeting Platform
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {getMeetingPlatformLabel(selectedMeeting.meetingPlatform)}
                </p>
              </div>



              {selectedMeeting.meetingUrl && (

                <div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">

                    Meeting Link

                  </p>



                  <a

                    href={selectedMeeting.meetingUrl}

                    target="_blank"

                    rel="noreferrer"

                    className="inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102E52]"

                  >

                    <Video size={16} />

                    Join Meeting

                  </a>

                </div>

              )}

            </div>



            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2">

                {selectedMeeting.status === "SCHEDULED" && (
                    <button

                      type="button"

                      onClick={() => handleCancelMeeting(selectedMeeting)}

                      disabled={saving}

                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"

                    >

                      Cancel Meeting

                    </button>
                  )}

              </div>



              <button

                type="button"

                onClick={() => setSelectedMeeting(null)}

                disabled={saving}

                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"

              >

                Close

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Create Meeting modal */}

      {showCreateModal && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"

          onClick={closeCreateModal}

        >

          <div

            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#F97316]">

                  Calendar

                </p>



                <h2 className="text-xl font-bold text-slate-900">

                  Create Meeting

                </h2>



                <p className="mt-1 text-sm text-slate-500">

                  Schedule a new meeting for SKCE.

                </p>

              </div>



              <button

                type="button"

                onClick={closeCreateModal}

                disabled={saving}

                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"

              >

                <XCircle size={20} />

              </button>

            </div>



            <form onSubmit={handleCreateMeeting}>

              <div className="space-y-6 px-6 py-6">

                {loadingOptions ? (

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">

                    Loading courses and batches...

                  </div>

                ) : null}



                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Meeting Title

                      <span className="ml-1 text-red-500">*</span>

                    </label>



                    <input

                      type="text"

                      value={form.title}

                      onChange={(event) =>

                        updateForm("title", event.target.value)

                      }

                      placeholder="Example: Course Discussion"

                      maxLength={255}

                      required

                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    />

                  </div>



                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Description

                    </label>



                    <textarea

                      value={form.description}

                      onChange={(event) =>

                        updateForm(

                          "description",

                          event.target.value

                        )

                      }

                      rows={3}

                      placeholder="Add meeting details..."

                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    />

                  </div>



                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Meeting Type

                      <span className="ml-1 text-red-500">*</span>

                    </label>



                    <select

                      value={form.meetingType}

                      onChange={(event) =>

                        handleMeetingTypeChange(

                          event.target.value as MeetingType

                        )

                      }

                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    >

                      <option value="OTHER">Other</option>

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

                  </div>



                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Meeting Platform
                    </label>
                    <select
                      value={form.meetingPlatform}
                      onChange={(event) =>
                        updateForm(
                          "meetingPlatform",
                          event.target.value as MeetingPlatform
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                    >
                      <option value="GOOGLE_MEET">Google Meet</option>
                      <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                      <option value="ZOOM">Zoom</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>



                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Course

                    </label>



                    <select

                      value={form.courseId}

                      onChange={(event) =>

                        handleCourseChange(event.target.value)

                      }

                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    >

                      <option value="">No Course</option>



                      {courses.map((course) => (

                        <option

                          key={course.id}

                          value={course.id}

                        >

                          {course.title}

                        </option>

                      ))}

                    </select>

                  </div>



                  {form.meetingType !== "INTERNAL_MEETING" && (

                    <div className="sm:col-span-2">

                      <label className="mb-2 block text-sm font-semibold text-slate-700">

                        Batch

                        {form.meetingType === "BATCH_MEETING" && (

                          <span className="ml-1 text-red-500">*</span>

                        )}

                      </label>



                      <select

                        value={form.batchId}

                        onChange={(event) =>

                          updateForm("batchId", event.target.value)

                        }

                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                      >

                        <option value="">

                          {form.courseId

                            ? "No Batch"

                            : "Select a course first or choose no batch"}

                        </option>



                        {filteredBatches.map((batch) => (

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



                      {form.courseId &&

                        filteredBatches.length === 0 && (

                          <p className="mt-2 text-xs text-amber-600">

                            No batches are available for the selected

                            course.

                          </p>

                        )}

                    </div>

                  )}

                  {form.meetingType === "INTERNAL_MEETING" && (

                    <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">

                      <p className="text-xs text-slate-600">

                        Internal meetings are not linked to a batch.

                      </p>

                    </div>

                  )}



                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Start

                      <span className="ml-1 text-red-500">*</span>

                    </label>



                    <input

                      type="datetime-local"

                      value={form.startAt}

                      onChange={(event) =>

                        updateForm("startAt", event.target.value)

                      }

                      required

                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    />

                  </div>



                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      End

                      <span className="ml-1 text-red-500">*</span>

                    </label>



                    <input

                      type="datetime-local"

                      value={form.endAt}

                      onChange={(event) =>

                        updateForm("endAt", event.target.value)

                      }

                      required

                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    />

                  </div>



                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Meeting URL

                    </label>



                    <input

                      type="url"

                      value={form.meetingUrl}

                      onChange={(event) =>

                        updateForm(

                          "meetingUrl",

                          event.target.value

                        )

                      }

                      placeholder="https://teams.microsoft.com/..."

                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"

                    />

                  </div>

                </div>



                {(form.meetingType === "STUDENT_MEETING" ||
                  form.meetingType === "ONE_TO_ONE") && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Student Participants
                          <span className="ml-1 text-red-500">*</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {form.meetingType === "ONE_TO_ONE"
                            ? "Select one student for this meeting."
                            : "Select one or more students for this meeting."}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#173B67]/10 px-2.5 py-1 text-xs font-semibold text-[#173B67]">
                        {selectedParticipantUserIds.length} selected
                      </span>
                    </div>

                    {loadingOptions ? (
                      <p className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                        Loading students...
                      </p>
                    ) : students.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                        No active students are available.
                      </p>
                    ) : form.meetingType === "ONE_TO_ONE" ? (
                      <select
                        value={selectedParticipantUserIds[0] ?? ""}
                        onChange={(event) =>
                          selectOneToOneParticipant(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                      >
                        <option value="">Select a student</option>
                        {students.map((student) => (
                          <option key={student.userId} value={student.userId}>
                            {student.name} — {student.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                        {students.map((student) => {
                          const selected = selectedParticipantUserIds.includes(
                            student.userId
                          );
                          return (
                            <label key={student.userId} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleParticipant(student.userId)}
                                className="h-4 w-4 rounded border-slate-300 text-[#173B67] focus:ring-[#173B67]"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-800">{student.name}</span>
                                <span className="block truncate text-xs text-slate-500">{student.email}</span>
                              </span>
                            </label>
                          );
                        })}
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
                          <span className="ml-1 text-red-500">*</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Select one or more trainers for this internal meeting.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#173B67]/10 px-2.5 py-1 text-xs font-semibold text-[#173B67]">
                        {selectedParticipantUserIds.length} selected
                      </span>
                    </div>
                    {loadingOptions ? (
                      <p className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Loading trainers...</p>
                    ) : trainers.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">No active trainers are available.</p>
                    ) : (
                      <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                        {trainers.map((trainer) => {
                          const selected = selectedParticipantUserIds.includes(trainer.userId);
                          return (
                            <label key={trainer.userId} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleParticipant(trainer.userId)}
                                className="h-4 w-4 rounded border-slate-300 text-[#173B67] focus:ring-[#173B67]"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-800">{trainer.name}</span>
                                <span className="block truncate text-xs text-slate-500">{trainer.email}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {conflictMessage && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Clock3
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-700"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-amber-900">
                            Scheduling conflict
                          </p>
                          <button
                            type="button"
                            onClick={() => setConflictMessage("")}
                            className="shrink-0 text-amber-600 transition hover:text-amber-800"
                            aria-label="Dismiss scheduling conflict"
                          >
                            <XCircle size={17} />
                          </button>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-amber-800">
                          {conflictMessage}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-amber-700">
                          Please select a different time or change the meeting participant or batch.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {form.meetingType === "BATCH_MEETING" && (

                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

                    <div className="flex items-start gap-3">

                      <Layers

                        size={18}

                        className="mt-0.5 shrink-0 text-[#173B67]"

                      />



                      <div>

                        <p className="text-sm font-semibold text-[#173B67]">

                          Batch meeting

                        </p>



                        <p className="mt-1 text-xs leading-5 text-blue-700">

                          The selected batch will determine the

                          meeting audience. Individual student

                          participant rows are not created for a

                          batch meeting.

                        </p>

                      </div>

                    </div>

                  </div>

                )}

              </div>



              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button

                  type="button"

                  onClick={closeCreateModal}

                  disabled={saving}

                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"

                >

                  Cancel

                </button>



                <button

                  type="submit"

                  disabled={saving || loadingOptions}

                  className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"

                >

                  <Save size={16} />



                  {saving ? "Creating..." : "Create Meeting"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>

  );

}