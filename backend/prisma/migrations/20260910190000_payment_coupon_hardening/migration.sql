-- One PAID entitlement per invitation. Legacy null-coupon payments remain valid.
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_payments_one_paid_per_invitation"
  ON "invitation_payments" ("invitation_id")
  WHERE "status" = 'PAID';

-- One consuming reservation per payment (RESERVED or REDEEMED).
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_coupon_usages_one_active_per_payment"
  ON "invitation_coupon_usages" ("payment_id")
  WHERE "payment_id" IS NOT NULL AND "status" IN ('RESERVED', 'REDEEMED');
