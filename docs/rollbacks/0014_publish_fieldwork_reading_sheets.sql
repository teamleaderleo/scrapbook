-- Remove only the hand-curated Fieldwork collection published by migration 0014.
-- This is intentionally not automatic: review any later edits before using it.

DELETE FROM public.items
WHERE 'collection:fieldwork-studies-01' = ANY (
  COALESCE(tags, ARRAY[]::text[])
);
