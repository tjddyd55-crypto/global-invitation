# Railway development — watched branches

## Policy

| Environment | Service | Watched branch | Auto-deploy |
|-------------|---------|----------------|-------------|
| development | Frontend | `chore/cleanup-legacy` | Yes (GitHub) |
| development | Backend | `chore/cleanup-legacy` | Yes (GitHub) |
| production | Frontend | `main` | Yes (unchanged) |
| production | Backend | `main` | Yes (unchanged) |

## Why

`main` auto-deploy overwrote Figma / comment-capable development images.
Until those changes merge to `main`, **both** development Frontend and Backend
must track `chore/cleanup-legacy`.

## Trigger IDs (development)

| Service | Trigger id |
|---------|------------|
| Frontend | `f57edbf6-ecf2-4338-b7b1-62af703c6b26` |
| Backend | `a5abb643-17ee-4138-a97b-e3d180c01337` |

## Verify

### Frontend
1. Deployment metadata `branch` = `chore/cleanup-legacy`
2. `GET /api/build-identity` (frontend) → `sha`, `branch`, `builtAt`
3. `/` HTML: no Legacy marketing strings

### Backend
1. Deployment metadata `branch` = `chore/cleanup-legacy`
2. `GET /health` → `status: ok`, `database: connected`, `build.sha`
3. `GET /api/build-identity` → `service: backend`
4. `GET /api/public/invitations/:slug/comments` exists
5. `prisma migrate deploy` no-op on restart

## FUNERAL render path (docs only)

| Path | When |
|------|------|
| **Native** `FuneralClassicInvitation` | runtime data passes `isFuneralInvitationData` |
| **Wedding-like** `WeddingClassicInvitation` + `conceptType=FUNERAL` | funeral fields mapped into wedding payload |

Both paths hide couple via `conceptPresentationConfig`. Prefer native when possible.
