import Link from "next/link";
import { Clock, BookOpen, Users, ArrowRight } from "lucide-react";
import { Course } from "@/types";

const MODE_STYLES: Record<string, string> = {
  Online: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30",
  Offline: "bg-white/10 text-blue-100 ring-1 ring-white/15",
  Hybrid: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30",
};

/**
 * The database may return the mode in any case (e.g. "ONLINE").
 * Normalise it so the badge style and label always match.
 */
function normalizeMode(mode: unknown): string {
  const text = String(mode ?? "").trim();

  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export default function CourseCard({ course }: { course: Course }) {
  const mode = normalizeMode(course.mode);

  // Only show a stat when the backend actually returned a value for it.
  const stats = [
    {
      icon: Clock,
      value: Number(course.durationMonths),
      singular: "Month",
      plural: "Months",
    },
    {
      icon: BookOpen,
      value: Number(course.modules),
      singular: "Module",
      plural: "Modules",
    },
    {
      icon: Users,
      value: Number(course.enrolled),
      singular: "Enrolled",
      plural: "Enrolled",
    },
  ].filter((stat) => stat.value > 0);

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden relative isolate rounded-2xl border border-t-4 border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] text-white shadow-lg shadow-blue-950/15 ring-1 ring-[#173B67]/20 transition duration-300 hover:-translate-y-1.5 hover:border-orange-400/50 hover:shadow-2xl hover:shadow-blue-950/30 ${course.accentColor ?? ""}`}
    >
      {/* Course Image */}
      {course.imageUrl ? (
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0F2F5F] to-transparent" />
        </div>
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
          <div className="text-center">
            <BookOpen className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-400">
              No Image
            </p>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="pointer-events-none absolute -right-16 bottom-0 -z-10 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 top-1/3 -z-10 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-white">
            {course.title}
          </h3>

          {mode && (
            <span
              className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${
                MODE_STYLES[mode] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {mode}
            </span>
          )}
        </div>

        <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-blue-100/80">
          {course.description}
        </p>

        {stats.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-blue-100/80">
            {stats.map(({ icon: Icon, value, singular, plural }) => (
              <span key={plural} className="flex items-center gap-1.5">
                <Icon size={14} className="text-orange-300" />
                {singular === "Enrolled"
                  ? `${value} Enrolled`
                  : `${value} ${value === 1 ? singular : plural}`}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-white transition-all duration-300 hover:gap-2.5 hover:text-orange-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            View Details
            <ArrowRight size={15} />
          </Link>

          <Link
            href={`/register?course=${course.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </div>
  );
}
