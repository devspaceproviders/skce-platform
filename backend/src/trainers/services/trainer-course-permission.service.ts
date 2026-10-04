import { db } from "../../prisma/db";
import {
  createTrainerActivity,
} from "./trainer-activity.service";

export interface TrainerCoursePermissionInput {
  trainerId: number;
  courseId: number;
  canTeach?: boolean;
  canManageContent?: boolean;
  canCreateAssessments?: boolean;
}

export interface TrainerCoursePermissionUpdateInput {
  canTeach?: boolean;
  canManageContent?: boolean;
  canCreateAssessments?: boolean;
}

export async function listTrainerCoursePermissions() {
  return await db.orm.public.TrainerCoursePermission.all();
}

/**
 * Get all course permissions belonging to the
 * currently authenticated trainer.
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

async function getCourseTitle(
  courseId: number
): Promise<string> {
  const course =
    await db.orm.public.Course
      .where({
        id: courseId,
      })
      .first();

  return course?.title ?? `Course #${courseId}`;
}

async function recordTrainerPermissionActivity(
  actorUserId: number,
  trainerId: number,
  courseId: number,
  action:
    | "ASSIGNED"
    | "UPDATED"
    | "UNASSIGNED",
  permissionId: number,
  description: string,
  metadata: Record<string, unknown>
) {
  try {
    await createTrainerActivity({
      trainerId,
      actorUserId,
      action,
      entityType: "PERMISSION",
      entityId: permissionId,
      description,
      metadata,
    });
  } catch (error) {
    /*
     * Activity logging must not cause the
     * permission operation itself to fail.
     */
    console.error(
      "Failed to record trainer permission activity:",
      error
    );
  }
}

export async function createTrainerCoursePermission(
  input: TrainerCoursePermissionInput,
  actorUserId: number
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

  const permission =
    await db.orm.public.TrainerCoursePermission.create({
      trainerId: input.trainerId,
      courseId: input.courseId,
      canTeach: input.canTeach ?? true,
      canManageContent:
        input.canManageContent ?? false,
      canCreateAssessments:
        input.canCreateAssessments ?? false,
    });

  const courseTitle =
    await getCourseTitle(input.courseId);

  await recordTrainerPermissionActivity(
    actorUserId,
    input.trainerId,
    input.courseId,
    "ASSIGNED",
    permission.id,
    `Course permission assigned for ${courseTitle}`,
    {
      courseId: input.courseId,
      canTeach: permission.canTeach,
      canManageContent:
        permission.canManageContent,
      canCreateAssessments:
        permission.canCreateAssessments,
    }
  );

  return permission;
}

export async function updateTrainerCoursePermission(
  trainerId: number,
  courseId: number,
  input: TrainerCoursePermissionUpdateInput,
  actorUserId: number
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

  const nextValues = {
    canTeach:
      input.canTeach ?? existing.canTeach,
    canManageContent:
      input.canManageContent ??
      existing.canManageContent,
    canCreateAssessments:
      input.canCreateAssessments ??
      existing.canCreateAssessments,
  };

  const updated =
    await db.orm.public.TrainerCoursePermission
      .where({
        id: existing.id,
      })
      .update(nextValues);

  const courseTitle =
    await getCourseTitle(courseId);

  await recordTrainerPermissionActivity(
    actorUserId,
    trainerId,
    courseId,
    "UPDATED",
    existing.id,
    `Course permission updated for ${courseTitle}`,
    {
      courseId,
      before: {
        canTeach: existing.canTeach,
        canManageContent:
          existing.canManageContent,
        canCreateAssessments:
          existing.canCreateAssessments,
      },
      after: nextValues,
    }
  );

  return updated;
}

export async function deleteTrainerCoursePermission(
  trainerId: number,
  courseId: number,
  actorUserId: number
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

  const courseTitle =
    await getCourseTitle(courseId);

  await recordTrainerPermissionActivity(
    actorUserId,
    trainerId,
    courseId,
    "UNASSIGNED",
    existing.id,
    `Course permission removed for ${courseTitle}`,
    {
      courseId,
      canTeach: existing.canTeach,
      canManageContent:
        existing.canManageContent,
      canCreateAssessments:
        existing.canCreateAssessments,
    }
  );

  return {
    success: true,
  };
}