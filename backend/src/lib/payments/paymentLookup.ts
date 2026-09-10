import { InvitationPaymentStatus, type InvitationPayment } from '@prisma/client';
import prisma from '../prisma';

export async function findPaidPayment(invitationId: string): Promise<InvitationPayment | null> {
  return prisma.invitationPayment.findFirst({
    where: {
      invitationId,
      status: InvitationPaymentStatus.PAID,
    },
    orderBy: { paidAt: 'desc' },
  });
}

export function parseProviderMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function getExpectedProviderAmount(payment: InvitationPayment): number | null {
  const meta = parseProviderMeta(payment.rawProviderStatus);
  if (typeof meta.tossAmount === 'number') return meta.tossAmount;
  if (payment.provider === 'mock' || payment.provider === 'coupon') return payment.chargedAmount;
  return null;
}

export function getExpectedProviderCurrency(payment: InvitationPayment): string {
  const meta = parseProviderMeta(payment.rawProviderStatus);
  if (typeof meta.tossCurrency === 'string') return meta.tossCurrency.toUpperCase();
  return payment.currency.toUpperCase();
}
