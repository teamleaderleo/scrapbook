CREATE TABLE IF NOT EXISTS public.machine_activity_status (
  host text PRIMARY KEY CHECK (host IN ('big-red', 'macbook-air')),
  checked_at timestamptz NOT NULL,
  payload jsonb NOT NULL CONSTRAINT machine_activity_status_object CHECK (jsonb_typeof(payload) = 'object')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.machine_activity_samples (
  host text NOT NULL CHECK (host IN ('big-red', 'macbook-air')),
  minute timestamptz NOT NULL,
  checked_at timestamptz NOT NULL,
  payload jsonb NOT NULL CHECK (NOT (payload ? 'processes'))
    CONSTRAINT machine_activity_samples_object CHECK (jsonb_typeof(payload) = 'object'),
  PRIMARY KEY (host, minute)
);
--> statement-breakpoint
ALTER TABLE public.machine_activity_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_activity_samples ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.machine_activity_status FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.machine_activity_samples FROM PUBLIC, anon, authenticated;
