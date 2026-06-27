-- Blocks migration: create blocks table, add blockId to room_units, backfill, drop check constraint

CREATE TABLE IF NOT EXISTS "blocks" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "short_code" text NOT NULL UNIQUE,
  "description" text,
  "display_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "blocks_display_order_idx" ON "blocks" ("display_order");

-- Insert existing blocks A, B, C
INSERT INTO "blocks" ("id", "name", "short_code", "description", "display_order", "is_active")
VALUES
  ('block-a', 'Block A', 'A', 'Main accommodation block', 1, true),
  ('block-b', 'Block B', 'B', 'Secondary accommodation block', 2, true),
  ('block-c', 'Block C', 'C', 'Tertiary accommodation block', 3, true)
ON CONFLICT ("id") DO NOTHING;

-- Add block_id column to room_units
ALTER TABLE "room_units" ADD COLUMN IF NOT EXISTS "block_id" text REFERENCES "blocks"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "room_units_block_id_idx" ON "room_units" ("block_id");

-- Backfill block_id based on block text value
UPDATE "room_units" SET "block_id" = 'block-a' WHERE "block" = 'A' AND "block_id" IS NULL;
UPDATE "room_units" SET "block_id" = 'block-b' WHERE "block" = 'B' AND "block_id" IS NULL;
UPDATE "room_units" SET "block_id" = 'block-c' WHERE "block" = 'C' AND "block_id" IS NULL;

-- Drop the old check constraint that limited block to A, B, C only
ALTER TABLE "room_units" DROP CONSTRAINT IF EXISTS "room_units_block_check";
