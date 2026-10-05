import { db } from "../../prisma/db";

type CreatePackageInput = {
  title: string;
  description?: string | null;
  price: number;
  courseIds?: number[];
  isActive?: boolean;
};

type UpdatePackageInput = {
  title?: string;
  description?: string | null;
  price?: number;
  courseIds?: number[];
  isActive?: boolean;
};

function validateCourseIds(courseIds: number[]) {
  if (!Array.isArray(courseIds)) {
    throw new Error("courseIds must be an array");
  }

  const normalized = courseIds.map((id) => Number(id));

  if (
    normalized.some(
      (id) => !Number.isInteger(id) || id <= 0
    )
  ) {
    throw new Error("Invalid course ID");
  }

  return [...new Set(normalized)];
}

function makeSlug(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "package";
}

async function getUniqueSlug(title: string) {
  const base = makeSlug(title);
  let slug = base;
  let counter = 2;

  while (
    await db.orm.public.CoursePackage.first({
      slug,
    })
  ) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function validateActiveCourses(courseIds: number[]) {
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
}

export async function listAdminPackages() {
  const packages =
    await db.orm.public.CoursePackage.all();

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const courses =
    await db.orm.public.Course.all();

  return packages.map((coursePackage) => {
    const links = packageCourses.filter(
      (link) => link.packageId === coursePackage.id
    );

    const selectedCourses = links
      .map((link) =>
        courses.find(
          (course) => course.id === link.courseId
        )
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

    return {
      id: coursePackage.id,
      slug: coursePackage.slug,
      title: coursePackage.title,
      description: coursePackage.description,
      price: coursePackage.price,
      isActive: coursePackage.isActive,
      imageUrl: coursePackage.imageUrl,
      courses: selectedCourses,
    };
  });
}

export async function getAdminPackageById(
  packageId: number
) {
  const coursePackage =
    await db.orm.public.CoursePackage.first({
      id: packageId,
    });

  if (!coursePackage) {
    throw new Error("Package not found");
  }

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const courses =
    await db.orm.public.Course.all();

  const links = packageCourses.filter(
    (link) => link.packageId === packageId
  );

  const selectedCourses = links
    .map((link) =>
      courses.find(
        (course) => course.id === link.courseId
      )
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
    imageUrl: coursePackage.imageUrl,
    courses: selectedCourses,
    availableCourses,
  };
}

export async function createPackage(
  input: CreatePackageInput
) {
  const title = String(
    input.title ?? ""
  ).trim();

  if (!title) {
    throw new Error("Package title is required");
  }

  const price = Number(input.price);

  if (!Number.isInteger(price) || price < 0) {
    throw new Error(
      "Package price must be a valid positive amount"
    );
  }

  const courseIds = validateCourseIds(
    input.courseIds ?? []
  );

  await validateActiveCourses(courseIds);

  const slug = await getUniqueSlug(title);

  const coursePackage =
    await db.orm.public.CoursePackage.create({
      slug,
      title,
      description:
        input.description === null ||
        input.description === undefined
          ? null
          : String(input.description).trim() || null,
      price,
      isActive:
        input.isActive === undefined
          ? true
          : Boolean(input.isActive),
    });

  for (const courseId of courseIds) {
    await db.orm.public.PackageCourse.create({
      packageId: coursePackage.id,
      courseId,
    });
  }

  return getAdminPackageById(
    coursePackage.id
  );
}

export async function updatePackage(
  packageId: number,
  input: UpdatePackageInput
) {
  const coursePackage =
    await db.orm.public.CoursePackage.first({
      id: packageId,
    });

  if (!coursePackage) {
    throw new Error("Package not found");
  }

  const updateData: {
    title?: string;
    description?: string | null;
    price?: number;
    isActive?: boolean;
  } = {};

  if (input.title !== undefined) {
    const title = String(
      input.title
    ).trim();

    if (!title) {
      throw new Error(
        "Package title is required"
      );
    }

    updateData.title = title;
  }

  if (input.description !== undefined) {
    const description =
      input.description === null
        ? null
        : String(
            input.description
          ).trim();

    updateData.description =
      description || null;
  }

  if (input.price !== undefined) {
    const price = Number(input.price);

    if (
      !Number.isInteger(price) ||
      price < 0
    ) {
      throw new Error(
        "Package price must be a valid positive amount"
      );
    }

    updateData.price = price;
  }

  if (input.isActive !== undefined) {
    updateData.isActive =
      Boolean(input.isActive);
  }

  let updatedPackage = coursePackage;

  if (Object.keys(updateData).length > 0) {
    const result =
      await db.orm.public.CoursePackage
        .where({
          id: packageId,
        })
        .update(updateData);

    if (!result) {
      throw new Error(
        "Package not found while updating"
      );
    }

    updatedPackage = result;
  }

  if (input.courseIds !== undefined) {
    const courseIds =
      validateCourseIds(
        input.courseIds
      );

    await validateActiveCourses(
      courseIds
    );

    const existingLinks =
      await db.orm.public.PackageCourse.all();

    const packageLinks =
      existingLinks.filter(
        (link) =>
          link.packageId === packageId
      );

    const existingCourseIds =
      new Set(
        packageLinks.map(
          (link) => link.courseId
        )
      );

    const requestedCourseIds =
      new Set(courseIds);

    for (const link of packageLinks) {
      if (
        !requestedCourseIds.has(
          link.courseId
        )
      ) {
        await db.orm.public.PackageCourse
          .where({
            id: link.id,
          })
          .delete();
      }
    }

    for (const courseId of courseIds) {
      if (
        !existingCourseIds.has(
          courseId
        )
      ) {
        await db.orm.public.PackageCourse.create(
          {
            packageId,
            courseId,
          }
        );
      }
    }
  }

  return getAdminPackageById(
    updatedPackage.id
  );
}

/*
 * ============================================================
 * PACKAGE IMAGE
 * ============================================================
 */

export async function updatePackageImage(
  packageId: number,
  imageUrl: string
) {
  const coursePackage =
    await db.orm.public.CoursePackage.first({
      id: packageId,
    });

  if (!coursePackage) {
    throw new Error(
      "Package not found"
    );
  }

  return db.orm.public.CoursePackage
    .where({
      id: packageId,
    })
    .update({
      imageUrl,
    });
}