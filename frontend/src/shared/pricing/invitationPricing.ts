/**
 * Invitation publish pricing SSOT (Frontend).
 * Backend `src/lib/pricing/invitationPricing.ts` 와 값을 동일하게 유지한다.
 * 결제 금액 authority 는 Backend. Frontend 는 표시용.
 */
export const INVITATION_PRICING = {
  currency: 'USD',
  listPriceCents: 3000,
  salePriceCents: 1000,
  promotionKey: 'OPENING',
  billingUnit: 'invitation' as const,
} as const;

export type InvitationPricing = typeof INVITATION_PRICING;

export function formatUsdFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function getInvitationDiscountCents(): number {
  return INVITATION_PRICING.listPriceCents - INVITATION_PRICING.salePriceCents;
}
