import prisma from '../lib/prisma';
import { deleteFile } from '../lib/storage/uploadToR2';
import { resolveR2Config } from '../lib/storage/r2Client';
import { purgeStaleTempStagingObjects, runLegacyMediaStorageGradualPurge } from '../storage/mediaCleanup';
import { cleanupTempInvitationMedia, isTempMediaCleanupEnabled } from '../lib/tempInvitationMedia';

const TICK_MS = 60_000;
const JOB_BATCH_SIZE = 100;
const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Unreferenced MediaFile cleanup at most once per hour when enabled. */
const TEMP_MEDIA_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastTempMediaCleanupAt = 0;

function isR2Configured(): boolean {
  try {
    resolveR2Config();
    return true;
  } catch {
    return false;
  }
}

async function processPendingCleanupJobs(): Promise<void> {
  if (!isR2Configured()) {
    return;
  }

  const now = new Date();
  const jobs = await prisma.cleanupJob.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    take: JOB_BATCH_SIZE,
    orderBy: { scheduledAt: 'asc' },
  });

  for (const job of jobs) {
    try {
      await deleteFile(job.r2Key);
      console.log('[R2_DELETE]', job.r2Key);
      await prisma.cleanupJob.update({
        where: { id: job.id },
        data: { status: 'DONE' },
      });
    } catch (error) {
      console.error('[cleanupWorker] R2 delete failed', job.id, job.r2Key, error);
      await prisma.cleanupJob.update({
        where: { id: job.id },
        data: { status: 'FAILED' },
      });
    }
  }
}

async function purgeStaleTempUploads(): Promise<void> {
  if (!isR2Configured()) {
    return;
  }

  await purgeStaleTempStagingObjects(TEMP_MAX_AGE_MS);
}

async function purgeUnreferencedTempInvitationMedia(): Promise<void> {
  if (!isR2Configured() || !isTempMediaCleanupEnabled()) {
    return;
  }
  const now = Date.now();
  if (now - lastTempMediaCleanupAt < TEMP_MEDIA_CLEANUP_INTERVAL_MS) {
    return;
  }
  lastTempMediaCleanupAt = now;

  const result = await cleanupTempInvitationMedia({ execute: true });
  console.info('[cleanup] temp invitation media', {
    aborted: result.aborted,
    abortReason: result.abortReason,
    planned: result.planned,
    deletedR2: result.deletedR2,
    softDeletedDb: result.softDeletedDb,
    failed: result.failed.length,
  });
}

async function runCleanupTick(): Promise<void> {
  try {
    await processPendingCleanupJobs();
  } catch (error) {
    console.error('[cleanupWorker] job tick failed', error);
  }
  try {
    await purgeStaleTempUploads();
  } catch (error) {
    console.error('[cleanupWorker] temp purge failed', error);
  }
  try {
    await purgeUnreferencedTempInvitationMedia();
  } catch (error) {
    console.error('[cleanupWorker] unreferenced invitation media purge failed', error);
  }
  try {
    await runLegacyMediaStorageGradualPurge();
  } catch (error) {
    console.error('[cleanupWorker] legacy gradual purge failed', error);
  }
}

/** 백엔드 프로세스에서 1분 주기로 지연 삭제·temp 정리 실행 */
export function startCleanupWorker(): void {
  void runCleanupTick();
  setInterval(() => {
    void runCleanupTick();
  }, TICK_MS);
}
