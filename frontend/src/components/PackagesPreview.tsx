"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";

import { getPackages, type CoursePackage } from "@/lib/api";

export default function PackagesPreview() {
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      try {
        setLoading(true);
        setError("");

        const data = await getPackages();

        if (!cancelled) {
          setPackages(data);
        }
      } catch (err) {
        console.error("Failed to load packages:", err);

        if (!cancelled) {
          setError("Unable to load packages. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Learning Packages
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
            Choose the Right Package for You
          </h2>

          <p className="mt-4 text-slate-500">
            Flexible learning packages designed for school students, college
            students, jobseekers, business users and lifelong learners.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-1.5 bg-gradient-to-r from-[#173B67] to-orange-500" />

                <div className="p-7">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />

                  <div className="mt-4 h-12 animate-pulse rounded bg-slate-100" />

                  <div className="mt-6 h-9 w-1/2 animate-pulse rounded bg-slate-200" />

                  <div className="mt-7 space-y-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </div>

                  <div className="mt-7 h-11 animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Package Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const courses = pkg.courses ?? [];
              const visibleCourses = courses.slice(0, 5);
              const remainingCourses =
                courses.length - visibleCourses.length;

              return (
                <div
                  key={pkg.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Top Accent */}
                  <div className="h-1.5 bg-gradient-to-r from-[#173B67] to-orange-500" />

                  <div className="flex flex-1 flex-col p-7">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-[#102A43]">
                      {pkg.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">
                      {pkg.description ||
                        "Explore this learning package."}
                    </p>

                    {/* Price */}
                    <div className="mt-6">
                      <span className="text-3xl font-extrabold text-[#173B67]">
                        ₹{pkg.price.toLocaleString("en-IN")}
                      </span>

                      <span className="ml-2 text-sm text-slate-400">
                        package
                      </span>
                    </div>

                    {/* Included Courses */}
                    <div className="mt-6">
                      <p className="mb-3 text-sm font-bold text-slate-800">
                        PACKAGE INCLUDES
                      </p>

                      {courses.length > 0 ? (
                        <div className="space-y-2">
                          {visibleCourses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                <Check size={11} strokeWidth={3} />
                              </span>

                              <span>{course.title}</span>
                            </div>
                          ))}

                          {remainingCourses > 0 && (
                            <p className="pt-1 text-xs font-semibold text-[#173B67]">
                              + {remainingCourses} more courses
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Courses will be available soon.
                        </p>
                      )}
                    </div>

                    {/* Button */}
                    <div className="mt-auto pt-7">
                      <Link
                        href={`/packages/${pkg.slug}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
                      >
                        View Package
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Packages Link */}
        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#173B67] transition hover:text-orange-500"
          >
            View All Courses & Packages
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}