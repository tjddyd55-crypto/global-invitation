import {
  InvitationCouponDiscountType,
  InvitationCouponStatus,
} from '@prisma/client';
import { CouponError, COUPON_ERROR_CODES } from './errors';
import { parseCouponCode } from './codes';

export type AdminCouponWriteInput = {
  code?: unknown;
  name?: unknown;
  organization?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  currency?: unknown;
  status?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  totalUsageLimit?: unknown;
  perUserUsageLimit?: unknown;
};

export type NormalizedCouponWrite = {
  code?: string;
  name?: string;
  organization?: string | null;
  discountType?: InvitationCouponDiscountType;
  discountValue?: number;
  currency?: string;
  status?: InvitationCouponStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  totalUsageLimit?: number | null;
  perUserUsageLimit?: number | null;
};

function optionalText(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  return value.trim();
}

function optionalLimit(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  }
  return parsed;
}

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_WINDOW);
  }
  return date;
}

export function normalizeAdminCouponWrite(input: AdminCouponWriteInput): NormalizedCouponWrite {
  const out: NormalizedCouponWrite = {};

  if (input.code !== undefined) {
    const code = parseCouponCode(input.code);
    if (!code) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
    out.code = code;
  }

  if (input.name !== undefined) {
    const name = optionalText(input.name);
    if (!name) throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
    out.name = name;
  }

  if (input.organization !== undefined) {
    const org = optionalText(input.organization);
    out.organization = org || null;
  }

  normalizeDiscountFields(input, out);
  normalizeStatusAndWindow(input, out);

  if (input.currency !== undefined) {
    const currency = optionalText(input.currency)?.toUpperCase() || 'USD';
    if (currency !== 'USD') throw new CouponError(COUPON_ERROR_CODES.COUPON_CURRENCY_MISMATCH);
    out.currency = currency;
  }

  if (input.totalUsageLimit !== undefined) out.totalUsageLimit = optionalLimit(input.totalUsageLimit);
  if (input.perUserUsageLimit !== undefined) {
    out.perUserUsageLimit = optionalLimit(input.perUserUsageLimit);
  }

  return out;
}

function normalizeDiscountFields(input: AdminCouponWriteInput, out: NormalizedCouponWrite): void {
  if (input.discountType !== undefined) {
    const type = String(input.discountType).toUpperCase();
    if (type !== 'PERCENT' && type !== 'FIXED_AMOUNT') {
      throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_DISCOUNT);
    }
    out.discountType = type as InvitationCouponDiscountType;
  }

  if (input.discountValue !== undefined) {
    const value = Number(input.discountValue);
    if (!Number.isInteger(value) || value < 1) {
      throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_DISCOUNT);
    }
    out.discountValue = value;
  }

  const type = out.discountType;
  const value = out.discountValue;
  if (type === InvitationCouponDiscountType.PERCENT && value != null && (value < 1 || value > 100)) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_DISCOUNT);
  }
  if (type === InvitationCouponDiscountType.FIXED_AMOUNT && value != null && value % 100 !== 0) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_DISCOUNT);
  }
}

function normalizeStatusAndWindow(input: AdminCouponWriteInput, out: NormalizedCouponWrite): void {
  if (input.status !== undefined) {
    const status = String(input.status).toUpperCase();
    if (!Object.values(InvitationCouponStatus).includes(status as InvitationCouponStatus)) {
      throw new CouponError(COUPON_ERROR_CODES.COUPON_STATUS_CONFLICT);
    }
    out.status = status as InvitationCouponStatus;
  }

  if (input.startsAt !== undefined) out.startsAt = optionalDate(input.startsAt);
  if (input.endsAt !== undefined) out.endsAt = optionalDate(input.endsAt);
  if (out.startsAt && out.endsAt && out.startsAt.getTime() > out.endsAt.getTime()) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID_WINDOW);
  }
}

export function assertCreatePayload(data: NormalizedCouponWrite): void {
  if (!data.code || !data.name || !data.discountType || data.discountValue == null) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_INVALID);
  }
}
