CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."exam_board" AS ENUM('GCE_A', 'GCE_O', 'CAIE', 'Edexcel');--> statement-breakpoint
CREATE TYPE "public"."paper_type" AS ENUM('past_paper', 'model_paper');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'submitted', 'expired');--> statement-breakpoint
CREATE TABLE "exam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paper_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"submitted_at" timestamp,
	"score_pct" numeric,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" "paper_type" NOT NULL,
	"subject" text NOT NULL,
	"exam_board" "exam_board" NOT NULL,
	"language" text NOT NULL,
	"year" integer,
	"price_lkr" numeric NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paper_id" uuid NOT NULL,
	"amount_paid_lkr" numeric NOT NULL,
	"payment_method" text,
	"payment_ref" text,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_paper_unique" UNIQUE("user_id","paper_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option_id" text NOT NULL,
	"explanation" text,
	"difficulty" "difficulty" NOT NULL,
	"topic_tag" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_id" text,
	"is_correct" boolean,
	"answered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_question_unique" UNIQUE("session_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"grade_year" text,
	"preferred_language" text,
	"two_fa_enabled" boolean DEFAULT false,
	"two_fa_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_user_status_idx" ON "exam_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "papers_search_idx" ON "papers" USING btree ("subject","exam_board","language","type");--> statement-breakpoint
CREATE INDEX "purchases_user_idx" ON "purchases" USING btree ("user_id");