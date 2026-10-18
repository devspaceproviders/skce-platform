"use client";

import type { ElementType, ReactNode } from "react";

/*
 * Shared admin page building blocks (SKCE navy + orange).
 *
 *  - AdminPageShell   : page background, gutters, max width and vertical rhythm
 *  - AdminPageHeader  : the standard banner. Height follows its content (no
 *                       fixed height), it never exceeds the content width, and
 *                       actions wrap under the title on small screens.
 *  - ADMIN_BTN_*      : button class strings made for the navy banner
 *
 * Exports are unchanged: AdminPageHeader, AdminPageShell, ADMIN_BTN_PRIMARY,
 * ADMIN_BTN_GHOST, ADMIN_BTN_LIGHT, and the AdminHeaderChip type.
 */

export const ADMIN_BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#F97316] px-4 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(249,115,22,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2F5F] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const ADMIN_BTN_GHOST =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const ADMIN_BTN_LIGHT =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/30 bg-white px-4 text-sm font-bold text-[#0F2F5F] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export function AdminPageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className={`mx-auto w-full max-w-[1680px] space-y-6 ${className}`}>
        {children}
      </div>
    </main>
  );
}

export type AdminHeaderChip = { label: string; value?: ReactNode };

export function AdminPageHeader({
  label = "Administration Portal",
  title,
  subtitle,
  icon: Icon,
  chips,
  actions,
  className = "",
}: {
  label?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ElementType;
  chips?: AdminHeaderChip[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`admin-banner relative isolate w-full max-w-full overflow-hidden rounded-3xl border-b-[3px] border-[#F97316] bg-[linear-gradient(118deg,#071C3A_0%,#0F2F5F_48%,#1B4B82_100%)] px-5 py-4 text-white shadow-[0_12px_26px_-14px_rgba(15,47,95,0.45)] sm:px-6 lg:px-7 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,transparent,#000_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-24 -z-10 h-64 w-64 rounded-full border border-white/10 shadow-[0_0_0_26px_rgba(255,255,255,0.03),0_0_0_54px_rgba(255,255,255,0.02)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-1/3 -z-10 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          {Icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-orange-300 shadow-inner">
              <Icon size={22} aria-hidden="true" />
            </span>
          ) : null}

          <div className="min-w-0">
            <p className="mb-0.5 break-words text-[10.5px] font-bold uppercase tracking-[0.16em] text-orange-300">
              {label}
            </p>
            <h1 className="break-words text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-3xl text-[13px] leading-5 text-blue-100/90">
                {subtitle}
              </p>
            ) : null}

            {chips && chips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((chip, index) => (
                  <span
                    key={`${chip.label}-${index}`}
                    className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] text-blue-50"
                  >
                    {chip.label}
                    {chip.value !== undefined ? (
                      <strong className="ml-1.5 font-bold text-white">
                        {chip.value}
                      </strong>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}


export type PortalStatTone = "orange" | "blue" | "green" | "navy" | "red" | "amber";

const STAT_TONES: Record<PortalStatTone, string> = {
  orange: "bg-orange-50 text-orange-600 ring-orange-100",
  blue: "bg-blue-50 text-[#1459B8] ring-blue-100",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  navy: "bg-slate-100 text-[#173B67] ring-slate-200",
  red: "bg-rose-50 text-rose-600 ring-rose-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
};

/*
 * One stat tile for every portal (Student, Trainer, Admin): icon tile, small
 * label, prominent value, optional helper and footnote. Keeps statistics
 * identical in size, weight and spacing on every page.
 */
export function PortalStatCard({
  icon,
  label,
  value,
  helper,
  footnote,
  tone = "orange",
  loading = false,
  index = 0,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  footnote?: ReactNode;
  tone?: PortalStatTone;
  loading?: boolean;
  index?: number;
}) {
  return (
    <div
      className="skce-rise group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition duration-200 group-hover:scale-105 ${STAT_TONES[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight text-slate-500">
            {label}
          </p>
          {loading ? (
            <div className="mt-1.5 h-7 w-14 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <p className="mt-0.5 text-2xl font-bold leading-tight tracking-tight text-[#0F2F5F]">
              {value}
            </p>
          )}
          {helper ? (
            <p className="mt-0.5 truncate text-xs leading-snug text-slate-500">
              {helper}
            </p>
          ) : null}
        </div>
      </div>
      {footnote ? (
        <p className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 text-xs font-semibold text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
