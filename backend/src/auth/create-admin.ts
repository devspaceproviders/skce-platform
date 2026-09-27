import bcrypt from "bcryptjs";
import { db } from "../prisma/db";

async function createAdmin() {
  const email = "admin@skce.in";
  const password = "admin123";

  const existingUser =
    await db.orm.public.User.first({
      email,
    });

  if (existingUser) {
    console.log("Admin user already exists.");

    if (existingUser.role !== "ADMIN") {
      console.log(
        `Existing user has role: ${existingUser.role}`
      );
    }

    return;
  }

  const passwordHash =
    await bcrypt.hash(password, 12);

  const admin =
    await db.orm.public.User.create({
      name: "SKCE Administrator",
      email,
      phone: null,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

  console.log("");
  console.log("====================================");
  console.log("       ADMIN ACCOUNT CREATED");
  console.log("====================================");
  console.log(`Email: ${admin.email}`);
  console.log("Password: admin123");
  console.log(`User ID: ${admin.id}`);
  console.log("Role: ADMIN");
  console.log("====================================");
  console.log("");
}

createAdmin()
  .catch((error) => {
    console.error(
      "Failed to create admin:",
      error
    );
    process.exit(1);
  });