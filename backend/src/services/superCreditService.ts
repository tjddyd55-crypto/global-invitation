import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { logAdminAction } from '../admin/adminAuditLog';

const MAX_PAGE = 500;

export async function listCreditPolicies() {
  return prisma.creditPolicy.findMany({ orderBy: { key: 'asc' } });
}

export async function updateCreditPolicy(
  key: string,
  data: { cost?: number; active?: boolean },
  adminId: string
) {
  const row = await prisma.creditPolicy.update({
    where: { key },
    data: {
      ...(typeof data.cost === 'number' ? { cost: Math.trunc(data.cost) } : {}),
      ...(typeof data.active === 'boolean' ? { active: data.active } : {}),
    },
  });
  await logAdminAction({
    adminId,
    action: 'credit_policy_update',
    targetType: 'credit_policy',
    targetId: key,
    payload: data as Prisma.InputJsonValue,
  });
  return row;
}

export async function listCreditPackages() {
  return prisma.creditPackage.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function createCreditPackage(
  body: { name: string; credits: number; priceCents?: number; sortOrder?: number; active?: boolean },
  adminId: string
) {
  const row = await prisma.creditPackage.create({
    data: {
      name: body.name.trim(),
      credits: Math.trunc(body.credits),
      priceCents: Math.trunc(body.priceCents ?? 0),
      sortOrder: Math.trunc(body.sortOrder ?? 0),
      active: body.active !== false,
    },
  });
  await logAdminAction({
    adminId,
    action: 'credit_package_create',
    targetType: 'credit_package',
    targetId: row.id,
    payload: body as unknown as Prisma.InputJsonValue,
  });
  return row;
}

export async function updateCreditPackage(
  id: string,
  body: { name?: string; credits?: number; priceCents?: number; sortOrder?: number; active?: boolean },
  adminId: string
) {
  const row = await prisma.creditPackage.update({
    where: { id },
    data: {
      ...(body.name != null ? { name: body.name.trim() } : {}),
      ...(typeof body.credits === 'number' ? { credits: Math.trunc(body.credits) } : {}),
      ...(typeof body.priceCents === 'number' ? { priceCents: Math.trunc(body.priceCents) } : {}),
      ...(typeof body.sortOrder === 'number' ? { sortOrder: Math.trunc(body.sortOrder) } : {}),
      ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
    },
  });
  await logAdminAction({
    adminId,
    action: 'credit_package_update',
    targetType: 'credit_package',
    targetId: id,
    payload: body as unknown as Prisma.InputJsonValue,
  });
  return row;
}

export async function searchUsersWithBalance(q: string | undefined, take: number) {
  const limit = Math.min(Math.max(take, 1), MAX_PAGE);
  const where: Prisma.UserWhereInput = {};
  if (q && q.trim()) {
    where.email = { contains: q.trim(), mode: 'insensitive' };
  }
  const users = await prisma.user.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      creditWallet: { select: { balance: true } },
    },
  });
  return users.map((u) => ({
    userId: u.id,
    email: u.email ?? '',
    balance: u.creditWallet?.balance ?? 0,
  }));
}

export async function adjustUserCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  type: string;
  adminId: string;
  skipAdminAuditLog?: boolean;
}) {
  const { userId, amount, reason, type, adminId, skipAdminAuditLog } = params;
  const delta = Math.trunc(amount);
  if (delta === 0) {
    throw new Error('AMOUNT_ZERO');
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const wallet = await tx.userCreditWallet.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });

    const before = wallet.balance;
    const after = before + delta;
    if (after < 0) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    await tx.userCreditWallet.update({
      where: { userId },
      data: { balance: after },
    });

    const txn = await tx.creditTransaction.create({
      data: {
        userId,
        amount: delta,
        type,
        reason: reason.trim() || null,
        beforeBalance: before,
        afterBalance: after,
      },
    });

    return { txn, before, after };
  });

  if (!skipAdminAuditLog) {
    await logAdminAction({
      adminId,
      action: 'credit_adjust',
      targetType: 'user',
      targetId: userId,
      payload: {
        amount: delta,
        reason: reason.trim(),
        type,
        beforeBalance: result.before,
        afterBalance: result.after,
      },
    });
  }

  return result.txn;
}

export async function listCreditTransactions(limit: number) {
  const take = Math.min(Math.max(limit, 1), MAX_PAGE);
  return prisma.creditTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function listAdminAuditLogs(limit: number) {
  const take = Math.min(Math.max(limit, 1), MAX_PAGE);
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function bulkGrantCredits(params: {
  country?: string | null;
  registeredAfter?: Date | null;
  registeredBefore?: Date | null;
  amount: number;
  reason: string;
  adminId: string;
}) {
  const grant = Math.trunc(params.amount);
  if (grant <= 0) {
    throw new Error('AMOUNT_INVALID');
  }

  const where: Prisma.UserWhereInput = {};
  if (params.country && params.country.trim()) {
    where.countryCode = params.country.trim();
  }
  if (params.registeredAfter || params.registeredBefore) {
    where.createdAt = {};
    if (params.registeredAfter) {
      where.createdAt.gte = params.registeredAfter;
    }
    if (params.registeredBefore) {
      where.createdAt.lte = params.registeredBefore;
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
    take: MAX_PAGE,
  });

  let affected = 0;
  for (const u of users) {
    await adjustUserCredits({
      userId: u.id,
      amount: grant,
      reason: params.reason.trim() || 'bulk_grant',
      type: 'BULK_GRANT',
      adminId: params.adminId,
      skipAdminAuditLog: true,
    });
    affected += 1;
  }

  await logAdminAction({
    adminId: params.adminId,
    action: 'credit_bulk_grant',
    targetType: 'bulk',
    targetId: null,
    payload: {
      affected,
      amount: grant,
      reason: params.reason.trim(),
      filters: {
        country: params.country ?? null,
        registeredAfter: params.registeredAfter?.toISOString() ?? null,
        registeredBefore: params.registeredBefore?.toISOString() ?? null,
      },
    },
  });

  return { affected };
}
