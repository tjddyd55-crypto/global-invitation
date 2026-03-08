-- Admin audit log table
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_admin_id_created_at_idx"
  ON "admin_audit_logs"("admin_id", "created_at");

CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_created_at_idx"
  ON "admin_audit_logs"("action", "created_at");
