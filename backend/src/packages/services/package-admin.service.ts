import { db } from "../../prisma/db";

type UpdatePackageInput = {
  title?: string;
  description?: string | null;
  price?: number;
  courseIds?: number[];
};

function validateCourseIds(courseIds: number[]) {
  if (!Array.isArray(courseIds)) {
    throw new Error("courseIds must be an array");
  }

  const normalized = courseIds.map((id) => Number(id));

  if (normalized.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error("Invalid course ID");
  }

  return [...new Set(normalized)];
}

export async function getAdminPackageById(packageId: number) {
  const coursePackage = await db.orm.public.CoursePackage.first({
    id: packageId,
  });

  if (!coursePackage) {
    throw new Error("Package not found");
  }

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const courses = await db.orm.public.Course.all();

  const links = packageCourses.filter(
    (link) => link.packageId === packageId
  );

  const selectedCourses = links
    .map((link) =>
      courses.find((course) => course.id === link.courseId)
    )
    .filter(
      (course): course is (typeof courses)[number] =>
        Boolean(course)
    )
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      mode: course.mode,
      isActive: course.isActive,
    }));

  /*
   * All active courses are returned so the Admin UI can
   * select any existing course for this package.
   *
   * This also means newly created courses automatically
   * become available here without code changes.
   */
  const availableCourses = courses
    .filter((course) => course.isActive)
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
    courses: selectedCourses,
    availableCourses,
  };
}

export async function updatePackage(
  packageId: number,
  input: UpdatePackageInput
) {
  const coursePackage = await db.orm.public.CoursePackage.first({
    id: packageId,
  });

  if (!coursePackage) {
    throw new Error("Package not found");
  }

  const updateData: {
    title?: string;
    description?: string | null;
    price?: number;
  } = {};

  if (input.title !== undefined) {
    const title = String(input.title).trim();

    if (!title) {
      throw new Error("Package title is required");
    }

    updateData.title = title;
  }

  if (input.description !== undefined) {
    const description =
      input.description === null
        ? null
        : String(input.description).trim();

    updateData.description = description || null;
  }

  if (input.price !== undefined) {
    const price = Number(input.price);

    if (!Number.isInteger(price) || price < 0) {
      throw new Error("Package price must be a valid positive amount");
    }

    updateData.price = price;
  }

  /*
   * Update package details.
   */
  let updatedPackage = coursePackage;

  if (Object.keys(updateData).length > 0) {
    const result =
      await db.orm.public.CoursePackage
        .where({
          id: packageId,
        })
        .update(updateData);

    if (!result) {
      throw new Error("Package not found while updating");
    }

    updatedPackage = result;
  }

  /*
   * Update package-course relationships only when
   * courseIds were supplied.
   */
  if (input.courseIds !== undefined) {
    const courseIds = validateCourseIds(input.courseIds);

    /*
     * Only active courses can be added to a package.
     */
    const allCourses = await db.orm.public.Course.all();

    const validCourseIds = new Set(
      allCourses
        .filter((course) => course.isActive)
        .map((course) => course.id)
    );

    const invalidCourseIds = courseIds.filter(
      (courseId) => !validCourseIds.has(courseId)
    );

    if (invalidCourseIds.length > 0) {
      throw new Error(
        `Invalid or inactive course IDs: ${invalidCourseIds.join(", ")}`
      );
    }

    const existingLinks =
      await db.orm.public.PackageCourse.all();

    const packageLinks = existingLinks.filter(
      (link) => link.packageId === packageId
    );

    const existingCourseIds = new Set(
      packageLinks.map((link) => link.courseId)
    );

    const requestedCourseIds = new Set(courseIds);

    /*
     * Remove courses that are no longer selected.
     */
    for (const link of packageLinks) {
      if (!requestedCourseIds.has(link.courseId)) {
        await db.orm.public.PackageCourse
          .where({
            id: link.id,
          })
          .delete();
      }
    }

    /*
     * Add newly selected courses.
     *
     * @@unique([packageId, courseId]) in Prisma schema
     * prevents duplicate relationships.
     */
    for (const courseId of courseIds) {
      if (!existingCourseIds.has(courseId)) {
        await db.orm.public.PackageCourse.create({
          packageId,
          courseId,
        });
      }
    }
  }

  return getAdminPackageById(updatedPackage.id);
}
