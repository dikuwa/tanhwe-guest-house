import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
});

export const db = drizzle(client, { schema });

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Room = typeof schema.rooms.$inferSelect;
export type NewRoom = typeof schema.rooms.$inferInsert;

export type Booking = typeof schema.bookings.$inferSelect;
export type NewBooking = typeof schema.bookings.$inferInsert;

export type Customer = typeof schema.customers.$inferSelect;
export type NewCustomer = typeof schema.customers.$inferInsert;