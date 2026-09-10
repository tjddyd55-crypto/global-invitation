import {
  InvitationCouponStatus,
  InvitationCouponUsageStatus,
  Prisma,
  type InvitationCoupon,
} from '@prisma/client';
import prisma from '../prisma';
import { CouponError, COUPON_ERROR_CODES } from './errors';
import {
  assertCreatePayload,
  normalizeAdminCouponWrite,
  type AdminCouponWriteInput,
} from './adminValidation';
import { countActiveCouponUsages, countAnyCouponUsages } from './counts';
import { resolveEffectiveCouponStatus } from './eligibility';
import { assertActiveCouponEditAllowed, assertCouponCodeRenameAllowed } from './adminGuards';

export type CouponListFilters = {
  q?: string;
  status?: InvitationCouponStatus;
  organization?: string;
};

export async function listCoupons(filters: CouponListFilters) {
  const where: Prisma.InvitationCouponWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.organization) {
    where.organization = { contains: filters.organization, mode: 'insensitive' };
  }
  if (filters.q) {
    where.OR = [
      { code: { contains: filters.q.trim().toUpperCase() } },
      { name: { contains: filters.q.trim(), mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.invitationCoupon.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return Promise.all(rows.map(serializeCouponWithCounts));
}

export async function getCouponById(id: string) {
  const coupon = await prisma.invitationCoupon.findUnique({ where: { id } });
  if (!coupon) throw new CouponError(COUPON_ERROR_CODES.COUPON_NOT_FOUND, 404);
  return serializeCouponWithCounts(coupon);
}

export async function createCoupon(input: AdminCouponWriteInput, actor: string) {
  const data = normalizeAdminCouponWrite(input);
  assertCreatePayload(data);
  try {
    const row = await prisma.invitationCoupon.create({
      data: {
        code: data.code!,
        name: data.name!,
        organization: data.organization ?? null,
        discountType: data.discountType!,
        discountValue: data.discountValue!,
        currency: data.currency ?? 'USD',
        status: data.status ?? InvitationCouponStatus.DRAFT,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        totalUsageLimit: data.totalUsageLimit ?? null,
        perUserUsageLimit: data.perUserUsageLimit ?? null,
        createdBy: actor,
        updatedBy: actor,
      },
    });
    return serializeCouponWithCounts(row);
  } catch (error) {
    throw mapUniqueCodeError(error);
  }
}

export async function updateCoupon(
  id: string,
  input: AdminCouponWriteInput & { allowEconomicEdit?: unknown },
  actor: string
) {
  const existing = await prisma.invitationCoupon.findUnique({ where: { id } });
  if (!existing) throw new CouponError(COUPON_ERROR_CODES.COUPON_NOT_FOUND, 404);
  const data = normalizeAdminCouponWrite(input);
  const usageCount = await countAnyCouponUsages(prisma, existing.id);
  assertCouponCodeRenameAllowed(existing.code, data.code, usageCount);
  assertActiveCouponEditAllowed(existing, data, input.allowEconomicEdit === true);
  try {
    const row = await prisma.invitationCoupon.update({
      where: { id },
      data: { ...data, updatedBy: actor },
    });
    return serializeCouponWithCounts(row);
  } catch (error) {
    throw mapUniqueCodeError(error);
  }
}

export async function transitionCouponStatus(
  id: string,
  next: InvitationCouponStatus,
  actor: string
) {
  const existing = await prisma.invitationCoupon.findUnique({ where: { id } });
  if (!existing) throw new CouponError(COUPON_ERROR_CODES.COUPON_NOT_FOUND, 404);
  assertStatusTransition(existing.status, next);
  const row = await prisma.invitationCoupon.update({
    where: { id },
    data: { status: next, updatedBy: actor },
  });
  return serializeCouponWithCounts(row);
}

export async function archiveCoupon(id: string, actor: string) {
  return transitionCouponStatus(id, InvitationCouponStatus.ARCHIVED, actor);
}

function assertStatusTransition(from: InvitationCouponStatus, to: InvitationCouponStatus): void {
  if (from === InvitationCouponStatus.ARCHIVED && to !== InvitationCouponStatus.ARCHIVED) {
    throw new CouponError(COUPON_ERROR_CODES.COUPON_STATUS_CONFLICT);
  }
  const allowed = new Set<InvitationCouponStatus>([
    InvitationCouponStatus.DRAFT,
    InvitationCouponStatus.ACTIVE,
    InvitationCouponStatus.PAUSED,
    InvitationCouponStatus.EXPIRED,
    InvitationCouponStatus.ARCHIVED,
  ]);
  if (!allowed.has(to)) throw new CouponError(COUPON_ERROR_CODES.COUPON_STATUS_CONFLICT);
}

export async function listCouponUsages(
  couponId: string,
  opts?: { cursor?: string; limit?: number }
) {
  await getCouponById(couponId);
  const take = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  const rows = await prisma.invitationCouponUsage.findMany({
    where: { couponId },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(opts?.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      userId: true,
      invitationId: true,
      paymentId: true,
      status: true,
      codeSnapshot: true,
      discountType: true,
      discountValue: true,
      baseAmountCents: true,
      discountAmountCents: true,
      finalAmountCents: true,
      reservedAt: true,
      redeemedAt: true,
      releasedAt: true,
      expiresAt: true,
    },
  });
  const hasMore = rows.length > take;
  const usages = hasMore ? rows.slice(0, take) : rows;
  return {
    usages,
    nextCursor: hasMore ? usages[usages.length - 1]?.id ?? null : null,
  };
}

async function serializeCouponWithCounts(coupon: InvitationCoupon) {
  const [activeUsageCount, totalUsageCount, reservedCount, redeemedCount, discountAgg] =
    await Promise.all([
      countActiveCouponUsages(prisma, coupon.id),
      countAnyCouponUsages(prisma, coupon.id),
      prisma.invitationCouponUsage.count({
        where: { couponId: coupon.id, status: InvitationCouponUsageStatus.RESERVED },
      }),
      prisma.invitationCouponUsage.count({
        where: { couponId: coupon.id, status: InvitationCouponUsageStatus.REDEEMED },
      }),
      prisma.invitationCouponUsage.aggregate({
        where: { couponId: coupon.id, status: InvitationCouponUsageStatus.REDEEMED },
        _sum: { discountAmountCents: true },
      }),
    ]);
  return {
    ...coupon,
    effectiveStatus: resolveEffectiveCouponStatus(coupon),
    reservedCount,
    redeemedCount,
    activeUsageCount,
    totalUsageCount,
    totalDiscountCents: discountAgg._sum.discountAmountCents ?? 0,
    canHardDelete: totalUsageCount === 0,
  };
}

function mapUniqueCodeError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new CouponError(COUPON_ERROR_CODES.COUPON_CODE_TAKEN);
  }
  return error;
}
