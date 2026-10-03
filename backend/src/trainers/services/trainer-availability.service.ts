import { db } from "../../prisma/db";

export const TRAINER_AVAILABILITY_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type TrainerAvailabilityDay =
  (typeof TRAINER_AVAILABILITY_DAYS)[number];

export type TrainerAvailabilityCreateInput = {
  trainerId: number;
  dayOfWeek: TrainerAvailabilityDay;
  startMinute: number;
  endMinute: number;
  timezone?: string;
  isActive?: boolean;
};

export type TrainerAvailabilityUpdateInput = {
  dayOfWeek?: TrainerAvailabilityDay;
  startMinute?: number;
  endMinute?: number;
  timezone?: string;
  isActive?: boolean;
};

function requirePositiveId(
  value: number,
  label: string
) {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `Invalid ${label}.`
    );
  }

  return value;
}

function requireDay(
  value: string
): TrainerAvailabilityDay {
  if (
    !TRAINER_AVAILABILITY_DAYS.includes(
      value as TrainerAvailabilityDay
    )
  ) {
    throw new Error(
      "Invalid availability day."
    );
  }

  return value as TrainerAvailabilityDay;
}

function requireMinute(
  value: number,
  label: string
) {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > 1439
  ) {
    throw new Error(
      `${label} must be a whole number between 0 and 1439.`
    );
  }

  return value;
}

function validateTimeRange(
  startMinute: number,
  endMinute: number
) {
  if (
    endMinute <= startMinute
  ) {
    throw new Error(
      "Availability end time must be after the start time."
    );
  }
}

function normalizeTimezone(
  value?: string
) {
  if (
    value === undefined ||
    value === null ||
    !value.trim()
  ) {
    return "Asia/Kolkata";
  }

  return value.trim();
}

function normalizeAvailability(
  availability: any
) {
  return {
    id: availability.id,
    trainerId:
      availability.trainerId,
    dayOfWeek:
      availability.dayOfWeek,
    startMinute:
      availability.startMinute,
    endMinute:
      availability.endMinute,
    timezone:
      availability.timezone,
    isActive:
      availability.isActive,
    createdAt:
      availability.createdAt,
    updatedAt:
      availability.updatedAt,
  };
}

async function requireTrainer(
  trainerId: number
) {
  const profile =
    await db.orm.public.TrainerProfile.first({
      id: trainerId,
    });

  if (!profile) {
    throw new Error(
      "Trainer not found."
    );
  }

  const user =
    await db.orm.public.User.first({
      id: profile.userId,
    });

  if (
    !user ||
    user.role !== "TRAINER"
  ) {
    throw new Error(
      "Trainer account not found."
    );
  }

  return {
    profile,
    user,
  };
}

export async function listTrainerAvailability(
  trainerId: number
) {
  const validTrainerId =
    requirePositiveId(
      trainerId,
      "trainer ID"
    );

  await requireTrainer(
    validTrainerId
  );

  const availability =
    await db.orm.public.TrainerAvailability
      .where({
        trainerId:
          validTrainerId,
      })
      .all();

  return availability
    .map(normalizeAvailability)
    .sort((a, b) => {
      const dayA =
        TRAINER_AVAILABILITY_DAYS.indexOf(
          a.dayOfWeek
        );

      const dayB =
        TRAINER_AVAILABILITY_DAYS.indexOf(
          b.dayOfWeek
        );

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return (
        a.startMinute -
        b.startMinute
      );
    });
}

export async function createTrainerAvailability(
  input: TrainerAvailabilityCreateInput
) {
  const trainerId =
    requirePositiveId(
      input.trainerId,
      "trainer ID"
    );

  const dayOfWeek =
    requireDay(
      input.dayOfWeek
    );

  const startMinute =
    requireMinute(
      input.startMinute,
      "Start minute"
    );

  const endMinute =
    requireMinute(
      input.endMinute,
      "End minute"
    );

  validateTimeRange(
    startMinute,
    endMinute
  );

  await requireTrainer(
    trainerId
  );

  const availability =
    await db.orm.public.TrainerAvailability.create(
      {
        trainerId,
        dayOfWeek,
        startMinute,
        endMinute,
        timezone:
          normalizeTimezone(
            input.timezone
          ),
        isActive:
          input.isActive ?? true,
      }
    );

  return normalizeAvailability(
    availability
  );
}

export async function updateTrainerAvailability(
  id: number,
  input: TrainerAvailabilityUpdateInput
) {
  const availabilityId =
    requirePositiveId(
      id,
      "availability ID"
    );

  const existing =
    await db.orm.public.TrainerAvailability.first(
      {
        id: availabilityId,
      }
    );

  if (!existing) {
    throw new Error(
      "Availability slot not found."
    );
  }

  const dayOfWeek =
    input.dayOfWeek !==
    undefined
      ? requireDay(
          input.dayOfWeek
        )
      : existing.dayOfWeek;

  const startMinute =
    input.startMinute !==
    undefined
      ? requireMinute(
          input.startMinute,
          "Start minute"
        )
      : existing.startMinute;

  const endMinute =
    input.endMinute !==
    undefined
      ? requireMinute(
          input.endMinute,
          "End minute"
        )
      : existing.endMinute;

  validateTimeRange(
    startMinute,
    endMinute
  );

  const timezone =
    input.timezone !==
    undefined
      ? normalizeTimezone(
          input.timezone
        )
      : existing.timezone;

  const isActive =
    input.isActive !==
    undefined
      ? Boolean(
          input.isActive
        )
      : existing.isActive;

  const updated =
    await db.orm.public.TrainerAvailability
      .where({
        id: availabilityId,
      })
      .update({
        dayOfWeek,
        startMinute,
        endMinute,
        timezone,
        isActive,
      });

  if (!updated) {
    throw new Error(
      "Unable to update availability slot."
    );
  }

  return normalizeAvailability(
    updated
  );
}

export async function deleteTrainerAvailability(
  id: number
) {
  const availabilityId =
    requirePositiveId(
      id,
      "availability ID"
    );

  const existing =
    await db.orm.public.TrainerAvailability.first(
      {
        id: availabilityId,
      }
    );

  if (!existing) {
    throw new Error(
      "Availability slot not found."
    );
  }

  await db.orm.public.TrainerAvailability
    .where({
      id: availabilityId,
    })
    .delete();

  return {
    success: true,
  };
}