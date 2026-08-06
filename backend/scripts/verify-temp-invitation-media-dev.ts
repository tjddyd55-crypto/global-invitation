/**
 * Development verification report for temporary invitation media cleanup.
 * Uses DATABASE_URL + R2 credentials from environment (never logs secrets).
 *
 * Usage:
 *   dotenv -e ../artifacts/temp-media-verification/.env.runtime -- npx tsx scripts/verify-temp-invitation-media-dev.ts
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../src/lib/prisma';
import {
  getInvitationAssetEnvironment,
  getInvitationRootPrefix,
  parseInvitationUserAssetKey,
} from '../src/lib/invitationAssetKeys';
import { listAllObjectKeysUnderPrefix } from '../src/lib/storage/uploadToR2';
import { resolveR2Config } from '../src/lib/storage/r2Client';
import {
  auditTempInvitationMedia,
  cleanupTempInvitationMedia,
  isEligibleTempInvitationUserAssetKey,
  isProtectedInvitationSharedAsset,
  isTempMediaCleanupEnabled,
  normalizeMediaReferenceToken,
  resolveTempMediaCleanupBatchSize,
  resolveTempMediaRetentionHours,
  resolveTempMediaSafetyThreshold,
  scanInvitationMediaReferences,
} from '../src/lib/tempInvitationMedia';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function ageHours(createdAt: Date, now: Date): number {
  return (now.getTime() - createdAt.getTime()) / (60 * 60 * 1000);
}

async function main() {
  const now = new Date();
  const outDir = path.resolve(process.cwd(), '../artifacts/temp-media-verification');
  await fs.mkdir(outDir, { recursive: true });

  let r2Ok = false;
  try {
    resolveR2Config();
    r2Ok = true;
  } catch {
    r2Ok = false;
  }

  const [activeInvitations, softDeletedInvitations, mediaTotal, mediaActive, mediaSoftDeleted] =
    await Promise.all([
      prisma.invitation.count({ where: { isDeleted: false } }),
      prisma.invitation.count({ where: { isDeleted: true } }),
      prisma.mediaFile.count(),
      prisma.mediaFile.count({ where: { deletedAt: null } }),
      prisma.mediaFile.count({ where: { deletedAt: { not: null } } }),
    ]);

  const audit = await auditTempInvitationMedia({ now });
  const index = await scanInvitationMediaReferences();

  const allActiveMedia = await prisma.mediaFile.findMany({
    where: { deletedAt: null, objectKey: { not: null } },
    select: {
      id: true,
      objectKey: true,
      fileSize: true,
      createdAt: true,
      ownerId: true,
      ownerRefId: true,
      usage: true,
    },
  });

  let canonicalCount = 0;
  let sharedExcluded = 0;
  let nonCanonical = 0;
  let attachedCount = 0;
  let tempCount = 0;
  let unreferencedUnder24 = 0;
  let unreferenced24to72 = 0;
  let unreferenced72plus = 0;
  let unreferenced7dPlus = 0;

  for (const row of allActiveMedia) {
    const key = (row.objectKey || '').trim();
    if (!key) continue;
    if (isProtectedInvitationSharedAsset(key)) {
      sharedExcluded += 1;
      continue;
    }
    if (!isEligibleTempInvitationUserAssetKey(key)) {
      nonCanonical += 1;
      continue;
    }
    canonicalCount += 1;
    const referenced = index.status === 'ok' && index.activeKeys.has(key);
    // also soft match via normalize
    let isAttached = referenced;
    if (!isAttached && index.status === 'ok') {
      for (const active of index.activeKeys) {
        if (active === key || active.endsWith(`/${key}`) || key.endsWith(`/${active}`)) {
          isAttached = true;
          break;
        }
      }
    }
    if (isAttached) {
      attachedCount += 1;
      continue;
    }
    tempCount += 1;
    const h = ageHours(row.createdAt, now);
    if (h < 24) unreferencedUnder24 += 1;
    else if (h < 72) unreferenced24to72 += 1;
    else {
      unreferenced72plus += 1;
      if (h >= 24 * 7) unreferenced7dPlus += 1;
    }
  }

  // R2-only scan (canonical users prefix only)
  const root = getInvitationRootPrefix();
  const env = getInvitationAssetEnvironment();
  const usersPrefix = `${root}/${env}/users/`;
  let r2Keys: string[] = [];
  let r2ListError: string | undefined;
  if (r2Ok) {
    try {
      r2Keys = await listAllObjectKeysUnderPrefix(usersPrefix);
    } catch (error) {
      r2ListError = error instanceof Error ? error.message : String(error);
    }
  }

  const mediaKeySet = new Set(
    allActiveMedia
      .map((row) => (row.objectKey || '').trim())
      .filter(Boolean)
      .map((key) => normalizeMediaReferenceToken(key) || key)
  );

  let r2OnlyNoRef = 0;
  let r2OnlyWithRef = 0;
  let r2PlusMediaAttached = 0;
  let r2PlusMediaTemp = 0;
  const r2OnlySamples: Array<{ objectKey: string; class: string }> = [];

  for (const key of r2Keys) {
    if (isProtectedInvitationSharedAsset(key)) continue;
    if (!isEligibleTempInvitationUserAssetKey(key)) continue;
    const inDb = mediaKeySet.has(key);
    let referenced = false;
    if (index.status === 'ok') {
      referenced = index.activeKeys.has(key);
      if (!referenced) {
        for (const active of index.activeKeys) {
          if (active === key || active.endsWith(`/${key}`) || key.endsWith(`/${active}`)) {
            referenced = true;
            break;
          }
        }
      }
    }
    if (inDb && referenced) r2PlusMediaAttached += 1;
    else if (inDb && !referenced) r2PlusMediaTemp += 1;
    else if (!inDb && referenced) {
      r2OnlyWithRef += 1;
      if (r2OnlySamples.length < 30) r2OnlySamples.push({ objectKey: key, class: 'R2_ONLY_ACTIVE_REF' });
    } else {
      r2OnlyNoRef += 1;
      if (r2OnlySamples.length < 30) r2OnlySamples.push({ objectKey: key, class: 'R2_ONLY_NO_REF' });
    }
  }

  const dbOnly = allActiveMedia.filter((row) => {
    const key = (row.objectKey || '').trim();
    return key && isEligibleTempInvitationUserAssetKey(key) && !r2Keys.includes(key);
  });

  const candidatesDetailed = audit.candidates.map((item) => {
    const parsed = parseInvitationUserAssetKey(item.objectKey);
    return {
      mediaFileId: item.mediaFileId,
      invitationId: parsed?.invitationId || item.ownerRefId,
      userId: parsed?.userId || item.ownerId,
      objectKey: item.objectKey,
      scope: parsed?.folder || null,
      createdAt: item.createdAt.toISOString(),
      ageHours: Number(ageHours(item.createdAt, now).toFixed(2)),
      bytes: item.fileSize,
      shared: false,
      activeReference: false,
      reason: item.reason,
      deletePlanned: true,
    };
  });

  // Exact-key gate
  const unsafeCandidates = candidatesDetailed.filter((item) => {
    if (!item.objectKey.startsWith(`${root}/${env}/users/`)) return true;
    if (item.objectKey.includes('/shared/')) return true;
    if (!isEligibleTempInvitationUserAssetKey(item.objectKey)) return true;
    return false;
  });

  const dryCleanup = await cleanupTempInvitationMedia({ execute: false, now });

  const report = {
    generatedAt: now.toISOString(),
    environment: env,
    cleanupEnabled: isTempMediaCleanupEnabled(),
    retentionHours: resolveTempMediaRetentionHours(),
    batchSize: resolveTempMediaCleanupBatchSize(),
    safetyThreshold: resolveTempMediaSafetyThreshold(),
    database: 'connected',
    r2Configured: r2Ok,
    r2ListError,
    invitations: {
      active: activeInvitations,
      softDeleted: softDeletedInvitations,
    },
    mediaFiles: {
      total: mediaTotal,
      active: mediaActive,
      softDeleted: mediaSoftDeleted,
      canonicalUser: canonicalCount,
      sharedExcluded,
      nonCanonicalOrOther: nonCanonical,
      attached: attachedCount,
      tempUnreferenced: tempCount,
    },
    unreferencedAge: {
      under24h: unreferencedUnder24,
      from24hTo72h: unreferenced24to72,
      over72h: unreferenced72plus,
      over7d: unreferenced7dPlus,
    },
    cleanupCandidates: {
      count: audit.candidateCount,
      bytes: audit.candidateBytes,
      bytesHuman: formatBytes(audit.candidateBytes),
      cutoff: audit.cutoff,
      detailed: candidatesDetailed,
      unsafeCount: unsafeCandidates.length,
      unsafeKeys: unsafeCandidates.map((item) => item.objectKey),
    },
    r2UsersPrefix: {
      prefix: usersPrefix,
      objectCount: r2Keys.length,
      r2PlusMediaAttached,
      r2PlusMediaTemp,
      r2OnlyWithActiveRef: r2OnlyWithRef,
      r2OnlyNoRef,
      dbOnlyCount: dbOnly.length,
      dbOnlySampleKeys: dbOnly.slice(0, 30).map((row) => row.objectKey),
      r2OnlySamples,
    },
    dryCleanup: {
      aborted: dryCleanup.aborted,
      abortReason: dryCleanup.abortReason,
      planned: dryCleanup.planned,
      deletedR2: dryCleanup.deletedR2,
      softDeletedDb: dryCleanup.softDeletedDb,
    },
    executeApproved: unsafeCandidates.length === 0 && audit.referenceScanStatus === 'ok',
  };

  await fs.writeFile(path.join(outDir, 'dry-run-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error('[verify-temp-invitation-media-dev] failed', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
