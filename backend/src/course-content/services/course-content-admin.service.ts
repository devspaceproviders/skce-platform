import { db } from "../../prisma/db";



/* =========================================================

   GET COURSE CONTENT

========================================================= */



export async function getAdminCourseContent(

  courseId: number

) {

  const course =

    await db.orm.public.Course

      .where({ id: courseId })

      .first();



  if (!course) {

    throw new Error("Course not found");

  }



  const allModules =

    await db.orm.public.CourseModule.all();



  const modules = allModules

    .filter(

      (module) =>

        module.courseId === courseId

    )

    .sort(

      (a, b) =>

        a.sortOrder - b.sortOrder

    );



  const allLessons =

    await db.orm.public.Lesson.all();



  return {

  course: {

  id: course.id,

  slug: course.slug,

  title: course.title,

  description: course.description,

  mode: course.mode,

  duration: course.duration,

  isActive: course.isActive,

},



    modules: modules.map((module) => ({

      id: module.id,

      title: module.title,

      description: module.description,

      sortOrder: module.sortOrder,

      isActive: module.isActive,



      lessons: allLessons

        .filter(

          (lesson) =>

            lesson.moduleId === module.id

        )

        .sort(

          (a, b) =>

            a.sortOrder - b.sortOrder

        )

        .map((lesson) => ({

          id: lesson.id,

          moduleId: lesson.moduleId,

          title: lesson.title,

          description: lesson.description,

          content: lesson.content,

          videoUrl: lesson.videoUrl,

          documentUrl: lesson.documentUrl,
          imageUrl: lesson.imageUrl,

          sortOrder: lesson.sortOrder,

          isActive: lesson.isActive,

        })),

    })),

  };

}



/* =========================================================

   CREATE MODULE

========================================================= */



export async function createModule(

  courseId: number,

  title: string,

  description?: string

) {

  const course =

    await db.orm.public.Course

      .where({ id: courseId })

      .first();



  if (!course) {

    throw new Error("Course not found");

  }



  const allModules =

    await db.orm.public.CourseModule.all();



  const courseModules =

    allModules.filter(

      (module) =>

        module.courseId === courseId

    );



  const sortOrder =

    courseModules.length;



  return await db.orm.public.CourseModule.create({

    courseId,

    title,

    description:

      description || null,

    sortOrder,

    isActive: true,

  });

}



/* =========================================================

   UPDATE MODULE

========================================================= */



export async function updateModule(

  moduleId: number,

  title: string,

  description?: string

) {

  const module =

    await db.orm.public.CourseModule

      .where({ id: moduleId })

      .first();



  if (!module) {

    throw new Error("Module not found");

  }



  return await db.orm.public.CourseModule

    .where({ id: moduleId })

    .update({

      title,

      description:

        description || null,

    });

}



/* =========================================================

   DELETE MODULE

========================================================= */



export async function deleteModule(

  moduleId: number

) {

  const module =

    await db.orm.public.CourseModule

      .where({ id: moduleId })

      .first();



  if (!module) {

    throw new Error("Module not found");

  }



  await db.orm.public.CourseModule

    .where({ id: moduleId })

    .delete();



  return {

    success: true,

    message:

      "Module deleted successfully",

  };

}



/* =========================================================

   CREATE LESSON

========================================================= */



export async function createLesson(

  moduleId: number,

  title: string,

  description?: string,

  content?: string,

  videoUrl?: string,

  documentUrl?: string

) {

  const module =

    await db.orm.public.CourseModule

      .where({ id: moduleId })

      .first();



  if (!module) {

    throw new Error("Module not found");

  }



  const allLessons =

    await db.orm.public.Lesson.all();



  const moduleLessons =

    allLessons.filter(

      (lesson) =>

        lesson.moduleId === moduleId

    );



  const sortOrder =

    moduleLessons.length;



  return await db.orm.public.Lesson.create({

    moduleId,

    title,

    description:

      description || null,

    content:

      content || null,

    videoUrl:

      videoUrl || null,

    documentUrl:

      documentUrl || null,

    sortOrder,

    isActive: true,

  });

}



/* =========================================================

   UPDATE LESSON

========================================================= */



export async function updateLesson(

  lessonId: number,

  title: string,

  description?: string,

  content?: string,

  videoUrl?: string,

  documentUrl?: string

) {

  const lesson =

    await db.orm.public.Lesson

      .where({ id: lessonId })

      .first();



  if (!lesson) {

    throw new Error("Lesson not found");

  }



  return await db.orm.public.Lesson

    .where({ id: lessonId })

    .update({

      title,

      description:

        description || null,

      content:

        content || null,

      videoUrl:

        videoUrl || null,

      documentUrl:

        documentUrl || null,

    });

}



/* =========================================================

   DELETE LESSON

========================================================= */



export async function deleteLesson(

  lessonId: number

) {

  const lesson =

    await db.orm.public.Lesson

      .where({ id: lessonId })

      .first();



  if (!lesson) {

    throw new Error("Lesson not found");

  }



  await db.orm.public.Lesson

    .where({ id: lessonId })

    .delete();



  return {

    success: true,

    message:

      "Lesson deleted successfully",

  };

}



/* =========================================================

   REORDER MODULE

========================================================= */



export async function reorderModule(

  moduleId: number,

  direction: "UP" | "DOWN"

) {

  const module =

    await db.orm.public.CourseModule

      .where({ id: moduleId })

      .first();



  if (!module) {

    throw new Error("Module not found");

  }



  const allModules =

    await db.orm.public.CourseModule.all();



  const courseModules = allModules

    .filter(

      (item) =>

        item.courseId === module.courseId

    )

    .sort(

      (a, b) =>

        a.sortOrder - b.sortOrder

    );



  const currentIndex =

    courseModules.findIndex(

      (item) =>

        item.id === moduleId

    );



  if (currentIndex === -1) {

    throw new Error("Module not found");

  }



  const targetIndex =

    direction === "UP"

      ? currentIndex - 1

      : currentIndex + 1;



  /*

   * Already at first / last position.

   */

  if (

    targetIndex < 0 ||

    targetIndex >=

      courseModules.length

  ) {

    return {

      success: true,

      message:

        direction === "UP"

          ? "Module is already first"

          : "Module is already last",

    };

  }



  const currentModule =

    courseModules[currentIndex];



  const targetModule =

    courseModules[targetIndex];



  if (!currentModule || !targetModule) {

    throw new Error(

      "Module reorder target not found"

    );

  }



  const currentSortOrder =

    currentModule.sortOrder;



  const targetSortOrder =

    targetModule.sortOrder;



  /*

   * Swap sortOrder values.

   */



  await db.orm.public.CourseModule

    .where({

      id: currentModule.id,

    })

    .update({

      sortOrder:

        targetSortOrder,

    });



  await db.orm.public.CourseModule

    .where({

      id: targetModule.id,

    })

    .update({

      sortOrder:

        currentSortOrder,

    });



  return {

    success: true,

    message:

      direction === "UP"

        ? "Module moved up successfully"

        : "Module moved down successfully",

  };

}



/* =========================================================

   REORDER LESSON

========================================================= */



export async function reorderLesson(

  lessonId: number,

  direction: "UP" | "DOWN"

) {

  const lesson =

    await db.orm.public.Lesson

      .where({ id: lessonId })

      .first();



  if (!lesson) {

    throw new Error("Lesson not found");

  }



  const allLessons =

    await db.orm.public.Lesson.all();



  const moduleLessons = allLessons

    .filter(

      (item) =>

        item.moduleId ===

        lesson.moduleId

    )

    .sort(

      (a, b) =>

        a.sortOrder - b.sortOrder

    );



  const currentIndex =

    moduleLessons.findIndex(

      (item) =>

        item.id === lessonId

    );



  if (currentIndex === -1) {

    throw new Error("Lesson not found");

  }



  const targetIndex =

    direction === "UP"

      ? currentIndex - 1

      : currentIndex + 1;



  /*

   * Already at first / last position.

   */



  if (

    targetIndex < 0 ||

    targetIndex >=

      moduleLessons.length

  ) {

    return {

      success: true,

      message:

        direction === "UP"

          ? "Lesson is already first"

          : "Lesson is already last",

    };

  }



  const currentLesson =

    moduleLessons[currentIndex];



  const targetLesson =

    moduleLessons[targetIndex];



  if (!currentLesson || !targetLesson) {

    throw new Error(

      "Lesson reorder target not found"

    );

  }



  const currentSortOrder =

    currentLesson.sortOrder;



  const targetSortOrder =

    targetLesson.sortOrder;



  /*

   * Swap sortOrder values.

   */



  await db.orm.public.Lesson

    .where({

      id: currentLesson.id,

    })

    .update({

      sortOrder:

        targetSortOrder,

    });



  await db.orm.public.Lesson

    .where({

      id: targetLesson.id,

    })

    .update({

      sortOrder:

        currentSortOrder,

    });



  return {

    success: true,

    message:

      direction === "UP"

        ? "Lesson moved up successfully"

        : "Lesson moved down successfully",

  };

}

/* =========================================================
   UPDATE LESSON IMAGE
========================================================= */

export async function updateLessonImage(
  lessonId: number,
  imageUrl: string
) {
  const lesson =
    await db.orm.public.Lesson
      .where({
        id: lessonId,
      })
      .first();

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  return db.orm.public.Lesson
    .where({
      id: lessonId,
    })
    .update({
      imageUrl,
    });
}
