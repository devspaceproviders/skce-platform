"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Clock3,
  GraduationCap,
  Video,
  RefreshCw,
  Loader2,
  Users,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type LiveSession = {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  meetingUrl: string | null;
  recordingUrl: string | null;
  status:
    | "SCHEDULED"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";
  isPublished: boolean;
  displayStatus:
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";
  participantCount?: number;
  course: {
    id: number;
    slug: string;
    title: string;
  } | null;
};

type Assessment = {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  type: "ASSIGNMENT" | "QUIZ";
  dueAt: string | null;
  totalMarks: number;
  submissionCount: number;
  isActive: boolean;
};

type Submission = {
  id: number;
  userId: number;
  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "GRADED";
  submittedAt: string | null;
};

type PendingAssessment = Assessment & {
  pendingCount: number;
};

type DashboardUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function getLoggedInUser(): DashboardUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DashboardUser;
  } catch {
    return null;
  }
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

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export default function TrainerDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<DashboardUser | null>(null);

  const [sessions, setSessions] =
    useState<LiveSession[]>([]);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [pendingAssessments, setPendingAssessments] =
    useState<PendingAssessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      throw new Error("Authentication required");
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

  async function loadDashboard(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        sessionsResponse,
        assessmentsResponse,
      ] = await Promise.all([
        authenticatedFetch(
          `${API_URL}/trainer/live-sessions`
        ),
        authenticatedFetch(
          `${API_URL}/assessments`
        ),
      ]);

      const sessionsJson =
        await sessionsResponse.json();

      const assessmentsJson =
        await assessmentsResponse.json();

      if (
        !sessionsResponse.ok ||
        !sessionsJson?.success
      ) {
        throw new Error(
          sessionsJson?.message ||
            "Unable to load live sessions."
        );
      }

      if (
        !assessmentsResponse.ok ||
        !assessmentsJson?.success
      ) {
        throw new Error(
          assessmentsJson?.message ||
            "Unable to load assessments."
        );
      }

      const sessionData =
        Array.isArray(sessionsJson.data)
          ? sessionsJson.data
          : [];

      const assessmentData =
        Array.isArray(
          assessmentsJson.data
        )
          ? assessmentsJson.data
          : [];

      setSessions(sessionData);
      setAssessments(assessmentData);

      /*
       * Determine actual pending grading
       * from assessment submissions.
       *
       * SUBMITTED = awaiting trainer grading
       * GRADED = already graded
       * IN_PROGRESS = not counted
       */
      const pendingResults =
        await Promise.all(
          assessmentData.map(
            async (assessment: Assessment) => {
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
                  return {
                    assessment,
                    pendingCount: 0,
                  };
                }

                const submissions: Submission[] =
                  Array.isArray(json.data)
                    ? json.data
                    : Array.isArray(
                          json.data?.submissions
                        )
                      ? json.data.submissions
                      : [];

                const pendingCount =
                  submissions.filter(
                    (submission) =>
                      submission.status ===
                      "SUBMITTED"
                  ).length;

                return {
                  assessment,
                  pendingCount,
                };
              } catch {
                return {
                  assessment,
                  pendingCount: 0,
                };
              }
            }
          )
        );

      setPendingAssessments(
        pendingResults
          .filter(
            (item) =>
              item.pendingCount > 0
          )
          .sort(
            (a, b) =>
              b.pendingCount -
              a.pendingCount
          )
          .slice(0, 5)
      );

      setUser(getLoggedInUser());
    } catch (err) {
      console.error(
        "Trainer dashboard load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load trainer dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    setUser(getLoggedInUser());
    void loadDashboard();
  }, []);

  /*
   * TODAY'S SCHEDULE
   *
   * Only LIVE and UPCOMING sessions
   * for today are shown here.
   *
   * COMPLETED sessions are moved to
   * Past Sessions.
   */
  const todaySessions = useMemo(() => {
    return sessions
      .filter(
        (session) =>
          isToday(session.startAt) &&
          (
            session.displayStatus ===
              "LIVE" ||
            session.displayStatus ===
              "UPCOMING"
          )
      )
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime()
      );
  }, [sessions]);

  /*
   * UPCOMING SESSIONS
   *
   * Only sessions with UPCOMING status
   * are shown here.
   */
  const upcomingSessions = useMemo(() => {
    return sessions
      .filter(
        (session) =>
          session.displayStatus ===
          "UPCOMING"
      )
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime()
      )
      .slice(0, 5);
  }, [sessions]);

  /*
   * PAST SESSIONS
   *
   * Completed sessions are shown here.
   */
  const pastSessions = useMemo(() => {
    return sessions
      .filter(
        (session) =>
          session.displayStatus ===
          "COMPLETED"
      )
      .sort(
        (a, b) =>
          new Date(b.startAt).getTime() -
          new Date(a.startAt).getTime()
      )
      .slice(0, 5);
  }, [sessions]);

  const totalParticipants = useMemo(
    () =>
      sessions.reduce(
        (sum, session) =>
          sum +
          Number(
            session.participantCount || 0
          ),
        0
      ),
    [sessions]
  );

  const pendingGradingCount =
    pendingAssessments.reduce(
      (sum, assessment) =>
        sum + assessment.pendingCount,
      0
    );

  const activeAssessments =
    assessments.filter(
      (assessment) =>
        assessment.isActive
    ).length;

  const firstName =
    user?.name?.trim().split(/\s+/)[0] ||
    "Trainer";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-4 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
              <GraduationCap size={17} />
              Trainer Portal
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {getGreeting()},{" "}
              {firstName}! 👋
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              {todaySessions.length > 0
                ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} scheduled for today.`
                : "You do not have any live sessions scheduled for today."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
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

            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Bell size={17} />
              Public Site
            </Link>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={18}
            />

            <div>
              <p className="font-semibold">
                Unable to load some dashboard data
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Video size={21} />}
            value={
              loading
                ? "—"
                : sessions.length
            }
            label="Live Sessions"
            description="Sessions assigned to you"
          />

          <StatCard
            icon={<Users size={21} />}
            value={
              loading
                ? "—"
                : totalParticipants
            }
            label="Participants"
            description="Recorded session participation"
          />

          <StatCard
            icon={
              <ClipboardList
                size={21}
              />
            }
            value={
              loading
                ? "—"
                : pendingGradingCount
            }
            label="Pending Grading"
            description="Submissions awaiting grading"
          />

          <StatCard
            icon={
              <CalendarDays
                size={21}
              />
            }
            value={
              loading
                ? "—"
                : todaySessions.length
            }
            label="Today's Classes"
            description="Live sessions today"
          />
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

          <div className="space-y-8">

            {/* TODAY'S SCHEDULE */}
            <section>
              <SectionHeader
                title="Today's Schedule"
                href="/dashboard/trainer/live-sessions"
              />

              {loading ? (
                <LoadingCard />
              ) : todaySessions.length ===
                0 ? (
                <EmptyCard
                  icon={
                    <CalendarDays
                      size={26}
                    />
                  }
                  title="No classes today"
                  description="Your live session schedule for today is empty."
                />
              ) : (
                <div className="space-y-3">
                  {todaySessions.map(
                    (session) => (
                      <ScheduleCard
                        key={session.id}
                        session={session}
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* UPCOMING SESSIONS */}
            <section>
              <SectionHeader
                title="Upcoming Sessions"
                href="/dashboard/trainer/live-sessions"
              />

              {loading ? (
                <LoadingCard />
              ) : upcomingSessions.length ===
                0 ? (
                <EmptyCard
                  icon={
                    <Video
                      size={26}
                    />
                  }
                  title="No upcoming sessions"
                  description="There are no future live sessions currently assigned to you."
                />
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map(
                    (session) => (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex min-w-0 items-start gap-4">

                            <div className="shrink-0 rounded-lg bg-orange-50 px-3 py-2 text-center text-orange-600">
                              <p className="text-[11px] font-semibold">
                                {formatDate(
                                  session.startAt
                                )}
                              </p>

                              <p className="mt-1 text-xs font-bold">
                                {formatTime(
                                  session.startAt
                                )}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                                {session.title}
                              </h3>

                              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                {session.course
                                  ?.title ||
                                  "Course not available"}

                                {typeof session.participantCount ===
                                  "number" &&
                                  ` · ${session.participantCount} participants`}
                              </p>
                            </div>

                          </div>

                          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            UPCOMING
                          </span>

                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* PAST SESSIONS */}
            <section>
              <SectionHeader
                title="Past Sessions"
                href="/dashboard/trainer/live-sessions"
              />

              {loading ? (
                <LoadingCard />
              ) : pastSessions.length ===
                0 ? (
                <EmptyCard
                  icon={
                    <CheckCircle2
                      size={26}
                    />
                  }
                  title="No past sessions"
                  description="Completed live sessions will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {pastSessions.map(
                    (session) => (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex min-w-0 items-start gap-4">

                            <div className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-center text-slate-600">
                              <p className="text-[11px] font-semibold">
                                {formatDate(
                                  session.startAt
                                )}
                              </p>

                              <p className="mt-1 text-xs font-bold">
                                {formatTime(
                                  session.startAt
                                )}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                                  {session.title}
                                </h3>

                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                                  COMPLETED
                                </span>

                              </div>

                              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                {session.course
                                  ?.title ||
                                  "Course not available"}

                                {typeof session.participantCount ===
                                  "number" &&
                                  ` · ${session.participantCount} participants`}
                              </p>
                            </div>

                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">

                            <Link
                              href="/dashboard/trainer/live-sessions"
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#173B67] transition hover:bg-slate-50 sm:text-sm"
                            >
                              View Session

                              <ArrowRight
                                size={14}
                                className="ml-1.5"
                              />
                            </Link>

                          </div>

                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <section>

            <div className="mb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Pending Grading
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Submissions currently waiting for your review
              </p>
            </div>

            {loading ? (
              <LoadingCard />
            ) : pendingAssessments.length ===
              0 ? (
              <EmptyCard
                icon={
                  <CheckCircle2
                    size={26}
                  />
                }
                title="Nothing to grade"
                description="There are no submitted assignments or quizzes awaiting grading."
              />
            ) : (
              <div className="space-y-3">
                {pendingAssessments.map(
                  (assessment) => (
                    <div
                      key={assessment.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                            {assessment.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {assessment.courseTitle ||
                              "Course not available"}
                          </p>

                          {assessment.dueAt && (
                            <p className="mt-2 text-[11px] text-slate-400">
                              Due:{" "}
                              {formatDate(
                                assessment.dueAt
                              )}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
                          {
                            assessment.pendingCount
                          }{" "}
                          pending
                        </span>

                      </div>

                      <div className="mt-4">
                        <Link
                          href="/dashboard/trainer/assignments"
                          className="inline-flex items-center gap-1 text-sm font-bold text-[#173B67] transition hover:text-orange-500"
                        >
                          Open Assignments
                          <ArrowRight
                            size={14}
                          />
                        </Link>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* QUICK LINKS */}
            <div className="mt-5 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm">

              <h3 className="text-sm font-bold">
                Trainer Quick Links
              </h3>

              <div className="mt-4 space-y-2">

                <QuickLink
                  href="/dashboard/trainer/live-sessions"
                  label="Live Sessions"
                />

                <QuickLink
                  href="/dashboard/trainer/assignments"
                  label="Assignments & Quizzes"
                />

                <QuickLink
                  href="/dashboard/trainer/my-batches"
                  label="My Batches"
                />

                <QuickLink
                  href="/dashboard/trainer/profile"
                  label="My Profile"
                />

              </div>
            </div>

            {/* ASSESSMENT OVERVIEW */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <BookOpen
                    size={19}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#173B67]">
                    Assessment Overview
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {activeAssessments} active assessment
                    {activeAssessments === 1
                      ? ""
                      : "s"} are currently available in the trainer assessment area.
                  </p>
                </div>

              </div>

            </div>

          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
  description,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

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

          <div className="mt-1 text-[11px] text-slate-400">
            {description}
          </div>

        </div>

      </div>

    </div>
  );
}

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">

      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#173B67] transition hover:text-orange-500 sm:text-sm"
      >
        View All
        <ArrowRight size={14} />
      </Link>

    </div>
  );
}

function ScheduleCard({
  session,
}: {
  session: LiveSession;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 items-start gap-4">

          <div className="flex shrink-0 flex-col items-center rounded-lg bg-orange-50 px-3 py-2 text-orange-600">

            <span className="text-[11px] font-semibold">
              {formatTime(
                session.startAt
              )}
            </span>

            <span className="mt-1 text-[10px] text-orange-500">
              to
            </span>

            <span className="mt-1 text-[11px] font-semibold">
              {formatTime(
                session.endAt
              )}
            </span>

          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {session.title}
              </h3>

              {session.displayStatus ===
                "LIVE" && (
                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  LIVE
                </span>
              )}

              {session.displayStatus ===
                "UPCOMING" && (
                <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                  UPCOMING
                </span>
              )}

            </div>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">

              {session.course?.title ||
                "Course not available"}

              {typeof session.participantCount ===
                "number" &&
                ` · ${session.participantCount} participants`}

            </p>

          </div>

        </div>

        <div className="flex shrink-0 flex-wrap gap-2">

          <Link
            href="/dashboard/trainer/live-sessions"
            className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 sm:text-sm"
          >
            Open Session

            <ArrowRight
              size={14}
              className="ml-1.5"
            />
          </Link>

        </div>

      </div>

    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex min-h-[170px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="inline-flex items-center gap-2 text-sm text-slate-500">

        <Loader2
          size={18}
          className="animate-spin"
        />

        Loading dashboard...

      </div>

    </div>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#173B67]">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-orange-500"
    >
      <span>{label}</span>

      <ArrowRight size={15} />
    </Link>
  );
}