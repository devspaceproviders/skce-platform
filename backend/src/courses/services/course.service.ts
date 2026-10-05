import { db } from "../../prisma/db";



type CourseMode = "ONLINE" | "OFFLINE" | "HYBRID";



type CreateCourseInput = {

  title: string;

  description?: string;

  mode?: CourseMode;

  duration?: string;

  price?: number;

  isActive?: boolean;

};



type UpdateCourseInput = {

  title?: string;

  description?: string;

  mode?: CourseMode;

  duration?: string;

  price?: number;

  isActive?: boolean;

};



function generateSlug(title: string): string {

  return title

    .trim()

    .toLowerCase()

    .replace(/&/g, " and ")

    .replace(/[^a-z0-9]+/g, "-")

    .replace(/^-+|-+$/g, "");

}



async function generateUniqueSlug(

  title: string,

  excludeCourseId?: number

): Promise<string> {

  const baseSlug = generateSlug(title);



  if (!baseSlug) {

    throw new Error("Course title must contain valid characters");

  }



  const courses = await db.orm.public.Course.all();



  let slug = baseSlug;

  let counter = 2;



  while (

    courses.some(

      (course) =>

        course.slug === slug &&

        course.id !== excludeCourseId

    )

  ) {

    slug = `${baseSlug}-${counter}`;

    counter++;

  }



  return slug;

}



/*

 \* ============================================================

 \* PUBLIC COURSE APIs

 \* ============================================================

 */



export async function getAllCourses() {

  const courses = await db.orm.public.Course.all();



  return courses.filter((course) => course.isActive);

}



export async function getCourseBySlug(slug: string) {

  const course = await db.orm.public.Course.first({ slug });



  if (!course || !course.isActive) {

    throw new Error("Course not found");

  }



  // ------------------------------------------------------------

  // Active course modules

  // ------------------------------------------------------------

  const allModules = await db.orm.public.CourseModule.all();



  const courseModules = allModules

    .filter(

      (module) =>

        module.courseId === course.id &&

        module.isActive

    )

    .sort(

      (a, b) =>

        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)

    );



  // ------------------------------------------------------------

  // Active lessons belonging to this course's modules

  // ------------------------------------------------------------

  const allLessons = await db.orm.public.Lesson.all();



  const moduleIds = new Set(

    courseModules.map((module) => module.id)

  );



  const courseLessons = allLessons

    .filter(

      (lesson) =>

        moduleIds.has(lesson.moduleId) &&

        lesson.isActive

    )

    .sort(

      (a, b) =>

        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)

    );



  // ------------------------------------------------------------

  // Total video count

  // ------------------------------------------------------------

  const totalVideos = courseLessons.filter(

    (lesson) =>

      typeof lesson.videoUrl === "string" &&

      lesson.videoUrl.trim().length > 0

  ).length;



  // ------------------------------------------------------------

  // Enrolled student count

  // Keep this consistent with the existing admin course logic:

  // count Enrollment records belonging directly to this course.

  // ------------------------------------------------------------

  const allEnrollments =

    await db.orm.public.Enrollment.all();



  const enrolled = allEnrollments.filter(

    (enrollment) =>

      enrollment.courseId === course.id

  ).length;



  // ------------------------------------------------------------

  // Topics

  // Build the existing frontend topic structure from the

  // actual CourseModule + Lesson records.

  // ------------------------------------------------------------

  const topics = courseModules.map((module) => ({

    title: module.title,

    lessons: courseLessons

      .filter(

        (lesson) =>

          lesson.moduleId === module.id

      )

      .map((lesson) => lesson.title),

  }));



  // ------------------------------------------------------------

  // Instructor

  //

  // A course can have multiple batches/trainers.

  // For the current public course-detail UI, select the trainer

  // from the first active/upcoming batch that has a trainer.

  // ------------------------------------------------------------

  const allBatches = await db.orm.public.Batch.all();



  const courseBatches = allBatches

    .filter(

      (batch) =>

        batch.courseId === course.id &&

        batch.trainerId !== null &&

        batch.status !== "COMPLETED"

    )

    .sort(

      (a, b) =>

        new Date(String(a.startDate)).getTime() -

        new Date(String(b.startDate)).getTime()

    );



  let instructor = null;



  const selectedBatch = courseBatches[0];



  if (selectedBatch?.trainerId) {

    const trainerProfile =

      await db.orm.public.TrainerProfile.first({

        id: selectedBatch.trainerId,

      });



    if (trainerProfile) {

      const trainerUser =

        await db.orm.public.User.first({

          id: trainerProfile.userId,

        });



      if (trainerUser) {

        instructor = {

          id: trainerProfile.id,

          name: trainerUser.name,

          title:

            trainerProfile.specialization ||

            "Trainer",

          avatarUrl:

            trainerUser.profilePhotoUrl || "",

          bio:

            trainerProfile.bio || "",

        };

      }

    }

  }



  return {

    ...course,



    // Dynamic course-detail values

    modules: courseModules.length,

    totalVideos,

    enrolled,

    topics,

    instructor,

  };

}



/*

 \* ============================================================

 \* ADMIN COURSE APIs

 \* ============================================================

 */



export async function getAllCoursesForAdmin() {

  const courses = await db.orm.public.Course.all();

  const modules = await db.orm.public.CourseModule.all();

  const enrollments = await db.orm.public.Enrollment.all();



  return courses.map((course) => {

    const courseModules = modules.filter(

      (module) =>

        module.courseId === course.id &&

        module.isActive

    );



    const courseEnrollments = enrollments.filter(

      (enrollment) =>

        enrollment.courseId === course.id

    );



    return {

      ...course,



      // Always derive module count from actual CourseModule records.

      modules: courseModules.length,



      // Always derive student count from actual enrollments.

      students: courseEnrollments.length,

    };

  });

}



export async function getCourseByIdForAdmin(

  courseId: number

) {

  const course = await db.orm.public.Course.first({

    id: courseId,

  });



  if (!course) {

    throw new Error("Course not found");

  }



  const modules = await db.orm.public.CourseModule.all();



  const enrollments = await db.orm.public.Enrollment.all();



  const moduleCount = modules.filter(

    (module) =>

      module.courseId === course.id &&

      module.isActive

  ).length;



  const enrollmentCount = enrollments.filter(

    (enrollment) =>

      enrollment.courseId === course.id

  ).length;



  return {

    ...course,

    modules: moduleCount,

    students: enrollmentCount,

  };

}



export async function createCourse(

  input: CreateCourseInput

) {

  const title = input.title?.trim();



  if (!title) {

    throw new Error("Course title is required");

  }



  const slug = await generateUniqueSlug(title);



  const price =

    input.price === undefined ||

    input.price === null ||

    Number.isNaN(input.price)

      ? 0

      : Math.trunc(input.price);



  if (price < 0) {

    throw new Error("Course price cannot be negative");

  }



  return db.orm.public.Course.create({

    slug,

    title,

    description:

      input.description?.trim() || null,

    mode: input.mode || "ONLINE",

    duration:

      input.duration?.trim() || null,



    // Module count is maintained from CourseModule.

    modules: 0,



    price,



    isActive:

      input.isActive === undefined

        ? true

        : input.isActive,

  });

}



export async function updateCourse(

  courseId: number,

  input: UpdateCourseInput

) {

  const course = await db.orm.public.Course.first({

    id: courseId,

  });



  if (!course) {

    throw new Error("Course not found");

  }



  const updateData: Record<string, unknown> = {};



  if (input.title !== undefined) {

    const title = input.title?.trim();



    if (!title) {

      throw new Error("Course title is required");

    }



    updateData.title = title;



    updateData.slug =

      await generateUniqueSlug(

        title,

        courseId

      );

  }



  if (input.description !== undefined) {

    updateData.description =

      input.description?.trim() || null;

  }



  if (input.mode !== undefined) {

    updateData.mode = input.mode;

  }



  if (input.duration !== undefined) {

    updateData.duration =

      input.duration?.trim() || null;

  }



  if (input.price !== undefined) {

    const price = Math.trunc(input.price);



    if (price < 0) {

      throw new Error(

        "Course price cannot be negative"

      );

    }



    updateData.price = price;

  }



  if (input.isActive !== undefined) {

    updateData.isActive = input.isActive;

  }



  return db.orm.public.Course

    .where({

      id: courseId,

    })

    .update(updateData);

}



export async function deleteCourse(

  courseId: number

) {

  const course = await db.orm.public.Course.first({

    id: courseId,

  });



  if (!course) {

    throw new Error("Course not found");

  }



  /*

   \* IMPORTANT:

   \*

   \* Enrollment.course has onDelete: Cascade.

   \* Therefore we do NOT allow deletion of a course

   \* that already has enrollments.

   \*

   \* Admin can deactivate it instead.

   */



  const enrollments =

    await db.orm.public.Enrollment.all();



  const hasEnrollments =

    enrollments.some(

      (enrollment) =>

        enrollment.courseId === courseId

    );



  if (hasEnrollments) {

    throw new Error(

      "Course cannot be deleted because students are enrolled. Deactivate the course instead."

    );

  }



  return db.orm.public.Course

    .where({

      id: courseId,

    })

    .delete();

}

/*
 * ============================================================
 * COURSE IMAGE
 * ============================================================
 */

export async function updateCourseImage(
  courseId: number,
  imageUrl: string
) {
  const course =
    await db.orm.public.Course.first({
      id: courseId,
    });

  if (!course) {
    throw new Error("Course not found");
  }

  return db.orm.public.Course
    .where({
      id: courseId,
    })
    .update({
      imageUrl,
    });
}
