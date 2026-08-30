ALTER TABLE "machine_health_samples"
ADD COLUMN IF NOT EXISTS "browser_rss_bytes" bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "machine_health_samples"
ADD COLUMN IF NOT EXISTS "rdp_connections" integer DEFAULT 0 NOT NULL;
