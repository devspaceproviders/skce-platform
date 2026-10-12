"use client";

import {

  useCallback,

  useEffect,

  useState,

  type CSSProperties,

  type ComponentType,

  type ReactNode,

} from "react";

import { AlertCircle, CheckCircle2, ChevronDown, X } from "lucide-react";

/* ------------------------------------------------------------------

 * Small helpers shared by every student page

 * ------------------------------------------------------------------ */

export function reveal(index: number): CSSProperties {

  return { ["--i" as string]: index } as CSSProperties;

}

export function CountUp({

  value,

  format,

  suffix = "",

}: {

  value: number;

  format?: (n: number) => string;

  suffix?: string;

}) {

  const [display, setDisplay] = useState(0);

  useEffect(() => {

    const reduce =

      typeof window !== "undefined" &&

      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {

      setDisplay(value);

      return;

    }

    const start = performance.now();

    let raf = 0;

    const tick = (now: number) => {

      const p = Math.min((now - start) / 900, 1);

      setDisplay(value * (1 - Math.pow(1 - p, 3)));

      if (p < 1) {

        raf = requestAnimationFrame(tick);

      }

    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);

  }, [value]);

  const n = Math.round(display);

  return <>{format ? format(n) : `${n}${suffix}`}</>;

}

/* Hover = preview, click = pin. `last` keeps the content while closing. */

export function usePreview<K extends string>(initial: K) {

  const [hover, setHover] = useState<K | null>(null);

  const [pinned, setPinned] = useState<K | null>(null);

  const [last, setLast] = useState<K>(initial);

  const shown = hover ?? pinned;

  useEffect(() => {

    if (shown) {

      setLast(shown);

    }

  }, [shown]);

  const toggle = (key: K) =>

    setPinned((current) => (current === key ? null : key));

  return { hover, pinned, shown, last, setHover, setPinned, toggle };

}

export type Tone = "blue" | "green" | "orange" | "navy";

export function SkTile({

  index,

  icon: Icon,

  label,

  value,

  suffix,

  format,

  helper,

  tone,

  active,

  pinned,

  onEnter,

  onToggle,

  isStatic = false,

}: {

  index: number;

  icon: ComponentType<{ size?: number | string }>;

  label: string;

  value: number;

  suffix?: string;

  format?: (n: number) => string;

  helper: string;

  tone: Tone;

  active?: boolean;

  pinned?: boolean;

  onEnter?: () => void;

  onToggle?: () => void;

  isStatic?: boolean;

}) {

  const body = (

    <>

      <div className={`sk-icon sk-tone-${tone}`}>

        <Icon size={20} />

      </div>

      <div className="sk-min0 sk-grow">

        <span className="sk-tile-label">{label}</span>

        <strong className="sk-tile-value">

          <CountUp value={value} suffix={suffix} format={format} />

        </strong>

        <span className="sk-tile-helper">{helper}</span>

      </div>

      {isStatic ? null : <ChevronDown size={17} className="sk-tile-caret" />}

    </>

  );

  if (isStatic) {

    return (

      <div className="sk-tile sk-reveal" style={reveal(index)}>

        {body}

      </div>

    );

  }

  return (

    <button

      type="button"

      className={`sk-tile sk-reveal${active ? " is-active" : ""}${

        pinned ? " is-pinned" : ""

      }`}

      style={reveal(index)}

      onMouseEnter={onEnter}

      onFocus={onEnter}

      onClick={onToggle}

      aria-pressed={Boolean(pinned)}

    >

      {body}

    </button>

  );

}

export function DetailPanel({

  open,

  itemKey,

  icon: Icon,

  title,

  subtitle,

  pinned,

  onUnpin,

  children,

}: {

  open: boolean;

  itemKey: string;

  icon: ComponentType<{ size?: number | string }>;

  title: string;

  subtitle: string;

  pinned: boolean;

  onUnpin: () => void;

  children: ReactNode;

}) {

  return (

    <div className={`sk-detail${open ? " is-open" : ""}`}>

      <div className="sk-detail-inner">

        <div className="sk-detail-card" key={itemKey}>

          <div className="sk-detail-head">

            <div className="sk-panel-head">

              <div className="sk-icon sk-tone-blue">

                <Icon size={19} />

              </div>

              <div className="sk-min0">

                <h2>{title}</h2>

                <p>{subtitle}</p>

              </div>

            </div>

            {pinned ? (

              <button

                type="button"

                className="sk-pinchip"

                onClick={onUnpin}

                aria-label="Close details"

              >

                Pinned

                <X size={13} />

              </button>

            ) : (

              <span className="sk-detail-hint">Click the card to keep this open</span>

            )}

          </div>

          {children}

        </div>

      </div>

    </div>

  );

}

/* ------------------------------------------------------------------

 * Modal with smooth enter/exit, ESC + backdrop close, scroll lock

 * ------------------------------------------------------------------ */

export function Modal({

  onClose,

  children,

  maxWidth = 640,

  labelledBy,

  locked = false,

}: {

  onClose: () => void;

  children: (close: () => void) => ReactNode;

  maxWidth?: number;

  labelledBy?: string;

  locked?: boolean;

}) {

  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {

    if (locked || closing) {

      return;

    }

    setClosing(true);

    window.setTimeout(onClose, 180);

  }, [locked, closing, onClose]);

  useEffect(() => {

    const onKey = (event: KeyboardEvent) => {

      if (event.key === "Escape") {

        close();

      }

    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKey);

    document.body.style.overflow = "hidden";

    return () => {

      document.removeEventListener("keydown", onKey);

      document.body.style.overflow = previousOverflow;

    };

  }, [close]);

  return (

    <div

      className={`sk-overlay${closing ? " is-closing" : ""}`}

      onMouseDown={(event) => {

        if (event.target === event.currentTarget) {

          close();

        }

      }}

    >

      <div

        role="dialog"

        aria-modal="true"

        aria-labelledby={labelledBy}

        className="sk-modal"

        style={{ maxWidth }}

      >

        {children(close)}

      </div>

    </div>

  );

}

/* ------------------------------------------------------------------

 * Toasts

 * ------------------------------------------------------------------ */

type ToastKind = "success" | "error";

export function useToasts() {

  const [items, setItems] = useState<

    { id: number; kind: ToastKind; text: string }[]

  >([]);

  const dismiss = useCallback((id: number) => {

    setItems((current) => current.filter((item) => item.id !== id));

  }, []);

  const push = useCallback(

    (kind: ToastKind, text: string) => {

      const id = Date.now() + Math.random();

      setItems((current) => [...current, { id, kind, text }]);

      window.setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4500);

    },

    [dismiss]

  );

  const node = (

    <div className="sk-toasts" aria-live="polite">

      {items.map((item) => (

        <div

          key={item.id}

          className={`sk-toast ${item.kind === "error" ? "is-error" : "is-ok"}`}

          role={item.kind === "error" ? "alert" : "status"}

        >

          {item.kind === "error" ? (

            <AlertCircle size={18} />

          ) : (

            <CheckCircle2 size={18} />

          )}

          <span>{item.text}</span>

          <button

            type="button"

            onClick={() => dismiss(item.id)}

            aria-label="Dismiss"

          >

            <X size={15} />

          </button>

          <i

            className="sk-toast-timer"

            style={{ animationDuration: item.kind === "error" ? "6s" : "4.5s" }}

          />

        </div>

      ))}

    </div>

  );

  return { push, node };

}

/* ------------------------------------------------------------------

 * Global SKCE student styles (navy / blue / orange)

 * ------------------------------------------------------------------ */

export function SkStyles() {

  return <style dangerouslySetInnerHTML={{ __html: skCss }} />;

}

const skCss = `

.sk-page,.sk-overlay,.sk-toasts{

  --navy:#0F2F5F;--navy-2:#123B6D;--blue:#1459B8;--blue-2:#2563EB;

  --orange:#FF6B00;--orange-2:#E85F00;--orange-tint:#FFF3EA;

  --bg:#F7F9FC;--card:#fff;--line:#E2E8F1;--line-2:#EDF1F7;

  --muted:#64748B;--soft:#8A97AB;

  --green:#15803D;--green-tint:#E8F6EE;--blue-tint:#EAF1FD;

  --red:#C62828;--red-tint:#FDECEC;

  --ease:cubic-bezier(.2,.7,.2,1);

}

.sk-page *,.sk-overlay *,.sk-toasts *{box-sizing:border-box}

.sk-page{flex:1;min-width:0;width:100%;padding:24px 28px 40px;background:var(--bg);color:var(--navy)}

.sk-container{width:100%;max-width:1360px;margin:0 auto}

.sk-narrow{max-width:940px}

.sk-min0{min-width:0}.sk-grow{flex:1}

.sk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@keyframes sk-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}

@keyframes sk-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

@keyframes sk-grow-x{from{transform:scaleX(0)}to{transform:scaleX(1)}}

@keyframes sk-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}

@keyframes sk-spin{to{transform:rotate(360deg)}}

@keyframes sk-flow{0%{background-position:0% 50%}100%{background-position:100% 50%}}

@keyframes sk-sheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}

@keyframes sk-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}

@keyframes sk-fade{from{opacity:0}to{opacity:1}}

@keyframes sk-fade-out{to{opacity:0}}

@keyframes sk-modal-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}

@keyframes sk-modal-out{to{opacity:0;transform:translateY(10px) scale(.98)}}

@keyframes sk-toast-in{from{opacity:0;transform:translateX(24px) scale(.97)}to{opacity:1;transform:none}}

@keyframes sk-timer{from{transform:scaleX(1)}to{transform:scaleX(0)}}

@keyframes sk-pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 7px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}

@keyframes sk-ring{from{stroke-dashoffset:var(--c)}}

.sk-spin{animation:sk-spin .8s linear infinite}

.sk-reveal{animation:sk-rise 520ms var(--ease) both;animation-delay:calc(var(--i,0) * 70ms)}

.sk-swap{animation:sk-swap .35s var(--ease) both}

/* Buttons */

.sk-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1;text-decoration:none;white-space:nowrap;cursor:pointer;transition:background .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease),color .2s ease,opacity .2s ease}

.sk-btn:focus-visible,.sk-tile:focus-visible,.sk-row:focus-visible,.sk-seg-btn:focus-visible,.sk-input:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}

.sk-btn:active:not(:disabled){transform:scale(.98)}

.sk-btn:disabled{opacity:.55;cursor:not-allowed}

.sk-btn-sm{height:36px;padding:0 14px;font-size:13px}

.sk-btn-block{width:100%}

.sk-btn-primary{background:linear-gradient(180deg,#FF8A12 0%,#FF6B00 55%,#F25A00 100%);color:#fff}

.sk-btn-primary::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-120%) skewX(-18deg);pointer-events:none}

.sk-btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 22px rgba(255,107,0,.35)}

.sk-btn-primary:hover:not(:disabled)::after{animation:sk-sheen 700ms ease}

.sk-btn-primary:disabled{background:#CBD5E4;box-shadow:none}

.sk-btn-secondary{background:#fff;color:var(--blue);border-color:var(--line)}

.sk-btn-secondary:hover:not(:disabled){background:var(--blue-tint);border-color:#BFD3F2;transform:translateY(-2px);box-shadow:0 6px 14px rgba(20,89,184,.12)}

.sk-btn-danger{background:var(--red);color:#fff}

.sk-btn-danger:hover:not(:disabled){background:#A81F1F;transform:translateY(-2px);box-shadow:0 8px 18px rgba(198,40,40,.3)}

.sk-btn-ghost-light{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.3)}

.sk-btn-ghost-light:hover:not(:disabled){background:rgba(255,255,255,.22);transform:translateY(-2px)}

.sk-refresh-icon{transition:transform .5s var(--ease)}

.sk-btn:hover .sk-refresh-icon{transform:rotate(180deg)}

/* Heading */

.sk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}

.sk-kicker{margin-bottom:4px;font-size:13px;font-weight:600;color:var(--orange)}

.sk-head h1{margin:0;font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:var(--navy)}

.sk-head p{max-width:640px;margin:6px 0 0;font-size:15px;line-height:1.6;color:var(--muted)}

/* Hero */

.sk-hero{position:relative;overflow:hidden;margin-bottom:20px;padding:26px 30px;border-radius:16px;color:#fff;background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 35%,#1459B8 70%,#0F2F5F 100%);background-size:220% 220%;animation:sk-rise 520ms var(--ease) both,sk-flow 14s ease-in-out infinite alternate;box-shadow:0 12px 30px rgba(15,47,95,.18)}

.sk-hero::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 16%,transparent 16%)}

.sk-hero>*{position:relative;z-index:1}

/* Icons & tones */

.sk-icon{width:40px;height:40px;flex:0 0 40px;display:flex;align-items:center;justify-content:center;border-radius:10px;transition:transform .3s var(--ease)}

.sk-icon-sm{width:36px;height:36px;flex-basis:36px}

.sk-tone-blue{background:var(--blue-tint);color:var(--blue)}

.sk-tone-green{background:var(--green-tint);color:var(--green)}

.sk-tone-orange{background:var(--orange-tint);color:var(--orange)}

.sk-tone-navy{background:#E6ECF5;color:var(--navy)}

.sk-tone-red{background:var(--red-tint);color:var(--red)}

.sk-avatar{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%;background:var(--blue-tint);color:var(--blue);font-size:13px;font-weight:700}

.sk-avatar img{width:100%;height:100%;object-fit:cover;display:block}

/* Tiles */

.sk-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}

.sk-tiles-3{grid-template-columns:repeat(3,minmax(0,1fr))}

.sk-tile{position:relative;display:flex;align-items:center;gap:14px;min-width:0;width:100%;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);text-align:left;font:inherit;color:inherit;box-shadow:0 1px 2px rgba(15,47,95,.04);transition:box-shadow .25s ease,transform .25s var(--ease),border-color .25s ease}

button.sk-tile{cursor:pointer}

.sk-tile:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(15,47,95,.12);border-color:#C9D8EE}

.sk-tile:hover .sk-icon,.sk-row:hover .sk-icon,.sk-panel-head:hover .sk-icon{transform:scale(1.12) rotate(-6deg)}

.sk-tile.is-active{transform:translateY(-4px);border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.14),0 14px 28px rgba(15,47,95,.1)}

.sk-tile.is-pinned{background:#FBFCFF}

.sk-tile-label{display:block;font-size:13px;color:var(--muted)}

.sk-tile-value{display:block;margin-top:3px;font-size:26px;line-height:1.15;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums}

.sk-tile-helper{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--soft)}

.sk-tile-caret{flex:0 0 auto;align-self:center;color:var(--soft);transition:transform .3s var(--ease),color .2s ease}

.sk-tile.is-active .sk-tile-caret{transform:rotate(180deg);color:var(--orange)}

/* Panels */

.sk-panel{min-width:0;padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03);transition:box-shadow .25s ease,border-color .25s ease}

.sk-panel:hover{box-shadow:0 10px 26px rgba(15,47,95,.08);border-color:#D4DEEC}

.sk-panel-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}

.sk-panel-head h2{margin:0;font-size:17px;line-height:1.3;font-weight:700;color:var(--navy)}

.sk-panel-head p{margin:2px 0 0;font-size:13px;color:var(--muted)}

.sk-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}

.sk-mb{margin-bottom:20px}

.sk-zone{margin-bottom:20px}

/* Detail panel (hover preview / click to pin) */

.sk-detail{display:grid;grid-template-rows:0fr;margin-top:0;transition:grid-template-rows .4s var(--ease),margin-top .4s var(--ease)}

.sk-detail.is-open{grid-template-rows:1fr;margin-top:14px}

.sk-detail-inner{min-height:0;overflow:hidden;padding:0 2px}

.sk-detail-card{padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(15,47,95,.08);animation:sk-swap .35s var(--ease) both}

.sk-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}

.sk-detail-hint{flex:0 0 auto;padding:5px 10px;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:12px;font-weight:600}

.sk-pinchip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px 0 12px;border:0;border-radius:999px;background:var(--orange-tint);color:var(--orange-2);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .2s ease,transform .2s var(--ease)}

.sk-pinchip:hover{background:#FFE3CD;transform:translateY(-1px)}

.sk-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}

.sk-row{display:flex;align-items:center;gap:12px;width:100%;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;font:inherit;color:inherit;animation:sk-swap .35s var(--ease) both;transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease)}

button.sk-row,a.sk-row{cursor:pointer;text-decoration:none}

.sk-row:nth-child(2){animation-delay:40ms}.sk-row:nth-child(3){animation-delay:80ms}.sk-row:nth-child(4){animation-delay:120ms}.sk-row:nth-child(5){animation-delay:160ms}.sk-row:nth-child(6){animation-delay:200ms}

button.sk-row:hover,a.sk-row:hover{border-color:#9DBBEA;box-shadow:0 8px 18px rgba(15,47,95,.1);transform:translateX(4px)}

.sk-row-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}

.sk-row-sub{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)}

.sk-arrow{flex:0 0 auto;color:#A3B0C4;transition:transform .25s var(--ease),color .2s ease}

.sk-row:hover .sk-arrow{transform:translateX(4px);color:var(--orange)}

.sk-detail-empty{margin:0;font-size:13px;color:var(--muted)}

/* Expandable (hover reveal) */

.sk-expand{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s var(--ease)}

.sk-expand.is-open{grid-template-rows:1fr}

.sk-expand-inner{min-height:0;overflow:hidden}

/* Badges */

.sk-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;background:#EDF1F7;color:var(--muted)}

.sk-badge.tone-green{background:var(--green-tint);color:var(--green)}

.sk-badge.tone-blue{background:var(--blue-tint);color:var(--blue)}

.sk-badge.tone-orange{background:var(--orange-tint);color:var(--orange-2)}

.sk-badge.tone-navy{background:#E6ECF5;color:var(--navy)}

.sk-badge.tone-red{background:var(--red-tint);color:var(--red)}

/* Segmented control */

.sk-seg{display:flex;align-items:center;gap:4px;padding:4px;border:1px solid var(--line);border-radius:12px;background:#F8FAFD;overflow-x:auto}

.sk-seg-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:1 1 0;min-width:0;height:36px;padding:0 14px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:inherit;font-size:13.5px;font-weight:600;white-space:nowrap;cursor:pointer;transition:background .2s ease,color .2s ease,box-shadow .2s ease,transform .2s var(--ease)}

.sk-seg-btn:hover{color:var(--blue);background:#fff}

.sk-seg-btn.is-active{background:var(--blue);color:#fff;box-shadow:0 6px 14px rgba(20,89,184,.25)}

.sk-seg-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 6px;border-radius:999px;background:var(--line-2);color:var(--muted);font-size:11.5px}

.sk-seg-btn.is-active .sk-seg-count{background:rgba(255,255,255,.22);color:#fff}

/* Forms */

.sk-field{margin-bottom:16px}

.sk-label{display:block;margin-bottom:7px;font-size:13.5px;font-weight:600;color:var(--navy)}

.sk-input,.sk-select,.sk-textarea{width:100%;padding:0 13px;border:1px solid #D4DCE8;border-radius:10px;background:#fff;color:var(--navy);font:inherit;font-size:14px;transition:border-color .2s ease,box-shadow .2s ease}

.sk-input,.sk-select{height:44px}

.sk-textarea{padding:12px 13px;line-height:1.6;resize:vertical}

.sk-input:focus,.sk-select:focus,.sk-textarea:focus{outline:none;border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.15)}

.sk-input:disabled{background:#F3F6FA;cursor:not-allowed}

.sk-error-text{margin-top:7px;font-size:13px;color:var(--red)}

.sk-search{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--soft);transition:border-color .2s ease,box-shadow .2s ease}

.sk-search:focus-within{border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.15);color:var(--blue)}

.sk-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;font:inherit;font-size:14px;color:var(--navy)}

/* Alerts */

.sk-alert{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;padding:12px 14px;border:1px solid;border-radius:12px;font-size:14px;line-height:1.5;animation:sk-swap .3s var(--ease) both}

.sk-alert span{flex:1;min-width:0}

.sk-alert.is-error{border-color:#F3C9C9;background:#FFF8F8;color:#9B1C1C}

.sk-alert.is-ok{border-color:#BFE6CD;background:#F5FCF8;color:#166534}

.sk-alert.is-warn{border-color:#FFD9BD;background:var(--orange-tint);color:#9A3412}

.sk-alert button{display:flex;border:0;background:transparent;color:inherit;cursor:pointer;opacity:.7}

.sk-alert button:hover{opacity:1}

/* Progress bar */

.sk-bar{height:8px;overflow:hidden;margin-top:8px;border-radius:999px;background:#E6ECF5}

.sk-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transform-origin:left;animation:sk-grow-x 1000ms var(--ease) 250ms both}

.sk-bar span.is-done{background:linear-gradient(90deg,#16A05D,#22C176)}

/* Modal */

.sk-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,47,95,.5);backdrop-filter:blur(4px);animation:sk-fade .2s ease both}

.sk-overlay.is-closing{animation:sk-fade-out .18s ease both}

.sk-modal{width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 28px 70px rgba(15,47,95,.35);animation:sk-modal-in .28s var(--ease) both}

.sk-overlay.is-closing .sk-modal{animation:sk-modal-out .18s ease both}

.sk-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding:20px 24px;border-bottom:1px solid var(--line-2)}

.sk-modal-head h2{margin:0;font-size:20px;font-weight:700;color:var(--navy)}

.sk-modal-head p{margin:5px 0 0;font-size:13.5px;color:var(--muted)}

.sk-modal-body{flex:1;overflow-y:auto;padding:22px 24px}

.sk-modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid var(--line-2);background:#FBFCFE}

.sk-modal-close{display:flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 36px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--muted);cursor:pointer;transition:background .2s ease,color .2s ease,transform .25s var(--ease)}

.sk-modal-close:hover{background:var(--red-tint);color:var(--red);transform:rotate(90deg)}

/* Toasts */

.sk-toasts{position:fixed;top:18px;right:18px;z-index:1100;display:flex;flex-direction:column;gap:10px;width:min(380px,calc(100vw - 36px));pointer-events:none}

.sk-toast{position:relative;overflow:hidden;pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:14px 12px 14px 14px;border-radius:12px;border:1px solid;background:#fff;box-shadow:0 12px 30px rgba(15,47,95,.18);font-size:14px;line-height:1.45;animation:sk-toast-in .32s var(--ease) both}

.sk-toast span{flex:1;min-width:0}

.sk-toast svg{flex:0 0 auto;margin-top:1px}

.sk-toast button{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:8px;background:transparent;color:inherit;opacity:.7;cursor:pointer}

.sk-toast button:hover{opacity:1;background:rgba(15,47,95,.08)}

.sk-toast.is-error{border-color:#F3C9C9;color:#9B1C1C;background:#FFF8F8}

.sk-toast.is-ok{border-color:#BFE6CD;color:#166534;background:#F5FCF8}

.sk-toast-timer{position:absolute;left:0;bottom:0;width:100%;height:3px;background:currentColor;opacity:.35;transform-origin:left;animation:sk-timer 5s linear forwards}

/* States */

.sk-skel{border-radius:16px;background:linear-gradient(90deg,#E9EEF6 25%,#F6F8FC 37%,#E9EEF6 63%);background-size:1200px 100%;animation:sk-shimmer 1.4s linear infinite}

.sk-empty{min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:28px;border:1px dashed #CBD6E6;border-radius:16px;background:#FAFBFE;text-align:center;animation:sk-rise .42s var(--ease) both}

.sk-empty-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;border-radius:14px;background:var(--blue-tint);color:var(--blue)}

.sk-empty strong{font-size:16px;color:var(--navy)}

.sk-empty span{max-width:380px;margin-bottom:10px;font-size:13.5px;line-height:1.5;color:var(--muted)}

.sk-error-card{min-height:320px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:32px;border:1px solid #F3D1D1;border-radius:16px;background:#fff;text-align:center;animation:sk-rise .42s var(--ease) both}

.sk-error-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:14px;background:var(--red-tint);color:var(--red)}

.sk-error-card h2{margin:0;font-size:18px;font-weight:700;color:var(--navy)}

.sk-error-card p{max-width:480px;margin:2px 0 14px;font-size:14px;line-height:1.6;color:var(--muted)}

.sk-note{display:flex;align-items:center;gap:10px;margin-top:20px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--muted);font-size:13px;line-height:1.5}

.sk-note svg{color:var(--blue);flex:0 0 auto}

/* Responsive */

@media (max-width:1100px){.sk-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}

@media (max-width:900px){.sk-grid-2{grid-template-columns:minmax(0,1fr)}.sk-rows{grid-template-columns:minmax(0,1fr)}.sk-detail-hint{display:none}}

@media (max-width:760px){

  .sk-page{padding:18px 14px 28px}

  .sk-head{flex-direction:column}

  .sk-head .sk-btn{width:100%}

  .sk-head h1{font-size:25px}

  .sk-modal-head,.sk-modal-body,.sk-modal-foot{padding-left:16px;padding-right:16px}

  .sk-toasts{top:10px;right:10px}

}

@media (max-width:560px){.sk-tiles,.sk-tiles-3{grid-template-columns:minmax(0,1fr)}.sk-btn{height:44px}}

@media (prefers-reduced-motion:reduce){

  .sk-reveal,.sk-swap,.sk-hero,.sk-bar span,.sk-skel,.sk-detail-card,.sk-row,.sk-modal,.sk-overlay,.sk-toast,.sk-toast-timer,.sk-empty,.sk-error-card,.sk-alert{animation:none!important}

  .sk-detail,.sk-expand,.sk-tile,.sk-btn,.sk-row,.sk-icon{transition:none!important}

}

`;
