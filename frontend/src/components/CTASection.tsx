import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import Reveal from "./Reveal";

const PERKS = [
  "No registration fee",
  "Expert-led session",
  "1:1 counselling included",
  "Batch options available",
];

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#173B67] px-6 py-12 text-white sm:py-16">
      {/* Subtle brand glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

      <Reveal className="relative mx-auto max-w-4xl text-center">
        {/* Label */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">
          Start Learning Today
        </p>

        {/* Heading */}
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Ready to Begin Your Journey?
        </h2>

        {/* Description */}
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
          Book a free demo class and discover how practical, career-focused
          learning at SK Computer Education can help you achieve your goals.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B67] active:translate-y-0"
          >
            Book Free Demo Class
            <ArrowRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/courses"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-7 text-sm font-semibold text-white transition duration-200 hover:-translate-y-px hover:border-white/60 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B67] active:translate-y-0"
          >
            Browse Courses
          </Link>
        </div>

        {/* Perks */}
        <ul className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3">
          {PERKS.map((perk) => (
            <li
              key={perk}
              className="flex items-center gap-2 text-xs font-medium text-slate-200 sm:text-sm"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                <Check size={12} strokeWidth={3} />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
