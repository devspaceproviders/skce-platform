
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Check,
  BookOpen,
  GraduationCap,
  Target,
  ListChecks,
  ClipboardCheck,
  UserRound,
} from "lucide-react";
import { getCourseBySlug, getCourses } from "@/lib/api";
import CourseDetailSidebar from "@/components/CourseDetailSidebar";
import Reveal from "@/components/Reveal";

export async function generateStaticParams() {
  const courses = await getCourses();

  return courses.map((course) => ({
    slug: course.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const course = await getCourseBySlug(params.slug);

  return {
    title: course
      ? `${course.title} — SK Computer Education`
      : "Course — SK Computer Education",
  };
}

function ContentCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="min-w-0">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            {icon}
          </span>
          <h2 className="text-xl font-bold text-[#173B67] sm:text-2xl">
            {title}
          </h2>
        </div>

        <div className="mb-5 mt-4 h-1 w-12 rounded-full bg-orange-500" />

        {children}
      </section>
    </Reveal>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await getCourseBySlug(params.slug);

  if (!course) {
    notFound();
  }

  return (
    <>
      {/* COURSE HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2A52] via-[#173B67] to-[#1d4d85] px-5 py-9 text-white sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-sm text-blue-100"
          >
            <Link href="/" className="transition hover:text-orange-300">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link
              href="/courses"
              className="transition hover:text-orange-300"
            >
              Courses
            </Link>
            <ChevronRight size={14} />
            <span aria-current="page" className="font-semibold text-white">
              {course.title}
            </span>
          </nav>

          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-950/20 sm:h-14 sm:w-14">
              <BookOpen size={26} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
                Course Overview
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                {course.description ||
                  "Explore the course details, learning outcomes and enrollment options."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COURSE DETAILS */}
      <section className="min-h-[60vh] bg-[#F5F8FC] px-4 py-7 sm:px-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
          {/* MAIN COLUMN */}
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <ContentCard
              title="About This Course"
              icon={<GraduationCap size={21} />}
            >
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                {course.aboutLong ||
                  course.description ||
                  "Course information will be available soon."}
              </p>
            </ContentCard>

            {course.whatYouWillLearn &&
              course.whatYouWillLearn.length > 0 && (
                <ContentCard
                  title="What You'll Learn"
                  icon={<Target size={21} />}
                >
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {course.whatYouWillLearn.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition hover:border-orange-200 hover:bg-orange-50/50"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                          <Check size={13} strokeWidth={3} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </ContentCard>
              )}

            {course.requirements && course.requirements.length > 0 && (
              <ContentCard
                title="Requirements"
                icon={<ClipboardCheck size={21} />}
              >
                <ul className="space-y-3">
                  {course.requirements.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                    >
                      <Check
                        size={17}
                        className="mt-1 shrink-0 text-orange-500"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ContentCard>
            )}

            {course.instructor && (
              <ContentCard
                title="Your Instructor"
                icon={<UserRound size={21} />}
              >
                <div className="flex items-start gap-4">
                  {course.instructor.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.instructor.avatarUrl}
                      alt={course.instructor.name}
                      className="h-16 w-16 shrink-0 rounded-full border-2 border-orange-100 object-cover sm:h-20 sm:w-20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 sm:h-20 sm:w-20">
                      <UserRound size={28} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#173B67]">
                      {course.instructor.name}
                    </h3>

                    {course.instructor.title && (
                      <p className="mt-1 text-sm font-semibold text-orange-500">
                        {course.instructor.title}
                      </p>
                    )}

                    {course.instructor.bio && (
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {course.instructor.bio}
                      </p>
                    )}
                  </div>
                </div>
              </ContentCard>
            )}

            {/* Topics are intentionally hidden on the public course page. */}
          </div>

          {/* ENROLLMENT SIDEBAR */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <CourseDetailSidebar course={course} />
          </aside>
        </div>
      </section>
    </>
  );
}
