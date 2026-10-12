"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { LABEL_CLASS } from "./formStyles";

/**
 * Label + control + inline error.
 * The error element id is `${htmlFor}-error` so inputs can point to it
 * with aria-describedby.
 */
export default function FormField({
  label,
  required,
  htmlFor,
  error,
  hint,
  className = "",
  children,
}: {
  label?: string;
  required?: boolean;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className={LABEL_CLASS}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {children}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="sk-field-error mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
        >
          <AlertCircle size={14} className="mt-[3px] shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-slate-400">
          {hint}
        </p>
      ) : null}

      <style jsx global>{`
        @keyframes skFieldError {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sk-field-error {
          animation: skFieldError 0.2s ease-out both;
        }
      `}</style>
    </div>
  );
}
