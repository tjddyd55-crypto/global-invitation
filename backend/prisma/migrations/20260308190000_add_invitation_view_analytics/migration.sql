CREATE TABLE IF NOT EXISTS "invitation_views" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invitation_id" UUID NOT NULL,
  "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "viewer_ip" TEXT,
  "user_agent" TEXT,
  "referrer" TEXT,
  "device_type" TEXT,
  "country_code" TEXT,
  "session_id" TEXT,

  CONSTRAINT "invitation_views_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitation_views_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "index_invitation_views_invitation_id"
ON "invitation_views"("invitation_id");

CREATE INDEX IF NOT EXISTS "index_invitation_views_viewed_at"
ON "invitation_views"("viewed_at");

CREATE INDEX IF NOT EXISTS "index_invitation_views_invitation_id_viewed_at"
ON "invitation_views"("invitation_id", "viewed_at");
