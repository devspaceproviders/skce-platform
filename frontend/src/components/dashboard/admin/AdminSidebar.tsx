"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Package,
  UserCheck,
  ShieldCheck,
  Layers,
  ClipboardList,
  CalendarDays,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  UserCircle,
  MessageCircle,
  Megaphone,
  Star,
  Contact,
  type LucideIcon,
} from "lucide-react";

type MenuItem = { href: string; label: string; icon: LucideIcon };
type MenuSection = { label: string; items: MenuItem[] };

const ROOT = "/dashboard/admin";

const MENU_SECTIONS: MenuSection[] = [
  { label: "Main Menu", items: [{ href: ROOT, label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Students", items: [{ href: `${ROOT}/students`, label: "Students", icon: Users }] },
  {
    label: "Academic",
    items: [
      { href: `${ROOT}/courses`, label: "Courses", icon: BookOpen },
      { href: `${ROOT}/packages`, label: "Packages", icon: Package },
      { href: `${ROOT}/batches`, label: "Batches", icon: Layers },
      { href: `${ROOT}/assignments`, label: "Assignments & Quizzes", icon: ClipboardList },
      { href: `${ROOT}/calendar`, label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "People",
    items: [
      { href: `${ROOT}/trainers`, label: "All Trainers", icon: UserCheck },
      { href: `${ROOT}/trainer-permissions`, label: "Trainer Permissions", icon: ShieldCheck },
    ],
  },
  { label: "Finance", items: [{ href: `${ROOT}/payments`, label: "Payments", icon: CreditCard }] },
  { label: "Analytics", items: [{ href: `${ROOT}/reports`, label: "Reports", icon: BarChart3 }] },
  { label: "Contact", items: [{ href: `${ROOT}/contact`, label: "Contact", icon: Contact }] },
  {
    label: "System",
    items: [
      { href: `${ROOT}/settings`, label: "Settings", icon: Settings },
      { href: `${ROOT}/profile`, label: "Profile", icon: UserCircle },
      { href: `${ROOT}/homepage-popup`, label: "Homepage Popup", icon: Megaphone },
    ],
  },
  {
    label: "Community",
    items: [
      { href: `${ROOT}/community`, label: "Community", icon: MessageCircle },
      { href: `${ROOT}/feedback`, label: "Feedback", icon: Star },
    ],
  },
];

// Only this area scrolls. Thin scrollbar, contained wheel scrolling,
// and soft fade shadows at the top/bottom edges when content overflows.
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

export default function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const isActive = (href: string) =>
    href === ROOT ? pathname === ROOT : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    localStorage.removeItem("skce_admin_logged_in");
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  return (
    <aside
      aria-label="Admin navigation"
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
            <span className="mt-0.5 block text-[11px] font-medium text-blue-100/65">Admin Portal</span>
          </span>
        </Link>
      </div>

      {/* Profile — fixed */}
      <div className="shrink-0 px-3 pt-3">
        <Link
          href={`${ROOT}/profile`}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-2.5 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold">A</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-semibold">Administrator</span>
            <span className="block truncate text-[11px] text-blue-100/60">Admin Account</span>
          </span>
        </Link>
      </div>

      {/* Navigation — the ONLY scrolling area */}
      <nav aria-label="Admin menu" className={NAV_SCROLL} style={NAV_SHADOW}>
        <div className="space-y-6">
          {MENU_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-blue-100/45">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
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
            </div>
          ))}
        </div>
      </nav>

      {/* Footer — fixed */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-blue-50/75 outline-none transition hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <LogOut size={17} strokeWidth={1.9} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
