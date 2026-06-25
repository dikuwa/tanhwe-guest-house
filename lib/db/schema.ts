import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Better Auth's user model. Password credentials are stored in accounts, never here.
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("staff"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
    check("users_role_check", sql`${table.role} in ('owner', 'admin', 'staff')`),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_unique").on(table.providerId, table.accountId),
  ]
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)]
);

export const roomTypes = pgTable(
  "room_types",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    bedConfiguration: text("bed_configuration"),
    pricePerNight: integer("price_per_night").notNull(),
    maxGuests: integer("max_guests").notNull().default(2),
    breakfastIncluded: boolean("breakfast_included").notNull().default(false),
    amenities: text("amenities").array(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    check("room_types_price_positive", sql`${table.pricePerNight} >= 0`),
    check("room_types_guests_positive", sql`${table.maxGuests} >= 1`),
    check("room_types_status_check", sql`${table.status} in ('active', 'inactive')`),
  ]
);

export const rooms = pgTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull(),
    roomTypeId: text("room_type_id").references(() => roomTypes.id, { onDelete: "set null" }),
    description: text("description"),
    pricePerNight: integer("price_per_night").notNull(),
    availableUnits: integer("available_units").notNull().default(1),
    maxGuests: integer("max_guests").notNull().default(2),
    breakfastIncluded: boolean("breakfast_included").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    check("rooms_price_positive", sql`${table.pricePerNight} >= 0`),
    check("rooms_units_positive", sql`${table.availableUnits} >= 1`),
    check("rooms_guests_positive", sql`${table.maxGuests} >= 1`),
    check("rooms_status_check", sql`${table.status} in ('active', 'maintenance', 'blocked', 'archived')`),
    index("rooms_room_type_id_idx").on(table.roomTypeId),
  ]
);

export const roomImages = pgTable(
  "room_images",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("room_images_room_id_idx").on(table.roomId)]
);

export const roomAmenities = pgTable(
  "room_amenities",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    amenity: text("amenity").notNull(),
    iconKey: text("icon_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("room_amenities_room_id_idx").on(table.roomId),
    uniqueIndex("room_amenities_room_amenity_unique").on(table.roomId, table.amenity),
  ]
);

export const roomBlockedDates = pgTable(
  "room_blocked_dates",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("room_blocked_dates_room_id_idx").on(table.roomId),
    check("room_blocked_dates_range_check", sql`${table.endDate} > ${table.startDate}`),
  ]
);

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email"),
    address: text("address"),
    idOrPassport: text("id_or_passport"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("customers_phone_idx").on(table.phone),
    index("customers_whatsapp_idx").on(table.whatsapp),
    index("customers_email_idx").on(table.email),
  ]
);

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    bookingNumber: text("booking_number").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
    nights: integer("nights").notNull(),
    guestsCount: integer("guests_count").notNull(),
    status: text("status").notNull().default("pending"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    source: text("source").notNull().default("website"),
    subtotal: integer("subtotal").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    extrasTotal: integer("extras_total").notNull().default(0),
    total: integer("total").notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    balanceDue: integer("balance_due").notNull().default(0),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("bookings_customer_id_idx").on(table.customerId),
    index("bookings_dates_idx").on(table.checkIn, table.checkOut),
    check("bookings_date_range_check", sql`${table.checkOut} > ${table.checkIn}`),
    check("bookings_nights_positive", sql`${table.nights} >= 1`),
    check("bookings_guests_positive", sql`${table.guestsCount} >= 1`),
    check(
      "bookings_totals_nonnegative",
      sql`${table.subtotal} >= 0 and ${table.discount} >= 0 and ${table.extrasTotal} >= 0 and ${table.total} >= 0 and ${table.amountPaid} >= 0`
    ),
  ]
);

export const bookingRooms = pgTable(
  "booking_rooms",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "restrict" }),
    roomNameSnapshot: text("room_name_snapshot").notNull(),
    pricePerNight: integer("price_per_night").notNull(),
    roomsCount: integer("rooms_count").notNull().default(1),
    nights: integer("nights").notNull(),
    subtotal: integer("subtotal").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("booking_rooms_booking_id_idx").on(table.bookingId),
    index("booking_rooms_room_id_idx").on(table.roomId),
    check("booking_rooms_count_positive", sql`${table.roomsCount} >= 1`),
    check("booking_rooms_nights_positive", sql`${table.nights} >= 1`),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    paymentMethod: text("payment_method").notNull(),
    status: text("status").notNull().default("pending"),
    transactionId: text("transaction_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    recordedBy: text("recorded_by").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_booking_id_idx").on(table.bookingId),
    check("payments_amount_positive", sql`${table.amount} > 0`),
  ]
);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    number: text("number").notNull().unique(),
    pdfUrl: text("pdf_url"),
    total: integer("total").notNull(),
    amountPaid: integer("amount_paid").notNull().default(0),
    balanceDue: integer("balance_due").notNull().default(0),
    snapshot: text("snapshot").notNull().default("{}"),
    status: text("status").notNull().default("draft"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("documents_booking_id_idx").on(table.bookingId),
    index("documents_customer_id_idx").on(table.customerId),
    index("documents_type_status_idx").on(table.type, table.status),
    check(
      "documents_totals_nonnegative",
      sql`${table.total} >= 0 and ${table.amountPaid} >= 0 and ${table.balanceDue} >= 0`
    ),
  ]
);

export const followUps = pgTable(
  "follow_ups",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("pending"),
    priority: text("priority").notNull().default("normal"),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("follow_ups_due_date_idx").on(table.dueDate),
    check(
      "follow_ups_parent_check",
      sql`${table.bookingId} is not null or ${table.customerId} is not null`
    ),
  ]
);

export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("created"),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reminder_logs_booking_type_date_unique").on(
      table.bookingId,
      table.type,
      table.scheduledFor
    ),
    index("reminder_logs_scheduled_for_idx").on(table.scheduledFor),
  ]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("activity_logs_entity_idx").on(table.entity, table.entityId)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    bookingId: text("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    link: text("link"),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_unread_idx").on(table.userId, table.readAt),
  ]
);

export const faqs = pgTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("faqs_sort_order_idx").on(table.sortOrder)]
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: text("id").primaryKey(),
    guestName: text("guest_name").notNull(),
    guestType: text("guest_type").notNull(),
    guestImage: text("guest_image"),
    text: text("text").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("testimonials_sort_order_idx").on(table.sortOrder)]
);

export const conferenceImages = pgTable(
  "conference_images",
  {
    id: text("id").primaryKey(),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("conference_images_sort_order_idx").on(table.sortOrder)]
);

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shareLinks = pgTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    publicCode: text("public_code").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("share_links_document_id_idx").on(table.documentId),
    index("share_links_public_code_idx").on(table.publicCode),
  ]
);

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  images: many(roomImages),
  amenities: many(roomAmenities),
  roomType: one(roomTypes, { fields: [rooms.roomTypeId], references: [roomTypes.id] }),
}));
export const roomImagesRelations = relations(roomImages, ({ one }) => ({
  room: one(rooms, { fields: [roomImages.roomId], references: [rooms.id] }),
}));
export const roomAmenitiesRelations = relations(roomAmenities, ({ one }) => ({
  room: one(rooms, { fields: [roomAmenities.roomId], references: [rooms.id] }),
}));
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  rooms: many(bookingRooms),
}));
export const bookingRoomsRelations = relations(bookingRooms, ({ one }) => ({
  booking: one(bookings, { fields: [bookingRooms.bookingId], references: [bookings.id] }),
  room: one(rooms, { fields: [bookingRooms.roomId], references: [rooms.id] }),
}));
export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings),
}));
