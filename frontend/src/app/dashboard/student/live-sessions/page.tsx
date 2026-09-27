"use client";

import { useEffect, useState } from "react";

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
    day: "2-digit",
    month: "short",
    year: "numeric",
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
    hour12: false,
  }).format(date);
}

function formatTimeRange(
  startAt: string,
  endAt: string
) {
  return `${formatTime(startAt)}–${formatTime(endAt)}`;
}

function getTrainerName(session: LiveSession) {
  return session.trainer?.name || "Trainer";
}

function getButtonText(
  session: LiveSession
) {
  switch (session.displayStatus) {
    case "UPCOMING":
      return "Join →";

    case "LIVE":
      return "Join →";

    case "COMPLETED":
      return session.recordingUrl
        ? "Watch recording"
        : "Recording unavailable";

    case "CANCELLED":
      return "Cancelled";

    default:
      return "View";
  }
}

function getButtonStyle(
  status: DisplayStatus,
  disabled: boolean
) {
  if (
    status === "UPCOMING" ||
    status === "LIVE"
  ) {
    return {
      border: "none",
      background: disabled
        ? "#9CA3AF"
        : "#2F6BFF",
      color: "#fff",
      cursor: disabled
        ? "not-allowed"
        : "pointer",
    };
  }

  return {
    border: "1px solid #E2E5EC",
    background: "#fff",
    color: "#374151",
    cursor: disabled
      ? "not-allowed"
      : "pointer",
  };
}

function StatusBadge({
  status,
}: {
  status: DisplayStatus;
}) {
  if (status === "LIVE") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "#ECFDF5",
          color: "#047857",
          border: "1px solid #A7F3D0",
          borderRadius: 999,
          padding: "3px 8px",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10B981",
          }}
        />

        LIVE NOW
      </span>
    );
  }

  if (status === "UPCOMING") {
    return (
      <span
        style={{
          display: "inline-block",
          background: "#EFF6FF",
          color: "#2563EB",
          border: "1px solid #BFDBFE",
          borderRadius: 999,
          padding: "3px 8px",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        UPCOMING
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span
        style={{
          display: "inline-block",
          background: "#F3F4F6",
          color: "#6B7280",
          border: "1px solid #E5E7EB",
          borderRadius: 999,
          padding: "3px 8px",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        COMPLETED
      </span>
    );
  }

  return null;
}

export default function LiveSessionsPage() {
  const [sessions, setSessions] =
    useState<LiveSession[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [joiningId, setJoiningId] =
    useState<number | null>(null);

  async function loadSessions() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/live-sessions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
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

        throw new Error(
          "Your session has expired. Please login again."
        );
      }

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
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function handleJoin(
    session: LiveSession
  ) {
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
        throw new Error(
          "Authentication required. Please login again."
        );
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

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to join the live session."
        );
      }

      const meetingUrl =
        json?.data?.meetingUrl;

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

      await loadSessions();
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

  function handleRecording(
    session: LiveSession
  ) {
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

  function handleAction(
    session: LiveSession
  ) {
    if (
      session.displayStatus ===
        "UPCOMING" ||
      session.displayStatus ===
        "LIVE"
    ) {
      void handleJoin(session);
      return;
    }

    if (
      session.displayStatus ===
      "COMPLETED"
    ) {
      handleRecording(session);
    }
  }

  const liveSessions =
    sessions.filter(
      (session) =>
        session.displayStatus === "LIVE"
    );

  const upcomingSessions =
    sessions.filter(
      (session) =>
        session.displayStatus === "UPCOMING"
    );

  const completedSessions =
    sessions.filter(
      (session) =>
        session.displayStatus === "COMPLETED"
    );

  function renderSession(
    session: LiveSession
  ) {
    const isJoining =
      joiningId === session.id;

    const isJoinable =
      session.displayStatus ===
        "UPCOMING" ||
      session.displayStatus === "LIVE";

    const isRecording =
      session.displayStatus ===
      "COMPLETED";

    const actionDisabled =
      isJoining ||
      (isJoinable &&
        !session.meetingUrl) ||
      (isRecording &&
        !session.recordingUrl);

    return (
      <div
        key={session.id}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          <StatusBadge
            status={session.displayStatus}
          />

          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {session.title}
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: "#6B7280",
            }}
          >
            {formatDate(
              session.startAt
            )}{" "}
            ·{" "}
            {formatTimeRange(
              session.startAt,
              session.endAt
            )}{" "}
            ·{" "}
            {getTrainerName(session)}
          </div>

          {session.course && (
            <div
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginTop: 3,
              }}
            >
              {session.course.title}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={actionDisabled}
          onClick={() =>
            handleAction(session)
          }
          style={{
            ...getButtonStyle(
              session.displayStatus,
              actionDisabled
            ),
            borderRadius: 7,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {isJoining
            ? "Joining..."
            : getButtonText(session)}
        </button>
      </div>
    );
  }

  function renderSection(
    title: string,
    sectionSessions: LiveSession[]
  ) {
    if (sectionSessions.length === 0) {
      return null;
    }

    return (
      <section
        style={{
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {sectionSessions.map(
            renderSession
          )}
        </div>
      </section>
    );
  }

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          margin: "0 0 4px",
        }}
      >
        Live Sessions
      </h1>

      <p
        style={{
          color: "#6B7280",
          fontSize: 14,
          margin: "0 0 24px",
        }}
      >
        Upcoming classes and recordings of
        past sessions.
      </p>

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "28px 18px",
            textAlign: "center",
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          Loading live sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "40px 18px",
            textAlign: "center",
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          No live sessions are scheduled
          for your courses.
        </div>
      ) : (
        <>
          {renderSection(
            "Live Now",
            liveSessions
          )}

          {renderSection(
            "Upcoming",
            upcomingSessions
          )}

          {renderSection(
            "Past Sessions",
            completedSessions
          )}
        </>
      )}
    </main>
  );
}