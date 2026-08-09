-- These tables belong to the retired dashboard/project/block/S3 application.
-- Keep the data intact while removing it from browser-facing Data/GraphQL APIs.
REVOKE ALL ON TABLE "public"."account" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."block" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."project" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."project_block_link" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."s3_usage" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."tag" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."tag_association" FROM PUBLIC, anon, authenticated;
