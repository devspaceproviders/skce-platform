import type { Request, Response } from "express";



import { db } from "../../prisma/db";

import {

  hasTrainerCoursePermission,

} from "../../auth/services/trainer-course-permission.service";

import {
  updateLessonImage,
} from "../services/course-content-admin.service";



import {

  getAdminCourseContent,

  createModule,

  updateModule,

  deleteModule,

  createLesson,

  updateLesson,

  deleteLesson,

  reorderModule,

  reorderLesson,

} from "../services/course-content-admin.service";



/* =========================================================

   TRAINER COURSE CONTENT PERMISSION

========================================================= */



async function checkCourseContentPermission(

  req: Request,

  res: Response,

  courseId: number

): Promise<boolean> {

  if (!req.user) {

    res.status(401).json({

      success: false,

      message: "Authentication required",

    });



    return false;

  }



  /*

   * ADMIN has unrestricted access.

   */

  if (req.user.role === "ADMIN") {

    return true;

  }



  /*

   * Only TRAINER can use these APIs besides ADMIN.

   */

  if (req.user.role !== "TRAINER") {

    res.status(403).json({

      success: false,

      message: "Access denied",

    });



    return false;

  }



  const allowed =

    await hasTrainerCoursePermission(

      req.user.userId,

      courseId,

      "canManageContent"

    );



  if (!allowed) {

    res.status(403).json({

      success: false,

      message:

        "You do not have permission to manage content for this course",

    });



    return false;

  }



  return true;

}



/* =========================================================

   GET COURSE ID FROM MODULE

========================================================= */



async function getCourseIdFromModule(

  moduleId: number

): Promise<number | null> {

  const module =

    await db.orm.public.CourseModule

      .where({

        id: moduleId,

      })

      .first();



  if (!module) {

    return null;

  }



  return module.courseId;

}



/* =========================================================

   GET COURSE ID FROM LESSON

========================================================= */



async function getCourseIdFromLesson(

  lessonId: number

): Promise<number | null> {

  const lesson =

    await db.orm.public.Lesson

      .where({

        id: lessonId,

      })

      .first();



  if (!lesson) {

    return null;

  }



  return getCourseIdFromModule(

    lesson.moduleId

  );

}



/* =========================================================

   GET COURSE CONTENT

========================================================= */



export async function getAdminCourseContentController(

  req: Request,

  res: Response

) {

  try {

    const courseId =

      Number(req.params.courseId);



    if (Number.isNaN(courseId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid course ID",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const data =

      await getAdminCourseContent(

        courseId

      );



    return res.status(200).json({

      success: true,

      data,

    });

  } catch (error) {

    console.error(

      "Get course content error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to load course content",

    });

  }

}



/* =========================================================

   CREATE MODULE

========================================================= */



export async function createModuleController(

  req: Request,

  res: Response

) {

  try {

    const courseId =

      Number(req.params.courseId);



    const {

      title,

      description,

    } = req.body;



    if (

      Number.isNaN(courseId) ||

      !title?.trim()

    ) {

      return res.status(400).json({

        success: false,

        message:

          "Course ID and module title are required",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const module =

      await createModule(

        courseId,

        title.trim(),

        description?.trim()

      );



    return res.status(201).json({

      success: true,

      data: module,

      message:

        "Module created successfully",

    });

  } catch (error) {

    console.error(

      "Create module error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to create module",

    });

  }

}



/* =========================================================

   UPDATE MODULE

========================================================= */



export async function updateModuleController(

  req: Request,

  res: Response

) {

  try {

    const moduleId =

      Number(req.params.moduleId);



    const {

      title,

      description,

    } = req.body;



    if (

      Number.isNaN(moduleId) ||

      !title?.trim()

    ) {

      return res.status(400).json({

        success: false,

        message:

          "Module ID and module title are required",

      });

    }



    const courseId =

      await getCourseIdFromModule(

        moduleId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Module not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const module =

      await updateModule(

        moduleId,

        title.trim(),

        description?.trim()

      );



    return res.status(200).json({

      success: true,

      data: module,

      message:

        "Module updated successfully",

    });

  } catch (error) {

    console.error(

      "Update module error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to update module",

    });

  }

}



/* =========================================================

   DELETE MODULE

========================================================= */



export async function deleteModuleController(

  req: Request,

  res: Response

) {

  try {

    const moduleId =

      Number(req.params.moduleId);



    if (Number.isNaN(moduleId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid module ID",

      });

    }



    const courseId =

      await getCourseIdFromModule(

        moduleId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Module not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const result =

      await deleteModule(

        moduleId

      );



    return res.status(200).json(result);

  } catch (error) {

    console.error(

      "Delete module error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to delete module",

    });

  }

}



/* =========================================================

   CREATE LESSON

========================================================= */



export async function createLessonController(

  req: Request,

  res: Response

) {

  try {

    const moduleId =

      Number(req.params.moduleId);



    const {

      title,

      description,

      content,

      videoUrl,

      documentUrl,

    } = req.body;



    if (

      Number.isNaN(moduleId) ||

      !title?.trim()

    ) {

      return res.status(400).json({

        success: false,

        message:

          "Module ID and lesson title are required",

      });

    }



    const courseId =

      await getCourseIdFromModule(

        moduleId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Module not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const lesson =

      await createLesson(

        moduleId,

        title.trim(),

        description?.trim(),

        content?.trim(),

        videoUrl?.trim(),

        documentUrl?.trim()

      );



    return res.status(201).json({

      success: true,

      data: lesson,

      message:

        "Lesson created successfully",

    });

  } catch (error) {

    console.error(

      "Create lesson error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to create lesson",

    });

  }

}



/* =========================================================

   UPDATE LESSON

========================================================= */



export async function updateLessonController(

  req: Request,

  res: Response

) {

  try {

    const lessonId =

      Number(req.params.lessonId);



    const {

      title,

      description,

      content,

      videoUrl,

      documentUrl,

    } = req.body;



    if (

      Number.isNaN(lessonId) ||

      !title?.trim()

    ) {

      return res.status(400).json({

        success: false,

        message:

          "Lesson ID and lesson title are required",

      });

    }



    const courseId =

      await getCourseIdFromLesson(

        lessonId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Lesson not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const lesson =

      await updateLesson(

        lessonId,

        title.trim(),

        description?.trim(),

        content?.trim(),

        videoUrl?.trim(),

        documentUrl?.trim()

      );



    return res.status(200).json({

      success: true,

      data: lesson,

      message:

        "Lesson updated successfully",

    });

  } catch (error) {

    console.error(

      "Update lesson error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to update lesson",

    });

  }

}



/* =========================================================

   DELETE LESSON

========================================================= */



export async function deleteLessonController(

  req: Request,

  res: Response

) {

  try {

    const lessonId =

      Number(req.params.lessonId);



    if (Number.isNaN(lessonId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid lesson ID",

      });

    }



    const courseId =

      await getCourseIdFromLesson(

        lessonId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Lesson not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const result =

      await deleteLesson(

        lessonId

      );



    return res.status(200).json(result);

  } catch (error) {

    console.error(

      "Delete lesson error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to delete lesson",

    });

  }

}



/* =========================================================

   UPLOAD LESSON VIDEO

========================================================= */



export async function uploadLessonVideoController(

  req: Request,

  res: Response

) {

  try {

    const lessonId =

      Number(req.params.lessonId);



    if (Number.isNaN(lessonId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid lesson ID",

      });

    }



    const file = req.file;



    if (!file) {

      return res.status(400).json({

        success: false,

        message: "Video file is required",

      });

    }



    const courseId =

      await getCourseIdFromLesson(

        lessonId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Lesson not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const videoUrl =

      `/uploads/course-content/videos/${file.filename}`;



    const lesson =

      await db.orm.public.Lesson

        .where({

          id: lessonId,

        })

        .update({

          videoUrl,

        });



    return res.status(200).json({

      success: true,

      data: lesson,

      message:

        "Lesson video uploaded successfully",

    });

  } catch (error) {

    console.error(

      "Upload lesson video error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to upload lesson video",

    });

  }

}



/* =========================================================

   UPLOAD LESSON DOCUMENT

========================================================= */



export async function uploadLessonDocumentController(

  req: Request,

  res: Response

) {

  try {

    const lessonId =

      Number(req.params.lessonId);



    if (Number.isNaN(lessonId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid lesson ID",

      });

    }



    const file = req.file;



    if (!file) {

      return res.status(400).json({

        success: false,

        message: "Document file is required",

      });

    }



    const courseId =

      await getCourseIdFromLesson(

        lessonId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Lesson not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const documentUrl =

      `/uploads/course-content/documents/${file.filename}`;



    const lesson =

      await db.orm.public.Lesson

        .where({

          id: lessonId,

        })

        .update({

          documentUrl,

        });



    return res.status(200).json({

      success: true,

      data: lesson,

      message:

        "Lesson document uploaded successfully",

    });

  } catch (error) {

    console.error(

      "Upload lesson document error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to upload lesson document",

    });

  }

}



/* =========================================================

   REORDER MODULE

========================================================= */



export async function reorderModuleController(

  req: Request,

  res: Response

) {

  try {

    const moduleId =

      Number(req.params.moduleId);



    const direction =

      String(

        req.body?.direction || ""

      ).toUpperCase();



    if (Number.isNaN(moduleId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid module ID",

      });

    }



    if (

      direction !== "UP" &&

      direction !== "DOWN"

    ) {

      return res.status(400).json({

        success: false,

        message:

          "Direction must be UP or DOWN",

      });

    }



    const courseId =

      await getCourseIdFromModule(

        moduleId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Module not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const result =

      await reorderModule(

        moduleId,

        direction as "UP" | "DOWN"

      );



    return res.status(200).json({

      success: true,

      message:

        result?.message ||

        "Module reordered successfully",

      data: result,

    });

  } catch (error) {

    console.error(

      "Reorder module error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to reorder module",

    });

  }

}



/* =========================================================

   REORDER LESSON

========================================================= */



export async function reorderLessonController(

  req: Request,

  res: Response

) {

  try {

    const lessonId =

      Number(req.params.lessonId);



    const direction =

      String(

        req.body?.direction || ""

      ).toUpperCase();



    if (Number.isNaN(lessonId)) {

      return res.status(400).json({

        success: false,

        message: "Invalid lesson ID",

      });

    }



    if (

      direction !== "UP" &&

      direction !== "DOWN"

    ) {

      return res.status(400).json({

        success: false,

        message:

          "Direction must be UP or DOWN",

      });

    }



    const courseId =

      await getCourseIdFromLesson(

        lessonId

      );



    if (courseId === null) {

      return res.status(404).json({

        success: false,

        message: "Lesson not found",

      });

    }



    const allowed =

      await checkCourseContentPermission(

        req,

        res,

        courseId

      );



    if (!allowed) {

      return;

    }



    const result =

      await reorderLesson(

        lessonId,

        direction as "UP" | "DOWN"

      );



    return res.status(200).json({

      success: true,

      message:

        result?.message ||

        "Lesson reordered successfully",

      data: result,

    });

  } catch (error) {

    console.error(

      "Reorder lesson error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to reorder lesson",

    });

  }

}

/* =========================================================
   UPLOAD LESSON IMAGE
========================================================= */

export async function uploadLessonImageController(
  req: Request,
  res: Response
) {
  try {
    const lessonId =
      Number(req.params.lessonId);

    if (Number.isNaN(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Lesson image is required",
      });
    }

    const courseId =
      await getCourseIdFromLesson(
        lessonId
      );

    if (courseId === null) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const allowed =
      await checkCourseContentPermission(
        req,
        res,
        courseId
      );

    if (!allowed) {
      return;
    }

    const imageUrl =
      `/uploads/course-content/images/${file.filename}`;

    const lesson =
      await updateLessonImage(
        lessonId,
        imageUrl
      );

    return res.status(200).json({
      success: true,
      data: lesson,
      message:
        "Lesson image uploaded successfully",
    });
  } catch (error) {
    console.error(
      "Upload lesson image error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Lesson not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload lesson image",
    });
  }
}
