const SESSIONS = [
  { title: "PostgreSQL Advanced Queries", date: "22 Aug 2026", time: "10:00–12:00", trainer: "Rajesh Kumar", status: "upcoming" },
  { title: "Spring Boot REST APIs", date: "22 Aug 2026", time: "18:00–20:00", trainer: "Priya Sharma", status: "upcoming" },
  { title: "Express.js Middleware — Part 1", date: "20 Aug 2026", time: "10:00–12:00", trainer: "Rajesh Kumar", status: "recorded" },
  { title: "React Hooks Deep Dive", date: "18 Aug 2026", time: "18:00–19:00", trainer: "Rajesh Kumar", status: "recorded" },
];

export default function LiveSessionsPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Live Sessions
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Upcoming classes and recordings of past sessions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SESSIONS.map((s) => (
          <div
            key={s.title + s.date}
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
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{s.title}</div>
              <div style={{ fontSize: 12.5, color: "#6B7280" }}>
                {s.date} · {s.time} · {s.trainer}
              </div>
            </div>
            <button
              style={{
                border: s.status === "upcoming" ? "none" : "1px solid #E2E5EC",
                background: s.status === "upcoming" ? "#2F6BFF" : "#fff",
                color: s.status === "upcoming" ? "#fff" : "#374151",
                borderRadius: 7,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {s.status === "upcoming" ? "Join →" : "Watch recording"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
