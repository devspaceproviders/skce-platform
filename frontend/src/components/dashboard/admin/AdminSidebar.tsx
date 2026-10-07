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
  CalendarClock,
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
} from "lucide-react";

const MENU_SECTIONS = [
  {
    label: "Main Menu",
    items: [
      {
        href: "/dashboard/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Students",
    items: [
      {
        href: "/dashboard/admin/students",
        label: "Students",
        icon: Users,
      },
    ],
  },
  {
    label: "Academic",
    items: [
      {
        href: "/dashboard/admin/courses",
        label: "Courses",
        icon: BookOpen,
      },
      {
        href: "/dashboard/admin/packages",
        label: "Packages",
        icon: Package,
      },
      {
        href: "/dashboard/admin/batches",
        label: "Batches",
        icon: Layers,
      },
      {
        href: "/dashboard/admin/assignments",
        label: "Assignments & Quizzes",
        icon: ClipboardList,
      },
      {
        href: "/dashboard/admin/calendar",
        label: "Calendar",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/dashboard/admin/trainers",
        label: "All Trainers",
        icon: UserCheck,
      },
      {
        href: "/dashboard/admin/trainer-permissions",
        label: "Trainer Permissions",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        href: "/dashboard/admin/payments",
        label: "Payments",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        href: "/dashboard/admin/reports",
        label: "Reports",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Contact",
    items: [
      {
        href: "/dashboard/admin/contact",
        label: "contact",
        icon: Contact,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/dashboard/admin/settings",
        label: "Settings",
        icon: Settings,
      },
      {
        href: "/dashboard/admin/profile",
        label: "Profile",
        icon: UserCircle,
      },
      {
        href: "/dashboard/admin/homepage-popup",
        label: "Homepage Popup",
        icon: Megaphone,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("skce_admin_logged_in");
    localStorage.removeItem("token");

    router.push("/admin/login");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[270px] shrink-0 flex-col overflow-hidden bg-[#173B67] text-white">
      {/* BRAND HEADER */}
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
            <Image
              src="/images/skce-logo.png"
              alt="SK Computer Education"
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-bold tracking-tight">
              SKCE Admin
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-blue-100/70">
              Administration Portal
            </p>
          </div>
        </Link>
      </div>

      {/* ADMIN PROFILE */}
      <Link
        href="/dashboard/admin/profile"
        className="mx-4 mt-4 block rounded-xl border border-white/10 bg-white/[0.06] p-3 transition hover:bg-white/[0.10]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            A
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              Administrator
            </p>
            <p className="truncate text-[11px] text-blue-100/65">
              Admin Account
            </p>
          </div>
        </div>
      </Link>

      {/* NAVIGATION */}
      <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-5">
          {MENU_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/45">
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    item.href === "/dashboard/admin"
                      ? pathname === "/dashboard/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-orange-500 text-white shadow-md shadow-orange-950/20"
                          : "text-blue-50/80 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.3 : 1.9}
                        className={
                          isActive
                            ? "text-white"
                            : "text-blue-100/65 group-hover:text-orange-400"
                        }
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight
                          size={15}
                          className="text-white/80"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* COMMUNITY */}
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/45">
              Community
            </p>

            <Link
              href="/dashboard/admin/community"
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                pathname.startsWith("/dashboard/admin/community")
                  ? "bg-orange-500 text-white shadow-md shadow-orange-950/20"
                  : "text-blue-50/80 hover:bg-white/[0.08] hover:text-white"
              }`}
            >

              <MessageCircle
                size={18}
                strokeWidth={
                  pathname.startsWith("/dashboard/admin/community")
                    ? 2.3
                    : 1.9
                }
                className={
                  pathname.startsWith("/dashboard/admin/community")
                    ? "text-white"
                    : "text-blue-100/65 group-hover:text-orange-400"
                }
              />

              <span className="flex-1">
                Community
              </span>

              {pathname.startsWith("/dashboard/admin/community") && (
                <ChevronRight
                  size={15}
                  className="text-white/80"
                />
              )}
            </Link>


                      <Link
            href="/dashboard/admin/feedback"
            className={`group mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
              pathname.startsWith("/dashboard/admin/feedback")
                ? "bg-orange-500 text-white shadow-md shadow-orange-950/20"
                : "text-blue-50/80 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <Star
              size={18}
              strokeWidth={
                pathname.startsWith("/dashboard/admin/feedback")
                  ? 2.3
                  : 1.9
              }
              className={
                pathname.startsWith("/dashboard/admin/feedback")
                  ? "text-white"
                  : "text-blue-100/65 group-hover:text-orange-400"
              }
            />

            <span className="flex-1">
              Feedback
            </span>

            {pathname.startsWith("/dashboard/admin/feedback") && (
              <ChevronRight
                size={15}
                className="text-white/80"
              />
            )}
          </Link>
          
          </div>
        </div>
      </nav>

      {/* BOTTOM SECTION */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-lg bg-orange-500/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-300">
            Admin Portal
          </p>
          <p className="mt-0.5 text-[11px] text-blue-100/60">
            Manage SKCE operations
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-blue-50/80 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut
            size={18}
            strokeWidth={1.9}
          />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
