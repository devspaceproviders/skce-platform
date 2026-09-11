import { Bell, BookOpen, Users, Clipboard, Calendar, CheckCircle2 } from "lucide-react";

const STATS = [
  { icon: BookOpen, value: 3, label: "Active Batches", bg: "#EAF0FE", fg: "#3B6BF0" },
  { icon: Users, value: 44, label: "Total Students", bg: "#E9F9EF", fg: "#22A555" },
  { icon: Clipboard, value: 7, label: "Pending Grading", bg: "#FDF3E3", fg: "#D98E1A" },
  { icon: Calendar, value: 2, label: "Today's Classes", bg: "#F1EAFE", fg: "#8A3FEB" },
];

const SCHEDULE = [
  {
    time: "10:00–12:00",
    title: "PostgreSQL Advanced Queries",
    meta: "BATCH-FS-08 · 18 students · Online",
  },
  {
    time: "18:00–20:00",
    title: "Spring Boot REST APIs",
    meta: "BATCH-JAVA-06 · 14 students · Offline",
  },
];

const GRADING = [
  { title: "Node.js CRUD API", meta: "BATCH-FS-08 · Due: 25 Aug 2026", count: 12 },
  { title: "Spring Boot REST Assignment", meta: "BATCH-JAVA-06 · Due: 28 Aug 2026", count: 8 },
  { title: "React Mini Project", meta: "BATCH-FS-09 · Due: 30 Aug 2026", count: 5 },
];

const ACTIVITY = [
  { title: "Marked attendance", meta: "BATCH-FS-08 — 16/18 present", time: "Yesterday, 12:05 PM" },
  { title: "Uploaded lecture", meta: "Express.js Middleware — Part 2 (BATCH-FS-08)", time: "Yesterday, 2:30 PM" },
  { title: "Created assignment", meta: "Node.js CRUD API — due 25 Aug (BATCH-FS-08)", time: "2 days ago" },
  { title: "Graded quiz", meta: "React Hooks Quiz — 12 submissions reviewed (BATCH-FS-08)", time: "3 days ago" },
];

export default function TrainerDashboardPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#111827" }}>
            Good morning, Rajesh! 👋
          </h1>
          <p style={{ color: "#6B7280", fontSize: 14, margin: "4px 0 0" }}>
            You have 2 classes today and 7 submissions to grade.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#6B7280", fontSize: 13.5 }}>
          <Bell size={18} />
          <span>← Public Site</span>
        </div>
      </div>

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
            Today's Schedule — 22 Aug 2026
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      border: "1px solid #E2E5EC",
                      background: "#fff",
                      borderRadius: 7,
                      padding: "7px 14px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    Mark Attendance
                  </button>
                  <button
                    style={{
                      border: "none",
                      background: "#16A34A",
                      borderRadius: 7,
                      padding: "7px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Start Class →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Grading */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
            Pending Grading
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {GRADING.map((g) => (
              <div
                key={g.title}
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
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{g.title}</div>
                  <div style={{ fontSize: 12.5, color: "#6B7280" }}>{g.meta}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      background: "#FDF3E3",
                      color: "#B4790E",
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {g.count} submissions
                  </span>
                  <a href="#" style={{ color: "#16A34A", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Grade →
                  </a>
                </div>
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
                <CheckCircle2 size={17} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
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
