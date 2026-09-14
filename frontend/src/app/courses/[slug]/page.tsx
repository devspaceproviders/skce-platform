import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, BookOpen } from "lucide-react";
import { getCourseBySlug, getCourses } from "@/lib/api";
import CourseDetailSidebar from "@/components/CourseDetailSidebar";
import TopicsAccordion from "@/components/TopicsAccordion";

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
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="bg-[#173B67] px-6 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20">
            <BookOpen size={24} />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {course.title}
          </h1>

          <nav
            aria-label="Breadcrumb"
            className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm"
          >
            <Link
              href="/"
              className="font-semibold text-orange-400 transition hover:text-orange-300"
            >
              Home
            </Link>

            <ChevronRight
              size={14}
              className="text-slate-400"
            />

            <Link
              href="/courses"
              className="font-semibold text-slate-300 transition hover:text-white"
            >
              Courses
            </Link>

            <ChevronRight
              size={14}
              className="text-slate-400"
            />

            <span className="font-semibold text-white">
              {course.title}
            </span>
          </nav>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <section className="bg-slate-50 px-6 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          
          {/* =====================================================
              LEFT CONTENT
          ===================================================== */}
          <div className="min-w-0">
            
            {/* Course Banner */}
            {course.bannerImageUrl && (
              <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.bannerImageUrl}
                  alt={course.title}
                  className="h-auto max-h-[420px] w-full object-cover"
                />
              </div>
            )}

            {/* About */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 text-2xl font-extrabold text-[#102A43]">
                About This Course
              </h2>

              <div className="h-1 w-12 rounded-full bg-orange-500" />

              <p className="mt-5 leading-7 text-slate-600">
                {course.aboutLong || course.description}
              </p>
            </div>

            {/* What You Will Learn */}
            {course.whatYouWillLearn &&
              course.whatYouWillLearn.length > 0 && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-4 text-2xl font-extrabold text-[#102A43]">
                    What You&apos;ll Learn
                  </h2>

                  <div className="mb-6 h-1 w-12 rounded-full bg-orange-500" />

                  <ul className="grid gap-4 sm:grid-cols-2">
                    {course.whatYouWillLearn.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                          <Check
                            size={13}
                            className="text-orange-600"
                          />
                        </span>

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Requirements */}
            {course.requirements &&
              course.requirements.length > 0 && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-4 text-2xl font-extrabold text-[#102A43]">
                    Requirements
                  </h2>

                  <div className="mb-6 h-1 w-12 rounded-full bg-orange-500" />

                  <ul className="space-y-3">
                    {course.requirements.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                      >
                        <Check
                          size={17}
                          className="mt-1 shrink-0 text-orange-500"
                        />

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Topics */}
            {course.topics &&
              course.topics.length > 0 && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-4 text-2xl font-extrabold text-[#102A43]">
                    Topics for This Course
                  </h2>

                  <div className="mb-6 h-1 w-12 rounded-full bg-orange-500" />

                  <TopicsAccordion topics={course.topics} />
                </div>
              )}

            {/* Instructor */}
            {course.instructor && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="mb-6 text-2xl font-extrabold text-[#102A43]">
                  Your Instructor
                </h2>

                <div className="h-1 w-12 rounded-full bg-orange-500" />

                <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.instructor.avatarUrl}
                    alt={course.instructor.name}
                    className="h-20 w-20 shrink-0 rounded-full border-4 border-orange-100 object-cover"
                  />

                  <div>
                    <p className="text-lg font-bold text-[#173B67]">
                      {course.instructor.name}
                    </p>

                    <p className="mt-1 text-sm font-medium text-orange-500">
                      {course.instructor.title}
                    </p>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              RIGHT SIDEBAR
          ===================================================== */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CourseDetailSidebar course={course} />
          </aside>
        </div>
      </section>
    </>
  );
}