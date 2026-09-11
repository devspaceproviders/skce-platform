import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { ChevronDown } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FA" }}>
      <StudentSidebar />

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
            Full Stack Development <ChevronDown size={14} />
          </span>
        </header>

        {children}
      </div>
    </div>
  );
}
