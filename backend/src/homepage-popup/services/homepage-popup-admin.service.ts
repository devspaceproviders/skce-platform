import { db } from "../../prisma/db";

const HOMEPAGE_POPUP_ID = 1;

export type UpdateHomepagePopupInput = {
  title?: string;
  message?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  isActive?: boolean;
};

export async function getAdminHomepagePopup() {
  const popup =
    await db.orm.public.HomepagePopup.first({
      id: HOMEPAGE_POPUP_ID,
    });

  return popup;
}

export async function updateHomepagePopup(
  input: UpdateHomepagePopupInput
) {
  const existing =
    await db.orm.public.HomepagePopup.first({
      id: HOMEPAGE_POPUP_ID,
    });

  const updateData: {
    title?: string;
    message?: string | null;
    buttonText?: string | null;
    buttonLink?: string | null;
    isActive?: boolean;
  } = {};

  if (input.title !== undefined) {
    const title = String(input.title).trim();

    if (!title) {
      throw new Error(
        "Popup title is required"
      );
    }

    updateData.title = title;
  }

  if (input.message !== undefined) {
    updateData.message =
      input.message === null
        ? null
        : String(input.message).trim() || null;
  }

  if (input.buttonText !== undefined) {
    updateData.buttonText =
      input.buttonText === null
        ? null
        : String(input.buttonText).trim() || null;
  }

  if (input.buttonLink !== undefined) {
    updateData.buttonLink =
      input.buttonLink === null
        ? null
        : String(input.buttonLink).trim() || null;
  }

  if (input.isActive !== undefined) {
    updateData.isActive =
      Boolean(input.isActive);
  }

  if (!existing) {
    if (!updateData.title) {
      throw new Error(
        "Popup title is required"
      );
    }

    return db.orm.public.HomepagePopup.create({
      id: HOMEPAGE_POPUP_ID,
      title: updateData.title,
      message:
        updateData.message ?? null,
      buttonText:
        updateData.buttonText ?? null,
      buttonLink:
        updateData.buttonLink ?? null,
      isActive:
        updateData.isActive ?? false,
    });
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const updated =
    await db.orm.public.HomepagePopup
      .where({
        id: HOMEPAGE_POPUP_ID,
      })
      .update(updateData);

  if (!updated) {
    throw new Error(
      "Homepage popup not found while updating"
    );
  }

  return updated;
}

export async function updateHomepagePopupImage(
  imageUrl: string
) {
  const existing =
    await db.orm.public.HomepagePopup.first({
      id: HOMEPAGE_POPUP_ID,
    });

  if (!existing) {
    throw new Error(
      "Homepage popup configuration not found"
    );
  }

  return db.orm.public.HomepagePopup
    .where({
      id: HOMEPAGE_POPUP_ID,
    })
    .update({
      imageUrl,
      mediaType: "IMAGE",
    });
}

export async function updateHomepagePopupVideo(
  videoUrl: string
) {
  const existing =
    await db.orm.public.HomepagePopup.first({
      id: HOMEPAGE_POPUP_ID,
    });

  if (!existing) {
    throw new Error(
      "Homepage popup configuration not found"
    );
  }

  return db.orm.public.HomepagePopup
    .where({
      id: HOMEPAGE_POPUP_ID,
    })
    .update({
      videoUrl,
      mediaType: "VIDEO",
    });
}