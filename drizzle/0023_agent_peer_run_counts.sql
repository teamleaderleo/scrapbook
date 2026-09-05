ALTER TABLE "agent_usage_samples" ADD COLUMN IF NOT EXISTS "successful_request_count" bigint;
--> statement-breakpoint
ALTER TABLE "agent_usage_samples" ADD COLUMN IF NOT EXISTS "api_equivalent_estimate_usd" double precision;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_usage_samples_peer_counts_check'
  ) THEN
    ALTER TABLE "agent_usage_samples" ADD CONSTRAINT "agent_usage_samples_peer_counts_check"
      CHECK ("successful_request_count" IS NULL OR "successful_request_count" >= 0);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_usage_samples_api_estimate_check'
  ) THEN
    ALTER TABLE "agent_usage_samples" ADD CONSTRAINT "agent_usage_samples_api_estimate_check"
      CHECK ("api_equivalent_estimate_usd" IS NULL OR "api_equivalent_estimate_usd" >= 0);
  END IF;
END $$;
