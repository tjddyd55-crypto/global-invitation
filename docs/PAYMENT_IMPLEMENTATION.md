# Invitation publish pricing & payment (development)

## Pricing SSOT

- Frontend: `frontend/src/shared/pricing/invitationPricing.ts`
- Backend: `backend/src/lib/pricing/invitationPricing.ts`
- Values must stay identical: USD list 3000¢ / sale 1000¢ / `OPENING`

Backend is the charge authority. Client-sent amounts are ignored.

## Support email SSOT

- `frontend/src/shared/marketing/supportContact.ts` → `SUPPORT_EMAIL`

## Provider

- Prefer Stripe Checkout when `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY`
- Development default without Stripe keys: `mock` (forbidden in production)
- Webhook: `POST /api/payments/webhook`
- Mock complete: `GET /api/payments/mock/complete`

Env (development only — never commit secrets):

```
PAYMENT_PROVIDER=mock
# or
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_WEBHOOK_SECRET=...   # mock webhook tests
FRONTEND_URL=https://frontend-development-...
```

## Flow

Editor publish → `/invitations/:id/payment` → checkout → webhook/mock PAID → poll → publish API → shareSlug → `/i/:slug`

Public share requires PUBLISHED **and** PAID payment row.
