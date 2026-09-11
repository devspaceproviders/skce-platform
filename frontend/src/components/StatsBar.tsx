import { Users, BookOpen, Clock, Award } from "lucide-react";

const STATS = [
  { icon: Users, value: "5,000+", label: "Students Trained" },
  { icon: BookOpen, value: "20+", label: "Courses Offered" },
  { icon: Clock, value: "10+", label: "Years of Excellence" },
  { icon: Award, value: "98%", label: "Student Satisfaction" },
];

export default function StatsBar() {
  return (
    <section className="border-b border-slate-100 py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand">
              <Icon size={20} />
            </span>
            <span className="text-3xl font-extrabold text-slate-900">{value}</span>
            <span className="mt-1 text-sm text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
