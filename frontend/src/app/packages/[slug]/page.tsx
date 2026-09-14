import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
} from "lucide-react";
import {
  PACKAGE_OPTIONS,
  getPackageBySlug,
} from "@/lib/packageList";

export async function generateStaticParams() {
  return PACKAGE_OPTIONS.map((pkg) => ({
    slug: pkg.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const pkg = getPackageBySlug(params.slug);

  return {
    title: pkg
      ? `${pkg.title} — SK Computer Education`
      : "Package — SK Computer Education",
  };
}

export default function PackageDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const pkg = getPackageBySlug(params.slug);

  if (!pkg) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section className="bg-brand-dark px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">

          <Link
            href="/courses"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300"
          >
            <ArrowLeft size={16} />
            Back to Courses
          </Link>

          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500">
              <Package size={30} />
            </div>

            <div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-400">
                SK Computer Education Package
              </p>

              <h1 className="text-3xl font-extrabold sm:text-4xl">
                {pkg.title}
              </h1>

              <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
                {pkg.description}
              </p>

            </div>

          </div>
        </div>
      </section>


      {/* Content */}
      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">

          {/* Courses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="mb-7">

              <h2 className="text-2xl font-extrabold text-slate-900">
                Courses Included
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                This package includes{" "}
                <span className="font-semibold text-slate-700">
                  {pkg.courses.length}
                </span>{" "}
                learning areas.
              </p>

            </div>


            <div className="grid gap-3 sm:grid-cols-2">

              {pkg.courses.map((course, index) => (
                <div
                  key={`${course}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Check
                      size={14}
                      className="text-orange-600"
                    />
                  </div>

                  <span className="text-sm font-medium text-slate-700">
                    {course}
                  </span>
                </div>
              ))}

            </div>

          </div>


          {/* Side Card */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Package
                className="text-orange-500"
                size={23}
              />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {pkg.title}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Complete package designed to build practical
              skills and support your learning goals.
            </p>


            <div className="my-6 border-t border-slate-200 pt-5">

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Learning Areas
                </span>

                <span className="font-bold text-slate-900">
                  {pkg.courses.length}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-slate-500">
                  Package Price
                </span>

                <span className="text-xl font-extrabold text-orange-600">
                  ₹{pkg.price.toLocaleString("en-IN")}
                </span>
              </div>

            </div>


            <Link
              href={`/register?package=${pkg.slug}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Register Now
              <ArrowRight size={17} />
            </Link>


            <Link
              href="/courses"
              className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View All Courses
            </Link>

          </aside>

        </div>
      </section>

    </main>
  );
}