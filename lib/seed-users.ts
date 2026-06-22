import { db } from "./db";
import bcrypt from "bcryptjs";
import { users } from "./db/schema";

async function seed() {
  const email = process.env.ADMIN_EMAIL || "admin@tanhweguesthouse.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (existingUser) {
    console.log("User already exists:", email);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  await db.insert(users).values({
    email,
    password: hashedPassword,
    name: "Admin User",
    role: "owner",
  });

  console.log("User created:", email);
  console.log("Password:", password);
}

seed().catch((error) => {
  console.error("Error seeding users:", error);
  process.exit(1);
});