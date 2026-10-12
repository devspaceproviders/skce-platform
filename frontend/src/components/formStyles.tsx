/**
 * Shared class names for forms, buttons and alerts.
 * Keeping them in one place guarantees every page looks identical.
 * (Lives in /components so Tailwind always scans it.)
 */

const FIELD_BASE =
  "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const INPUT_CLASS = `${FIELD_BASE} h-12`;

export const INPUT_ERROR_CLASS =
  "border-red-300 bg-red-50 text-red-800 focus:border-red-500 focus:ring-red-100";

export const TEXTAREA_CLASS = `${FIELD_BASE} resize-none py-3`;

export const SELECT_CLASS = `${FIELD_BASE} h-12 appearance-none pr-10`;

export const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-[#173B67]";

const BTN_BASE =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const BTN_PRIMARY = `${BTN_BASE} bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 focus-visible:ring-orange-300`;

export const BTN_NAVY = `${BTN_BASE} bg-[#173B67] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#0F2F5F] hover:shadow-md focus-visible:ring-blue-300`;

export const BTN_OUTLINE = `${BTN_BASE} border border-[#173B67] bg-white text-[#173B67] hover:-translate-y-0.5 hover:bg-[#173B67] hover:text-white hover:shadow-md focus-visible:ring-blue-300`;

export const BTN_GHOST = `${BTN_BASE} border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus-visible:ring-orange-300`;

export const ALERT_ERROR =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700";

export const ALERT_SUCCESS =
  "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700";

export const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,47,95,0.04)]";

export const TEXT_LINK =
  "font-semibold text-orange-500 underline-offset-4 transition-colors duration-200 hover:text-orange-600 hover:underline";

export const BACK_LINK =
  "group inline-flex items-center gap-2 text-sm font-semibold text-[#173B67] transition-colors duration-200 hover:text-orange-500";
