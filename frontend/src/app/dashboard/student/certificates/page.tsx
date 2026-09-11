import { Award, Download, Lock } from "lucide-react";

const CERTIFICATES = [
  { title: "React Hooks Deep Dive", earned: true, date: "18 Aug 2026" },
  { title: "PostgreSQL Fundamentals", earned: true, date: "02 Aug 2026" },
  { title: "Full Stack Web Development", earned: false, requirement: "Complete remaining 28% of course" },
  { title: "Spring Boot REST APIs", earned: false, requirement: "Complete remaining 80% of course" },
];

export default function CertificatesPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Certificates
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Certificates you've earned and ones still in progress.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {CERTIFICATES.map((c) => (
          <div
            key={c.title}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              opacity: c.earned ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: c.earned ? "#F1EAFE" : "#F1F2F5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {c.earned ? <Award size={20} color="#8A3FEB" /> : <Lock size={18} color="#9CA3AF" />}
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: "#6B7280" }}>
                  {c.earned ? `Earned ${c.date}` : c.requirement}
                </div>
              </div>
            </div>

            {c.earned && (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #E2E5EC",
                  background: "#fff",
                  borderRadius: 7,
                  padding: "6px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <Download size={14} /> Download
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
