const STUDENTS = [
  { name: "Ananya Reddy", batch: "BATCH-FS-08", progress: 88, attendance: "96%" },
  { name: "Vikram Rao", batch: "BATCH-FS-08", progress: 62, attendance: "84%" },
  { name: "Sneha Patil", batch: "BATCH-FS-08", progress: 74, attendance: "92%" },
  { name: "Karthik Iyer", batch: "BATCH-JAVA-06", progress: 45, attendance: "78%" },
  { name: "Meera Nair", batch: "BATCH-JAVA-06", progress: 91, attendance: "98%" },
];

export default function StudentProgressPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Student Progress
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Course completion and attendance across your batches.
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.2fr 1.6fr 0.8fr",
            padding: "12px 20px",
            fontSize: 12,
            fontWeight: 600,
            color: "#6B7280",
            borderBottom: "1px solid #F1F2F5",
          }}
        >
          <span>Student</span>
          <span>Batch</span>
          <span>Progress</span>
          <span>Attendance</span>
        </div>

        {STUDENTS.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.2fr 1.6fr 0.8fr",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom: i < STUDENTS.length - 1 ? "1px solid #F1F2F5" : "none",
              fontSize: 13.5,
            }}
          >
            <span style={{ fontWeight: 600, color: "#111827" }}>{s.name}</span>
            <span style={{ color: "#6B7280" }}>{s.batch}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: "#F1F2F5", borderRadius: 4, overflow: "hidden", maxWidth: 120 }}>
                <div style={{ height: "100%", width: `${s.progress}%`, background: "#3B6BF0", borderRadius: 4 }} />
              </div>
              <span style={{ color: "#6B7280", fontSize: 12 }}>{s.progress}%</span>
            </span>
            <span style={{ color: "#22A555", fontWeight: 600 }}>{s.attendance}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
