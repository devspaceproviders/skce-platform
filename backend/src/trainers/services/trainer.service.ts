import bcrypt from "bcryptjs";

import { db } from "../../prisma/db";
import {
  createTrainerActivity,
} from "./trainer-activity.service";

export type TrainerCreateInput = {
  name: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  experience?: number | null;
  password: string;
  isActive?: boolean;
};

export type TrainerUpdateInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  specialization?: string | null;
  experience?: number | null;
  password?: string;
  isActive?: boolean;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function requireName(value: string) {
  const name = value.trim();

  if (name.length < 2) {
    throw new Error("Trainer name must contain at least 2 characters.");
  }

  return name;
}

function requireEmail(value: string) {
  const email = normalizeEmail(value);

  if (!email || !email.includes("@")) {
    throw new Error("Please enter a valid trainer email.");
  }

  return email;
}

function normalizeOptionalText(value?: string | null) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function normalizeExperience(value?: number | null) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Experience must be a non-negative whole number.");
  }

  return value;
}

function requirePassword(value: string) {
  if (value.trim().length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  return value;
}

function trainerToResponse(
  profile: any,
  user: any
) {
  return {
    profileId: profile.id,
    displayId: `TR${String(profile.id).padStart(3, "0")}`,
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    specialization: profile.specialization,
    experience: profile.experience,
    batches: 0,
    joinedDate: user.createdAt,
    status: user.isActive ? "Active" : "Inactive",
    profilePhotoUrl: user.profilePhotoUrl ?? null,
  };
}

export async function listPublicTrainers() {
  const [profiles, users] =
    await Promise.all([
      db.orm.public.TrainerProfile.all(),
      db.orm.public.User.all(),
    ]);

  const userMap = new Map(
    users.map((user) => [user.id, user])
  );

  return profiles
    .map((profile) => {
      const user = userMap.get(profile.userId);

      if (!user || user.role !== "TRAINER" || !user.isActive) {
        return null;
      }

      return {
        id: String(profile.id),
        name: user.name,
        yearsExperience: profile.experience ?? 0,
        avatarUrl: user.profilePhotoUrl || "/trainers/default.svg",
        specialty: profile.specialization || "Professional Trainer",
      };
    })
    .filter(
      (trainer): trainer is NonNullable<typeof trainer> =>
        trainer !== null
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function recordTrainerManagementActivity(
  actorUserId: number,
  trainerId: number,
  action:
    | "CREATED"
    | "UPDATED"
    | "ACTIVATED"
    | "DEACTIVATED",
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    await createTrainerActivity({
      trainerId,
      actorUserId,
      action,
      entityType: "TRAINER",
      entityId: trainerId,
      description,
      ...(metadata !== undefined ? { metadata } : {}),
    });
  } catch (error) {
    /*
     * Trainer activity is audit information and must not
     * cause the trainer operation itself to fail.
     */
    console.error(
      "Failed to record trainer management activity:",
      error
    );
  }
}

export async function listAdminTrainers() {
  const [profiles, users, sessions] =
    await Promise.all([
      db.orm.public.TrainerProfile.all(),
      db.orm.public.User.all(),
      db.orm.public.LiveSession.all(),
    ]);

  const userMap = new Map(
    users.map((user) => [user.id, user])
  );

  const sessionCounts = new Map<number, number>();

  for (const session of sessions) {
    sessionCounts.set(
      session.trainerId,
      (sessionCounts.get(session.trainerId) ?? 0) + 1
    );
  }

  return profiles
    .map((profile) => {
      const user = userMap.get(profile.userId);

      if (!user || user.role !== "TRAINER") {
        return null;
      }

      return {
        ...trainerToResponse(profile, user),
        sessionCount: sessionCounts.get(profile.id) ?? 0,
      };
    })
    .filter(
      (
        trainer
      ): trainer is NonNullable<typeof trainer> =>
        trainer !== null
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );
}

export async function getAdminTrainer(
  profileId: number
) {
  const profile =
    await db.orm.public.TrainerProfile.first({
      id: profileId,
    });

  if (!profile) {
    throw new Error("Trainer not found.");
  }

  const user =
    await db.orm.public.User.first({
      id: profile.userId,
    });

  if (!user || user.role !== "TRAINER") {
    throw new Error("Trainer account not found.");
  }

  const sessionCount = (
    await db.orm.public.LiveSession
      .where({
        trainerId: profile.id,
      })
      .all()
  ).length;

  return {
    ...trainerToResponse(profile, user),
    sessionCount,
  };
}

export async function createAdminTrainer(
  input: TrainerCreateInput,
  actorUserId: number
) {
  const name = requireName(input.name);
  const email = requireEmail(input.email);
  const password = requirePassword(input.password);

  const existingUser =
    await db.orm.public.User.first({
      email,
    });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists."
    );
  }

  const passwordHash =
    await bcrypt.hash(password, 12);

  const experience =
    normalizeExperience(input.experience);

  const result =
    await db.transaction(
      async (tx) => {
        const user =
          await tx.orm.public.User.create({
            name,
            email,
            phone:
              normalizeOptionalText(
                input.phone
              ),
            passwordHash,
            role: "TRAINER",
            isActive:
              input.isActive ?? true,
          });

        const profile =
          await tx.orm.public.TrainerProfile.create({
            userId: user.id,
            qualification: null,
            specialization:
              normalizeOptionalText(
                input.specialization
              ),
            bio: null,
            experience,
          });

        return {
          user,
          profile,
        };
      }
    );

  const trainer = trainerToResponse(
    result.profile,
    result.user
  );

  await recordTrainerManagementActivity(
    actorUserId,
    trainer.profileId,
    "CREATED",
    `Trainer account created for ${trainer.name}`,
    {
      name: trainer.name,
      email: trainer.email,
      status: trainer.status,
      specialization: trainer.specialization,
      experience: trainer.experience,
    }
  );

  return trainer;
}

export async function updateAdminTrainer(
  profileId: number,
  input: TrainerUpdateInput,
  actorUserId: number
) {
  const profile =
    await db.orm.public.TrainerProfile.first({
      id: profileId,
    });

  if (!profile) {
    throw new Error("Trainer not found.");
  }

  const currentUser =
    await db.orm.public.User.first({
      id: profile.userId,
    });

  if (
    !currentUser ||
    currentUser.role !== "TRAINER"
  ) {
    throw new Error("Trainer account not found.");
  }

  const name =
    input.name !== undefined
      ? requireName(input.name)
      : currentUser.name;

  let email = currentUser.email;

  if (input.email !== undefined) {
    email = requireEmail(input.email);

    if (email !== currentUser.email) {
      const existingUser =
        await db.orm.public.User.first({
          email,
        });

      if (
        existingUser &&
        existingUser.id !== currentUser.id
      ) {
        throw new Error(
          "An account with this email already exists."
        );
      }
    }
  }

  const phone =
    input.phone !== undefined
      ? normalizeOptionalText(input.phone)
      : currentUser.phone;

  let passwordHash =
    currentUser.passwordHash;

  if (input.password !== undefined) {
    passwordHash =
      await bcrypt.hash(
        requirePassword(input.password),
        12
      );
  }

  const isActive =
    input.isActive !== undefined
      ? Boolean(input.isActive)
      : currentUser.isActive;

  const specialization =
    input.specialization !== undefined
      ? normalizeOptionalText(
          input.specialization
        )
      : profile.specialization;

  const experience =
    input.experience !== undefined
      ? normalizeExperience(
          input.experience
        )
      : profile.experience;

  const changes: Record<string, unknown> = {};

  if (currentUser.name !== name) {
    changes.name = {
      before: currentUser.name,
      after: name,
    };
  }

  if (currentUser.email !== email) {
    changes.email = {
      before: currentUser.email,
      after: email,
    };
  }

  if (currentUser.phone !== phone) {
    changes.phone = {
      before: currentUser.phone,
      after: phone,
    };
  }

  if (profile.specialization !== specialization) {
    changes.specialization = {
      before: profile.specialization,
      after: specialization,
    };
  }

  if (profile.experience !== experience) {
    changes.experience = {
      before: profile.experience,
      after: experience,
    };
  }

  if (currentUser.isActive !== isActive) {
    changes.isActive = {
      before: currentUser.isActive,
      after: isActive,
    };
  }

  if (input.password !== undefined) {
    changes.password = {
      changed: true,
    };
  }

  const changedFields = Object.keys(changes);

  const result =
    await db.transaction(
      async (tx) => {
        const updatedUser =
          await tx.orm.public.User
            .where({
              id: currentUser.id,
            })
            .update({
              name,
              email,
              phone,
              passwordHash,
              isActive,
            });

        const updatedProfile =
          await tx.orm.public.TrainerProfile
            .where({
              id: profile.id,
            })
            .update({
              specialization,
              experience,
            });

        return {
          user:
            updatedUser || currentUser,
          profile:
            updatedProfile || profile,
        };
      }
    );

  const trainer = trainerToResponse(
    result.profile,
    result.user
  );

  if (changedFields.length > 0) {
    const statusOnly =
      changedFields.length === 1 &&
      changedFields[0] === "isActive";

    await recordTrainerManagementActivity(
      actorUserId,
      trainer.profileId,
      statusOnly
        ? isActive
          ? "ACTIVATED"
          : "DEACTIVATED"
        : "UPDATED",
      statusOnly
        ? `Trainer ${isActive ? "activated" : "deactivated"}: ${trainer.name}`
        : `Trainer details updated for ${trainer.name}`,
      changes
    );
  }

  return trainer;
}

export async function resetAdminTrainerPassword(
  profileId: number,
  password: string,
  actorUserId: number
) {
  const trainer =
    await db.orm.public.TrainerProfile.first({
      id: profileId,
    });

  if (!trainer) {
    throw new Error("Trainer not found.");
  }

  const user =
    await db.orm.public.User.first({
      id: trainer.userId,
    });

  if (!user || user.role !== "TRAINER") {
    throw new Error("Trainer account not found.");
  }

  const passwordHash =
    await bcrypt.hash(
      requirePassword(password),
      12
    );

  await db.orm.public.User
    .where({
      id: user.id,
    })
    .update({
      passwordHash,
    });

  await recordTrainerManagementActivity(
    actorUserId,
    trainer.id,
    "UPDATED",
    `Trainer password reset for ${user.name}`,
    {
      passwordReset: true,
    }
  );

  return {
    success: true,
  };
}
