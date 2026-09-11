"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown, User, LogOut, Settings } from "lucide-react";

export default function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Replace with real user data (from context / API) once auth is wired up.
  const user = { name: "C. Neelima", avatarUrl: "" };
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("skce_token");
    window.location.href = "/login";
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {initials}
          </span>
          <span className="text-sm font-semibold text-slate-800">{user.name}</span>
          <ChevronDown size={15} className="text-slate-400" />
        </button>

        {menuOpen && (
          <div
            onMouseLeave={() => setMenuOpen(false)}
            className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-lg"
          >
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <User size={15} /> Profile
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings size={15} /> Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
