CREATE TABLE IF NOT EXISTS "media_files" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "url" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "media_files_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "media_files_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "index_media_owner_id"
ON "media_files"("owner_id");
