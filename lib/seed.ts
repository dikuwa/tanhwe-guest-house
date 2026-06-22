import { db } from "./db";
import { users, roles, rooms, customers } from "./db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Starting database seed...");

  // Create default roles
  const roleAdmin = await db.query.roles.findFirst({
    where: eq(roles.name, "admin"),
  });

  const roleOwner = await db.query.roles.findFirst({
    where: eq(roles.name, "owner"),
  });

  const roleStaff = await db.query.roles.findFirst({
    where: eq(roles.name, "staff"),
  });

  if (!roleAdmin) {
    await db.insert(roles).values({
      id: "role_admin",
      name: "admin",
      description: "Admin role with full access to bookings and room management",
    });
    console.log("✓ Created admin role");
  }

  if (!roleOwner) {
    await db.insert(roles).values({
      id: "role_owner",
      name: "owner",
      description: "Owner role with full access including financial reports",
    });
    console.log("✓ Created owner role");
  }

  if (!roleStaff) {
    await db.insert(roles).values({
      id: "role_staff",
      name: "staff",
      description: "Staff role with limited access to bookings and check-ins",
    });
    console.log("✓ Created staff role");
  }

  // Create admin user
  const email = process.env.ADMIN_EMAIL || "admin@tanhweguesthouse.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!existingUser) {
    await db.insert(users).values({
      id: "user_admin",
      email,
      password: hashedPassword,
      name: "Admin User",
      role: "owner",
    });
    console.log(`✓ Created admin user: ${email}`);
    console.log(`  Password: ${password}`);
  } else {
    console.log(`✓ Admin user already exists: ${email}`);
  }

  // Create sample rooms
  const room1 = await db.query.rooms.findFirst({
    where: eq(rooms.name, "Double Room"),
  });

  if (!room1) {
    await db.insert(rooms).values({
      id: "room_double",
      name: "Double Room",
      type: "double",
      description: "Comfortable double room with ensuite bathroom",
      pricePerNight: 500,
      availableUnits: 3,
      maxGuests: 2,
      breakfastIncluded: true,
      status: "active",
      amenities: JSON.stringify(["wifi", "ac", "tv", "fridge"]),
      imageUrls: JSON.stringify([
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      ]),
    });
    console.log("✓ Created Double Room");
  }

  const room2 = await db.query.rooms.findFirst({
    where: eq(rooms.name, "Single Room"),
  });

  if (!room2) {
    await db.insert(rooms).values({
      id: "room_single",
      name: "Single Room",
      type: "single",
      description: "Cozy single room perfect for solo travelers",
      pricePerNight: 650,
      availableUnits: 2,
      maxGuests: 1,
      breakfastIncluded: true,
      status: "active",
      amenities: JSON.stringify(["wifi", "ac", "tv", "fridge"]),
      imageUrls: JSON.stringify([
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      ]),
    });
    console.log("✓ Created Single Room");
  }

  const room3 = await db.query.rooms.findFirst({
    where: eq(rooms.name, "Executive Suite"),
  });

  if (!room3) {
    await db.insert(rooms).values({
      id: "room_suite",
      name: "Executive Suite",
      type: "suite",
      description: "Luxury suite with living area and premium amenities",
      pricePerNight: 1200,
      availableUnits: 1,
      maxGuests: 4,
      breakfastIncluded: true,
      status: "active",
      amenities: JSON.stringify([
        "wifi",
        "ac",
        "tv",
        "fridge",
        "kitchenette",
        "balcony",
        "bathtub",
      ]),
      imageUrls: JSON.stringify([
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      ]),
    });
    console.log("✓ Created Executive Suite");
  }

  // Create sample customer
  const customerEmail = "customer@example.com";
  const existingCustomer = await db.query.customers.findFirst({
    where: eq(customers.email, customerEmail),
  });

  if (!existingCustomer) {
    await db.insert(customers).values({
      id: "customer_1",
      fullName: "John Doe",
      phone: "+264 81 123 4567",
      whatsapp: "+264 81 123 4567",
      email: customerEmail,
      notes: "Regular customer",
    });
    console.log("✓ Created sample customer");
  }

  console.log("\n✅ Database seed completed successfully!");
  console.log("\nDefault credentials:");
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
}

seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });