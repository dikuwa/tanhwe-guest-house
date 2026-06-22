import { pgTable, text, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // double, single, suite
  description: text("description"),
  pricePerNight: integer("price_per_night").notNull(),
  availableUnits: integer("available_units").notNull().default(1),
  maxGuests: integer("max_guests").notNull().default(2),
  breakfastIncluded: boolean("breakfast_included").notNull().default(false),
  status: text("status").notNull().default("active"), // active, maintenance, blocked
  amenities: text("amenities").notNull().default("[]"),
  imageUrls: text("image_urls").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roomImages = pgTable("room_images", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomAmenities = pgTable("room_amenities", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  amenity: text("amenity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomBlockedDates = pgTable("room_blocked_dates", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  nights: integer("nights").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, checked-in, checked-out, no-show
  source: text("source").notNull().default("website"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookingRooms = pgTable("booking_rooms", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  roomId: text("room_id").notNull(),
  pricePerNight: integer("price_per_night").notNull(),
  nights: integer("nights").notNull(),
  subtotal: integer("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, bank_transfer, deposit, etc.
  status: text("status").notNull().default("pending"), // pending, paid, failed
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  type: text("type").notNull(), // quote, receipt, invoice
  number: text("number").notNull().unique(),
  pdfUrl: text("pdf_url").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const followUps = pgTable("follow_ups", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id"),
  customerId: text("customer_id"),
  type: text("type").notNull(), // booking_reminder, arrival_reminder, payment_reminder, post_checkout
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // create, update, delete, login, etc.
  entity: text("entity").notNull(), // room, booking, customer, etc.
  entityId: text("entity_id").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});