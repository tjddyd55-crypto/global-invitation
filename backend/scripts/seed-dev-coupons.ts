/**
 * Dev-only coupon seed. Never run against Production.
 * Representative: JCI50. Optional QA helper: DEVFREE100.
 */
import 'dotenv/config';
import { InvitationCouponDiscountType, InvitationCouponStatus } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { resolveRuntimeAppEnvironment } from '../src/lib/ops/systemConfig';

const DEV_COUPONS = [
  {
    code: 'JCI50',
    name: 'JCI 50% 할인',
    organization: 'JCI',
    discountType: InvitationCouponDiscountType.PERCENT,
    discountValue: 50,
    perUserUsageLimit: 1,
  },
  {
    code: 'DEVFREE100',
    name: 'Dev QA 100% (개발 전용)',
    organization: 'DEV',
    discountType: InvitationCouponDiscountType.PERCENT,
    discountValue: 100,
    perUserUsageLimit: 1,
  },
] as const;

async function main(): Promise<void> {
  const runtime = resolveRuntimeAppEnvironment();
  if (runtime === 'production') {
    throw new Error('Refusing to seed coupons in production');
  }

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
        updatedBy: 'seed-dev-coupons',
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
        createdBy: 'seed-dev-coupons',
        updatedBy: 'seed-dev-coupons',
      },
    });
    console.info(`[seed-dev-coupons] upserted ${spec.code}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
