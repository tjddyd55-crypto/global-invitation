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
const SHARP_LIMIT_INPUT_PIXELS = 60_000_000;
const E2E_MEDIA_PREFIX = 'e2e';
const THUMBNAIL_WIDTH_BY_ASSET: Record<MediaAssetType, number> = {
  hero: 1200,
  gallery: 1600,
  thumbnail: 600,
  asset: 1600,
};
const WEBP_QUALITY_BY_ASSET: Record<MediaAssetType, number> = {
  hero: 84,
  gallery: 82,
  thumbnail: 80,
  asset: 82,
};

type ResolvedDirectUploadTarget = {
  originalKey: string;
  thumbnailKey: string;
  assetType: MediaAssetType;
};

type NormalizedPathWithPrefix = {
  normalizedPath: string;
  hasE2EPrefix: boolean;
};

export function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').trim();
}

function isE2ETestModeEnabled(): boolean {
  return process.env.E2E_TEST_MODE === 'true' && process.env.NODE_ENV !== 'production';
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

function normalizePathWithOptionalE2EPrefix(input: string): NormalizedPathWithPrefix {
  const normalized = normalizeFolder(input);
  if (!normalized.startsWith(`${E2E_MEDIA_PREFIX}/`)) {
    return {
      normalizedPath: normalized,
      hasE2EPrefix: false,
    };
  }

  if (!isE2ETestModeEnabled()) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  const stripped = normalized.slice(`${E2E_MEDIA_PREFIX}/`.length).trim();
  if (!stripped) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  return {
    normalizedPath: stripped,
    hasE2EPrefix: true,
  };
}

function applyE2EPrefix(path: string, hasE2EPrefix: boolean): string {
  return hasE2EPrefix ? `${E2E_MEDIA_PREFIX}/${path}` : path;
}

function parseFolderSegments(folder: string): string[] {
  const { normalizedPath } = normalizePathWithOptionalE2EPrefix(folder);
  return normalizedPath
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

function getWebpQuality(assetType: MediaAssetType): number {
  return WEBP_QUALITY_BY_ASSET[assetType] || WEBP_QUALITY;
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
  const { normalizedPath, hasE2EPrefix } = normalizePathWithOptionalE2EPrefix(fileKey);
  const segments = normalizedPath.split('/').filter(Boolean);
  if (segments.length < 2) {
    throw new Error('INVALID_MEDIA_PATH');
  }

  const fileName = segments[segments.length - 1] || '';
  const baseName = extractBaseName(fileName);

  const prefix = hasE2EPrefix ? `${E2E_MEDIA_PREFIX}/` : '';
  if (segments[0] === 'templates' && segments[1] === 'thumbnails' && segments.length >= 4) {
    const entityId = sanitizePathSegment(segments[2] || '');
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    return {
      originalKey: `${prefix}templates/thumbnails/${entityId}.webp`,
      thumbnailKey: `${prefix}templates/thumbnails/thumb_${entityId}.webp`,
      assetType: 'thumbnail',
    };
  }

  const folder = segments.slice(0, -1).join('/');
  const assetType = resolveAssetTypeFromFolder(folder);
  return {
    originalKey: `${prefix}${folder}/${baseName}.webp`,
    thumbnailKey: `${prefix}${folder}/thumb_${baseName}.webp`,
    assetType,
  };
}

async function optimizeToWebp(buffer: Buffer, widthLimit: number, quality: number): Promise<Buffer> {
  try {
    const image = sharp(buffer, { failOn: 'none', limitInputPixels: SHARP_LIMIT_INPUT_PIXELS }).rotate();
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
        .webp({ quality })
        .toBuffer();
    }

    return image.webp({ quality }).toBuffer();
  } catch (_error) {
    throw new Error('INVALID_IMAGE_FILE');
  }
}

export async function uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
  const assetType = params.assetType || 'asset';
  const optimized = await optimizeToWebp(params.fileBuffer, MAX_IMAGE_WIDTH, getWebpQuality(assetType));
  const key = buildStorageKey(params);
  const thumbnailKey = resolveThumbnailKeyForOriginalKey(key);
  const thumbnailWidth = getThumbnailWidth(assetType);
  const thumbnail = await optimizeToWebp(
    params.fileBuffer,
    Math.min(MAX_IMAGE_WIDTH, thumbnailWidth),
    getWebpQuality(assetType)
  );
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
  const { normalizedPath, hasE2EPrefix } = normalizePathWithOptionalE2EPrefix(params.folder);
  resolveAssetTypeFromFolder(params.folder);
  const folderWithPrefix = applyE2EPrefix(normalizedPath, hasE2EPrefix);
  const fileKey = `${folderWithPrefix}/${crypto.randomUUID()}.upload`;
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
  const quality = getWebpQuality(assetType);

  const [optimized, thumbnail] = await Promise.all([
    optimizeToWebp(sourceBuffer, MAX_IMAGE_WIDTH, quality),
    optimizeToWebp(sourceBuffer, Math.min(MAX_IMAGE_WIDTH, thumbnailWidth), quality),
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
