CREATE TYPE "public"."discipline" AS ENUM('STA', 'DYN', 'DNF', 'CWT', 'FIM', 'CNF', 'FUN');--> statement-breakpoint
CREATE TYPE "public"."notice_category" AS ENUM('TOUR', 'EVENT', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('NOT_REQUIRED', 'UNPAID', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."registration_kind" AS ENUM('JOIN_SESSION', 'REGULAR_CLASS', 'PAID_TRAINING');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'INSTRUCTOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."schedule_type" AS ENUM('SELF_PRACTICE', 'REGULAR_TRAINING', 'REGULAR_CLASS', 'PAID_TRAINING', 'OVERSEAS_TOUR');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"seq" integer NOT NULL,
	"items" text[] NOT NULL,
	"detail" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"level_label" text DEFAULT '' NOT NULL,
	"session_count" integer,
	"price" integer,
	"rental_separate" boolean DEFAULT false NOT NULL,
	"rental_fee" integer,
	"rental_items_note" text DEFAULT '' NOT NULL,
	"benefits" text[] DEFAULT '{}' NOT NULL,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"audience" text[] DEFAULT '{}' NOT NULL,
	"companion_discount" integer,
	"validity_months" integer,
	"practice_from_session" integer,
	"upgrade_note" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"course_id" text NOT NULL,
	"instructor_id" text,
	"total_sessions" integer NOT NULL,
	"used_sessions" integer DEFAULT 0 NOT NULL,
	"payment_status" "payment_status" DEFAULT 'UNPAID' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logbook_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"location_id" text,
	"location_text" text,
	"discipline" "discipline" NOT NULL,
	"time_sec" integer,
	"distance_m" integer,
	"depth_m" real,
	"condition_note" text DEFAULT '' NOT NULL,
	"instructor_comment" text DEFAULT '' NOT NULL,
	"instructor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notices" (
	"id" text PRIMARY KEY NOT NULL,
	"category" "notice_category" DEFAULT 'GENERAL' NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "registration_kind" NOT NULL,
	"status" "registration_status" DEFAULT 'PENDING' NOT NULL,
	"student_id" text NOT NULL,
	"schedule_id" text,
	"enrollment_id" text,
	"location_id" text,
	"requested_starts_at" timestamp with time zone,
	"requested_ends_at" timestamp with time zone,
	"fee" integer,
	"payment_status" "payment_status" DEFAULT 'UNPAID' NOT NULL,
	"paid_at" timestamp with time zone,
	"training_option_id" text,
	"rent_mask_snorkel" boolean DEFAULT false NOT NULL,
	"rent_long_fin" boolean DEFAULT false NOT NULL,
	"rent_weight" boolean DEFAULT false NOT NULL,
	"rent_suit" boolean DEFAULT false NOT NULL,
	"fin_size" text,
	"weight_kg" integer,
	"rental_fee" integer,
	"approved_by_id" text,
	"approved_at" timestamp with time zone,
	"memo" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rental_items" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"price" integer,
	"pay_on_site" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rental_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "schedule_type" NOT NULL,
	"title" text NOT NULL,
	"location_id" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"capacity" integer,
	"fee" integer,
	"min_level" integer,
	"note" text DEFAULT '' NOT NULL,
	"created_by_id" text NOT NULL,
	"instructor_id" text,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_options" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"participants" integer NOT NULL,
	"venue" text NOT NULL,
	"price" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "training_options_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"role" "role" DEFAULT 'STUDENT' NOT NULL,
	"birth_date" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notices" ADD CONSTRAINT "notices_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_training_option_id_training_options_id_fk" FOREIGN KEY ("training_option_id") REFERENCES "public"."training_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_sessions_course_idx" ON "course_sessions" USING btree ("course_id","seq");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logbook_user_date_idx" ON "logbook_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notices_published_idx" ON "notices" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "registrations_student_idx" ON "registrations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "registrations_status_idx" ON "registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_starts_idx" ON "schedules" USING btree ("starts_at");