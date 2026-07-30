import { archiveUnplayableTrackByObjectKey } from '../../services/invitationMusicLibraryService';

/** Known development QA placeholder — forged MPEG header, 2048B, MediaError 4. */
export const KNOWN_INVALID_SHARED_MUSIC_OBJECT_KEYS = [
  'invitation/shared/music/common/522f5ab3-9a7d-4987-85a1-4441566dbe0e.mp3',
] as const;

/**
 * Best-effort archive of known unplayable development placeholders.
 * Safe to re-run. Never touches unrelated tracks.
 */
export async function archiveKnownInvalidSharedMusic(): Promise<void> {
  // Only auto-clean the known development QA stub on Railway development.
  if ((process.env.RAILWAY_ENVIRONMENT_NAME || '').toLowerCase() !== 'development') {
    return;
  }

  for (const objectKey of KNOWN_INVALID_SHARED_MUSIC_OBJECT_KEYS) {
    try {
      const track = await archiveUnplayableTrackByObjectKey(objectKey);
      console.log('[music] archived known invalid shared track', {
        id: track.id,
        objectKey: track.objectKey,
        fileSize: track.fileSize,
        isArchived: track.isArchived,
        isActive: track.isActive,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      if (code === 'MUSIC_TRACK_NOT_FOUND') {
        console.log('[music] known invalid shared track already absent', { objectKey });
        continue;
      }
      console.warn('[music] failed to archive known invalid shared track', {
        objectKey,
        code,
      });
    }
  }
}
