import { db } from "../../prisma/db";

export async function initializeCeoProfile(
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

  const existing =
    await db.orm.public.CeoProfile.first({
      userId: admin.id,
    });

  if (existing) {
    return existing;
  }

  return await db.orm.public.CeoProfile.create({
    userId: admin.id,

    displayName:
      "C. Neelima",

    designation:
      "Founder & CEO",

    bioParagraph1:
      "C. Neelima has been actively involved in education, training, and professional development since 2006, bringing over 20 years of experience to the field. With a strong passion for empowering learners through practical and industry-oriented education, she has been instrumental in shaping SK Computer Education and its vision for accessible, career-focused learning.",

    bioParagraph2:
      "Her leadership focuses on providing students with quality training, practical skills, and the confidence they need to build successful careers in a rapidly evolving digital world.",

    highlight1:
      "Empowering learners through practical, career-focused education",

    highlight2:
      "Building confidence through hands-on learning",
  });
}