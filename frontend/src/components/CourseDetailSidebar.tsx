import Link from "next/link";
import {
  Award,
  User,
  Images,
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
      icon: Globe,
      label: "Language",
      value: course.language ?? "English",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      {/* =========================================================
          VIDEO PREVIEW
      ========================================================= */}
      <div className="group/preview relative aspect-video w-full overflow-hidden bg-[#173B67]">
        {course.videoThumbnailUrl || course.bannerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              course.videoThumbnailUrl ||
              course.bannerImageUrl
            }
            alt={`${course.title} preview`}
            className="h-full w-full object-cover transition duration-500 group-hover/preview:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-semibold text-white/70">
              Course Preview
            </span>
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#173B67]/25 transition-colors duration-300 group-hover/preview:bg-[#173B67]/35" />

        {/* Play button */}
        <button
          type="button"
          aria-label="Play preview video"
          className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-300"
        >
          <span className="relative flex h-16 w-16 items-center justify-center">
            {/* Soft pulse ring */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/40 motion-reduce:hidden" />

            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-900/30 transition duration-300 group-hover/preview:scale-110 group-hover/preview:bg-orange-600">
              <Play
                size={24}
                fill="currentColor"
                className="ml-0.5"
              />
            </span>
          </span>
        </button>
      </div>

      {/* =========================================================
          COURSE INFORMATION
      ========================================================= */}
      <div className="p-6 sm:p-7">
        {/* Includes heading */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#173B67]">
            Course Includes
          </h3>

          <span className="h-1 w-8 rounded-full bg-orange-500" />
        </div>

        {/* Course details */}
        <dl className="divide-y divide-slate-100">
          {includes.map(
            ({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="group flex items-center justify-between gap-4 py-3.5"
              >
                <dt className="flex min-w-0 items-center gap-2.5 text-sm text-slate-500">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 transition duration-200 group-hover:bg-orange-500">
                    <Icon
                      size={15}
                      className="text-orange-500 transition-colors duration-200 group-hover:text-white"
                    />
                  </span>

                  <span>{label}</span>
                </dt>

                <dd className="max-w-[52%] text-right text-sm font-semibold text-[#173B67]">
                  {value}
                </dd>
              </div>
            )
          )}
        </dl>

        {/* =======================================================
            ENROLL BUTTON
        ======================================================= */}
        <Link
          href={`/register?course=${course.slug}`}
          className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99]"
        >
          Enroll Now

          <ArrowRight
            size={17}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>

        {/* Free demo */}
        <Link
          href={`/contact?course=${course.slug}`}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#173B67] px-5 text-sm font-semibold text-[#173B67] transition duration-200 hover:-translate-y-0.5 hover:bg-[#173B67] hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99]"
        >
          Book Free Demo
        </Link>

        {/* =======================================================
            SHARE
        ======================================================= */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-3 text-sm font-semibold text-[#173B67]">
            Share This Course
          </p>

          <div className="flex gap-2">
            <a
              href="#"
              aria-label="Share on Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <Facebook size={17} />
            </a>

            <a
              href="#"
              aria-label="Share on LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <Linkedin size={17} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
