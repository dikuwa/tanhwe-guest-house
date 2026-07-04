CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_code" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_name_unique" UNIQUE("name"),
	CONSTRAINT "blocks_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "booking_folio_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"line_total" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_folio_lines_qty_positive" CHECK ("booking_folio_lines"."qty" >= 1),
	CONSTRAINT "booking_folio_lines_unit_price_nonnegative" CHECK ("booking_folio_lines"."unit_price" >= 0),
	CONSTRAINT "booking_folio_lines_line_total_nonnegative" CHECK ("booking_folio_lines"."line_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "booking_room_units" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"booking_room_id" text NOT NULL,
	"room_unit_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_units" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"block" text NOT NULL,
	"block_id" text,
	"room_number" integer NOT NULL,
	"room_code" text NOT NULL,
	"display_name" text NOT NULL,
	"operational_status" text DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_units_status_check" CHECK ("room_units"."operational_status" in ('available', 'cleaning', 'maintenance', 'blocked', 'inactive'))
);
--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_status_check";--> statement-breakpoint
ALTER TABLE "booking_rooms" ADD COLUMN "room_type_id" text;--> statement-breakpoint
ALTER TABLE "booking_rooms" ADD COLUMN "check_in" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_rooms" ADD COLUMN "check_out" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_rooms" ADD COLUMN "guests_count" integer;--> statement-breakpoint
ALTER TABLE "booking_rooms" ADD COLUMN "line_notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revoked_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revoked_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permission_grants" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permission_restrictions" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "booking_folio_lines" ADD CONSTRAINT "booking_folio_lines_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_room_units" ADD CONSTRAINT "booking_room_units_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_room_units" ADD CONSTRAINT "booking_room_units_booking_room_id_booking_rooms_id_fk" FOREIGN KEY ("booking_room_id") REFERENCES "public"."booking_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_room_units" ADD CONSTRAINT "booking_room_units_room_unit_id_room_units_id_fk" FOREIGN KEY ("room_unit_id") REFERENCES "public"."room_units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_units" ADD CONSTRAINT "room_units_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_units" ADD CONSTRAINT "room_units_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_display_order_idx" ON "blocks" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "booking_folio_lines_booking_id_idx" ON "booking_folio_lines" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_folio_lines_kind_idx" ON "booking_folio_lines" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "booking_room_units_booking_id_idx" ON "booking_room_units" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_room_units_room_unit_id_idx" ON "booking_room_units" USING btree ("room_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_room_units_unit_booking_unique" ON "booking_room_units" USING btree ("booking_id","room_unit_id");--> statement-breakpoint
CREATE INDEX "room_units_room_id_idx" ON "room_units" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_units_block_room_number_idx" ON "room_units" USING btree ("block","room_number");--> statement-breakpoint
CREATE INDEX "room_units_block_id_idx" ON "room_units" USING btree ("block_id");--> statement-breakpoint
ALTER TABLE "booking_rooms" ADD CONSTRAINT "booking_rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_rooms_room_type_id_idx" ON "booking_rooms" USING btree ("room_type_id");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_status_check" CHECK ("rooms"."status" in ('active', 'maintenance', 'blocked', 'archived'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK ("users"."status" in ('invited', 'active', 'disabled', 'revoked', 'locked'));