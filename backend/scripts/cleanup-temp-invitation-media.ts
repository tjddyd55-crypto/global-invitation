/**
 * Cleanup unreferenced invitation MediaFile uploads past retention.
 *
 * Default: dry-run
 *   npm run invitation:media:cleanup
 *
 * Execute (manual, development only recommended):
 *   npm run invitation:media:cleanup -- --execute
 *
 * Never prints secrets / emails / invitation PII.
 */
import 'dotenv/config';
import { cleanupTempInvitationMedia } from '../src/lib/tempInvitationMedia';

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function main() {
  const execute = hasFlag('--execute');
  const result = await cleanupTempInvitationMedia({
    execute,
    forceManual: execute,
  });

  console.log(
    JSON.stringify(
      {
        dryRun: result.dryRun,
        enabledFlag: result.enabled,
        aborted: result.aborted,
        abortReason: result.abortReason,
        cutoff: result.audit.cutoff,
        retentionHours: result.audit.retentionHours,
        candidateCount: result.audit.candidateCount,
        candidateBytesHuman: formatBytes(result.audit.candidateBytes),
        planned: result.planned,
        deletedR2: result.deletedR2,
        softDeletedDb: result.softDeletedDb,
        failedCount: result.failed.length,
        skippedCount: result.skipped.length,
        failed: result.failed.slice(0, 50),
        skipped: result.skipped.slice(0, 50),
        samplePlannedKeys: result.audit.candidates.slice(0, 20).map((item) => item.objectKey),
      },
      null,
      2
    )
  );

  if (result.aborted && execute) {
    process.exitCode = 3;
  }
  if (result.failed.length > 0) {
    process.exitCode = 4;
  }
}

main().catch((error) => {
  console.error('[cleanup-temp-invitation-media] failed', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
