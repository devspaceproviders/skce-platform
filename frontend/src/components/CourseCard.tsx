import Link from "next/link";
import { Clock, BookOpen, Users, ArrowRight } from "lucide-react";
import { Course } from "@/types";

const MODE_STYLES: Record<Course["mode"], string> = {
  Online: "bg-blue-50 text-blue-600",
  Offline: "bg-slate-100 text-slate-600",
  Hybrid: "bg-emerald-50 text-emerald-600",
};

export default function CourseCard({ course }: { course: Course }) {
  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-t-4 border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${course.accentColor}`}
    >
      {/* Course Image */}
      {course.imageUrl ? (
        <div className="h-48 w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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

      {/* Existing Card Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">
            {course.title}
          </h3>

          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${MODE_STYLES[course.mode]}`}
          >
            {course.mode}
          </span>
        </div>

        <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
          {course.description}
        </p>

        <div className="mb-5 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {course.durationMonths} Months
          </span>

          <span className="flex items-center gap-1">
            <BookOpen size={14} />
            {course.modules} Modules
          </span>

          <span className="flex items-center gap-1">
            <Users size={14} />
            {course.enrolled} Enrolled
          </span>
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="mb-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-300 hover:gap-2.5"
        >
          View Details

          <ArrowRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>

        <div className="flex justify-end">
          <Link
            href={`/register?course=${course.slug}`}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </div>
  );
}