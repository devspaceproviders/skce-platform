import { db } from "../../prisma/db";

const LIMITS = {
  displayName: 80,
  designation: 80,
  bioParagraph: 500,
  highlight: 120,
  maxBioLines: 5,
  maxHighlightLines: 2,
};

function validateText(
  value: unknown,
  fieldName: string,
  maxLength: number,
  maxLines: number
): string {
  if (typeof value !== "string") {
    throw new Error(
      `${fieldName} must be a text value.`
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(
      `${fieldName} cannot be empty.`
    );
  }

  if (trimmed.length > maxLength) {
    throw new Error(
      `${fieldName} cannot exceed ${maxLength} characters.`
    );
  }

  const lineCount =
    trimmed.replace(/\r\n/g, "\n").split("\n").length;

  if (lineCount > maxLines) {
    throw new Error(
      `${fieldName} cannot exceed ${maxLines} lines.`
    );
  }

  return trimmed;
}

export async function getAdminCeoProfile(
  adminUserId: number
) {
  const admin =
    await db.orm.public.User.first({
      id: adminUserId,
      role: "ADMIN",
      isActive: true,
    });

  if (!admin) {
    throw new Error(
      "Active admin user not found."
    );
  }

  const ceoProfile =
    await db.orm.public.CeoProfile.first({
      userId: admin.id,
    });

  if (!ceoProfile) {
    throw new Error(
      "CEO profile not found."
    );
  }

  return {
    id: ceoProfile.id,
    userId: admin.id,

    name:
      ceoProfile.displayName ||
      admin.name,

    email: admin.email,

    displayName:
      ceoProfile.displayName,

    designation:
      ceoProfile.designation,

    profilePhotoUrl:
      admin.profilePhotoUrl ?? null,

    bioParagraph1:
      ceoProfile.bioParagraph1,

    bioParagraph2:
      ceoProfile.bioParagraph2,

    highlight1:
      ceoProfile.highlight1,

    highlight2:
      ceoProfile.highlight2,

    limits: LIMITS,
  };
}

type UpdateCeoProfileInput = {
  displayName: unknown;
  designation: unknown;
  bioParagraph1: unknown;
  bioParagraph2: unknown;
  highlight1: unknown;
  highlight2: unknown;
};

export async function updateAdminCeoProfile(
  adminUserId: number,
  input: UpdateCeoProfileInput
) {
  const admin =
    await db.orm.public.User.first({
      id: adminUserId,
      role: "ADMIN",
      isActive: true,
    });

  if (!admin) {
    throw new Error(
      "Active admin user not found."
    );
  }

  const ceoProfile =
    await db.orm.public.CeoProfile.first({
      userId: admin.id,
    });

  if (!ceoProfile) {
    throw new Error(
      "CEO profile not found."
    );
  }

  const displayName = validateText(
    input.displayName,
    "CEO Name",
    LIMITS.displayName,
    1
  );

  const designation = validateText(
    input.designation,
    "Designation",
    LIMITS.designation,
    1
  );

  const bioParagraph1 = validateText(
    input.bioParagraph1,
    "Bio Paragraph 1",
    LIMITS.bioParagraph,
    LIMITS.maxBioLines
  );

  const bioParagraph2 = validateText(
    input.bioParagraph2,
    "Bio Paragraph 2",
    LIMITS.bioParagraph,
    LIMITS.maxBioLines
  );

  const highlight1 = validateText(
    input.highlight1,
    "Highlight 1",
    LIMITS.highlight,
    LIMITS.maxHighlightLines
  );

  const highlight2 = validateText(
    input.highlight2,
    "Highlight 2",
    LIMITS.highlight,
    LIMITS.maxHighlightLines
  );

  const updated =
    await db.orm.public.CeoProfile
      .where({
        id: ceoProfile.id,
      })
      .update({
        displayName,
        designation,
        bioParagraph1,
        bioParagraph2,
        highlight1,
        highlight2,
      });

  if (!updated) {
    throw new Error(
      "CEO profile could not be updated."
    );
  }

  return {
    id: updated.id,
    userId: admin.id,

    name:
      updated.displayName,

    email: admin.email,

    displayName:
      updated.displayName,

    designation:
      updated.designation,

    profilePhotoUrl:
      admin.profilePhotoUrl ?? null,

    bioParagraph1:
      updated.bioParagraph1,

    bioParagraph2:
      updated.bioParagraph2,

    highlight1:
      updated.highlight1,

    highlight2:
      updated.highlight2,

    limits: LIMITS,
  };
}