ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."items" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."reviews" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."items" TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."reviews" TO authenticated;
--> statement-breakpoint
DROP POLICY IF EXISTS "public_select_items" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "items_public_read" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "admin_delete_items" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "admin_update_items_consolidated" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "authenticated_insert_items" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "items_select_admin" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "items_insert_admin" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "items_update_admin" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "items_delete_admin" ON "public"."items";
--> statement-breakpoint
CREATE POLICY "items_select_admin"
ON "public"."items" FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "items_insert_admin"
ON "public"."items" FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "items_update_admin"
ON "public"."items" FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
)
WITH CHECK (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "items_delete_admin"
ON "public"."items" FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
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
DROP POLICY IF EXISTS "reviews_select_admin" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "reviews_insert_admin" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "reviews_update_admin" ON "public"."reviews";
--> statement-breakpoint
DROP POLICY IF EXISTS "reviews_delete_admin" ON "public"."reviews";
--> statement-breakpoint
CREATE POLICY "reviews_select_admin"
ON "public"."reviews" FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "reviews_insert_admin"
ON "public"."reviews" FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "reviews_update_admin"
ON "public"."reviews" FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
)
WITH CHECK (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
--> statement-breakpoint
CREATE POLICY "reviews_delete_admin"
ON "public"."reviews" FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);
