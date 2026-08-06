import { Router } from 'express';
import multer from 'multer';
import { buildCanonicalPublicUrl, mapScopeToType } from '../lib/mediaKeyBuilder';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';
import { type MediaScope } from '../lib/media/keys';
import { uploadImage, type MediaAssetType, type MediaContext } from '../storage/mediaStorage';
import {
  confirmMediaUpload,
  createMediaPresign,
  deleteMediaForAuthenticatedUser,
} from '../services/mediaService';

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

function folderToScopeFromNormalizedFolder(normalizedFolder: string): {
  scope: MediaScope;
  invitationId?: string;
  templateId?: string;
  context: MediaContext;
  entityId: string;
} {
  const segments = normalizedFolder.split('/').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length !== 3) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }
  const head = segments[0];
  if (head === 'invitation') {
    const invitationId = normalizeFolderSegment(segments[1]);
    const mediaType = normalizeFolderSegment(segments[2]);
    if (mediaType === 'hero') {
      return {
        scope: 'invitationHero',
        invitationId,
        context: 'invitation',
        entityId: invitationId,
      };
    }
    if (mediaType === 'gallery') {
      return {
        scope: 'invitationGallery',
        invitationId,
        context: 'invitation',
        entityId: invitationId,
      };
    }
  }
  if (head === 'template') {
    const templateId = normalizeFolderSegment(segments[1]);
    const section = normalizeFolderSegment(segments[2]);
    if (section === 'thumbnail') {
      return {
        scope: 'templateCover',
        templateId,
        context: 'template',
        entityId: templateId,
      };
    }
    if (section === 'gallery') {
      return {
        scope: 'templateAsset',
        templateId,
        context: 'template',
        entityId: templateId,
      };
    }
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
    where: {
      ...where,
      isDeleted: false,
    },
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
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
      });
    } catch (uploadError) {
      if (uploadError instanceof Error && uploadError.message === 'INVALID_IMAGE_FILE') {
        return res.status(400).json({ error: 'INVALID_MEDIA_FILE' });
      }
      if (uploadError instanceof Error && uploadError.message === 'USE_PRESIGN_UPLOAD') {
        return res.status(400).json({ error: 'USE_PRESIGN_UPLOAD' });
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
            | 'invitationCoupleGroom'
            | 'invitationCoupleBride'
            | 'invitationMusic'
            | 'templateCover'
            | 'templateHero'
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
        stagingObjectKey: result.stagingObjectKey,
        objectKey: result.objectKey,
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        expiresIn: result.expiresIn,
        usage: result.usage,
        fileKey: result.stagingObjectKey,
        finalObjectKey: result.objectKey,
        url: result.publicUrl,
      });
    }

    const contentType = normalizeText(req.body?.contentType).toLowerCase();
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res.status(400).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
    }

    const size = Number(req.body?.size);
    if (!Number.isFinite(size) || size <= 0) {
      return res.status(400).json({ error: 'INVALID_MEDIA_SIZE' });
    }

    const { normalizedFolder } = normalizeFolderWithOptionalE2EPrefix(req.body?.folder);
    const folderParts = folderToScopeFromNormalizedFolder(normalizedFolder);
    const canUploadFolder = await canUploadForContext({
      userId: user.id,
      isCreator: isCreatorActor(user),
      context: folderParts.context,
      entityId: folderParts.entityId,
    });
    if (!canUploadFolder) {
      return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }

    const folderSigned = await createMediaPresign(
      {
        scope: folderParts.scope,
        invitationId: folderParts.invitationId,
        templateId: folderParts.templateId,
        filename: normalizeText(req.body?.filename) || undefined,
        contentType,
        size,
        expiresInSeconds: Number(req.body?.expiresIn || req.body?.expiresInSeconds || 3600),
      },
      {
        id: user.id,
        role: String(user.role || ''),
      }
    );
    console.log('[R2_UPLOAD]', {
      staging: folderSigned.stagingObjectKey,
      final: folderSigned.objectKey,
      scopeType: mapScopeToType(`folder:${folderParts.context}`),
    });
    return res.status(200).json({
      stagingObjectKey: folderSigned.stagingObjectKey,
      objectKey: folderSigned.objectKey,
      uploadUrl: folderSigned.uploadUrl,
      publicUrl: folderSigned.publicUrl,
      expiresIn: folderSigned.expiresIn,
      usage: folderSigned.usage,
      fileKey: folderSigned.stagingObjectKey,
      finalObjectKey: folderSigned.objectKey,
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
        stagingObjectKey: normalizeText(req.body?.stagingObjectKey || req.body?.stagingKey),
        objectKey: normalizeText(req.body?.objectKey || req.body?.finalObjectKey || req.body?.fileKey),
        publicUrl: normalizeText(req.body?.publicUrl || req.body?.url),
        contentType: normalizeText(req.body?.contentType || req.body?.mimeType),
        size: req.body?.size ?? req.body?.fileSize,
        width: req.body?.width,
        height: req.body?.height,
        usage: normalizeText(req.body?.usage) as
          | 'INVITATION_HERO'
          | 'INVITATION_GALLERY'
          | 'INVITATION_COUPLE_GROOM'
          | 'INVITATION_COUPLE_BRIDE'
          | 'INVITATION_MUSIC'
          | 'TEMPLATE_COVER'
          | 'TEMPLATE_HERO'
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
        error.message === 'INVALID_STAGING_OBJECT_KEY' ||
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

/** @deprecated POST /api/media/confirm + stagingObjectKey 사용 */
router.post('/complete', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const stagingObjectKey = normalizeText(req.body?.fileKey || req.body?.stagingObjectKey);
    const objectKey = normalizeText(req.body?.objectKey || req.body?.finalObjectKey);
    if (!stagingObjectKey || !objectKey) {
      return res.status(400).json({ error: 'STAGING_AND_FINAL_KEY_REQUIRED' });
    }

    const completed = await confirmMediaUpload(
      {
        stagingObjectKey,
        objectKey,
        publicUrl: normalizeText(req.body?.publicUrl || req.body?.url),
        contentType: normalizeText(req.body?.contentType || req.body?.mimeType),
        size: req.body?.size ?? req.body?.fileSize,
        invitationId: normalizeText(req.body?.invitationId),
        templateId: normalizeText(req.body?.templateId),
      },
      { id: user.id, role: String(user.role || '') }
    );

    return res.status(200).json({
      url: completed.publicUrl,
      fileKey: completed.objectKey,
      objectKey: completed.objectKey,
      mimeType: completed.mimeType,
      fileSize: completed.fileSize,
      mediaId: completed.mediaId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'R2_STORAGE_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED_MEDIA_ACCESS') {
      return res.status(401).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'MEDIA_OBJECT_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error completing media upload:', error);
    return res.status(500).json({ error: 'FAILED_TO_COMPLETE_MEDIA_UPLOAD' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    await deleteMediaForAuthenticatedUser(
      { id: user.id, role: String(user.role || '') },
      {
        objectKey:
          normalizeText(req.body?.objectKey) ||
          normalizeText(req.body?.fileKey) ||
          normalizeText(req.body?.finalObjectKey),
        url: normalizeText(req.body?.url) || normalizeText(req.body?.fileUrl),
      }
    );

    return res.status(200).json({ success: true });
  } catch (deleteError) {
    if (deleteError instanceof Error && deleteError.message === 'MEDIA_TARGET_REQUIRED') {
      return res.status(400).json({ error: 'MEDIA_URL_REQUIRED' });
    }
    if (deleteError instanceof Error && deleteError.message === 'INVALID_MEDIA_URL') {
      return res.status(400).json({ error: 'INVALID_MEDIA_URL' });
    }
    if (deleteError instanceof Error && deleteError.message === 'UNAUTHORIZED_MEDIA_ACCESS') {
      return res.status(403).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }
    if (deleteError instanceof Error && deleteError.message === 'PROTECTED_SHARED_MEDIA') {
      return res.status(403).json({ error: 'PROTECTED_SHARED_MEDIA' });
    }
    if (deleteError instanceof Error && deleteError.message === 'MEDIA_STILL_REFERENCED') {
      return res.status(409).json({ error: 'MEDIA_STILL_REFERENCED' });
    }
    if (deleteError instanceof Error && deleteError.message === 'MEDIA_REFERENCE_SCAN_FAILED') {
      return res.status(503).json({ error: 'MEDIA_REFERENCE_SCAN_FAILED' });
    }
    if (deleteError instanceof Error && deleteError.message === 'R2_STORAGE_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'R2_STORAGE_NOT_CONFIGURED' });
    }
    console.error('Error deleting media:', deleteError);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_MEDIA' });
  }
});

export default router;
