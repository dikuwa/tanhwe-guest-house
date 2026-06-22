import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "./db";
import { accounts, customers, roles, rooms, users } from "./db/schema";

async function seed() {
  const db = getDb();
  console.log("Starting database seed...");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters are required");
  }

  await db.insert(roles).values([
    { id: "role_admin", name: "admin", description: "Manage rooms, bookings, customers and documents" },
    { id: "role_owner", name: "owner", description: "Full access including users and financial reports" },
    { id: "role_staff", name: "staff", description: "Operational booking and follow-up access" },
  ]).onConflictDoNothing();

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!existingUser) {
    const userId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        emailVerified: true,
        name: "Tanhwe Owner",
        role: "owner",
      });
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(password),
      });
    });
    console.log(`✓ Created owner account: ${email}`);
  } else {
    console.log(`✓ Owner account already exists: ${email}`);
  }

  await db.insert(rooms).values([
    {
      id: "room_double",
      name: "Double Room",
      slug: "double-room",
      type: "double",
      description: "Comfortable double room with ensuite bathroom",
      pricePerNight: 500,
      availableUnits: 3,
      maxGuests: 2,
      breakfastIncluded: true,
    },
    {
      id: "room_single",
      name: "Single Room",
      slug: "single-room",
      type: "single",
      description: "Cozy single room for solo travellers",
      pricePerNight: 650,
      availableUnits: 2,
      maxGuests: 1,
      breakfastIncluded: true,
    },
    {
      id: "room_suite",
      name: "Executive Suite",
      slug: "executive-suite",
      type: "suite",
      description: "Suite with a living area and premium amenities",
      pricePerNight: 1200,
      availableUnits: 1,
      maxGuests: 4,
      breakfastIncluded: true,
    },
  ]).onConflictDoNothing();

  await db.insert(customers).values({
    id: "customer_1",
    fullName: "Sample Customer",
    phone: "+264 81 000 0000",
    whatsapp: "+264 81 000 0000",
    email: "customer@example.com",
    notes: "Development seed record",
  }).onConflictDoNothing();

  console.log("✅ Database seed completed successfully");
}

seed()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
