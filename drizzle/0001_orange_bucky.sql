ALTER TABLE "artifact_content" ADD COLUMN "variants" jsonb;--> statement-breakpoint
ALTER TABLE "artifact_content" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "artifact_content" ADD COLUMN "embed" jsonb;--> statement-breakpoint
ALTER TABLE "artifact_content" ADD COLUMN "annotations" jsonb;--> statement-breakpoint
ALTER TABLE "artifact_content" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "artifact_content" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "artifact_content" ADD COLUMN "last_modified_by" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_content" ADD CONSTRAINT "artifact_content_created_by_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_content" ADD CONSTRAINT "artifact_content_last_modified_by_account_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
