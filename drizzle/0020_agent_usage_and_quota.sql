CREATE TABLE IF NOT EXISTS "agent_usage_samples" (
  "source" text NOT NULL,
  "sample_id" text NOT NULL,
  "provider" text NOT NULL,
  "harness" text NOT NULL,
  "model" text NOT NULL,
  "effort" text,
  "accounting_contract" text NOT NULL,
  "run_ref" text,
  "observed_at" timestamp with time zone NOT NULL,
  "input_tokens" bigint,
  "cached_input_tokens" bigint,
  "reasoning_tokens" bigint,
  "output_tokens" bigint,
  "total_tokens" bigint,
  "request_count" bigint,
  "turn_count" bigint,
  "agent_step_count" bigint,
  "collected_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("source", "sample_id"),
  CONSTRAINT "agent_usage_samples_identity_check"
    CHECK (
      char_length("source") BETWEEN 1 AND 128 AND
      char_length("sample_id") BETWEEN 1 AND 128 AND
      char_length("provider") BETWEEN 1 AND 128 AND
      char_length("harness") BETWEEN 1 AND 128 AND
      char_length("model") BETWEEN 1 AND 128 AND
      char_length("accounting_contract") BETWEEN 1 AND 128 AND
      ("effort" IS NULL OR char_length("effort") BETWEEN 1 AND 128) AND
      ("run_ref" IS NULL OR char_length("run_ref") BETWEEN 1 AND 256)
    ),
  CONSTRAINT "agent_usage_samples_nonnegative_check"
    CHECK (
      ("input_tokens" IS NULL OR "input_tokens" >= 0) AND
      ("cached_input_tokens" IS NULL OR "cached_input_tokens" >= 0) AND
      ("reasoning_tokens" IS NULL OR "reasoning_tokens" >= 0) AND
      ("output_tokens" IS NULL OR "output_tokens" >= 0) AND
      ("total_tokens" IS NULL OR "total_tokens" >= 0) AND
      ("request_count" IS NULL OR "request_count" >= 0) AND
      ("turn_count" IS NULL OR "turn_count" >= 0) AND
      ("agent_step_count" IS NULL OR "agent_step_count" >= 0)
    )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_usage_samples_observed_idx"
ON "agent_usage_samples" USING btree ("observed_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_usage_samples_provider_model_idx"
ON "agent_usage_samples" USING btree ("provider", "model", "observed_at" DESC NULLS LAST);
--> statement-breakpoint
ALTER TABLE "agent_usage_samples" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "agent_usage_samples" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_quota_samples" (
  "source" text NOT NULL,
  "sample_id" text NOT NULL,
  "provider" text NOT NULL,
  "harness" text NOT NULL,
  "plan_class" text,
  "quota_contract" text NOT NULL,
  "limit_id" text NOT NULL,
  "window_minutes" integer,
  "percent_orientation" text,
  "percent_value" double precision,
  "resets_at" timestamp with time zone,
  "balance_unit" text,
  "balance_value" double precision,
  "observed_at" timestamp with time zone NOT NULL,
  "collected_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("source", "sample_id"),
  CONSTRAINT "provider_quota_samples_identity_check"
    CHECK (
      char_length("source") BETWEEN 1 AND 128 AND
      char_length("sample_id") BETWEEN 1 AND 128 AND
      char_length("provider") BETWEEN 1 AND 128 AND
      char_length("harness") BETWEEN 1 AND 128 AND
      char_length("quota_contract") BETWEEN 1 AND 128 AND
      char_length("limit_id") BETWEEN 1 AND 128 AND
      ("plan_class" IS NULL OR char_length("plan_class") BETWEEN 1 AND 128) AND
      ("balance_unit" IS NULL OR char_length("balance_unit") BETWEEN 1 AND 128)
    ),
  CONSTRAINT "provider_quota_samples_window_check"
    CHECK ("window_minutes" IS NULL OR "window_minutes" BETWEEN 1 AND 525600),
  CONSTRAINT "provider_quota_samples_percent_check"
    CHECK (
      ("percent_value" IS NULL AND "percent_orientation" IS NULL) OR
      (
        "percent_value" IS NOT NULL AND
        "percent_value" BETWEEN 0 AND 100 AND
        "percent_orientation" IN ('used', 'remaining')
      )
    ),
  CONSTRAINT "provider_quota_samples_balance_check"
    CHECK (
      ("balance_value" IS NULL AND "balance_unit" IS NULL) OR
      (
        "balance_value" IS NOT NULL AND
        "balance_value" >= 0 AND
        "balance_unit" IS NOT NULL
      )
    ),
  CONSTRAINT "provider_quota_samples_signal_check"
    CHECK ("percent_value" IS NOT NULL OR "balance_value" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_quota_samples_observed_idx"
ON "provider_quota_samples" USING btree ("observed_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_quota_samples_provider_limit_idx"
ON "provider_quota_samples" USING btree ("provider", "limit_id", "observed_at" DESC NULLS LAST);
--> statement-breakpoint
ALTER TABLE "provider_quota_samples" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "provider_quota_samples" FROM PUBLIC, anon, authenticated;
