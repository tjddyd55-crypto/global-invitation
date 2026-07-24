-- Email OTP for creator auth (passwordless login / auto signup)
CREATE TABLE IF NOT EXISTS "email_verification_codes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "email_verification_codes_email_purpose_created_at_idx"
  ON "email_verification_codes" ("email", "purpose", "created_at");

CREATE INDEX IF NOT EXISTS "email_verification_codes_email_purpose_consumed_at_idx"
  ON "email_verification_codes" ("email", "purpose", "consumed_at");
