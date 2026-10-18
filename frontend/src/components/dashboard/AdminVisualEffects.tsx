"use client";

import { useEffect } from "react";

/*
 * AdminVisualEffects
 * ------------------------------------------------------------------
 * One place for the SKCE admin look-and-feel that Tailwind classes on
 * individual pages cannot express:
 *
 *  - brand animations (page enter, banner orbit, card lift, row reveal)
 *  - SKCE colours for cards, tables, inputs, scrollbars and overlays
 *  - pop-up handling: overlays always cover the whole viewport, fade in,
 *    lock page scroll, focus the dialog and close with Esc
 *
 * It is mounted once by app/dashboard/admin/layout.tsx and may also be
 * mounted by individual pages (the style tag is de-duplicated).
 *
 * IMPORTANT: animations here end with `transform: none` and use
 * `backwards` fill. A lingering transform would turn the page into the
 * containing block of every `position: fixed` pop-up inside it, which is
 * what made modals appear in the wrong place.
 */

const OVERLAY =
  'div.fixed.inset-0[class*="bg-"]:not([class*="lg:hidden"]):not([class*="pointer-events-none"])';

function topOverlay(): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(OVERLAY);
  return all.length ? all[all.length - 1] : null;
}

export default function AdminVisualEffects() {
  useEffect(() => {
    // The layout and some pages both mount this component, so the scroll lock
    // is stored on <body> (idempotent) instead of in per-instance variables.
    const body = document.body;
    let hadOverlay = false;
    let frame = 0;

    const lock = () => {
      if (body.dataset.skceLock === "1") return;
      body.dataset.skceLock = "1";
      body.dataset.skcePrevOverflow = body.style.overflow;
      body.dataset.skcePrevPadding = body.style.paddingRight;
      const gap = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (gap > 0) body.style.paddingRight = `${gap}px`;
    };

    const unlock = () => {
      if (body.dataset.skceLock !== "1") return;
      body.style.overflow = body.dataset.skcePrevOverflow ?? "";
      body.style.paddingRight = body.dataset.skcePrevPadding ?? "";
      delete body.dataset.skceLock;
      delete body.dataset.skcePrevOverflow;
      delete body.dataset.skcePrevPadding;
    };

    const sync = () => {
      frame = 0;
      const overlay = topOverlay();

      if (overlay) lock();
      else unlock();

      // Move keyboard focus into a freshly opened dialog.
      if (overlay && !hadOverlay) {
        window.requestAnimationFrame(() => {
          if (!overlay.isConnected || overlay.contains(document.activeElement)) return;
          const target = overlay.querySelector<HTMLElement>(
            "[autofocus], input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
          );
          target?.focus({ preventScroll: true });
        });
      }
      hadOverlay = Boolean(overlay);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(body, { childList: true, subtree: true });
    schedule();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const flagged = event as KeyboardEvent & { __skceHandled?: boolean };
      if (flagged.__skceHandled) return; // another instance already handled it
      const overlay = topOverlay();
      if (!overlay) return;
      flagged.__skceHandled = true;

      const buttons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("button"));
      const closer = buttons.find((button) => {
        if (button.disabled) return false;
        const label = `${button.getAttribute("aria-label") ?? ""} ${button.textContent ?? ""}`
          .trim()
          .toLowerCase();
        return /\bclose\b|\bcancel\b|^(dismiss|back|no|not now)$/.test(label);
      });

      if (closer) {
        event.preventDefault();
        closer.click();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
      if (frame) window.cancelAnimationFrame(frame);
      if (!topOverlay()) unlock();
    };
  }, []);

  return (
    <style jsx global>{`
      :root {
        --skce-navy: #0f2f5f;
        --skce-navy-2: #173b67;
        --skce-blue: #1459b8;
        --skce-orange: #F97316;
        --skce-orange-2: #f97316;
        --skce-line: #d3deec;
        --skce-tint: #eef2f8;
        --skce-ink: #0e2748;
        --skce-text: #3a4c66;
        --skce-muted: #5a6b85;
      }

      @keyframes skceFadeUp {
        from { opacity: 0; transform: translate3d(0, 12px, 0); }
        to { opacity: 1; transform: none; }
      }
      @keyframes skceFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes skceModalIn {
        from { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.97); }
        to { opacity: 1; transform: none; }
      }
      @keyframes skceOrbit {
        0%, 100% { transform: scale(1); opacity: 0.45; }
        50% { transform: scale(1.035); opacity: 0.75; }
      }
      @keyframes skceFlow {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
      @keyframes skceRowIn {
        from { opacity: 0; transform: translate3d(0, 6px, 0); }
        to { opacity: 1; transform: none; }
      }
      @keyframes skceShimmer {
        0% { background-position: -600px 0; }
        100% { background-position: 600px 0; }
      }

      /* ---------- page + helpers ---------- */
      .skce-page-enter { animation: skceFadeUp 0.48s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
      .skce-rise { animation: skceFadeUp 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
      .skce-banner-orbit { animation: skceOrbit 8s ease-in-out infinite; transform-origin: center; }
      .skce-interactive-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }
      .skce-interactive-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(23, 59, 103, 0.12);
        border-color: rgba(249, 115, 22, 0.35);
      }

      /* ---------- shell: no flat grey page ---------- */
      .skce-admin {
        background-color: var(--skce-tint);
        background-image:
          radial-gradient(900px 380px at 100% -8%, rgba(249, 115, 22, 0.07), transparent 62%),
          radial-gradient(900px 460px at -8% 0%, rgba(23, 59, 103, 0.08), transparent 62%);
        background-attachment: fixed;
      }
      .skce-admin :is(main, div)[class*="min-h-screen"][class*="bg-["],
      .skce-admin :is(main, div)[class*="min-h-screen"][class*="bg-slate-50"] {
        background-color: transparent;
      }

      /* ---------- banner ---------- */
      .skce-admin .admin-banner {
        background-size: 220% 220%;
        animation: skceFadeUp 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) backwards,
          skceFlow 16s ease-in-out infinite alternate;
      }
      .skce-admin .admin-banner > div[aria-hidden="true"]:nth-of-type(2) {
        animation: skceOrbit 9s ease-in-out infinite;
      }

      /* ---------- cards: SKCE tinted, never flat white ---------- */
      .skce-admin :is(div, section, article, aside, form).bg-white:is(
          [class*="rounded-xl"],
          [class*="rounded-2xl"],
          [class*="rounded-3xl"],
          [class*="rounded-[2"]
        ):not(.fixed *) {
        background-image: linear-gradient(180deg, #ffffff 0%, #f2f6fc 100%);
        border-top-color: var(--skce-line);
        border-right-color: var(--skce-line);
        border-bottom-color: var(--skce-line);
        box-shadow: 0 1px 2px rgba(15, 47, 95, 0.06), 0 10px 24px -16px rgba(15, 47, 95, 0.26);
        transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
        animation: skceFadeUp 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
      }
      /* keep coloured left accents (e.g. community role colours) intact */
      .skce-admin :is(div, section, article, aside, form).bg-white:is(
          [class*="rounded-xl"],
          [class*="rounded-2xl"],
          [class*="rounded-3xl"],
          [class*="rounded-[2"]
        ):not(.fixed *):not([class*="border-l-"]) {
        border-left-color: var(--skce-line);
      }
      .skce-admin :is(div, section, article, aside, form).bg-white:is(
          [class*="rounded-xl"],
          [class*="rounded-2xl"],
          [class*="rounded-3xl"]
        ):not(.fixed *):not([class*="border-l-"]):hover {
        border-left-color: rgba(249, 115, 22, 0.32);
      }
      .skce-admin :is(div, section, article, aside, form).bg-white:is(
          [class*="rounded-xl"],
          [class*="rounded-2xl"],
          [class*="rounded-3xl"]
        ):not(.fixed *):hover {
        border-top-color: rgba(249, 115, 22, 0.32);
        border-right-color: rgba(249, 115, 22, 0.32);
        border-bottom-color: rgba(249, 115, 22, 0.32);
        box-shadow: 0 1px 2px rgba(15, 47, 95, 0.05), 0 16px 32px -18px rgba(15, 47, 95, 0.28);
      }
      .skce-admin .bg-slate-50:is([class*="rounded-xl"], [class*="rounded-2xl"]) {
        background-image: linear-gradient(135deg, #f4f8fd 0%, #fff7ef 140%);
      }

      /* ---------- design system: type + contrast (all portals) ----------
         Pale slate utilities are too faint on tinted cards, so labels and
         descriptions are lifted to a readable muted navy-slate. */
      .skce-admin { color: var(--skce-text); }
      .skce-admin .text-slate-400 { color: #62738d; }
      .skce-admin .text-slate-500 { color: var(--skce-muted); }
      .skce-admin .text-slate-600 { color: var(--skce-text); }
      .skce-admin :is(.text-slate-700, .text-slate-800) { color: #1d3350; }
      .skce-admin .text-slate-900 { color: var(--skce-ink); }
      .skce-admin :is(h1, h2, h3, h4) { letter-spacing: -0.012em; text-wrap: balance; }
      .skce-admin .border-slate-200 { border-color: #d3deec; }
      .skce-admin .border-slate-100 { border-color: #e1e9f3; }
      .skce-admin .bg-slate-100 { background-color: #e8eef6; }

      /* compact tables: scannable rows, not tall ones */
      .skce-admin tbody td[class*="py-4"],
      .skce-admin tbody td[class*="py-5"],
      .skce-admin tbody td[class*="py-6"] { padding-top: 0.8rem; padding-bottom: 0.8rem; }
      .skce-admin thead th { font-weight: 700; letter-spacing: 0.04em; }

      /* ---------- shared empty state: <div className="skce-empty"> ---------- */
      .skce-empty {
        display: flex; flex-direction: column; align-items: center; text-align: center;
        gap: 6px; padding: 26px 20px;
        border: 1px dashed #c3d1e4; border-radius: 16px;
        background: linear-gradient(180deg, #f9fbfe, #f1f5fb);
      }
      .skce-empty-icon {
        display: flex; align-items: center; justify-content: center;
        width: 44px; height: 44px; margin-bottom: 4px; border-radius: 13px;
        background: #fff1e6; color: var(--skce-orange);
      }
      .skce-empty strong { font-size: 15px; font-weight: 700; color: var(--skce-ink); }
      .skce-empty span { max-width: 420px; font-size: 13px; line-height: 1.55; color: var(--skce-muted); }

      /* ---------- tables ---------- */
      .skce-admin thead {
        background-image: linear-gradient(90deg, #eaf1fb 0%, #f6f9fe 60%, #fff3e6 100%);
      }
      .skce-admin thead th { color: var(--skce-navy-2); }
      .skce-admin tbody tr {
        transition: background-color 0.18s ease, box-shadow 0.18s ease;
        animation: skceRowIn 0.35s ease backwards;
      }
      .skce-admin tbody tr:nth-child(2) { animation-delay: 30ms; }
      .skce-admin tbody tr:nth-child(3) { animation-delay: 60ms; }
      .skce-admin tbody tr:nth-child(4) { animation-delay: 90ms; }
      .skce-admin tbody tr:nth-child(5) { animation-delay: 120ms; }
      .skce-admin tbody tr:nth-child(6) { animation-delay: 150ms; }
      .skce-admin tbody tr:nth-child(7) { animation-delay: 180ms; }
      .skce-admin tbody tr:nth-child(8) { animation-delay: 210ms; }
      .skce-admin tbody tr:nth-child(n + 9) { animation-delay: 240ms; }
      .skce-admin tbody tr:hover {
        background-color: #fff6ec;
        box-shadow: inset 3px 0 0 var(--skce-orange);
      }

      /* ---------- fields + buttons ---------- */
      .skce-admin :is(input, select, textarea):not([type="checkbox"], [type="radio"], [type="file"], [type="range"], [type="color"]) {
        border-color: #d2deee;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
      }
      .skce-admin :is(input, select, textarea):not([type="checkbox"], [type="radio"], [type="file"], [type="range"], [type="color"]):focus {
        outline: none;
        border-color: var(--skce-navy-2);
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
        background-color: #ffffff;
      }
      .skce-admin :is(input[type="checkbox"], input[type="radio"]) { accent-color: var(--skce-orange); }
      .skce-admin button:not(:disabled) {
        transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease,
          box-shadow 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
      }
      .skce-admin button:not(:disabled):active { transform: scale(0.97); }
      .skce-admin button:disabled { cursor: not-allowed; }

      /* ---------- scrollbars ---------- */
      .skce-admin ::-webkit-scrollbar,
      div.fixed.inset-0 ::-webkit-scrollbar { width: 10px; height: 10px; }
      .skce-admin ::-webkit-scrollbar-track,
      div.fixed.inset-0 ::-webkit-scrollbar-track { background: #edf2f9; border-radius: 999px; }
      .skce-admin ::-webkit-scrollbar-thumb,
      div.fixed.inset-0 ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #173b67, #1459b8);
        border-radius: 999px;
        border: 2px solid #edf2f9;
      }
      .skce-admin ::-webkit-scrollbar-thumb:hover,
      div.fixed.inset-0 ::-webkit-scrollbar-thumb:hover { background: var(--skce-orange); }

      /* ---------- loading skeletons ---------- */
      .skce-admin .animate-pulse {
        background-image: linear-gradient(90deg, #e6edf7 25%, #f6f9fe 37%, #e6edf7 63%);
        background-size: 1200px 100%;
        animation: skceShimmer 1.4s linear infinite;
      }

      /* ---------- pop-ups: full-viewport overlay, SKCE tint, animated ---------- */
      div.fixed.inset-0[class*="bg-"]:not([class*="lg:hidden"]):not([class*="pointer-events-none"]) {
        background-color: rgba(11, 36, 71, 0.58) !important;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        overflow-y: auto;
        overscroll-behavior: contain;
        animation: skceFadeIn 0.2s ease both;
      }
      div.fixed.inset-0.flex[class*="bg-"]:not([class*="lg:hidden"]) {
        align-items: safe center;
      }
      div.fixed.inset-0[class*="bg-"]:not([class*="lg:hidden"]):not([class*="pointer-events-none"]) > div:not([class*="absolute"]) {
        animation: skceModalIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
        border-top: 3px solid var(--skce-orange);
        box-shadow: 0 30px 70px -20px rgba(11, 36, 71, 0.5);
      }

      @media (prefers-reduced-motion: reduce) {
        .skce-page-enter, .skce-rise, .skce-banner-orbit,
        .skce-admin .admin-banner, .skce-admin .admin-banner > div,
        .skce-admin tbody tr, .skce-admin .animate-pulse,
        .skce-admin :is(div, section, article, aside, form).bg-white,
        div.fixed.inset-0, div.fixed.inset-0 > div { animation: none !important; }
        .skce-interactive-card, .skce-admin button, .skce-admin tbody tr { transition: none !important; }
        .skce-interactive-card:hover { transform: none; }
      }
    `}</style>
  );
}
