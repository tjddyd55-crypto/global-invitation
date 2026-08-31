-- Phase 1 Admin Ops Core: pricing, provider credentials, system runtime config

CREATE TABLE IF NOT EXISTS "invitation_pricing_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "list_price_minor" INTEGER NOT NULL,
    "sale_price_minor" INTEGER NOT NULL,
    "promo_enabled" BOOLEAN NOT NULL DEFAULT true,
    "promo_starts_at" TIMESTAMPTZ(6),
    "promo_ends_at" TIMESTAMPTZ(6),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pricing_configs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invitation_pricing_configs_enabled_updated_at_idx"
  ON "invitation_pricing_configs"("enabled", "updated_at");

CREATE TYPE "PaymentProviderEnvironment" AS ENUM ('TEST', 'LIVE');

CREATE TABLE IF NOT EXISTS "payment_provider_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL DEFAULT 'toss_payments',
    "environment" "PaymentProviderEnvironment" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "encrypted_client_key" TEXT,
    "encrypted_secret_key" TEXT,
    "encrypted_variant_key" TEXT,
    "client_key_fingerprint" TEXT,
    "secret_key_fingerprint" TEXT,
    "variant_key_fingerprint" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_provider_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_provider_configs_provider_environment_key"
  ON "payment_provider_configs"("provider", "environment");

CREATE TABLE IF NOT EXISTS "system_runtime_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "payments_enabled" BOOLEAN NOT NULL DEFAULT true,
    "publishing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "invitation_creation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "signups_enabled" BOOLEAN NOT NULL DEFAULT true,
    "support_email" TEXT,
    "active_payment_environment" TEXT NOT NULL DEFAULT 'TEST',
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_runtime_configs_pkey" PRIMARY KEY ("id")
);

-- Idempotent bootstrap: pricing + system defaults (no payment secret copy from env)
INSERT INTO "invitation_pricing_configs" (
  "currency", "list_price_minor", "sale_price_minor", "promo_enabled", "enabled", "updated_by"
)
SELECT 'USD', 3000, 1000, true, true, 'bootstrap'
WHERE NOT EXISTS (
  SELECT 1 FROM "invitation_pricing_configs" WHERE "enabled" = true
);

INSERT INTO "system_runtime_configs" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;
