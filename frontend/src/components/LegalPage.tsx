import type { ReactNode } from "react";

import PageHero from "./PageHero";
import Reveal from "./Reveal";

/**
 * Shared layout for the legal pages (Privacy, Terms, Refund).
 * The wording of each policy stays in its own page file.
 */
export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-[#F7F9FC]">
      <PageHero
        eyebrow="Legal"
        title={title}
        description={intro}
        align="left"
        contentWidth="max-w-3xl"
      />

      <section className="px-6 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="space-y-8 text-sm leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section>
        <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-[#173B67]">
          <span
            aria-hidden="true"
            className="h-6 w-1 shrink-0 rounded-full bg-orange-500"
          />
          {title}
        </h2>

        <div className="space-y-3">{children}</div>
      </section>
    </Reveal>
  );
}

export function LegalContact() {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="font-bold text-[#173B67]">SK Computer Education</p>

      <p className="mt-2">
        Email:{" "}
        <a
          href="mailto:admissions@skce.in"
          className="font-medium text-[#173B67] transition-colors hover:text-orange-500"
        >
          admissions@skce.in
        </a>
      </p>

      <p>
        Phone:{" "}
        <a
          href="tel:+919885422483"
          className="font-medium text-[#173B67] transition-colors hover:text-orange-500"
        >
          +91 98854 22483
        </a>
      </p>
    </div>
  );
}
