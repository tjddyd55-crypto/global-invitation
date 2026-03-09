DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OwnerType') THEN
    CREATE TYPE "OwnerType" AS ENUM ('GUEST', 'USER');
  END IF;
END $$;

ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "owner_type" "OwnerType",
  ADD COLUMN IF NOT EXISTS "owner_id" TEXT;

UPDATE "invitations"
SET "owner_type" = CASE
  WHEN "user_id" IS NOT NULL THEN 'USER'::"OwnerType"
  ELSE 'GUEST'::"OwnerType"
END
WHERE "owner_type" IS NULL;

UPDATE "invitations"
SET "owner_id" = CASE
  WHEN "user_id" IS NOT NULL THEN "user_id"::TEXT
  WHEN "guest_token" IS NOT NULL THEN "guest_token"
  ELSE "id"::TEXT
END
WHERE "owner_id" IS NULL OR BTRIM("owner_id") = '';

ALTER TABLE "invitations"
  ALTER COLUMN "owner_type" SET DEFAULT 'GUEST'::"OwnerType",
  ALTER COLUMN "owner_type" SET NOT NULL,
  ALTER COLUMN "owner_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_invitations_owner_id"
ON "invitations" ("owner_id");
