import { db } from "../../prisma/db";

export async function updateTrainerProfilePhoto(
  profileId: number,
  profilePhotoUrl: string
) {
  const profile =
    await db.orm.public.TrainerProfile.first({
      id: profileId,
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

  const updatedUser =
    await db.orm.public.User
      .where({
        id: user.id,
      })
      .update({
        profilePhotoUrl,
      });

  if (!updatedUser) {
    throw new Error(
      "Unable to update trainer profile photo."
    );
  }

  return {
    profileId: profile.id,
    userId: user.id,
    profilePhotoUrl,
  };
}