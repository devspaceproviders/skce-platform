
import CourseCard from "@/components/CourseCard";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { getCourses } from "@/lib/api";

export const metadata = {
  title: "Courses — SK Computer Education",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <main className="bg-gradient-to-b from-[#E6EEF9] via-[#F4F7FC] to-[#E6EEF9]">
      <PageHero
        eyebrow="Learn With SK Computer Education"
        title="All Courses"
        description="Explore our individual courses and build practical computer, programming, digital and career-focused skills at your own pace."
        contentWidth="max-w-3xl"
      />

      <section className="relative isolate overflow-hidden px-6 py-12 sm:py-16">
        <div className="sk-hero-orb pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="sk-hero-orb-2 pointer-events-none absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center">
              <p className="text-slate-600">
                No courses are currently available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <Reveal
                  key={course.id}
                  delay={(index % 3) * 100}
                  className="h-full"
                >
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
