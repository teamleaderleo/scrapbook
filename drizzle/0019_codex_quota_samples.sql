CREATE TABLE IF NOT EXISTS "codex_quota_samples" (
  "source" text NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "limit_id" text NOT NULL,
  "window_minutes" integer NOT NULL,
  "used_percent" double precision NOT NULL,
  "resets_at" timestamp with time zone,
  "collected_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("source", "observed_at", "limit_id", "window_minutes"),
  CONSTRAINT "codex_quota_samples_source_check"
    CHECK ("source" IN ('big-red', 'macbook-air')),
  CONSTRAINT "codex_quota_samples_limit_id_check"
    CHECK (
      char_length("limit_id") BETWEEN 1 AND 64 AND
      "limit_id" ~ '^[A-Za-z0-9_.:-]+$'
    ),
  CONSTRAINT "codex_quota_samples_window_check"
    CHECK ("window_minutes" BETWEEN 1 AND 525600),
  CONSTRAINT "codex_quota_samples_percent_check"
    CHECK ("used_percent" >= 0 AND "used_percent" <= 100)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "codex_quota_samples_observed_idx"
ON "codex_quota_samples" USING btree ("observed_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "codex_quota_samples_window_idx"
ON "codex_quota_samples" USING btree (
  "limit_id",
  "window_minutes",
  "observed_at" DESC NULLS LAST
);
--> statement-breakpoint
ALTER TABLE "codex_quota_samples" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "codex_quota_samples" FROM PUBLIC, anon, authenticated;
