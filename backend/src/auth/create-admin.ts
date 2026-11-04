import bcrypt from "bcryptjs";
import { db } from "../prisma/db";

async function createAdmin() {
  const email = "admin@skce.in";
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error(
      "Set ADMIN_INITIAL_PASSWORD to a password of at least 12 characters."
    );
  }

  const existingUser = await db.orm.public.User.first({
    email,
  });

  const passwordHash = await bcrypt.hash(password, 12);

  if (existingUser) {
    if (existingUser.role !== "ADMIN") {
      throw new Error(
        `The email already belongs to a ${existingUser.role} account.`
      );
    }

    await db.orm.public.User
      .where({ id: existingUser.id })
      .update({
        passwordHash,
        isActive: true,
      });

    console.log("Existing admin password updated.");
    console.log(`Email: ${email}`);
    console.log(`User ID: ${existingUser.id}`);
    return;
  }

  const admin = await db.orm.public.User.create({
    name: "SKCE Administrator",
    email,
    phone: null,
    passwordHash,
    role: "ADMIN",
    isActive: true,
  });

  console.log("Admin account created.");
  console.log(`Email: ${admin.email}`);
  console.log(`User ID: ${admin.id}`);
}

createAdmin()
  .catch((error) => {
    console.error("Admin setup failed:", error);
    process.exitCode = 1;
  });
