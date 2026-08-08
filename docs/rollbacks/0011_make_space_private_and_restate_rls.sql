-- Restore the previous public-item/private-review access model.
-- This intentionally retains the explicit admin-only item mutation policies.

DROP POLICY IF EXISTS "items_select_admin" ON "public"."items";

CREATE POLICY "items_public_read"
ON "public"."items" FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON TABLE "public"."items" TO anon, authenticated;
