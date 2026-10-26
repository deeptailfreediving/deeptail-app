CREATE TYPE "public"."license_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."upload_kind" AS ENUM('LICENSE', 'REVIEW');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "license_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agency" text NOT NULL,
	"level" integer NOT NULL,
	"image_id" text,
	"status" "license_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "upload_kind" NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "image_checked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license_level" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license_agency" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "license_requests" ADD CONSTRAINT "license_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
