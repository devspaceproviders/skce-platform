"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";
import AdminVisualEffects from "@/components/dashboard/AdminVisualEffects";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock page scroll + allow Esc while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="skce-admin flex min-h-screen bg-[#F4F7FB]">
      <AdminVisualEffects />
      {/* Desktop sidebar: stays put while the page scrolls */}
      <div className="hidden shrink-0 lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile / tablet drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={drawerOpen ? 0 : -1}
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${
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
            aria-label="Close menu"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => setDrawerOpen(false)}
            className="absolute -right-12 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#173B67] shadow-lg"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#173B67] transition hover:bg-slate-50"
          >
            <Menu size={18} />
          </button>
          <Image
            src="/images/skce-logo.png"
            alt="SK Computer Education"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="truncate text-sm font-bold text-[#173B67]">
            SK Computer Education
          </span>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
