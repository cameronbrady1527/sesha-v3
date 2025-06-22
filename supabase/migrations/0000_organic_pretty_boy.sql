CREATE TYPE "public"."article_status" AS ENUM('processing', 'failed', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."blobs" AS ENUM('1', '2', '3', '4', '5', '6');--> statement-breakpoint
CREATE TYPE "public"."length" AS ENUM('100-250', '400-550', '700-850', '1000-1200');--> statement-breakpoint
CREATE TYPE "public"."run_type" AS ENUM('digest');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"headline" varchar(500),
	"blob" text,
	"content" json,
	"change_description" text,
	"input_source_text" text NOT NULL,
	"input_source_description" text DEFAULT '' NOT NULL,
	"input_source_accredit" text DEFAULT '' NOT NULL,
	"input_source_verbatim" boolean DEFAULT false NOT NULL,
	"input_source_primary" boolean DEFAULT false NOT NULL,
	"input_preset_title" varchar(255),
	"input_preset_instructions" text DEFAULT '' NOT NULL,
	"input_preset_blobs" "blobs" DEFAULT '1' NOT NULL,
	"input_preset_length" "length" DEFAULT '700-850' NOT NULL,
	"status" "article_status" DEFAULT 'processing' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"instructions" text NOT NULL,
	"blobs" "blobs" NOT NULL,
	"length" "length" NOT NULL,
	"org_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "presets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid,
	"user_id" uuid,
	"run_type" "run_type" NOT NULL,
	"length" "length" NOT NULL,
	"cost_usd" numeric(12, 6) NOT NULL,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"org_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presets" ADD CONSTRAINT "presets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_org_slug_version_idx" ON "articles" USING btree ("org_id","slug","version");--> statement-breakpoint
CREATE INDEX "articles_org_slug_idx" ON "articles" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organizations_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "presets_org_idx" ON "presets" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "runs_article_idx" ON "runs" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_one_admin_per_org" ON "users" USING btree ("org_id") WHERE "users"."role" = 'admin';