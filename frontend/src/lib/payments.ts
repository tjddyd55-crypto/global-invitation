'use client';

import { I18N_KEYS } from '@/src/i18n';
import { getSessionToken } from '@/src/lib/auth';

export type PaymentProduct = 'invitation' | 'simple_message';

type PaymentAccessParams = {
  product: PaymentProduct;
  isPaid?: boolean;
  canShare?: boolean;
};

const PRODUCT_PRICE_MAP: Record<PaymentProduct, number> = {
  invitation: 20,
  simple_message: 10,
};

export function canAccessPaidAction({ isPaid, canShare }: PaymentAccessParams): boolean {
  // TODO [LemonSqueezy]: 실제 결제 여부 판단 로직으로 대체
  // - 결제 상태 확인 API 연동
  // - 주문 상태 기반 isPaid/canShare 업데이트
  return Boolean(isPaid || canShare);
}

export function notifyPaymentPreparing(t: (key: string) => string) {
  alert(t(I18N_KEYS.notice.paymentPreparing));
}

export function notifyPaymentRequired(t: (key: string) => string) {
  alert(t(I18N_KEYS.notice.paymentRequired));
}

export function startCheckout(product: PaymentProduct, t: (key: string) => string) {
  // TODO [LemonSqueezy]: Checkout URL 연결 위치
  // - Simple Message: $10 one-time
  // - Invitation: $20 one-time
  // - env 예시: NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_SIMPLE, _INVITATION
  // TODO [LemonSqueezy]: Webhook endpoint 설계
  // - POST /api/webhooks/lemonsqueezy
  // - 서명 검증 → 주문/상품 매핑 → isPaid/canShare 갱신
  void PRODUCT_PRICE_MAP[product];
  if (!getSessionToken()) {
    alert('결제를 진행하려면 로그인이 필요합니다.');
    return;
  }
  notifyPaymentPreparing(t);
}
