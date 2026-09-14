"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";

export default function RegistrationSuccessPage() {
  return (
    <section className="min-h-screen bg-slate-50 px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="bg-[#173B67] px-6 py-10 text-center text-white sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                <CheckCircle2
                  size={34}
                  className="text-white"
                />
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Registration Successful
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              Your payment has been successfully verified and
              your registration is complete.
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 sm:px-10 sm:py-10">

            {/* Success message */}
            <div className="rounded-xl border border-green-100 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <div>
                  <h2 className="font-bold text-green-800">
                    Payment Verified
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    Thank you for registering with SK Computer
                    Education. Your payment has been verified
                    successfully.
                  </p>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="mt-8">
              <h2 className="text-xl font-extrabold text-[#102A43]">
                What Happens Next?
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-500">
                    1
                  </span>

                  <div>
                    <h3 className="font-bold text-[#173B67]">
                      Student Account Created
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Your student account will be created after
                      successful payment verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-500">
                    2
                  </span>

                  <div>
                    <h3 className="font-bold text-[#173B67]">
                      Student ID Generated
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Your unique student ID will be generated
                      and associated with your registration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-500">
                    3
                  </span>

                  <div>
                    <h3 className="font-bold text-[#173B67]">
                      Access Your Learning Portal
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Once your account is ready, you can access
                      your courses, progress, assignments and
                      certificates through the student portal.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
              >
                Login to Student Portal
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/courses"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#173B67] px-5 py-3.5 text-sm font-semibold text-[#173B67] transition hover:bg-[#173B67] hover:text-white"
              >
                <BookOpen size={17} />
                Explore Courses
              </Link>

            </div>

            {/* Dashboard note */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <LayoutDashboard
                size={19}
                className="mt-0.5 shrink-0 text-[#173B67]"
              />

              <p className="text-sm leading-6 text-slate-600">
                Your student dashboard will contain your enrolled
                courses, learning progress, assignments,
                certificates and other student services.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Thank you for choosing SK Computer Education.
        </p>

      </div>
    </section>
  );
}