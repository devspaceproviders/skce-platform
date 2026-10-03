import { db } from "../../prisma/db";

/* ==========================================================
   TRAINER ACTIVITY ACTIONS
========================================================== */

export type TrainerActivityAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "ACTIVATED"
  | "DEACTIVATED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "APPROVED"
  | "REJECTED"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "SCHEDULED"
  | "CANCELLED"
  | "COMPLETED"
  | "STARTED"
  | "ENDED"
  | "JOINED"
  | "LEFT";

/* ==========================================================
   TRAINER ACTIVITY ENTITY TYPES
========================================================== */

export type TrainerActivityEntityType =
  | "TRAINER"
  | "AUTHENTICATION"
  | "MEETING"
  | "LIVE_SESSION"
  | "AVAILABILITY"
  | "COURSE"
  | "COURSE_CONTENT"
  | "ASSESSMENT"
  | "BATCH"
  | "PERMISSION"
  | "STUDENT"
  | "PROFILE"
  | "OTHER";

/* ==========================================================
   INPUT
========================================================== */

export type CreateTrainerActivityInput = {
  trainerId: number;
  actorUserId: number;

  action: TrainerActivityAction;
  entityType: TrainerActivityEntityType;

  entityId?: number | null;

  description: string;

  metadata?: Record<string, unknown> | null;
};

/* ==========================================================
   CREATE ACTIVITY
========================================================== */

/**
 * Creates one audit/history record for a trainer.
 *
 * Important:
 * - trainerId = whose activity history this belongs to
 * - actorUserId = who actually performed the action
 *
 * Example:
 *
 * Admin resets Chaitanya's password:
 *
 * trainerId   = Chaitanya
 * actorUserId = Admin
 *
 * Trainer schedules his own meeting:
 *
 * trainerId   = Chaitanya
 * actorUserId = Chaitanya
 */
export async function createTrainerActivity(
  input: CreateTrainerActivityInput
) {
  const description = input.description.trim();

  if (!description) {
    throw new Error(
      "Trainer activity description is required."
    );
  }

  const metadata =
    input.metadata !== undefined &&
    input.metadata !== null
      ? JSON.stringify(input.metadata)
      : null;

  const activity =
    await db.orm.public.TrainerActivity.create({
      trainerId: input.trainerId,

      actorUserId: input.actorUserId,

      action: input.action,

      entityType: input.entityType,

      entityId:
        input.entityId !== undefined
          ? input.entityId
          : null,

      description,

      metadata,
    });

  return activity;
}

/* ==========================================================
   GET TRAINER ACTIVITY HISTORY
========================================================== */

export async function getTrainerActivityHistory(
  trainerId: number
) {
  const activities =
    await db.orm.public.TrainerActivity
      .where({
        trainerId,
      })
      .all();

  return activities.sort(
    (a, b) =>
      new Date(
        b.createdAt
      ).getTime() -
      new Date(
        a.createdAt
      ).getTime()
  );
}