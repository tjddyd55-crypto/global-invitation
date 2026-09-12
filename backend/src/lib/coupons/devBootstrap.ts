import { InvitationCouponDiscountType, InvitationCouponStatus } from '@prisma/client';
import prisma from '../prisma';
import { resolveRuntimeAppEnvironment } from '../ops/systemConfig';

const DEV_COUPONS = [
  {
    code: 'JCI50',
    name: 'JCI 50% 할인',
    organization: 'JCI',
    discountType: InvitationCouponDiscountType.PERCENT,
    discountValue: 50,
    perUserUsageLimit: 1,
  },
] as const;

/** Development runtime only — ensures representative QA coupons exist. */
export async function ensureDevCouponsBootstrap(): Promise<void> {
  if (resolveRuntimeAppEnvironment() === 'production') return;

  for (const spec of DEV_COUPONS) {
    await prisma.invitationCoupon.upsert({
      where: { code: spec.code },
      update: {
        name: spec.name,
        organization: spec.organization,
        discountType: spec.discountType,
        discountValue: spec.discountValue,
        currency: 'USD',
        status: InvitationCouponStatus.ACTIVE,
        perUserUsageLimit: spec.perUserUsageLimit,
        updatedBy: 'dev-coupon-bootstrap',
      },
      create: {
        code: spec.code,
        name: spec.name,
        organization: spec.organization,
        discountType: spec.discountType,
        discountValue: spec.discountValue,
        currency: 'USD',
        status: InvitationCouponStatus.ACTIVE,
        perUserUsageLimit: spec.perUserUsageLimit,
        createdBy: 'dev-coupon-bootstrap',
        updatedBy: 'dev-coupon-bootstrap',
      },
    });
  }
}
