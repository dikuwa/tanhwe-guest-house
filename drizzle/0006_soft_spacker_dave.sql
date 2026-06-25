ALTER TABLE "rooms" DROP CONSTRAINT "rooms_status_check";
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_status_check" CHECK ("rooms"."status" in ('active', 'maintenance', 'blocked', 'archived'));
