import type { ReactNode } from "react";

import Reveal from "./Reveal";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  /** Tailwind max-width class for the text block, e.g. "max-w-3xl". */
  contentWidth?: string;
  children?: ReactNode;
};

/**
 * The navy banner at the top of inner pages.
 * One component so every page header looks and animates the same.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
  align: _align = "center",
  contentWidth = "max-w-3xl",
  children,
}: PageHeroProps) {
  // Page headers are always centred so every inner page matches.
  const center = true;

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#071C3A] via-[#0F2F5F] to-[#173B67] px-6 py-14 text-white sm:py-16">
      {/* Animated navy backdrop */}
      <div className="sk-dots pointer-events-none absolute inset-0 -z-10" />
      <div className="sk-hero-orb pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-sky-400/25 blur-3xl" />
      <div className="sk-hero-orb-2 pointer-events-none absolute -bottom-28 -left-16 -z-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />

      <div
        className={`relative mx-auto w-full max-w-7xl ${
          center ? "text-center" : ""
        }`}
      >
        <Reveal className={`${center ? "mx-auto" : ""} ${contentWidth}`}>
          {eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
              {eyebrow}
            </p>
          )}

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>

          <div
            className={`mt-4 flex gap-1.5 ${center ? "justify-center" : ""}`}
            aria-hidden="true"
          >
            <span className="h-1 w-12 rounded-full bg-orange-500" />
            <span className="h-1 w-4 rounded-full bg-white/60" />
          </div>

          {description && (
            <p className="mt-4 text-base leading-7 text-blue-100/85 md:text-lg">
              {description}
            </p>
          )}

          {children}
        </Reveal>
      </div>
    </section>
  );
}
