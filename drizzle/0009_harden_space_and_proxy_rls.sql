CREATE SCHEMA IF NOT EXISTS "private";
--> statement-breakpoint
REVOKE ALL ON SCHEMA "private" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TABLE "private"."reviews_duplicate_archive_20260809" AS
WITH ranked_reviews AS (
  SELECT
    reviews.*,
    row_number() OVER (
      PARTITION BY item_id
      ORDER BY updated_at DESC, last_review DESC NULLS LAST, ctid DESC
    ) AS duplicate_rank
  FROM "public"."reviews"
)
SELECT
  ranked_reviews.*,
  now() AS archived_at
FROM ranked_reviews
WHERE duplicate_rank > 1;
--> statement-breakpoint
REVOKE ALL ON TABLE "private"."reviews_duplicate_archive_20260809"
FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
WITH ranked_reviews AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY item_id
      ORDER BY updated_at DESC, last_review DESC NULLS LAST, ctid DESC
    ) AS duplicate_rank
  FROM "public"."reviews"
)
DELETE FROM "public"."reviews"
USING ranked_reviews
WHERE "public"."reviews".ctid = ranked_reviews.ctid
  AND ranked_reviews.duplicate_rank > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_item_id_unique"
ON "public"."reviews" USING btree ("item_id");
--> statement-breakpoint
DROP POLICY IF EXISTS "Public access for reviews" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "Public can view reviews" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "reviews_delete_admin_consolidated" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "reviews_insert_admin_consolidated" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "reviews_update_admin_consolidated" ON "public"."reviews";
--> statement-breakpoint
CREATE POLICY "reviews_select_admin"
ON "public"."reviews" FOR SELECT
TO authenticated
USING (
  ((SELECT auth.uid()))::text = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::text,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::text
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "reviews_insert_admin"
ON "public"."reviews" FOR INSERT
TO authenticated
WITH CHECK (
  ((SELECT auth.uid()))::text = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::text,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::text
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "reviews_update_admin"
ON "public"."reviews" FOR UPDATE
TO authenticated
USING (
  ((SELECT auth.uid()))::text = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::text,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::text
    ]
  )
)
WITH CHECK (
  ((SELECT auth.uid()))::text = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::text,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::text
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "reviews_delete_admin"
ON "public"."reviews" FOR DELETE
TO authenticated
USING (
  ((SELECT auth.uid()))::text = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::text,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::text
    ]
  )
);
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."reviews" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."reviews" TO authenticated;
--> statement-breakpoint
DROP POLICY IF EXISTS "public_select_items" ON "public"."items";
--> statement-breakpoint
CREATE POLICY "items_public_read"
ON "public"."items" FOR SELECT
TO anon, authenticated
USING (true);
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."items" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON TABLE "public"."items" TO anon, authenticated;
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "public"."items" TO authenticated;
--> statement-breakpoint
ALTER TABLE "public"."proxy_health_status" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."proxy_health_samples" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."proxy_health_status" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."proxy_health_samples" FROM PUBLIC, anon, authenticated;
