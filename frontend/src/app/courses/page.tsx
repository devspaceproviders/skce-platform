import CourseCard from "@/components/CourseCard";
import { getCourses } from "@/lib/api";

export const metadata = { title: "Courses — SKCE" };

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">All Courses</h1>
          <p className="mt-3 text-slate-500">
            Industry-aligned curricula designed to get you job-ready from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
