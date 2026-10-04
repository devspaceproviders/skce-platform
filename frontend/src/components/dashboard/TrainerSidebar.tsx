"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Layers,
  CalendarDays,
  ClipboardList,
  User,
  BookOpen,
  BriefcaseBusiness,
  MessageCircle,
  ChevronDown,
  LogOut,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  {
    href: "/dashboard/trainer",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/dashboard/trainer/my-batches",
    label: "My Batches",
    icon: Layers,
  },
  {
    href: "/dashboard/trainer/calendar",
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/trainer/course-content",
    label: "Course Content",
    icon: BookOpen,
  },
  {
    href: "/dashboard/trainer/assignments",
    label: "Assignments & Quizzes",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/trainer/my-engagements",
    label: "My Engagements",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/trainer/community",
    label: "Community",
    icon: MessageCircle,
  },
  {
    href: "/dashboard/trainer/profile",
    label: "Profile",
    icon: User,
  },
];

type TrainerUser = {
  name?: string;
  email?: string;
};

export default function TrainerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] =
    useState<TrainerUser | null>(null);

  useEffect(() => {
    const rawUser =
      localStorage.getItem("user");

    if (!rawUser) {
      return;
    }

    try {
      setUser(
        JSON.parse(rawUser) as TrainerUser
      );
    } catch {
      setUser(null);
    }
  }, []);

  const displayName =
    user?.name?.trim() ||
    "Trainer";

  const displayEmail =
    user?.email?.trim() ||
    "";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .join("") || "T";

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
            flexShrink: 0,
          }}
        >
          <BookOpen
            size={16}
            color="#fff"
          />
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

          Trainer Portal
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
        {SIDEBAR_ITEMS.map(
          ({
            href,
            label,
            icon: Icon,
          }) => {
            const isActive =
              pathname === href ||
              (href !==
                "/dashboard/trainer" &&
                pathname.startsWith(
                  `${href}/`
                ));

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
                    ? "#1BAA5E"
                    : "transparent",
                  color: isActive
                    ? "#fff"
                    : "#AEB6CC",
                  fontWeight: isActive
                    ? 600
                    : 500,
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={1.8}
                />

                {label}
              </Link>
            );
          }
        )}
      </nav>

      {/* Trainer Profile + Logout */}
      <div
        style={{
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          paddingTop: 14,
        }}
      >
        {/* Trainer Profile */}
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
              background: "#1BAA5E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
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
              {displayName}
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
              {displayEmail}
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