import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Users,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-orange-50/50">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-[-100px] h-96 w-96 rounded-full bg-orange-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px] px-6 lg:px-10">
        <div className="grid min-h-[calc(100vh-80px)] items-center gap-4 lg:grid-cols-[52%_48%]">
          
          {/* ================= LEFT CONTENT ================= */}
          <div className="relative z-10 py-14 sm:py-16 lg:py-12">
            
            {/* Admissions */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-[#173B67]">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Admissions Open — 2026 Batches
            </div>

            {/* Brand */}
            <div className="mt-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#173B67]">
              <span>SK Computer Education</span>
              <span className="h-px w-12 bg-blue-300" />
            </div>

            {/* Heading */}
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight text-[#173B67] sm:text-5xl lg:text-[4.35rem]">
              Build{" "}
              <span className="text-blue-600">Practical Skills.</span>
              <br />
              Shape Your{" "}
              <span className="text-blue-600">Career.</span>
            </h1>

            {/* Main description */}
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              SK Computer Education offers practical training in Computer
              Basics, MS Office, DCA, PGDCA, Programming, Python, Java, AI
              Skills, Digital Marketing and job-oriented courses.
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Learn with structured courses, experienced trainers and
              hands-on practice designed to build useful skills for study,
              work and career growth.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
              >
                <BookOpen size={18} />
                Explore Courses
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#173B67] bg-white px-6 py-3.5 text-sm font-bold text-[#173B67] transition hover:bg-blue-50"
              >
                <GraduationCap size={18} />
                Enroll Now
              </Link>
            </div>

            {/* Features */}
            <div className="mt-10 grid grid-cols-2 border-t border-slate-200 pt-7 sm:grid-cols-4">
              <HeroFeature
                icon={<GraduationCap size={21} />}
                title="Wide Range"
                subtitle="of Courses"
              />

              <HeroFeature
                icon={<Users size={21} />}
                title="Expert"
                subtitle="Trainers"
              />

              <HeroFeature
                icon={<BookOpen size={21} />}
                title="Hands-on"
                subtitle="Practical Training"
              />

              <HeroFeature
                icon={<BriefcaseBusiness size={21} />}
                title="Job-Oriented"
                subtitle="Programs"
              />
            </div>
          </div>

          {/* ================= RIGHT VISUAL ================= */}
          <div className="relative flex min-h-[430px] items-center justify-center lg:min-h-[650px]">
            
            {/* Soft visual background */}
            <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-100/35 blur-3xl" />

            {/* People image */}
            <div className="relative z-10 w-full max-w-[720px] lg:-ml-8 lg:scale-[1.05]">
              <Image
                src="/images/skce-hero-banner.png"
                alt="Students learning practical computer skills at SK Computer Education"
                width={1000}
                height={800}
                priority
                className="h-auto w-full object-contain"
              />
            </div>

            {/* Practical learning card */}
            <div className="absolute left-0 top-[18%] z-20 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <BookOpen size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">Learning</p>
                  <p className="text-sm font-bold text-[#173B67]">
                    Practical Skills
                  </p>
                </div>
              </div>
            </div>

            {/* Career card */}
            <div className="absolute bottom-[13%] right-1 z-20 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BriefcaseBusiness size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">Career Focus</p>
                  <p className="text-sm font-bold text-[#173B67]">
                    Job-Ready Learning
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroFeature({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-slate-200 py-2 sm:border-r sm:px-5 sm:py-0 first:pl-0 last:border-r-0">
      <div className="shrink-0 text-[#173B67]">{icon}</div>

      <div>
        <p className="text-sm font-semibold leading-tight text-[#173B67]">
          {title}
        </p>

        <p className="text-xs leading-tight text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}