-- Invitation soft delete + deferred R2 cleanup queue
ALTER TABLE "invitations" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "invitations_is_deleted_idx" ON "invitations"("is_deleted");

CREATE TABLE "cleanup_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleanup_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cleanup_jobs_status_scheduled_at_idx" ON "cleanup_jobs"("status", "scheduled_at");
