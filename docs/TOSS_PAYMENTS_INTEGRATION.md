# Toss Payments Integration (Invitation Publish — Global-first USD)

Active product flow: **invitationId당 1회 결제 → PAID entitlement → publish**.

Canonical product currency: **USD**  
Primary payment channel: **INTERNATIONAL_USD** (Toss 외화결제 MID + overseas card)  
Secondary (future): **DOMESTIC_KRW** (separate KRW MID) — **not enabled**, never silent-fallback.

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
| FX | **none** |
| Domestic KRW | disabled secondary channel |

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
If those env are set, prepare returns `DOMESTIC_KRW_DISABLED` (no silent KRW charge).

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
5. `TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW` 를 넣지 말 것 (DOMESTIC_KRW_DISABLED).
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
6. Optional later: PayPal on same USD MID (`FOREIGN_EASY_PAY`) — deferred
7. Separate KRW MID only when enabling domestic secondary channel

---

## Health

`/health.payment` (no secrets):

- `provider`
- `mode: INTERNATIONAL_USD`
- `currency: USD`
- key/variant configured booleans
- `domesticKrwEnabled: false`

---

## Errors (no KRW fallback)

| Code | Meaning |
|------|---------|
| `PAYMENT_PROVIDER_NOT_CONFIGURED` | Production 에 provider/Toss 미설정. HTTP 503. |
| `PAYMENT_SERVICE_NOT_AVAILABLE` | stripe/mock-in-prod 등 사용 불가. HTTP 503. |
| `FOREIGN_MID_NOT_CONFIGURED` | USD MID keys missing / invalid |
| `DOMESTIC_KRW_DISABLED` | KRW settlement env or domestic channel requested |
| `UNSUPPORTED_CURRENCY` | product/provider currency mapping failed |
| `AMOUNT_MISMATCH` / `CURRENCY_MISMATCH` | confirm rejected |

UI shows “Payment is not available yet” instead of charging KRW.

---

## Deferred

- Domestic KRW MID channel
- PayPal `FOREIGN_EASY_PAY`
- Refund UI
- Production live keys
