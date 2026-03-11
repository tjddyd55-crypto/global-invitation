import crypto from 'crypto';
import sharp from 'sharp';
import { buildPublicFileUrl, resolveKeyFromPublicUrl } from '../lib/storage/r2Client';
import {
  createPresignedUploadUrl,
  deleteFile,
  deleteFilesByPrefix,
  readFileBuffer,
  uploadFile,
} from '../lib/storage/uploadToR2';

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
  thumbnailUrl?: string;
  thumbnailKey?: string;
};

const WEBP_QUALITY = 84;
const MAX_IMAGE_WIDTH = 2000;
const THUMBNAIL_WIDTH_BY_ASSET: Record<MediaAssetType, number> = {
  hero: 1200,
  gallery: 1600,
  thumbnail: 600,
  asset: 1600,
};

type ResolvedDirectUploadTarget = {
  originalKey: string;
  thumbnailKey: string;
  assetType: MediaAssetType;
};

export function sanitizePathSegment(value: string): string {
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

function normalizeFolder(folder: string): string {
  const normalized = folder
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  if (!normalized) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }
  return normalized;
}

function parseFolderSegments(folder: string): string[] {
  return normalizeFolder(folder)
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function resolveAssetTypeFromFolder(folder: string): MediaAssetType {
  const segments = parseFolderSegments(folder);
  if (segments.length === 0) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  if (segments[0] === 'invitations' && segments.length === 3) {
    if (segments[2] === 'hero') return 'hero';
    if (segments[2] === 'gallery') return 'gallery';
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  if (segments[0] === 'templates' && segments[1] === 'thumbnails' && segments.length === 3) {
    return 'thumbnail';
  }

  if (segments[0] === 'creator' && segments[3] === 'assets' && segments.length === 4) {
    return 'asset';
  }

  if (segments[0] === 'users' && (segments.length === 2 || (segments.length === 3 && segments[2] === 'assets'))) {
    return 'asset';
  }

  throw new Error('INVALID_MEDIA_FOLDER');
}

function getThumbnailWidth(assetType: MediaAssetType): number {
  return THUMBNAIL_WIDTH_BY_ASSET[assetType] || 1600;
}

function extractBaseName(fileName: string): string {
  const trimmed = fileName.trim();
  const withoutExt = trimmed.replace(/\.[^/.]+$/g, '');
  const normalized = sanitizePathSegment(withoutExt);
  return normalized || crypto.randomUUID();
}

function resolveThumbnailKeyForOriginalKey(key: string): string {
  const segments = key.split('/').filter(Boolean);
  if (segments[0] === 'templates' && segments[1] === 'thumbnails') {
    const fileName = segments[2] || '';
    const baseName = fileName.replace(/\.webp$/i, '');
    return `templates/thumbnails/thumb_${baseName}.webp`;
  }

  const fileName = segments[segments.length - 1] || '';
  const baseName = fileName.replace(/\.webp$/i, '');
  const dir = segments.slice(0, -1).join('/');
  return `${dir}/thumb_${baseName}.webp`;
}

function resolveRelatedDeleteKeys(key: string): string[] {
  const segments = key.split('/').filter(Boolean);
  if (segments.length === 0) return [key];

  const fileName = segments[segments.length - 1] || '';
  const dir = segments.slice(0, -1).join('/');
  const related = new Set<string>([key]);

  if (fileName.endsWith('.webp')) {
    if (fileName.startsWith('thumb_')) {
      related.add(`${dir}/${fileName.replace(/^thumb_/, '')}`);
    } else {
      related.add(`${dir}/thumb_${fileName}`);
    }
  }

  return Array.from(related);
}

function resolveDirectUploadTarget(fileKey: string): ResolvedDirectUploadTarget {
  const segments = fileKey.split('/').filter(Boolean);
  if (segments.length < 2) {
    throw new Error('INVALID_MEDIA_PATH');
  }

  const fileName = segments[segments.length - 1] || '';
  const baseName = extractBaseName(fileName);

  if (segments[0] === 'templates' && segments[1] === 'thumbnails' && segments.length >= 4) {
    const entityId = sanitizePathSegment(segments[2] || '');
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    return {
      originalKey: `templates/thumbnails/${entityId}.webp`,
      thumbnailKey: `templates/thumbnails/thumb_${entityId}.webp`,
      assetType: 'thumbnail',
    };
  }

  const folder = segments.slice(0, -1).join('/');
  const assetType = resolveAssetTypeFromFolder(folder);
  return {
    originalKey: `${folder}/${baseName}.webp`,
    thumbnailKey: `${folder}/thumb_${baseName}.webp`,
    assetType,
  };
}

async function optimizeToWebp(buffer: Buffer, widthLimit: number): Promise<Buffer> {
  try {
    const image = sharp(buffer, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('INVALID_IMAGE_FILE');
    }

    if (metadata.width > widthLimit) {
      return image
        .resize({
          width: widthLimit,
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
  const optimized = await optimizeToWebp(params.fileBuffer, MAX_IMAGE_WIDTH);
  const key = buildStorageKey(params);
  const thumbnailKey = resolveThumbnailKeyForOriginalKey(key);
  const thumbnailWidth = getThumbnailWidth(params.assetType || 'asset');
  const thumbnail = await optimizeToWebp(params.fileBuffer, Math.min(MAX_IMAGE_WIDTH, thumbnailWidth));
  const url = await uploadFile(optimized, key, 'image/webp');
  const thumbnailUrl = await uploadFile(thumbnail, thumbnailKey, 'image/webp');

  return {
    url,
    key,
    mimeType: 'image/webp',
    fileSize: optimized.byteLength,
    thumbnailUrl,
    thumbnailKey,
  };
}

export async function createDirectUploadPresign(params: {
  folder: string;
  contentType: string;
}): Promise<{ uploadUrl: string; fileKey: string }> {
  const folder = normalizeFolder(params.folder);
  resolveAssetTypeFromFolder(folder);
  const fileKey = `${folder}/${crypto.randomUUID()}.upload`;
  const uploadUrl = await createPresignedUploadUrl({
    key: fileKey,
    contentType: params.contentType,
  });
  return {
    uploadUrl,
    fileKey,
  };
}

export async function completeDirectUpload(fileKey: string): Promise<UploadImageResult> {
  const sourceBuffer = await readFileBuffer(fileKey);
  const { originalKey, thumbnailKey, assetType } = resolveDirectUploadTarget(fileKey);
  const thumbnailWidth = getThumbnailWidth(assetType);

  const [optimized, thumbnail] = await Promise.all([
    optimizeToWebp(sourceBuffer, MAX_IMAGE_WIDTH),
    optimizeToWebp(sourceBuffer, Math.min(MAX_IMAGE_WIDTH, thumbnailWidth)),
  ]);

  await Promise.all([
    uploadFile(optimized, originalKey, 'image/webp'),
    uploadFile(thumbnail, thumbnailKey, 'image/webp'),
  ]);

  if (fileKey !== originalKey) {
    await deleteFile(fileKey).catch(() => undefined);
  }

  return {
    url: buildPublicFileUrl(originalKey),
    key: originalKey,
    mimeType: 'image/webp',
    fileSize: optimized.byteLength,
    thumbnailUrl: buildPublicFileUrl(thumbnailKey),
    thumbnailKey,
  };
}

export async function deleteImageByUrl(fileUrl: string): Promise<boolean> {
  const normalized = fileUrl.trim();
  if (!normalized) return false;

  const key = resolveKeyFromPublicUrl(normalized);
  if (!key) return false;

  const keys = resolveRelatedDeleteKeys(key);
  await Promise.all(keys.map((targetKey) => deleteFile(targetKey).catch(() => undefined)));
  return true;
}

export function resolveStorageKeyFromUrl(fileUrl: string): string | null {
  return resolveKeyFromPublicUrl(fileUrl);
}

export async function deleteStoragePrefix(prefix: string): Promise<number> {
  const normalized = normalizeFolder(prefix);
  return deleteFilesByPrefix(`${normalized}/`);
}
