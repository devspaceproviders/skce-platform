import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import { getCourseBySlug, getCourses } from "@/lib/api";
import CourseDetailSidebar from "@/components/CourseDetailSidebar";
import TopicsAccordion from "@/components/TopicsAccordion";

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  return { title: course ? `${course.title} — SKCE` : "Course — SKCE" };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();

  return (
    <>
      {/* Navy hero with breadcrumb, matches the reference screenshot */}
      <section className="bg-brand-dark px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
        <nav className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link href="/" className="font-semibold text-orange-400 hover:underline">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-semibold text-white">{course.title}</span>
        </nav>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Main content */}
          <div>
            {course.bannerImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.bannerImageUrl}
                alt={course.title}
                className="mb-10 w-full rounded-xl object-cover"
              />
            )}

            <h2 className="mb-4 text-2xl font-extrabold text-slate-900">About This Course</h2>
            <p className="mb-8 leading-relaxed text-slate-600">
              {course.aboutLong || course.description}
            </p>

            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <div className="mb-10 rounded-xl border border-slate-200 p-6">
                <h3 className="mb-4 text-lg font-bold text-slate-900">What You&apos;ll Learn?</h3>
                <ul className="space-y-3">
                  {course.whatYouWillLearn.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.requirements && course.requirements.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-2xl font-extrabold text-slate-900">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.topics && course.topics.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-2xl font-extrabold text-slate-900">
                  Topics for This Course
                </h2>
                <TopicsAccordion topics={course.topics} />
              </div>
            )}

            {course.instructor && (
              <div>
                <h2 className="mb-4 text-2xl font-extrabold text-slate-900">Your Instructors</h2>
                <div className="flex items-start gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.instructor.avatarUrl}
                    alt={course.instructor.name}
                    className="h-20 w-20 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{course.instructor.name}</p>
                    <p className="mb-2 text-sm text-slate-400">{course.instructor.title}</p>
                    <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <CourseDetailSidebar course={course} />
        </div>
      </section>
    </>
  );
}
