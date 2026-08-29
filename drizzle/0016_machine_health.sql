CREATE TABLE IF NOT EXISTS "machine_health_status" (
  "host" text PRIMARY KEY NOT NULL,
  "payload" jsonb NOT NULL,
  "checked_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "machine_health_samples" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "host" text NOT NULL,
  "checked_at" timestamp with time zone NOT NULL,
  "state" text NOT NULL,
  "root_used_percent" double precision NOT NULL,
  "memory_used_percent" double precision NOT NULL,
  "cpu_used_percent" double precision NOT NULL,
  "load_per_cpu" double precision NOT NULL,
  "peak_sensor_temperature_c" double precision,
  "graphics_clock_mhz" double precision,
  "network_rx_mib_s" double precision NOT NULL,
  "network_tx_mib_s" double precision NOT NULL,
  "browser_roots" integer NOT NULL,
  "codex_workers" integer NOT NULL,
  "failed_units" integer NOT NULL,
  "unexpected_dev_listeners" integer NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "machine_health_samples_host_checked_idx"
ON "machine_health_samples" USING btree ("host", "checked_at" DESC NULLS LAST);
--> statement-breakpoint
ALTER TABLE "machine_health_status" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "machine_health_samples" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "machine_health_status" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "machine_health_samples" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON SEQUENCE "machine_health_samples_id_seq" FROM PUBLIC, anon, authenticated;
