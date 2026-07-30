/**
 * Phase 1 — DRY_RUN inventory + classification for legacy Invitation R2 objects.
 *
 * NEVER deletes. Default DRY_RUN=true.
 *
 * Usage (from backend/):
 *   DRY_RUN=true npx tsx scripts/audit-legacy-invitation-r2-assets.ts
 *
 * Required env: R2_BUCKET_NAME, R2_ACCOUNT_ID or R2_ENDPOINT, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, DATABASE_URL
 *
 * Secrets are never written to reports.
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import {
  classifyLegacyInvitationObject,
  type ObjectClassification,
} from '../src/lib/r2Cleanup/legacyInvitationClassification';
import {
  createCleanupS3Client,
  listEntireBucketInventory,
  summarizeTopLevelPrefixes,
  type InventoryObject,
} from '../src/lib/r2Cleanup/listBucketInventory';
import { CODE_PATH_REFERENCE_CATALOG } from '../src/lib/r2Cleanup/codePathReferenceCatalog';
import {
  resolveDbReferenceStatus,
  scanDbMediaReferences,
} from '../src/lib/r2Cleanup/scanDbMediaReferences';

type ClassifiedRow = InventoryObject & {
  publicUrl: string | null;
  protected: boolean;
  deleteCandidate: boolean;
  classification: ObjectClassification;
  reason: string;
  matchedLegacyPrefix: string | null;
  dbReferenceCount: number;
  dbReferenceStatus: string;
  codeReferenceCount: number;
  reviewed: boolean;
  approved: boolean;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim() || '';
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function toCsv(rows: ClassifiedRow[]): string {
  const header = [
    'key',
    'size',
    'etag',
    'lastModified',
    'topLevelPrefix',
    'classification',
    'reason',
    'matchedLegacyPrefix',
    'dbReferenceStatus',
    'dbReferenceCount',
    'codeReferenceCount',
    'protected',
    'deleteCandidate',
  ];
  const escape = (value: unknown) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.key,
        row.size,
        row.etag,
        row.lastModified,
        row.topLevelPrefix,
        row.classification,
        row.reason,
        row.matchedLegacyPrefix,
        row.dbReferenceStatus,
        row.dbReferenceCount,
        row.codeReferenceCount,
        row.protected,
        row.deleteCandidate,
      ]
        .map(escape)
        .join(',')
    );
  }
  return `${lines.join('\n')}\n`;
}

function countByClassification(rows: ClassifiedRow[]): Record<ObjectClassification, number> {
  const counts = {
    PROTECTED_SSOT: 0,
    PROTECTED_OTHER_PROJECT: 0,
    PROTECTED_DB_REFERENCE: 0,
    PROTECTED_CODE_REFERENCE: 0,
    LEGACY_INVITATION_CANDIDATE: 0,
    SAFE_TO_DELETE: 0,
    UNKNOWN: 0,
  } satisfies Record<ObjectClassification, number>;
  for (const row of rows) {
    counts[row.classification] += 1;
  }
  return counts;
}

async function main() {
  const dryRun = (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
  if (!dryRun) {
    throw new Error('audit script must run with DRY_RUN=true (delete script is separate)');
  }

  const bucketName = requireEnv('R2_BUCKET_NAME');
  const acceptedAlias = process.env.R2_AUDIT_ACCEPT_BUCKET?.trim() || '';
  if (bucketName !== 'platform-assets') {
    if (!acceptedAlias || acceptedAlias !== bucketName) {
      throw new Error(
        `Refusing unexpected bucket: ${bucketName}. Expected platform-assets, or set R2_AUDIT_ACCEPT_BUCKET=${bucketName} after confirming this is the Invitation media bucket behind the CDN.`
      );
    }
    console.warn('[r2-audit] using accepted non-default bucket alias', { bucketName });
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  if (!endpoint) throw new Error('Missing env: R2_ENDPOINT or R2_ACCOUNT_ID');

  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
  const region = process.env.R2_REGION?.trim() || 'auto';
  const publicBase = (process.env.R2_PUBLIC_BASE_URL || 'https://cdn.platform-assets.com')
    .trim()
    .replace(/\/+$/, '');

  const client = createCleanupS3Client({
    bucketName,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
  });

  console.log('[r2-audit] listing bucket inventory (paginated)...');
  const inventory = await listEntireBucketInventory(client, bucketName);
  const totalBytes = inventory.reduce((sum, item) => sum + item.size, 0);
  console.log('[r2-audit] inventory complete', {
    objectCount: inventory.length,
    totalBytes,
    totalBytesLabel: formatBytes(totalBytes),
  });

  console.log('[r2-audit] scanning DB media references...');
  const dbIndex = await scanDbMediaReferences();
  if (dbIndex.status === 'failed') {
    console.warn('[r2-audit] DB scan failed — all non-SSOT objects will be protected', {
      errorMessage: dbIndex.errorMessage,
    });
  } else {
    console.log('[r2-audit] DB scan ok', {
      referencedKeys: dbIndex.hitsByKey.size,
      sources: dbIndex.scannedSources,
    });
  }

  const classified: ClassifiedRow[] = inventory.map((item) => {
    const db = resolveDbReferenceStatus(item.key, dbIndex);
    const codeRefs = CODE_PATH_REFERENCE_CATALOG.filter((entry) =>
      item.key.replace(/^\/+/, '').startsWith(entry.prefix)
    );
    const result = classifyLegacyInvitationObject({
      key: item.key,
      dbReferenceCount: db.count,
      dbReferenceStatus: db.status,
    });
    return {
      ...item,
      publicUrl: `${publicBase}/${item.key}`,
      protected: result.protected,
      deleteCandidate: result.deleteCandidate,
      classification: result.classification,
      reason: result.reason,
      matchedLegacyPrefix: result.matchedLegacyPrefix,
      dbReferenceCount: db.count,
      dbReferenceStatus: db.status,
      codeReferenceCount: codeRefs.length,
      reviewed: false,
      approved: false,
    };
  });

  const counts = countByClassification(classified);
  const invitationRows = classified.filter((row) => row.key.startsWith('invitation/'));
  const invitationBytes = invitationRows.reduce((sum, row) => sum + row.size, 0);
  const safeRows = classified.filter((row) => row.classification === 'SAFE_TO_DELETE');
  const legacyCandidates = classified.filter(
    (row) => row.classification === 'LEGACY_INVITATION_CANDIDATE'
  );
  const safeBytes = safeRows.reduce((sum, row) => sum + row.size, 0);
  const topLevel = summarizeTopLevelPrefixes(inventory);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.resolve(process.cwd(), '../reports/r2-invitation-cleanup');
  await fs.mkdir(reportDir, { recursive: true });

  const inventoryJsonPath = path.join(reportDir, `inventory-${timestamp}.json`);
  const inventoryCsvPath = path.join(reportDir, `inventory-${timestamp}.csv`);
  const manifestPath = path.join(reportDir, `delete-manifest-${timestamp}.json`);
  const summaryPath = path.join(reportDir, `summary-${timestamp}.json`);

  // Strip secrets; keep publicUrl for operators (CDN host only).
  const inventoryPayload = {
    generatedAt: new Date().toISOString(),
    bucketName,
    dryRun: true,
    deleted: 0,
    objectCount: classified.length,
    totalBytes,
    classificationCounts: counts,
    objects: classified.map((row) => ({
      key: row.key,
      size: row.size,
      etag: row.etag,
      lastModified: row.lastModified,
      contentType: row.contentType,
      publicUrl: row.publicUrl,
      topLevelPrefix: row.topLevelPrefix,
      classification: row.classification,
      reason: row.reason,
      matchedLegacyPrefix: row.matchedLegacyPrefix,
      dbReferenceStatus: row.dbReferenceStatus,
      dbReferenceCount: row.dbReferenceCount,
      codeReferenceCount: row.codeReferenceCount,
      protected: row.protected,
      deleteCandidate: row.deleteCandidate,
    })),
  };

  const manifestPayload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    bucketName: 'platform-assets',
    dryRun: true,
    note: 'approved defaults to false. Phase 2 delete requires explicit approval edits.',
    items: safeRows.map((row) => ({
      key: row.key,
      size: row.size,
      etag: row.etag,
      lastModified: row.lastModified,
      reason: row.reason,
      matchedLegacyPrefix: row.matchedLegacyPrefix,
      dbReferenceCount: row.dbReferenceCount,
      codeReferenceCount: row.codeReferenceCount,
      classification: row.classification,
      reviewed: false,
      approved: false,
    })),
  };

  const legacyByPrefix = new Map<string, { count: number; bytes: number; samples: string[] }>();
  for (const row of legacyCandidates) {
    const prefix = row.matchedLegacyPrefix || row.topLevelPrefix;
    const current = legacyByPrefix.get(prefix) || { count: 0, bytes: 0, samples: [] as string[] };
    current.count += 1;
    current.bytes += row.size;
    if (current.samples.length < 5) current.samples.push(row.key);
    legacyByPrefix.set(prefix, current);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    bucketName,
    dryRun: true,
    actualDeletes: 0,
    objectCount: classified.length,
    totalBytes,
    totalBytesLabel: formatBytes(totalBytes),
    invitationObjectCount: invitationRows.length,
    invitationBytes,
    invitationBytesLabel: formatBytes(invitationBytes),
    classificationCounts: counts,
    safeToDeleteBytes: safeBytes,
    safeToDeleteBytesLabel: formatBytes(safeBytes),
    dbScanStatus: dbIndex.status,
    dbReferencedKeys: dbIndex.hitsByKey.size,
    dbErrorMessage: dbIndex.errorMessage || null,
    codePathCatalog: CODE_PATH_REFERENCE_CATALOG,
    topLevelPrefixes: topLevel,
    legacyCandidatePrefixes: Array.from(legacyByPrefix.entries()).map(([prefix, value]) => ({
      prefix,
      objectCount: value.count,
      totalBytes: value.bytes,
      totalBytesLabel: formatBytes(value.bytes),
      sampleKeys: value.samples,
    })),
    inventoryJsonPath,
    inventoryCsvPath,
    manifestPath,
  };

  await fs.writeFile(inventoryJsonPath, JSON.stringify(inventoryPayload, null, 2), 'utf8');
  await fs.writeFile(inventoryCsvPath, toCsv(classified), 'utf8');
  await fs.writeFile(manifestPath, JSON.stringify(manifestPayload, null, 2), 'utf8');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('[r2-audit] Phase 1 complete (no deletes)', {
    objectCount: classified.length,
    invitationObjectCount: invitationRows.length,
    SAFE_TO_DELETE: counts.SAFE_TO_DELETE,
    LEGACY_INVITATION_CANDIDATE: counts.LEGACY_INVITATION_CANDIDATE,
    UNKNOWN: counts.UNKNOWN,
    actualDeletes: 0,
    summaryPath,
    inventoryJsonPath,
    manifestPath,
  });
}

main().catch((error) => {
  console.error('[r2-audit] failed', error instanceof Error ? error.message : error);
  process.exit(1);
});
