import { deleteImageByUrl, deleteStoragePrefix, sanitizePathSegment } from './mediaStorage';
import { deleteFile } from '../lib/storage/uploadToR2';

type TemplateMediaCleanupInput = {
  id: string;
  creatorId?: string | null;
  sourceSubmissionId?: string | null;
  previewThumbnailUrl?: string | null;
};

export async function cleanupInvitationMedia(invitationId: string): Promise<number> {
  const normalizedId = sanitizePathSegment(invitationId);
  if (!normalizedId) {
    return 0;
  }
  return deleteStoragePrefix(`invitations/${normalizedId}`);
}

export async function cleanupTemplateMedia(input: TemplateMediaCleanupInput): Promise<number> {
  const templateId = sanitizePathSegment(input.id || '');
  const creatorId = sanitizePathSegment(input.creatorId || '');
  const sourceSubmissionId = sanitizePathSegment(input.sourceSubmissionId || '');

  let deletedCount = 0;
  if (templateId) {
    deletedCount += await deleteStoragePrefix(`templates/thumbnails/${templateId}`);
    await deleteFile(`templates/thumbnails/thumb_${templateId}.webp`).catch(() => undefined);
  }

  if (creatorId && templateId) {
    deletedCount += await deleteStoragePrefix(`creator/${creatorId}/${templateId}`);
  }

  if (creatorId && sourceSubmissionId && sourceSubmissionId !== templateId) {
    deletedCount += await deleteStoragePrefix(`creator/${creatorId}/${sourceSubmissionId}`);
  }

  if (input.previewThumbnailUrl?.trim()) {
    const deleted = await deleteImageByUrl(input.previewThumbnailUrl);
    if (deleted) {
      deletedCount += 1;
    }
  }

  return deletedCount;
}
