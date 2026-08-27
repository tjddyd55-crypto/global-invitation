# Invitation publish payments — Toss Payments (Global-first USD)

## Domain

- Product pricing SSOT: **USD** list 3000¢ / sale 1000¢ (`invitationPricing.ts` FE+BE)
- Provider charge (Toss 외화결제): **USD major units** (`value: 10` for $10) via `toInternationalUsdChargeAmount`
- Channel: **`INTERNATIONAL_USD`** (primary). **`DOMESTIC_KRW`** disabled (no silent fallback)
- `InvitationPayment` attempts: PENDING → PAID | FAILED | CANCELED | REFUNDED
- Publish / Public gates require a **PAID** payment row
- Backend price authority (client amount not trusted)

## Active providers

| Provider | When |
|---|---|
| `mock` | `PAYMENT_PROVIDER=mock` (development/test only; production rejects) |
| `toss_payments` | `PAYMENT_PROVIDER=toss_payments` + USD foreign MID keys |

Stripe is **disabled** at runtime (`PAYMENT_PROVIDER=stripe` throws).

## Flow

1. Editor publish → `/invitations/:id/payment`
2. `POST /api/invitations/:id/payment/prepare` → USD amount + `paymentChannel=INTERNATIONAL_USD`
3. Toss JS SDK v2 `payment.requestPayment({ method: 'CARD', amount.currency: 'USD', card.useInternationalCardOnly: true })`
4. `/invitations/:id/payment/success?paymentKey&orderId&amount`
5. `POST /api/invitations/:id/payment/confirm` → Toss confirm + amount **and currency** check
6. PAID → publish → shareSlug → `/i/:slug`

Authentication redirect alone never marks PAID.

## Contract requirement (blocker)

Canonical checkout needs Toss **외화결제 MID (USD)** + overseas card approval (+ optional `variantKey`).

See: [해외결제 연동하기](https://docs.tosspayments.com/guides/v2/learn/foreign-payment)

- KRW 일반결제 MID ≠ USD 외화결제 MID (one MID = one currency)
- **Do not** map `$10` → fixed KRW via settlement env
- If `TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW` is set → prepare returns `DOMESTIC_KRW_DISABLED`
- Missing USD keys → `FOREIGN_MID_NOT_CONFIGURED` (UI: payment unavailable)

Domestic KRW is a **future secondary** channel with its own MID — not this release.

## Env (development)

Frontend:

```
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_...
# NEXT_PUBLIC_TOSS_PAYMENTS_VARIANT_KEY=...   # if admin provides for USD MID
```

Backend:

```
PAYMENT_PROVIDER=mock
# or
PAYMENT_PROVIDER=toss_payments
TOSS_PAYMENTS_SECRET_KEY=test_sk_...
TOSS_PAYMENTS_CLIENT_KEY=test_ck_...   # optional server mirror
# TOSS_PAYMENTS_VARIANT_KEY=...
FRONTEND_URL=https://frontend-development-....
```

Never set `NEXT_PUBLIC_*_SECRET*`.

test/live key mixing is rejected. Live keys rejected outside production.

## Webhook

`POST /api/payments/webhook`

- Event: `PAYMENT_STATUS_CHANGED`
- General payment webhooks: **no Stripe-style HMAC**; verify by Toss Payment Query API (`GET /v1/payments/{paymentKey}`)
- Confirm response remains first-success SSOT

## Docs note

Historical `docs/02_STRIPE_POLICY.md` / Lemon checklists are legacy — **runtime provider is Toss/mock**.
Full policy: [`TOSS_PAYMENTS_INTEGRATION.md`](./TOSS_PAYMENTS_INTEGRATION.md).
