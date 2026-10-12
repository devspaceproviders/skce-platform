"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

import { INPUT_CLASS, INPUT_ERROR_CLASS } from "./formStyles";
import { passwordStrength } from "./formValidators";

export default function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  error,
  leftIcon,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  leftIcon?: ReactNode;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  return (
    <div>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) =>
            setCapsLock(e.getModifierState?.("CapsLock") ?? false)
          }
          onBlur={() => {
            setCapsLock(false);
            onBlur?.();
          }}
          className={`${INPUT_CLASS} pr-12 ${leftIcon ? "pl-11" : ""} ${
            error ? INPUT_ERROR_CLASS : ""
          }`}
        />

        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>

      {capsLock && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <AlertTriangle size={13} />
          Caps Lock is on
        </p>
      )}
    </div>
  );
}

const BAR_COLORS = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-400",
  "bg-lime-500",
  "bg-emerald-500",
];

/** Four-bar meter shown under a "create password" field. Guidance only. */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) {
    return null;
  }

  const { score, label, tips } = passwordStrength(value);
  const filled = Math.max(1, score);

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                bar <= filled ? BAR_COLORS[filled] : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <span className="w-14 text-right text-xs font-semibold text-slate-600">
          {label}
        </span>
      </div>

      {tips.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-400">
          Make it stronger with {tips.slice(0, 2).join(" and ")}.
        </p>
      )}
    </div>
  );
}
