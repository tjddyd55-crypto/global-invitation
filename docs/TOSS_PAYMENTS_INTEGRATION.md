# Toss Payments Integration (Invitation Publish — Global-first USD)

Active product flow: **invitationId당 1회 결제 → PAID entitlement → publish**.

Canonical product currency: **USD**  
Primary payment channel: **INTERNATIONAL_USD** (Toss 외화결제 MID + overseas card)  
Optional channel: **DOMESTIC_KRW** — enabled explicitly in admin settings, never a silent fallback.

See also: [`PAYMENT_IMPLEMENTATION.md`](./PAYMENT_IMPLEMENTATION.md), [`DEVELOPMENT_WORKFLOW.md`](./DEVELOPMENT_WORKFLOW.md).

Official Toss reference: [해외결제 연동하기](https://docs.tosspayments.com/guides/v2/learn/foreign-payment)

---

## Architecture

```
Editor "Publish"
  → /invitations/:id/payment
  → POST /api/invitations/:id/payment/prepare
       productAmountMinor = 1000 (USD cents)
       amount = { currency: "USD", value: 10 }   // Toss major units
       paymentChannel = INTERNATIONAL_USD
  → Toss SDK v2 CARD + useInternationalCardOnly
  → success?paymentKey&orderId&amount
  → POST .../payment/confirm  (currency + amount verified)
  → InvitationPayment PAID
  → publish → /i/{shareSlug}
```

Frontend redirect alone never marks PAID.

---

## Policy

| Layer | Value |
|-------|-------|
| Product list | $30 USD |
| Product promo | $10 USD |
| Domain storage | USD cents (`chargedAmount` = 1000) |
| Toss charge | USD major units (`value` = 10) |
| FX | Server-only fixed admin rate for domestic KRW |
| Domestic KRW | opt-in, integer won |

One Toss MID = one currency. USD 외화결제 MID ≠ KRW 일반결제 MID.

---

## Env (names only)

### Frontend

| Name | Role |
|------|------|
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | Toss client key for USD foreign MID (`test_ck_…`) |
| `NEXT_PUBLIC_TOSS_PAYMENTS_VARIANT_KEY` | optional admin `variantKey` for 외화결제 |

### Backend

| Name | Role |
|------|------|
| `PAYMENT_PROVIDER` | `mock` (dev) or `toss_payments` |
| `TOSS_PAYMENTS_SECRET_KEY` | server secret for USD MID |
| `TOSS_PAYMENTS_CLIENT_KEY` | optional server mirror |
| `TOSS_PAYMENTS_VARIANT_KEY` | optional `variantKey` |
| `FRONTEND_URL` | success/fail base |

**Removed from canonical flow:** `TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW`, `TOSS_PAYMENTS_SETTLEMENT_AMOUNT=…`  
Legacy env values do not select a payment method or set a rate; prepare uses the explicit checkout method and admin settings.

Never commit secrets. Never put secrets in `NEXT_PUBLIC_*`.

---

## Production activation checklist (do not execute a live charge from this doc)

운영에서 `PAYMENT_PROVIDER` / Toss 가 없으면 prepare 는 **500이 아니라** `PAYMENT_PROVIDER_NOT_CONFIGURED` **HTTP 503** 이다.  
체크아웃은 견적(쿠폰 $10→$5 포함)을 보여주고 유료 CTA 를 막는다. $0 쿠폰은 provider 없이 settle-zero.

Toss 를 나중에 켜는 순서 (실제 청구 테스트는 운영 승인 후 별도):

1. Railway Production `PAYMENT_PROVIDER=toss_payments` (mock 금지).
2. Admin → 결제 관리 → Toss: **TEST** 키 저장 + 연결 확인 (청구 없음).
3. Toss 상점관리자에서 **외화결제 MID (USD)** 계약/키 확인.
4. Production 에서만 LIVE 키 활성화. Development 는 LIVE charge 차단.
5. 국내 결제는 Admin 시스템 설정에서 환율을 저장하고 활성화한다. 레거시 settlement 환경변수는 사용하지 않는다.
6. Frontend `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` (secret 금지) + 선택 `VARIANT_KEY`.
7. `/health.payment` 에서 `provider=toss_payments`, key configured=true 확인.
8. Development 에서 test MID 로 한 건 승인 후 Production LIVE 는 별도 승인.

이 문서는 live charge 를 실행하지 않는다. 시크릿을 커밋하지 않는다.

## Toss merchant checklist (operator)

Confirm in Toss 상점관리자 / 계약:

1. 해외결제 / 해외카드 계약
2. **외화결제 MID** with currency **USD**
3. Overseas card brands (Visa / Mastercard / JCB / AMEX / UnionPay per contract)
4. `variantKey` for that MID (if admin shows one)
5. Test client + secret keys
6. PayPal contract for USD `FOREIGN_EASY_PAY` checkout
7. Verify that configured merchant credentials support the selected KRW/USD checkout currency.

---

## Health

`/health.payment` (no secrets):

- `provider`
- `mode: INTERNATIONAL_USD`
- `currency: USD`
- key/variant configured booleans
- `domesticKrwEnabled`: actual admin toggle (boolean)

---

## Errors (no KRW fallback)

| Code | Meaning |
|------|---------|
| `PAYMENT_PROVIDER_NOT_CONFIGURED` | Production 에 provider/Toss 미설정. HTTP 503. |
| `PAYMENT_SERVICE_NOT_AVAILABLE` | stripe/mock-in-prod 등 사용 불가. HTTP 503. |
| `FOREIGN_MID_NOT_CONFIGURED` | USD MID keys missing / invalid |
| `DOMESTIC_KRW_DISABLED` | Domestic checkout requested while admin toggle is off |
| `DOMESTIC_KRW_RATE_NOT_CONFIGURED` | Missing / invalid fixed admin rate |
| `UNSUPPORTED_CURRENCY` | product/provider currency mapping failed |
| `AMOUNT_MISMATCH` / `CURRENCY_MISMATCH` | confirm rejected |

UI shows “Payment is not available yet” instead of charging KRW.

---

## Deferred

- Refund UI
- Production live keys

### 국내 / 해외 결제 선택

prepare는 `checkoutMethod`(기본 `OVERSEAS_CARD`)와 PayPal용 `country`(KR 제외)를 받는다.
`DOMESTIC`은 관리자 시스템 설정의 `domesticKrwEnabled`와 정수 `usdKrwRate`(100..10000)가 필요하다. 기본 활성화는 false이며 환율 기본값은 없다.
상품·쿠폰 SSOT는 USD cents를 유지하고 서버 prepare만 `round(chargedCents * rate / 100)`로 KRW를 확정한다. 결제 메타에 수단·국가·환율·Toss 금액/통화를 저장하고 승인 시 저장된 금액과 통화를 검증한다.
해외카드는 USD / CARD / 국제카드 전용 및 대문자 KO·EN을 사용하며 PayPal은 USD / FOREIGN_EASY_PAY / PAYPAL과 국가를 전달한다. Mock도 같은 준비 금액을 사용한다.
환경변수 부트스트랩: DB 값이 비어 있으면(null) `TOSS_DOMESTIC_KRW_ENABLED=true`, `TOSS_DOMESTIC_USD_KRW_RATE=<정수>`를 사용한다. 관리자 화면에서 저장한 값이 항상 우선한다. 코드에는 환율 기본값이 없다.
