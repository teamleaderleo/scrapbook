CREATE TABLE IF NOT EXISTS "agent_task_settlements" (
  "receipt_sha256" text PRIMARY KEY,
  "source" text NOT NULL,
  "provider" text NOT NULL,
  "harness" text NOT NULL,
  "usage_sample_id" text NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "accepted_outcome" text NOT NULL,
  "verification_outcome" text NOT NULL,
  "wall_time_ms" bigint NOT NULL,
  "retries" integer NOT NULL,
  "operator_intervention_minutes" double precision,
  "cleanup_rework" text NOT NULL,
  "five_hour_quota_delta_percent" double precision,
  "weekly_quota_delta_percent" double precision,
  "five_hour_resets_at" timestamp with time zone,
  "weekly_resets_at" timestamp with time zone,
  "subscription_monthly_dollars" double precision,
  "collected_at" timestamp with time zone NOT NULL,
  CONSTRAINT "agent_task_settlements_usage_fk"
    FOREIGN KEY ("source", "provider", "harness", "usage_sample_id")
    REFERENCES "agent_usage_samples" ("source", "provider", "harness", "sample_id")
    ON DELETE RESTRICT,
  CONSTRAINT "agent_task_settlements_identity_check"
    CHECK (
      "receipt_sha256" ~ '^sha256:[0-9a-f]{64}$' AND
      char_length("source") BETWEEN 1 AND 128 AND
      char_length("provider") BETWEEN 1 AND 128 AND
      char_length("harness") BETWEEN 1 AND 128 AND
      char_length("usage_sample_id") BETWEEN 1 AND 128
    ),
  CONSTRAINT "agent_task_settlements_outcome_check"
    CHECK ("accepted_outcome" IN ('accepted', 'rejected', 'partial')),
  CONSTRAINT "agent_task_settlements_verification_check"
    CHECK ("verification_outcome" IN ('passed', 'failed', 'not_run')),
  CONSTRAINT "agent_task_settlements_cleanup_check"
    CHECK ("cleanup_rework" IN ('none', 'required')),
  CONSTRAINT "agent_task_settlements_nonnegative_check"
    CHECK (
      "wall_time_ms" >= 0 AND
      "retries" >= 0 AND
      ("operator_intervention_minutes" IS NULL OR "operator_intervention_minutes" >= 0) AND
      ("five_hour_quota_delta_percent" IS NULL OR "five_hour_quota_delta_percent" BETWEEN 0 AND 100) AND
      ("weekly_quota_delta_percent" IS NULL OR "weekly_quota_delta_percent" BETWEEN 0 AND 100) AND
      ("subscription_monthly_dollars" IS NULL OR "subscription_monthly_dollars" > 0)
    ),
  CONSTRAINT "agent_task_settlements_acceptance_check"
    CHECK ("accepted_outcome" <> 'accepted' OR "verification_outcome" = 'passed')
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_task_settlements_observed_idx"
ON "agent_task_settlements" USING btree ("observed_at" DESC NULLS LAST);
--> statement-breakpoint
ALTER TABLE "agent_task_settlements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "agent_task_settlements" FROM PUBLIC, anon, authenticated;
