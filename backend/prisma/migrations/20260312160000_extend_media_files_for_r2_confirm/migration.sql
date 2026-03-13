ALTER TABLE "media_files"
  ADD COLUMN IF NOT EXISTS "owner_type" TEXT,
  ADD COLUMN IF NOT EXISTS "owner_ref_id" TEXT,
  ADD COLUMN IF NOT EXISTS "usage" TEXT,
  ADD COLUMN IF NOT EXISTS "object_key" TEXT,
  ADD COLUMN IF NOT EXISTS "public_url" TEXT,
  ADD COLUMN IF NOT EXISTS "width" INTEGER,
  ADD COLUMN IF NOT EXISTS "height" INTEGER,
  ADD COLUMN IF NOT EXISTS "created_by" UUID,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'media_files_created_by_fkey'
  ) THEN
    ALTER TABLE "media_files"
      ADD CONSTRAINT "media_files_created_by_fkey"
      FOREIGN KEY ("created_by")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "media_files_object_key_key"
ON "media_files"("object_key");

CREATE INDEX IF NOT EXISTS "index_media_owner_type_owner_ref_id"
ON "media_files"("owner_type", "owner_ref_id");

CREATE INDEX IF NOT EXISTS "index_media_usage_created_at"
ON "media_files"("usage", "created_at");
