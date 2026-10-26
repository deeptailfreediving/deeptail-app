CREATE TYPE "public"."payment_method" AS ENUM('BANK_TRANSFER', 'ONSITE_CARD', 'NAVER_BOOKING');--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "payment_method" "payment_method";