CREATE TABLE "share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"public_code" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_public_code_unique" UNIQUE("public_code")
);
--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "share_links_document_id_idx" ON "share_links" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "share_links_public_code_idx" ON "share_links" USING btree ("public_code");
