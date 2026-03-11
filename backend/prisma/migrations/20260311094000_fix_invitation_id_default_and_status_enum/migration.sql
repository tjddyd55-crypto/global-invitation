DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvitationStatus') THEN
    CREATE TYPE "InvitationStatus" AS ENUM ('DRAFT', 'SHARED', 'PUBLISHED');
  END IF;
END $$;

ALTER TABLE "invitations"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "invitations"
  ALTER COLUMN "status" TYPE "InvitationStatus"
  USING (
    CASE
      WHEN UPPER("status"::text) = 'PUBLISHED' THEN 'PUBLISHED'::"InvitationStatus"
      WHEN UPPER("status"::text) = 'SHARED' THEN 'SHARED'::"InvitationStatus"
      ELSE 'DRAFT'::"InvitationStatus"
    END
  );

ALTER TABLE "invitations"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"InvitationStatus";

ALTER TABLE "invitations"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
