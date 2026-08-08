-- Return Space items to the private administrator-only read boundary from 0011.

DROP POLICY IF EXISTS "items_public_read" ON "public"."items";

REVOKE SELECT ON TABLE "public"."items" FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE "public"."items"
TO authenticated;

