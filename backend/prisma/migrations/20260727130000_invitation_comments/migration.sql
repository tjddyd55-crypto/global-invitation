-- CreateTable
CREATE TABLE IF NOT EXISTS "invitation_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invitation_id" UUID NOT NULL,
    "author_name" VARCHAR(30) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invitation_comments_invitation_id_created_at_idx" ON "invitation_comments"("invitation_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invitation_comments_invitation_id_is_visible_deleted_at_idx" ON "invitation_comments"("invitation_id", "is_visible", "deleted_at");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "invitation_comments" ADD CONSTRAINT "invitation_comments_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
