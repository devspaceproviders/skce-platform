const ASSIGNMENTS = [
  { title: "Node.js CRUD API", type: "Assignment", batch: "BATCH-FS-08", due: "25 Aug 2026", status: "Not started" },
  { title: "React Mini Project", type: "Assignment", batch: "BATCH-FS-09", due: "30 Aug 2026", status: "In progress" },
  { title: "React Hooks Quiz", type: "Quiz", batch: "BATCH-FS-08", due: "Submitted", status: "Submitted" },
  { title: "SQL Joins Quiz", type: "Quiz", batch: "BATCH-FS-08", due: "Graded — 8/10", status: "Graded" },
];

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  "Not started": { bg: "#FDF3E3", fg: "#B4790E" },
  "In progress": { bg: "#EAF0FE", fg: "#3B6BF0" },
  Submitted: { bg: "#E9F9EF", fg: "#22A555" },
  Graded: { bg: "#F1EAFE", fg: "#8A3FEB" },
};

export default function AssignmentsPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Assignments & Quizzes
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Track what's due and what's already submitted.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ASSIGNMENTS.map((a) => {
          const style = STATUS_STYLES[a.status];
          return (
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
                <div style={{ fontSize: 12.5, color: "#6B7280" }}>
                  {a.type} · {a.batch} · {a.due}
                </div>
              </div>
              <span
                style={{
                  background: style.bg,
                  color: style.fg,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 6,
                }}
              >
                {a.status}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
