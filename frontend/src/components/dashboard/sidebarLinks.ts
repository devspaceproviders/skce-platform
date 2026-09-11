import {
  LayoutDashboard,
  User,
  BookOpen,
  Settings,
  Users,
  Wallet,
  UserPlus,
  Trophy,
  Award,
  Share2,
  GraduationCap,
  Medal,
  Video,
  LifeBuoy,
  LucideIcon,
} from "lucide-react";

export interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: { label: string; href: string }[];
}

export const SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
  { label: "Advanced Courses", href: "/dashboard/advanced-courses", icon: Settings },
  { label: "Associate Panel", href: "/dashboard/associate-panel", icon: Users },
  {
    label: "Earnings Tracker",
    href: "/dashboard/earnings",
    icon: Wallet,
    children: [
      { label: "Overview", href: "/dashboard/earnings" },
      { label: "Payout History", href: "/dashboard/earnings/payouts" },
    ],
  },
  { label: "My Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Referrals", href: "/dashboard/referrals", icon: UserPlus },
  { label: "Achievers Board", href: "/dashboard/achievers", icon: Trophy },
  {
    label: "Wall of Winners",
    href: "/dashboard/winners",
    icon: Award,
    children: [
      { label: "This Month", href: "/dashboard/winners/monthly" },
      { label: "All Time", href: "/dashboard/winners/all-time" },
    ],
  },
  { label: "Affiliate Marketing", href: "/dashboard/affiliate-marketing", icon: Share2 },
  { label: "Internal Trainings", href: "/dashboard/internal-trainings", icon: GraduationCap },
  { label: "Freelancing Winners", href: "/dashboard/freelancing-winners", icon: Medal },
  { label: "Live Sessions", href: "/dashboard/live-sessions", icon: Video },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
];
