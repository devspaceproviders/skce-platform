// import Link from "next/link";
// import { ArrowRight, BookOpen } from "lucide-react";
// import CourseCard from "./CourseCard";
// import Reveal from "./Reveal";
// import SectionHeading from "./SectionHeading";
// import { getCourses } from "@/lib/api";

// export default async function CoursesPreview() {
//   const courses = await getCourses();
//   const visibleCourses = courses.slice(0, 6);

//   return (
//     <section className="bg-[#F7F9FC] px-6 py-12 sm:py-16">
//       <div className="mx-auto max-w-7xl">
//         <SectionHeading
//           eyebrow="Popular Courses"
//           title="Our Courses"
//           description="Industry-aligned curricula designed to get you job-ready from day one."
//         />

//         {visibleCourses.length > 0 ? (
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             {visibleCourses.map((course, index) => (
//               <Reveal
//                 key={course.id}
//                 delay={(index % 3) * 100}
//                 className="h-full"
//               >
//                 <CourseCard course={course} />
//               </Reveal>
//             ))}
//           </div>
//         ) : (
//           <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
//             <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
//               <BookOpen size={26} className="text-orange-500" />
//             </div>

//             <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
//               Courses are coming soon
//             </h3>

//             <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
//               We are preparing new courses. Please check back shortly.
//             </p>
//           </div>
//         )}

//         <div className="mt-8 text-center">
//           <Link
//             href="/courses"
//             className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#173B67] shadow-sm transition duration-200 hover:-translate-y-px hover:border-orange-300 hover:text-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
//           >
//             View All Courses
//             <ArrowRight
//               size={16}
//               className="transition-transform duration-200 group-hover:translate-x-0.5"
//             />
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }


import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import CourseCard from "./CourseCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { getCourses } from "@/lib/api";

export default async function CoursesPreview() {
  const courses = await getCourses();
  const visibleCourses = courses.slice(0, 6);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#F5F8FD] via-white to-[#F5F8FD] px-6 py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-20 -z-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-10 -z-10 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Popular Courses"
          title="Our Courses"
          description="Industry-aligned curricula designed to get you job-ready from day one."
        />

        {visibleCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course, index) => (
              <Reveal
                key={course.id}
                delay={(index % 3) * 100}
                className="h-full"
              >
                <CourseCard course={course} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#173B67]/20 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-500">
              <BookOpen size={26} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#173B67]">
              Courses are coming soon
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              We are preparing new courses. Please check back shortly.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/courses"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#173B67]/20 bg-white px-6 text-sm font-semibold text-[#173B67] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-[#173B67] hover:text-white hover:shadow-lg hover:shadow-blue-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            View All Courses
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

