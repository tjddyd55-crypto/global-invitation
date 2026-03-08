import { Router, type Request } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';
import { deleteImage, uploadImage } from '../storage/mediaStorage';

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

function resolveRequestBaseUrl(req: Request): string {
  const forwardedProto =
    typeof req.headers['x-forwarded-proto'] === 'string'
      ? req.headers['x-forwarded-proto']
      : Array.isArray(req.headers['x-forwarded-proto']) && req.headers['x-forwarded-proto'].length > 0
        ? req.headers['x-forwarded-proto'][0]
        : null;

  const protocol = forwardedProto || req.protocol || 'http';
  const host = req.get('host');
  if (!host) {
    return `${protocol}://localhost:3001`;
  }
  return `${protocol}://${host}`;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

      const uploaded = await uploadImage({
        file,
        publicBaseUrl: resolveRequestBaseUrl(req),
      });

      const media = await prisma.mediaFile.create({
        data: {
          ownerId: user.id,
          url: uploaded.url,
          fileName: normalizeText(file.originalname) || 'image',
          mimeType: file.mimetype,
          fileSize: file.size,
        },
        select: {
          id: true,
          url: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
        },
      });

      return res.status(201).json(media);
    } catch (uploadError) {
      console.error('Error uploading media:', uploadError);
      return res.status(500).json({ error: 'FAILED_TO_UPLOAD_MEDIA' });
    }
  });
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const mediaId = normalizeText(req.params.id);
    if (!mediaId) {
      return res.status(400).json({ error: 'MEDIA_ID_REQUIRED' });
    }

    const media = await prisma.mediaFile.findFirst({
      where: {
        id: mediaId,
        ownerId: user.id,
      },
      select: {
        id: true,
        url: true,
      },
    });

    if (!media) {
      return res.status(404).json({ error: 'MEDIA_NOT_FOUND' });
    }

    await deleteImage(media.url);
    await prisma.mediaFile.delete({
      where: { id: media.id },
    });

    return res.status(200).json({ success: true });
  } catch (deleteError) {
    console.error('Error deleting media:', deleteError);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_MEDIA' });
  }
});

export default router;
