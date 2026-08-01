# R2 legacy Invitation cleanup (platform-assets)

## Current SSOT

- Canonical user assets: `invitation/{environment}/users/...`
- Canonical shared music/images: `invitation/shared/...`
- Runtime accepts **canonical keys only**. Obsolete wrong-order paths (`development/invitation/`, `production/invitation/`) are no longer peeled or rewritten.

## Protection

- `invitation/**` is SSOT and never deleted by these scripts.
- `cleanup-quarantine/invitation-legacy/**` is also protected during cleanup runs.

## History (completed)

- Wrong-order `development/invitation/` test objects were removed from `platform-assets` after DB reference cleanup in development.
- `production/invitation/` objects were already zero.
- One-off operational helper scripts used for that cleanup were deleted and are not part of the tracked toolkit.

## Phase 1 — audit only

```bash
cd backend
# Requires R2_* + DATABASE_URL for the platform-assets bucket.
DRY_RUN=true npm run audit:r2:legacy-invitation
```

If credentials temporarily target a confirmed alias bucket name (not `platform-assets`), set:

```bash
R2_AUDIT_ACCEPT_BUCKET=<exact-bucket-name>
```

Never point this at an unrelated CRM bucket.

Outputs (gitignored):

- `reports/r2-invitation-cleanup/inventory-*.json|csv`
- `reports/r2-invitation-cleanup/delete-manifest-*.json`
- `reports/r2-invitation-cleanup/summary-*.json`

`SAFE_TO_DELETE` allowlist is empty by default. Review `LEGACY_INVITATION_CANDIDATE` prefixes before approving any manifest item.

## Phase 2 — quarantine + delete (separate approval)

Edit manifest items to `reviewed: true` and `approved: true`, then:

```bash
cd backend
DRY_RUN=false \
CONFIRM_DELETE=DELETE_LEGACY_INVITATION_ASSETS \
MANIFEST_PATH=../reports/r2-invitation-cleanup/delete-manifest-....json \
CLEANUP_RUN_ID=2026-07-31-run1 \
npm run delete:r2:legacy-invitation
```

Do not run Phase 1 and Phase 2 in the same session without human review.

## Tracked toolkit (keep)

- `backend/src/lib/r2Cleanup/*` classification, inventory, DB scan, catalog
- `backend/scripts/audit-legacy-invitation-r2-assets.ts`
- `backend/scripts/delete-legacy-invitation-r2-assets.ts`
- related unit tests (`npm run test:r2-cleanup`)

Reports, manifests, and DB backups under `reports/r2-invitation-cleanup/` stay gitignored.
