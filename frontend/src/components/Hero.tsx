import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-hero-gradient px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-sky" />
          Admissions Open — August 2026 Batch
        </span>

        <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Launch Your <br />
          <span className="text-brand-sky">Tech Career</span> <br />
          with Expert Training
        </h1>

        <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
          Hands-on courses in Full Stack, Data Science, SAP, and more — taught
          by industry professionals with real-world experience.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/courses"
            className="flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Explore Courses <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Book Free Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
