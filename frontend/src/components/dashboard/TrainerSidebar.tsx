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

const SIDEBAR_CSS = `
@keyframes skSbIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes skSbOrbit{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-8px,6px) scale(1.04)}}
@keyframes skSbPulse{0%,100%{opacity:.55}50%{opacity:1}}
.sk-sb-item{animation:skSbIn .45s cubic-bezier(.2,.7,.2,1) backwards}
.sk-sb-ring{animation:skSbOrbit 9s ease-in-out infinite}
.sk-sb-dot{animation:skSbPulse 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.sk-sb-item,.sk-sb-ring,.sk-sb-dot{animation:none}}
`;

const ASIDE_CLASS =
  "relative isolate sticky top-0 flex h-screen w-[260px] shrink-0 flex-col self-start overflow-hidden border-r border-white/10 " +
  "bg-[linear-gradient(172deg,#071C3A_0%,#0F2F5F_52%,#173B67_100%)] text-white shadow-[6px_0_24px_-12px_rgba(7,28,58,0.55)]";

const NAV_SCROLL =
  "relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 " +
  "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.22)_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-white/25";

const NAV_SHADOW = {
  background:
    "linear-gradient(#0B2547 20%, rgba(11,37,71,0)) 0 0 / 100% 24px no-repeat local, " +
    "linear-gradient(rgba(14,42,80,0), #0E2A50 80%) 0 100% / 100% 24px no-repeat local, " +
    "radial-gradient(farthest-side at 50% 0, rgba(0,0,0,0.3), rgba(0,0,0,0)) 0 0 / 100% 8px no-repeat scroll, " +
    "radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,0.3), rgba(0,0,0,0)) 0 100% / 100% 8px no-repeat scroll",
} as const;

const LINK_BASE =
  "sk-sb-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold outline-none " +
  "transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-300";
const LINK_ACTIVE =
  "bg-[linear-gradient(100deg,#F97316,#FB8A2E)] text-white shadow-[0_8px_18px_-8px_rgba(249,115,22,0.75)]";
const LINK_IDLE = "text-blue-50/80 hover:translate-x-0.5 hover:bg-white/[0.09] hover:text-white";

function SidebarDecor() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,#000,transparent_70%)]" />
      <div aria-hidden="true" className="sk-sb-ring pointer-events-none absolute -right-20 -top-24 -z-10 h-56 w-56 rounded-full border border-white/10 shadow-[0_0_0_22px_rgba(255,255,255,0.03),0_0_0_46px_rgba(255,255,255,0.02)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 -z-10 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" />
    </>
  );
}

function SidebarBrand({ href, portal }: { href: string; portal: string }) {
  return (
    <div className="relative shrink-0 px-4 pb-4 pt-5">
      <Link href={href} className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg shadow-black/25 ring-2 ring-orange-400/70">
          <Image src="/images/skce-logo.png" alt="SK Computer Education" width={44} height={44} className="h-full w-full object-contain" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[14px] font-bold text-white">SK Computer Education</span>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-orange-300/30 bg-orange-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-orange-200">
            <span className="sk-sb-dot h-1.5 w-1.5 rounded-full bg-orange-400" />
            {portal}
          </span>
        </span>
      </Link>
      <div aria-hidden="true" className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#F97316] via-[#F97316]/40 to-transparent" />
    </div>
  );
}

function SidebarLink({ href, label, Icon, active, index }: { href: string; label: string; Icon: LucideIcon; active: boolean; index: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}
      className={`${LINK_BASE} ${active ? LINK_ACTIVE : LINK_IDLE}`}
    >
      {active && <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />}
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? "bg-white/20" : "bg-white/[0.06] group-hover:bg-orange-500/20"}`}>
        <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={active ? "text-white" : "text-blue-100/75 group-hover:text-orange-300"} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && <ChevronRight size={15} className="shrink-0 text-white/90" />}
    </Link>
  );
}

function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-blue-50/80 outline-none transition hover:bg-red-500/15 hover:text-red-200 focus-visible:ring-2 focus-visible:ring-red-300"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-red-500/20">
        <LogOut size={16} strokeWidth={1.9} />
      </span>
      <span>Logout</span>
    </button>
  );
}

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
    <aside aria-label="Trainer navigation" className={ASIDE_CLASS}>
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />
      <SidebarDecor />
      <SidebarBrand href={ROOT} portal="Trainer Portal" />

      <nav aria-label="Trainer menu" className={NAV_SCROLL} style={NAV_SHADOW}>
        <p className="px-3 pb-2 pt-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-blue-100/45">Menu</p>
        <div className="space-y-1">
          {SIDEBAR_ITEMS.map(({ href, label, icon }, index) => (
            <SidebarLink key={href} href={href} label={label} Icon={icon} active={isActive(href)} index={index} />
          ))}
        </div>
      </nav>

      <div className="relative shrink-0 border-t border-white/10 bg-[#071C3A]/40 p-3 backdrop-blur-sm">
        <Link
          href={`${ROOT}/profile`}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-2.5 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F97316] to-[#FB8A2E] text-sm font-bold shadow-md shadow-orange-950/30 ring-2 ring-white/20">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F2F5F] bg-emerald-400" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-bold">{displayName}</span>
            {displayEmail && <span className="mt-0.5 block truncate text-[11px] text-blue-100/65">{displayEmail}</span>}
          </span>
        </Link>
        <div className="mt-2">
          <LogoutButton onClick={handleLogout} />
        </div>
      </div>
    </aside>
  );
}
