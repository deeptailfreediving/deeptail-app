CREATE TYPE "public"."dive_purpose" AS ENUM('SELF_PRACTICE', 'REGULAR_TRAINING', 'REGULAR_CLASS', 'PAID_TRAINING', 'PERSONAL_TRAINING', 'FUN_DIVING');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dive_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"dive_date" text NOT NULL,
	"purpose" "dive_purpose" NOT NULL,
	"place" text NOT NULL,
	"suit" text DEFAULT '' NOT NULL,
	"weight" text DEFAULT '' NOT NULL,
	"activity" text DEFAULT '' NOT NULL,
	"sta_sec" integer,
	"sta_note" text DEFAULT '' NOT NULL,
	"dyn_m" real,
	"dyn_note" text DEFAULT '' NOT NULL,
	"fim_m" real,
	"fim_note" text DEFAULT '' NOT NULL,
	"cwt_m" real,
	"cwt_note" text DEFAULT '' NOT NULL,
	"feedback" text DEFAULT '' NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dive_logs" ADD CONSTRAINT "dive_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dive_logs" ADD CONSTRAINT "dive_logs_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dive_logs_user_date_idx" ON "dive_logs" USING btree ("user_id","dive_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dive_logs_reviewed_idx" ON "dive_logs" USING btree ("reviewed");