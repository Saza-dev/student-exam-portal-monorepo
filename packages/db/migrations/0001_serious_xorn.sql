CREATE TYPE "public"."issue_type" AS ENUM('wrong_answer', 'typo', 'other');--> statement-breakpoint
CREATE TABLE "paper_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"question_id" uuid,
	"user_id" uuid NOT NULL,
	"issue_type" "issue_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paper_issues" ADD CONSTRAINT "paper_issues_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_issues" ADD CONSTRAINT "paper_issues_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_issues" ADD CONSTRAINT "paper_issues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;