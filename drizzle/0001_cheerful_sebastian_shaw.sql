CREATE TABLE "reminder_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"type" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "amount_paid" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "balance_due" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "snapshot" text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_logs_booking_type_date_unique" ON "reminder_logs" USING btree ("booking_id","type","scheduled_for");--> statement-breakpoint
CREATE INDEX "reminder_logs_scheduled_for_idx" ON "reminder_logs" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_whatsapp_idx" ON "customers" USING btree ("whatsapp");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "documents_customer_id_idx" ON "documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "documents_type_status_idx" ON "documents" USING btree ("type","status");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_totals_nonnegative" CHECK ("documents"."total" >= 0 and "documents"."amount_paid" >= 0 and "documents"."balance_due" >= 0);