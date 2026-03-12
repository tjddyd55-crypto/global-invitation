CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'CREATOR', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';

UPDATE "users"
SET "role" = 'CREATOR'
WHERE "is_creator" = true
  AND "role" = 'USER';

ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "templates"
SET "status" = CASE
  WHEN "is_active" = true AND "is_deleted" = false THEN 'PUBLISHED'::"TemplateStatus"
  ELSE 'APPROVED'::"TemplateStatus"
END
WHERE "status" = 'DRAFT';

CREATE TABLE IF NOT EXISTS "template_usages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "invitation_id" UUID NOT NULL,
  "used_by_user_id" UUID,
  "used_by_guest_token" TEXT,
  "price_snapshot" INTEGER NOT NULL,
  "creator_share_snapshot" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_usages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_usages_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_usages_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_usages_used_by_user_id_fkey"
    FOREIGN KEY ("used_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_usages_invitation_id_key" ON "template_usages"("invitation_id");
CREATE INDEX IF NOT EXISTS "template_usages_template_id_created_at_idx" ON "template_usages"("template_id", "created_at");
CREATE INDEX IF NOT EXISTS "template_usages_used_by_user_id_created_at_idx" ON "template_usages"("used_by_user_id", "created_at");

CREATE TABLE IF NOT EXISTS "template_revenues" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "usage_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "creator_id" UUID,
  "total_amount" INTEGER NOT NULL,
  "creator_revenue" DOUBLE PRECISION NOT NULL,
  "platform_revenue" DOUBLE PRECISION NOT NULL,
  "creator_share_snapshot" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_revenues_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_revenues_usage_id_fkey"
    FOREIGN KEY ("usage_id") REFERENCES "template_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_revenues_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_revenues_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_revenues_usage_id_key" ON "template_revenues"("usage_id");
CREATE INDEX IF NOT EXISTS "template_revenues_template_id_created_at_idx" ON "template_revenues"("template_id", "created_at");
CREATE INDEX IF NOT EXISTS "template_revenues_creator_id_created_at_idx" ON "template_revenues"("creator_id", "created_at");
