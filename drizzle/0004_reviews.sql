CREATE TYPE "public"."review_category" AS ENUM('LESSON', 'TOUR');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('SEARCH', 'MANUAL');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"article_key" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"category" "review_category" DEFAULT 'LESSON' NOT NULL,
	"source" "review_source" DEFAULT 'SEARCH' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_article_key_unique" UNIQUE("article_key")
);
