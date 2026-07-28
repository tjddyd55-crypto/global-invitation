/**
 * Gallery asset source SSOT — Editor / Preview / Public / save payload 공통.
 */

export type GalleryAssetSource = 'USER_UPLOAD' | 'SHARED' | 'PLACEHOLDER' | 'LEGACY';

export type GalleryAssetInput = {
  id?: string;
  url?: string | null;
  objectKey?: string | null;
  mediaId?: string | null;
  name?: string | null;
  source?: GalleryAssetSource | null;
};

export type ClassifiedGalleryAsset = {
  id: string;
  url: string;
  objectKey?: string;
  mediaId?: string;
  name?: string;
  source: GalleryAssetSource;
};

const DEMO_GALLERY_PATH =
  /^\/images\/(wedding|funeral|general)\/classic\/gallery(_\d+)?\.(jpe?g|png|webp)$/i;
const DEMO_GALLERY_BASENAME = /\/gallery_\d+\.(jpe?g|png|webp)$/i;

function trim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pathOnly(url: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return new URL(url).pathname;
    }
  } catch {
    // ignore
  }
  return url.split('?')[0] || url;
}

/** Template/demo/static sample gallery asset */
export function isDemoGalleryAsset(url: string, objectKey?: string): boolean {
  const key = trim(objectKey);
  if (key.startsWith('invitation/shared/')) return false;
  const path = pathOnly(trim(url));
  if (!path) return false;
  if (DEMO_GALLERY_PATH.test(path)) return true;
  if (path.startsWith('/images/') && DEMO_GALLERY_BASENAME.test(path)) return true;
  return false;
}

export function isSharedInvitationAssetUrlOrKey(url: string, objectKey?: string): boolean {
  const key = trim(objectKey);
  if (key.includes('/shared/') || key.startsWith('invitation/shared/')) return true;
  const path = pathOnly(trim(url));
  return path.includes('/invitation/shared/') || path.includes('/shared/images/') || path.includes('/shared/music/');
}

/** Canonical or legacy user R2 key / URL */
export function isUserInvitationAsset(url: string, objectKey?: string): boolean {
  const key = trim(objectKey).replace(/^\/+/, '');
  if (
    /^invitation\/(development|production)\/users\//.test(key) ||
    /^(development|production)\/invitation\/users\//.test(key) ||
    /^invitation\/users\//.test(key)
  ) {
    return true;
  }

  const path = pathOnly(trim(url));
  if (!path) return false;
  return (
    /\/invitation\/(development|production)\/users\//.test(path) ||
    /\/(development|production)\/invitation\/users\//.test(path) ||
    /\/invitation\/users\//.test(path)
  );
}

export function classifyGalleryAssetSource(input: GalleryAssetInput): GalleryAssetSource {
  if (input.source === 'USER_UPLOAD' || input.source === 'SHARED' || input.source === 'PLACEHOLDER') {
    return input.source;
  }

  const url = trim(input.url);
  const objectKey = trim(input.objectKey) || trim(input.mediaId);

  if (!url && !objectKey) return 'PLACEHOLDER';
  if (isDemoGalleryAsset(url, objectKey)) return 'PLACEHOLDER';
  if (isSharedInvitationAssetUrlOrKey(url, objectKey)) return 'SHARED';
  if (isUserInvitationAsset(url, objectKey)) return 'USER_UPLOAD';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return 'LEGACY';
  }
  return 'PLACEHOLDER';
}

/** @deprecated Prefer isSharedInvitationAssetUrlOrKey — alias for tests/docs */
export function isSharedInvitationAsset(url: string, objectKey?: string): boolean {
  return isSharedInvitationAssetUrlOrKey(url, objectKey);
}

export function shouldDeleteRemoteGalleryAsset(input: GalleryAssetInput): boolean {
  const source = classifyGalleryAssetSource(input);
  if (source !== 'USER_UPLOAD' && source !== 'LEGACY') return false;
  const objectKey = trim(input.objectKey) || trim(input.mediaId);
  if (objectKey) {
    return isUserInvitationAsset(input.url || '', objectKey) || source === 'USER_UPLOAD';
  }
  const url = trim(input.url);
  return Boolean(url) && isUserInvitationAsset(url);
}

function toClassified(input: GalleryAssetInput, index: number): ClassifiedGalleryAsset | null {
  const url = trim(input.url);
  if (!url) return null;
  const objectKey = trim(input.objectKey) || undefined;
  const mediaId = trim(input.mediaId) || undefined;
  const source = classifyGalleryAssetSource({ ...input, url, objectKey, mediaId });
  if (source === 'PLACEHOLDER') return null;
  return {
    id: trim(input.id) || `gallery-${index + 1}`,
    url,
    objectKey,
    mediaId,
    name: trim(input.name) || undefined,
    source,
  };
}

/**
 * Persistable gallery items only.
 * Drops placeholder/demo/empty; keeps USER_UPLOAD + explicit SHARED + recoverable LEGACY.
 */
export function sanitizeGalleryItems(inputs: GalleryAssetInput[]): ClassifiedGalleryAsset[] {
  const seen = new Set<string>();
  const result: ClassifiedGalleryAsset[] = [];

  inputs.forEach((input, index) => {
    const item = toClassified(input, index);
    if (!item) return;
    const dedupeKey = `${item.source}:${item.objectKey || item.url}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    result.push(item);
  });

  return result;
}

export function sanitizeGalleryUrls(urls: Array<string | null | undefined>): string[] {
  return sanitizeGalleryItems(urls.map((url) => ({ url: url || '' }))).map((item) => item.url);
}

/** Keep only confirmed user uploads (first upload replaces demo leftovers). */
export function keepUserUploadGalleryItems(inputs: GalleryAssetInput[]): ClassifiedGalleryAsset[] {
  return sanitizeGalleryItems(inputs).filter((item) => item.source === 'USER_UPLOAD');
}
