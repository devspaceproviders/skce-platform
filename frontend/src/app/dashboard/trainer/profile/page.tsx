export default function TrainerProfilePage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Profile
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Your trainer account details.
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "28px 30px",
          maxWidth: 480,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#1BAA5E",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            RK
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Rajesh Kumar</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>trainer@skce.in</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Specialization", value: "Full Stack Development" },
            { label: "Active batches", value: "3" },
            { label: "Joined", value: "12 Jan 2025" },
            { label: "Phone", value: "+91 98765 11111" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
              <span style={{ color: "#6B7280" }}>{row.label}</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>

        <button
          style={{
            marginTop: 24,
            border: "1px solid #E2E5EC",
            background: "#fff",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          Edit Profile
        </button>
      </div>
    </main>
  );
}
