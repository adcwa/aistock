CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stock_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"condition" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fundamentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"report_date" timestamp NOT NULL,
	"quarter" varchar(10),
	"year" integer NOT NULL,
	"revenue" bigint,
	"net_income" bigint,
	"eps" numeric(8, 4),
	"pe" numeric(8, 2),
	"pb" numeric(8, 2),
	"roe" numeric(8, 4),
	"debt_to_equity" numeric(8, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text,
	"source" varchar(100),
	"url" text,
	"published_at" timestamp NOT NULL,
	"sentiment_score" numeric(4, 3),
	"sentiment_label" varchar(20),
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"recommendation" varchar(20) NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"reasoning" text NOT NULL,
	"technical_score" numeric(4, 3),
	"fundamental_score" numeric(4, 3),
	"sentiment_score" numeric(4, 3),
	"macro_score" numeric(4, 3)
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"open" numeric(10, 4) NOT NULL,
	"high" numeric(10, 4) NOT NULL,
	"low" numeric(10, 4) NOT NULL,
	"close" numeric(10, 4) NOT NULL,
	"volume" bigint NOT NULL,
	"interval" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"sector" varchar(100),
	"industry" varchar(100),
	"market_cap" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stocks_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "technical_indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"sma_50" numeric(10, 4),
	"sma_200" numeric(10, 4),
	"rsi_14" numeric(6, 2),
	"macd" numeric(10, 6),
	"macd_signal" numeric(10, 6),
	"bb_upper" numeric(10, 4),
	"bb_lower" numeric(10, 4),
	"obv" bigint
);
--> statement-breakpoint
CREATE TABLE "watchlist_stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchlist_id" integer NOT NULL,
	"stock_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fundamentals" ADD CONSTRAINT "fundamentals_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_prices" ADD CONSTRAINT "stock_prices_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_indicators" ADD CONSTRAINT "technical_indicators_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_stocks" ADD CONSTRAINT "watchlist_stocks_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_stocks" ADD CONSTRAINT "watchlist_stocks_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;