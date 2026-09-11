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
    <section className="bg-brand px-6 py-20 text-center text-white">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Ready to Begin Your Journey?
        </h2>
        <p className="mt-4 text-blue-100">
          Book a free demo class and experience the SKCE difference before you enroll.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand transition hover:bg-blue-50"
          >
            Book Free Demo Class <ArrowRight size={16} />
          </Link>
          <Link
            href="/courses"
            className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Browse Courses
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-blue-100">
          {PERKS.map((perk) => (
            <span key={perk} className="flex items-center gap-1.5">
              <Check size={14} /> {perk}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
