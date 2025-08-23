CREATE TABLE "analysis_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stock_id" integer NOT NULL,
	"recommendation" varchar(20) NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"technical_score" numeric(5, 4) NOT NULL,
	"fundamental_score" numeric(5, 4) NOT NULL,
	"sentiment_score" numeric(5, 4) NOT NULL,
	"macro_score" numeric(5, 4) NOT NULL,
	"overall_score" numeric(5, 4) NOT NULL,
	"reasoning" text,
	"ai_sentiment" varchar(20),
	"ai_confidence" numeric(5, 4),
	"ai_reasoning" text,
	"actual_price" numeric(10, 4),
	"predicted_price" numeric(10, 4),
	"accuracy" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_prices" ALTER COLUMN "interval" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "analysis_history" ADD CONSTRAINT "analysis_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_history" ADD CONSTRAINT "analysis_history_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;