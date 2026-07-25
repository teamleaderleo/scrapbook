CREATE TABLE IF NOT EXISTS "proxy_health_status" (
  "host" text PRIMARY KEY NOT NULL,
  "payload" jsonb NOT NULL,
  "checked_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proxy_health_samples" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "host" text NOT NULL,
  "checked_at" timestamp with time zone NOT NULL,
  "mode" text,
  "rx_bytes" bigint,
  "tx_bytes" bigint,
  "public_latency_ms" double precision,
  "wg_latency_ms" double precision,
  "shanghai_bandwagon_ms" double precision,
  "shanghai_linode_ms" double precision,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proxy_health_samples_host_checked_idx"
ON "proxy_health_samples" USING btree ("host", "checked_at" DESC NULLS LAST);
