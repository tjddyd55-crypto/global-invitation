export type CouponDraft = {
  code: string;
  name: string;
  organization: string;
  discountType: 'PERCENT' | 'FIXED_AMOUNT';
  discountValue: string;
  startsAt: string;
  endsAt: string;
  totalUsageLimit: string;
  perUserUsageLimit: string;
};

export const EMPTY_COUPON_DRAFT: CouponDraft = {
  code: '',
  name: '',
  organization: '',
  discountType: 'PERCENT',
  discountValue: '50',
  startsAt: '',
  endsAt: '',
  totalUsageLimit: '',
  perUserUsageLimit: '1',
};

function optionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function buildCouponPayload(draft: CouponDraft):
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; message: string } {
  const discountValue = Number(draft.discountValue);
  if (!Number.isInteger(discountValue) || discountValue < 1) {
    return { ok: false, message: '할인 값을 확인해 주세요.' };
  }
  if (draft.discountType === 'PERCENT' && (discountValue < 1 || discountValue > 100)) {
    return { ok: false, message: '정률 할인은 1–100 사이여야 합니다.' };
  }
  if (draft.discountType === 'FIXED_AMOUNT' && discountValue % 100 !== 0) {
    return { ok: false, message: '정액 할인은 달러 단위(센트 100의 배수)여야 합니다.' };
  }

  const totalUsageLimit = optionalInt(draft.totalUsageLimit);
  const perUserUsageLimit = optionalInt(draft.perUserUsageLimit);
  if (Number.isNaN(totalUsageLimit) || Number.isNaN(perUserUsageLimit)) {
    return { ok: false, message: '사용 한도는 비우거나 1 이상 정수여야 합니다.' };
  }

  return {
    ok: true,
    payload: {
      code: draft.code,
      name: draft.name,
      organization: draft.organization || null,
      discountType: draft.discountType,
      discountValue,
      currency: 'USD',
      startsAt: draft.startsAt || null,
      endsAt: draft.endsAt || null,
      totalUsageLimit,
      perUserUsageLimit,
    },
  };
}
