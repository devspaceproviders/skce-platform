"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  BookOpen,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  Award,
  User,
  MessageCircle,
  ChevronDown,
  LogOut,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  {
    href: "/dashboard/student",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/dashboard/student/my-courses",
    label: "My Courses",
    icon: BookOpen,
  },
  {
    href: "/dashboard/student/assignments",
    label: "Assignments & Quizzes",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/student/calendar",
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/student/community",
    label: "Community",
    icon: MessageCircle,
  },
  {
    href: "/dashboard/student/progress",
    label: "My Progress",
    icon: TrendingUp,
  },
  {
    href: "/dashboard/student/certificates",
    label: "Certificates",
    icon: Award,
  },
  {
    href: "/dashboard/student/profile",
    label: "Profile",
    icon: User,
  },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("student");
    localStorage.removeItem("studentId");

    router.push("/login");
  };

  return (
    <aside
      style={{
        width: 240,
        background: "#0E1526",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Logo / Institute Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 6px 20px",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#2F6BFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BookOpen size={16} color="#fff" />
        </div>

        <span
          style={{
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          SK Computer Education
        </span>
      </div>

      {/* Portal Selector */}
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1B2440",
          border: "none",
          borderRadius: 8,
          padding: "9px 12px",
          color: "#fff",
          fontSize: 13.5,
          marginBottom: 18,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#22C55E",
              display: "inline-block",
            }}
          />

          Student Portal
        </span>

        <ChevronDown size={14} />
      </button>

      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flex: 1,
        }}
      >
        {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard/student" &&
              pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13.5,
                textDecoration: "none",
                background: isActive
                  ? "#2F6BFF"
                  : "transparent",
                color: isActive
                  ? "#fff"
                  : "#AEB6CC",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Student Profile + Logout */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 14,
        }}
      >
        {/* Student Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#2F6BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ST
          </div>

          <div
            style={{
              lineHeight: 1.3,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Student Name
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: "#8992AC",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              student@skce.in
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium text-[#AEB6CC] transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={17} strokeWidth={1.9} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}