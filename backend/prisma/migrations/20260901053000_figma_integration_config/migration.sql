-- Phase 3: Figma REST API integration config (encrypted token)

CREATE TABLE IF NOT EXISTS "figma_integration_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "encrypted_access_token" TEXT,
    "token_fingerprint" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "figma_integration_configs_pkey" PRIMARY KEY ("id")
);
