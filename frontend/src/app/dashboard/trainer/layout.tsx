"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import TrainerSidebar from "@/components/dashboard/TrainerSidebar";
import AdminVisualEffects from "@/components/dashboard/AdminVisualEffects";

export default function TrainerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Allow Esc while the drawer is open (scroll lock is handled below).
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
    <>
      <div className="tr-shell skce-admin">
        <AdminVisualEffects />

        {/* Desktop sidebar */}
        <div className="hidden shrink-0 lg:block">
          <TrainerSidebar />
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
            <TrainerSidebar />
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

        <div className="tr-content">
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

      <style dangerouslySetInnerHTML={{ __html: trainerShellCss }} />
    </>
  );
}

const trainerShellCss = `
.tr-shell{
  /* Brand tokens (same as student pages) */
  --navy:#0F2F5F; --navy-2:#123B6D; --blue:#1459B8; --blue-2:#2563EB;
  --orange:#F97316; --orange-2:#F97316; --orange-tint:#FFF3EA;
  --bg:#F4F7FB; --card:#fff; --line:#E2E8F1; --line-2:#EDF1F7;
  --muted:#64748B; --soft:#8A97AB;
  --green:#15803D; --green-tint:#E8F6EE; --blue-tint:#EAF1FD;
  --ease:cubic-bezier(.2,.7,.2,1);

  position:relative;
  display:flex;
  min-height:100vh;
  color:var(--navy);
  isolation:isolate;
}

/* Soft ambient glow behind the content */
.tr-shell::before{
  content:"";
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    radial-gradient(900px 420px at 85% -10%, rgba(20,89,184,.08), transparent 60%),
    radial-gradient(700px 360px at 100% 100%, rgba(249,115,22,.06), transparent 60%);
}

.tr-shell *{box-sizing:border-box}

.tr-content{
  flex:1;
  display:flex;
  flex-direction:column;
  min-width:0;
}

/* Route transition wrapper (used by template.tsx) */
.tr-page-enter{
  flex:1;
  display:flex;
  flex-direction:column;
  min-width:0;
  animation:tr-swap 480ms var(--ease) backwards;
}

/* Shared keyframes for every trainer page */
@keyframes tr-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes tr-swap{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes tr-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes tr-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes tr-spin{to{transform:rotate(360deg)}}
@keyframes tr-flow{0%{background-position:0% 50%}100%{background-position:100% 50%}}
@keyframes tr-sheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}
@keyframes tr-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes tr-pulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,.45)}70%{box-shadow:0 0 0 8px rgba(249,115,22,0)}100%{box-shadow:0 0 0 0 rgba(249,115,22,0)}}

/* Staggered reveal: style={{ "--i": 3 }} */
.tr-reveal{animation:tr-rise 520ms var(--ease) backwards;animation-delay:calc(var(--i,0) * 60ms)}
.tr-spin{animation:tr-spin .8s linear infinite}

/* Animated navy hero banner */
.tr-hero{
  position:relative;overflow:hidden;color:#fff;border-radius:16px;
  background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 35%,#1459B8 70%,#0F2F5F 100%);
  background-size:220% 220%;
  animation:tr-rise 520ms var(--ease) both,tr-flow 14s ease-in-out infinite alternate;
  box-shadow:0 12px 30px rgba(15,47,95,.18);
}
.tr-hero::after{
  content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;
  background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 16%,transparent 16%);
}

/* Lift-on-hover card */
.tr-card{
  border:1px solid var(--line);border-radius:16px;background:var(--card);
  box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03);
  transition:transform .3s var(--ease),box-shadow .3s ease,border-color .3s ease;
}
.tr-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(15,47,95,.12);border-color:#9DBBEA}

/* Orange primary button with sheen */
.tr-btn-primary{
  position:relative;overflow:hidden;
  background:linear-gradient(180deg,#FB923C 0%,#F97316 55%,#EA580C 100%);color:#fff;
  transition:transform .2s var(--ease),box-shadow .2s ease;
}
.tr-btn-primary::after{
  content:"";position:absolute;top:0;bottom:0;left:0;width:40%;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  transform:translateX(-120%) skewX(-18deg);
}
.tr-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(249,115,22,.35)}
.tr-btn-primary:hover::after{animation:tr-sheen 700ms ease}

/* Skeleton loader */
.tr-skel{
  border-radius:16px;
  background:linear-gradient(90deg,#E9EEF6 25%,#F6F8FC 37%,#E9EEF6 63%);
  background-size:1200px 100%;
  animation:tr-shimmer 1.4s linear infinite;
}

/* Polish */
.tr-shell ::selection{background:var(--orange-tint);color:var(--orange-2)}
.tr-shell :focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.tr-content{scrollbar-width:thin;scrollbar-color:#D5DEEC transparent}


/* ---------- Same banner size on every trainer page ---------- */
.tr-shell .admin-banner{min-height:96px;display:flex;flex-direction:column;justify-content:center;margin-top:0!important;margin-bottom:20px!important}
.tr-shell .admin-banner + *{margin-top:0!important}
.tr-shell .trd-wrap .admin-banner{margin-bottom:0!important}
.tr-shell .trd-stats{margin-top:0!important}

/* ---------- Custom card families: same SKCE card look as admin ---------- */
.tr-shell :is(.trd-stat-card,.trd-overview-item,.trd-permission-item,
  .tr-batch-card,.tr-batches-stat,.tr-batches-empty,.tr-batches-error,.tr-batch-skeleton,
  .tc-composer,.tc-post,.tc-stats>div,.tc-sidebar>div,
  .tr-info-card,.tr-page-summary,.tr-student-tabs){
  background-image:linear-gradient(180deg,#ffffff 0%,#f6f9fe 100%);
  border:1px solid var(--skce-line,#dce6f2);
  box-shadow:0 1px 2px rgba(15,47,95,.04),0 10px 24px -16px rgba(15,47,95,.2);
  transition:border-color .22s ease,box-shadow .22s ease,transform .22s ease;
  animation:skceFadeUp .45s cubic-bezier(.2,.7,.2,1) backwards;
}
.tr-shell :is(.trd-stat-card,.trd-overview-item,.trd-permission-item,.tr-batch-card,.tr-batches-stat,.tc-post,.tc-stats>div,.tr-info-card):hover{
  border-color:rgba(249,115,22,.35);
  box-shadow:0 1px 2px rgba(15,47,95,.05),0 16px 32px -18px rgba(15,47,95,.28);
  transform:translateY(-2px);
}
.tr-shell .tr-batch-card:nth-child(2),.tr-shell .tr-batches-stat:nth-child(2){animation-delay:60ms}
.tr-shell .tr-batch-card:nth-child(3),.tr-shell .tr-batches-stat:nth-child(3){animation-delay:120ms}
.tr-shell .tr-batch-card:nth-child(n+4),.tr-shell .tr-batches-stat:nth-child(4){animation-delay:180ms}

/* progress bars, chips and primary links use the same orange */
.tr-shell .tr-batch-view,.tr-shell .trd-view-all{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,color .2s ease}
.tr-shell .tr-batch-view:hover,.tr-shell .trd-view-all:hover{transform:translateY(-1px);border-color:#F97316;color:#C2410C}

/* Pop-ups opened from trainer pages follow the admin overlay rules (AdminVisualEffects). */

@media (prefers-reduced-motion:reduce){
  .tr-page-enter,.tr-reveal,.tr-hero,.tr-skel{animation:none!important}
  .tr-card,.tr-btn-primary{transition:none!important}
}
`;