"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Package,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { getPackages, type CoursePackage } from "@/lib/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const API_BASE_URL = API_URL.replace(/\/api\/?$/, "");

const VISIBLE_COURSES = 5;

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl}`;
}

/*
 * The backend currently returns package courses as objects.
 * Older data may still contain strings, so normalize both shapes.
 */
function getCourseTitle(course: unknown): string {
  if (typeof course === "string") {
    return course;
  }

  if (
    course &&
    typeof course === "object" &&
    "title" in course &&
    typeof (course as { title: unknown }).title === "string"
  ) {
    return (course as { title: string }).title;
  }

  return "";
}

function CourseRow({ title }: { title: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-slate-600">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <Check size={11} strokeWidth={3} />
      </span>

      <span>{title}</span>
    </div>
  );
}

function PackageIncludes({ titles }: { titles: string[] }) {
  if (titles.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Courses will be available soon.
      </p>
    );
  }

  const firstCourses = titles.slice(0, VISIBLE_COURSES);
  const remaining = titles.length - firstCourses.length;

  return (
    <div className="space-y-2.5">
      {firstCourses.map((course, index) => (
        <CourseRow key={`${course}-${index}`} title={course} />
      ))}

      {remaining > 0 && (
        <p className="pt-1 text-xs font-semibold text-blue-600">
          + {remaining} more courses
        </p>
      )}
    </div>
  );
}

export default function PackagesPreview() {
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [reloadKey]);

  return (
    <section className="bg-white px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Learning Packages"
          title="Choose the Right Package for You"
          description="Flexible learning packages designed for school students, college students, jobseekers, business users and lifelong learners."
          className="max-w-3xl"
        />

        {/* Loading State */}
        {loading && (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
          >
            <span className="sr-only">Loading packages...</span>

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-1 bg-gradient-to-r from-[#173B67] to-orange-500" />

                <div className="h-48 animate-pulse bg-slate-100" />

                <div className="p-6 sm:p-7">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />

                  <div className="mt-4 h-12 animate-pulse rounded bg-slate-100" />

                  <div className="mt-6 h-9 w-1/2 animate-pulse rounded bg-slate-200" />

                  <div className="mt-7 space-y-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </div>

                  <div className="mt-7 h-11 animate-pulse rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
          >
            <AlertCircle size={26} className="mx-auto text-red-500" />

            <p className="mt-3 text-sm font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#173B67] px-5 text-sm font-semibold text-white transition duration-200 hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && packages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <Package size={26} className="text-orange-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
              Packages are coming soon
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              New learning packages will appear here shortly.
            </p>
          </div>
        )}

        {/* Package Cards */}
        {!loading && !error && packages.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => {
              const courseTitles = ((pkg.courses ?? []) as unknown[])
                .map(getCourseTitle)
                .filter(Boolean);

              const imageUrl = getImageUrl(pkg.imageUrl);

              return (
                <Reveal
                  key={pkg.id}
                  delay={(index % 3) * 100}
                  className="h-full"
                >
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl hover:shadow-blue-900/10">
                    {/* Top Accent */}
                    <div className="h-1 bg-gradient-to-r from-[#173B67] to-orange-500" />

                    {/* Package Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={pkg.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <Package
                            size={48}
                            strokeWidth={1.5}
                            className="text-slate-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-[#173B67]">
                        {pkg.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">
                        {pkg.description || "Explore this learning package."}
                      </p>

                      {/* Price */}
                      <div className="mt-5 flex items-baseline">
                        <span className="text-3xl font-bold tracking-tight text-[#173B67]">
                          ₹{pkg.price.toLocaleString("en-IN")}
                        </span>

                        <span className="ml-2 text-sm text-slate-400">
                          package
                        </span>
                      </div>

                      {/* Included Courses */}
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Package includes
                        </p>

                        <PackageIncludes titles={courseTitles} />
                      </div>

                      {/* Button */}
                      <div className="mt-auto pt-7">
                        <Link
                          href={`/packages/${pkg.slug}`}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173B67] px-5 text-sm font-semibold text-white transition duration-200 hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:scale-[0.99]"
                        >
                          View Package
                          <ArrowRight
                            size={16}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* All Packages Link */}
        <div className="mt-8 text-center">
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#173B67] transition-colors duration-200 hover:text-orange-500"
          >
            View All Courses & Packages
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
