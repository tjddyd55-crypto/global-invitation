import { InvitationCouponStatus, type InvitationCoupon } from '@prisma/client';
import { CouponError, COUPON_ERROR_CODES } from './errors';
import type { NormalizedCouponWrite } from './adminValidation';

const ECONOMIC_KEYS: Array<keyof NormalizedCouponWrite> = [
  'discountType',
  'discountValue',
  'currency',
  'totalUsageLimit',
  'perUserUsageLimit',
  'startsAt',
  'endsAt',
];

function sameOptionalDate(left: Date | null | undefined, right: Date | null): boolean {
  if (left === undefined) return true;
  if (left === null && right === null) return true;
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
}

export function economicFieldsChanged(
  existing: InvitationCoupon,
  next: NormalizedCouponWrite
): boolean {
  if (next.discountType !== undefined && next.discountType !== existing.discountType) return true;
  if (next.discountValue !== undefined && next.discountValue !== existing.discountValue) return true;
  if (next.currency !== undefined && next.currency !== existing.currency) return true;
  if (next.totalUsageLimit !== undefined && next.totalUsageLimit !== existing.totalUsageLimit) return true;
  if (next.perUserUsageLimit !== undefined && next.perUserUsageLimit !== existing.perUserUsageLimit) {
    return true;
  }
  if (next.startsAt !== undefined && !sameOptionalDate(next.startsAt, existing.startsAt)) return true;
  if (next.endsAt !== undefined && !sameOptionalDate(next.endsAt, existing.endsAt)) return true;
  return false;
}

export function assertActiveCouponEditAllowed(
  existing: InvitationCoupon,
  next: NormalizedCouponWrite,
  allowEconomicEdit: boolean
): void {
  if (existing.status !== InvitationCouponStatus.ACTIVE) return;
  if (!economicFieldsChanged(existing, next)) return;
  if (allowEconomicEdit) return;
  throw new CouponError(COUPON_ERROR_CODES.COUPON_ACTIVE_EDIT_REQUIRES_PAUSE);
}

export function assertCouponCodeRenameAllowed(
  existingCode: string,
  nextCode: string | undefined,
  usageCount: number
): void {
  if (!nextCode || nextCode === existingCode) return;
  if (usageCount > 0) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_CODE_LOCKED);
  }
}

export { ECONOMIC_KEYS };
