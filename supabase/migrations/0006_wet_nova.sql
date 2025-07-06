ALTER TABLE "articles" RENAME COLUMN "input_source_text" TO "input_source_text_1";--> statement-breakpoint
ALTER TABLE "articles" RENAME COLUMN "input_source_description" TO "input_source_description_1";--> statement-breakpoint
ALTER TABLE "articles" RENAME COLUMN "input_source_accredit" TO "input_source_accredit_1";--> statement-breakpoint
ALTER TABLE "articles" RENAME COLUMN "input_source_verbatim" TO "input_source_verbatim_1";--> statement-breakpoint
ALTER TABLE "articles" RENAME COLUMN "input_source_primary" TO "input_source_primary_1";--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_text_2" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_description_2" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_accredit_2" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_verbatim_2" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_primary_2" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_text_3" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_description_3" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_accredit_3" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_verbatim_3" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_primary_3" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_text_4" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_description_4" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_accredit_4" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_verbatim_4" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_primary_4" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_text_5" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_description_5" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_accredit_5" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_verbatim_5" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_primary_5" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_text_6" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_description_6" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_accredit_6" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_verbatim_6" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "input_source_primary_6" boolean DEFAULT false;