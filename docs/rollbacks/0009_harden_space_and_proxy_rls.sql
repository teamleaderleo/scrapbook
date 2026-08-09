-- Emergency reversal for drizzle/0009_harden_space_and_proxy_rls.sql.
-- This restores archived duplicate rows and the previous grants/policies.
-- WARNING: the previous reviews policy allowed anonymous writes. Do not run
-- this rollback merely to restore public review reads; repair forward instead.

DROP INDEX IF EXISTS "public"."reviews_item_id_unique";

INSERT INTO "public"."reviews" (
  item_id,
  user_id,
  due,
  last_review,
  stability,
  difficulty,
  scheduled_days,
  learning_steps,
  reps,
  lapses,
  state,
  suspended,
  updated_at
)
SELECT
  item_id,
  user_id,
  due,
  last_review,
  stability,
  difficulty,
  scheduled_days,
  learning_steps,
  reps,
  lapses,
  state,
  suspended,
  updated_at
FROM "private"."reviews_duplicate_archive_20260809";

DROP POLICY IF EXISTS "reviews_select_admin" ON "public"."reviews";
DROP POLICY IF EXISTS "reviews_insert_admin" ON "public"."reviews";
DROP POLICY IF EXISTS "reviews_update_admin" ON "public"."reviews";
DROP POLICY IF EXISTS "reviews_delete_admin" ON "public"."reviews";

CREATE POLICY "Public access for reviews"
ON "public"."reviews" FOR ALL
TO PUBLIC
USING (true);

CREATE POLICY "Public can view reviews"
ON "public"."reviews" FOR SELECT
TO PUBLIC
USING (true);

GRANT ALL ON TABLE "public"."reviews" TO anon, authenticated;

DROP POLICY IF EXISTS "items_public_read" ON "public"."items";
CREATE POLICY "public_select_items"
ON "public"."items" FOR SELECT
TO PUBLIC
USING (true);
GRANT ALL ON TABLE "public"."items" TO anon, authenticated;

ALTER TABLE "public"."proxy_health_status" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."proxy_health_samples" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."proxy_health_status" TO anon, authenticated;
GRANT ALL ON TABLE "public"."proxy_health_samples" TO anon, authenticated;
