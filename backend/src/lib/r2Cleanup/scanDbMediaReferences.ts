import prisma from '../prisma';

export type DbReferenceHit = {
  key: string;
  source: string;
  archived: boolean;
};

export type DbReferenceIndex = {
  status: 'ok' | 'failed';
  errorMessage?: string;
  hitsByKey: Map<string, DbReferenceHit[]>;
  scannedSources: string[];
};

const CDN_HOST_HINT = 'cdn.platform-assets.com';

function collectKeysFromText(text: string, into: Set<string>): void {
  if (!text) return;

  // Absolute CDN URLs
  const urlRegex = /https?:\/\/cdn\.platform-assets\.com\/([^\s"'\\]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const key = decodeURIComponent(match[1].split('?')[0] || '').replace(/^\/+/, '');
    if (key) into.add(key);
  }

  // Bare object keys that look like storage paths
  const keyRegex =
    /\b((?:invitation|invitations|invite|development\/invitation|production\/invitation|users\/[^"'\\s]+\/invitations)\/[^\s"'\\]+)/gi;
  while ((match = keyRegex.exec(text)) !== null) {
    const key = match[1].replace(/^\/+/, '');
    if (key && !key.includes('://')) into.add(key);
  }
}

function walkJson(value: unknown, into: Set<string>, depth = 0): void {
  if (depth > 12 || value == null) return;
  if (typeof value === 'string') {
    collectKeysFromText(value, into);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, into, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      walkJson(nested, into, depth + 1);
    }
  }
}

function addHits(
  index: Map<string, DbReferenceHit[]>,
  keys: Set<string>,
  source: string,
  archived: boolean
) {
  for (const key of keys) {
    const list = index.get(key) || [];
    list.push({ key, source, archived });
    index.set(key, list);
  }
}

/**
 * Collect R2 object keys referenced from invitation-related tables / JSON.
 * On failure returns status=failed so callers must protect all candidates.
 */
export async function scanDbMediaReferences(): Promise<DbReferenceIndex> {
  const hitsByKey = new Map<string, DbReferenceHit[]>();
  const scannedSources: string[] = [];

  try {
    // InvitationMusicTrack
    scannedSources.push('InvitationMusicTrack');
    const musicTracks = await prisma.invitationMusicTrack.findMany({
      select: { objectKey: true, publicUrl: true, isArchived: true },
    });
    for (const track of musicTracks) {
      const keys = new Set<string>();
      if (track.objectKey) keys.add(track.objectKey.replace(/^\/+/, ''));
      collectKeysFromText(track.publicUrl || '', keys);
      addHits(hitsByKey, keys, 'InvitationMusicTrack', track.isArchived);
    }

    // MediaFile
    scannedSources.push('MediaFile');
    const mediaFiles = await prisma.mediaFile.findMany({
      select: { objectKey: true, publicUrl: true, url: true },
    });
    for (const file of mediaFiles) {
      const keys = new Set<string>();
      if (file.objectKey) keys.add(file.objectKey.replace(/^\/+/, ''));
      collectKeysFromText(file.publicUrl || '', keys);
      collectKeysFromText(file.url || '', keys);
      addHits(hitsByKey, keys, 'MediaFile', false);
    }

    // Template thumbs
    scannedSources.push('Template');
    const templates = await prisma.template.findMany({
      select: {
        thumbnailObjectKey: true,
        thumbnailUrl: true,
        previewThumbnailObjectKey: true,
        previewThumbnailUrl: true,
      },
    });
    for (const template of templates) {
      const keys = new Set<string>();
      if (template.thumbnailObjectKey) keys.add(template.thumbnailObjectKey);
      if (template.previewThumbnailObjectKey) keys.add(template.previewThumbnailObjectKey);
      collectKeysFromText(template.thumbnailUrl || '', keys);
      collectKeysFromText(template.previewThumbnailUrl || '', keys);
      addHits(hitsByKey, keys, 'Template', false);
    }

    scannedSources.push('TemplateSubmission');
    const submissions = await prisma.templateSubmission.findMany({
      select: { previewThumbnailObjectKey: true, previewThumbnailUrl: true },
    });
    for (const submission of submissions) {
      const keys = new Set<string>();
      if (submission.previewThumbnailObjectKey) {
        keys.add(submission.previewThumbnailObjectKey);
      }
      collectKeysFromText(submission.previewThumbnailUrl || '', keys);
      addHits(hitsByKey, keys, 'TemplateSubmission', false);
    }

    // Invitation JSON + musicKey
    scannedSources.push('Invitation');
    const invitations = await prisma.invitation.findMany({
      select: {
        id: true,
        musicKey: true,
        data: true,
        dataJson: true,
        isDeleted: true,
      },
    });
    for (const invitation of invitations) {
      const keys = new Set<string>();
      if (invitation.musicKey) {
        collectKeysFromText(invitation.musicKey, keys);
      }
      walkJson(invitation.data, keys);
      walkJson(invitation.dataJson, keys);
      addHits(hitsByKey, keys, `Invitation:${invitation.id}`, invitation.isDeleted);
    }

    // CleanupJob keys (historical)
    scannedSources.push('CleanupJob');
    const jobs = await prisma.cleanupJob.findMany({
      select: { r2Key: true },
      take: 50_000,
    });
    for (const job of jobs) {
      if (!job.r2Key) continue;
      addHits(hitsByKey, new Set([job.r2Key.replace(/^\/+/, '')]), 'CleanupJob', true);
    }

    return { status: 'ok', hitsByKey, scannedSources };
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'DB_SCAN_FAILED',
      hitsByKey,
      scannedSources,
    };
  }
}

export function resolveDbReferenceStatus(
  key: string,
  index: DbReferenceIndex
): {
  status:
    | 'DB_ACTIVE_REFERENCE'
    | 'DB_ARCHIVED_REFERENCE'
    | 'DB_REFERENCE_NOT_FOUND'
    | 'REFERENCE_CHECK_FAILED';
  count: number;
} {
  if (index.status === 'failed') {
    return { status: 'REFERENCE_CHECK_FAILED', count: 0 };
  }
  const hits = index.hitsByKey.get(key) || [];
  // Also match if any hit key equals or URL contained key
  if (hits.length === 0) {
    // secondary: CDN-relative match without host in map
    for (const [mappedKey, mappedHits] of index.hitsByKey) {
      if (mappedKey === key || mappedKey.endsWith(`/${key}`) || key.endsWith(`/${mappedKey}`)) {
        const archivedOnly = mappedHits.every((hit) => hit.archived);
        return {
          status: archivedOnly ? 'DB_ARCHIVED_REFERENCE' : 'DB_ACTIVE_REFERENCE',
          count: mappedHits.length,
        };
      }
    }
    return { status: 'DB_REFERENCE_NOT_FOUND', count: 0 };
  }
  const archivedOnly = hits.every((hit) => hit.archived);
  return {
    status: archivedOnly ? 'DB_ARCHIVED_REFERENCE' : 'DB_ACTIVE_REFERENCE',
    count: hits.length,
  };
}

export function dbIndexMentionsHost(index: DbReferenceIndex): boolean {
  for (const key of index.hitsByKey.keys()) {
    if (key.includes(CDN_HOST_HINT)) return true;
  }
  return false;
}
