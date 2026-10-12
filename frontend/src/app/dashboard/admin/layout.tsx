"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock page scroll and support Escape while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 lg:flex">
      {/* Desktop navigation */}
      <aside className="hidden shrink-0 lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile / tablet navigation drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          drawerOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          tabIndex={drawerOpen ? 0 : -1}
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-[#102B4D]/60 backdrop-blur-[2px] transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute inset-y-0 left-0 transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar />
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => setDrawerOpen(false)}
            className="absolute -right-12 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#173B67] shadow-lg transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Branded mobile header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur lg:hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#173B67] via-[#E87916] to-[#E8A23A]" />
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#173B67] transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <Menu size={19} />
            </button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-white shadow-sm">
              <Image
                src="/images/skce-logo.png"
                alt="SK Computer Education logo"
                width={32}
                height={32}
                priority
                className="h-8 w-8 object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold tracking-tight text-[#173B67]">
                SK Computer Education
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">
                Admin Portal
              </p>
            </div>
            <span className="hidden h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)] sm:block" />
          </div>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
