import { BookOpen, PlayCircle } from "lucide-react";

const COURSES = [
  { title: "Full Stack Web Development", progress: 72, batch: "BATCH-FS-08", nextLesson: "Express.js Middleware — Part 2" },
  { title: "PostgreSQL Advanced Queries", progress: 45, batch: "BATCH-FS-08", nextLesson: "Joins & Subqueries" },
  { title: "React Hooks Deep Dive", progress: 90, batch: "BATCH-FS-08", nextLesson: "Custom Hooks" },
  { title: "Spring Boot REST APIs", progress: 20, batch: "BATCH-JAVA-06", nextLesson: "Controller Basics" },
];

export default function MyCoursesPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        My Courses
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Courses you're currently enrolled in.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {COURSES.map((c) => (
          <div
            key={c.title}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "20px 22px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#EAF0FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={19} color="#3B6BF0" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: "#6B7280" }}>{c.batch}</div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#6B7280", marginBottom: 4 }}>
                <span>Progress</span>
                <span>{c.progress}%</span>
              </div>
              <div style={{ height: 6, background: "#F1F2F5", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${c.progress}%`, background: "#3B6BF0", borderRadius: 4 }} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: "#6B7280" }}>Next: {c.nextLesson}</span>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "none",
                  background: "#2F6BFF",
                  color: "#fff",
                  borderRadius: 7,
                  padding: "6px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <PlayCircle size={14} /> Continue
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
