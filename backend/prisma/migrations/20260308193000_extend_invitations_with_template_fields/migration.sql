-- Extend existing invitations table with template-driven payload fields
ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "template_id" UUID,
  ADD COLUMN IF NOT EXISTS "data" JSONB,
  ADD COLUMN IF NOT EXISTS "created_by" TEXT,
  ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT FALSE;

-- Keep published flag aligned with existing status values
UPDATE "invitations"
SET "is_published" = ("status" = 'PUBLISHED')
WHERE "is_published" IS DISTINCT FROM ("status" = 'PUBLISHED');

-- Backfill created_by from user/guest ownership columns when empty
UPDATE "invitations"
SET "created_by" = COALESCE("user_id"::text, "guest_token", 'system')
WHERE "created_by" IS NULL;

-- Best-effort template_id backfill using template_key -> templates.template_key
UPDATE "invitations" i
SET "template_id" = t."id"
FROM "templates" t
WHERE i."template_id" IS NULL
  AND t."template_key" = i."template_key"
  AND t."is_deleted" = FALSE
  AND t."id" = (
    SELECT t2."id"
    FROM "templates" t2
    WHERE t2."template_key" = i."template_key"
      AND t2."is_deleted" = FALSE
    ORDER BY t2."created_at" ASC
    LIMIT 1
  );

-- Add FK and index if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invitations_template_id_fkey'
  ) THEN
    ALTER TABLE "invitations"
      ADD CONSTRAINT "invitations_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "templates"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "invitations_template_id_idx"
  ON "invitations"("template_id");
