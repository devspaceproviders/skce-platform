import TrainerSidebar from "@/components/dashboard/TrainerSidebar";
import { ChevronDown } from "lucide-react";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FA" }}>
      <TrainerSidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            background: "#12172B",
            color: "#fff",
            padding: "10px 24px",
            display: "flex",
            justifyContent: "center",
            position: "relative",
            fontSize: 14,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            Application Development <ChevronDown size={14} />
          </span>
          <span
            style={{
              position: "absolute",
              right: 24,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <button
              style={{
                background: "#4B5EF5",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Share
            </button>
          </span>
        </header>

        {children}
      </div>
    </div>
  );
}
