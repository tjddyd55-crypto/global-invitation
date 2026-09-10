import {
  InvitationCouponStatus,
  InvitationCouponUsageStatus,
  type InvitationCoupon,
} from '@prisma/client';
import { CouponError, COUPON_ERROR_CODES } from './errors';

const ACTIVE_USAGE_STATUSES: InvitationCouponUsageStatus[] = [
  InvitationCouponUsageStatus.RESERVED,
  InvitationCouponUsageStatus.REDEEMED,
];

export { ACTIVE_USAGE_STATUSES };

export type CouponCounts = {
  totalActive: number;
  userActive: number;
};

export function resolveEffectiveCouponStatus(
  coupon: Pick<InvitationCoupon, 'status' | 'startsAt' | 'endsAt'>,
  now: Date = new Date()
): InvitationCouponStatus {
  if (
    coupon.status === InvitationCouponStatus.ARCHIVED ||
    coupon.status === InvitationCouponStatus.DRAFT ||
    coupon.status === InvitationCouponStatus.PAUSED ||
    coupon.status === InvitationCouponStatus.EXPIRED
  ) {
    return coupon.status;
  }
  if (coupon.endsAt && coupon.endsAt.getTime() < now.getTime()) {
    return InvitationCouponStatus.EXPIRED;
  }
  return coupon.status;
}

export function assertCouponWindow(
  coupon: Pick<InvitationCoupon, 'status' | 'startsAt' | 'endsAt'>,
  now: Date = new Date()
): void {
  const effective = resolveEffectiveCouponStatus(coupon, now);
  if (effective === InvitationCouponStatus.DRAFT || effective === InvitationCouponStatus.PAUSED) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INACTIVE);
  }
  if (effective === InvitationCouponStatus.ARCHIVED) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INACTIVE);
  }
  if (effective === InvitationCouponStatus.EXPIRED) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_EXPIRED);
  }
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_NOT_STARTED);
  }
}

export function assertCouponLimits(
  coupon: Pick<InvitationCoupon, 'totalUsageLimit' | 'perUserUsageLimit'>,
  counts: CouponCounts
): void {
  if (coupon.totalUsageLimit != null && counts.totalActive >= coupon.totalUsageLimit) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_LIMIT_REACHED);
  }
  if (coupon.perUserUsageLimit != null && counts.userActive >= coupon.perUserUsageLimit) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_USER_LIMIT_REACHED);
  }
}

export function assertCouponCurrency(couponCurrency: string, pricingCurrency: string): void {
  if (couponCurrency.toUpperCase() !== pricingCurrency.toUpperCase()) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_CURRENCY_MISMATCH);
  }
}
