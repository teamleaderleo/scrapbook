CREATE TABLE IF NOT EXISTS "codex_token_samples" (
  "source" text NOT NULL,
  "window_started_at" timestamp with time zone NOT NULL,
  "window_ended_at" timestamp with time zone NOT NULL,
  "input_tokens" bigint NOT NULL,
  "cached_input_tokens" bigint NOT NULL,
  "cache_write_input_tokens" bigint NOT NULL,
  "output_tokens" bigint NOT NULL,
  "reasoning_output_tokens" bigint NOT NULL,
  "total_tokens" bigint NOT NULL,
  "model_calls" integer NOT NULL,
  "active_routes" integer NOT NULL,
  "accounting_state" text DEFAULT 'counted' NOT NULL,
  "session_fingerprints" text[] DEFAULT '{}'::text[] NOT NULL,
  "fingerprints_complete" boolean DEFAULT false NOT NULL,
  "collected_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("source", "window_started_at"),
  CONSTRAINT "codex_token_samples_source_check"
    CHECK ("source" IN ('big-red', 'macbook-air')),
  CONSTRAINT "codex_token_samples_state_check"
    CHECK (
      "accounting_state" IN (
        'counted',
        'overlap-skipped',
        'unverified-skipped'
      )
    ),
  CONSTRAINT "codex_token_samples_hour_check"
    CHECK ("window_ended_at" = "window_started_at" + interval '1 hour'),
  CONSTRAINT "codex_token_samples_cached_check"
    CHECK ("cached_input_tokens" <= "input_tokens"),
  CONSTRAINT "codex_token_samples_reasoning_check"
    CHECK ("reasoning_output_tokens" <= "output_tokens"),
  CONSTRAINT "codex_token_samples_nonnegative_check"
    CHECK (
      "input_tokens" >= 0 AND
      "cached_input_tokens" >= 0 AND
      "cache_write_input_tokens" >= 0 AND
      "output_tokens" >= 0 AND
      "reasoning_output_tokens" >= 0 AND
      "total_tokens" >= 0 AND
      "model_calls" >= 0 AND
      "active_routes" >= 0
    )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "codex_token_samples_window_idx"
ON "codex_token_samples" USING btree ("window_started_at" DESC NULLS LAST);
--> statement-breakpoint
ALTER TABLE "codex_token_samples" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "codex_token_samples" FROM PUBLIC, anon, authenticated;
