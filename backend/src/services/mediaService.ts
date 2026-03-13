import { validate as uuidValidate } from 'uuid';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  buildMediaObjectKey,
  parseMediaObjectKey,
  usageFromScope,
  type MediaScope,
  type MediaUsage,
} from '../lib/media/keys';
import {
  buildPublicMediaUrl,
  createPresignedUploadUrl,
  headObject,
  type HeadObjectResult,
} from '../lib/media/r2';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_SCOPES = new Set<MediaScope>([
  'invitationHero',
  'invitationGallery',
  'templateCover',
  'templateAsset',
  'common',
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
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
  usage: MediaUsage;
};

export type ConfirmMediaInput = {
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

function ensureAllowedContentType(contentType: string): string {
  const normalized = normalizeText(contentType).toLowerCase();
  if (!normalized || !ALLOWED_IMAGE_TYPES.has(normalized)) {
    throw new Error('UNSUPPORTED_MEDIA_TYPE');
  }
  return normalized;
}

function ensureAllowedSize(size: number): number {
  const normalized = normalizePositiveInteger(size);
  if (!normalized) {
    throw new Error('INVALID_MEDIA_SIZE');
  }
  if (normalized > MAX_IMAGE_SIZE_BYTES) {
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
    where: uuidValidate(normalized)
      ? {
          userId,
          OR: [{ id: normalized }, { slug: normalized }],
        }
      : {
          userId,
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
  if (!normalized || !uuidValidate(normalized)) {
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
  if (parsed.scope === 'invitationHero' || parsed.scope === 'invitationGallery') {
    return {
      ownerType: 'INVITATION',
      ownerRefId: parsed.invitationId,
    };
  }
  if (parsed.scope === 'templateCover' || parsed.scope === 'templateAsset') {
    return {
      ownerType: 'TEMPLATE',
      ownerRefId: parsed.templateId,
    };
  }
  return {
    ownerType: 'COMMON',
    ownerRefId: null,
  };
}

function resolveEffectiveMeta(input: ConfirmMediaInput, head: HeadObjectResult) {
  const contentType = normalizeText(input.contentType).toLowerCase() || (head.contentType || '').toLowerCase();
  const safeContentType = ensureAllowedContentType(contentType);

  const fileSize = normalizePositiveInteger(input.size) || head.contentLength || 0;
  if (!fileSize) {
    throw new Error('INVALID_MEDIA_SIZE');
  }
  if (fileSize > MAX_IMAGE_SIZE_BYTES) {
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
}) {
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: params.invitationId,
      userId: params.userId,
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
  } else {
    const prevGallery = Array.isArray(baseData.galleryImages) ? baseData.galleryImages : [];
    const normalizedGallery = prevGallery
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
    if (!normalizedGallery.includes(params.publicUrl)) {
      normalizedGallery.push(params.publicUrl);
    }
    baseData.galleryImages = normalizedGallery;
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      data: baseData as Prisma.InputJsonValue,
      dataJson: baseData as Prisma.InputJsonValue,
    },
  });
}

async function upsertTemplateMediaReference(params: {
  templateId: string;
  userId: string;
  scope: 'templateCover' | 'templateAsset';
  publicUrl: string;
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
      },
    }),
  ]);
}

export async function createMediaPresign(
  input: PresignMediaInput,
  user: MediaAuthUser
): Promise<PresignMediaResult> {
  const scope = input.scope;
  if (!SUPPORTED_SCOPES.has(scope)) {
    throw new Error('INVALID_MEDIA_SCOPE');
  }
  const contentType = ensureAllowedContentType(input.contentType);
  const size = ensureAllowedSize(input.size);

  let objectKey: string;

  if (scope === 'invitationHero' || scope === 'invitationGallery') {
    const invitationId = await resolveOwnedInvitationId(user.id, input.invitationId || '');
    objectKey = buildMediaObjectKey({
      scope,
      invitationId,
      contentType,
      filename: input.filename,
    });
  } else if (scope === 'templateCover' || scope === 'templateAsset') {
    const templateId = await resolveOwnedTemplateId(user, input.templateId || '');
    objectKey = buildMediaObjectKey({
      scope,
      templateId,
      contentType,
      filename: input.filename,
    });
  } else {
    objectKey = buildMediaObjectKey({
      scope: 'common',
      contentType,
      filename: input.filename,
    });
  }

  const presigned = await createPresignedUploadUrl({
    objectKey,
    contentType,
    expiresInSeconds: input.expiresInSeconds,
  });

  console.info('[media.presign]', {
    userId: user.id,
    scope,
    objectKey,
    contentType,
    size,
  });

  return {
    objectKey,
    uploadUrl: presigned.uploadUrl,
    publicUrl: buildPublicMediaUrl(objectKey),
    expiresIn: presigned.expiresIn,
    usage: usageFromScope(scope),
  };
}

export async function confirmMediaUpload(
  input: ConfirmMediaInput,
  user: MediaAuthUser
): Promise<ConfirmMediaResult> {
  const objectKey = normalizeText(input.objectKey).replace(/^\/+/, '');
  if (!objectKey) {
    throw new Error('OBJECT_KEY_REQUIRED');
  }

  const parsed = parseMediaObjectKey(objectKey);
  if (!parsed) {
    throw new Error('INVALID_MEDIA_OBJECT_KEY');
  }

  const owner = resolveOwnerFromParsedObjectKey(parsed);

  if (parsed.scope === 'invitationHero' || parsed.scope === 'invitationGallery') {
    const invitationId = await resolveOwnedInvitationId(user.id, parsed.invitationId);
    if (invitationId !== parsed.invitationId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
    if (input.invitationId && normalizeText(input.invitationId) !== invitationId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
  }

  if (parsed.scope === 'templateCover' || parsed.scope === 'templateAsset') {
    const templateId = await resolveOwnedTemplateId(user, parsed.templateId);
    if (templateId !== parsed.templateId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
    if (input.templateId && normalizeText(input.templateId) !== templateId) {
      throw new Error('INVALID_MEDIA_OBJECT_KEY');
    }
  }

  const objectState = await headObject(objectKey);
  if (!objectState.exists) {
    throw new Error('MEDIA_OBJECT_NOT_FOUND');
  }

  const effectiveMeta = resolveEffectiveMeta(input, objectState);
  const publicUrl = buildPublicMediaUrl(objectKey);
  const requestPublicUrl = normalizeText(input.publicUrl);
  if (requestPublicUrl && requestPublicUrl !== publicUrl) {
    throw new Error('INVALID_PUBLIC_URL');
  }

  const usage = usageFromScope(parsed.scope);
  const width = normalizeNullableImageDimension(input.width);
  const height = normalizeNullableImageDimension(input.height);

  const media = await prisma.mediaFile.create({
    data: {
      ownerId: user.id,
      ownerType: owner.ownerType,
      ownerRefId: owner.ownerRefId,
      usage,
      objectKey,
      publicUrl,
      url: publicUrl,
      fileName: resolveFileNameFromObjectKey(objectKey),
      mimeType: effectiveMeta.contentType,
      fileSize: effectiveMeta.fileSize,
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
    });
  }

  if (parsed.scope === 'templateCover' || parsed.scope === 'templateAsset') {
    await upsertTemplateMediaReference({
      templateId: parsed.templateId,
      userId: user.id,
      scope: parsed.scope,
      publicUrl,
    });
  }

  console.info('[media.confirm.success]', {
    userId: user.id,
    objectKey,
    usage,
    ownerType: owner.ownerType,
    ownerRefId: owner.ownerRefId,
    contentType: effectiveMeta.contentType,
    size: effectiveMeta.fileSize,
  });

  return {
    mediaId: media.id,
    objectKey,
    publicUrl,
    mimeType: effectiveMeta.contentType,
    fileSize: effectiveMeta.fileSize,
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
