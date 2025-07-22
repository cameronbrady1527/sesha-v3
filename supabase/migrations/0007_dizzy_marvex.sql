CREATE TYPE "public"."source_type" AS ENUM('single', 'multi');--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "source_type" "source_type" DEFAULT 'single' NOT NULL;