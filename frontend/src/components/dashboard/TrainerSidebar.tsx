"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { LayoutGrid, Layers, CalendarDays, ClipboardList, User, BookOpen, BriefcaseBusiness, MessageCircle } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const ROOT = "/dashboard/trainer";

const SIDEBAR_ITEMS: NavItem[] = [
  { href: `${ROOT}`, label: "Dashboard", icon: LayoutGrid },
  { href: `${ROOT}/my-batches`, label: "My Batches", icon: Layers },
  { href: `${ROOT}/calendar`, label: "Calendar", icon: CalendarDays },
  { href: `${ROOT}/course-content`, label: "Course Content", icon: BookOpen },
  { href: `${ROOT}/assignments`, label: "Assignments & Quizzes", icon: ClipboardList },
  { href: `${ROOT}/my-engagements`, label: "My Engagements", icon: BriefcaseBusiness },
  { href: `${ROOT}/community`, label: "Community", icon: MessageCircle },
  { href: `${ROOT}/profile`, label: "Profile", icon: User },
];

type SessionUser = { name?: string; email?: string };

const NAV_SCROLL =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 " +
  "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.22)_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-white/25";

const NAV_SHADOW = {
  background:
    "linear-gradient(#173B67 30%, rgba(23,59,103,0)) 0 0 / 100% 28px no-repeat local, " +
    "linear-gradient(rgba(23,59,103,0), #173B67 70%) 0 100% / 100% 28px no-repeat local, " +
    "radial-gradient(farthest-side at 50% 0, rgba(0,0,0,0.35), rgba(0,0,0,0)) 0 0 / 100% 10px no-repeat scroll, " +
    "radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,0.35), rgba(0,0,0,0)) 0 100% / 100% 10px no-repeat scroll",
} as const;

export default function TrainerSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw) as SessionUser);
    } catch {
      setUser(null);
    }
  }, []);

  const displayName = user?.name?.trim() || "Trainer";
  const displayEmail = user?.email?.trim() || "";
  const initials =
    displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "TR";

  const isActive = (href: string) =>
    href === ROOT ? pathname === ROOT : pathname === href || pathname.startsWith(`${href}/`);

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
      aria-label="Trainer navigation"
      className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col self-start overflow-hidden border-r border-white/5 bg-[#173B67] text-white"
    >
      {/* Brand — fixed */}
      <div className="shrink-0 border-b border-white/10 px-5 py-4">
        <Link href={ROOT} className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
            <Image src="/images/skce-logo.png" alt="SK Computer Education" width={40} height={40} className="h-full w-full object-contain" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-bold tracking-tight">SK Computer Education</span>
            <span className="mt-0.5 block text-[11px] font-medium text-blue-100/65">Trainer Portal</span>
          </span>
        </Link>
      </div>

      {/* Navigation — the ONLY scrolling area */}
      <nav aria-label="Trainer menu" className={NAV_SCROLL} style={NAV_SHADOW}>
        <div className="space-y-0.5">
          {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  active
                    ? "bg-orange-500 text-white shadow-md shadow-orange-950/25"
                    : "text-blue-50/75 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.9} className={`shrink-0 transition-colors ${active ? "text-white" : "text-blue-100/60 group-hover:text-orange-300"}`} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {active && <ChevronRight size={14} className="shrink-0 text-white/80" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile + Logout — fixed */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          href={`${ROOT}/profile`}
          className="flex items-center gap-3 rounded-xl px-2 py-2 outline-none transition hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">{initials}</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-semibold">{displayName}</span>
            {displayEmail && <span className="block truncate text-[11px] text-blue-100/60">{displayEmail}</span>}
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-blue-50/75 outline-none transition hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <LogOut size={17} strokeWidth={1.9} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
