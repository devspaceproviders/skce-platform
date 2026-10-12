import TrainerSidebar from "@/components/dashboard/TrainerSidebar";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="tr-shell">
        <TrainerSidebar />

        <div className="tr-content">{children}</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: trainerShellCss }} />
    </>
  );
}

const trainerShellCss = `
.tr-shell{
  /* Brand tokens (same as student pages) */
  --navy:#0F2F5F; --navy-2:#123B6D; --blue:#1459B8; --blue-2:#2563EB;
  --orange:#FF6B00; --orange-2:#E85F00; --orange-tint:#FFF3EA;
  --bg:#F7F9FC; --card:#fff; --line:#E2E8F1; --line-2:#EDF1F7;
  --muted:#64748B; --soft:#8A97AB;
  --green:#15803D; --green-tint:#E8F6EE; --blue-tint:#EAF1FD;
  --ease:cubic-bezier(.2,.7,.2,1);

  position:relative;
  display:flex;
  min-height:100vh;
  background:var(--bg);
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
    radial-gradient(700px 360px at 100% 100%, rgba(255,107,0,.06), transparent 60%);
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
  animation:tr-swap 480ms var(--ease) both;
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
@keyframes tr-pulse{0%{box-shadow:0 0 0 0 rgba(255,107,0,.45)}70%{box-shadow:0 0 0 8px rgba(255,107,0,0)}100%{box-shadow:0 0 0 0 rgba(255,107,0,0)}}

/* Staggered reveal: style={{ "--i": 3 }} */
.tr-reveal{animation:tr-rise 520ms var(--ease) both;animation-delay:calc(var(--i,0) * 60ms)}
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
  background:linear-gradient(180deg,#FF8A12 0%,#FF6B00 55%,#F25A00 100%);color:#fff;
  transition:transform .2s var(--ease),box-shadow .2s ease;
}
.tr-btn-primary::after{
  content:"";position:absolute;top:0;bottom:0;left:0;width:40%;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  transform:translateX(-120%) skewX(-18deg);
}
.tr-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(255,107,0,.35)}
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

@media (prefers-reduced-motion:reduce){
  .tr-page-enter,.tr-reveal,.tr-hero,.tr-skel{animation:none!important}
  .tr-card,.tr-btn-primary{transition:none!important}
}
`;