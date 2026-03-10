import crypto from 'crypto';
import sharp from 'sharp';
import { resolveKeyFromPublicUrl } from '../lib/storage/r2Client';
import { deleteFile, uploadFile } from '../lib/storage/uploadToR2';

export type MediaContext = 'invitation' | 'template' | 'user';
export type MediaAssetType = 'asset' | 'thumbnail' | 'hero' | 'gallery';

export type UploadImageParams = {
  fileBuffer: Buffer;
  mimeType: string;
  context: MediaContext;
  entityId: string;
  userId: string;
  creatorId?: string;
  assetType?: MediaAssetType;
};

export type UploadImageResult = {
  url: string;
  key: string;
  mimeType: 'image/webp';
  fileSize: number;
};

const WEBP_QUALITY = 84;
const MAX_IMAGE_WIDTH = 2000;

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').trim();
}

function buildUniqueFileName() {
  return `${crypto.randomUUID()}.webp`;
}

function buildStorageKey(params: {
  context: MediaContext;
  entityId: string;
  userId: string;
  creatorId?: string;
  assetType?: MediaAssetType;
}) {
  const fileName = buildUniqueFileName();
  const entityId = sanitizePathSegment(params.entityId);
  const userId = sanitizePathSegment(params.userId);
  const creatorId = sanitizePathSegment(params.creatorId || params.userId);
  const thumbnailFileName = `${entityId}.webp`;

  if (!entityId || !userId || !creatorId) {
    throw new Error('INVALID_MEDIA_PATH');
  }

  if (params.context === 'invitation') {
    if (params.assetType === 'hero') {
      return `invitations/${entityId}/hero/${fileName}`;
    }
    return `invitations/${entityId}/gallery/${fileName}`;
  }

  if (params.context === 'template') {
    if (params.assetType === 'thumbnail') {
      return `templates/thumbnails/${thumbnailFileName}`;
    }
    return `creator/${creatorId}/${entityId}/assets/${fileName}`;
  }

  return `users/${userId}/${fileName}`;
}

async function optimizeToWebp(buffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(buffer, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('INVALID_IMAGE_FILE');
    }

    if (metadata.width > MAX_IMAGE_WIDTH) {
      return image
        .resize({
          width: MAX_IMAGE_WIDTH,
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    }

    return image.webp({ quality: WEBP_QUALITY }).toBuffer();
  } catch (_error) {
    throw new Error('INVALID_IMAGE_FILE');
  }
}

export async function uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
  const optimized = await optimizeToWebp(params.fileBuffer);
  const key = buildStorageKey(params);
  const url = await uploadFile(optimized, key, 'image/webp');

  return {
    url,
    key,
    mimeType: 'image/webp',
    fileSize: optimized.byteLength,
  };
}

export async function deleteImageByUrl(fileUrl: string): Promise<boolean> {
  const normalized = fileUrl.trim();
  if (!normalized) return false;

  const key = resolveKeyFromPublicUrl(normalized);
  if (!key) return false;

  await deleteFile(key);
  return true;
}

export function resolveStorageKeyFromUrl(fileUrl: string): string | null {
  return resolveKeyFromPublicUrl(fileUrl);
}
