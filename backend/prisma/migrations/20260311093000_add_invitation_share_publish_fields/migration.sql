ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "data_json" JSONB,
  ADD COLUMN IF NOT EXISTS "share_slug" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ(6);

UPDATE "invitations"
SET "data_json" = "data"
WHERE "data_json" IS NULL
  AND "data" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "invitations_share_slug_key"
ON "invitations" ("share_slug");
