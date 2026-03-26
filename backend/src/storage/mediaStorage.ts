import crypto from 'crypto';
import sharp from 'sharp';
import { parseInvitationOptimizedOriginalKey } from '../lib/media/keys';
import { buildCanonicalPublicUrl, buildR2Key } from '../lib/mediaKeyBuilder';
import { resolveKeyFromPublicUrl } from '../lib/storage/r2Client';
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
  mimeType: 'image/webp' | 'image/jpeg';
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

  if (params.context === 'invitation') {
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    if (params.assetType === 'hero') {
      return `invitation/${entityId}/hero/${fileName}`;
    }
    return `invitation/${entityId}/gallery/${fileName}`;
  }

  if (params.context === 'template') {
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    if (params.assetType === 'thumbnail') {
      return `template/${entityId}/thumbnail/main.jpg`;
    }
    if (params.assetType === 'hero') {
      return `template/${entityId}/hero/${fileName}`;
    }
    return `template/${entityId}/gallery/${fileName}`;
  }

  if (!userId) {
    throw new Error('INVALID_MEDIA_PATH');
  }
  const tempId = crypto.randomBytes(16).toString('hex');
  return buildR2Key({ type: 'temp', id: tempId, filename: `user-${fileName}` });
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

  if (segments[0] === 'invitation' && segments.length === 3) {
    if (segments[2] === 'hero') return 'hero';
    if (segments[2] === 'gallery') return 'gallery';
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  if (segments[0] === 'template' && segments.length === 3) {
    if (segments[2] === 'thumbnail') return 'thumbnail';
    if (segments[2] === 'gallery') return 'asset';
    if (segments[2] === 'hero') return 'hero';
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
  const fileName = segments[segments.length - 1] || '';
  const dir = segments.slice(0, -1).join('/');

  if (segments[0] === 'invitation' && segments[2] === 'hero' && fileName.toLowerCase() === 'original.jpg') {
    return `${segments.slice(0, 3).join('/')}/thumb.jpg`;
  }
  if (segments[0] === 'template' && segments[2] === 'hero' && fileName.toLowerCase() === 'original.jpg') {
    return `${segments.slice(0, 3).join('/')}/thumb.jpg`;
  }
  if (segments[0] === 'template' && segments[2] === 'thumbnail' && fileName.toLowerCase() === 'main.jpg') {
    return `${segments.slice(0, 3).join('/')}/thumb.jpg`;
  }

  if (segments[0] === 'invitation' && segments[1] === 'thumbnails') {
    const file = segments[2] || '';
    if (file.endsWith('.jpg')) {
      const base = file.replace(/\.jpg$/i, '');
      return `invitation/thumbnails/thumb_${base}.jpg`;
    }
  }
  if (segments[0] === 'templates' && segments[1] === 'thumbnails') {
    const fn = segments[2] || '';
    const baseName = fn.replace(/\.webp$/i, '');
    return `templates/thumbnails/thumb_${baseName}.webp`;
  }

  const baseName = fileName.replace(/\.webp$/i, '').replace(/\.jpg$/i, '');
  return `${dir}/thumb_${baseName}.webp`;
}

function resolveRelatedDeleteKeys(key: string): string[] {
  const segments = key.split('/').filter(Boolean);
  if (segments.length === 0) return [key];

  const fileName = segments[segments.length - 1] || '';
  const dir = segments.slice(0, -1).join('/');
  const related = new Set<string>([key]);

  const fnLower = fileName.toLowerCase();
  if (
    (segments[0] === 'invitation' || segments[0] === 'template') &&
    (segments[2] === 'hero' || segments[2] === 'gallery') &&
    (fnLower === 'original.jpg' || fnLower === 'thumb.jpg')
  ) {
    const heroDir = segments.slice(0, 3).join('/');
    related.add(`${heroDir}/original.jpg`);
    related.add(`${heroDir}/thumb.jpg`);
    return Array.from(related);
  }

  if (segments[0] === 'template' && segments[2] === 'thumbnail' && (fnLower === 'main.jpg' || fnLower === 'thumb.jpg')) {
    const tdir = segments.slice(0, 3).join('/');
    related.add(`${tdir}/main.jpg`);
    related.add(`${tdir}/thumb.jpg`);
    return Array.from(related);
  }

  if (segments[0] === 'invitation' && segments[1] === 'thumbnails' && fileName.endsWith('.jpg')) {
    if (fileName.startsWith('thumb_')) {
      related.add(`${dir}/${fileName.replace(/^thumb_/, '')}`);
    } else {
      related.add(`${dir}/thumb_${fileName}`);
    }
    return Array.from(related);
  }

  if (fileName.endsWith('.webp')) {
    if (fileName.startsWith('thumb_')) {
      related.add(`${dir}/${fileName.replace(/^thumb_/, '')}`);
    } else {
      related.add(`${dir}/thumb_${fileName}`);
    }
  }

  if (
    (segments[0] === 'invitation' || segments[0] === 'template') &&
    segments[2] === 'gallery' &&
    fileName.toLowerCase().endsWith('.jpg')
  ) {
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

  const prefix = hasE2EPrefix ? `${E2E_MEDIA_PREFIX}/` : '';

  const tempTagged = normalizedPath.match(
    /^invitation\/temp\/(inv-hero|inv-gallery|tpl-thumb|tpl-asset|usr-asset)###([^#]+)###([^/]+)\.upload$/
  );
  if (tempTagged) {
    const kind = tempTagged[1];
    const entityId = sanitizePathSegment(tempTagged[2]);
    const uploadTok = tempTagged[3].replace(/[^a-zA-Z0-9_-]/g, '') || crypto.randomUUID();
    const token = `${Math.floor(Date.now() / 1000)}-${uploadTok.slice(0, 12)}`;
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }

    if (kind === 'inv-hero') {
      const originalKey = `invitation/${entityId}/hero/${token}.webp`;
      const thumbnailKey = `invitation/${entityId}/hero/thumb_${token}.webp`;
      return { originalKey: `${prefix}${originalKey}`, thumbnailKey: `${prefix}${thumbnailKey}`, assetType: 'hero' };
    }
    if (kind === 'inv-gallery') {
      const originalKey = `invitation/${entityId}/gallery/${token}.webp`;
      const thumbnailKey = `invitation/${entityId}/gallery/thumb_${token}.webp`;
      return {
        originalKey: `${prefix}${originalKey}`,
        thumbnailKey: `${prefix}${thumbnailKey}`,
        assetType: 'gallery',
      };
    }
    if (kind === 'tpl-thumb') {
      const originalKey = `template/${entityId}/thumbnail/main.jpg`;
      const thumbnailKey = `template/${entityId}/thumbnail/thumb.jpg`;
      return {
        originalKey: `${prefix}${originalKey}`,
        thumbnailKey: `${prefix}${thumbnailKey}`,
        assetType: 'thumbnail',
      };
    }
    if (kind === 'tpl-asset') {
      const originalKey = `template/${entityId}/gallery/${token}.webp`;
      const thumbnailKey = `template/${entityId}/gallery/thumb_${token}.webp`;
      return {
        originalKey: `${prefix}${originalKey}`,
        thumbnailKey: `${prefix}${thumbnailKey}`,
        assetType: 'asset',
      };
    }
    const sessionId = crypto.randomBytes(16).toString('hex');
    const originalKey = buildR2Key({
      type: 'temp',
      id: sessionId,
      filename: `user-${token}.webp`,
    });
    const thumbnailKey = buildR2Key({
      type: 'temp',
      id: sessionId,
      filename: `thumb_user-${token}.webp`,
    });
    return {
      originalKey: `${prefix}${originalKey}`,
      thumbnailKey: `${prefix}${thumbnailKey}`,
      assetType: 'asset',
    };
  }

  if (segments[0] === 'templates' && segments[1] === 'thumbnails' && segments.length >= 4) {
    const entityId = sanitizePathSegment(segments[2] || '');
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    const originalKey = `template/${entityId}/thumbnail/main.jpg`;
    const thumbnailKey = `template/${entityId}/thumbnail/thumb.jpg`;
    return {
      originalKey: `${prefix}${originalKey}`,
      thumbnailKey: `${prefix}${thumbnailKey}`,
      assetType: 'thumbnail',
    };
  }

  if (
    segments[0] === 'invitation' &&
    segments.length === 4 &&
    (segments[2] === 'hero' || segments[2] === 'gallery')
  ) {
    const invitationId = sanitizePathSegment(segments[1] || '');
    const kind = segments[2];
    const token = extractBaseName(segments[3] || '');
    if (!invitationId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    const folder = kind === 'hero' ? 'hero' : 'gallery';
    const originalKey = `invitation/${invitationId}/${folder}/${token}.webp`;
    const thumbnailKey = `invitation/${invitationId}/${folder}/thumb_${token}.webp`;
    return {
      originalKey: `${prefix}${originalKey}`,
      thumbnailKey: `${prefix}${thumbnailKey}`,
      assetType: kind === 'hero' ? 'hero' : 'gallery',
    };
  }

  if (
    segments[0] === 'invitations' &&
    segments.length === 4 &&
    (segments[2] === 'hero' || segments[2] === 'gallery')
  ) {
    const invitationId = sanitizePathSegment(segments[1] || '');
    const kind = segments[2];
    const token = extractBaseName(segments[3] || '');
    if (!invitationId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    const folder = kind === 'hero' ? 'hero' : 'gallery';
    const originalKey = `invitation/${invitationId}/${folder}/${token}.webp`;
    const thumbnailKey = `invitation/${invitationId}/${folder}/thumb_${token}.webp`;
    return {
      originalKey: `${prefix}${originalKey}`,
      thumbnailKey: `${prefix}${thumbnailKey}`,
      assetType: kind === 'hero' ? 'hero' : 'gallery',
    };
  }

  if (segments[0] === 'creator' && segments[3] === 'assets' && segments.length === 5) {
    const entityId = sanitizePathSegment(segments[2] || '');
    const token = extractBaseName(segments[4] || '');
    if (!entityId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    const originalKey = `template/${entityId}/gallery/${token}.webp`;
    const thumbnailKey = `template/${entityId}/gallery/thumb_${token}.webp`;
    return {
      originalKey: `${prefix}${originalKey}`,
      thumbnailKey: `${prefix}${thumbnailKey}`,
      assetType: 'asset',
    };
  }

  if (segments[0] === 'users' && segments.length === 3) {
    const userId = sanitizePathSegment(segments[1] || '');
    const token = extractBaseName(segments[2] || '');
    if (!userId) {
      throw new Error('INVALID_MEDIA_PATH');
    }
    const sessionId = crypto.randomBytes(16).toString('hex');
    const originalKey = buildR2Key({ type: 'temp', id: sessionId, filename: `user-${token}.webp` });
    const thumbnailKey = buildR2Key({
      type: 'temp',
      id: sessionId,
      filename: `thumb_user-${token}.webp`,
    });
    return {
      originalKey: `${prefix}${originalKey}`,
      thumbnailKey: `${prefix}${thumbnailKey}`,
      assetType: 'asset',
    };
  }

  const fileName = segments[segments.length - 1] || '';
  const baseName = extractBaseName(fileName);
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

async function optimizeToJpeg(buffer: Buffer, widthLimit: number, quality: number): Promise<Buffer> {
  try {
    const image = sharp(buffer, { failOn: 'none', limitInputPixels: SHARP_LIMIT_INPUT_PIXELS }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('INVALID_IMAGE_FILE');
    }
    if (metadata.width > widthLimit) {
      return image
        .resize({ width: widthLimit, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }
    return image.jpeg({ quality, mozjpeg: true }).toBuffer();
  } catch (_error) {
    throw new Error('INVALID_IMAGE_FILE');
  }
}

export async function uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
  const assetType = params.assetType || 'asset';
  const key = buildStorageKey(params);
  const thumbnailKey = resolveThumbnailKeyForOriginalKey(key);
  const thumbnailWidth = getThumbnailWidth(assetType);

  if (params.context === 'template' && assetType === 'thumbnail') {
    const optimized = await optimizeToJpeg(params.fileBuffer, MAX_IMAGE_WIDTH, 88);
    const thumbnail = await optimizeToJpeg(
      params.fileBuffer,
      Math.min(MAX_IMAGE_WIDTH, thumbnailWidth),
      82
    );
    const url = await uploadFile(optimized, key, 'image/jpeg');
    const thumbnailUrl = await uploadFile(thumbnail, thumbnailKey, 'image/jpeg');
    return {
      url,
      key,
      mimeType: 'image/jpeg',
      fileSize: optimized.byteLength,
      thumbnailUrl,
      thumbnailKey,
    };
  }

  const optimized = await optimizeToWebp(params.fileBuffer, MAX_IMAGE_WIDTH, getWebpQuality(assetType));
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
  folder?: string;
  fileKey?: string;
  contentType: string;
}): Promise<{ uploadUrl: string; fileKey: string }> {
  let rawKey: string;
  if (params.fileKey) {
    const { normalizedPath, hasE2EPrefix } = normalizePathWithOptionalE2EPrefix(params.fileKey);
    rawKey = applyE2EPrefix(normalizedPath, hasE2EPrefix);
  } else if (params.folder) {
    const { normalizedPath, hasE2EPrefix } = normalizePathWithOptionalE2EPrefix(params.folder);
    resolveAssetTypeFromFolder(params.folder);
    const folderWithPrefix = applyE2EPrefix(normalizedPath, hasE2EPrefix);
    rawKey = `${folderWithPrefix}/${crypto.randomUUID()}.upload`;
  } else {
    throw new Error('INVALID_MEDIA_FOLDER');
  }

  const uploadUrl = await createPresignedUploadUrl({
    key: rawKey,
    contentType: params.contentType,
  });
  return {
    uploadUrl,
    fileKey: rawKey,
  };
}

export async function completeDirectUpload(fileKey: string): Promise<UploadImageResult> {
  const sourceBuffer = await readFileBuffer(fileKey);
  const { originalKey, thumbnailKey, assetType } = resolveDirectUploadTarget(fileKey);
  const thumbnailWidth = getThumbnailWidth(assetType);
  const quality = getWebpQuality(assetType);
  let fileSize = 0;

  if (assetType === 'thumbnail') {
    const optimized = await optimizeToJpeg(sourceBuffer, MAX_IMAGE_WIDTH, 88);
    const thumbnail = await optimizeToJpeg(sourceBuffer, Math.min(MAX_IMAGE_WIDTH, thumbnailWidth), 82);
    fileSize = optimized.byteLength;
    await Promise.all([
      uploadFile(optimized, originalKey, 'image/jpeg'),
      uploadFile(thumbnail, thumbnailKey, 'image/jpeg'),
    ]);
  } else {
    const optimized = await optimizeToWebp(sourceBuffer, MAX_IMAGE_WIDTH, quality);
    const thumbnail = await optimizeToWebp(sourceBuffer, Math.min(MAX_IMAGE_WIDTH, thumbnailWidth), quality);
    fileSize = optimized.byteLength;
    await Promise.all([
      uploadFile(optimized, originalKey, 'image/webp'),
      uploadFile(thumbnail, thumbnailKey, 'image/webp'),
    ]);
  }

  if (fileKey !== originalKey) {
    await deleteFile(fileKey).catch(() => undefined);
  }

  const publicMain = buildCanonicalPublicUrl(originalKey);
  const publicThumb = buildCanonicalPublicUrl(thumbnailKey);
  console.log('[R2_UPLOAD]', { key: originalKey, url: publicMain });

  return {
    url: publicMain,
    key: originalKey,
    mimeType: assetType === 'thumbnail' ? 'image/jpeg' : 'image/webp',
    fileSize,
    thumbnailUrl: publicThumb,
    thumbnailKey,
  };
}

export async function deleteImageByUrl(fileUrl: string): Promise<boolean> {
  const normalized = fileUrl.trim();
  if (!normalized) return false;

  const key = resolveKeyFromPublicUrl(normalized.split('?')[0]);
  if (!key) return false;

  const optimized = parseInvitationOptimizedOriginalKey(key);
  if (optimized) {
    await deleteStoragePrefix(`${optimized.basePrefix}/`);
    return true;
  }

  const keys = resolveRelatedDeleteKeys(key);
  await Promise.all(keys.map((targetKey) => deleteFile(targetKey).catch(() => undefined)));
  return true;
}

export function resolveStorageKeyFromUrl(fileUrl: string): string | null {
  return resolveKeyFromPublicUrl(fileUrl.split('?')[0]);
}

export async function deleteStoragePrefix(prefix: string): Promise<number> {
  const normalized = normalizeFolder(prefix);
  return deleteFilesByPrefix(`${normalized}/`);
}
