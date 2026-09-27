import { db } from "../../prisma/db";

export type TrainerProfileUpdateInput = {
  name?: string;
  phone?: string | null;
  specialization?: string | null;
};

function normalizeName(value: string) {
  const name = value.trim();

  if (name.length < 2) {
    throw new Error(
      "Trainer name must contain at least 2 characters."
    );
  }

  return name;
}

function normalizePhone(
  value?: string | null
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const phone = value.trim();

  return phone || null;
}

function normalizeOptionalText(
  value?: string | null
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const valueTrimmed = value.trim();

  return valueTrimmed || null;
}

/**
 * Get the trainer profile belonging to
 * the authenticated user.
 */
export async function getTrainerProfile(
  userId: number
) {
  const user =
    await db.orm.public.User.first({
      id: userId,
    });

  if (
    !user ||
    user.role !== "TRAINER"
  ) {
    throw new Error(
      "Trainer account not found."
    );
  }

  const profile =
    await db.orm.public.TrainerProfile.first({
      userId,
    });

  if (!profile) {
    throw new Error(
      "Trainer profile not found."
    );
  }

  const batches =
    await db.orm.public.Batch.all();

  const trainerBatches =
    batches.filter(
      (batch) =>
        batch.trainerId === profile.id
    );

  const activeBatches =
    trainerBatches.filter(
      (batch) =>
        batch.status === "ACTIVE"
    ).length;

  return {
    profileId: profile.id,
    userId: user.id,

    name: user.name,
    email: user.email,
    phone: user.phone,

    specialization:
      profile.specialization,

    qualification:
      profile.qualification,

    bio: profile.bio,

    experience:
      profile.experience,

    profilePhotoUrl:
      user.profilePhotoUrl ?? null,

    joinedDate:
      user.createdAt,

    status:
      user.isActive
        ? "Active"
        : "Inactive",

    activeBatches,

    totalBatches:
      trainerBatches.length,
  };
}

/**
 * Update the authenticated trainer's
 * editable profile details.
 */
export async function updateTrainerProfile(
  userId: number,
  input: TrainerProfileUpdateInput
) {
  const user =
    await db.orm.public.User.first({
      id: userId,
    });

  if (
    !user ||
    user.role !== "TRAINER"
  ) {
    throw new Error(
      "Trainer account not found."
    );
  }

  const profile =
    await db.orm.public.TrainerProfile.first({
      userId,
    });

  if (!profile) {
    throw new Error(
      "Trainer profile not found."
    );
  }

  const name =
    input.name !== undefined
      ? normalizeName(input.name)
      : user.name;

  const phone =
    input.phone !== undefined
      ? normalizePhone(input.phone)
      : user.phone;

  const specialization =
    input.specialization !== undefined
      ? normalizeOptionalText(
          input.specialization
        )
      : profile.specialization;

  const updatedUser =
    await db.orm.public.User
      .where({
        id: user.id,
      })
      .update({
        name,
        phone,
      });

  const updatedProfile =
    await db.orm.public.TrainerProfile
      .where({
        id: profile.id,
      })
      .update({
        specialization,
      });

  return {
    profileId: profile.id,
    userId: user.id,

    name:
      updatedUser?.name ??
      name,

    email:
      updatedUser?.email ??
      user.email,

    phone:
      updatedUser?.phone ??
      phone,

    specialization:
      updatedProfile?.specialization ??
      specialization,

    qualification:
      updatedProfile?.qualification ??
      profile.qualification,

    bio:
      updatedProfile?.bio ??
      profile.bio,

    experience:
      updatedProfile?.experience ??
      profile.experience,

    profilePhotoUrl:
      updatedUser?.profilePhotoUrl ??
      user.profilePhotoUrl ??
      null,

    joinedDate:
      updatedUser?.createdAt ??
      user.createdAt,

    status:
      updatedUser?.isActive
        ? "Active"
        : "Inactive",
  };
}