ALTER TABLE "artifact_content" ALTER COLUMN "type" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "artifact_content" DROP COLUMN IF EXISTS "variants";--> statement-breakpoint
ALTER TABLE "artifact_content" DROP COLUMN IF EXISTS "embed";--> statement-breakpoint
ALTER TABLE "artifact_content" DROP COLUMN IF EXISTS "annotations";