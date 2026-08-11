/**
 * Invitation publish pricing SSOT (Backend authority).
 * Frontend `src/shared/pricing/invitationPricing.ts` 와 값을 동일하게 유지한다.
 */
export const INVITATION_PRICING = {
  currency: 'USD',
  listPriceCents: 3000,
  salePriceCents: 1000,
  promotionKey: 'OPENING',
} as const;

export type InvitationPricingSnapshot = {
  currency: string;
  listPriceCents: number;
  chargedAmountCents: number;
  promotionCode: string;
};

export function getInvitationPricingSnapshot(): InvitationPricingSnapshot {
  return {
    currency: INVITATION_PRICING.currency,
    listPriceCents: INVITATION_PRICING.listPriceCents,
    chargedAmountCents: INVITATION_PRICING.salePriceCents,
    promotionCode: INVITATION_PRICING.promotionKey,
  };
}
