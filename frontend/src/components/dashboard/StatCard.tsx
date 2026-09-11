import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: string; // tailwind text/bg color classes
}

export default function StatCard({ icon: Icon, label, value, accent = "text-brand bg-blue-50" }: StatCardProps) {
  const [textClass, bgClass] = accent.split(" ");
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${bgClass} ${textClass}`}>
        <Icon size={18} />
      </span>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}
