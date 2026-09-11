"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, GraduationCap } from "lucide-react";
import { SIDEBAR_LINKS } from "./sidebarLinks";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <aside className="flex h-full w-72 flex-col bg-brand-dark text-slate-300">
      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
          <GraduationCap size={18} />
        </span>
        <span className="text-lg font-bold text-white">SKCE</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {SIDEBAR_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          const hasChildren = !!link.children?.length;
          const isMenuOpen = openMenu === link.label;

          if (hasChildren) {
            return (
              <div key={link.label}>
                <button
                  type="button"
                  onClick={() => setOpenMenu(isMenuOpen ? null : link.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {link.label}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isMenuOpen && (
                  <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {link.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className="block rounded-md px-2 py-1.5 text-sm text-slate-400 transition hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
