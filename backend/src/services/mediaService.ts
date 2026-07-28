import crypto from 'crypto';
import sharp from 'sharp';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { isUuid } from '../lib/isUuid';
import {
  assertCanonicalInvitationUserAssetKey,
  assertNotPathTraversal,
  buildInvitationTempKey,
  getInvitationAssetPublicUrl,
  isSharedInvitationAssetKey,
  parseInvitationUserAssetKey,
} from '../lib/invitationAssetKeys';
import {
  buildMediaObjectKey,
  buildTempObjectKey,
  isTempStagingKey,
  parseInvitationOptimizedOriginalKey,
  parseMediaObjectKey,
  usageFromScope,
  type MediaScope,
  type MediaUsage,
  type ParsedMediaObjectKey,
} from '../lib/media/keys';
import { prepareInvitationOptimizedUploads } from '../lib/imageProcessor';
import { buildCanonicalPublicUrl } from '../lib/mediaKeyBuilder';
import { createPresignedUploadUrl, headObject, type HeadObjectResult } from '../lib/media/r2';
import { deleteFile, readFileBuffer, uploadFile } from '../lib/storage/uploadToR2';
import { canDeleteByStorageKey, isMediaTemplatePrivilegedRole } from '../lib/media/mediaDeleteAuthorization';
import { deleteStoredMediaByObjectKey, resolveStorageKeyFromUrl } from '../storage/mediaStorage';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
const SHARP_PIXEL_CAP = 60_000_000;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a']);
const SUPPORTED_SCOPES = new Set<MediaScope>([
  'invitationHero',
  'invitationGallery',
  'invitationCoupleGroom',
  'invitationCoupleBride',
  'invitationMusic',
  'templateCover',
  'templateHero',
  'templateAsset',
  'common',
]);

const INVITATION_SCOPES = new Set<MediaScope>([
  'invitationHero',
  'invitationGallery',
  'invitationCoupleGroom',
  'invitationCoupleBride',
  'invitationMusic',
]);

export type MediaAuthUser = {
  id: string;
  role: string;
};

export type PresignMediaInput = {
  scope: MediaScope;
  invitationId?: string;
  templateId?: string;
  filename?: string;
  contentType: string;
  size: number;
  expiresInSeconds?: number;
};

export type PresignMediaResult = {
  /** R2 PUT 대상 (temp/...) */
  stagingObjectKey: string;
  /** 확정 후 최종 키 (entity 또는 temp) */
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
  usage: MediaUsage;
};

export type ConfirmMediaInput = {
  /** 스테이징 키. common 은 objectKey 와 동일할 수 있음 */
  stagingObjectKey?: string;
  objectKey: string;
  publicUrl?: string;
  contentType?: string;
  size?: number;
  width?: number;
  height?: number;
  usage?: MediaUsage;
  invitationId?: string;
  templateId?: string;
};

export type ConfirmMediaResult = {
  mediaId: string;
  objectKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  usage: MediaUsage;
};

type ResolvedOwner =
  | { ownerType: 'INVITATION'; ownerRefId: string }
  | { ownerType: 'TEMPLATE'; ownerRefId: string }
  | { ownerType: 'COMMON'; ownerRefId: null };

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
}

function normalizeNullableImageDimension(value: unknown): number | null {
  const normalized = normalizePositiveInteger(value);
  if (!normalized) return null;
  return Math.min(10_000, normalized);
}

function resolveFileNameFromObjectKey(objectKey: string): string {
  const segments = objectKey.split('/').filter(Boolean);
  return segments[segments.length - 1] || 'file';
}

function ensureAllowedContentType(contentType: string, scope?: MediaScope): string {
  const normalized = normalizeText(contentType).toLowerCase();
  if (!normalized) {
    throw new Error('UNSUPPORTED_MEDIA_TYPE');
  }
  if (scope === 'invitationMusic' || (!scope && ALLOWED_AUDIO_TYPES.has(normalized))) {
    if (!ALLOWED_AUDIO_TYPES.has(normalized)) {
      throw new Error('UNSUPPORTED_MEDIA_TYPE');
    }
    return normalized;
  }
  if (!ALLOWED_IMAGE_TYPES.has(normalized)) {
    throw new Error('UNSUPPORTED_MEDIA_TYPE');
  }
  return normalized;
}

function ensureAllowedSize(size: number, scope?: MediaScope): number {
  const normalized = normalizePositiveInteger(size);
  if (!normalized) {
    throw new Error('INVALID_MEDIA_SIZE');
  }
  const max = scope === 'invitationMusic' ? MAX_AUDIO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (normalized > max) {
    throw new Error('FILE_TOO_LARGE');
  }
  return normalized;
}

function isCreatorRole(role: string): boolean {
  return role === 'CREATOR' || role === 'ADMIN';
}

async function resolveOwnedInvitationId(userId: string, identifier: string): Promise<string> {
  const normalized = normalizeText(identifier);
  if (!normalized) throw new Error('INVITATION_ID_REQUIRED');

  const invitation = await prisma.invitation.findFirst({
    where: isUuid(normalized)
      ? {
          userId,
          isDeleted: false,
          OR: [{ id: normalized }, { slug: normalized }],
        }
      : {
          userId,
          isDeleted: false,
          slug: normalized,
        },
    select: {
      id: true,
    },
  });
  if (!invitation) {
    throw new Error('UNAUTHORIZED_MEDIA_ACCESS');
  }
  return invitation.id;
}

async function resolveOwnedTemplateId(user: MediaAuthUser, templateId: string): Promise<string> {
  const normalized = normalizeText(templateId);
  if (!normalized || !isUuid(normalized)) {
    throw new Error('TEMPLATE_ID_REQUIRED');
  }
  if (!isCreatorRole(user.role)) {
    throw new Error('UNAUTHORIZED_MEDIA_ACCESS');
  }

  const submission = await prisma.templateSubmission.findFirst({
    where: {
      id: normalized,
      creatorId: user.id,
    },
    select: {
      id: true,
    },
  });
  if (submission) {
    return submission.id;
  }

  const template = await prisma.template.findFirst({
    where: {
      id: normalized,
      creatorId: user.id,
    },
    select: {
      id: true,
    },
  });
  if (!template) {
    throw new Error('UNAUTHORIZED_MEDIA_ACCESS');
  }
  return template.id;
}

function resolveOwnerFromParsedObjectKey(parsed: NonNullable<ReturnType<typeof parseMediaObjectKey>>): ResolvedOwner {
  if (INVITATION_SCOPES.has(parsed.scope)) {
    return {
      ownerType: 'INVITATION',
      ownerRefId: (parsed as { invitationId: string }).invitationId,
    };
  }
  if (parsed.scope === 'templateCover' || parsed.scope === 'templateAsset' || parsed.scope === 'templateHero') {
    return {
      ownerType: 'TEMPLATE',
      ownerRefId: parsed.templateId,
    };
  }
  return { ownerType: 'COMMON', ownerRefId: null };
}

function resolveEffectiveMeta(input: ConfirmMediaInput, head: HeadObjectResult) {
  const contentType = normalizeText(input.contentType).toLowerCase() || (head.contentType || '').toLowerCase();
  const safeContentType = ensureAllowedContentType(contentType);

  const fileSize = normalizePositiveInteger(input.size) || head.contentLength || 0;
  if (!fileSize) {
    throw new Error('INVALID_MEDIA_SIZE');
  }
  const maxBytes = ALLOWED_AUDIO_TYPES.has(safeContentType) ? MAX_AUDIO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (fileSize > maxBytes) {
    throw new Error('FILE_TOO_LARGE');
  }

  return {
    contentType: safeContentType,
    fileSize,
  };
}

async function upsertInvitationMediaReference(params: {
  invitationId: string;
  userId: string;
  scope: 'invitationHero' | 'invitationGallery';
  publicUrl: string;
  objectKey: string;
}) {
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: params.invitationId,
      userId: params.userId,
      isDeleted: false,
    },
    select: {
      id: true,
      data: true,
      dataJson: true,
    },
  });
  if (!invitation) {
    return;
  }

  const baseData =
    invitation.dataJson && typeof invitation.dataJson === 'object' && !Array.isArray(invitation.dataJson)
      ? { ...(invitation.dataJson as Record<string, unknown>) }
      : invitation.data && typeof invitation.data === 'object' && !Array.isArray(invitation.data)
        ? { ...(invitation.data as Record<string, unknown>) }
        : {};

  if (params.scope === 'invitationHero') {
    baseData.heroImage = params.publicUrl;
    baseData.heroImageKey = params.objectKey;
  } else {
    const isDemoGalleryUrl = (url: string): boolean => {
      const path = url.split('?')[0] || url;
      return (
        /^\/images\/(wedding|funeral|general)\/classic\/gallery(_\d+)?\.(jpe?g|png|webp)$/i.test(path) ||
        (/\/images\//.test(path) && /\/gallery_\d+\.(jpe?g|png|webp)$/i.test(path))
      );
    };
    const prevGallery = Array.isArray(baseData.galleryImages) ? baseData.galleryImages : [];
    const normalizedGallery = prevGallery
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'url' in item && typeof (item as { url: unknown }).url === 'string') {
          return ((item as { url: string }).url || '').trim();
        }
        return '';
      })
      .filter((url): url is string => Boolean(url) && !isDemoGalleryUrl(url));
    const galleryMedia = Array.isArray(baseData.galleryMedia)
      ? ([...(baseData.galleryMedia as { url: string; key: string }[])]).filter(
          (m) => m?.url && !isDemoGalleryUrl(String(m.url))
        )
      : [];
    if (!normalizedGallery.includes(params.publicUrl)) {
      normalizedGallery.push(params.publicUrl);
    }
    if (!galleryMedia.some((m) => m.url === params.publicUrl || m.key === params.objectKey)) {
      galleryMedia.push({ url: params.publicUrl, key: params.objectKey });
    }
    baseData.galleryImages = normalizedGallery;
    baseData.galleryMedia = galleryMedia;
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      data: baseData as Prisma.InputJsonValue,
      dataJson: baseData as Prisma.InputJsonValue,
    },
  });
}

async function upsertTemplateHeroInStudioConfig(params: {
  templateId: string;
  userId: string;
  publicUrl: string;
  objectKey: string;
}) {
  const [submission, templateRow] = await Promise.all([
    prisma.templateSubmission.findFirst({
      where: {
        id: params.templateId,
        creatorId: params.userId,
      },
      select: { studioConfig: true },
    }),
    prisma.template.findFirst({
      where: {
        id: params.templateId,
        creatorId: params.userId,
      },
      select: { studioConfig: true },
    }),
  ]);

  const mergeConfig = (existing: unknown): Prisma.InputJsonValue => {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    base.heroImage = params.publicUrl;
    base.heroImageKey = params.objectKey;
    return base as Prisma.InputJsonValue;
  };

  await Promise.all([
    submission
      ? prisma.templateSubmission.updateMany({
          where: { id: params.templateId, creatorId: params.userId },
          data: { studioConfig: mergeConfig(submission.studioConfig) },
        })
      : Promise.resolve({ count: 0 }),
    templateRow
      ? prisma.template.updateMany({
          where: { id: params.templateId, creatorId: params.userId },
          data: { studioConfig: mergeConfig(templateRow.studioConfig) },
        })
      : Promise.resolve({ count: 0 }),
  ]);
}

async function upsertTemplateMediaReference(params: {
  templateId: string;
  userId: string;
  scope: 'templateCover' | 'templateAsset';
  publicUrl: string;
  objectKey: string;
}) {
  if (params.scope !== 'templateCover') {
    return;
  }

  await Promise.all([
    prisma.templateSubmission.updateMany({
      where: {
        id: params.templateId,
        creatorId: params.userId,
      },
      data: {
        previewThumbnailUrl: params.publicUrl,
        previewThumbnailObjectKey: params.objectKey,
      },
    }),
    prisma.template.updateMany({
      where: {
        id: params.templateId,
        creatorId: params.userId,
      },
      data: {
        thumbnailUrl: params.publicUrl,
        previewThumbnailUrl: params.publicUrl,
        thumbnailObjectKey: params.objectKey,
        previewThumbnailObjectKey: params.objectKey,
      },
    }),
  ]);
}

async function writeJpegWithThumb(mainKey: string, thumbKey: string, source: Buffer): Promise<void> {
  await uploadFile(source, mainKey, 'image/jpeg');
  const thumb = await sharp(source, { failOn: 'none', limitInputPixels: SHARP_PIXEL_CAP })
    .rotate()
    .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await uploadFile(thumb, thumbKey, 'image/jpeg');
  console.log('[R2_KEY]', mainKey);
  console.log('[R2_KEY]', thumbKey);
}

async function assertAuthForFinalKey(
  finalKey: string,
  user: MediaAuthUser,
  input: ConfirmMediaInput
): Promise<{ parsed: ParsedMediaObjectKey; owner: ResolvedOwner }> {
  const parsed = parseMediaObjectKey(finalKey);
  if (!parsed) {
    throw new Error('INVALID_MEDIA_OBJECT_KEY');
  }
  const owner = resolveOwnerFromParsedObjectKey(parsed);

  if (INVITATION_SCOPES.has(parsed.scope)) {
    const invitationId = await resolveOwnedInvitationId(
      user.id,
      (parsed as { invitationId: string }).invitationId
    );
    if (invitationId !== (parsed as { invitationId: string }).invitationId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
    if (input.invitationId && normalizeText(input.invitationId) !== invitationId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
    const userScoped = parseInvitationUserAssetKey(finalKey);
    if (userScoped && userScoped.userId !== user.id) {
      throw new Error('UNAUTHORIZED_MEDIA_ACCESS');
    }
    if (isSharedInvitationAssetKey(finalKey)) {
      throw new Error('SHARED_ASSET_UPLOAD_DENIED');
    }
  }

  if (parsed.scope === 'templateCover' || parsed.scope === 'templateAsset' || parsed.scope === 'templateHero') {
    const templateId = await resolveOwnedTemplateId(user, parsed.templateId);
    if (templateId !== parsed.templateId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
    if (input.templateId && normalizeText(input.templateId) !== templateId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
  }

  return { parsed, owner };
}

export async function createMediaPresign(
  input: PresignMediaInput,
  user: MediaAuthUser
): Promise<PresignMediaResult> {
  const scope = input.scope;
  if (!SUPPORTED_SCOPES.has(scope)) {
    throw new Error('INVALID_MEDIA_SCOPE');
  }
  const contentType = ensureAllowedContentType(input.contentType, scope);
  const size = ensureAllowedSize(input.size, scope);

  if (
    scope === 'invitationHero' ||
    scope === 'invitationGallery' ||
    scope === 'invitationCoupleGroom' ||
    scope === 'invitationCoupleBride' ||
    scope === 'templateHero'
  ) {
    if (contentType !== 'image/jpeg') {
      throw new Error('UNSUPPORTED_MEDIA_TYPE');
    }
  }

  const presignNow = new Date();
  const stagingObjectKey = buildInvitationTempKey({
    userId: user.id,
    contentType,
    filename: input.filename,
  });

  let objectKey: string;

  if (scope === 'common') {
    objectKey = stagingObjectKey;
  } else if (INVITATION_SCOPES.has(scope)) {
    const invitationId = await resolveOwnedInvitationId(user.id, input.invitationId || '');
    objectKey = buildMediaObjectKey({
      scope: scope as
        | 'invitationHero'
        | 'invitationGallery'
        | 'invitationCoupleGroom'
        | 'invitationCoupleBride'
        | 'invitationMusic',
      invitationId,
      userId: user.id,
      contentType,
      filename: input.filename,
      now: presignNow,
    });
  } else if (scope === 'templateCover' || scope === 'templateAsset' || scope === 'templateHero') {
    const templateId = await resolveOwnedTemplateId(user, input.templateId || '');
    objectKey = buildMediaObjectKey({
      scope,
      templateId,
      contentType,
      filename: input.filename,
      now: presignNow,
    });
  } else {
    objectKey = stagingObjectKey;
  }

  assertNotPathTraversal(stagingObjectKey);
  assertNotPathTraversal(objectKey);
  if (isSharedInvitationAssetKey(objectKey)) {
    throw new Error('SHARED_ASSET_UPLOAD_DENIED');
  }
  if (INVITATION_SCOPES.has(scope)) {
    assertCanonicalInvitationUserAssetKey(objectKey);
  }

  const presigned = await createPresignedUploadUrl({
    objectKey: stagingObjectKey,
    contentType,
    expiresInSeconds: input.expiresInSeconds,
  });

  const publicUrl = getInvitationAssetPublicUrl(objectKey);
  console.log('[R2_KEY]', stagingObjectKey);
  if (objectKey !== stagingObjectKey) {
    console.log('[R2_KEY]', objectKey);
  }
  console.log('[R2_UPLOAD]', { staging: stagingObjectKey, final: objectKey, url: publicUrl });
  console.info('[media.presign]', {
    userId: user.id,
    scope,
    stagingObjectKey,
    objectKey,
    contentType,
    size,
  });

  return {
    stagingObjectKey,
    objectKey,
    uploadUrl: presigned.uploadUrl,
    publicUrl,
    expiresIn: presigned.expiresIn,
    usage: usageFromScope(scope),
  };
}

export async function confirmMediaUpload(
  input: ConfirmMediaInput,
  user: MediaAuthUser
): Promise<ConfirmMediaResult> {
  const finalObjectKey = normalizeText(input.objectKey).replace(/^\/+/, '');
  if (!finalObjectKey) {
    throw new Error('OBJECT_KEY_REQUIRED');
  }

  const stagingObjectKey = normalizeText(input.stagingObjectKey || '').replace(/^\/+/, '') || finalObjectKey;

  if (finalObjectKey !== stagingObjectKey && !isTempStagingKey(stagingObjectKey)) {
    throw new Error('INVALID_STAGING_OBJECT_KEY');
  }

  const stagingState = await headObject(stagingObjectKey);
  if (!stagingState.exists) {
    throw new Error('MEDIA_OBJECT_NOT_FOUND');
  }

  const effectiveStagingMeta = resolveEffectiveMeta(input, stagingState);
  const buffer = await readFileBuffer(stagingObjectKey);

  const optimizedOriginal = parseInvitationOptimizedOriginalKey(finalObjectKey);
  if (optimizedOriginal) {
    const parsed: ParsedMediaObjectKey =
      optimizedOriginal.kind === 'hero'
        ? { scope: 'invitationHero', invitationId: optimizedOriginal.invitationId }
        : { scope: 'invitationGallery', invitationId: optimizedOriginal.invitationId };

    await assertAuthForFinalKey(finalObjectKey, user, input);

    const originalPublicExpect = buildCanonicalPublicUrl(finalObjectKey);
    const requestPublicUrl = normalizeText(input.publicUrl).split('?')[0];
    if (requestPublicUrl && requestPublicUrl !== originalPublicExpect) {
      throw new Error('INVALID_PUBLIC_URL');
    }

    await uploadFile(buffer, `${optimizedOriginal.basePrefix}/original.jpg`, 'image/jpeg');
    console.log('[R2_KEY]', `${optimizedOriginal.basePrefix}/original.jpg`);
    const plan = await prepareInvitationOptimizedUploads(buffer, optimizedOriginal.basePrefix);
    for (const item of plan.uploads) {
      await uploadFile(item.buffer, item.key, item.contentType);
      console.log('[R2_KEY]', item.key);
    }

    if (stagingObjectKey !== finalObjectKey) {
      await deleteFile(stagingObjectKey).catch(() => undefined);
    }

    const primaryKey = plan.primaryObjectKey;
    const publicUrl = buildCanonicalPublicUrl(primaryKey);
    const usage = usageFromScope(parsed.scope);
    const owner = resolveOwnerFromParsedObjectKey(parsed);

    const media = await prisma.mediaFile.create({
      data: {
        ownerId: user.id,
        ownerType: owner.ownerType,
        ownerRefId: owner.ownerRefId,
        usage,
        objectKey: primaryKey,
        publicUrl,
        url: publicUrl,
        fileName: resolveFileNameFromObjectKey(primaryKey),
        mimeType: 'image/webp',
        fileSize: plan.primaryFileSize,
        width: plan.width,
        height: plan.height,
        createdBy: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (parsed.scope === 'invitationHero' || parsed.scope === 'invitationGallery') {
      await upsertInvitationMediaReference({
        invitationId: parsed.invitationId,
        userId: user.id,
        scope: parsed.scope,
        publicUrl,
        objectKey: primaryKey,
      });
    }

    console.info('[media.confirm.success]', {
      userId: user.id,
      objectKey: primaryKey,
      staging: stagingObjectKey,
      usage,
    });

    return {
      mediaId: media.id,
      objectKey: primaryKey,
      publicUrl,
      mimeType: 'image/webp',
      fileSize: plan.primaryFileSize,
      width: plan.width,
      height: plan.height,
      usage,
    };
  }

  const { parsed, owner } = await assertAuthForFinalKey(finalObjectKey, user, input);

  const publicUrl = buildCanonicalPublicUrl(finalObjectKey);
  const requestPublicUrl = normalizeText(input.publicUrl).split('?')[0];
  if (requestPublicUrl && requestPublicUrl !== publicUrl) {
    throw new Error('INVALID_PUBLIC_URL');
  }

  const usage = usageFromScope(parsed.scope);

  if (parsed.scope === 'templateCover') {
    const templateId = parsed.templateId;
    const mainKey = `template/${templateId}/thumbnail/main.jpg`;
    const thumbKey = `template/${templateId}/thumbnail/thumb.jpg`;
    await writeJpegWithThumb(mainKey, thumbKey, buffer);
    if (stagingObjectKey !== finalObjectKey) {
      await deleteFile(stagingObjectKey).catch(() => undefined);
    }
  } else if (parsed.scope === 'templateHero') {
    const templateId = parsed.templateId;
    const mainKey = `template/${templateId}/hero/original.jpg`;
    const thumbKey = `template/${templateId}/hero/thumb.jpg`;
    await writeJpegWithThumb(mainKey, thumbKey, buffer);
    if (stagingObjectKey !== finalObjectKey) {
      await deleteFile(stagingObjectKey).catch(() => undefined);
    }
  } else if (stagingObjectKey !== finalObjectKey) {
    await uploadFile(buffer, finalObjectKey, effectiveStagingMeta.contentType);
    console.log('[R2_KEY]', finalObjectKey);
    await deleteFile(stagingObjectKey).catch(() => undefined);
  }

  const width = normalizeNullableImageDimension(input.width);
  const height = normalizeNullableImageDimension(input.height);

  const media = await prisma.mediaFile.create({
    data: {
      ownerId: user.id,
      ownerType: owner.ownerType,
      ownerRefId: owner.ownerRefId,
      usage,
      objectKey: finalObjectKey,
      publicUrl,
      url: publicUrl,
      fileName: resolveFileNameFromObjectKey(finalObjectKey),
      mimeType: effectiveStagingMeta.contentType,
      fileSize: effectiveStagingMeta.fileSize,
      width,
      height,
      createdBy: user.id,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (parsed.scope === 'invitationHero' || parsed.scope === 'invitationGallery') {
    await upsertInvitationMediaReference({
      invitationId: parsed.invitationId,
      userId: user.id,
      scope: parsed.scope,
      publicUrl,
      objectKey: finalObjectKey,
    });
  }

  if (parsed.scope === 'templateCover' || parsed.scope === 'templateAsset') {
    await upsertTemplateMediaReference({
      templateId: parsed.templateId,
      userId: user.id,
      scope: parsed.scope,
      publicUrl,
      objectKey: finalObjectKey,
    });
  }

  if (parsed.scope === 'templateHero') {
    await upsertTemplateHeroInStudioConfig({
      templateId: parsed.templateId,
      userId: user.id,
      publicUrl,
      objectKey: finalObjectKey,
    });
  }

  const resultMime =
    parsed.scope === 'templateCover' || parsed.scope === 'templateHero' ? 'image/jpeg' : effectiveStagingMeta.contentType;

  console.info('[media.confirm.success]', {
    userId: user.id,
    objectKey: finalObjectKey,
    staging: stagingObjectKey,
    usage,
  });

  return {
    mediaId: media.id,
    objectKey: finalObjectKey,
    publicUrl,
    mimeType: resultMime,
    fileSize: effectiveStagingMeta.fileSize,
    width,
    height,
    usage,
  };
}

export async function markMediaDeletedByObjectKey(input: {
  objectKey: string;
  userId: string;
}): Promise<void> {
  const objectKey = normalizeText(input.objectKey).replace(/^\/+/, '');
  if (!objectKey) return;

  await prisma.mediaFile.updateMany({
    where: {
      objectKey,
      ownerId: input.userId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * objectKey 우선, 없을 때에만 public URL 로 스토리지 키를 역산(레거시 클라이언트)합니다.
 */
export async function deleteMediaForAuthenticatedUser(
  user: MediaAuthUser,
  input: { objectKey?: string; url?: string }
): Promise<void> {
  const normalizedKey = normalizeText(input.objectKey).replace(/^\/+/, '');
  let key = normalizedKey;
  if (!key) {
    const rawUrl = normalizeText(input.url || '').split('?')[0];
    if (!rawUrl) {
      throw new Error('MEDIA_TARGET_REQUIRED');
    }
    const fromUrl = resolveStorageKeyFromUrl(rawUrl);
    if (!fromUrl) {
      throw new Error('INVALID_MEDIA_URL');
    }
    key = fromUrl;
  }

  const allowed = await canDeleteByStorageKey({
    userId: user.id,
    isCreator: isMediaTemplatePrivilegedRole(user.role),
    key,
  });
  if (!allowed) {
    throw new Error('UNAUTHORIZED_MEDIA_ACCESS');
  }

  await deleteStoredMediaByObjectKey(key);
  await markMediaDeletedByObjectKey({ objectKey: key, userId: user.id }).catch((error) => {
    console.warn('Failed to mark media file as deleted:', error);
  });
}

