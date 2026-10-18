import { Users, BookOpen, Clock, Award } from "lucide-react";

import CountUp from "./CountUp";
import Reveal from "./Reveal";

const STATS = [
  { icon: Users, end: 5000, suffix: "+", label: "Students Trained" },
  { icon: BookOpen, end: 20, suffix: "+", label: "Courses Offered" },
  { icon: Clock, end: 10, suffix: "+", label: "Years of Excellence" },
  { icon: Award, end: 100, suffix: "%", label: "Student Satisfaction" },
];

export default function StatsBar() {
  return (
    <section className="relative z-10 bg-[linear-gradient(to_bottom,transparent_0,transparent_60px,#F4F7FB_60px)] pb-8 sm:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative -mt-14 overflow-hidden rounded-3xl border border-[#D3DEEC] border-t-4 border-t-[#F97316] bg-white shadow-[0_24px_50px_-24px_rgba(15,47,95,0.45)] sm:-mt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-100/60 blur-2xl"
          />
          <div className="relative grid grid-cols-2 gap-x-4 gap-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:grid-cols-4 lg:gap-x-0">
            {STATS.map(({ icon: Icon, end, suffix, label }, index) => (
              <Reveal
                key={label}
                delay={index * 100}
                className="group flex items-center justify-center gap-4 text-left lg:border-r lg:border-[#E3EBF5] lg:last:border-r-0"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F2F5F] to-[#1459B8] text-white shadow-lg shadow-blue-900/25 ring-4 ring-blue-50 transition duration-300 group-hover:-translate-y-1 group-hover:from-[#F97316] group-hover:to-[#FB8A2E] group-hover:shadow-orange-500/35 group-hover:ring-orange-100">
                  <Icon size={24} />
                </span>

                <span className="min-w-0">
                  <span className="block text-3xl font-extrabold leading-none tracking-tight text-[#0F2F5F] sm:text-[2rem]">
                    <CountUp end={end} suffix={suffix} />
                  </span>
                  <span className="mt-1.5 block text-sm font-medium text-slate-500">{label}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
