"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";

import Reveal from "@/components/Reveal";
import { BTN_OUTLINE, BTN_PRIMARY } from "@/components/formStyles";

const STEPS = [
  {
    title: "Student Account Created",
    description:
      "Your student account will be created after successful payment verification.",
  },
  {
    title: "Student ID Generated",
    description:
      "Your unique student ID will be generated and associated with your registration.",
  },
  {
    title: "Access Your Learning Portal",
    description:
      "Once your account is ready, you can access your courses, progress, assignments and certificates through the student portal.",
  },
];

export default function RegistrationSuccessPage() {
  return (
    <section className="bg-[#F7F9FC] px-5 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
          {/* Header */}
          <div className="relative overflow-hidden bg-[#173B67] px-6 py-9 text-center text-white sm:px-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

            <Reveal className="relative">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-900/30">
                  <CheckCircle2 size={34} className="text-white" />
                </div>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Registration Successful
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                Your payment has been successfully verified and your
                registration is complete.
              </p>
            </Reveal>
          </div>

          {/* Content */}
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <Reveal delay={100}>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <h2 className="font-bold text-emerald-800">
                      Payment Verified
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      Thank you for registering with SK Computer Education.
                      Your payment has been verified successfully.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-[#173B67]">
                What Happens Next?
              </h2>

              <div className="mt-5 space-y-3">
                {STEPS.map((step, index) => (
                  <Reveal key={step.title} delay={index * 100}>
                    <div className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition duration-200 hover:border-orange-200 hover:bg-orange-50/40">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-500 transition-colors duration-200 group-hover:bg-orange-500 group-hover:text-white">
                        {index + 1}
                      </span>

                      <div>
                        <h3 className="font-bold text-[#173B67]">
                          {step.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/login" className={`${BTN_PRIMARY} group`}>
                Login to Student Portal
                <ArrowRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link href="/courses" className={BTN_OUTLINE}>
                <BookOpen size={17} />
                Explore Courses
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <LayoutDashboard
                size={19}
                className="mt-0.5 shrink-0 text-[#173B67]"
              />

              <p className="text-sm leading-6 text-slate-600">
                Your student dashboard will contain your enrolled courses,
                learning progress, assignments, certificates and other
                student services.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Thank you for choosing SK Computer Education.
        </p>
      </div>
    </section>
  );
}
