import Link from "next/link";
import { Clock, BookOpen, Users, ArrowRight } from "lucide-react";
import { Course } from "@/types";

const MODE_STYLES: Record<string, string> = {
  Online: "bg-blue-50 text-blue-700",
  Offline: "bg-slate-100 text-slate-600",
  Hybrid: "bg-emerald-50 text-emerald-700",
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
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-t-4 border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${course.accentColor ?? ""}`}
    >
      {/* Course Image */}
      {course.imageUrl ? (
        <div className="h-48 w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
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
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug text-[#173B67]">
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

        <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
          {course.description}
        </p>

        {stats.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            {stats.map(({ icon: Icon, value, singular, plural }) => (
              <span key={plural} className="flex items-center gap-1.5">
                <Icon size={14} className="text-slate-400" />
                {singular === "Enrolled"
                  ? `${value} Enrolled`
                  : `${value} ${value === 1 ? singular : plural}`}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-blue-600 transition-all duration-300 hover:gap-2.5 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
