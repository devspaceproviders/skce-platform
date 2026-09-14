import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PACKAGE_OPTIONS } from "@/lib/packageList";

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <section className="bg-[#102A43] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            SKCE Learning Packages
          </p>

          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Choose the Right Package for You
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Practical computer and career-focused learning packages designed
            for different learning goals and stages of life.
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {PACKAGE_OPTIONS.map((pkg) => (
              <div
                key={pkg.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Accent */}
                <div className="h-1.5 bg-gradient-to-r from-[#173B67] to-orange-500" />

                <div className="flex flex-1 flex-col p-7">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-[#102A43]">
                    {pkg.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-[#173B67]">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Courses */}
                  <div className="mt-7">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-800">
                      Package Includes
                    </h3>

                    <div className="space-y-2.5">
                      {pkg.courses.map((course) => (
                        <div
                          key={course}
                          className="flex items-start gap-2.5 text-sm text-slate-600"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <Check size={12} strokeWidth={3} />
                          </span>

                          <span>{course}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Button */}
                  <div className="mt-auto pt-8">
                    <Link
                      href={`/packages/${pkg.slug}`}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
                    >
                      View Package
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}