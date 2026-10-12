
import Link from "next/link";
import {
  Award,
  UserRound,
  Images,
  Globe,
  ArrowRight,
  Facebook,
  Linkedin,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Course } from "@/types";

export default function CourseDetailSidebar({
  course,
}: {
  course: Course;
}) {
  const includes = [
    {
      icon: Award,
      label: "Certificate",
      value: course.hasCertificate ? "Yes" : "No",
    },
    {
      icon: UserRound,
      label: "Instructor",
      value: course.instructor?.name ?? "To be announced",
    },
    {
      icon: Images,
      label: "Total Videos",
      value: course.totalVideos ?? 0,
    },
    {
      icon: Globe,
      label: "Language",
      value: course.language ?? "English",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      {/* SIDEBAR HEADER */}
      <div className="bg-gradient-to-br from-[#0B2A52] via-[#173B67] to-[#1d4d85] p-5 text-white sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500">
          <BookOpen size={22} />
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
          Start Learning
        </p>

        <h2 className="mt-2 text-xl font-bold leading-snug">
          {course.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-100">
          Register to take the next step in your learning journey.
        </p>
      </div>

      {/* COURSE INFORMATION */}
      <div className="p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#173B67]">
            Course Includes
          </h3>
          <span className="h-1 w-8 rounded-full bg-orange-500" />
        </div>

        <dl className="divide-y divide-slate-100">
          {includes.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 py-3.5"
            >
              <dt className="flex min-w-0 items-center gap-2.5 text-sm text-slate-500">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                  <Icon size={16} />
                </span>
                <span>{label}</span>
              </dt>

              <dd className="max-w-[55%] break-words text-right text-sm font-semibold text-[#173B67]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {/* ENROLL NOW */}
        <Link
          href={`/register?course=${course.slug}`}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
        >
          Enroll Now
          <ArrowRight size={17} />
        </Link>

        {/* FREE DEMO */}
        <Link
          href={`/contact?course=${course.slug}`}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-[#173B67] px-5 py-3 text-sm font-semibold text-[#173B67] transition hover:bg-[#173B67] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
        >
          Book Free Demo
        </Link>

        {/* REGISTRATION NOTE */}
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-orange-100 bg-orange-50/70 p-3.5">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-orange-500"
          />
          <p className="text-xs leading-5 text-slate-600">
            Course topics and learning materials are not displayed on this
            public page.
          </p>
        </div>

        {/* SHARE */}
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-3 text-sm font-semibold text-[#173B67]">
            Share This Course
          </p>

          <div className="flex gap-2">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                `http://localhost:3000/courses/${course.slug}`
              )}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
            >
              <Facebook size={17} />
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                `http://localhost:3000/courses/${course.slug}`
              )}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
            >
              <Linkedin size={17} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
