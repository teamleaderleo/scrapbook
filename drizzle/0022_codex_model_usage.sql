ALTER TABLE public.codex_token_samples ADD COLUMN IF NOT EXISTS model_usage jsonb CHECK (model_usage IS NULL OR jsonb_typeof(model_usage) = 'array');
