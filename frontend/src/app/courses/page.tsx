import Link from "next/link";
import { ArrowRight, Check, Package, BookOpen } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { getCourses, getPackages } from "@/lib/api";

export const metadata = {
  title: "Courses & Packages — SK Computer Education",
};

export default async function CoursesPage() {
  const [courses, packages] = await Promise.all([
    getCourses(),
    getPackages(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =========================================================
          ALL COURSES
      ========================================================= */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
              Learn With SKCE
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-[#102A43] sm:text-5xl">
              All Courses
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Explore our individual courses and build practical computer,
              programming, digital and career-focused skills at your own pace.
            </p>
          </div>

          {/* Individual Courses */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PACKAGES
      ========================================================= */}
      <section
        id="packages"
        className="border-t border-slate-200 bg-white px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          {/* Package Heading */}
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
                <Package className="h-7 w-7 text-orange-500" />
              </div>
            </div>

            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
              Learning Packages
            </p>

            <h2 className="text-4xl font-extrabold tracking-tight text-[#102A43] sm:text-5xl">
              Choose Your Package
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Get a complete learning path designed around your goals, whether
              you are a school student, college student, jobseeker, homemaker
              or looking for everything in one package.
            </p>
          </div>

          {/* Package Cards */}
          {packages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-slate-500">
                No learning packages are currently available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                >
                  {/* Package Image */}
                  {pkg.imageUrl ? (
                    <div className="h-48 w-full overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
                      <div className="text-center">
                        <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-400">
                          No Image
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Package Header */}
                  <div className="bg-[#173B67] p-6 text-white">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500">
                        <Package size={21} />
                      </div>

                      <h3 className="text-xl font-bold">
                        {pkg.title}
                      </h3>
                    </div>

                    <p className="text-sm leading-6 text-blue-100">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Package Content */}
                  <div className="flex flex-1 flex-col p-6">
                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-3xl font-extrabold text-[#173B67]">
                        ₹{Number(pkg.price).toLocaleString("en-IN")}
                      </span>

                      <span className="ml-2 text-sm text-slate-400">
                        package
                      </span>
                    </div>

                    {/* Course Count */}
                    <div className="mb-5">
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-700">
                        Package Includes
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {pkg.courses?.length ?? 0} learning areas
                      </p>
                    </div>

                    {/* Courses */}
                    <ul className="flex-1 space-y-3">
                      {(pkg.courses ?? [])
                        .slice(0, 8)
                        .map((course) => (
                          <li
                            key={course.id}
                            className="flex items-start gap-3 text-sm text-slate-600"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                              <Check
                                size={13}
                                strokeWidth={3}
                              />
                            </span>

                            <span>{course.title}</span>
                          </li>
                        ))}

                      {(pkg.courses?.length ?? 0) > 8 && (
                        <li className="pt-1 text-sm font-semibold text-orange-500">
                          + {(pkg.courses?.length ?? 0) - 8} more learning
                          areas
                        </li>
                      )}
                    </ul>

                    {/* View Package */}
                    <Link
                      href={`/packages/${pkg.slug}`}
                      className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      View Package
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}