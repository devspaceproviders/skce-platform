"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
};

type IconType = LucideIcon;

const TONES: Record<
  ToastType,
  {
    icon: IconType;
    border: string;
    iconWrap: string;
    bar: string;
    banner: string;
  }
> = {
  error: {
    icon: AlertCircle,
    border: "border-l-red-500",
    iconWrap: "bg-red-50 text-red-600",
    bar: "bg-red-500",
    banner: "border-red-200 bg-red-50 text-red-800",
  },
  success: {
    icon: CheckCircle2,
    border: "border-l-emerald-500",
    iconWrap: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    banner: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-amber-500",
    iconWrap: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
    banner: "border-amber-200 bg-amber-50 text-amber-800",
  },
  info: {
    icon: Info,
    border: "border-l-blue-500",
    iconWrap: "bg-blue-50 text-blue-600",
    bar: "bg-blue-500",
    banner: "border-blue-200 bg-blue-50 text-blue-800",
  },
};

/**
 * Toast notifications.
 *
 *   const { notify, toastContainer } = useToast();
 *   notify("error", "Sign-in failed", "Incorrect email or password.");
 *   ...
 *   return <>{toastContainer} ...page... </>;
 */
export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration = 5500
    ) => {
      idRef.current += 1;
      const id = idRef.current;

      setItems((current) => [
        // Never stack identical toasts; keep at most 3 on screen.
        ...current
          .filter(
            (item) => !(item.title === title && item.message === message)
          )
          .slice(-2),
        { id, type, title, message, duration },
      ]);

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );

      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const toastContainer = (
    <ToastViewport items={items} onDismiss={dismiss} />
  );

  return { notify, dismiss, toastContainer };
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Rendered into <body> so no parent transform / overflow can affect it.
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[84px] z-[2000] flex flex-col items-center gap-3 px-4 sm:inset-x-auto sm:right-5 sm:items-end"
    >
      {items.map((item) => {
        const tone = TONES[item.type];
        const Icon = tone.icon;

        return (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            className={`sk-toast-in pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-l-4 border-slate-200 bg-white shadow-xl shadow-slate-900/10 ${tone.border}`}
          >
            <div className="flex items-start gap-3 p-4 pr-10">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}
              >
                <Icon size={19} />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>

                {item.message && (
                  <p className="mt-0.5 text-sm leading-5 text-slate-600">
                    {item.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss notification"
              className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <X size={15} />
            </button>

            <span
              aria-hidden="true"
              className={`sk-toast-bar absolute bottom-0 left-0 h-0.5 w-full ${tone.bar}`}
              style={{ animationDuration: `${item.duration}ms` }}
            />
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes skToastIn {
          from {
            opacity: 0;
            transform: translateY(-14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes skToastBar {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        .sk-toast-in {
          animation: skToastIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .sk-toast-bar {
          transform-origin: left;
          animation-name: skToastBar;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>,
    document.body
  );
}

/**
 * Inline banner shown inside a form (for errors that belong to the whole form).
 */
export function InlineAlert({
  type = "error",
  title,
  message,
  onClose,
  className = "",
}: {
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}) {
  const tone = TONES[type];
  const Icon = tone.icon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`sk-inline-alert flex items-start gap-3 rounded-xl border p-3.5 ${tone.banner} ${className}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>

        {message && <p className="mt-0.5 text-sm leading-5">{message}</p>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <X size={15} />
        </button>
      )}

      <style jsx global>{`
        @keyframes skInlineAlert {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sk-inline-alert {
          animation: skInlineAlert 0.25s ease-out both;
        }
      `}</style>
    </div>
  );
}
