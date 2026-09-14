import { db } from "../../prisma/db";

export async function getAllPackages() {
  const packages = await db.orm.public.CoursePackage.all();
  const packageCourses = await db.orm.public.PackageCourse.all();
  const courses = await db.orm.public.Course.all();

  return packages
    .filter((coursePackage) => coursePackage.isActive)
    .map((coursePackage) => {
      const links = packageCourses.filter(
        (link) => link.packageId === coursePackage.id
      );

      const packageCourseList = links
        .map((link) =>
          courses.find((course) => course.id === link.courseId)
        )
        .filter(
          (course): course is (typeof courses)[number] =>
            Boolean(course && course.isActive)
        )
        .map((course) => ({
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          mode: course.mode,
        }));

      return {
        id: coursePackage.id,
        slug: coursePackage.slug,
        title: coursePackage.title,
        description: coursePackage.description,
        price: coursePackage.price,
        isActive: coursePackage.isActive,
        courses: packageCourseList,
      };
    });
}

export async function getPackageBySlug(slug: string) {
  const coursePackage = await db.orm.public.CoursePackage.first({
    slug,
  });

  if (!coursePackage || !coursePackage.isActive) {
    throw new Error("Package not found");
  }

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const courses = await db.orm.public.Course.all();

  const courseLinks = packageCourses.filter(
    (item) => item.packageId === coursePackage.id
  );

  const packageCourseList = courseLinks
    .map((link) =>
      courses.find((course) => course.id === link.courseId)
    )
    .filter(
      (course): course is (typeof courses)[number] =>
        Boolean(course && course.isActive)
    )
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      mode: course.mode,
    }));

  return {
    id: coursePackage.id,
    slug: coursePackage.slug,
    title: coursePackage.title,
    description: coursePackage.description,
    price: coursePackage.price,
    isActive: coursePackage.isActive,
    courses: packageCourseList,
  };
}