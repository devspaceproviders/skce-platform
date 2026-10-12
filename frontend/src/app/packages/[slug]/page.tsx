import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
} from "lucide-react";

import Reveal from "@/components/Reveal";
import { getPackageBySlug } from "@/lib/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const revalidate = 60;

function getMediaUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_ORIGIN}${url}`;
  }

  return `${API_ORIGIN}/${url}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const pkg = await getPackageBySlug(params.slug);

  return {
    title: pkg
      ? `${pkg.title} — SK Computer Education`
      : "Package — SK Computer Education",
    description:
      pkg?.description ||
      "SK Computer Education learning package",
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const pkg = await getPackageBySlug(params.slug);

  if (!pkg) {
    notFound();
  }

  const courses = pkg.courses ?? [];

  const packageImageUrl = getMediaUrl(pkg.imageUrl);

  return (
    <main className="bg-[#F7F9FC]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#173B67] px-6 py-10 text-white sm:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />

        <Reveal className="relative mx-auto max-w-5xl">
          <Link
            href="/packages"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 transition-colors hover:text-orange-300"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to Packages
          </Link>

          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg sm:h-32 sm:w-32">
              {packageImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={packageImageUrl}
                  alt={pkg.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
                  <Package size={42} />
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">
                SK Computer Education Package
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {pkg.title}
              </h1>

              <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
                {pkg.description}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Content */}
      <section className="px-6 py-10 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
          {/* Courses */}
          <Reveal>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#173B67]">
                  Courses Included
                </h2>

                <div className="mt-3 h-1 w-12 rounded-full bg-orange-500" />

                <p className="mt-3 text-sm text-slate-500">
                  This package includes{" "}
                  <span className="font-semibold text-slate-700">
                    {courses.length}
                  </span>{" "}
                  learning areas.
                </p>
              </div>

              {courses.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 transition duration-200 hover:border-orange-200 hover:bg-orange-50/50"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 transition-colors duration-200 group-hover:bg-orange-500">
                        <Check
                          size={14}
                          className="text-orange-600 transition-colors duration-200 group-hover:text-white"
                        />
                      </div>

                      <span className="text-sm font-medium text-slate-700">
                        {course.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    Courses will be available soon.
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          {/* Side Card */}
          <Reveal direction="right" delay={100} className="h-fit lg:sticky lg:top-24">
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <div className="mb-5 h-20 w-20 overflow-hidden rounded-xl bg-orange-100">
                {packageImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={packageImageUrl}
                    alt={pkg.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="text-orange-500" size={30} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-[#173B67]">
                {pkg.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Complete package designed to build practical skills and
                support your learning goals.
              </p>

              <div className="my-6 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Learning Areas</span>

                  <span className="font-bold text-slate-900">
                    {courses.length}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-slate-500">Package Price</span>

                  <span className="text-2xl font-bold text-orange-600">
                    ₹{pkg.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <Link
                href={`/register?package=${pkg.slug}`}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99]"
              >
                Register Now
                <ArrowRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/packages"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                View All Packages
              </Link>
            </aside>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
