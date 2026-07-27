# Railway development Frontend — watched branch

## Policy

| Environment | Service | Watched branch | Auto-deploy |
|-------------|---------|----------------|-------------|
| development | Frontend | `chore/cleanup-legacy` | Yes (GitHub) |
| development | Backend | `main` | Yes (unchanged) |
| production | Frontend | `main` | Yes (unchanged) |
| production | Backend | `main` | Yes (unchanged) |

## Why

`main` auto-deploy overwrote Figma canonical routes with Legacy `HomePageClient`
(`ed33051d` from `e8f9306`). Development Frontend must track `chore/cleanup-legacy`
until Figma routes are merged to `main`.

## Verify

After each development Frontend deploy:

1. Deployment metadata `branch` = `chore/cleanup-legacy`
2. `GET /api/build-identity` → `sha`, `branch`, `builtAt`, `label`
3. `/` HTML/chunks: no `HomePageClient`, `Self Basic`, `FULL 엔진 시작`
