/**
 * Execute cleanup for unreferenced invitation media (exact object keys).
 * Default dry-run. --execute required for deletes.
 */

import prisma from '../prisma';
import { deleteFile } from '../storage/uploadToR2';
import { auditTempInvitationMedia, type TempMediaAuditReport, type TempMediaCandidate } from './auditTempInvitationMedia';
import { isActivelyReferenced, scanInvitationMediaReferences } from './scanInvitationReferences';
import {
  isTempMediaCleanupEnabled,
  resolveTempMediaCleanupBatchSize,
  resolveTempMediaSafetyThreshold,
} from './retention';

export type TempMediaCleanupResult = {
  dryRun: boolean;
  enabled: boolean;
  aborted: boolean;
  abortReason?: string;
  audit: TempMediaAuditReport;
  planned: number;
  deletedR2: number;
  softDeletedDb: number;
  failed: Array<{ objectKey: string; mediaFileId: string; error: string }>;
  skipped: Array<{ objectKey: string; reason: string }>;
};

async function softDeleteMediaFile(mediaFileId: string): Promise<void> {
  await prisma.mediaFile.updateMany({
    where: { id: mediaFileId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

/**
 * Re-check reference immediately before delete (race with autosave).
 */
async function stillSafeToDelete(objectKey: string): Promise<boolean> {
  const index = await scanInvitationMediaReferences();
  if (index.status === 'failed') return false;
  return !isActivelyReferenced(objectKey, index);
}

export async function cleanupTempInvitationMedia(options?: {
  execute?: boolean;
  now?: Date;
  batchSize?: number;
  safetyThreshold?: number;
  /** Force execute even when INVITATION_TEMP_MEDIA_CLEANUP_ENABLED=false (manual script). */
  forceManual?: boolean;
}): Promise<TempMediaCleanupResult> {
  const dryRun = options?.execute !== true;
  const enabled = isTempMediaCleanupEnabled();
  const forceManual = options?.forceManual === true;
  const batchSize = options?.batchSize ?? resolveTempMediaCleanupBatchSize();
  const safetyThreshold = options?.safetyThreshold ?? resolveTempMediaSafetyThreshold();

  const audit = await auditTempInvitationMedia({ now: options?.now });

  const base: TempMediaCleanupResult = {
    dryRun,
    enabled,
    aborted: false,
    audit,
    planned: 0,
    deletedR2: 0,
    softDeletedDb: 0,
    failed: [],
    skipped: [],
  };

  if (audit.referenceScanStatus === 'failed') {
    return {
      ...base,
      aborted: true,
      abortReason: `REFERENCE_SCAN_FAILED: ${audit.referenceScanError || 'unknown'}`,
    };
  }

  if (audit.candidateCount >= safetyThreshold) {
    return {
      ...base,
      aborted: true,
      abortReason: `SAFETY_THRESHOLD: candidates=${audit.candidateCount} threshold=${safetyThreshold}`,
      planned: audit.candidateCount,
    };
  }

  const batch: TempMediaCandidate[] = audit.candidates.slice(0, batchSize);
  base.planned = batch.length;

  if (dryRun) {
    return base;
  }

  // Worker path requires enabled flag; manual scripts may pass forceManual
  if (!enabled && !forceManual) {
    return {
      ...base,
      aborted: true,
      abortReason: 'CLEANUP_DISABLED',
    };
  }

  for (const candidate of batch) {
    try {
      const safe = await stillSafeToDelete(candidate.objectKey);
      if (!safe) {
        base.skipped.push({ objectKey: candidate.objectKey, reason: 'REFERENCE_APPEARED' });
        continue;
      }

      try {
        await deleteFile(candidate.objectKey);
        console.log('[R2_DELETE_TEMP]', candidate.objectKey);
        base.deletedR2 += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Idempotent: already gone is OK
        if (!/NoSuchKey|NotFound|404/i.test(message)) {
          base.failed.push({
            objectKey: candidate.objectKey,
            mediaFileId: candidate.mediaFileId,
            error: message,
          });
          // Do not soft-delete DB if R2 delete failed unexpectedly
          continue;
        }
        console.log('[R2_DELETE_TEMP_ALREADY_GONE]', candidate.objectKey);
      }

      await softDeleteMediaFile(candidate.mediaFileId);
      base.softDeletedDb += 1;
    } catch (error) {
      base.failed.push({
        objectKey: candidate.objectKey,
        mediaFileId: candidate.mediaFileId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return base;
}
