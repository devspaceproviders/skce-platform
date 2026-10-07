import StudentSidebar from "@/components/dashboard/StudentSidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F7F9FC",
        color: "#0F2F5F",
      }}
    >
      <StudentSidebar />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
