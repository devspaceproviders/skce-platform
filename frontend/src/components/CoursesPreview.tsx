import Link from "next/link";
import CourseCard from "./CourseCard";
import { getCourses } from "@/lib/api";

export default async function CoursesPreview() {
  const courses = await getCourses();

  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Our Courses
          </h2>
          <p className="mt-3 text-slate-500">
            Industry-aligned curricula designed to get you job-ready from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-block rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
          >
            View All Courses
          </Link>
        </div>
      </div>
    </section>
  );
}
