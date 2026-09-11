import { Award, User, Images, Users, Globe, ArrowRight, Facebook, Twitter, Linkedin, Play } from "lucide-react";
import { Course } from "@/types";

export default function CourseDetailSidebar({ course }: { course: Course }) {
  const includes = [
    { icon: Award, label: "Certificate:", value: course.hasCertificate ? "Yes" : "No" },
    { icon: User, label: "Instructor:", value: course.instructor?.name ?? "—" },
    { icon: Images, label: "Total Videos:", value: course.totalVideos ?? "—" },
    { icon: Users, label: "Enrolled:", value: `${course.enrolled.toLocaleString("en-IN")} students` },
    { icon: Globe, label: "Language:", value: course.language ?? "English" },
  ];

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {/* Video thumbnail with play badge */}
        <div className="relative aspect-video w-full overflow-hidden bg-brand-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.videoThumbnailUrl || course.bannerImageUrl}
            alt={`${course.title} preview`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            aria-label="Play preview video"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:scale-110">
              <Play size={22} fill="currentColor" />
            </span>
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm font-bold text-slate-900">Course Includes:</p>
          <dl className="divide-y divide-slate-100">
            {includes.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 text-sm">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Icon size={16} className="text-brand" />
                  {label}
                </dt>
                <dd className="font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-dark py-3 text-sm font-semibold text-white transition hover:bg-brand-navy">
            Start Now <ArrowRight size={16} />
          </button>

          <p className="mb-3 mt-6 text-sm font-bold text-slate-900">Share On:</p>
          <div className="flex gap-3 text-slate-700">
            <a href="#" aria-label="Share on Facebook" className="transition hover:text-brand">
              <Facebook size={18} />
            </a>
            <a href="#" aria-label="Share on Twitter" className="transition hover:text-brand">
              <Twitter size={18} />
            </a>
            <a href="#" aria-label="Share on LinkedIn" className="transition hover:text-brand">
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
