import { db } from "../../prisma/db";

export async function getPublicCeo() {
  const admin =
    await db.orm.public.User.first({
      role: "ADMIN",
      isActive: true,
    });

  if (!admin) {
    throw new Error(
      "Active CEO profile not found."
    );
  }

  const ceoProfile =
    await db.orm.public.CeoProfile.first({
      userId: admin.id,
    });

  return {
  name:
    ceoProfile?.displayName ||
    admin.name,

    designation:
      ceoProfile?.designation ||
      "Founder & CEO",

    profilePhotoUrl:
      admin.profilePhotoUrl ?? null,

    bioParagraph1:
      ceoProfile?.bioParagraph1 ?? null,

    bioParagraph2:
      ceoProfile?.bioParagraph2 ?? null,

    highlight1:
      ceoProfile?.highlight1 ?? null,

    highlight2:
      ceoProfile?.highlight2 ?? null,
  };
}