ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE SELECT ON TABLE "public"."items" FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT (
  id,
  title,
  slug,
  url,
  default_index,
  versions,
  tags,
  category,
  score,
  created_at,
  updated_at
) ON TABLE "public"."items" TO anon, authenticated;
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "public"."items" TO authenticated;
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
);

