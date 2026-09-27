import { db } from "../../prisma/db";
import { hasTrainerCoursePermission } from "../../auth/services/trainer-course-permission.service";

type BatchMode =
  | "ONLINE"
  | "OFFLINE"
  | "HYBRID";

type BatchStatus =
  | "UPCOMING"
  | "ACTIVE"
  | "COMPLETED"
  | "INACTIVE";

type CreateBatchInput = {
  name: string;
  courseId: number;
  trainerId?: number | null;
  startDate: string;
  endDate: string;
  mode?: BatchMode;
  maxStudents?: number;
  status?: BatchStatus;
};

type UpdateBatchInput = Partial<
  CreateBatchInput
>;

function normalizeBatch(batch: any) {
  return {
    id: batch.id,
    displayId: `BAT${String(batch.id).padStart(
      3,
      "0"
    )}`,
    name: batch.name,
    courseId: batch.courseId,
    trainerId: batch.trainerId,
    startDate: batch.startDate,
    endDate: batch.endDate,
    mode: batch.mode,
    maxStudents: batch.maxStudents,
    status: batch.status,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };
}

function validateDates(
  startDate: string,
  endDate: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error(
      "Start date and end date must be valid dates"
    );
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error(
      "End date must be later than start date"
    );
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function getCourseMap() {
  const courses =
    await db.orm.public.Course.all();

  return new Map(
    courses.map((course) => [
      course.id,
      course,
    ])
  );
}

async function getTrainerMap() {
  const profiles =
    await db.orm.public.TrainerProfile.all();

  const users =
    await db.orm.public.User.all();

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user,
    ])
  );

  return new Map(
    profiles.map((profile) => [
      profile.id,
      {
        ...profile,
        user: userMap.get(
          profile.userId
        ),
      },
    ])
  );
}

async function getStudentMap() {
  const profiles =
    await db.orm.public.StudentProfile.all();

  const users =
    await db.orm.public.User.all();

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user,
    ])
  );

  return new Map(
    profiles.map((profile) => [
      profile.id,
      {
        ...profile,
        user: userMap.get(
          profile.userId
        ),
      },
    ])
  );
}

export async function listBatches() {
  const [
    batches,
    courseMap,
    trainerMap,
  ] = await Promise.all([
    db.orm.public.Batch.all(),
    getCourseMap(),
    getTrainerMap(),
  ]);

  return batches
    .sort(
      (a, b) =>
        new Date(
          a.startDate
        ).getTime() -
        new Date(
          b.startDate
        ).getTime()
    )
    .map((batch) => {
      const course =
        courseMap.get(
          batch.courseId
        );

      const trainer =
        batch.trainerId
          ? trainerMap.get(
              batch.trainerId
            )
          : null;

      return {
        ...normalizeBatch(
          batch
        ),
        course: course
          ? {
              id: course.id,
              slug: course.slug,
              title: course.title,
              isActive:
                course.isActive,
            }
          : null,
        trainer: trainer
          ? {
              id: trainer.id,
              userId:
                trainer.userId,
              name:
                trainer.user?.name ||
                "Trainer",
              email:
                trainer.user?.email ||
                "",
              isActive:
                trainer.user
                  ?.isActive ??
                false,
            }
          : null,
      };
    });
}

export async function getBatchById(
  batchId: number
) {
  const batch =
    await db.orm.public.Batch
      .where({ id: batchId })
      .first();

  if (!batch) {
    throw new Error(
      "Batch not found"
    );
  }

  const course =
    await db.orm.public.Course
      .where({
        id: batch.courseId,
      })
      .first();

  let trainer = null;

  if (batch.trainerId) {
    const profile =
      await db.orm.public.TrainerProfile
        .where({
          id: batch.trainerId,
        })
        .first();

    if (profile) {
      const user =
        await db.orm.public.User
          .where({
            id: profile.userId,
          })
          .first();

      trainer = {
        id: profile.id,
        userId:
          profile.userId,
        name:
          user?.name ||
          "Trainer",
        email:
          user?.email ||
          "",
        phone:
          user?.phone ||
          null,
        isActive:
          user?.isActive ??
          false,
      };
    }
  }

  const assignments =
    await db.orm.public.BatchStudent.all();

  const studentMap =
    await getStudentMap();

  const students =
    assignments
      .filter(
        (assignment) =>
          assignment.batchId ===
          batchId
      )
      .map((assignment) => {
        const student =
          studentMap.get(
            assignment.studentId
          );

        return {
          id: assignment.id,
          studentId:
            assignment.studentId,
          assignedAt:
            assignment.assignedAt,
          completedAt:
            assignment.completedAt,
          student: student
            ? {
                id: student.id,
                studentId:
                  student.studentId,
                name:
                  student.user?.name ||
                  "Student",
                email:
                  student.user?.email ||
                  "",
                phone:
                  student.user?.phone ||
                  null,
                isActive:
                  student.user
                    ?.isActive ??
                  false,
              }
            : null,
        };
      });

  return {
    ...normalizeBatch(
      batch
    ),
    course: course
      ? {
          id: course.id,
          slug: course.slug,
          title: course.title,
          isActive:
            course.isActive,
        }
      : null,
    trainer,
    students,
    studentCount:
      students.length,
  };
}

export async function createBatch(
  input: CreateBatchInput
) {
  const name =
    input.name.trim();

  if (!name) {
    throw new Error(
      "Batch name is required"
    );
  }

  if (
    !Number.isInteger(
      input.courseId
    ) ||
    input.courseId <= 0
  ) {
    throw new Error(
      "Valid courseId is required"
    );
  }

  const course =
    await db.orm.public.Course
      .where({
        id: input.courseId,
      })
      .first();

  if (!course) {
    throw new Error(
      "Course not found"
    );
  }

  let trainerId:
    | number
    | null = null;

  if (
    input.trainerId !==
      null &&
    input.trainerId !==
      undefined
  ) {
    if (
      !Number.isInteger(
        input.trainerId
      ) ||
      input.trainerId <= 0
    ) {
      throw new Error(
        "Invalid trainerId"
      );
    }

    const trainer =
      await db.orm.public.TrainerProfile
        .where({
          id: input.trainerId,
        })
        .first();

    if (!trainer) {
      throw new Error(
        "Trainer not found"
      );
    }

    const trainerUser =
      await db.orm.public.User
        .where({
          id: trainer.userId,
        })
        .first();

    if (
      trainerUser &&
      trainerUser.role !==
        "TRAINER"
    ) {
      throw new Error(
        "Selected profile is not a trainer"
      );
    }

    trainerId =
      input.trainerId;
  }

  if (
    !input.startDate ||
    !input.endDate
  ) {
    throw new Error(
      "Start date and end date are required"
    );
  }

  const {
    start,
    end,
  } = validateDates(
    input.startDate,
    input.endDate
  );

  const maxStudents =
    input.maxStudents ??
    30;

  if (
    !Number.isInteger(
      maxStudents
    ) ||
    maxStudents <= 0
  ) {
    throw new Error(
      "Maximum students must be a positive integer"
    );
  }

  const mode =
    input.mode ??
    "OFFLINE";

  const status =
    input.status ??
    "UPCOMING";

  const batch =
    await db.orm.public.Batch.create(
      {
        name,
        courseId:
          input.courseId,
        trainerId,
        startDate: start,
        endDate: end,
        mode,
        maxStudents,
        status,
      }
    );

  return getBatchById(
    batch.id
  );
}

export async function updateBatch(
  batchId: number,
  input: UpdateBatchInput
) {
  const existing =
    await db.orm.public.Batch
      .where({ id: batchId })
      .first();

  if (!existing) {
    throw new Error(
      "Batch not found"
    );
  }

  const updateData: Record<
    string,
    unknown
  > = {};

  if (
    input.name !==
    undefined
  ) {
    const name =
      input.name.trim();

    if (!name) {
      throw new Error(
        "Batch name cannot be empty"
      );
    }

    updateData.name = name;
  }

  if (
    input.courseId !==
    undefined
  ) {
    if (
      !Number.isInteger(
        input.courseId
      ) ||
      input.courseId <= 0
    ) {
      throw new Error(
        "Invalid courseId"
      );
    }

    const course =
      await db.orm.public.Course
        .where({
          id: input.courseId,
        })
        .first();

    if (!course) {
      throw new Error(
        "Course not found"
      );
    }

    updateData.courseId =
      input.courseId;
  }

  if (
    input.trainerId !==
    undefined
  ) {
    if (
      input.trainerId ===
      null
    ) {
      updateData.trainerId =
        null;
    } else {
      if (
        !Number.isInteger(
          input.trainerId
        ) ||
        input.trainerId <= 0
      ) {
        throw new Error(
          "Invalid trainerId"
        );
      }

      const trainer =
        await db.orm.public.TrainerProfile
          .where({
            id: input.trainerId,
          })
          .first();

      if (!trainer) {
        throw new Error(
          "Trainer not found"
        );
      }

      updateData.trainerId =
        input.trainerId;
    }
  }

  const nextStart =
    input.startDate ??
    existing.startDate;

  const nextEnd =
    input.endDate ??
    existing.endDate;

  if (
    input.startDate !==
      undefined ||
    input.endDate !==
      undefined
  ) {
    const {
      start,
      end,
    } = validateDates(
      nextStart,
      nextEnd
    );

    updateData.startDate =
      start;
    updateData.endDate =
      end;
  }

  if (
    input.mode !==
    undefined
  ) {
    updateData.mode =
      input.mode;
  }

  if (
    input.maxStudents !==
    undefined
  ) {
    if (
      !Number.isInteger(
        input.maxStudents
      ) ||
      input.maxStudents <= 0
    ) {
      throw new Error(
        "Maximum students must be a positive integer"
      );
    }

    const assignments =
      await db.orm.public.BatchStudent.all();

    const studentCount =
      assignments.filter(
        (assignment) =>
          assignment.batchId ===
          batchId
      ).length;

    if (
      input.maxStudents <
      studentCount
    ) {
      throw new Error(
        `Maximum students cannot be lower than the current student count (${studentCount})`
      );
    }

    updateData.maxStudents =
      input.maxStudents;
  }

  if (
    input.status !==
    undefined
  ) {
    updateData.status =
      input.status;
  }

  if (
    Object.keys(
      updateData
    ).length > 0
  ) {
    await db.orm.public.Batch
      .where({ id: batchId })
      .update(
        updateData
      );
  }

  return getBatchById(
    batchId
  );
}

export async function deleteBatch(
  batchId: number
) {
  const existing =
    await db.orm.public.Batch
      .where({ id: batchId })
      .first();

  if (!existing) {
    throw new Error(
      "Batch not found"
    );
  }

  await db.orm.public.Batch
    .where({ id: batchId })
    .delete();

  return {
    success: true,
    message:
      "Batch deleted successfully",
  };
}

export async function getBatchStudents(
  batchId: number
) {
  const batch =
    await db.orm.public.Batch
      .where({ id: batchId })
      .first();

  if (!batch) {
    throw new Error(
      "Batch not found"
    );
  }

  const assignments =
    await db.orm.public.BatchStudent.all();

  const studentMap =
    await getStudentMap();

  return assignments
    .filter(
      (assignment) =>
        assignment.batchId ===
        batchId
    )
    .map((assignment) => {
      const student =
        studentMap.get(
          assignment.studentId
        );

      return {
        id: assignment.id,
        studentId:
          assignment.studentId,
        assignedAt:
          assignment.assignedAt,
        completedAt:
          assignment.completedAt,
        student: student
          ? {
              id: student.id,
              studentId:
                student.studentId,
              name:
                student.user?.name ||
                "Student",
              email:
                student.user?.email ||
                "",
              phone:
                student.user?.phone ||
                null,
              isActive:
                student.user
                  ?.isActive ??
                false,
            }
          : null,
      };
    });
}

export async function addStudentToBatch(
  batchId: number,
  studentProfileId: number
) {
  const batch =
    await db.orm.public.Batch
      .where({ id: batchId })
      .first();

  if (!batch) {
    throw new Error(
      "Batch not found"
    );
  }

  const student =
    await db.orm.public.StudentProfile
      .where({
        id: studentProfileId,
      })
      .first();

  if (!student) {
    throw new Error(
      "Student not found"
    );
  }

  const assignments =
    await db.orm.public.BatchStudent.all();

  const alreadyAssigned =
    assignments.find(
      (assignment) =>
        assignment.batchId ===
          batchId &&
        assignment.studentId ===
          studentProfileId
    );

  if (alreadyAssigned) {
    throw new Error(
      "Student is already assigned to this batch"
    );
  }

  const currentCount =
    assignments.filter(
      (assignment) =>
        assignment.batchId ===
        batchId
    ).length;

  if (
    currentCount >=
    batch.maxStudents
  ) {
    throw new Error(
      "Batch capacity has been reached"
    );
  }

  const assignment =
    await db.orm.public.BatchStudent.create(
      {
        batchId,
        studentId:
          studentProfileId,
      }
    );

  return assignment;
}

export async function removeStudentFromBatch(
  batchId: number,
  studentProfileId: number
) {
  const assignments =
    await db.orm.public.BatchStudent.all();

  const assignment =
    assignments.find(
      (item) =>
        item.batchId ===
          batchId &&
        item.studentId ===
          studentProfileId
    );

  if (!assignment) {
    throw new Error(
      "Student is not assigned to this batch"
    );
  }

  await db.orm.public.BatchStudent
    .where({
      id: assignment.id,
    })
    .delete();

  return {
    success: true,
    message:
      "Student removed from batch successfully",
  };
}

export async function getBatchOptions() {
  const [
    courses,
    trainers,
    students,
  ] = await Promise.all([
    db.orm.public.Course.all(),
    db.orm.public.TrainerProfile.all(),
    db.orm.public.StudentProfile.all(),
  ]);

  const users =
    await db.orm.public.User.all();

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user,
    ])
  );

  return {
    courses: courses
      .filter(
        (course) =>
          course.isActive
      )
      .map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
      })),

    trainers: trainers
      .map((trainer) => {
        const user =
          userMap.get(
            trainer.userId
          );

        return {
          id: trainer.id,
          userId:
            trainer.userId,
          name:
            user?.name ||
            "Trainer",
          email:
            user?.email ||
            "",
          isActive:
            user?.isActive ??
            false,
        };
      })
      .filter(
        (trainer) =>
          trainer.isActive
      ),

    students: students
      .map((student) => {
        const user =
          userMap.get(
            student.userId
          );

        return {
          id: student.id,
          studentId:
            student.studentId,
          name:
            user?.name ||
            "Student",
          email:
            user?.email ||
            "",
          phone:
            user?.phone ||
            null,
          isActive:
            user?.isActive ??
            false,
        };
      })
      .filter(
        (student) =>
          student.isActive
      ),
  };
}

async function canTrainerTeachCourse(
  trainerProfileId: number,
  courseId: number
) {
  const trainer =
    await db.orm.public.TrainerProfile
      .where({
        id: trainerProfileId,
      })
      .first();

  if (!trainer) {
    throw new Error("Trainer profile not found");
  }

  return hasTrainerCoursePermission(
    trainer.userId,
    courseId,
    "canTeach"
  );
}

export async function listTrainerBatches(
  trainerProfileId: number
) {
  const [
    batches,
    courseMap,
    assignments,
  ] = await Promise.all([
    db.orm.public.Batch.all(),
    getCourseMap(),
    db.orm.public.BatchStudent.all(),
  ]);

  const teachableBatches = [];

  for (const batch of batches) {
    if (
      batch.trainerId !==
      trainerProfileId
    ) {
      continue;
    }

    const canTeach =
      await canTrainerTeachCourse(
        trainerProfileId,
        batch.courseId
      );

    if (canTeach) {
      teachableBatches.push(batch);
    }
  }

  return teachableBatches
    .sort(
      (a, b) =>
        new Date(
          a.startDate
        ).getTime() -
        new Date(
          b.startDate
        ).getTime()
    )
    .map((batch) => {
      const studentCount =
        assignments.filter(
          (assignment) =>
            assignment.batchId ===
            batch.id
        ).length;

      const course =
        courseMap.get(
          batch.courseId
        );

      return {
        ...normalizeBatch(
          batch
        ),
        course: course
          ? {
              id: course.id,
              slug: course.slug,
              title: course.title,
              isActive:
                course.isActive,
            }
          : null,
        studentCount,
      };
    });
}

export async function getTrainerBatchById(
  trainerProfileId: number,
  batchId: number
) {
  const batch =
    await db.orm.public.Batch
      .where({
        id: batchId,
      })
      .first();

  if (!batch) {
    throw new Error(
      "Batch not found"
    );
  }

  if (
    batch.trainerId !==
    trainerProfileId
  ) {
    throw new Error(
      "Access denied"
    );
  }

  const canTeach =
    await canTrainerTeachCourse(
      trainerProfileId,
      batch.courseId
    );

  if (!canTeach) {
    throw new Error(
      "Access denied"
    );
  }

  const details =
    await getBatchById(
      batchId
    );

  return details;
}

export async function getTrainerProfileId(
  userId: number
) {
  const trainer =
    await db.orm.public.TrainerProfile
      .where({
        userId,
      })
      .first();

  if (!trainer) {
    throw new Error(
      "Trainer profile not found"
    );
  }

  return trainer.id;
}
