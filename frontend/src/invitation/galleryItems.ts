/**
 * Gallery SSOT — concept 무관 정규화.
 * Persistable items only (demo/placeholder/empty 제외).
 */

import { sanitizeGalleryItems, type GalleryAssetInput } from './galleryAsset';

export type InvitationGalleryItem = {
  id: string;
  url: string;
  alt: string;
  objectPosition?: string;
  objectKey?: string;
  source?: string;
};

type GallerySource = {
  galleryImages?: unknown;
  gallery?: unknown;
  galleryItems?: unknown;
  galleryMedia?: unknown;
};

function asUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function collectRawInputs(invitationData: GallerySource): GalleryAssetInput[] {
  const mediaByUrl = new Map<string, string>();
  if (Array.isArray(invitationData.galleryMedia)) {
    invitationData.galleryMedia.forEach((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
      const record = entry as Record<string, unknown>;
      const url = asUrl(record.url);
      const key = asUrl(record.key ?? record.objectKey ?? record.fileKey);
      if (url && key) mediaByUrl.set(url, key);
    });
  }

  const pushList = (list: unknown[]): GalleryAssetInput[] => {
    const items: GalleryAssetInput[] = [];
    list.forEach((entry, index) => {
      if (typeof entry === 'string') {
        const url = asUrl(entry);
        if (!url) return;
        items.push({
          id: `gallery-${index + 1}`,
          url,
          objectKey: mediaByUrl.get(url),
        });
        return;
      }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
      const record = entry as Record<string, unknown>;
      const url = asUrl(record.url ?? record.src ?? record.image);
      if (!url) return;
      const objectKey =
        asUrl(record.objectKey) ||
        asUrl(record.mediaId) ||
        asUrl(record.key) ||
        asUrl(record.fileKey) ||
        mediaByUrl.get(url) ||
        undefined;
      items.push({
        id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `gallery-${index + 1}`,
        url,
        objectKey,
        mediaId: asUrl(record.mediaId) || undefined,
        name: asUrl(record.name) || asUrl(record.alt) || undefined,
        source:
          record.source === 'USER_UPLOAD' ||
          record.source === 'SHARED' ||
          record.source === 'PLACEHOLDER' ||
          record.source === 'LEGACY'
            ? record.source
            : undefined,
      });
    });
    return items;
  };

  if (Array.isArray(invitationData.galleryItems) && invitationData.galleryItems.length > 0) {
    const fromItems = pushList(invitationData.galleryItems);
    if (fromItems.length > 0) return fromItems;
  }

  if (Array.isArray(invitationData.galleryImages) && invitationData.galleryImages.length > 0) {
    return pushList(invitationData.galleryImages);
  }

  if (Array.isArray(invitationData.gallery) && invitationData.gallery.length > 0) {
    return pushList(invitationData.gallery);
  }

  return [];
}

/** concept 무관 gallery selector — Editor / Preview / Public / completeness / save 공통 */
export function getInvitationGalleryItems(
  invitationData: GallerySource | null | undefined,
  options?: { alt?: string }
): InvitationGalleryItem[] {
  if (!invitationData || typeof invitationData !== 'object') return [];
  const altFallback = options?.alt?.trim() || 'Gallery image';

  return sanitizeGalleryItems(collectRawInputs(invitationData)).map((item) => ({
    id: item.id,
    url: item.url,
    alt: item.name || altFallback,
    objectKey: item.objectKey,
    source: item.source,
  }));
}
