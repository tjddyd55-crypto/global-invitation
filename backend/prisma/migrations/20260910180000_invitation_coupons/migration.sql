-- Invitation coupon system: catalog + authoritative usage + payment snapshots.

CREATE TYPE "InvitationCouponStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "InvitationCouponDiscountType" AS ENUM ('PERCENT', 'FIXED_AMOUNT');
CREATE TYPE "InvitationCouponUsageStatus" AS ENUM ('RESERVED', 'REDEEMED', 'RELEASED');

CREATE TABLE "invitation_coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "discount_type" "InvitationCouponDiscountType" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "InvitationCouponStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "total_usage_limit" INTEGER,
    "per_user_usage_limit" INTEGER,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitation_coupons_code_key" ON "invitation_coupons"("code");
CREATE INDEX "invitation_coupons_status_starts_at_ends_at_idx"
  ON "invitation_coupons"("status", "starts_at", "ends_at");
CREATE INDEX "invitation_coupons_organization_idx" ON "invitation_coupons"("organization");

CREATE TABLE "invitation_coupon_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "user_id" UUID,
    "invitation_id" UUID NOT NULL,
    "payment_id" UUID,
    "status" "InvitationCouponUsageStatus" NOT NULL DEFAULT 'RESERVED',
    "code_snapshot" TEXT NOT NULL,
    "discount_type" "InvitationCouponDiscountType" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "base_amount_cents" INTEGER NOT NULL,
    "discount_amount_cents" INTEGER NOT NULL,
    "final_amount_cents" INTEGER NOT NULL,
    "reserved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" TIMESTAMPTZ(6),
    "released_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_coupon_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invitation_coupon_usages_coupon_id_user_id_status_idx"
  ON "invitation_coupon_usages"("coupon_id", "user_id", "status");
CREATE INDEX "invitation_coupon_usages_coupon_id_status_idx"
  ON "invitation_coupon_usages"("coupon_id", "status");
CREATE INDEX "invitation_coupon_usages_payment_id_status_idx"
  ON "invitation_coupon_usages"("payment_id", "status");
CREATE INDEX "invitation_coupon_usages_invitation_id_status_idx"
  ON "invitation_coupon_usages"("invitation_id", "status");
CREATE INDEX "invitation_coupon_usages_expires_at_status_idx"
  ON "invitation_coupon_usages"("expires_at", "status");

ALTER TABLE "invitation_payments"
  ADD COLUMN "coupon_id" UUID,
  ADD COLUMN "coupon_code" TEXT,
  ADD COLUMN "coupon_discount_type" "InvitationCouponDiscountType",
  ADD COLUMN "coupon_discount_value" INTEGER,
  ADD COLUMN "base_amount_cents" INTEGER,
  ADD COLUMN "discount_amount_cents" INTEGER;

CREATE INDEX "invitation_payments_coupon_id_idx" ON "invitation_payments"("coupon_id");

ALTER TABLE "invitation_coupon_usages"
  ADD CONSTRAINT "invitation_coupon_usages_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "invitation_coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "invitation_coupon_usages_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "invitation_coupon_usages_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "invitation_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitation_payments"
  ADD CONSTRAINT "invitation_payments_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "invitation_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
