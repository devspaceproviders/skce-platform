"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Package,
} from "lucide-react";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type PackageItem = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  courses: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    mode: string;
    isActive: boolean;
  }[];
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/packages`);

        if (!response.ok) {
          throw new Error("Failed to load packages");
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setPackages(
            result.data.filter(
              (pkg: PackageItem) => pkg.isActive
            )
          );
        } else {
          throw new Error("Invalid package response");
        }
      } catch (err) {
        console.error("Error loading packages:", err);
        setError(
          "Unable to load packages. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPackages();
  }, []);

  return (
    <main className="bg-[#F7F9FC]">
      <PageHero
        eyebrow="SK Computer Education Learning Packages"
        title="Choose the Right Package for You"
        description="Practical computer and career-focused learning packages designed for different learning goals and stages of life."
        contentWidth="max-w-3xl"
      />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#E6EEF9] via-[#F4F7FC] to-[#E6EEF9] px-6 py-10 sm:py-14">
        <div className="sk-hero-orb pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="sk-hero-orb-2 pointer-events-none absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          {/* Loading */}
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
                  <div className="h-52 animate-pulse bg-slate-100" />

                  <div className="p-7">
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

          {/* Error */}
          {!loading && error && (
            <div
              role="alert"
              className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
            >
              <AlertCircle size={26} className="mx-auto text-red-500" />

              <p className="mt-3 text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && packages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <Package size={26} className="text-orange-500" />
              </div>

              <p className="mt-4 text-slate-500">
                No packages are currently available.
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && !error && packages.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg, index) => (
                <Reveal
                  key={pkg.id}
                  delay={(index % 3) * 100}
                  className="h-full"
                >
                  <div className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] text-white shadow-lg shadow-blue-950/15 ring-1 ring-[#173B67]/20 transition duration-300 hover:-translate-y-1.5 hover:border-orange-400/50 hover:shadow-2xl hover:shadow-blue-950/30">
                    <div className="pointer-events-none absolute -right-16 bottom-0 -z-10 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -left-16 top-1/3 -z-10 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
                    {/* Package Image */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      {pkg.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${API_URL.replace(
                            "/api",
                            ""
                          )}${pkg.imageUrl}`}
                          alt={pkg.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#173B67] to-[#0F2F5F]">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                            <Package size={32} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accent */}
                    <div className="h-1 bg-gradient-to-r from-[#173B67] to-orange-500" />

                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <h2 className="text-2xl font-bold text-white">
                        {pkg.title}
                      </h2>

                      <p className="mt-3 min-h-[48px] text-sm leading-6 text-blue-100/80">
                        {pkg.description}
                      </p>

                      <div className="mt-5">
                        <span className="text-4xl font-extrabold tracking-tight text-white">
                          ₹{Number(pkg.price).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="mt-6 border-t border-white/10 pt-5">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-orange-300">
                          Package Includes
                        </h3>

                        <div className="space-y-2.5">
                          {pkg.courses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-start gap-2.5 text-sm text-blue-100/90"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                                <Check size={12} strokeWidth={3} />
                              </span>

                              <span>{course.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-7">
                        <Link
                          href={`/packages/${pkg.slug}`}
                          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-md shadow-orange-900/30 transition duration-200 hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:scale-[0.99]"
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
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
