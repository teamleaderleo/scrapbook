-- Restore the legacy Supabase Data API grants without changing any rows.
-- Only use this if an identified legacy client still requires these tables.
GRANT ALL ON TABLE "public"."account" TO anon, authenticated;
GRANT ALL ON TABLE "public"."block" TO anon, authenticated;
GRANT ALL ON TABLE "public"."project" TO anon, authenticated;
GRANT ALL ON TABLE "public"."project_block_link" TO anon, authenticated;
GRANT ALL ON TABLE "public"."s3_usage" TO anon, authenticated;
GRANT ALL ON TABLE "public"."tag" TO anon, authenticated;
GRANT ALL ON TABLE "public"."tag_association" TO anon, authenticated;
