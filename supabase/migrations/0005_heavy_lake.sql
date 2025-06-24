ALTER TABLE "articles" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "status" SET DEFAULT '10%'::text;--> statement-breakpoint
DROP TYPE "public"."article_status";--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('10%', '25%', '50%', '75%', '90%', 'failed', 'completed', 'archived');--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "status" SET DEFAULT '10%'::"public"."article_status";--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "status" SET DATA TYPE "public"."article_status" USING "status"::"public"."article_status";