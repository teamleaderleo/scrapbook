CREATE TABLE IF NOT EXISTS "tag_association" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"associated_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order" integer
);
--> statement-breakpoint
DROP TABLE "artifact_tag";--> statement-breakpoint
DROP TABLE "project_tag";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_association" ADD CONSTRAINT "tag_association_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_association" ADD CONSTRAINT "tag_association_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_tag_association" ON "tag_association" USING btree ("account_id","tag_id","associated_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tag_associations_entity" ON "tag_association" USING btree ("entity_type","associated_id","account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artifact_contents_artifact" ON "artifact_content" USING btree ("artifact_id","account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artifact_content_metadata" ON "artifact_content" USING btree ("metadata");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artifacts_account_updated" ON "artifact" USING btree ("account_id","updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_artifact_links" ON "project_artifact_link" USING btree ("project_id","artifact_id","account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_account_updated" ON "project" USING btree ("account_id","updated_at");