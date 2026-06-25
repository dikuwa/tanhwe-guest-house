ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invited_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_token" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_by" text REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_reason" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revoked_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revoked_by" text REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revoked_reason" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_reason" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permission_grants" text[] DEFAULT '{}'::text[];
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permission_restrictions" text[] DEFAULT '{}'::text[];
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK ("users"."status" in ('invited', 'active', 'disabled', 'revoked', 'locked'));
