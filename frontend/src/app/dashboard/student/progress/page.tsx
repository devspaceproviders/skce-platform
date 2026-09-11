const COURSE_PROGRESS = [
  { title: "Full Stack Web Development", progress: 72 },
  { title: "PostgreSQL Advanced Queries", progress: 45 },
  { title: "React Hooks Deep Dive", progress: 90 },
  { title: "Spring Boot REST APIs", progress: 20 },
];

const MILESTONES = [
  { label: "Lessons completed", value: "38 / 52" },
  { label: "Assignments submitted", value: "9 / 12" },
  { label: "Quizzes attempted", value: "6 / 6" },
  { label: "Attendance rate", value: "94%" },
];

export default function ProgressPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        My Progress
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        How you're doing across all enrolled courses.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {MILESTONES.map((m) => (
          <div
            key={m.label}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "18px 20px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{m.value}</div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
        Course Completion
      </h2>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "20px 22px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {COURSE_PROGRESS.map((c) => (
          <div key={c.title}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "#111827" }}>{c.title}</span>
              <span style={{ color: "#6B7280" }}>{c.progress}%</span>
            </div>
            <div style={{ height: 8, background: "#F1F2F5", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${c.progress}%`, background: "#3B6BF0", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
