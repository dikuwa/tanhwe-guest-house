-- Migration: add multi-room-line support to booking_rooms
-- Adds room_type_id, check_in, check_out, guests_count, line_notes columns

ALTER TABLE "booking_rooms" ADD COLUMN "room_type_id" text REFERENCES "room_types"("id") ON DELETE SET NULL;
ALTER TABLE "booking_rooms" ADD COLUMN "check_in" timestamp with time zone;
ALTER TABLE "booking_rooms" ADD COLUMN "check_out" timestamp with time zone;
ALTER TABLE "booking_rooms" ADD COLUMN "guests_count" integer;
ALTER TABLE "booking_rooms" ADD COLUMN "line_notes" text;

CREATE INDEX IF NOT EXISTS "booking_rooms_room_type_id_idx" ON "booking_rooms" ("room_type_id");

-- Backfill: set room_type_id from the linked room
UPDATE "booking_rooms"
SET "room_type_id" = "rooms"."room_type_id"
FROM "rooms"
WHERE "booking_rooms"."room_id" = "rooms"."id";

-- Backfill: set check_in/check_out from the parent booking
UPDATE "booking_rooms"
SET
  "check_in" = "bookings"."check_in",
  "check_out" = "bookings"."check_out",
  "guests_count" = "bookings"."guests_count"
FROM "bookings"
WHERE "booking_rooms"."booking_id" = "bookings"."id";
