"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Loader2,
  Video,
  CalendarDays,
  Clock3,
  Users,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  ExternalLink,
  Radio,
  CheckCircle2,
  XCircle,
  Link2,
  FileVideo,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type DisplayStatus =
  | "UPCOMING"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

type LiveSession = {
  id: number;
  title: string;
  description: string | null;
  courseId: number;
  trainerId: number;
  startAt: string;
  endAt: string;
  meetingUrl: string | null;
  recordingUrl: string | null;
  status:
    | "SCHEDULED"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";
  displayStatus: DisplayStatus;
  isPublished: boolean;
  participantCount: number;
  course: {
    id: number;
    slug: string;
    title: string;
  } | null;
};

type Participant = {
  id: number;
  userId: number;
  name: string;
  email: string;
  joinedAt: string | null;
  leftAt: string | null;
  participated: boolean;
};

type EditForm = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  meetingUrl: string;
  recordingUrl: string;
  status:
    | "SCHEDULED"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";
  isPublished: boolean;
};

const EMPTY_FORM: EditForm = {
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  meetingUrl: "",
  recordingUrl: "",
  status: "SCHEDULED",
  isPublished: false,
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function toLocalDateTime(value: string) {
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
      hour12: true,
    }
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}

function statusLabel(status: DisplayStatus) {
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

function statusClasses(status: DisplayStatus) {
  switch (status) {
    case "LIVE":
      return "bg-emerald-50 text-emerald-700";
    case "UPCOMING":
      return "bg-blue-50 text-blue-700";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
  }
}

export default function TrainerLiveSessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] =
    useState<LiveSession[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | DisplayStatus>(
      "All"
    );

  const [selectedSession, setSelectedSession] =
    useState<LiveSession | null>(null);

  const [editSession, setEditSession] =
    useState<LiveSession | null>(null);

  const [participantsSession, setParticipantsSession] =
    useState<LiveSession | null>(null);

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [participantsLoading, setParticipantsLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<EditForm>(EMPTY_FORM);

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

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("student");
      localStorage.removeItem("studentId");

      router.push("/login");

      throw new Error(
        "Authentication required"
      );
    }

    return response;
  }

  async function loadSessions(
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
          `${API_URL}/trainer/live-sessions`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to load live sessions."
        );
      }

      const data =
        Array.isArray(json.data)
          ? json.data
          : [];

      setSessions(
        data.map(
          (session: LiveSession) => ({
            ...session,
            id: Number(
              session.id
            ),
            courseId: Number(
              session.courseId
            ),
            trainerId: Number(
              session.trainerId
            ),
            participantCount:
              Number(
                session.participantCount ||
                  0
              ),
          })
        )
      );
    } catch (err) {
      console.error(
        "Trainer live sessions load error:",
        err
      );

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
    void loadSessions();
  }, []);

  const filteredSessions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return sessions.filter(
        (session) => {
          const matchesSearch =
            !query ||
            session.title
              .toLowerCase()
              .includes(query) ||
            (
              session.course
                ?.title || ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "All" ||
            session.displayStatus ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      sessions,
      search,
      statusFilter,
    ]);

  const summary = useMemo(
    () => ({
      total: sessions.length,
      upcoming:
        sessions.filter(
          (session) =>
            session.displayStatus ===
            "UPCOMING"
        ).length,
      live:
        sessions.filter(
          (session) =>
            session.displayStatus ===
            "LIVE"
        ).length,
      completed:
        sessions.filter(
          (session) =>
            session.displayStatus ===
            "COMPLETED"
        ).length,
    }),
    [sessions]
  );

  function openDetails(
    session: LiveSession
  ) {
    setSelectedSession(session);
  }

  function openEdit(
    session: LiveSession
  ) {
    setSelectedSession(null);

    setEditSession(session);

    setForm({
      title: session.title,
      description:
        session.description || "",
      startAt: toLocalDateTime(
        session.startAt
      ),
      endAt: toLocalDateTime(
        session.endAt
      ),
      meetingUrl:
        session.meetingUrl || "",
      recordingUrl:
        session.recordingUrl || "",
      status: session.status,
      isPublished:
        session.isPublished,
    });
  }

  async function openParticipants(
    session: LiveSession
  ) {
    setParticipantsSession(
      session
    );
    setParticipants([]);
    setParticipantsLoading(true);

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/trainer/live-sessions/${session.id}/participants`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to load participants."
        );
      }

      const data = Array.isArray(
        json.data
      )
        ? json.data
        : [];

      setParticipants(
        data.map(
          (item: any) => ({
            id: Number(
              item.id
            ),
            userId: Number(
              item.userId
            ),
            name:
              item.name ||
              item.user?.name ||
              "Student",
            email:
              item.email ||
              item.user?.email ||
              "",
            joinedAt:
              item.joinedAt ||
              null,
            leftAt:
              item.leftAt ||
              null,
            participated:
              Boolean(
                item.participated
              ),
          })
        )
      );
    } catch (err) {
      console.error(
        "Participants load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load participants."
      );
    } finally {
      setParticipantsLoading(
        false
      );
    }
  }

  async function saveChanges(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!editSession) {
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Session title is required."
      );
      return;
    }

    if (
      !form.startAt ||
      !form.endAt
    ) {
      setError(
        "Start and end time are required."
      );
      return;
    }

    if (
      new Date(
        form.endAt
      ).getTime() <=
      new Date(
        form.startAt
      ).getTime()
    ) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/trainer/live-sessions/${editSession.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              title: form.title.trim(),
              description:
                form.description.trim() ||
                null,
              startAt:
                new Date(
                  form.startAt
                ).toISOString(),
              endAt:
                new Date(
                  form.endAt
                ).toISOString(),
              meetingUrl:
                form.meetingUrl.trim() ||
                null,
              recordingUrl:
                form.recordingUrl.trim() ||
                null,
              status:
                form.status,
              isPublished:
                form.isPublished,
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
            "Unable to update live session."
        );
      }

      setEditSession(null);

      await loadSessions(
        true
      );
    } catch (err) {
      console.error(
        "Update live session error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update live session."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(
    session: LiveSession
  ) {
    const confirmed =
      window.confirm(
        `Delete "${session.title}"? This will also remove its participation records.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      session.id
    );
    setError("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/trainer/live-sessions/${session.id}`,
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
            "Unable to delete live session."
        );
      }

      if (
        selectedSession?.id ===
        session.id
      ) {
        setSelectedSession(null);
      }

      if (
        participantsSession?.id ===
        session.id
      ) {
        setParticipantsSession(
          null
        );
      }

      await loadSessions(
        true
      );
    } catch (err) {
      console.error(
        "Delete live session error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete live session."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function closeModals() {
    if (!saving) {
      setSelectedSession(null);
      setEditSession(null);
      setParticipantsSession(
        null
      );
      setParticipants([]);
      setError("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-4 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
              <Video size={17} />
              Trainer Portal
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Live Sessions
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              View and manage the live sessions assigned to you.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadSessions(
                true
              )
            }
            disabled={
              loading ||
              refreshing
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Live Sessions
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
            icon={<Video size={20} />}
            label="Total Sessions"
            value={summary.total}
          />

          <SummaryCard
            icon={
              <CalendarDays
                size={20}
              />
            }
            label="Upcoming"
            value={
              summary.upcoming
            }
          />

          <SummaryCard
            icon={
              <Radio size={20} />
            }
            label="Live Now"
            value={summary.live}
          />

          <SummaryCard
            icon={
              <CheckCircle2
                size={20}
              />
            }
            label="Completed"
            value={
              summary.completed
            }
          />
        </div>

        {/* FILTER BAR */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-lg">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by session or course..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "All"
                    | DisplayStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="All">
                All Status
              </option>

              <option value="UPCOMING">
                Upcoming
              </option>

              <option value="LIVE">
                Live
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Loading live sessions...
              </div>
            </div>
          ) : filteredSessions.length ===
            0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Video
                  size={28}
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
                No live sessions found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search ||
                statusFilter !== "All"
                  ? "Try changing your search or status filter."
                  : "No sessions have been assigned to you yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50">
                    <TableHeader>
                      Session
                    </TableHeader>

                    <TableHeader>
                      Course
                    </TableHeader>

                    <TableHeader>
                      Date & Time
                    </TableHeader>

                    <TableHeader>
                      Participants
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Published
                    </TableHeader>

                    <TableHeader>
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.map(
                    (session) => (
                      <tr
                        key={session.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/60"
                      >
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {session.title}
                            </p>

                            <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">
                              {session.description ||
                                "No description provided"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                            {session.course
                              ?.title ||
                              "Course unavailable"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(
                                session.startAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatTime(
                                session.startAt
                              )}{" "}
                              –{" "}
                              {formatTime(
                                session.endAt
                              )}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            onClick={() =>
                              void openParticipants(
                                session
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#173B67] transition hover:bg-blue-50"
                          >
                            <Users
                              size={16}
                            />

                            {
                              session.participantCount
                            }
                          </button>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses(
                              session.displayStatus
                            )}`}
                          >
                            {statusLabel(
                              session.displayStatus
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                              session.isPublished
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {session.isPublished
                              ? "Published"
                              : "Draft"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              title="View session"
                              onClick={() =>
                                openDetails(
                                  session
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </ActionButton>

                            <ActionButton
                              title="Edit session"
                              onClick={() =>
                                openEdit(
                                  session
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </ActionButton>

                            <ActionButton
                              title="Delete session"
                              disabled={
                                deletingId ===
                                session.id
                              }
                              onClick={() =>
                                void deleteSession(
                                  session
                                )
                              }
                            >
                              {deletingId ===
                              session.id ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}
                            </ActionButton>
                          </div>
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* INFORMATION */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-800">
            Trainer Session Access
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700/80">
            This page shows only the sessions assigned to the logged-in trainer.
            Session participation is tracked per live session; daily attendance
            marking is not used here.
          </p>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedSession && (
        <ModalOverlay
          onClose={() =>
            setSelectedSession(null)
          }
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Live Session Details"
              subtitle="Session information and meeting resources."
              onClose={() =>
                setSelectedSession(
                  null
                )
              }
            />

            <div className="space-y-5 p-6">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                      Session
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-[#173B67]">
                      {
                        selectedSession.title
                      }
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {selectedSession.course
                        ?.title ||
                        "Course unavailable"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses(
                      selectedSession.displayStatus
                    )}`}
                  >
                    {statusLabel(
                      selectedSession.displayStatus
                    )}
                  </span>
                </div>
              </div>

              {selectedSession.description && (
                <DetailRow
                  label="Description"
                  value={
                    selectedSession.description
                  }
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow
                  label="Start"
                  value={formatDateTime(
                    selectedSession.startAt
                  )}
                />

                <DetailRow
                  label="End"
                  value={formatDateTime(
                    selectedSession.endAt
                  )}
                />

                <DetailRow
                  label="Participants"
                  value={String(
                    selectedSession.participantCount
                  )}
                />

                <DetailRow
                  label="Published"
                  value={
                    selectedSession.isPublished
                      ? "Yes"
                      : "No"
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedSession.meetingUrl && (
                  <a
                    href={
                      selectedSession.meetingUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    <ExternalLink
                      size={17}
                    />
                    Open Meeting
                  </a>
                )}

                {selectedSession.recordingUrl && (
                  <a
                    href={
                      selectedSession.recordingUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileVideo
                      size={17}
                    />
                    Open Recording
                  </a>
                )}
              </div>

              {!selectedSession.meetingUrl &&
                !selectedSession.recordingUrl && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No meeting or recording link has been configured for this session.
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  openEdit(
                    selectedSession
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Pencil size={16} />
                Edit Session
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedSession(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* EDIT MODAL */}
      {editSession && (
        <ModalOverlay
          onClose={() => {
            if (!saving) {
              setEditSession(
                null
              );
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Edit Live Session"
              subtitle="Update your assigned session."
              onClose={() => {
                if (!saving) {
                  setEditSession(
                    null
                  );
                }
              }}
            />

            <form
              onSubmit={saveChanges}
            >
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <FormField
                  label="Session Title"
                  value={
                    form.title
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        title: value,
                      })
                    )
                  }
                  required
                  placeholder="Enter session title"
                />

                <FormField
                  label="Status"
                  value={
                    form.status
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        status:
                          value as EditForm["status"],
                      })
                    )
                  }
                  selectOptions={[
                    [
                      "SCHEDULED",
                      "Scheduled",
                    ],
                    [
                      "LIVE",
                      "Live",
                    ],
                    [
                      "COMPLETED",
                      "Completed",
                    ],
                    [
                      "CANCELLED",
                      "Cancelled",
                    ],
                  ]}
                />

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    rows={3}
                    placeholder="Describe this live session"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <FormField
                  label="Start Time"
                  type="datetime-local"
                  value={
                    form.startAt
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        startAt:
                          value,
                      })
                    )
                  }
                  required
                />

                <FormField
                  label="End Time"
                  type="datetime-local"
                  value={
                    form.endAt
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        endAt:
                          value,
                      })
                    )
                  }
                  required
                />

                <FormField
                  label="Meeting URL"
                  type="url"
                  value={
                    form.meetingUrl
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        meetingUrl:
                          value,
                      })
                    )
                  }
                  placeholder="https://meet.google.com/..."
                />

                <FormField
                  label="Recording URL"
                  type="url"
                  value={
                    form.recordingUrl
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        recordingUrl:
                          value,
                      })
                    )
                  }
                  placeholder="https://..."
                />

                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.isPublished
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            isPublished:
                              event
                                .target
                                .checked,
                          })
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        Publish session
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        Published sessions can be made available to students according to their course access.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setEditSession(
                      null
                    )
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* PARTICIPANTS MODAL */}
      {participantsSession && (
        <ModalOverlay
          onClose={() =>
            setParticipantsSession(
              null
            )
          }
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Session Participants"
              subtitle={
                participantsSession.title
              }
              onClose={() =>
                setParticipantsSession(
                  null
                )
              }
            />

            <div className="p-6">
              {participantsLoading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Loading participants...
                  </div>
                </div>
              ) : participants.length ===
                0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <Users
                      size={25}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-[#173B67]">
                    No participation records
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    No students have joined this session yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[620px]">
                    <thead>
                      <tr className="bg-slate-50">
                        <TableHeader>
                          Student
                        </TableHeader>

                        <TableHeader>
                          Joined
                        </TableHeader>

                        <TableHeader>
                          Left
                        </TableHeader>

                        <TableHeader>
                          Participated
                        </TableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {participants.map(
                        (participant) => (
                          <tr
                            key={
                              participant.id
                            }
                            className="border-t border-slate-100"
                          >
                            <TableCell>
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {
                                    participant.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    participant.email
                                  }
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {participant.joinedAt
                                  ? formatDateTime(
                                      participant.joinedAt
                                    )
                                  : "—"}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {participant.leftAt
                                  ? formatDateTime(
                                      participant.leftAt
                                    )
                                  : "—"}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  participant.participated
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {participant.participated
                                  ? "Yes"
                                  : "No"}
                              </span>
                            </TableCell>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 align-middle">
      {children}
    </td>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#173B67] hover:text-[#173B67] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div>
        <h2 className="text-lg font-bold text-[#173B67]">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function DetailRow({
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

      <p className="mt-1 text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  selectOptions,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  selectOptions?: Array<
    [string, string]
  >;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {selectOptions ? (
        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          {selectOptions.map(
            ([optionValue, optionLabel]) => (
              <option
                key={optionValue}
                value={
                  optionValue
                }
              >
                {optionLabel}
              </option>
            )
          )}
        </select>
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      )}
    </div>
  );
}
