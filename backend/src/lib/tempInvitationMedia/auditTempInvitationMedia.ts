/**
 * Select unreferenced invitation MediaFile rows older than retention cutoff.
 * Lifecycle model A — no TEMP/ATTACHED migration; attachment = dataJson reference.
 */

import prisma from '../prisma';
import { normalizeCanonicalInvitationObjectKey } from '../invitationAssetKeys';
import {
  isEligibleTempInvitationUserAssetKey,
  isProtectedInvitationSharedAsset,
} from './protection';
import { retentionCutoffDate, resolveTempMediaRetentionHours } from './retention';
import {
  isActivelyReferenced,
  scanInvitationMediaReferences,
  type InvitationReferenceIndex,
} from './scanInvitationReferences';

export type TempMediaCandidate = {
  mediaFileId: string;
  objectKey: string;
  publicUrl: string | null;
  fileSize: number;
  createdAt: Date;
  ownerId: string;
  ownerRefId: string | null;
  usage: string | null;
  reason: 'UNREFERENCED_PAST_RETENTION';
};

export type TempMediaExclusion = {
  mediaFileId: string;
  objectKey: string | null;
  reason:
    | 'PROTECTED_SHARED'
    | 'NON_CANONICAL_KEY'
    | 'ACTIVE_REFERENCE'
    | 'TOO_RECENT'
    | 'MISSING_OBJECT_KEY'
    | 'ALREADY_SOFT_DELETED';
};

export type TempMediaAuditReport = {
  cutoff: string;
  retentionHours: number;
  referenceScanStatus: InvitationReferenceIndex['status'];
  referenceScanError?: string;
  activeInvitationCount: number;
  mediaFileScanned: number;
  candidates: TempMediaCandidate[];
  exclusions: TempMediaExclusion[];
  candidateCount: number;
  candidateBytes: number;
  ageBuckets: {
    under24h: number;
    from24hTo72h: number;
    from72hTo7d: number;
    over7d: number;
  };
};

function ageBucket(createdAt: Date, now: Date): keyof TempMediaAuditReport['ageBuckets'] {
  const ageMs = now.getTime() - createdAt.getTime();
  const h = ageMs / (60 * 60 * 1000);
  if (h < 24) return 'under24h';
  if (h < 72) return 'from24hTo72h';
  if (h < 24 * 7) return 'from72hTo7d';
  return 'over7d';
}

export async function auditTempInvitationMedia(options?: {
  now?: Date;
  retentionHours?: number;
  /** Include soft-deleted MediaFile rows that still have objectKey (optional re-try). Default false. */
  includeSoftDeleted?: boolean;
}): Promise<TempMediaAuditReport> {
  const now = options?.now ?? new Date();
  const retentionHours = options?.retentionHours ?? resolveTempMediaRetentionHours();
  const cutoff = retentionCutoffDate(now, retentionHours);
  const includeSoftDeleted = options?.includeSoftDeleted === true;

  const index = await scanInvitationMediaReferences();
  const rows = await prisma.mediaFile.findMany({
    where: includeSoftDeleted
      ? { objectKey: { not: null } }
      : { deletedAt: null, objectKey: { not: null } },
    select: {
      id: true,
      objectKey: true,
      publicUrl: true,
      fileSize: true,
      createdAt: true,
      ownerId: true,
      ownerRefId: true,
      usage: true,
      deletedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const candidates: TempMediaCandidate[] = [];
  const exclusions: TempMediaExclusion[] = [];
  const ageBuckets = { under24h: 0, from24hTo72h: 0, from72hTo7d: 0, over7d: 0 };

  for (const row of rows) {
    ageBuckets[ageBucket(row.createdAt, now)] += 1;
    const objectKey = row.objectKey ? normalizeCanonicalInvitationObjectKey(row.objectKey) : '';

    if (!objectKey) {
      exclusions.push({ mediaFileId: row.id, objectKey: null, reason: 'MISSING_OBJECT_KEY' });
      continue;
    }
    if (row.deletedAt && !includeSoftDeleted) {
      exclusions.push({ mediaFileId: row.id, objectKey, reason: 'ALREADY_SOFT_DELETED' });
      continue;
    }
    if (isProtectedInvitationSharedAsset(objectKey)) {
      exclusions.push({ mediaFileId: row.id, objectKey, reason: 'PROTECTED_SHARED' });
      continue;
    }
    if (!isEligibleTempInvitationUserAssetKey(objectKey)) {
      exclusions.push({ mediaFileId: row.id, objectKey, reason: 'NON_CANONICAL_KEY' });
      continue;
    }
    if (row.createdAt >= cutoff) {
      exclusions.push({ mediaFileId: row.id, objectKey, reason: 'TOO_RECENT' });
      continue;
    }
    if (isActivelyReferenced(objectKey, index)) {
      exclusions.push({ mediaFileId: row.id, objectKey, reason: 'ACTIVE_REFERENCE' });
      continue;
    }

    candidates.push({
      mediaFileId: row.id,
      objectKey,
      publicUrl: row.publicUrl,
      fileSize: row.fileSize,
      createdAt: row.createdAt,
      ownerId: row.ownerId,
      ownerRefId: row.ownerRefId,
      usage: row.usage,
      reason: 'UNREFERENCED_PAST_RETENTION',
    });
  }

  const candidateBytes = candidates.reduce((sum, item) => sum + (item.fileSize || 0), 0);

  return {
    cutoff: cutoff.toISOString(),
    retentionHours,
    referenceScanStatus: index.status,
    referenceScanError: index.errorMessage,
    activeInvitationCount: index.invitationCount,
    mediaFileScanned: rows.length,
    candidates,
    exclusions,
    candidateCount: candidates.length,
    candidateBytes,
    ageBuckets,
  };
}
