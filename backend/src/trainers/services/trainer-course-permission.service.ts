import { db } from "../../prisma/db";

export interface TrainerCoursePermissionInput {
  trainerId: number;
  courseId: number;
  canTeach?: boolean;
  canManageContent?: boolean;
  canCreateAssessments?: boolean;
  canCreateLiveSessions?: boolean;
}

export interface TrainerCoursePermissionUpdateInput {
  canTeach?: boolean;
  canManageContent?: boolean;
  canCreateAssessments?: boolean;
  canCreateLiveSessions?: boolean;
}

export async function listTrainerCoursePermissions() {
  return await db.orm.public.TrainerCoursePermission.all();
}

/**
 * Get all course permissions belonging to the
 * currently authenticated trainer.
 *
 * The caller provides the User.id from the JWT.
 * We resolve:
 *
 * User.id
 *   -> TrainerProfile.userId
 *   -> TrainerProfile.id
 *   -> TrainerCoursePermission.trainerId
 */
export async function listCurrentTrainerCoursePermissions(
  userId: number
) {
  const trainerProfile =
    await db.orm.public.TrainerProfile
      .where({
        userId,
      })
      .first();

  if (!trainerProfile) {
    throw new Error("Trainer profile not found");
  }

  return await db.orm.public.TrainerCoursePermission
    .where({
      trainerId: trainerProfile.id,
    })
    .all();
}

export async function getTrainerCoursePermission(
  trainerId: number,
  courseId: number
) {
  return await db.orm.public.TrainerCoursePermission
    .where({
      trainerId,
      courseId,
    })
    .first();
}

export async function createTrainerCoursePermission(
  input: TrainerCoursePermissionInput
) {
  const existing =
    await db.orm.public.TrainerCoursePermission
      .where({
        trainerId: input.trainerId,
        courseId: input.courseId,
      })
      .first();

  if (existing) {
    throw new Error(
      "Permission already exists for this trainer and course"
    );
  }

  return await db.orm.public.TrainerCoursePermission.create({
    trainerId: input.trainerId,
    courseId: input.courseId,
    canTeach: input.canTeach ?? true,
    canManageContent:
      input.canManageContent ?? false,
    canCreateAssessments:
      input.canCreateAssessments ?? false,
    canCreateLiveSessions:
      input.canCreateLiveSessions ?? false,
  });
}

export async function updateTrainerCoursePermission(
  trainerId: number,
  courseId: number,
  input: TrainerCoursePermissionUpdateInput
) {
  const existing =
    await db.orm.public.TrainerCoursePermission
      .where({
        trainerId,
        courseId,
      })
      .first();

  if (!existing) {
    throw new Error(
      "Permission not found for this trainer and course"
    );
  }

  return await db.orm.public.TrainerCoursePermission
    .where({
      id: existing.id,
    })
    .update({
      canTeach:
        input.canTeach ?? existing.canTeach,
      canManageContent:
        input.canManageContent ??
        existing.canManageContent,
      canCreateAssessments:
        input.canCreateAssessments ??
        existing.canCreateAssessments,
      canCreateLiveSessions:
        input.canCreateLiveSessions ??
        existing.canCreateLiveSessions,
    });
}

export async function deleteTrainerCoursePermission(
  trainerId: number,
  courseId: number
) {
  const existing =
    await db.orm.public.TrainerCoursePermission
      .where({
        trainerId,
        courseId,
      })
      .first();

  if (!existing) {
    throw new Error(
      "Permission not found for this trainer and course"
    );
  }

  await db.orm.public.TrainerCoursePermission
    .where({
      id: existing.id,
    })
    .delete();

  return {
    success: true,
  };
}