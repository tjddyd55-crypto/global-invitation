import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { resolveKeyFromPublicUrl } from '../lib/storage/r2Client';
import { deleteFile, listAllObjectKeysUnderPrefix } from '../lib/storage/uploadToR2';
import { invitationEntityPrefix, templateEntityPrefix } from '../lib/media/keys';
import { deleteImageByUrl, deleteStoragePrefix, sanitizePathSegment } from './mediaStorage';

type TemplateMediaCleanupInput = {
  id: string;
  creatorId?: string | null;
  sourceSubmissionId?: string | null;
  previewThumbnailUrl?: string | null;
};

function collectHttpUrlsFromJson(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      out.add(trimmed);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectHttpUrlsFromJson(item, out);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectHttpUrlsFromJson(nested, out);
    }
  }
}

function tryResolveR2KeyFromUrl(url: string): string | null {
  try {
    return resolveKeyFromPublicUrl(url);
  } catch {
    return null;
  }
}

/** 소프트 삭제 시 cleanup_jobs 적재용 R2 객체 키 목록 (중복 제거) */
export async function collectInvitationCleanupR2Keys(params: {
  invitationId: string;
  dataJson: Prisma.JsonValue | null;
  data: Prisma.JsonValue | null;
}): Promise<string[]> {
  const normalizedId = sanitizePathSegment(params.invitationId);
  const unique = new Set<string>();

  const entityPrefix = normalizedId.length > 0 ? invitationEntityPrefix(normalizedId) : '';
  const prefixes =
    normalizedId.length > 0
      ? [
          entityPrefix,
          `invitation/invitations/${normalizedId}/`,
          `invitation/hero/${normalizedId}/`,
          `invitation/gallery/${normalizedId}/`,
          `invitations/${normalizedId}/`,
        ]
      : [];

  for (const prefix of prefixes) {
    try {
      const listed = await listAllObjectKeysUnderPrefix(prefix);
      for (const key of listed) {
        unique.add(key);
      }
    } catch (error) {
      console.warn('[cleanup] list prefix failed', prefix, error);
    }
  }

  const urlSet = new Set<string>();
  collectHttpUrlsFromJson(params.dataJson, urlSet);
  collectHttpUrlsFromJson(params.data, urlSet);
  for (const url of urlSet) {
    const key = tryResolveR2KeyFromUrl(url);
    if (key) {
      unique.add(key);
    }
  }

  const mediaRows = await prisma.mediaFile.findMany({
    where: {
      ownerType: 'INVITATION',
      ownerRefId: params.invitationId,
      deletedAt: null,
    },
    select: { objectKey: true },
  });
  for (const row of mediaRows) {
    const key = row.objectKey?.trim();
    if (key) {
      unique.add(key);
    }
  }

  return Array.from(unique);
}

export async function cleanupInvitationMedia(invitationId: string): Promise<number> {
  const normalizedId = sanitizePathSegment(invitationId);
  if (!normalizedId) {
    return 0;
  }
  let n = 0;
  const canonicalPrefix = invitationEntityPrefix(normalizedId).replace(/\/$/, '');
  n += await deleteStoragePrefix(canonicalPrefix);
  n += await deleteStoragePrefix(`invitation/invitations/${normalizedId}`);
  n += await deleteStoragePrefix(`invitation/hero/${normalizedId}`);
  n += await deleteStoragePrefix(`invitation/gallery/${normalizedId}`);
  n += await deleteStoragePrefix(`invitations/${normalizedId}`);
  return n;
}

export async function cleanupTemplateMedia(input: TemplateMediaCleanupInput): Promise<number> {
  const templateId = sanitizePathSegment(input.id || '');
  const creatorId = sanitizePathSegment(input.creatorId || '');
  const sourceSubmissionId = sanitizePathSegment(input.sourceSubmissionId || '');

  let deletedCount = 0;
  if (templateId) {
    const canonicalTplPrefix = templateEntityPrefix(templateId).replace(/\/$/, '');
    deletedCount += await deleteStoragePrefix(canonicalTplPrefix);
    deletedCount += await deleteStoragePrefix(`invitation/templates/${templateId}`);
    deletedCount += await deleteStoragePrefix(`invitation/thumbnails/${templateId}`);
    await deleteFile(`invitation/thumbnails/${templateId}.jpg`).catch(() => undefined);
    await deleteFile(`invitation/thumbnails/thumb_${templateId}.jpg`).catch(() => undefined);
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
