import { randomUUID } from "node:crypto";



import { db } from "../../prisma/db";
import fs from "node:fs";
import path from "node:path";

import { generateCertificatePdf } from "../../certificates/certificate-pdf.service";



/**

 * Check whether a student is enrolled in a specific course.

 */

async function verifyCourseEnrollment(

  userId: number,

  courseId: number

) {

  const enrollments =

    await db.orm.public.Enrollment.all();



  // Direct course enrollment

  const directEnrollment =

    enrollments.find(

      (enrollment) =>

        enrollment.userId === userId &&

        enrollment.courseId === courseId &&

        enrollment.status !== "CANCELLED"

    );



  if (directEnrollment) {

    return directEnrollment;

  }



  // Package enrollment

  const packageEnrollment =

    enrollments.find(

      (enrollment) =>

        enrollment.userId === userId &&

        enrollment.packageId !== null &&

        enrollment.status !== "CANCELLED"

    );



  if (!packageEnrollment?.packageId) {

    return null;

  }



  // Verify that this course belongs to

  // the student's purchased package.

  const packageCourses =

    await db.orm.public.PackageCourse.all();



  const packageCourse =

    packageCourses.find(

      (item) =>

        item.packageId ===

          packageEnrollment.packageId &&

        item.courseId === courseId

    );



  if (!packageCourse) {

    return null;

  }



  return packageEnrollment;

}





/**

 * Get all active lessons for a course in the same order used by the LMS.

 */

async function getOrderedCourseLessons(

  courseId: number

) {

  const allModules =

    await db.orm.public.CourseModule.all();



  const courseModules =

    allModules

      .filter(

        (module) =>

          module.courseId === courseId &&

          module.isActive

      )

      .sort(

        (a, b) =>

          a.sortOrder - b.sortOrder ||

          a.id - b.id

      );



  const moduleIds =

    courseModules.map(

      (module) => module.id

    );



  const allLessons =

    await db.orm.public.Lesson.all();



  return allLessons

    .filter(

      (lesson) =>

        moduleIds.includes(lesson.moduleId) &&

        lesson.isActive

    )

    .sort((a, b) => {

      const moduleA =

        courseModules.find(

          (module) =>

            module.id === a.moduleId

        );



      const moduleB =

        courseModules.find(

          (module) =>

            module.id === b.moduleId

        );



      return (

        (moduleA?.sortOrder ?? 0) -

          (moduleB?.sortOrder ?? 0) ||

        (moduleA?.id ?? 0) -

          (moduleB?.id ?? 0) ||

        a.sortOrder - b.sortOrder ||

        a.id - b.id

      );

    });

}





const certificatePdfDirectory = path.join(
  process.cwd(),
  "uploads",
  "certificates"
);

fs.mkdirSync(certificatePdfDirectory, { recursive: true });

/**
 * Generate and store the PDF for an issued certificate.
 */
async function generateCertificatePdfForRecord(
  certificateId: number,
  certificateNumber: string,
  userId: number,
  title: string,
  issuedAt: string
) {
  const user =
    await db.orm.public.User
      .where({ id: userId })
      .first();

  if (!user) {
    throw new Error("Certificate recipient not found");
  }

  const settings =
    await db.orm.public.CertificateSetting
      .first();

  const pdfBuffer =
    await generateCertificatePdf({
      certificateNumber,
      recipientName: user.name,
      courseTitle: title,
      issuedAt,
      logoUrl: settings?.logoUrl ?? null,
      signatureUrl: settings?.signatureUrl ?? null,
    });

  const safeCertificateNumber =
    certificateNumber.replace(/[^a-zA-Z0-9_-]/g, "_");

  const filename = `${safeCertificateNumber}.pdf`;

  const filePath = path.join(
    certificatePdfDirectory,
    filename
  );

  fs.writeFileSync(filePath, pdfBuffer);

  return await db.orm.public.Certificate
    .where({ id: certificateId })
    .update({
      certificateUrl: `/uploads/certificates/${filename}`,
    });
}


/**

 * Create the individual COURSE certificate for a completed course.

 *

 * A package enrollment may receive one COURSE certificate per

 * completed course, so enrollmentId alone must not be used as

 * the duplicate key.

 */

async function createCourseCertificate(

  userId: number,

  courseId: number,

  enrollment: {

    id: number;

    userId: number;

    courseId: number | null;

    packageId: number | null;

    status: string;

  }

) {

  let enrollmentBelongsToCourse =

    enrollment.courseId === courseId;



  if (

    !enrollmentBelongsToCourse &&

    enrollment.packageId !== null

  ) {

    const packageCourses =

      await db.orm.public.PackageCourse.all();



    enrollmentBelongsToCourse =

      packageCourses.some(

        (packageCourse) =>

          packageCourse.packageId ===

            enrollment.packageId &&

          packageCourse.courseId === courseId

      );

  }



  if (!enrollmentBelongsToCourse) {

    return null;

  }



  const allCertificates =

    await db.orm.public.Certificate.all();



  const existingCertificate =

    allCertificates.find(

      (certificate) =>

        certificate.enrollmentId ===

          enrollment.id &&

        certificate.certificateType ===

          "COURSE" &&

        certificate.courseId === courseId

    );



  if (existingCertificate) {

    if (!existingCertificate.certificateUrl) {
      const courseRecord =
        await db.orm.public.Course
          .where({ id: courseId })
          .first();

      if (courseRecord) {
        return await generateCertificatePdfForRecord(
          existingCertificate.id,
          existingCertificate.certificateNumber,
          userId,
          courseRecord.title,
          String(existingCertificate.issuedAt)
        );
      }
    }

    return existingCertificate;

  }



  const temporaryCertificateNumber =

    `SKCE-CERT-TEMP-${randomUUID()}`;



  const certificate =

    await db.orm.public.Certificate.create({

      certificateNumber:

        temporaryCertificateNumber,



      certificateType: "COURSE",



      enrollmentId:

        enrollment.id,



      userId,



      courseId,



      packageId:

        enrollment.packageId,



      issuedAt:

        new Date().toISOString(),



      certificateUrl: null,

    });



  const finalCertificateNumber =

    `SKCE-CERT-${String(

      certificate.id

    ).padStart(6, "0")}`;



  const finalizedCertificate =
    await db.orm.public.Certificate

      .where({

        id: certificate.id,

      })

      .update({

        certificateNumber:

          finalCertificateNumber,

      });

  if (!finalizedCertificate) {
    throw new Error("Failed to finalize course certificate");
  }

  const courseRecord =
    await db.orm.public.Course
      .where({ id: courseId })
      .first();

  return await generateCertificatePdfForRecord(
    finalizedCertificate.id,
    finalizedCertificate.certificateNumber,
    userId,
    courseRecord?.title ?? "Course Completion",
    String(finalizedCertificate.issuedAt)
  );

}





/**

 * Check whether every active lesson in a course has been completed

 * by the given user.

 */

async function isCourseCompletedForUser(

  userId: number,

  courseId: number

) {

  const orderedLessons =

    await getOrderedCourseLessons(courseId);



  if (orderedLessons.length === 0) {

    return false;

  }



  const allProgress =

    await db.orm.public.LessonProgress.all();



  const completedLessonIds =

    new Set(

      allProgress

        .filter(

          (item) =>

            item.userId === userId &&

            item.status === "COMPLETED"

        )

        .map(

          (item) => item.lessonId

        )

    );



  return orderedLessons.every(

    (lesson) =>

      completedLessonIds.has(lesson.id)

  );

}





/**

 * Create the final PACKAGE certificate once every course in the

 * purchased package has been completed.

 */

async function createPackageCertificateIfCompleted(

  userId: number,

  enrollment: {

    id: number;

    packageId: number | null;

  }

) {

  if (enrollment.packageId === null) {

    return null;

  }



  const packageCourses =

    await db.orm.public.PackageCourse.all();



  const coursesInPackage =

    packageCourses.filter(

      (packageCourse) =>

        packageCourse.packageId ===

        enrollment.packageId

    );



  if (coursesInPackage.length === 0) {

    return null;

  }



  for (const packageCourse of coursesInPackage) {

    const completed =

      await isCourseCompletedForUser(

        userId,

        packageCourse.courseId

      );



    if (!completed) {

      return null;

    }

  }



  const allCertificates =

    await db.orm.public.Certificate.all();



  const existingCertificate =

    allCertificates.find(

      (certificate) =>

        certificate.enrollmentId ===

          enrollment.id &&

        certificate.certificateType ===

          "PACKAGE" &&

        certificate.packageId ===

          enrollment.packageId

    );



  if (existingCertificate) {

    if (!existingCertificate.certificateUrl) {
      const packageRecord =
        await db.orm.public.CoursePackage
          .where({ id: enrollment.packageId })
          .first();

      if (packageRecord) {
        return await generateCertificatePdfForRecord(
          existingCertificate.id,
          existingCertificate.certificateNumber,
          userId,
          packageRecord.title,
          String(existingCertificate.issuedAt)
        );
      }
    }

    return existingCertificate;

  }



  const temporaryCertificateNumber =

    `SKCE-PKG-CERT-TEMP-${randomUUID()}`;



  const certificate =

    await db.orm.public.Certificate.create({

      certificateNumber:

        temporaryCertificateNumber,



      certificateType: "PACKAGE",



      enrollmentId:

        enrollment.id,



      userId,



      courseId: null,



      packageId:

        enrollment.packageId,



      issuedAt:

        new Date().toISOString(),



      certificateUrl: null,

    });



  const finalCertificateNumber =

    `SKCE-PKG-CERT-${String(

      certificate.id

    ).padStart(6, "0")}`;



  const finalizedCertificate =
    await db.orm.public.Certificate

      .where({

        id: certificate.id,

      })

      .update({

        certificateNumber:

          finalCertificateNumber,

      });

  if (!finalizedCertificate) {
    throw new Error("Failed to finalize package certificate");
  }

  const packageRecord =
    await db.orm.public.CoursePackage
      .where({ id: enrollment.packageId })
      .first();

  return await generateCertificatePdfForRecord(
    finalizedCertificate.id,
    finalizedCertificate.certificateNumber,
    userId,
    packageRecord?.title ?? "Package Completion",
    String(finalizedCertificate.issuedAt)
  );

}





/**

 * Start a lesson for a student.

 */

export async function startLesson(

  userId: number,

  lessonId: number

) {

  // ----------------------------------------------------------

  // Find lesson

  // ----------------------------------------------------------



  const lesson =

    await db.orm.public.Lesson

      .where({

        id: lessonId,

      })

      .first();



  if (!lesson) {

    throw new Error("Lesson not found");

  }





  // ----------------------------------------------------------

  // Find module

  // ----------------------------------------------------------



  const module =

    await db.orm.public.CourseModule

      .where({

        id: lesson.moduleId,

      })

      .first();



  if (!module) {

    throw new Error(

      "Course module not found"

    );

  }





  // ----------------------------------------------------------

  // Find course

  // ----------------------------------------------------------



  const course =

    await db.orm.public.Course

      .where({

        id: module.courseId,

      })

      .first();



  if (!course) {

    throw new Error("Course not found");

  }





  // ----------------------------------------------------------

  // Verify enrollment

  // ----------------------------------------------------------



  const enrollment =

    await verifyCourseEnrollment(

      userId,

      course.id

    );



  if (!enrollment) {

    throw new Error(

      "You are not enrolled in this course"

    );

  }





  // ----------------------------------------------------------

  // Sequential lesson locking

  // ----------------------------------------------------------

  //

  // Lesson 1 is available immediately.

  // Every later lesson requires the immediately previous

  // active lesson in course order to be COMPLETED.

  // ----------------------------------------------------------



  const orderedLessons =

    await getOrderedCourseLessons(course.id);



  const currentIndex =

    orderedLessons.findIndex(

      (item) => item.id === lessonId

    );



  if (currentIndex === -1) {

    throw new Error(

      "Lesson is not active in this course"

    );

  }



  if (currentIndex > 0) {

    const previousLesson =

      orderedLessons[currentIndex - 1];



    if (!previousLesson) {

      throw new Error(

        "Previous lesson not found"

      );

    }



    const previousProgress =

      await db.orm.public.LessonProgress

        .where({

          userId,

          lessonId: previousLesson.id,

        })

        .first();



    if (

      previousProgress?.status !==

      "COMPLETED"

    ) {

      throw new Error(

        "This lesson is locked. Complete the previous lesson first."

      );

    }

  }





  // ----------------------------------------------------------

  // Check existing progress

  // ----------------------------------------------------------



  const existing =

    await db.orm.public.LessonProgress

      .where({

        userId,

        lessonId,

      })

      .first();



  if (existing) {

    // If already completed, do not move it

    // backwards to IN_PROGRESS.

    if (

      existing.status ===

      "COMPLETED"

    ) {

      return existing;

    }



    return existing;

  }





  // ----------------------------------------------------------

  // Create progress

  // ----------------------------------------------------------



  const progress =

    await db.orm.public.LessonProgress.create({

      userId,

      lessonId,

      status: "IN_PROGRESS",

      startedAt:

        new Date().toISOString(),

    });



  return progress;

}





/**

 * Mark a lesson as completed.

 */

export async function completeLesson(

  userId: number,

  lessonId: number

) {

  // ----------------------------------------------------------

  // Find lesson

  // ----------------------------------------------------------



  const lesson =

    await db.orm.public.Lesson

      .where({

        id: lessonId,

      })

      .first();



  if (!lesson) {

    throw new Error("Lesson not found");

  }





  // ----------------------------------------------------------

  // Find module

  // ----------------------------------------------------------



  const module =

    await db.orm.public.CourseModule

      .where({

        id: lesson.moduleId,

      })

      .first();



  if (!module) {

    throw new Error("Course module not found");

  }





  // ----------------------------------------------------------

  // Find course

  // ----------------------------------------------------------



  const course =

    await db.orm.public.Course

      .where({

        id: module.courseId,

      })

      .first();



  if (!course) {

    throw new Error("Course not found");

  }





  // ----------------------------------------------------------

  // Verify enrollment

  // ----------------------------------------------------------



  const enrollment =

    await verifyCourseEnrollment(

      userId,

      course.id

    );



  if (!enrollment) {

    throw new Error(

      "You are not enrolled in this course"

    );

  }





  // ----------------------------------------------------------

  // Sequential lesson locking

  // ----------------------------------------------------------

  //

  // Lesson 1 is available immediately.

  // Every later lesson requires the immediately previous

  // active lesson in course order to be COMPLETED.

  // ----------------------------------------------------------



  const orderedLessons =

    await getOrderedCourseLessons(

      course.id

    );



  const currentIndex =

    orderedLessons.findIndex(

      (item) => item.id === lessonId

    );



  if (currentIndex === -1) {

    throw new Error(

      "Lesson is not active in this course"

    );

  }



  if (currentIndex > 0) {

    const previousLesson =

      orderedLessons[currentIndex - 1];



    if (!previousLesson) {

      throw new Error(

        "Previous lesson not found"

      );

    }



    const previousProgress =

      await db.orm.public.LessonProgress

        .where({

          userId,

          lessonId: previousLesson.id,

        })

        .first();



    if (

      previousProgress?.status !==

      "COMPLETED"

    ) {

      throw new Error(

        "This lesson is locked. Complete the previous lesson first."

      );

    }

  }





  // ----------------------------------------------------------

  // Check existing progress

  // ----------------------------------------------------------



  const existing =

    await db.orm.public.LessonProgress

      .where({

        userId,

        lessonId,

      })

      .first();





  // ----------------------------------------------------------

  // Complete lesson

  // ----------------------------------------------------------



  let progress;



  if (

    existing &&

    existing.status === "COMPLETED"

  ) {

    /*

     * The lesson is already completed.

     *

     * IMPORTANT:

     * Do NOT return here.

     *

     * We still need to continue to the course-completion

     * check below so that a certificate can be generated

     * for an already-completed enrollment.

     */

    progress = existing;

  } else if (existing) {

    progress =

      await db.orm.public.LessonProgress

        .where({

          id: existing.id,

        })

        .update({

          status: "COMPLETED",

          startedAt:

            existing.startedAt ??

            new Date().toISOString(),

          completedAt:

            new Date().toISOString(),

        });

  } else {

    progress =

      await db.orm.public.LessonProgress.create({

        userId,

        lessonId,

        status: "COMPLETED",

        startedAt:

          new Date().toISOString(),

        completedAt:

          new Date().toISOString(),

      });

  }





  // ----------------------------------------------------------

  // Check whether the entire course is completed

  // ----------------------------------------------------------



  const courseCompleted =

    await isCourseCompletedForUser(

      userId,

      course.id

    );



  if (courseCompleted) {

    // --------------------------------------------------------

    // Individual COURSE certificate

    // --------------------------------------------------------

    //

    // This is created for both direct-course enrollments and

    // package enrollments.

    // --------------------------------------------------------



    await createCourseCertificate(

      userId,

      course.id,

      {

        id: enrollment.id,

        userId: enrollment.userId,

        courseId: enrollment.courseId,

        packageId: enrollment.packageId,

        status: enrollment.status,

      }

    );



    // --------------------------------------------------------

    // Direct course enrollment

    // --------------------------------------------------------



    if (

      enrollment.packageId === null &&

      enrollment.status !== "COMPLETED"

    ) {

      await db.orm.public.Enrollment

        .where({

          id: enrollment.id,

        })

        .update({

          status: "COMPLETED",

          completedAt:

            new Date().toISOString(),

        });

    }



    // --------------------------------------------------------

    // Package enrollment

    // --------------------------------------------------------

    //

    // Completing one package course must NOT complete the

    // package enrollment. The package is completed only when

    // every course in the package is completed.

    // --------------------------------------------------------



    if (enrollment.packageId !== null) {

      const packageCertificate =

        await createPackageCertificateIfCompleted(

          userId,

          {

            id: enrollment.id,

            packageId: enrollment.packageId,

          }

        );



      if (packageCertificate) {

        await db.orm.public.Enrollment

          .where({

            id: enrollment.id,

          })

          .update({

            status: "COMPLETED",

            completedAt:

              new Date().toISOString(),

          });

      }

    }

  }





  return progress;

}





/**

 * Get progress for one course.

 */

export async function getCourseProgress(

  userId: number,

  courseId: number

) {

  // ----------------------------------------------------------

  // Find course

  // ----------------------------------------------------------



  const course =

    await db.orm.public.Course

      .where({

        id: courseId,

      })

      .first();



  if (!course) {

    throw new Error("Course not found");

  }





  // ----------------------------------------------------------

  // Verify enrollment

  // ----------------------------------------------------------



  const enrollment =

    await verifyCourseEnrollment(

      userId,

      courseId

    );



  if (!enrollment) {

    throw new Error(

      "You are not enrolled in this course"

    );

  }





  // ----------------------------------------------------------

  // Get modules

  // ----------------------------------------------------------



  const allModules =

    await db.orm.public.CourseModule.all();



  const courseModules =

    allModules.filter(

      (module) =>

        module.courseId === courseId &&

        module.isActive

    );





  // ----------------------------------------------------------

  // Get lessons

  // ----------------------------------------------------------



  const moduleIds =

    courseModules.map(

      (module) => module.id

    );



  const allLessons =

    await db.orm.public.Lesson.all();



  const lessons =

    allLessons.filter(

      (lesson) =>

        moduleIds.includes(

          lesson.moduleId

        ) &&

        lesson.isActive

    );





  // ----------------------------------------------------------

  // Get student's progress

  // ----------------------------------------------------------



  const allProgress =

    await db.orm.public.LessonProgress.all();



  const progress =

    allProgress.filter(

      (item) =>

        item.userId === userId &&

        lessons.some(

          (lesson) =>

            lesson.id ===

            item.lessonId

        )

    );





  // ----------------------------------------------------------

  // Calculate totals

  // ----------------------------------------------------------



  const totalLessons =

    lessons.length;



  const completedLessons =

    progress.filter(

      (item) =>

        item.status ===

        "COMPLETED"

    ).length;



  const startedLessons =

    progress.filter(

      (item) =>

        item.status ===

          "IN_PROGRESS" ||

        item.status ===

          "COMPLETED"

    ).length;



  const remainingLessons =

    Math.max(

      totalLessons -

        completedLessons,

      0

    );



  const progressPercentage =

    totalLessons === 0

      ? 0

      : Math.round(

          (completedLessons /

            totalLessons) *

            100

        );





  // ----------------------------------------------------------

  // Lesson-level progress

  // ----------------------------------------------------------



  const lessonProgress =

    lessons.map(

      (lesson) => {

        const item =

          progress.find(

            (progressItem) =>

              progressItem.lessonId ===

              lesson.id

          );



        return {

          lessonId: lesson.id,



          status:

            item?.status ??

            "NOT_STARTED",



          startedAt:

            item?.startedAt ??

            null,



          completedAt:

            item?.completedAt ??

            null,

        };

      }

    );





  return {

    courseId,



    totalLessons,



    completedLessons,



    startedLessons,



    remainingLessons,



    progressPercentage,



    lessons: lessonProgress,

  };

}