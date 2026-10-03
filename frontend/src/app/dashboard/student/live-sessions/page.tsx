"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  PlayCircle,
  RefreshCw,
  Video,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  courseId: number;
  trainerId: number;
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
  displayStatus: DisplayStatus;
  isPublished: boolean;
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
  participation?: {
    id: number;
    joinedAt: string | null;
    leftAt: string | null;
    participated: boolean;
  };
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getDurationMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  const minutes = Math.round((end - start) / 60000);

  return minutes > 0 ? minutes : null;
}

function getTrainerName(session: LiveSession) {
  return session.trainer?.name || "Trainer";
}

function getStatusLabel(status: DisplayStatus) {
  switch (status) {
    case "LIVE":
      return "Live now";
    case "UPCOMING":
      return "Upcoming";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Session";
  }
}

function getActionLabel(session: LiveSession) {
  if (
    session.displayStatus === "UPCOMING" ||
    session.displayStatus === "LIVE"
  ) {
    return "Join session";
  }

  if (session.displayStatus === "COMPLETED") {
    return session.recordingUrl
      ? "Watch recording"
      : "Recording unavailable";
  }

  return "Cancelled";
}

export default function LiveSessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] =
    useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] =
    useState<number | null>(null);

  async function loadSessions(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/live-sessions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("student");
        localStorage.removeItem("studentId");

        router.push("/login");
        return;
      }

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to load live sessions."
        );
      }

      const data = Array.isArray(json.data)
        ? json.data
        : [];

      setSessions(data);
    } catch (err) {
      console.error(
        "Student live sessions load error:",
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

  async function handleJoin(session: LiveSession) {
    if (
      session.displayStatus !== "UPCOMING" &&
      session.displayStatus !== "LIVE"
    ) {
      return;
    }

    if (!session.meetingUrl) {
      setError(
        "A meeting link is not configured for this session."
      );
      return;
    }

    try {
      setJoiningId(session.id);
      setError("");

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/live-sessions/${session.id}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("student");
        localStorage.removeItem("studentId");

        router.push("/login");
        return;
      }

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to join the live session."
        );
      }

      const meetingUrl = json?.data?.meetingUrl;

      if (!meetingUrl) {
        throw new Error(
          "Meeting link is not available."
        );
      }

      window.open(
        meetingUrl,
        "_blank",
        "noopener,noreferrer"
      );

      await loadSessions(true);
    } catch (err) {
      console.error(
        "Join live session error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to join the live session."
      );
    } finally {
      setJoiningId(null);
    }
  }

  function handleRecording(session: LiveSession) {
    if (!session.recordingUrl) {
      setError(
        "Recording is not available for this session."
      );
      return;
    }

    window.open(
      session.recordingUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleAction(session: LiveSession) {
    if (
      session.displayStatus === "UPCOMING" ||
      session.displayStatus === "LIVE"
    ) {
      void handleJoin(session);
      return;
    }

    if (session.displayStatus === "COMPLETED") {
      handleRecording(session);
    }
  }

  const liveSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.displayStatus === "LIVE"
      ),
    [sessions]
  );

  const upcomingSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.displayStatus === "UPCOMING"
      ),
    [sessions]
  );

  const completedSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.displayStatus === "COMPLETED"
      ),
    [sessions]
  );

  const cancelledSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.displayStatus === "CANCELLED"
      ),
    [sessions]
  );

  const nextSession = useMemo(() => {
    if (liveSessions.length > 0) {
      return liveSessions[0];
    }

    return (
      [...upcomingSessions].sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime()
      )[0] ?? null
    );
  }, [liveSessions, upcomingSessions]);

  const attendedSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.participation?.participated
      ).length,
    [sessions]
  );

  const totalDurationMinutes = useMemo(
    () =>
      sessions.reduce((sum, session) => {
        const minutes = getDurationMinutes(
          session.startAt,
          session.endAt
        );

        return sum + (minutes ?? 0);
      }, 0),
    [sessions]
  );

  const actionDisabled = (session: LiveSession) =>
    joiningId === session.id ||
    (session.displayStatus !== "COMPLETED" &&
      (session.displayStatus === "CANCELLED" ||
        !session.meetingUrl)) ||
    (session.displayStatus === "COMPLETED" &&
      !session.recordingUrl);

  if (loading) {
    return (
      <>
        <main style={pageStyle}>
          <PageHeading
            onRefresh={() => loadSessions(true)}
            refreshing
          />

          <LoadingState />
        </main>

        <GlobalStyles />
      </>
    );
  }

  return (
    <>
      <main style={pageStyle}>
        <PageHeading
          onRefresh={() => loadSessions(true)}
          refreshing={refreshing}
        />

        {error ? (
          <div style={errorBannerStyle}>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              style={dismissErrorButtonStyle}
            >
              ×
            </button>
          </div>
        ) : null}

        {/* Summary */}
        <section
          className="skce-live-summary"
          style={summaryGridStyle}
        >
          <SummaryCard
            icon={Video}
            label="Live now"
            value={liveSessions.length}
            helper={
              liveSessions.length > 0
                ? "You can join now"
                : "No session live"
            }
            tone="rose"
          />

          <SummaryCard
            icon={CalendarDays}
            label="Upcoming"
            value={upcomingSessions.length}
            helper={
              upcomingSessions.length > 0
                ? "Scheduled sessions"
                : "Nothing scheduled"
            }
            tone="blue"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Attended"
            value={attendedSessions}
            helper="Sessions you joined"
            tone="green"
          />

          <SummaryCard
            icon={Clock3}
            label="Learning time"
            value={
              totalDurationMinutes >= 60
                ? `${Math.floor(
                    totalDurationMinutes / 60
                  )}h ${
                    totalDurationMinutes % 60
                  }m`
                : `${totalDurationMinutes}m`
            }
            helper="Scheduled session time"
            tone="purple"
          />
        </section>

        {/* Next session */}
        {nextSession ? (
          <section
            style={{
              ...featureCardStyle,
              ...(nextSession.displayStatus === "LIVE"
                ? liveFeatureCardStyle
                : {}),
            }}
          >
            <div style={featureDecorOneStyle} />
            <div style={featureDecorTwoStyle} />

            <div style={featureContentStyle}>
              <div style={featureLabelStyle}>
                {nextSession.displayStatus === "LIVE"
                  ? "LIVE RIGHT NOW"
                  : "NEXT SESSION"}
              </div>

              <h2 style={featureTitleStyle}>
                {nextSession.title}
              </h2>

              <div style={featureMetaRowStyle}>
                <span style={featureMetaItemStyle}>
                  <CalendarDays size={14} />
                  {formatDate(nextSession.startAt)}
                </span>

                <span style={featureMetaItemStyle}>
                  <Clock3 size={14} />
                  {formatTime(nextSession.startAt)} –{" "}
                  {formatTime(nextSession.endAt)}
                </span>

                <span style={featureMetaItemStyle}>
                  <Users size={14} />
                  {getTrainerName(nextSession)}
                </span>
              </div>

              {nextSession.course ? (
                <div style={featureCourseStyle}>
                  {nextSession.course.title}
                </div>
              ) : null}

              {nextSession.description ? (
                <p style={featureDescriptionStyle}>
                  {nextSession.description}
                </p>
              ) : null}
            </div>

            <div style={featureActionStyle}>
              <div style={featureDateBoxStyle}>
                <strong>
                  {formatShortDate(
                    nextSession.startAt
                  )}
                </strong>
                <span>
                  {formatTime(nextSession.startAt)}
                </span>
              </div>

              <button
                type="button"
                disabled={actionDisabled(nextSession)}
                onClick={() =>
                  handleAction(nextSession)
                }
                style={{
                  ...featureJoinButtonStyle,
                  opacity: actionDisabled(
                    nextSession
                  )
                    ? 0.55
                    : 1,
                  cursor: actionDisabled(
                    nextSession
                  )
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {joiningId === nextSession.id
                  ? "Joining..."
                  : getActionLabel(nextSession)}
                {nextSession.displayStatus ===
                  "COMPLETED" ? (
                  <PlayCircle size={16} />
                ) : (
                  <ExternalLink size={15} />
                )}
              </button>
            </div>
          </section>
        ) : null}

        {/* Live now */}
        {liveSessions.length > 0 ? (
          <SessionSection
            title="Live Now"
            subtitle="Sessions that are currently available"
            tone="live"
          >
            <div className="skce-live-card-grid">
              {liveSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  joiningId={joiningId}
                  actionDisabled={actionDisabled}
                  onAction={handleAction}
                />
              ))}
            </div>
          </SessionSection>
        ) : null}

        {/* Upcoming */}
        {upcomingSessions.length > 0 ? (
          <SessionSection
            title="Upcoming Sessions"
            subtitle="Your next scheduled learning sessions"
          >
            <div className="skce-live-card-grid">
              {upcomingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  joiningId={joiningId}
                  actionDisabled={actionDisabled}
                  onAction={handleAction}
                />
              ))}
            </div>
          </SessionSection>
        ) : null}

        {/* Past */}
        {completedSessions.length > 0 ? (
          <SessionSection
            title="Past Sessions"
            subtitle="Completed sessions and available recordings"
          >
            <div className="skce-live-card-grid">
              {completedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  joiningId={joiningId}
                  actionDisabled={actionDisabled}
                  onAction={handleAction}
                />
              ))}
            </div>
          </SessionSection>
        ) : null}

        {/* Cancelled */}
        {cancelledSessions.length > 0 ? (
          <SessionSection
            title="Cancelled Sessions"
            subtitle="Sessions that are no longer available"
          >
            <div className="skce-live-card-grid">
              {cancelledSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  joiningId={joiningId}
                  actionDisabled={actionDisabled}
                  onAction={handleAction}
                />
              ))}
            </div>
          </SessionSection>
        ) : null}

        {/* Empty */}
        {!sessions.length ? (
          <EmptyState />
        ) : null}
      </main>

      <GlobalStyles />
    </>
  );
}

function PageHeading({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div style={headingStyle}>
      <div>
        <div style={eyebrowStyle}>
          STUDENT LEARNING
        </div>

        <h1 style={titleStyle}>
          Live Sessions
        </h1>

        <p style={subtitleStyle}>
          Join your upcoming classes, see live sessions, and
          revisit completed sessions with recordings.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          ...refreshButtonStyle,
          opacity: refreshing ? 0.65 : 1,
        }}
      >
        <RefreshCw
          size={15}
          style={{
            animation: refreshing
              ? "studentLiveSpin 0.8s linear infinite"
              : undefined,
          }}
        />
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper: string;
  tone: "rose" | "blue" | "green" | "purple";
}) {
  const tones = {
    rose: {
      bg: "#f8e8ef",
      fg: "#a01441",
    },
    blue: {
      bg: "#eaf0ff",
      fg: "#316cf2",
    },
    green: {
      bg: "#eaf8f0",
      fg: "#18945a",
    },
    purple: {
      bg: "#f1eaff",
      fg: "#7a56d6",
    },
  };

  const colors = tones[tone];

  return (
    <div style={summaryCardStyle}>
      <div
        style={{
          ...summaryIconStyle,
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <Icon size={19} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={summaryLabelStyle}>
          {label}
        </div>

        <div style={summaryValueStyle}>
          {value}
        </div>

        <div style={summaryHelperStyle}>
          {helper}
        </div>
      </div>
    </div>
  );
}

function SessionSection({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  tone?: "live";
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={sectionHeaderStyle}>
        <div style={sectionHeaderLeftStyle}>
          <div
            style={{
              ...sectionIconStyle,
              ...(tone === "live"
                ? liveSectionIconStyle
                : {}),
            }}
          >
            <Video size={17} />
          </div>

          <div>
            <h2 style={sectionTitleStyle}>
              {title}
            </h2>

            <p style={sectionSubtitleStyle}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function SessionCard({
  session,
  joiningId,
  actionDisabled,
  onAction,
}: {
  session: LiveSession;
  joiningId: number | null;
  actionDisabled: (session: LiveSession) => boolean;
  onAction: (session: LiveSession) => void;
}) {
  const duration = getDurationMinutes(
    session.startAt,
    session.endAt
  );

  const isLive =
    session.displayStatus === "LIVE";
  const isUpcoming =
    session.displayStatus === "UPCOMING";
  const isCompleted =
    session.displayStatus === "COMPLETED";
  const disabled = actionDisabled(session);

  return (
    <article
      className="skce-live-session-card"
      style={{
        ...sessionCardStyle,
        borderColor: isLive
          ? "#b8ecd2"
          : "#e4e8ef",
      }}
    >
      <div style={sessionCardTopStyle}>
        <div
          style={{
            ...sessionStatusIconStyle,
            ...(isLive
              ? {
                  background: "#eaf8f0",
                  color: "#18945a",
                }
              : isCompleted
              ? {
                  background: "#f1f4f7",
                  color: "#7c8797",
                }
              : {
                  background: "#eaf0ff",
                  color: "#316cf2",
                }),
          }}
        >
          {isCompleted ? (
            <PlayCircle size={19} />
          ) : (
            <Video size={19} />
          )}
        </div>

        <StatusBadge
          status={session.displayStatus}
        />
      </div>

      <div style={sessionMainStyle}>
        <h3 style={sessionTitleStyle}>
          {session.title}
        </h3>

        <div style={sessionCourseStyle}>
          {session.course?.title ||
            "Course session"}
        </div>

        <div style={sessionMetaListStyle}>
          <span>
            <CalendarDays size={13} />
            {formatDate(session.startAt)}
          </span>

          <span>
            <Clock3 size={13} />
            {formatTime(session.startAt)} –{" "}
            {formatTime(session.endAt)}
            {duration
              ? ` · ${duration} min`
              : ""}
          </span>

          <span>
            <Users size={13} />
            {getTrainerName(session)}
          </span>
        </div>

        {session.description ? (
          <p style={sessionDescriptionStyle}>
            {session.description}
          </p>
        ) : null}
      </div>

      <div style={sessionFooterStyle}>
        {session.participation?.participated ? (
          <span style={attendedBadgeStyle}>
            <CheckCircle2 size={12} />
            Attended
          </span>
        ) : isUpcoming ? (
          <span style={sessionHintStyle}>
            Ready to join
          </span>
        ) : isLive ? (
          <span style={sessionLiveHintStyle}>
            Live session available
          </span>
        ) : isCompleted &&
          session.recordingUrl ? (
          <span style={sessionHintStyle}>
            Recording available
          </span>
        ) : (
          <span style={sessionHintStyle}>
            {getStatusLabel(
              session.displayStatus
            )}
          </span>
        )}

        <button
          type="button"
          onClick={() => onAction(session)}
          disabled={disabled}
          style={{
            ...sessionActionButtonStyle,
            ...(isLive
              ? liveActionButtonStyle
              : {}),
            ...(disabled
              ? disabledActionButtonStyle
              : {}),
          }}
        >
          {joiningId === session.id
            ? "Joining..."
            : getActionLabel(session)}

          {isCompleted ? (
            <PlayCircle size={14} />
          ) : (
            <ArrowRight size={14} />
          )}
        </button>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: DisplayStatus;
}) {
  if (status === "LIVE") {
    return (
      <span style={liveStatusBadgeStyle}>
        <span style={statusDotStyle} />
        LIVE NOW
      </span>
    );
  }

  if (status === "UPCOMING") {
    return (
      <span style={upcomingStatusBadgeStyle}>
        UPCOMING
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span style={completedStatusBadgeStyle}>
        COMPLETED
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span style={cancelledStatusBadgeStyle}>
        CANCELLED
      </span>
    );
  }

  return null;
}

function EmptyState() {
  return (
    <div style={emptyCardStyle}>
      <div style={emptyIconStyle}>
        <Video size={24} />
      </div>

      <h2 style={emptyTitleStyle}>
        No live sessions scheduled
      </h2>

      <p style={emptyTextStyle}>
        Live classes for your enrolled courses will appear
        here when they are published.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={loadingCardStyle}>
      <div style={loadingSpinnerStyle} />
      <strong style={loadingTitleStyle}>
        Loading your live sessions
      </strong>
      <span style={loadingTextStyle}>
        Fetching the latest schedule.
      </span>
    </div>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  flex: 1,
  boxSizing: "border-box",
  padding: "28px 32px 36px",
  background: "#f5f7fb",
};

const headingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 19,
};

const eyebrowStyle: CSSProperties = {
  marginBottom: 5,
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: "0.11em",
  color: "#a01441",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 27,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#111827",
};

const subtitleStyle: CSSProperties = {
  maxWidth: 720,
  margin: "6px 0 0",
  fontSize: 13,
  lineHeight: 1.6,
  color: "#818b9b",
};

const refreshButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  flex: "0 0 auto",
  border: "1px solid #d8dfe9",
  borderRadius: 9,
  padding: "9px 12px",
  background: "#ffffff",
  color: "#374151",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4,minmax(0,1fr))",
  gap: 13,
  marginBottom: 18,
};

const summaryCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
  padding: 16,
  border: "1px solid #e4e8ef",
  borderRadius: 15,
  background: "#ffffff",
  boxShadow:
    "0 4px 14px rgba(15,23,42,0.035)",
};

const summaryIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 42px",
  borderRadius: 12,
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 10.5,
  color: "#8b95a6",
};

const summaryValueStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 19,
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#111827",
};

const summaryHelperStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 9.5,
  color: "#9aa2af",
};

const featureCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "flex",
  justifyContent: "space-between",
  gap: 22,
  minHeight: 188,
  marginBottom: 19,
  padding: "24px 26px",
  border: "1px solid #dce5f5",
  borderRadius: 19,
  background:
    "linear-gradient(135deg,#112744 0%,#194679 63%,#2a66d9 100%)",
  color: "#ffffff",
  boxShadow:
    "0 12px 28px rgba(16,34,63,0.13)",
};

const liveFeatureCardStyle: CSSProperties = {
  borderColor: "#b6ebcd",
  background:
    "linear-gradient(135deg,#12352f 0%,#155448 60%,#168b67 100%)",
};

const featureDecorOneStyle: CSSProperties = {
  position: "absolute",
  width: 260,
  height: 260,
  top: -155,
  right: 20,
  borderRadius: "50%",
  background:
    "rgba(255,255,255,0.07)",
};

const featureDecorTwoStyle: CSSProperties = {
  position: "absolute",
  width: 150,
  height: 150,
  right: -40,
  bottom: -105,
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "50%",
};

const featureContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: 0,
  flex: 1,
};

const featureLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  marginBottom: 8,
  fontSize: 10,
  fontWeight: 850,
  letterSpacing: "0.1em",
  color: "#d7e8ff",
};

const featureTitleStyle: CSSProperties = {
  maxWidth: 720,
  margin: 0,
  fontSize: 24,
  lineHeight: 1.25,
  fontWeight: 800,
  letterSpacing: "-0.02em",
};

const featureMetaRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 15,
  marginTop: 13,
  fontSize: 11,
  color: "#d5e3f5",
};

const featureMetaItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

const featureCourseStyle: CSSProperties = {
  marginTop: 9,
  fontSize: 11,
  fontWeight: 700,
  color: "#ffffff",
};

const featureDescriptionStyle: CSSProperties = {
  maxWidth: 720,
  margin: "7px 0 0",
  fontSize: 11,
  lineHeight: 1.55,
  color: "#d6e3f5",
};

const featureActionStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 11,
  minWidth: 170,
};

const featureDateBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "7px 9px",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 9,
  background: "rgba(255,255,255,0.09)",
};

const featureJoinButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: 0,
  borderRadius: 9,
  padding: "10px 13px",
  background: "#ffffff",
  color: "#173f71",
  fontSize: 11,
  fontWeight: 850,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 11,
};

const sectionHeaderLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const sectionIconStyle: CSSProperties = {
  width: 37,
  height: 37,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  background: "#f8e8ef",
  color: "#a01441",
};

const liveSectionIconStyle: CSSProperties = {
  background: "#eaf8f0",
  color: "#18945a",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.25,
  fontWeight: 800,
  color: "#172033",
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 10.5,
  color: "#98a1af",
};

const sessionCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 255,
  padding: 17,
  borderRadius: 15,
  border: "1px solid #e4e8ef",
  background: "#ffffff",
  boxShadow:
    "0 4px 12px rgba(15,23,42,0.035)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease",
};

const sessionCardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const sessionStatusIconStyle: CSSProperties = {
  width: 39,
  height: 39,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 11,
};

const sessionMainStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
  marginTop: 14,
};

const sessionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.4,
  fontWeight: 800,
  color: "#1c2535",
  wordBreak: "break-word",
};

const sessionCourseStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10.5,
  color: "#8b95a5",
};

const sessionMetaListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  marginTop: 13,
  fontSize: 10.5,
  color: "#737f91",
};

const sessionDescriptionStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 10.5,
  lineHeight: 1.55,
  color: "#8a94a3",
};

const sessionFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  paddingTop: 13,
  marginTop: 15,
  borderTop: "1px solid #eef1f5",
};

const attendedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 10,
  fontWeight: 750,
  color: "#168452",
};

const sessionHintStyle: CSSProperties = {
  fontSize: 10,
  color: "#949dab",
};

const sessionLiveHintStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 750,
  color: "#168452",
};

const sessionActionButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  flex: "0 0 auto",
  border: "1px solid #dbe2ec",
  borderRadius: 8,
  padding: "7px 10px",
  background: "#ffffff",
  color: "#3b6bf0",
  fontSize: 10.5,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const liveActionButtonStyle: CSSProperties = {
  borderColor: "#b8e7ce",
  background: "#eaf8f0",
  color: "#168452",
};

const disabledActionButtonStyle: CSSProperties = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const liveStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 8px",
  borderRadius: 999,
  border: "1px solid #b9ebd0",
  background: "#eaf8f0",
  color: "#168452",
  fontSize: 9.5,
  fontWeight: 850,
};

const upcomingStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 8px",
  borderRadius: 999,
  border: "1px solid #c8d9fb",
  background: "#edf3ff",
  color: "#316cf2",
  fontSize: 9.5,
  fontWeight: 850,
};

const completedStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 8px",
  borderRadius: 999,
  border: "1px solid #e0e4ea",
  background: "#f3f5f7",
  color: "#788291",
  fontSize: 9.5,
  fontWeight: 850,
};

const cancelledStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 8px",
  borderRadius: 999,
  border: "1px solid #f2cccc",
  background: "#fff1f1",
  color: "#c54747",
  fontSize: 9.5,
  fontWeight: 850,
};

const statusDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#18a15e",
};

const emptyCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 270,
  padding: 30,
  border: "1px dashed #dce2eb",
  borderRadius: 17,
  background: "#fbfcfd",
  textAlign: "center",
};

const emptyIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 13,
  background: "#f0f3f7",
  color: "#909aaa",
};

const emptyTitleStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 15,
  fontWeight: 800,
  color: "#3a4453",
};

const emptyTextStyle: CSSProperties = {
  maxWidth: 420,
  margin: "5px 0 0",
  fontSize: 11,
  lineHeight: 1.55,
  color: "#969fad",
};

const errorBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 15,
  padding: "10px 12px",
  border: "1px solid #f2cccc",
  borderRadius: 10,
  background: "#fff4f4",
  color: "#bd3939",
  fontSize: 11,
};

const dismissErrorButtonStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#9f4242",
  fontSize: 19,
  lineHeight: 1,
  cursor: "pointer",
};

const loadingCardStyle: CSSProperties = {
  minHeight: 360,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: 35,
  border: "1px solid #e4e8ef",
  borderRadius: 18,
  background: "#ffffff",
  textAlign: "center",
};

const loadingSpinnerStyle: CSSProperties = {
  width: 30,
  height: 30,
  marginBottom: 7,
  border: "3px solid #e6ebf2",
  borderTopColor: "#2f6bff",
  borderRadius: "50%",
  animation:
    "studentLiveSpin 0.8s linear infinite",
};

const loadingTitleStyle: CSSProperties = {
  fontSize: 14,
  color: "#374151",
};

const loadingTextStyle: CSSProperties = {
  fontSize: 10.5,
  color: "#959eac",
};

function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .skce-live-session-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 9px 20px rgba(15,23,42,0.07);
          }

          .skce-live-card-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 13px;
          }

          .skce-live-session-card span svg {
            vertical-align: middle;
          }

          @keyframes studentLiveSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @media (max-width: 1200px) {
            .skce-live-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .skce-live-card-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 850px) {
            .skce-live-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .skce-live-card-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }

          @media (max-width: 650px) {
            .skce-live-summary {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }
        `,
      }}
    />
  );
}
