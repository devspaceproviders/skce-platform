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
  background: linear-gradient(90deg, #F97316, #FFB15C) no-repeat 0 96% / 0% 6px;
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

@keyframes skGlow {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.08); }
}
@keyframes skOrbit {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-14px, 12px); }
}
.sk-glow { animation: skGlow 6s ease-in-out infinite; }
.sk-orbit { animation: skOrbit 11s ease-in-out infinite; }
.sk-text-orange {
  background: linear-gradient(90deg, #FF9A3C, #F97316 60%, #FFB15C);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.sk-text-sky {
  background: linear-gradient(90deg, #BFDBFE, #7DB7FF 60%, #FFFFFF);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
@media (prefers-reduced-motion: reduce) {
  .sk-rise, .sk-slide-in, .sk-float, .sk-drift, .sk-glow, .sk-orbit { animation: none; }
  .sk-underline { animation: none; background-size: 100% 6px; }
  .sk-shine::before { display: none; }
}
`;

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(118deg,#06172F_0%,#0B2A55_46%,#1459B8_100%)] text-white">
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      {/* Decorative layers: dot grid, rings and glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(90deg,#000,transparent_85%)]"
      />
      <div
        aria-hidden="true"
        className="sk-orbit pointer-events-none absolute -right-24 -top-32 -z-10 h-[520px] w-[520px] rounded-full border border-white/10 shadow-[0_0_0_46px_rgba(255,255,255,0.03),0_0_0_96px_rgba(255,255,255,0.02)]"
      />
      <div
        aria-hidden="true"
        className="sk-glow pointer-events-none absolute -bottom-32 left-[28%] -z-10 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="sk-drift pointer-events-none absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-8 pb-24 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:pb-32 lg:pt-12">
          {/* ================= LEFT CONTENT ================= */}
          <div className="relative z-10">
            <div
              className="sk-rise inline-flex items-center gap-2.5 rounded-full border border-orange-300/30 bg-orange-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-200 backdrop-blur"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_10px_2px_rgba(251,146,60,0.8)]" />
              SK Computer Education
            </div>

            <h1
              className="sk-rise mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.7rem]"
              style={{ animationDelay: "90ms" }}
            >
              Build{" "}
              <span className="sk-underline text-[#FF9A3C]">
                Practical Skills.
              </span>
              <br />
              Shape Your{" "}
              <span className="sk-underline sk-underline-late text-[#9CC7FF]">
                Career.
              </span>
            </h1>

            <p
              className="sk-rise mt-5 max-w-2xl text-base leading-7 text-blue-50/90 sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              SK Computer Education offers practical training in Computer
              Basics, MS Office, DCA, PGDCA, Programming, Python, Java, AI
              Skills, Digital Marketing and job-oriented courses.
            </p>

            <p
              className="sk-rise mt-2.5 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-base"
              style={{ animationDelay: "250ms" }}
            >
              Learn with structured courses, experienced trainers and
              hands-on practice designed to build useful skills for study,
              work and career growth.
            </p>

            <div
              className="sk-rise mt-7 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "330ms" }}
            >
              <Link
                href="/courses"
                className="sk-shine group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB8A2E] px-6 text-sm font-bold text-white shadow-lg shadow-orange-600/35 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2A55] active:translate-y-0 active:scale-[0.98]"
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
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#0F2F5F] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2A55] active:translate-y-0 active:scale-[0.98]"
              >
                <GraduationCap
                  size={18}
                  className="transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
                />
                Enroll Now
              </Link>
            </div>

            <div
              className="sk-rise mt-8 grid grid-cols-2 gap-x-2 gap-y-4 border-t border-white/15 pt-6 sm:grid-cols-4"
              style={{ animationDelay: "420ms" }}
            >
              <HeroFeature icon={<GraduationCap size={20} />} title="Wide Range" subtitle="of Courses" />
              <HeroFeature icon={<Users size={20} />} title="Expert" subtitle="Trainers" />
              <HeroFeature icon={<BookOpen size={20} />} title="Hands-on" subtitle="Practical Training" />
              <HeroFeature icon={<BriefcaseBusiness size={20} />} title="Job-Oriented" subtitle="Programs" />
            </div>
          </div>

          {/* ================= RIGHT VISUAL ================= */}
          <div className="sk-slide-in relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[600px] 2xl:max-w-[780px]">
              {/* brand accent shapes behind the photo */}
              <div aria-hidden="true" className="absolute -bottom-4 -right-4 h-3/4 w-3/4 rounded-[2rem] bg-gradient-to-br from-[#F97316] to-[#FFB15C] opacity-90" />
              <div aria-hidden="true" className="absolute -left-4 -top-4 h-1/2 w-1/2 rounded-[2rem] border-2 border-white/20" />
              <div className="sk-float relative overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/40">
                <Image
                  src="/images/skce-hero-banner.png"
                  alt="Students learning practical computer skills at SK Computer Education"
                  width={1000}
                  height={800}
                  priority
                  className="h-auto w-full object-contain"
                />
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
    <div className="group flex items-center gap-2.5 sm:px-3 sm:first:pl-0 sm:[&:not(:last-child)]:border-r sm:[&:not(:last-child)]:border-white/15">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-orange-300 ring-1 ring-white/15 transition duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="whitespace-nowrap text-[13px] font-bold leading-tight text-white">{title}</p>
        <p className="mt-0.5 whitespace-nowrap text-[11px] leading-tight text-blue-100/75">{subtitle}</p>
      </div>
    </div>
  );
}
