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


const HERO_CSS = `
@keyframes skRise {
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes skSlideIn {
  from { opacity: 0; transform: translateX(48px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes skFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes skDrift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(24px, 18px, 0); }
}
@keyframes skUnderline {
  to { background-size: 100% 6px; }
}
.sk-rise { animation: skRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
.sk-slide-in { animation: skSlideIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
.sk-float { animation: skFloat 5s ease-in-out infinite; }
.sk-drift { animation: skDrift 14s ease-in-out infinite; }
.sk-underline {
  background: linear-gradient(90deg, #ff6b00, #ff9a3c) no-repeat 0 94% / 0% 6px;
  animation: skUnderline 0.9s ease-out 0.9s forwards;
}
.sk-underline-late { animation-delay: 1.3s; }
.sk-shine { position: relative; overflow: hidden; }
.sk-shine::before {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: -60%;
  width: 40%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent);
  transform: skewX(-20deg);
  transition: left 0.7s ease;
}
.sk-shine:hover::before { left: 130%; }
@media (prefers-reduced-motion: reduce) {
  .sk-rise, .sk-slide-in, .sk-float, .sk-drift { animation: none; }
  .sk-underline { animation: none; background-size: 100% 6px; }
  .sk-shine::before { display: none; }
}
`;

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-orange-50/50">
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      {/* Slowly drifting background glows */}
      <div className="sk-drift pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      <div
        className="sk-drift pointer-events-none absolute right-[-120px] top-[-100px] h-96 w-96 rounded-full bg-orange-100/60 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />

      <div className="relative mx-auto max-w-[1500px] px-6 lg:px-10">
        <div className="grid items-center gap-2 lg:grid-cols-[52%_48%]">
          {/* ================= LEFT CONTENT ================= */}
          <div className="relative z-10 py-8 sm:py-12 lg:py-10">
            {/* Brand */}
            <div
              className="sk-rise flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#173B67]"
              style={{ animationDelay: "0ms" }}
            >
              <span>SK Computer Education</span>
              <span className="h-px w-12 bg-blue-300" />
            </div>

            {/* Heading */}
            <h1
              className="sk-rise mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[#173B67] sm:text-5xl lg:text-[3.9rem]"
              style={{ animationDelay: "90ms" }}
            >
              Build{" "}
              <span className="sk-underline text-blue-600">
                Practical Skills.
              </span>
              <br />
              Shape Your{" "}
              <span className="sk-underline sk-underline-late text-blue-600">
                Career.
              </span>
            </h1>

            {/* Main description */}
            <p
              className="sk-rise mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              SK Computer Education offers practical training in Computer
              Basics, MS Office, DCA, PGDCA, Programming, Python, Java, AI
              Skills, Digital Marketing and job-oriented courses.
            </p>

            <p
              className="sk-rise mt-2.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base"
              style={{ animationDelay: "250ms" }}
            >
              Learn with structured courses, experienced trainers and
              hands-on practice designed to build useful skills for study,
              work and career growth.
            </p>

            {/* Buttons */}
            <div
              className="sk-rise mt-7 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "330ms" }}
            >
              <Link
                href="/courses"
                className="sk-shine group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
              >
                <BookOpen size={18} />
                Explore Courses
                <ArrowRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#173B67] bg-white px-6 text-sm font-semibold text-[#173B67] transition duration-200 hover:-translate-y-0.5 hover:bg-[#173B67] hover:text-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
              >
                <GraduationCap
                  size={18}
                  className="transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
                />
                Enroll Now
              </Link>
            </div>

            {/* Features */}
            <div
              className="sk-rise mt-8 grid grid-cols-2 gap-y-4 border-t border-slate-200 pt-6 sm:grid-cols-4 sm:gap-y-0"
              style={{ animationDelay: "420ms" }}
            >
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
          <div className="sk-slide-in relative flex min-h-[340px] items-center justify-center sm:min-h-[420px] lg:min-h-[560px]">
            <div className="absolute right-0 top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl" />

            {/* People image */}
            <div className="relative z-10 w-full max-w-[700px] lg:-ml-8 lg:scale-[1.04]">
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
            <div
              className="sk-float absolute left-0 top-[14%] z-20 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-xl shadow-blue-900/10 backdrop-blur-sm sm:left-2 sm:top-[18%] sm:px-4"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <BookOpen size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">Learning</p>
                  <p className="text-sm font-semibold text-[#173B67]">
                    Practical Skills
                  </p>
                </div>
              </div>
            </div>

            {/* Career card */}
            <div
              className="sk-float absolute bottom-[10%] right-1 z-20 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-xl shadow-blue-900/10 backdrop-blur-sm sm:bottom-[13%] sm:px-4"
              style={{ animationDelay: "-2.5s" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BriefcaseBusiness size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">Career Focus</p>
                  <p className="text-sm font-semibold text-[#173B67]">
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
    <div className="group flex items-center gap-3 border-slate-200 sm:border-r sm:px-5 first:pl-0 last:border-r-0">
      <div className="shrink-0 text-[#173B67] transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:text-orange-500">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold leading-tight text-[#173B67]">
          {title}
        </p>

        <p className="text-xs leading-tight text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
