CREATE TABLE IF NOT EXISTS "account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text,
	"provider" varchar(255),
	"provider_account_id" varchar(255),
	"last_login" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artifact_content" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"artifact_id" uuid NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artifact_tag" (
	"account_id" uuid NOT NULL,
	"artifact_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artifact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_artifact_link" (
	"account_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"artifact_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_tag" (
	"account_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "s3_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_content" ADD CONSTRAINT "artifact_content_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_content" ADD CONSTRAINT "artifact_content_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_tag" ADD CONSTRAINT "artifact_tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_tag" ADD CONSTRAINT "artifact_tag_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact_tag" ADD CONSTRAINT "artifact_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifact" ADD CONSTRAINT "artifact_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_artifact_link" ADD CONSTRAINT "project_artifact_link_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_artifact_link" ADD CONSTRAINT "project_artifact_link_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_artifact_link" ADD CONSTRAINT "project_artifact_link_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_tag" ADD CONSTRAINT "project_tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_tag" ADD CONSTRAINT "project_tag_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_tag" ADD CONSTRAINT "project_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "s3_usage" ADD CONSTRAINT "s3_usage_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag" ADD CONSTRAINT "tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "account" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "artifact_tag_artifact_id_tag_id_key" ON "artifact_tag" USING btree ("artifact_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "project_tag_project_id_tag_id_key" ON "project_tag" USING btree ("project_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "s3_usage_account_id_month_year_key" ON "s3_usage" USING btree ("account_id","month","year");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tag_account_id_name_key" ON "tag" USING btree ("account_id","name");