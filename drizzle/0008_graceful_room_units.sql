-- Migration: add room_units and booking_room_units tables

-- Create room_units table
CREATE TABLE IF NOT EXISTS "room_units" (
  "id" text PRIMARY KEY NOT NULL,
  "room_id" text NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
  "block" text NOT NULL,
  "room_number" integer NOT NULL,
  "room_code" text NOT NULL,
  "display_name" text NOT NULL,
  "operational_status" text NOT NULL DEFAULT 'available',
  "is_active" boolean NOT NULL DEFAULT true,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "room_units_block_check" CHECK ("block" in ('A', 'B', 'C')),
  CONSTRAINT "room_units_status_check" CHECK ("operational_status" in ('available', 'cleaning', 'maintenance', 'blocked', 'inactive'))
);

CREATE INDEX IF NOT EXISTS "room_units_room_id_idx" ON "room_units" ("room_id");
CREATE INDEX IF NOT EXISTS "room_units_block_room_number_idx" ON "room_units" ("block", "room_number");

-- Create booking_room_units table
CREATE TABLE IF NOT EXISTS "booking_room_units" (
  "id" text PRIMARY KEY NOT NULL,
  "booking_id" text NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "booking_room_id" text NOT NULL REFERENCES "booking_rooms"("id") ON DELETE CASCADE,
  "room_unit_id" text NOT NULL REFERENCES "room_units"("id") ON DELETE RESTRICT,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "booking_room_units_unit_booking_unique" UNIQUE ("booking_id", "room_unit_id")
);

CREATE INDEX IF NOT EXISTS "booking_room_units_booking_id_idx" ON "booking_room_units" ("booking_id");
CREATE INDEX IF NOT EXISTS "booking_room_units_room_unit_id_idx" ON "booking_room_units" ("room_unit_id");

-- Backfill: Create room_units for each existing room based on available_units
-- Generates block A, room numbers 1..N for each room
DO $$
DECLARE
  room_rec RECORD;
  unit_index INTEGER;
  unit_id TEXT;
BEGIN
  FOR room_rec IN SELECT id, name, available_units FROM rooms WHERE available_units > 0 LOOP
    FOR unit_index IN 1..room_rec.available_units LOOP
      unit_id := gen_random_uuid()::text;
      INSERT INTO "room_units" ("id", "room_id", "block", "room_number", "room_code", "display_name", "operational_status", "is_active", "created_at", "updated_at")
      VALUES (
        unit_id,
        room_rec.id,
        'A',
        unit_index,
        'A' || LPAD(unit_index::text, 2, '0'),
        room_rec.name || ' – Unit ' || unit_index,
        'available',
        true,
        now(),
        now()
      );
    END LOOP;
  END LOOP;
END $$;
