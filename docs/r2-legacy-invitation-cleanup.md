# R2 legacy Invitation cleanup (platform-assets)

## Protection

- `invitation/**` is SSOT and never deleted by these scripts.
- `cleanup-quarantine/invitation-legacy/**` is also protected during cleanup runs.

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
