CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE "CreatorPayoutStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT;

UPDATE "templates"
SET "thumbnail_url" = "preview_thumbnail_url"
WHERE "thumbnail_url" IS NULL
  AND "preview_thumbnail_url" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "template_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "version_number" INTEGER NOT NULL,
  "template_key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "style" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "creator_share" DOUBLE PRECISION NOT NULL,
  "studio_config" JSONB,
  "thumbnail_url" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_versions_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_versions_template_id_version_number_key"
  ON "template_versions"("template_id", "version_number");
CREATE INDEX IF NOT EXISTS "template_versions_template_id_created_at_idx"
  ON "template_versions"("template_id", "created_at");

INSERT INTO "template_versions" (
  "template_id",
  "version_number",
  "template_key",
  "name",
  "style",
  "description",
  "price",
  "creator_share",
  "studio_config",
  "thumbnail_url",
  "created_at"
)
SELECT
  "t"."id",
  1,
  "t"."template_key",
  "t"."name",
  "t"."style",
  "t"."description",
  "t"."price",
  "t"."creator_share",
  "t"."studio_config",
  COALESCE("t"."thumbnail_url", "t"."preview_thumbnail_url"),
  COALESCE("t"."updated_at", "t"."created_at", CURRENT_TIMESTAMP)
FROM "templates" "t"
WHERE NOT EXISTS (
  SELECT 1
  FROM "template_versions" "tv"
  WHERE "tv"."template_id" = "t"."id"
);

ALTER TABLE "template_usages"
  ADD COLUMN IF NOT EXISTS "template_version_id" UUID;

UPDATE "template_usages" "tu"
SET "template_version_id" = "tv"."id"
FROM "template_versions" "tv"
WHERE "tu"."template_id" = "tv"."template_id"
  AND "tv"."version_number" = (
    SELECT MAX("latest"."version_number")
    FROM "template_versions" "latest"
    WHERE "latest"."template_id" = "tu"."template_id"
  )
  AND "tu"."template_version_id" IS NULL;

DO $$
BEGIN
  ALTER TABLE "template_usages"
    ADD CONSTRAINT "template_usages_template_version_id_fkey"
    FOREIGN KEY ("template_version_id") REFERENCES "template_versions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "template_usages_template_version_id_created_at_idx"
  ON "template_usages"("template_version_id", "created_at");

CREATE TABLE IF NOT EXISTS "template_views" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "viewer_user_id" UUID,
  "viewer_guest_token" TEXT,
  "session_id" TEXT,
  "referrer" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_views_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_views_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_views_viewer_user_id_fkey"
    FOREIGN KEY ("viewer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "template_views_template_id_created_at_idx"
  ON "template_views"("template_id", "created_at");
CREATE INDEX IF NOT EXISTS "template_views_viewer_user_id_created_at_idx"
  ON "template_views"("viewer_user_id", "created_at");

CREATE TABLE IF NOT EXISTS "template_clones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "template_version_id" UUID,
  "template_usage_id" UUID UNIQUE,
  "invitation_id" UUID NOT NULL,
  "cloned_by_user_id" UUID,
  "cloned_by_guest_token" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_clones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_clones_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_clones_template_version_id_fkey"
    FOREIGN KEY ("template_version_id") REFERENCES "template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "template_clones_template_usage_id_fkey"
    FOREIGN KEY ("template_usage_id") REFERENCES "template_usages"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "template_clones_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_clones_cloned_by_user_id_fkey"
    FOREIGN KEY ("cloned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "template_clones_template_id_created_at_idx"
  ON "template_clones"("template_id", "created_at");
CREATE INDEX IF NOT EXISTS "template_clones_template_version_id_created_at_idx"
  ON "template_clones"("template_version_id", "created_at");
CREATE INDEX IF NOT EXISTS "template_clones_cloned_by_user_id_created_at_idx"
  ON "template_clones"("cloned_by_user_id", "created_at");

CREATE TABLE IF NOT EXISTS "creator_payouts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creator_id" UUID NOT NULL,
  "period_start" TIMESTAMPTZ(6) NOT NULL,
  "period_end" TIMESTAMPTZ(6) NOT NULL,
  "total_revenue" DOUBLE PRECISION NOT NULL,
  "total_usage_count" INTEGER NOT NULL DEFAULT 0,
  "status" "CreatorPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "paid_at" TIMESTAMPTZ(6),
  "note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_payouts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "creator_payouts_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_payouts_creator_id_period_start_period_end_key"
  ON "creator_payouts"("creator_id", "period_start", "period_end");
CREATE INDEX IF NOT EXISTS "creator_payouts_creator_id_status_idx"
  ON "creator_payouts"("creator_id", "status");
CREATE INDEX IF NOT EXISTS "creator_payouts_creator_id_created_at_idx"
  ON "creator_payouts"("creator_id", "created_at");
