# Lemon Squeezy 승인 대기 체크리스트

## 승인 후 즉시 할 작업
- Lemon Squeezy 상품 2종 생성: Simple Message ($10), Invitation ($20)
- Checkout URL 연결 위치: `frontend/src/lib/payments.ts`의 `startCheckout()`
- Webhook 엔드포인트 구현: `/api/webhooks/lemonsqueezy`
- 결제 상태 반영 로직 연결: `frontend/src/lib/payments.ts`의 `canAccessPaidAction()`

## TODO 위치 (파일/라인)
- `frontend/src/lib/payments.ts`
  - `canAccessPaidAction()` TODO: L18-L22
  - `startCheckout()` TODO: L33-L40

## 승인 대기 중 변경 금지 원칙
- Lemon Squeezy 설정 재수정 금지
- 가격/상품 구조 변경 금지
- 결제 관련 코드 추가 금지
