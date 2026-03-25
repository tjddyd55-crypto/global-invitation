import prisma from '../lib/prisma';
import { deleteFile, deleteStaleObjectsUnderPrefix } from '../lib/storage/uploadToR2';
import { resolveR2Config } from '../lib/storage/r2Client';

const TICK_MS = 60_000;
const JOB_BATCH_SIZE = 100;
const INVITATION_TEMP_PREFIX = 'invitation/temp/';
const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

  const cutoff = new Date(Date.now() - TEMP_MAX_AGE_MS);
  await deleteStaleObjectsUnderPrefix({
    prefix: INVITATION_TEMP_PREFIX,
    olderThan: cutoff,
    onEachDelete: (key) => console.log('[R2_DELETE]', key),
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
}

/** 백엔드 프로세스에서 1분 주기로 지연 삭제·temp 정리 실행 */
export function startCleanupWorker(): void {
  void runCleanupTick();
  setInterval(() => {
    void runCleanupTick();
  }, TICK_MS);
}
