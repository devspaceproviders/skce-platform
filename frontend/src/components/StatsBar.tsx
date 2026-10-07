import { Users, BookOpen, Clock, Award } from "lucide-react";

import CountUp from "./CountUp";
import Reveal from "./Reveal";

const STATS = [
  { icon: Users, end: 5000, suffix: "+", label: "Students Trained" },
  { icon: BookOpen, end: 20, suffix: "+", label: "Courses Offered" },
  { icon: Clock, end: 10, suffix: "+", label: "Years of Excellence" },
  { icon: Award, end: 98, suffix: "%", label: "Student Satisfaction" },
];

export default function StatsBar() {
  return (
    <section className="border-y border-slate-100 bg-white py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-6 lg:grid-cols-4 lg:gap-x-0">
        {STATS.map(({ icon: Icon, end, suffix, label }, index) => (
          <Reveal
            key={label}
            delay={index * 100}
            className="group flex flex-col items-center text-center lg:border-r lg:border-slate-100 lg:last:border-r-0"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-300 group-hover:-translate-y-1 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-500/30">
              <Icon size={20} />
            </span>

            <span className="text-3xl font-bold tracking-tight text-[#173B67]">
              <CountUp end={end} suffix={suffix} />
            </span>

            <span className="mt-1 text-sm text-slate-500">{label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
