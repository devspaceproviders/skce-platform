import { db } from "../../prisma/db";

export async function getAllCourses() {
  const courses = await db.orm.public.Course.all();

  return courses.filter((course) => course.isActive);
}

export async function getCourseBySlug(slug: string) {
  const course = await db.orm.public.Course.first({
    slug,
  });

  if (!course || !course.isActive) {
    throw new Error("Course not found");
  }

  return course;
}