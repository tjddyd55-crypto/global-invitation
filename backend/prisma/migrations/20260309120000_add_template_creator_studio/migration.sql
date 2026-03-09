DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TemplateSubmissionStatus'
  ) THEN
    CREATE TYPE "TemplateSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
  END IF;
END
$$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_creator" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "studio_config" JSONB,
  ADD COLUMN IF NOT EXISTS "preview_thumbnail_url" TEXT,
  ADD COLUMN IF NOT EXISTS "source_submission_id" UUID;

CREATE TABLE IF NOT EXISTS "template_submissions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "category" TEXT NOT NULL,
  "template_key_candidate" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "style" TEXT NOT NULL,
  "price" INTEGER NOT NULL DEFAULT 0,
  "creator_share" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "TemplateSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "studio_config" JSONB,
  "preview_thumbnail_url" TEXT,
  "parent_submission_id" UUID,
  "revision_number" INTEGER NOT NULL DEFAULT 1,
  "submitted_at" TIMESTAMPTZ(6),
  "reviewed_at" TIMESTAMPTZ(6),
  "review_note" TEXT,
  "approved_template_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "template_submissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_submissions_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_submissions_parent_submission_id_fkey"
    FOREIGN KEY ("parent_submission_id") REFERENCES "template_submissions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "template_submissions_approved_template_id_fkey"
    FOREIGN KEY ("approved_template_id") REFERENCES "templates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_template_submissions_creator_status"
  ON "template_submissions"("creator_id", "status");

CREATE INDEX IF NOT EXISTS "idx_template_submissions_status_submitted_at"
  ON "template_submissions"("status", "submitted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_template_submissions_creator_candidate_revision"
  ON "template_submissions"("creator_id", "template_key_candidate", "revision_number");

CREATE OR REPLACE FUNCTION set_template_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_submissions_updated_at_trigger ON "template_submissions";

CREATE TRIGGER template_submissions_updated_at_trigger
BEFORE UPDATE ON "template_submissions"
FOR EACH ROW
EXECUTE FUNCTION set_template_submissions_updated_at();
