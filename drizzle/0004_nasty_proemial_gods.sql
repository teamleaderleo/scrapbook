CREATE INDEX IF NOT EXISTS "idx_artifact_content_type" ON "artifact_content" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artifacts_name" ON "artifact" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_artifact_links_artifact" ON "project_artifact_link" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_artifact_links_project" ON "project_artifact_link" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_name" ON "project" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "project" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tag_associations_tag_id" ON "tag_association" USING btree ("tag_id");