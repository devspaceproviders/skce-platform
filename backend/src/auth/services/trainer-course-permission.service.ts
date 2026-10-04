import { db } from "../../prisma/db";

export type TrainerCoursePermission =
  | "canTeach"
  | "canManageContent"
  | "canCreateAssessments"

export async function hasTrainerCoursePermission(
  userId: number,
  courseId: number,
  permission: TrainerCoursePermission
): Promise<boolean> {
  const trainerProfile =
    await db.orm.public.TrainerProfile
      .where({ userId })
      .first();

  if (!trainerProfile) {
    return false;
  }

  const trainerPermission =
    await db.orm.public.TrainerCoursePermission
      .where({
        trainerId: trainerProfile.id,
        courseId,
      })
      .first();

  if (!trainerPermission) {
    return false;
  }

  return Boolean(
    trainerPermission[permission]
  );
}