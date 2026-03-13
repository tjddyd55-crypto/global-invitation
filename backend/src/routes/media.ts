import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';
import { buildPublicFileUrl } from '../lib/storage/r2Client';
import { parseMediaObjectKey } from '../lib/media/keys';
import {
  completeDirectUpload,
  createDirectUploadPresign,
  deleteImageByUrl,
  resolveStorageKeyFromUrl,
  uploadImage,
  type MediaAssetType,
  type MediaContext,
} from '../storage/mediaStorage';
import { confirmMediaUpload, createMediaPresign, markMediaDeletedByObjectKey } from '../services/mediaService';

const router = Router();
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VALID_FOLDER_SEGMENT = /^[a-zA-Z0-9_-]+$/;
const E2E_MEDIA_PREFIX = 'e2e';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
      return;
    }
    callback(null, true);
  },
});

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isCreatorActor(user: { isCreator?: boolean; role?: string }): boolean {
  return user.role === 'CREATOR';
}

function isE2ETestModeEnabled(): boolean {
  return process.env.E2E_TEST_MODE === 'true' && process.env.NODE_ENV !== 'production';
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeContext(value: unknown): MediaContext {
  const context = normalizeText(value).toLowerCase();
  if (context === 'invitation' || context === 'template' || context === 'user') {
    return context;
  }
  return 'user';
}

function normalizeAssetType(value: unknown): MediaAssetType {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'thumbnail') return 'thumbnail';
  if (normalized === 'hero') return 'hero';
  if (normalized === 'gallery') return 'gallery';
  return 'asset';
}

type FolderAuthorizationTarget = {
  folder: string;
  context: MediaContext;
  entityId: string;
  ownerId?: string;
};

type NormalizedFolderInfo = {
  normalizedFolder: string;
  hasE2EPrefix: boolean;
};

function normalizeFolderSegment(value: string): string {
  const segment = value.trim();
  if (!segment || !VALID_FOLDER_SEGMENT.test(segment)) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }
  return segment;
}

function normalizeFolderWithOptionalE2EPrefix(rawFolder: unknown): NormalizedFolderInfo {
  const folder = normalizeText(rawFolder)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (!folder) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  if (!folder.startsWith(`${E2E_MEDIA_PREFIX}/`)) {
    return {
      normalizedFolder: folder,
      hasE2EPrefix: false,
    };
  }

  if (!isE2ETestModeEnabled()) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  const stripped = folder.slice(`${E2E_MEDIA_PREFIX}/`.length).trim();
  if (!stripped) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  return {
    normalizedFolder: stripped,
    hasE2EPrefix: true,
  };
}

function applyE2EPrefix(folder: string, hasE2EPrefix: boolean): string {
  return hasE2EPrefix ? `${E2E_MEDIA_PREFIX}/${folder}` : folder;
}

function stripE2EPrefixFromStorageKey(key: string): string {
  const normalized = key.trim().replace(/^\/+/, '');
  if (!normalized.startsWith(`${E2E_MEDIA_PREFIX}/`)) {
    return normalized;
  }
  if (!isE2ETestModeEnabled()) {
    return normalized;
  }
  return normalized.slice(`${E2E_MEDIA_PREFIX}/`.length);
}

function resolveFolderAuthorizationTarget(rawFolder: unknown, userId: string): FolderAuthorizationTarget {
  const { normalizedFolder, hasE2EPrefix } = normalizeFolderWithOptionalE2EPrefix(rawFolder);

  const segments = normalizedFolder.split('/').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length < 2) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  const head = segments[0];

  if (head === 'invitations' && segments.length === 3) {
    const invitationId = normalizeFolderSegment(segments[1]);
    const mediaType = normalizeFolderSegment(segments[2]);
    if (mediaType !== 'hero' && mediaType !== 'gallery') {
      throw new Error('INVALID_MEDIA_FOLDER');
    }
    const resolvedFolder = `invitations/${invitationId}/${mediaType}`;
    return {
      folder: applyE2EPrefix(resolvedFolder, hasE2EPrefix),
      context: 'invitation',
      entityId: invitationId,
    };
  }

  if (head === 'templates' && segments.length === 3) {
    const category = normalizeFolderSegment(segments[1]);
    const entityId = normalizeFolderSegment(segments[2]);
    if (category !== 'thumbnails') {
      throw new Error('INVALID_MEDIA_FOLDER');
    }
    const resolvedFolder = `templates/thumbnails/${entityId}`;
    return {
      folder: applyE2EPrefix(resolvedFolder, hasE2EPrefix),
      context: 'template',
      entityId,
    };
  }

  if (head === 'creator' && segments.length === 4) {
    const creatorIdRaw = normalizeFolderSegment(segments[1]);
    const entityId = normalizeFolderSegment(segments[2]);
    const assets = normalizeFolderSegment(segments[3]);
    if (assets !== 'assets') {
      throw new Error('INVALID_MEDIA_FOLDER');
    }
    const creatorId = creatorIdRaw === 'self' ? userId : creatorIdRaw;
    const resolvedFolder = `creator/${creatorId}/${entityId}/assets`;
    return {
      folder: applyE2EPrefix(resolvedFolder, hasE2EPrefix),
      context: 'template',
      entityId,
      ownerId: creatorId,
    };
  }

  if (head === 'users' && (segments.length === 2 || segments.length === 3)) {
    const ownerRaw = normalizeFolderSegment(segments[1]);
    const ownerId = ownerRaw === 'self' ? userId : ownerRaw;
    if (segments.length === 3) {
      const assetSegment = normalizeFolderSegment(segments[2]);
      if (assetSegment !== 'assets') {
        throw new Error('INVALID_MEDIA_FOLDER');
      }
      const resolvedFolder = `users/${ownerId}/assets`;
      return {
        folder: applyE2EPrefix(resolvedFolder, hasE2EPrefix),
        context: 'user',
        entityId: ownerId,
      };
    }
    const resolvedFolder = `users/${ownerId}`;
    return {
      folder: applyE2EPrefix(resolvedFolder, hasE2EPrefix),
      context: 'user',
      entityId: ownerId,
    };
  }

  throw new Error('INVALID_MEDIA_FOLDER');
}

async function canAccessInvitationMedia(userId: string, invitationIdOrSlug: string): Promise<boolean> {
  if (!invitationIdOrSlug) return false;
  const where = isUuidLike(invitationIdOrSlug)
    ? {
        OR: [{ id: invitationIdOrSlug }, { slug: invitationIdOrSlug }],
        userId,
      }
    : {
        slug: invitationIdOrSlug,
        userId,
      };
  const invitation = await prisma.invitation.findFirst({
    where,
    select: { id: true },
  });
  return Boolean(invitation);
}

async function canAccessTemplateMedia(userId: string, entityId: string): Promise<boolean> {
  if (!entityId) return false;

  const submission = await prisma.templateSubmission.findFirst({
    where: {
      id: entityId,
      creatorId: userId,
    },
    select: { id: true },
  });
  if (submission) {
    return true;
  }

  if (!isUuidLike(entityId)) {
    return false;
  }

  const template = await prisma.template.findFirst({
    where: {
      id: entityId,
      creatorId: userId,
    },
    select: { id: true },
  });
  return Boolean(template);
}

async function canUploadForContext(params: {
  userId: string;
  isCreator: boolean;
  context: MediaContext;
  entityId: string;
}): Promise<boolean> {
  const { userId, isCreator, context, entityId } = params;

  if (context === 'invitation') {
    return canAccessInvitationMedia(userId, entityId);
  }

  if (context === 'template') {
    if (!isCreator) return false;
    return canAccessTemplateMedia(userId, entityId);
  }

  if (!entityId) return true;
  return entityId === userId;
}

async function canDeleteByStorageKey(params: {
  userId: string;
  isCreator: boolean;
  key: string;
}): Promise<boolean> {
  const keyForAuthorization = stripE2EPrefixFromStorageKey(params.key);
  const segments = keyForAuthorization.split('/').filter(Boolean);
  if (segments.length < 2) return false;

  if (segments[0] === 'users') {
    return segments[1] === params.userId;
  }

  if (segments[0] === 'invitations') {
    const invitationId = segments[1] || '';
    return canAccessInvitationMedia(params.userId, invitationId);
  }

  if (segments[0] === 'templates') {
    if (!params.isCreator) return false;
    if (segments[1] === 'thumbnails') {
      const fileNameOrFolder = segments[2] || '';
      const entityId =
        segments.length > 3
          ? fileNameOrFolder
          : fileNameOrFolder.replace(/\.webp$/i, '').replace(/^thumb_/i, '');
      return canAccessTemplateMedia(params.userId, entityId);
    }
  }

  if (segments[0] === 'creator') {
    if (!params.isCreator) return false;
    const creatorId = segments[1] || '';
    const entityId = segments[2] || '';
    const assetsSegment = segments[3] || '';
    if (assetsSegment !== 'assets') {
      return false;
    }
    if (creatorId !== params.userId) return false;
    return canAccessTemplateMedia(params.userId, entityId);
  }

  return false;
}

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (error) => {
    try {
      if (error) {
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'FILE_TOO_LARGE' });
        }
        return res.status(400).json({ error: 'INVALID_MEDIA_FILE' });
      }

      const user = await getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'AUTH_REQUIRED' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'FILE_REQUIRED' });
      }

      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return res.status(400).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
      }

      const context = normalizeContext(req.body?.context);
      const requestedEntityId = normalizeText(req.body?.entityId);
      const assetType = normalizeAssetType(req.body?.assetType);
      const entityId = requestedEntityId || user.id;

      const canUpload = await canUploadForContext({
        userId: user.id,
        isCreator: isCreatorActor(user),
        context,
        entityId,
      });
      if (!canUpload) {
        return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
      }

      const uploaded = await uploadImage({
        fileBuffer: file.buffer,
        mimeType: file.mimetype,
        context,
        entityId,
        userId: user.id,
        creatorId: user.id,
        assetType,
      });

      return res.status(201).json({
        url: uploaded.url,
        fileKey: uploaded.key,
        thumbnailUrl: uploaded.thumbnailUrl,
        thumbnailKey: uploaded.thumbnailKey,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
      });
    } catch (uploadError) {
      if (uploadError instanceof Error && uploadError.message === 'INVALID_IMAGE_FILE') {
        return res.status(400).json({ error: 'INVALID_MEDIA_FILE' });
      }
      if (uploadError instanceof Error && uploadError.message === 'INVALID_MEDIA_PATH') {
        return res.status(400).json({ error: 'INVALID_MEDIA_PATH' });
      }
      if (uploadError instanceof Error && uploadError.message === 'R2_STORAGE_NOT_CONFIGURED') {
        return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
      }
      console.error('Error uploading media:', uploadError);
      return res.status(500).json({ error: 'FAILED_TO_UPLOAD_MEDIA' });
    }
  });
});

router.post('/presign', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const scope = normalizeText(req.body?.scope);
    if (scope) {
      const result = await createMediaPresign(
        {
          scope: scope as
            | 'invitationHero'
            | 'invitationGallery'
            | 'templateCover'
            | 'templateAsset'
            | 'common',
          invitationId: normalizeText(req.body?.invitationId),
          templateId: normalizeText(req.body?.templateId),
          filename: normalizeText(req.body?.filename) || undefined,
          contentType: normalizeText(req.body?.contentType),
          size: Number(req.body?.size),
          expiresInSeconds: Number(req.body?.expiresIn || req.body?.expiresInSeconds || 3600),
        },
        {
          id: user.id,
          role: String(user.role || ''),
        }
      );

      return res.status(200).json({
        objectKey: result.objectKey,
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        expiresIn: result.expiresIn,
        usage: result.usage,
        // legacy response compatibility
        fileKey: result.objectKey,
        url: result.publicUrl,
      });
    }

    const contentType = normalizeText(req.body?.contentType).toLowerCase();
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res.status(400).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
    }

    const folderTarget = resolveFolderAuthorizationTarget(req.body?.folder, user.id);
    if (folderTarget.ownerId && folderTarget.ownerId !== user.id) {
      return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }
    const canUpload = await canUploadForContext({
      userId: user.id,
      isCreator: isCreatorActor(user),
      context: folderTarget.context,
      entityId: folderTarget.entityId,
    });
    if (!canUpload) {
      return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }

    const signed = await createDirectUploadPresign({
      folder: folderTarget.folder,
      contentType,
    });
    return res.status(200).json({
      uploadUrl: signed.uploadUrl,
      fileKey: signed.fileKey,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'INVITATION_ID_REQUIRED' ||
        error.message === 'TEMPLATE_ID_REQUIRED' ||
        error.message === 'INVALID_MEDIA_SIZE' ||
        error.message === 'INVALID_MEDIA_SCOPE')
    ) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && (error.message === 'FILE_TOO_LARGE' || error.message === 'UNSUPPORTED_MEDIA_TYPE')) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED_MEDIA_ACCESS') {
      return res.status(401).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'INVALID_MEDIA_FOLDER') {
      return res.status(400).json({ error: 'INVALID_MEDIA_FOLDER' });
    }
    if (error instanceof Error && error.message === 'R2_STORAGE_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
    }
    console.error('Error creating media presign:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_PRESIGNED_UPLOAD' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const confirmed = await confirmMediaUpload(
      {
        objectKey: normalizeText(req.body?.objectKey || req.body?.fileKey),
        publicUrl: normalizeText(req.body?.publicUrl || req.body?.url),
        contentType: normalizeText(req.body?.contentType || req.body?.mimeType),
        size: req.body?.size ?? req.body?.fileSize,
        width: req.body?.width,
        height: req.body?.height,
        usage: normalizeText(req.body?.usage) as
          | 'INVITATION_HERO'
          | 'INVITATION_GALLERY'
          | 'TEMPLATE_COVER'
          | 'TEMPLATE_ASSET'
          | 'COMMON'
          | undefined,
        invitationId: normalizeText(req.body?.invitationId),
        templateId: normalizeText(req.body?.templateId),
      },
      {
        id: user.id,
        role: String(user.role || ''),
      }
    );

    return res.status(200).json({
      mediaId: confirmed.mediaId,
      objectKey: confirmed.objectKey,
      publicUrl: confirmed.publicUrl,
      mimeType: confirmed.mimeType,
      size: confirmed.fileSize,
      width: confirmed.width,
      height: confirmed.height,
      usage: confirmed.usage,
      // legacy response compatibility
      url: confirmed.publicUrl,
      fileKey: confirmed.objectKey,
      fileSize: confirmed.fileSize,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'OBJECT_KEY_REQUIRED' ||
        error.message === 'INVALID_MEDIA_OBJECT_KEY' ||
        error.message === 'INVALID_PUBLIC_URL' ||
        error.message === 'INVALID_MEDIA_SIZE')
    ) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && (error.message === 'FILE_TOO_LARGE' || error.message === 'UNSUPPORTED_MEDIA_TYPE')) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED_MEDIA_ACCESS') {
      return res.status(401).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'MEDIA_OBJECT_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'R2_STORAGE_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
    }
    console.error('Error confirming media upload:', error);
    return res.status(500).json({ error: 'FAILED_TO_CONFIRM_MEDIA_UPLOAD' });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const fileKey = normalizeText(req.body?.fileKey);
    if (!fileKey) {
      return res.status(400).json({ error: 'FILE_KEY_REQUIRED' });
    }

    const canProcess = await canDeleteByStorageKey({
      userId: user.id,
      isCreator: isCreatorActor(user),
      key: fileKey,
    });
    if (!canProcess) {
      return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }

    const completed = await completeDirectUpload(fileKey);
    return res.status(200).json({
      url: completed.url,
      fileKey: completed.key,
      thumbnailUrl: completed.thumbnailUrl,
      thumbnailKey: completed.thumbnailKey,
      mimeType: completed.mimeType,
      fileSize: completed.fileSize,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_MEDIA_PATH') {
      return res.status(400).json({ error: 'INVALID_MEDIA_PATH' });
    }
    if (error instanceof Error && error.message === 'INVALID_IMAGE_FILE') {
      return res.status(400).json({ error: 'INVALID_MEDIA_FILE' });
    }
    if (error instanceof Error && error.message === 'R2_STORAGE_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
    }
    console.error('Error completing direct upload:', error);
    return res.status(500).json({ error: 'FAILED_TO_COMPLETE_MEDIA_UPLOAD' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const fileKey = normalizeText(req.body?.fileKey);
    const fileUrlInput = normalizeText(req.body?.url) || normalizeText(req.body?.fileUrl);
    const fileUrl = fileKey ? buildPublicFileUrl(fileKey) : fileUrlInput;
    if (!fileUrl) {
      return res.status(400).json({ error: 'MEDIA_URL_REQUIRED' });
    }

    const key = resolveStorageKeyFromUrl(fileUrl);
    if (!key) {
      return res.status(400).json({ error: 'INVALID_MEDIA_URL' });
    }
    const parsedKey = parseMediaObjectKey(key);

    const canDelete = await canDeleteByStorageKey({
      userId: user.id,
      isCreator: isCreatorActor(user),
      key,
    });
    if (!canDelete) {
      return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }

    await deleteImageByUrl(fileUrl);
    if (parsedKey) {
      await markMediaDeletedByObjectKey({
        objectKey: key,
        userId: user.id,
      }).catch((error) => {
        console.warn('Failed to mark media file as deleted:', error);
      });
    }

    return res.status(200).json({ success: true });
  } catch (deleteError) {
    if (deleteError instanceof Error && deleteError.message === 'R2_STORAGE_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
    }
    console.error('Error deleting media:', deleteError);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_MEDIA' });
  }
});

export default router;
