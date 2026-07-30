/**
 * Archive development QA placeholder shared music by objectKey.
 * Does not print secrets. Safe to re-run (idempotent archive).
 *
 * Usage (from backend/):
 *   npx tsx scripts/archive-qa-placeholder-music.ts
 */
import 'dotenv/config';
import { archiveUnplayableTrackByObjectKey } from '../src/services/invitationMusicLibraryService';

const QA_OBJECT_KEY =
  'invitation/shared/music/common/522f5ab3-9a7d-4987-85a1-4441566dbe0e.mp3';

async function main() {
  const track = await archiveUnplayableTrackByObjectKey(QA_OBJECT_KEY);
  console.log(
    JSON.stringify({
      ok: true,
      id: track.id,
      title: track.title,
      isActive: track.isActive,
      isArchived: track.isArchived,
      fileSize: track.fileSize,
      objectKey: track.objectKey,
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      code: error instanceof Error ? error.message : 'UNKNOWN',
    })
  );
  process.exit(1);
});
