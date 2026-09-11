import { Bell, BookOpen, ClipboardList, Flame, Award, CheckCircle2 } from "lucide-react";
import QuickAccessGrid from "@/components/dashboard/QuickAccessGrid";

const STATS = [
  { icon: BookOpen, value: 4, label: "Enrolled Courses", bg: "#EAF0FE", fg: "#3B6BF0" },
  { icon: ClipboardList, value: 3, label: "Pending Assignments", bg: "#FDF3E3", fg: "#D98E1A" },
  { icon: Flame, value: 12, label: "Day Streak", bg: "#FDEAEA", fg: "#E0473F" },
  { icon: Award, value: 68, label: "Overall Progress %", bg: "#E9F9EF", fg: "#22A555" },
];

const SCHEDULE = [
  {
    time: "10:00–12:00",
    title: "PostgreSQL Advanced Queries",
    meta: "BATCH-FS-08 · Live · Trainer: Rajesh Kumar",
  },
  {
    time: "18:00–19:00",
    title: "React Hooks Deep Dive",
    meta: "BATCH-FS-08 · Recorded · Watch anytime",
  },
];

const ASSIGNMENTS = [
  { title: "Node.js CRUD API", meta: "Due 25 Aug 2026", status: "Not started" },
  { title: "React Mini Project", meta: "Due 30 Aug 2026", status: "In progress" },
  { title: "React Hooks Quiz", meta: "Submitted · Awaiting grade", status: "Submitted" },
];

const ACTIVITY = [
  { title: "Completed lecture", meta: "Express.js Middleware — Part 2", time: "Yesterday, 4:10 PM" },
  { title: "Submitted assignment", meta: "React Hooks Quiz", time: "2 days ago" },
  { title: "Joined live class", meta: "PostgreSQL Advanced Queries", time: "3 days ago" },
];

export default function StudentDashboardPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#111827" }}>
            Welcome back, Student! 👋
          </h1>
          <p style={{ color: "#6B7280", fontSize: 14, margin: "4px 0 0" }}>
            You have 1 live class today and 3 assignments pending.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#6B7280", fontSize: 13.5 }}>
          <Bell size={18} />
        </div>
      </div>

      {/* Quick access */}
      <QuickAccessGrid />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {STATS.map(({ icon: Icon, value, label, bg, fg }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={19} color={fg} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{value}</div>
              <div style={{ fontSize: 12.5, color: "#6B7280" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          {/* Schedule */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
            Today's Classes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {SCHEDULE.map((s) => (
              <div
                key={s.title}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span
                    style={{
                      background: "#EAF0FE",
                      color: "#3B6BF0",
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {s.time}
                  </span>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{s.title}</div>
                    <div style={{ fontSize: 12.5, color: "#6B7280" }}>{s.meta}</div>
                  </div>
                </div>
                <button
                  style={{
                    border: "none",
                    background: "#2F6BFF",
                    borderRadius: 7,
                    padding: "7px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Join →
                </button>
              </div>
            ))}
          </div>

          {/* Assignments */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
            Assignments & Quizzes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ASSIGNMENTS.map((a) => (
              <div
                key={a.title}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: "#6B7280" }}>{a.meta}</div>
                </div>
                <span
                  style={{
                    background: a.status === "Submitted" ? "#E9F9EF" : "#FDF3E3",
                    color: a.status === "Submitted" ? "#22A555" : "#B4790E",
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: 6,
                  }}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
            Recent Activity
          </h2>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "6px 18px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {ACTIVITY.map((a, i) => (
              <div
                key={a.title}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "14px 0",
                  borderBottom: i < ACTIVITY.length - 1 ? "1px solid #F1F2F5" : "none",
                }}
              >
                <CheckCircle2 size={17} color="#2F6BFF" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: "#6B7280", margin: "2px 0" }}>{a.meta}</div>
                  <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}