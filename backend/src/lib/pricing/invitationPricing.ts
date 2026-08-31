/**
 * Invitation publish pricing — Backend authority.
 * Runtime: Admin DB active config → code default ($30 / $10 USD).
 * Frontend display must follow public-config / prepare responses (not local hardcode alone).
 */
import prisma from '../prisma';

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
  pricingConfigId?: string | null;
  source: 'db' | 'code_default';
};

let pricingCache: { at: number; value: InvitationPricingSnapshot } | null = null;
const PRICING_CACHE_MS = 5_000;

export function invalidatePricingCache(): void {
  pricingCache = null;
}

function codeDefaultSnapshot(): InvitationPricingSnapshot {
  return {
    currency: INVITATION_PRICING.currency,
    listPriceCents: INVITATION_PRICING.listPriceCents,
    chargedAmountCents: INVITATION_PRICING.salePriceCents,
    promotionCode: INVITATION_PRICING.promotionKey,
    pricingConfigId: null,
    source: 'code_default',
  };
}

function isPromoActive(row: {
  promoEnabled: boolean;
  promoStartsAt: Date | null;
  promoEndsAt: Date | null;
}): boolean {
  if (!row.promoEnabled) return false;
  const now = Date.now();
  if (row.promoStartsAt && row.promoStartsAt.getTime() > now) return false;
  if (row.promoEndsAt && row.promoEndsAt.getTime() < now) return false;
  return true;
}

export async function getInvitationPricingSnapshot(): Promise<InvitationPricingSnapshot> {
  if (pricingCache && Date.now() - pricingCache.at < PRICING_CACHE_MS) {
    return pricingCache.value;
  }

  try {
    const row = await prisma.invitationPricingConfig.findFirst({
      where: { enabled: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!row || row.currency.toUpperCase() !== 'USD') {
      const fallback = codeDefaultSnapshot();
      pricingCache = { at: Date.now(), value: fallback };
      return fallback;
    }

    const useSale = isPromoActive(row);
    const charged = useSale ? row.salePriceMinor : row.listPriceMinor;
    const snapshot: InvitationPricingSnapshot = {
      currency: 'USD',
      listPriceCents: row.listPriceMinor,
      chargedAmountCents: charged,
      promotionCode: useSale ? INVITATION_PRICING.promotionKey : '',
      pricingConfigId: row.id,
      source: 'db',
    };
    pricingCache = { at: Date.now(), value: snapshot };
    return snapshot;
  } catch {
    const fallback = codeDefaultSnapshot();
    pricingCache = { at: Date.now(), value: fallback };
    return fallback;
  }
}

/** Sync code default only — tests / non-DB contexts. Prefer async snapshot at runtime. */
export function getCodeDefaultPricingSnapshot(): InvitationPricingSnapshot {
  return codeDefaultSnapshot();
}

export async function ensurePricingBootstrap(): Promise<void> {
  const existing = await prisma.invitationPricingConfig.findFirst({
    where: { enabled: true },
  });
  if (existing) return;
  await prisma.invitationPricingConfig.create({
    data: {
      currency: 'USD',
      listPriceMinor: INVITATION_PRICING.listPriceCents,
      salePriceMinor: INVITATION_PRICING.salePriceCents,
      promoEnabled: true,
      enabled: true,
      updatedBy: 'bootstrap',
    },
  });
  invalidatePricingCache();
}
