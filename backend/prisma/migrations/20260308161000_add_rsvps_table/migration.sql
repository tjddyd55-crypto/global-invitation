CREATE TABLE IF NOT EXISTS "rsvps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invitation_id" UUID NOT NULL,
  "guest_name" TEXT NOT NULL,
  "attendance" TEXT NOT NULL,
  "guest_count" INTEGER NOT NULL DEFAULT 1,
  "meal_choice" TEXT,
  "message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rsvps_attendance_check" CHECK ("attendance" IN ('yes', 'no', 'maybe')),
  CONSTRAINT "rsvps_guest_count_check" CHECK ("guest_count" >= 1 AND "guest_count" <= 10),
  CONSTRAINT "rsvps_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "index_rsvps_invitation_id"
ON "rsvps"("invitation_id");
