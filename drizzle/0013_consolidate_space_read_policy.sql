DROP POLICY IF EXISTS "items_select_admin" ON "public"."items";
--> statement-breakpoint
DROP POLICY IF EXISTS "items_public_read" ON "public"."items";
--> statement-breakpoint
CREATE POLICY "items_public_read"
ON "public"."items" FOR SELECT
TO anon, authenticated
USING (
  NOT (
    'visibility:private' = ANY (
      COALESCE("tags", ARRAY[]::text[])
    )
  )
  OR
  (SELECT auth.uid()) = ANY (
    ARRAY[
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39'::uuid,
      '9c838f77-83a9-416e-9bd0-ef18e77424e4'::uuid
    ]
  )
);

