ALTER TYPE "public"."schedule_type" ADD VALUE 'CLOSURE';--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "external_title" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_external_id_unique" UNIQUE("external_id");