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

## Coupons

- Models: `InvitationCoupon` + `InvitationCouponUsage` (authoritative counts). Amounts are **USD cents**.
- Codes: unique, stored `UPPERCASE` trimmed, charset `A-Z0-9-_` length 4–32. Case-insensitive uniqueness is the normalized code.
- Types: `PERCENT` (1–100) and `FIXED_AMOUNT` (cents; whole dollars for admin create).
- Status: `DRAFT` / `ACTIVE` / `PAUSED` / `EXPIRED` / `ARCHIVED` (+ `startsAt` / `endsAt`).
- Limits: `totalUsageLimit` / `perUserUsageLimit` nullable = unlimited. Count `RESERVED` + `REDEEMED` only.
- Lifecycle: validate (no hold) → **RESERVE** on `prepare` → **REDEEMED** on PAID → **RELEASED** on fail/cancel/expire. Refund keeps **REDEEMED** (no reuse).
- Payment snapshot (nullable for legacy rows): `couponId`, `couponCode`, discount type/value, `baseAmountCents`, `discountAmountCents`. `chargedAmount` is the **final** amount.
- $0 (100% coupon): server `POST /api/invitations/:id/payment/settle-zero` after prepare. Client-sent $0 is rejected without a reserved coupon. Does **not** use mock payment bypass or Toss live overseas charges. Works even when Toss is not configured.
- Unconfigured Production provider: prepare returns `PAYMENT_PROVIDER_NOT_CONFIGURED` (HTTP 503), never 500. UI keeps the discounted quote and disables the paid CTA.
- Pending window 24h: honor coupon snapshot at confirm (do not re-check live ACTIVE). Expired reservations are released lazily.
- Paid invitations: no re-pay / no coupon re-apply.
- Public validate is rate-limited and returns only quote amounts (no catalog).
- Admin: `/admin/payments?tab=coupons` — SUPER_ADMIN mutations. Audit: `COUPON_CREATED` / `UPDATED` / `PAUSED` / `ACTIVATED` / `ARCHIVED`.
- Hard delete is not exposed when usage exists; archive instead.
- Dev seed only: `npm run coupons:seed-dev` in `backend/` (`JCI50`, `DEVFREE100`). Never seed Production.

## Docs note

Historical `docs/02_STRIPE_POLICY.md` / Lemon checklists are legacy — **runtime provider is Toss/mock**.
Full policy: [`TOSS_PAYMENTS_INTEGRATION.md`](./TOSS_PAYMENTS_INTEGRATION.md).
Ops runbook: [`COUPON_OPS.md`](./COUPON_OPS.md).
