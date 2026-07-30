/**
 * Phase 2 — delete ONLY approved SAFE_TO_DELETE manifest items.
 *
 * Defaults refuse execution. Required:
 *   DRY_RUN=false
 *   CONFIRM_DELETE=DELETE_LEGACY_INVITATION_ASSETS
 *   MANIFEST_PATH=...
 *   CLEANUP_RUN_ID=...
 *   QUARANTINE=true (default) — copy to quarantine before delete
 *
 * Never deletes invitation/ or quarantine originals without copy success.
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  assertKeyNotProtectedSsot,
  canDeleteFromManifestItem,
  isProtectedSsotKey,
  isQuarantineKey,
  QUARANTINE_PREFIX,
  type ObjectClassification,
} from '../src/lib/r2Cleanup/legacyInvitationClassification';
import { createCleanupS3Client } from '../src/lib/r2Cleanup/listBucketInventory';
import {
  resolveDbReferenceStatus,
  scanDbMediaReferences,
} from '../src/lib/r2Cleanup/scanDbMediaReferences';

type ManifestItem = {
  key: string;
  size: number;
  etag: string | null;
  lastModified: string | null;
  reason: string;
  matchedLegacyPrefix: string | null;
  dbReferenceCount: number;
  codeReferenceCount: number;
  classification: ObjectClassification;
  reviewed: boolean;
  approved: boolean;
};

type Manifest = {
  version: number;
  generatedAt: string;
  expiresAt?: string;
  bucketName: string;
  items: ManifestItem[];
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim() || '';
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function headObject(
  client: S3Client,
  bucket: string,
  key: string
): Promise<{ exists: boolean; etag: string | null; lastModified: string | null; size: number }> {
  try {
    const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      exists: true,
      etag: response.ETag || null,
      lastModified: response.LastModified ? response.LastModified.toISOString() : null,
      size: typeof response.ContentLength === 'number' ? response.ContentLength : 0,
    };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode;
    if (status === 404) {
      return { exists: false, etag: null, lastModified: null, size: 0 };
    }
    throw error;
  }
}

async function main() {
  const dryRun = (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
  const confirm = process.env.CONFIRM_DELETE?.trim() || '';
  const manifestPath = process.env.MANIFEST_PATH?.trim() || '';
  const cleanupRunId = process.env.CLEANUP_RUN_ID?.trim() || '';
  const quarantineEnabled = (process.env.QUARANTINE ?? 'true').toLowerCase() !== 'false';

  if (dryRun) {
    throw new Error('Refusing delete: set DRY_RUN=false explicitly for Phase 2');
  }
  if (confirm !== 'DELETE_LEGACY_INVITATION_ASSETS') {
    throw new Error('Refusing delete: CONFIRM_DELETE mismatch');
  }
  if (!manifestPath) throw new Error('MANIFEST_PATH required');
  if (!cleanupRunId) throw new Error('CLEANUP_RUN_ID required');

  const bucketName = requireEnv('R2_BUCKET_NAME');
  if (bucketName !== 'platform-assets') {
    throw new Error(`Refusing unexpected bucket: ${bucketName}`);
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  if (!endpoint) throw new Error('Missing R2_ENDPOINT or R2_ACCOUNT_ID');

  const client = createCleanupS3Client({
    bucketName,
    endpoint,
    region: process.env.R2_REGION?.trim() || 'auto',
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
  });

  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw) as Manifest;
  if (manifest.version !== 1) throw new Error('Unsupported manifest version');
  if (manifest.bucketName !== 'platform-assets') throw new Error('Manifest bucket mismatch');
  if (manifest.expiresAt && Date.parse(manifest.expiresAt) < Date.now()) {
    throw new Error('Manifest expired (>24h) — regenerate via audit');
  }
  if (manifest.generatedAt) {
    const ageMs = Date.now() - Date.parse(manifest.generatedAt);
    if (Number.isFinite(ageMs) && ageMs > 24 * 60 * 60 * 1000) {
      throw new Error('Manifest older than 24h — regenerate via audit');
    }
  }

  const dbIndex = await scanDbMediaReferences();
  if (dbIndex.status === 'failed') {
    throw new Error('DB reference re-check failed — aborting delete');
  }

  const requested = manifest.items.filter((item) => item.approved && item.reviewed);
  const deleted: string[] = [];
  const skipped: Array<{ key: string; reason: string }> = [];
  const failed: Array<{ key: string; reason: string }> = [];
  let bytesDeleted = 0;
  let quarantineCopied = 0;
  let quarantineFailed = 0;

  for (const item of requested) {
    try {
      assertKeyNotProtectedSsot(item.key);
      const gate = canDeleteFromManifestItem(item);
      if (!gate.ok) {
        skipped.push({ key: item.key, reason: gate.reason });
        continue;
      }
      if (isProtectedSsotKey(item.key) || isQuarantineKey(item.key)) {
        throw new Error('Protected invitation SSOT key');
      }

      const db = resolveDbReferenceStatus(item.key, dbIndex);
      if (db.status !== 'DB_REFERENCE_NOT_FOUND') {
        skipped.push({ key: item.key, reason: db.status });
        continue;
      }

      const head = await headObject(client, bucketName, item.key);
      if (!head.exists) {
        skipped.push({ key: item.key, reason: 'already_absent' });
        continue;
      }
      if (item.etag && head.etag && item.etag !== head.etag) {
        skipped.push({ key: item.key, reason: 'etag_mismatch' });
        continue;
      }
      if (
        item.lastModified &&
        head.lastModified &&
        Date.parse(head.lastModified) > Date.parse(item.lastModified)
      ) {
        skipped.push({ key: item.key, reason: 'last_modified_changed' });
        continue;
      }

      if (quarantineEnabled) {
        const quarantineKey = `${QUARANTINE_PREFIX}${cleanupRunId}/${item.key}`;
        try {
          await client.send(
            new CopyObjectCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${item.key}`,
              Key: quarantineKey,
              MetadataDirective: 'REPLACE',
              Metadata: {
                'original-key': item.key,
                'cleanup-run-id': cleanupRunId,
                'cleanup-date': new Date().toISOString(),
                'original-etag': head.etag || '',
              },
            })
          );
          const qHead = await headObject(client, bucketName, quarantineKey);
          if (!qHead.exists) {
            quarantineFailed += 1;
            failed.push({ key: item.key, reason: 'quarantine_missing_after_copy' });
            continue;
          }
          quarantineCopied += 1;
        } catch (error) {
          quarantineFailed += 1;
          failed.push({
            key: item.key,
            reason: error instanceof Error ? error.message : 'quarantine_copy_failed',
          });
          continue;
        }
      }

      // Batch of 1 here for clarity; callers may extend to 100.
      const result = await client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: [{ Key: item.key }], Quiet: true },
        })
      );
      if ((result.Errors || []).length > 0) {
        failed.push({
          key: item.key,
          reason: result.Errors?.[0]?.Message || 'delete_failed',
        });
        continue;
      }
      deleted.push(item.key);
      bytesDeleted += head.size;
    } catch (error) {
      failed.push({
        key: item.key,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  const reportDir = path.resolve(process.cwd(), '../reports/r2-invitation-cleanup');
  await fs.mkdir(reportDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultPath = path.join(reportDir, `delete-result-${timestamp}.json`);
  const payload = {
    cleanupRunId,
    manifestPath,
    requested: requested.length,
    deleted: deleted.length,
    skipped: skipped.length,
    failed: failed.length,
    quarantineCopied,
    quarantineFailed,
    bytesDeleted,
    deletedKeys: deleted,
    skipped,
    failed,
    protectedSsotDeletes: deleted.filter((key) => isProtectedSsotKey(key)).length,
  };
  await fs.writeFile(resultPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('[r2-delete] complete', {
    requested: requested.length,
    deleted: deleted.length,
    skipped: skipped.length,
    failed: failed.length,
    resultPath,
  });
  if (failed.length > 0) process.exit(2);
}

main().catch((error) => {
  console.error('[r2-delete] failed', error instanceof Error ? error.message : error);
  process.exit(1);
});
