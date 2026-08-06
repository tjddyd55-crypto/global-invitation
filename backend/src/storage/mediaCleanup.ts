import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { resolveKeyFromPublicUrl } from '../lib/storage/r2Client';
import {
  deleteFile,
  deleteStaleObjectsUnderPrefix,
  deleteStaleObjectsUnderPrefixCapped,
  listAllObjectKeysUnderPrefix,
} from '../lib/storage/uploadToR2';
import { invitationEntityPrefix, templateEntityPrefix } from '../lib/media/keys';
import {
  getInvitationAssetEnvironment,
  getInvitationRootPrefix,
  parseInvitationUserAssetKey,
} from '../lib/invitationAssetKeys';
import { deleteImageByUrl, deleteMediaObjectKey, deleteStoragePrefix, sanitizePathSegment } from './mediaStorage';

/** 신규 업로드에서는 사용하지 않는 구 스토리지 경로 (점진 삭제 대상) */
export const LEGACY_MEDIA_STORAGE_PREFIXES = [
  'invitations/',
  'templates/thumbnails/',
  'creator/',
  'users/',
] as const;

let legacyPurgePrefixRotation = 0;

/**
 * 환경 변수 LEGACY_R2_GRADUAL_PURGE=true 일 때만 동작.
 * 오래된 객체(기본 90일, LEGACY_R2_PURGE_MIN_AGE_DAYS)를 틱당 상한(기본 200)만 삭제.
 */
export async function runLegacyMediaStorageGradualPurge(): Promise<number> {
  if (process.env.LEGACY_R2_GRADUAL_PURGE !== 'true') {
    return 0;
  }
  const maxPerTick = Math.min(
    5000,
    Math.max(1, Number(process.env.LEGACY_R2_PURGE_MAX_PER_TICK) || 200)
  );
  const minAgeDays = Math.max(1, Number(process.env.LEGACY_R2_PURGE_MIN_AGE_DAYS) || 90);
  const olderThan = new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000);
  const prefixes = LEGACY_MEDIA_STORAGE_PREFIXES;
  const prefix = prefixes[legacyPurgePrefixRotation % prefixes.length] || prefixes[0];
  legacyPurgePrefixRotation += 1;

  const deleted = await deleteStaleObjectsUnderPrefixCapped({
    prefix,
    olderThan,
    maxDeletes: maxPerTick,
    onEachDelete: (key) => console.log('[R2_DELETE_LEGACY]', key),
  });
  if (deleted > 0) {
    console.info('[cleanup] legacy gradual purge', {
      prefix,
      deleted,
      minAgeDays,
      olderThan: olderThan.toISOString(),
    });
  }
  return deleted;
}

/** 스펙 기준 스테이징 temp/{sessionId}/… 및 invitation/{env}/temp/ 스테이징 정리 */
export async function purgeStaleTempStagingObjects(maxAgeMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const onDelete = (key: string) => console.log('[R2_DELETE]', key);
  let total = 0;
  total += await deleteStaleObjectsUnderPrefix({
    prefix: 'temp/',
    olderThan: cutoff,
    onEachDelete: onDelete,
  });
  total += await deleteStaleObjectsUnderPrefix({
    prefix: 'invitation/temp/',
    olderThan: cutoff,
    onEachDelete: onDelete,
  });
  // Canonical staging: invitation/{environment}/temp/{userId}/...
  total += await deleteStaleObjectsUnderPrefix({
    prefix: 'invitation/development/temp/',
    olderThan: cutoff,
    onEachDelete: onDelete,
  });
  total += await deleteStaleObjectsUnderPrefix({
    prefix: 'invitation/production/temp/',
    olderThan: cutoff,
    onEachDelete: onDelete,
  });
  return total;
}

type TemplateMediaCleanupInput = {
  id: string;
  creatorId?: string | null;
  sourceSubmissionId?: string | null;
  previewThumbnailUrl?: string | null;
  previewThumbnailObjectKey?: string | null;
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
    select: { objectKey: true, ownerId: true },
  });

  const canonicalPrefixes = new Set<string>();
  for (const row of mediaRows) {
    const key = row.objectKey?.trim();
    if (!key) continue;
    unique.add(key);
    const parsed = parseInvitationUserAssetKey(key);
    if (parsed?.variant === 'canonical') {
      canonicalPrefixes.add(
        [
          getInvitationRootPrefix(),
          parsed.environment,
          'users',
          parsed.userId,
          'invitations',
          parsed.invitationId,
          '',
        ].join('/')
      );
    }
  }

  for (const ownerId of new Set(mediaRows.map((row) => row.ownerId).filter(Boolean))) {
    canonicalPrefixes.add(
      [
        getInvitationRootPrefix(),
        getInvitationAssetEnvironment(),
        'users',
        sanitizePathSegment(ownerId),
        'invitations',
        normalizedId,
        '',
      ].join('/')
    );
  }

  for (const canonicalPrefix of canonicalPrefixes) {
    try {
      const listed = await listAllObjectKeysUnderPrefix(canonicalPrefix);
      for (const listedKey of listed) unique.add(listedKey);
    } catch (error) {
      console.warn('[cleanup] list canonical invitation prefix failed', canonicalPrefix, error);
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

  const previewKey = input.previewThumbnailObjectKey?.trim();
  if (previewKey) {
    await deleteMediaObjectKey(previewKey).catch((error) => {
      console.warn('[cleanup] delete preview object key failed', previewKey, error);
    });
    deletedCount += 1;
  } else if (input.previewThumbnailUrl?.trim()) {
    const deleted = await deleteImageByUrl(input.previewThumbnailUrl);
    if (deleted) {
      deletedCount += 1;
    }
  }

  return deletedCount;
}
