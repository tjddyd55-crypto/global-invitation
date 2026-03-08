ALTER TABLE "invitations"
ADD COLUMN IF NOT EXISTS "rsvp_deadline" TIMESTAMPTZ(6);

DELETE FROM "rsvps"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "invitation_id", "guest_name"
        ORDER BY "created_at" DESC, "id" DESC
      ) AS row_num
    FROM "rsvps"
  ) ranked
  WHERE ranked.row_num > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rsvps_invitation_id_guest_name_key'
  ) THEN
    ALTER TABLE "rsvps"
    ADD CONSTRAINT "rsvps_invitation_id_guest_name_key"
    UNIQUE ("invitation_id", "guest_name");
  END IF;
END $$;
