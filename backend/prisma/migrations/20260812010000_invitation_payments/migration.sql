-- Additive payment persistence for invitation publish checkout.
CREATE TYPE "InvitationPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED');

CREATE TABLE "invitation_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invitation_id" UUID NOT NULL,
    "user_id" UUID,
    "provider" TEXT NOT NULL,
    "provider_checkout_id" TEXT,
    "provider_payment_id" TEXT,
    "provider_order_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "list_price_amount" INTEGER NOT NULL,
    "charged_amount" INTEGER NOT NULL,
    "promotion_code" TEXT,
    "status" "InvitationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "refunded_at" TIMESTAMPTZ(6),
    "raw_provider_status" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invitation_payments_invitation_id_status_idx" ON "invitation_payments"("invitation_id", "status");
CREATE INDEX "invitation_payments_invitation_id_created_at_idx" ON "invitation_payments"("invitation_id", "created_at");
CREATE UNIQUE INDEX "invitation_payments_provider_provider_checkout_id_key" ON "invitation_payments"("provider", "provider_checkout_id");
CREATE UNIQUE INDEX "invitation_payments_provider_provider_payment_id_key" ON "invitation_payments"("provider", "provider_payment_id");
CREATE UNIQUE INDEX "payment_webhook_events_provider_provider_event_id_key" ON "payment_webhook_events"("provider", "provider_event_id");

ALTER TABLE "invitation_payments" ADD CONSTRAINT "invitation_payments_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
