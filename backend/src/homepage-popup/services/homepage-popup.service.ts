import { db } from "../../prisma/db";

const HOMEPAGE_POPUP_ID = 1;

export async function getHomepagePopup() {
  const popup =
    await db.orm.public.HomepagePopup.first({
      id: HOMEPAGE_POPUP_ID,
    });

  if (!popup || !popup.isActive) {
    return null;
  }

  return popup;
}