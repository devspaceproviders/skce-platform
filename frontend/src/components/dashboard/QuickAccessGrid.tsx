import Link from "next/link";
import {
  BookOpen,
  LayoutGrid,
  Wallet,
  User,
  MonitorPlay,
  Megaphone,
  Users,
} from "lucide-react";

const TILES = [
  {
    href: "/dashboard/student/my-courses",
    label: "Access Your Training Courses",
    icon: BookOpen,
    bg: "#0F2A44",
  },
  {
    href: "/dashboard/student/associate",
    label: "Access Your Associate Panel",
    icon: LayoutGrid,
    bg: "#6D9E1F",
  },
  {
    href: "/dashboard/student/affiliate-marketing",
    label: "Affiliate Marketing",
    icon: Users,
    bg: "#7C3AED",
  },
  {
    href: "/dashboard/student/wallet",
    label: "Access Your Wallet",
    icon: Wallet,
    bg: "#1CA6D8",
  },
  {
    href: "/dashboard/student/profile",
    label: "Explore My Profile",
    icon: User,
    bg: "#E0592A",
  },
  {
    href: "/dashboard/student/live-sessions",
    label: "Internal Team Live Training",
    icon: MonitorPlay,
    bg: "#E0A11A",
  },
  {
    href: "/dashboard/student/community",
    label: "Our Community",
    icon: Megaphone,
    bg: "#2094C9",
  },
];

export default function QuickAccessGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        marginBottom: 32,
      }}
    >
      {TILES.map(({ href, label, icon: Icon, bg }) => (
        <Link
          key={href}
          href={href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            background: bg,
            borderRadius: 12,
            padding: "22px 28px",
            textDecoration: "none",
            minHeight: 96,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              size={24}
              color={bg}
              strokeWidth={2}
            />
          </div>

          <span
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}