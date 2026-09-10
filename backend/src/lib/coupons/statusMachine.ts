import { InvitationCouponStatus, type InvitationCoupon } from '@prisma/client';
import { CouponError, COUPON_ERROR_CODES } from './errors';

const TRANSITION_KEYS: ReadonlySet<string> = new Set([
  `${InvitationCouponStatus.ACTIVE}->${InvitationCouponStatus.PAUSED}`,
  `${InvitationCouponStatus.PAUSED}->${InvitationCouponStatus.ACTIVE}`,
  `${InvitationCouponStatus.ACTIVE}->${InvitationCouponStatus.ARCHIVED}`,
  `${InvitationCouponStatus.PAUSED}->${InvitationCouponStatus.ARCHIVED}`,
  `${InvitationCouponStatus.ARCHIVED}->${InvitationCouponStatus.ACTIVE}`,
  `${InvitationCouponStatus.DRAFT}->${InvitationCouponStatus.ACTIVE}`,
  `${InvitationCouponStatus.DRAFT}->${InvitationCouponStatus.PAUSED}`,
  `${InvitationCouponStatus.DRAFT}->${InvitationCouponStatus.ARCHIVED}`,
  `${InvitationCouponStatus.EXPIRED}->${InvitationCouponStatus.ACTIVE}`,
  `${InvitationCouponStatus.EXPIRED}->${InvitationCouponStatus.ARCHIVED}`,
]);

export function assertCouponStatusTransition(
  from: InvitationCouponStatus,
  to: InvitationCouponStatus
): void {
  if (from === to) {
    return;
  }

  const key = `${from}->${to}`;
  if (TRANSITION_KEYS.has(key)) {
    return;
  }

  if (from === InvitationCouponStatus.ARCHIVED && to === InvitationCouponStatus.PAUSED) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_STATUS_TRANSITION);
  }

  throw new CouponError(COUPON_ERROR_CODES.COUPON_STATUS_CONFLICT);
}

export function assertCouponActivationAllowed(
  coupon: Pick<InvitationCoupon, 'endsAt'>,
  now: Date = new Date()
): void {
  if (coupon.endsAt && coupon.endsAt.getTime() < now.getTime()) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_EXPIRED);
  }
}
