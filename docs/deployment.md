# Deployment runbook (global_invitation)

## Environments

| Environment | Watched branch | Release rule | Notes |
|-------------|----------------|--------------|-------|
| **development** | `chore/cleanup-legacy` | Auto-deploy on push to watched branch | Preserve at all times. Do not rename into Production. |
| **production** | `main` | Deploy exact `RELEASE_SHA` from `origin/main` | Never force-push / history rewrite. |

## Services (shared IDs across envs)

- Frontend `2f664266-fe4e-414c-a799-a46400b9fe47`
- Backend `d4b2b273-8885-4ae3-8101-f7f0aec16ad9`
- Development Postgres `80925b59-1671-42f6-9891-8ac1fcead2be` (`postgres.railway.internal`, volume `postgres-volume-YaVo`)
- Production Postgres **Postgres-KnBG** `63a8b764-829e-4841-adfb-f3dfd4599797` (`postgres-knbg.railway.internal`, volume `postgres-volume-wJfm`)

Production Backend `DATABASE_URL` must reference **Postgres-KnBG** only (`${{Postgres-KnBG.DATABASE_URL}}`). Never share Development `DATABASE_URL` into Production.

## Fast-forward release flow

1. Land work on `chore/cleanup-legacy` and verify Development (`/health`, smoke).
2. Open PR / FF-merge `chore/cleanup-legacy` → `main` (no force push, no rebase of shared main history).
3. Record `RELEASE_SHA=$(git rev-parse origin/main)`.
4. Ensure Production FE/BE environment branch = `main` (Railway dashboard per-environment source if CLI service-level branch is shared).
5. Deploy/redeploy Production FE/BE at `RELEASE_SHA`.
6. `railway ssh -s Backend -e production -- npx prisma migrate status` → pending=0. **No** `migrate reset`, **no** Dev→Prod DB copy.
7. Smoke Production URLs; confirm unpaid publish remains gated until Toss overseas live approval.

## Production config checklist (keys only)

- `NODE_ENV=production`
- `FRONTEND_URL` / `BACKEND_PUBLIC_URL` / `NEXT_PUBLIC_*` → production domains
- `FRONTEND_ALLOWED_ORIGINS` = production FE origin only (no `*` with credentials)
- Cookie `Secure` via `NODE_ENV=production`
- New `ADMIN_SETTINGS_ENCRYPTION_KEY` (64-hex) — do not copy from Development
- `INVITATION_R2_ROOT_PREFIX=invitation`, `INVITATION_ASSET_ENVIRONMENT=production`
- `ALLOW_EMAIL_PREVIEW_CODE=false`, email OTP / test login disabled
- `PAYMENT_PROVIDER` unset or `toss_payments` only with live overseas approval — **never** `mock` on Production
- Build note: Backend needs `NPM_CONFIG_PRODUCTION=false` so `tsc` can see `@types/nodemailer` / `supertest` (devDependencies)

## Empty Production DB bootstrap note

Fresh Postgres cannot `migrate deploy` the historical chain starting at `20260124030000_auth_guest_flow` (ALTER without CREATE). For a **new empty** Production volume only: `prisma db push` then `prisma migrate resolve --applied <each>` until `migrate status` is up to date. Never apply this to a populated Production DB; never copy Development data.

## Payment readiness

- **Technical Production Deployment**: app/DB/R2/auth online; publish gated without live Toss.
- **Commercial Paid Launch**: blocked on Toss overseas USD MID approval (`BLOCKED_PENDING_TOSS_OVERSEAS_APPROVAL`).
