CREATE TABLE IF NOT EXISTS "folio_items" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "item_type" text NOT NULL,
  "category" text NOT NULL DEFAULT 'Other',
  "default_price" integer NOT NULL DEFAULT 0,
  "description" text,
  "status" text NOT NULL DEFAULT 'active',
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "folio_items_type_check" CHECK ("item_type" in ('service', 'charge', 'discount')),
  CONSTRAINT "folio_items_status_check" CHECK ("status" in ('active', 'inactive')),
  CONSTRAINT "folio_items_price_nonnegative" CHECK ("default_price" >= 0)
);

CREATE INDEX IF NOT EXISTS "folio_items_status_idx" ON "folio_items" ("status");
CREATE INDEX IF NOT EXISTS "folio_items_type_idx" ON "folio_items" ("item_type");
