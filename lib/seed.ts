import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "./db";
import { accounts, customers, roles, roomAmenities, rooms, settings, users } from "./db/schema";

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

  await db.insert(roomAmenities).values([
    { id: "amenity_double_wifi", roomId: "room_double", amenity: "Wi-Fi", iconKey: "wifi" },
    { id: "amenity_double_breakfast", roomId: "room_double", amenity: "Breakfast included", iconKey: "coffee" },
    { id: "amenity_double_ensuite", roomId: "room_double", amenity: "Ensuite bathroom", iconKey: "bath" },
    { id: "amenity_single_wifi", roomId: "room_single", amenity: "Wi-Fi", iconKey: "wifi" },
    { id: "amenity_single_breakfast", roomId: "room_single", amenity: "Breakfast included", iconKey: "coffee" },
    { id: "amenity_single_ensuite", roomId: "room_single", amenity: "Ensuite bathroom", iconKey: "bath" },
    { id: "amenity_suite_wifi", roomId: "room_suite", amenity: "Wi-Fi", iconKey: "wifi" },
    { id: "amenity_suite_breakfast", roomId: "room_suite", amenity: "Breakfast included", iconKey: "coffee" },
    { id: "amenity_suite_lounge", roomId: "room_suite", amenity: "Private living area", iconKey: "sofa" },
  ]).onConflictDoNothing();

  await db.insert(settings).values([
    { id: "setting_phone", key: "phone", value: "+264 81 380 8097", description: "Public phone number" },
    { id: "setting_whatsapp", key: "whatsapp", value: "+264 81 380 8097", description: "Public WhatsApp number" },
    { id: "setting_location", key: "location", value: "Mukwe, Namibia", description: "Public location" },
    { id: "setting_check_in", key: "check_in_time", value: "14:00", description: "Standard check-in time" },
    { id: "setting_check_out", key: "check_out_time", value: "10:00", description: "Standard check-out time" },
    { id: "setting_currency", key: "currency", value: "N$", description: "Display currency" },
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
