import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const PERKS = [
  "No registration fee",
  "Expert-led session",
  "1:1 counselling included",
  "Batch options available",
];

export default function CTASection() {
  return (
    <section className="bg-[#173B67] px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl text-center">
        {/* Label */}
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
          Start Learning Today
        </p>

        {/* Heading */}
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            Book Free Demo Class
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Browse Courses
          </Link>
        </div>

        {/* Perks */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3">
          {PERKS.map((perk) => (
            <span
              key={perk}
              className="flex items-center gap-2 text-xs font-medium text-slate-200"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                <Check size={12} strokeWidth={3} />
              </span>
              {perk}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}