  "use client";

  import { useEffect, useMemo, useState } from "react";
  import { useRouter } from "next/navigation";
  import {
    Ban,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit3,
    ExternalLink,
    Eye,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    UserRound,
    Users,
    Video,
    X,
  } from "lucide-react";

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  type LiveSessionStatus =
    | "SCHEDULED"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";

  type DisplayStatus =
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";

  type CourseOption = {
    id: number;
    title: string;
    slug: string;
  };

  type TrainerOption = {
    id: number;
    userId: number;
    name: string;
    email: string;
  };

  type LiveSession = {
    id: number;
    courseId: number;
    trainerId: number;
    title: string;
    description: string | null;
    startAt: string;
    endAt: string;
    meetingUrl: string | null;
    recordingUrl: string | null;
    status: LiveSessionStatus;
    displayStatus: DisplayStatus;
    isPublished: boolean;
    createdAt?: string;
    updatedAt?: string;
    course: {
      id: number;
      slug: string;
      title: string;
    } | null;
    trainer: {
      id: number;
      userId: number;
      name: string;
      email: string;
    } | null;
    participantCount?: number;
  };

  type Participant = {
    id: number;
    sessionId: number;
    userId: number;
    name: string;
    email: string;
    phone: string | null;
    joinedAt: string | null;
    leftAt: string | null;
    participated: boolean;
  };

  type SessionForm = {
    courseId: string;
    trainerId: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    meetingUrl: string;
    recordingUrl: string;
    status: LiveSessionStatus;
    isPublished: boolean;
  };

  const EMPTY_FORM: SessionForm = {
    courseId: "",
    trainerId: "",
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    meetingUrl: "",
    recordingUrl: "",
    status: "SCHEDULED",
    isPublished: false,
  };

  const STATUS_FILTERS: Array<"All" | DisplayStatus> = [
    "All",
    "UPCOMING",
    "LIVE",
    "COMPLETED",
    "CANCELLED",
  ];

  function getToken() {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function toDateTimeLocal(value: string | null | undefined) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (number: number) => String(number).padStart(2, "0");

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function toIsoString(localValue: string) {
    if (!localValue) {
      return "";
    }

    const date = new Date(localValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString();
  }

  function displayStatusLabel(status: DisplayStatus) {
    switch (status) {
      case "UPCOMING":
        return "Upcoming";
      case "LIVE":
        return "Live";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
    }
  }

  function rawStatusLabel(status: LiveSessionStatus) {
    switch (status) {
      case "SCHEDULED":
        return "Scheduled";
      case "LIVE":
        return "Live";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
    }
  }

  function displayStatusClasses(status: DisplayStatus) {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "LIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "COMPLETED":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-100";
    }
  }

  export default function AdminLiveSessionsPage() {
    const router = useRouter();

    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [trainers, setTrainers] = useState<TrainerOption[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
      useState<"All" | DisplayStatus>("All");
    const [publishFilter, setPublishFilter] =
      useState<"All" | "Published" | "Draft">("All");

    const [showForm, setShowForm] = useState(false);
    const [editingSessionId, setEditingSessionId] =
      useState<number | null>(null);
    const [form, setForm] = useState<SessionForm>(EMPTY_FORM);

    const [participantsSession, setParticipantsSession] =
      useState<LiveSession | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);

    const [detailsSession, setDetailsSession] =
      useState<LiveSession | null>(null);

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
          ...(options.body
            ? {
                "Content-Type": "application/json",
              }
            : {}),
        },
      });

      if (response.status === 401 || response.status === 403) {
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

    async function loadSessions() {
      const response = await authenticatedFetch(
        `${API_URL}/admin/live-sessions`
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message || "Unable to load live sessions."
        );
      }

      setSessions(
        (json.data || []).map((session: LiveSession) => ({
          ...session,
          id: Number(session.id),
          courseId: Number(session.courseId),
          trainerId: Number(session.trainerId),
          participantCount: Number(session.participantCount || 0),
        }))
      );
    }

    async function loadOptions() {
      const response = await authenticatedFetch(
        `${API_URL}/admin/live-sessions/options`
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message || "Unable to load course and trainer options."
        );
      }

      setCourses(json.data?.courses || []);
      setTrainers(json.data?.trainers || []);
    }

    async function loadPage(initial = false) {
      try {
        setError("");

        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        await Promise.all([loadSessions(), loadOptions()]);
      } catch (err) {
        console.error("Load live sessions page error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load live sessions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    useEffect(() => {
      void loadPage(true);
    }, []);

    const filteredSessions = useMemo(() => {
      const normalizedSearch = search.trim().toLowerCase();

      return sessions.filter((session) => {
        const matchesSearch =
          !normalizedSearch ||
          session.title.toLowerCase().includes(normalizedSearch) ||
          (session.course?.title || "")
            .toLowerCase()
            .includes(normalizedSearch) ||
          (session.trainer?.name || "")
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "All" ||
          session.displayStatus === statusFilter;

        const matchesPublish =
          publishFilter === "All" ||
          (publishFilter === "Published" && session.isPublished) ||
          (publishFilter === "Draft" && !session.isPublished);

        return matchesSearch && matchesStatus && matchesPublish;
      });
    }, [sessions, search, statusFilter, publishFilter]);

    const summary = useMemo(
      () => ({
        total: sessions.length,
        upcoming: sessions.filter(
          (session) => session.displayStatus === "UPCOMING"
        ).length,
        live: sessions.filter(
          (session) => session.displayStatus === "LIVE"
        ).length,
        completed: sessions.filter(
          (session) => session.displayStatus === "COMPLETED"
        ).length,
      }),
      [sessions]
    );

    function updateForm(
      field: keyof SessionForm,
      value: string | boolean
    ) {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    }

    function openCreate() {
      setEditingSessionId(null);
      setDetailsSession(null);
      setForm({
        ...EMPTY_FORM,
        courseId: courses[0] ? String(courses[0].id) : "",
        trainerId: trainers[0] ? String(trainers[0].id) : "",
      });
      setError("");
      setShowForm(true);
    }

    function openEdit(session: LiveSession) {
      setEditingSessionId(session.id);
      setDetailsSession(null);
      setForm({
        courseId: String(session.courseId),
        trainerId: String(session.trainerId),
        title: session.title || "",
        description: session.description || "",
        startAt: toDateTimeLocal(session.startAt),
        endAt: toDateTimeLocal(session.endAt),
        meetingUrl: session.meetingUrl || "",
        recordingUrl: session.recordingUrl || "",
        status: session.status,
        isPublished: session.isPublished,
      });
      setError("");
      setShowForm(true);
    }

    function closeForm() {
      if (saving) {
        return;
      }

      setShowForm(false);
      setEditingSessionId(null);
      setForm(EMPTY_FORM);
    }

    async function submitForm(
      event: React.FormEvent<HTMLFormElement>
    ) {
      event.preventDefault();

      if (!form.courseId || !form.trainerId) {
        setError("Course and trainer are required.");
        return;
      }

      if (!form.title.trim()) {
        setError("Session title is required.");
        return;
      }

      if (!form.startAt || !form.endAt) {
        setError("Start and end time are required.");
        return;
      }

      const startIso = toIsoString(form.startAt);
      const endIso = toIsoString(form.endAt);

      if (!startIso || !endIso) {
        setError("Please enter valid start and end times.");
        return;
      }

      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        setError("End time must be later than the start time.");
        return;
      }

      setSaving(true);
      setError("");

      try {
        const payload = {
          courseId: Number(form.courseId),
          trainerId: Number(form.trainerId),
          title: form.title.trim(),
          description: form.description.trim()
            ? form.description.trim()
            : null,
          startAt: startIso,
          endAt: endIso,
          meetingUrl: form.meetingUrl.trim()
            ? form.meetingUrl.trim()
            : null,
          recordingUrl: form.recordingUrl.trim()
            ? form.recordingUrl.trim()
            : null,
          status: form.status,
          isPublished: form.isPublished,
        };

        const url = editingSessionId
          ? `${API_URL}/admin/live-sessions/${editingSessionId}`
          : `${API_URL}/admin/live-sessions`;

        const response = await authenticatedFetch(url, {
          method: editingSessionId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        });

        const json = await response.json();

        if (!response.ok || !json?.success) {
          throw new Error(
            json?.message ||
              `Unable to ${
                editingSessionId ? "update" : "create"
              } the live session.`
          );
        }

        closeForm();
        await loadPage();
      } catch (err) {
        console.error("Save live session error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to save live session."
        );
      } finally {
        setSaving(false);
      }
    }

    async function deleteSession(session: LiveSession) {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${session.title}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        const response = await authenticatedFetch(
          `${API_URL}/admin/live-sessions/${session.id}`,
          {
            method: "DELETE",
          }
        );

        const json = await response.json();

        if (!response.ok || !json?.success) {
          throw new Error(
            json?.message || "Unable to delete the live session."
          );
        }

        await loadSessions();
      } catch (err) {
        console.error("Delete live session error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete live session."
        );
      }
    }

    async function openParticipants(session: LiveSession) {
      setParticipantsSession(session);
      setParticipants([]);
      setParticipantsLoading(true);
      setError("");

      try {
        const response = await authenticatedFetch(
          `${API_URL}/admin/live-sessions/${session.id}/participants`
        );

        const json = await response.json();

        if (!response.ok || !json?.success) {
          throw new Error(
            json?.message || "Unable to load participants."
          );
        }

        setParticipants(json.data || []);
      } catch (err) {
        console.error("Load participants error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load participants."
        );
      } finally {
        setParticipantsLoading(false);
      }
    }

    function closeParticipants() {
      setParticipantsSession(null);
      setParticipants([]);
    }

    const inputClass =
      "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Video size={14} />
                Live Sessions
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
                Live Sessions
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Schedule, publish and manage live classes and session
                recordings.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadPage()}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                <Plus size={18} />
                Create Live Session
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div>{error}</div>
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 rounded-md p-1 hover:bg-red-100"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={<Video size={20} />}
              title="Total Sessions"
              value={summary.total}
            />
            <SummaryCard
              icon={<CalendarDays size={20} />}
              title="Upcoming"
              value={summary.upcoming}
            />
            <SummaryCard
              icon={<CheckCircle2 size={20} />}
              title="Live Now"
              value={summary.live}
            />
            <SummaryCard
              icon={<Clock3 size={20} />}
              title="Completed"
              value={summary.completed}
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xl">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by title, course or trainer..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "All" | DisplayStatus
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
                  >
                    {STATUS_FILTERS.map((status) => (
                      <option key={status} value={status}>
                        {status === "All"
                          ? "All Statuses"
                          : displayStatusLabel(status)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={publishFilter}
                    onChange={(event) =>
                      setPublishFilter(
                        event.target.value as
                          | "All"
                          | "Published"
                          | "Draft"
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
                  >
                    <option value="All">All Publishing</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Loading live sessions...
                </div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Video size={25} />
                </div>

                <h2 className="text-base font-semibold text-slate-800">
                  No live sessions found
                </h2>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Create a session or change the current search and filter
                  settings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3.5">Session</th>
                      <th className="px-5 py-3.5">Course</th>
                      <th className="px-5 py-3.5">Trainer</th>
                      <th className="px-5 py-3.5">Schedule</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Published</th>
                      <th className="px-5 py-3.5 text-center">
                        Participants
                      </th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="align-top transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[240px] items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Video size={18} />
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800">
                                {session.title}
                              </div>

                              {session.description && (
                                <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {session.description}
                                </div>
                              )}

                              <div className="mt-2 text-[11px] font-medium text-slate-400">
                                Session #{session.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-[190px] items-start gap-2">
                            <BookOpen
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {session.course?.title || "Course not found"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-[160px] items-start gap-2">
                            <UserRound
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-700">
                                {session.trainer?.name ||
                                  "Trainer not found"}
                              </div>
                              {session.trainer?.email && (
                                <div className="mt-0.5 text-xs text-slate-400">
                                  {session.trainer.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[190px]">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />
                              {formatDateTime(session.startAt)}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                              <Clock3 size={14} />
                              Ends {formatDateTime(session.endAt)}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${displayStatusClasses(
                              session.displayStatus
                            )}`}
                          >
                            {displayStatusLabel(
                              session.displayStatus
                            )}
                          </span>

                          <div className="mt-1 text-[11px] text-slate-400">
                            {rawStatusLabel(session.status)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {session.isPublished ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Draft
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => void openParticipants(session)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Users size={16} />
                            {session.participantCount ?? 0}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              title="View details"
                              onClick={() => setDetailsSession(session)}
                            >
                              <Eye size={16} />
                            </ActionButton>

                            {session.meetingUrl && (
                              <ActionButton
                                title="Open meeting link"
                                onClick={() =>
                                  window.open(
                                    session.meetingUrl as string,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                <ExternalLink size={16} />
                              </ActionButton>
                            )}

                            <ActionButton
                              title="Edit session"
                              onClick={() => openEdit(session)}
                            >
                              <Edit3 size={16} />
                            </ActionButton>

                            <ActionButton
                              title="Delete session"
                              danger
                              onClick={() =>
                                void deleteSession(session)
                              }
                            >
                              <Trash2 size={16} />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {!loading && (
            <div className="mt-4 text-xs text-slate-400">
              Showing {filteredSessions.length} of {sessions.length} live
              sessions.
            </div>
          )}
        </div>

        {showForm && (
          <Modal
            title={
              editingSessionId
                ? "Edit Live Session"
                : "Create Live Session"
            }
            subtitle={
              editingSessionId
                ? "Update the schedule, trainer, meeting details or publishing status."
                : "Schedule a live class for an enrolled course."
            }
            onClose={closeForm}
            wide
          >
            <form onSubmit={submitForm}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Course
                  </label>
                  <select
                    value={form.courseId}
                    onChange={(event) =>
                      updateForm("courseId", event.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Trainer
                  </label>
                  <select
                    value={form.trainerId}
                    onChange={(event) =>
                      updateForm("trainerId", event.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select trainer</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                        {trainer.email ? ` — ${trainer.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Session Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    placeholder="e.g. PostgreSQL Advanced Queries"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Optional session description or topics covered."
                    rows={4}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(event) =>
                      updateForm("startAt", event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Uses the admin browser&apos;s local time zone.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    End Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(event) =>
                      updateForm("endAt", event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Meeting URL
                  </label>
                  <input
                    type="url"
                    value={form.meetingUrl}
                    onChange={(event) =>
                      updateForm("meetingUrl", event.target.value)
                    }
                    placeholder="https://meet.google.com/..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Recording URL
                  </label>
                  <input
                    type="url"
                    value={form.recordingUrl}
                    onChange={(event) =>
                      updateForm("recordingUrl", event.target.value)
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Session Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as LiveSessionStatus
                      )
                    }
                    className={inputClass}
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(event) =>
                        updateForm(
                          "isPublished",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        Publish to students
                      </span>
                      <span className="block text-xs text-slate-400">
                        Only published sessions are visible in the student portal.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {editingSessionId
                    ? "Save Changes"
                    : "Create Session"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {detailsSession && (
          <Modal
            title="Live Session Details"
            subtitle="Current details loaded from the live session list."
            onClose={() => setDetailsSession(null)}
          >
            <div className="space-y-5">
              <DetailRow
                icon={<Video size={17} />}
                label="Title"
                value={detailsSession.title}
              />

              <DetailRow
                icon={<BookOpen size={17} />}
                label="Course"
                value={detailsSession.course?.title || "—"}
              />

              <DetailRow
                icon={<UserRound size={17} />}
                label="Trainer"
                value={detailsSession.trainer?.name || "—"}
              />

              <DetailRow
                icon={<CalendarDays size={17} />}
                label="Schedule"
                value={`${formatDateTime(
                  detailsSession.startAt
                )} → ${formatDateTime(detailsSession.endAt)}`}
              />

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  {detailsSession.description || "No description provided."}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow
                  icon={<Clock3 size={17} />}
                  label="Status"
                  value={displayStatusLabel(
                    detailsSession.displayStatus
                  )}
                />

                <DetailRow
                  icon={<Users size={17} />}
                  label="Participants"
                  value={String(
                    detailsSession.participantCount ?? 0
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LinkDetail
                  label="Meeting URL"
                  value={detailsSession.meetingUrl}
                />

                <LinkDetail
                  label="Recording URL"
                  value={detailsSession.recordingUrl}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-700">
                    Publishing
                  </span>
                  <span
                    className={
                      detailsSession.isPublished
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-amber-700"
                    }
                  >
                    {detailsSession.isPublished
                      ? "Published"
                      : "Draft"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setDetailsSession(null);
                    openEdit(detailsSession);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <Edit3 size={16} />
                  Edit Session
                </button>
              </div>
            </div>
          </Modal>
        )}

        {participantsSession && (
          <Modal
            title="Session Participants"
            subtitle={`${participantsSession.title} — ${formatDateTime(
              participantsSession.startAt
            )}`}
            onClose={closeParticipants}
            wide
          >
            {participantsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Loading participants...
                </div>
              </div>
            ) : participants.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Users size={20} />
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  No participation recorded
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Students who join this individual session will appear here.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[820px] w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Left</th>
                      <th className="px-4 py-3">Participation</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {participants.map((participant) => (
                      <tr key={participant.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {participant.name || "Unnamed student"}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            User #{participant.userId}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-700">
                            {participant.email || "—"}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {participant.phone || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDateTime(participant.joinedAt)}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDateTime(participant.leftAt)}
                        </td>

                        <td className="px-4 py-3">
                          {participant.participated ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Participated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              Not completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Modal>
        )}
      </main>
    );
  }

  function SummaryCard({
    icon,
    title,
    value,
  }: {
    icon: React.ReactNode;
    title: string;
    value: number;
  }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {title}
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-800">
              {value}
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>
        </div>
      </div>
    );
  }

  function ActionButton({
    children,
    title,
    onClick,
    danger = false,
  }: {
    children: React.ReactNode;
    title: string;
    onClick: () => void;
    danger?: boolean;
  }) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        className={
          danger
            ? "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:bg-red-50"
            : "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        }
      >
        {children}
      </button>
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
    subtitle?: string;
    children: React.ReactNode;
    onClose: () => void;
    wide?: boolean;
  }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-5">
        <div
          className={`flex max-h-[94vh] w-full ${
            wide ? "max-w-5xl" : "max-w-2xl"
          } flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#173B67]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-500">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  function DetailRow({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="mt-0.5 text-slate-400">{icon}</div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-1 break-words text-sm font-medium text-slate-700">
            {value}
          </div>
        </div>
      </div>
    );
  }

  function LinkDetail({
    label,
    value,
  }: {
    label: string;
    value: string | null;
  }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </div>

        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-medium text-blue-600 hover:underline"
          >
            {value}
            <ExternalLink size={14} className="shrink-0" />
          </a>
        ) : (
          <div className="mt-1 text-sm text-slate-400">
            Not configured
          </div>
        )}
      </div>
    );
  }
