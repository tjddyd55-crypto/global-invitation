# Invitation publish payments — Toss Payments (development)

## Domain (unchanged)

- Product pricing SSOT: USD list 3000¢ / sale 1000¢ (`invitationPricing.ts` FE+BE)
- `InvitationPayment` attempts: PENDING → PAID | FAILED | CANCELED | REFUNDED
- Publish / Public gates require a **PAID** payment row
- Backend price authority (client amount not trusted)

## Active providers

| Provider | When |
|---|---|
| `mock` | `PAYMENT_PROVIDER=mock` (development/test only; production rejects) |
| `toss_payments` | `PAYMENT_PROVIDER=toss_payments` |

Stripe is **disabled** at runtime (`PAYMENT_PROVIDER=stripe` throws).

## Flow

1. Editor publish → `/invitations/:id/payment`
2. `POST /api/invitations/:id/payment/prepare` → orderId + amount snapshot
3. Toss JS SDK v2 `payment.requestPayment({ method: 'CARD', ... })` (or mock success redirect)
4. `/invitations/:id/payment/success?paymentKey&orderId&amount`
5. `POST /api/invitations/:id/payment/confirm` → Toss `POST /v1/payments/confirm` (+ Idempotency-Key)
6. PAID → publish → shareSlug → `/i/:slug`

Authentication redirect alone never marks PAID.

## Currency blocker (important)

Official Toss docs: **일반결제(CARD)는 KRW만**, PayPal 등 해외 간편결제는 **USD만**.

Product price remains **USD**. Code does **not** invent FX conversion.

To charge via Toss CARD in development/production you must **explicitly** set a KRW settlement amount (product decision, not FX):

```
TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW
TOSS_PAYMENTS_SETTLEMENT_AMOUNT=10000
```

Without these, `prepare` returns `UNSUPPORTED_CURRENCY`.

USD direct charge requires overseas MID (e.g. PayPal) — not enabled in this CARD window integration.

## Env (development)

Frontend:

```
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_...
```

Backend:

```
PAYMENT_PROVIDER=mock
# or
PAYMENT_PROVIDER=toss_payments
TOSS_PAYMENTS_SECRET_KEY=test_sk_...
TOSS_PAYMENTS_CLIENT_KEY=test_ck_...   # optional server mirror for guards
TOSS_PAYMENTS_SETTLEMENT_CURRENCY=KRW  # only when product sets KRW charge
TOSS_PAYMENTS_SETTLEMENT_AMOUNT=...
FRONTEND_URL=https://frontend-development-....
BACKEND_PUBLIC_URL=https://backend-development-....
```

Never set `NEXT_PUBLIC_*_SECRET*`.

test/live key mixing is rejected. Live keys rejected outside production.

## Webhook

`POST /api/payments/webhook`

- Event: `PAYMENT_STATUS_CHANGED`
- General payment webhooks: **no Stripe-style HMAC**; verify by Toss Payment Query API (`GET /v1/payments/{paymentKey}`)
- Register development URL only in Toss developer center (not production)

## Docs note

Historical `docs/02_STRIPE_POLICY.md` / Lemon checklists are legacy product notes — **runtime provider is Toss/mock**.
