/**
 * Dry-run audit for unreferenced invitation MediaFile uploads past retention.
 *
 *   npm run invitation:media:audit
 *
 * Never deletes. Secrets are never printed.
 */
import 'dotenv/config';
import { auditTempInvitationMedia } from '../src/lib/tempInvitationMedia';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function countByReason(exclusions: Array<{ reason: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of exclusions) {
    out[item.reason] = (out[item.reason] || 0) + 1;
  }
  return out;
}

async function main() {
  const report = await auditTempInvitationMedia();

  console.log(
    JSON.stringify(
      {
        mode: 'DRY_RUN',
        cutoff: report.cutoff,
        retentionHours: report.retentionHours,
        referenceScanStatus: report.referenceScanStatus,
        referenceScanError: report.referenceScanError,
        invitationRowsScanned: report.activeInvitationCount,
        mediaFileScanned: report.mediaFileScanned,
        candidateCount: report.candidateCount,
        candidateBytes: report.candidateBytes,
        candidateBytesHuman: formatBytes(report.candidateBytes),
        ageBuckets: report.ageBuckets,
        exclusionReasons: countByReason(report.exclusions),
        sampleCandidates: report.candidates.slice(0, 20).map((item) => ({
          mediaFileId: item.mediaFileId,
          objectKey: item.objectKey,
          fileSize: item.fileSize,
          createdAt: item.createdAt.toISOString(),
          usage: item.usage,
          ownerRefId: item.ownerRefId,
        })),
        deletedCount: 0,
      },
      null,
      2
    )
  );

  if (report.referenceScanStatus === 'failed') {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error('[audit-temp-invitation-media] failed', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
