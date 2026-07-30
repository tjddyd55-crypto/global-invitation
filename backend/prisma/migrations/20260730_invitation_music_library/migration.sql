CREATE TYPE "InvitationMusicCategory" AS ENUM ('COMMON', 'WEDDING', 'FUNERAL', 'GENERAL');

CREATE TABLE "invitation_music_tracks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "artist_name" TEXT,
  "description" TEXT,
  "category" "InvitationMusicCategory" NOT NULL,
  "original_filename" TEXT NOT NULL,
  "object_key" TEXT NOT NULL,
  "public_url" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "duration_seconds" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "license_type" TEXT,
  "license_source" TEXT,
  "license_source_url" TEXT,
  "attribution_text" TEXT,
  "attribution_required" BOOLEAN NOT NULL DEFAULT false,
  "commercial_use_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "uploaded_by_admin_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "archived_at" TIMESTAMPTZ(6),

  CONSTRAINT "invitation_music_tracks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitation_music_tracks_object_key_key"
  ON "invitation_music_tracks"("object_key");

CREATE INDEX "invitation_music_tracks_category_is_active_is_archived_sort_order_idx"
  ON "invitation_music_tracks"("category", "is_active", "is_archived", "sort_order");

CREATE INDEX "invitation_music_tracks_is_active_is_archived_created_at_idx"
  ON "invitation_music_tracks"("is_active", "is_archived", "created_at");
