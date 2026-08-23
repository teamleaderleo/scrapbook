CREATE TABLE IF NOT EXISTS public.scraplet_pet_counter (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  pet_count bigint NOT NULL DEFAULT 0 CHECK (pet_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.scraplet_pet_counter (id, pet_count)
VALUES (true, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.scraplet_pet_counter ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.scraplet_pet_counter FROM anon, authenticated;
