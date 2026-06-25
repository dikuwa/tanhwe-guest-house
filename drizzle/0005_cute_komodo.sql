CREATE TABLE "room_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"bed_configuration" text,
	"price_per_night" integer NOT NULL,
	"max_guests" integer DEFAULT 2 NOT NULL,
	"breakfast_included" boolean DEFAULT false NOT NULL,
	"amenities" text[],
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_types_slug_unique" UNIQUE("slug"),
	CONSTRAINT "room_types_price_positive" CHECK ("room_types"."price_per_night" >= 0),
	CONSTRAINT "room_types_guests_positive" CHECK ("room_types"."max_guests" >= 1),
	CONSTRAINT "room_types_status_check" CHECK ("room_types"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "room_type_id" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rooms_room_type_id_idx" ON "rooms" USING btree ("room_type_id");