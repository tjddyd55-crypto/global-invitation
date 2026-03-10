import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';
import {
  deleteImageByUrl,
  resolveStorageKeyFromUrl,
  uploadImage,
  type MediaAssetType,
  type MediaContext,
} from '../storage/mediaStorage';

const router = Router();
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
  const segments = params.key.split('/').filter(Boolean);
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
      const fileName = segments[2] || '';
      const entityId = fileName.replace(/\.webp$/i, '');
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
        isCreator: Boolean(user.isCreator),
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

router.delete('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const fileUrl = normalizeText(req.body?.url) || normalizeText(req.body?.fileUrl);
    if (!fileUrl) {
      return res.status(400).json({ error: 'MEDIA_URL_REQUIRED' });
    }

    const key = resolveStorageKeyFromUrl(fileUrl);
    if (!key) {
      return res.status(400).json({ error: 'INVALID_MEDIA_URL' });
    }

    const canDelete = await canDeleteByStorageKey({
      userId: user.id,
      isCreator: Boolean(user.isCreator),
      key,
    });
    if (!canDelete) {
      return res.status(401).json({ error: 'UNAUTHORIZED_MEDIA_ACCESS' });
    }

    await deleteImageByUrl(fileUrl);

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
