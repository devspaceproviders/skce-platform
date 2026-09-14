import Link from "next/link";
import {
  Award,
  User,
  Images,
  Users,
  Globe,
  ArrowRight,
  Facebook,
  Linkedin,
  Play,
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
      icon: User,
      label: "Instructor",
      value: course.instructor?.name ?? "—",
    },
    {
      icon: Images,
      label: "Total Videos",
      value: course.totalVideos ?? "—",
    },
    {
      icon: Users,
      label: "Enrolled",
      value: `${course.enrolled.toLocaleString("en-IN")} students`,
    },
    {
      icon: Globe,
      label: "Language",
      value: course.language ?? "English",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* =========================================================
          VIDEO PREVIEW
      ========================================================= */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#173B67]">
        {course.videoThumbnailUrl || course.bannerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.videoThumbnailUrl || course.bannerImageUrl}
            alt={`${course.title} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-semibold text-white/70">
              Course Preview
            </span>
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#173B67]/25" />

        {/* Play button */}
        <button
          type="button"
          aria-label="Play preview video"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-900/20 transition duration-300 hover:scale-110 hover:bg-orange-600">
            <Play size={24} fill="currentColor" />
          </span>
        </button>
      </div>

      {/* =========================================================
          COURSE INFORMATION
      ========================================================= */}
      <div className="p-6 sm:p-7">
        {/* Price */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Course Fee
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#173B67]">
              ₹{course.price.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Includes heading */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#102A43]">
            Course Includes
          </h3>

          <span className="h-1 w-8 rounded-full bg-orange-500" />
        </div>

        {/* Course details */}
        <dl className="divide-y divide-slate-100">
          {includes.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <dt className="flex min-w-0 items-center gap-2.5 text-sm text-slate-500">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <Icon size={15} className="text-orange-500" />
                </span>

                <span>{label}</span>
              </dt>

              <dd className="max-w-[52%] text-right text-sm font-semibold text-[#173B67]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {/* =======================================================
            ENROLL BUTTON
        ======================================================= */}
        <Link
          href={`/register?course=${course.slug}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition duration-300 hover:bg-orange-600 hover:shadow-md"
        >
          Enroll Now
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>

        {/* Free demo */}
        <Link
          href={`/contact?course=${course.slug}`}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#173B67] px-5 py-3.5 text-sm font-semibold text-[#173B67] transition hover:bg-[#173B67] hover:text-white"
        >
          Book Free Demo
        </Link>

        {/* =======================================================
            SHARE
        ======================================================= */}
        <div className="mt-7 border-t border-slate-100 pt-6">
          <p className="mb-3 text-sm font-bold text-[#102A43]">
            Share This Course
          </p>

          <div className="flex gap-2">
            <a
              href="#"
              aria-label="Share on Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
            >
              <Facebook size={17} />
            </a>

            <a
              href="#"
              aria-label="Share on LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
            >
              <Linkedin size={17} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}