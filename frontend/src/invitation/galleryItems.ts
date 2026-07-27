/**
 * Gallery SSOT — concept 무관 정규화.
 */

export type InvitationGalleryItem = {
  id: string;
  url: string;
  alt: string;
  objectPosition?: string;
};

type GallerySource = {
  galleryImages?: unknown;
  gallery?: unknown;
  galleryItems?: unknown;
};

function asUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function fromStringList(list: unknown[], altFallback: string): InvitationGalleryItem[] {
  const items: InvitationGalleryItem[] = [];
  list.forEach((entry, index) => {
    const url = asUrl(entry);
    if (!url) return;
    items.push({
      id: `gallery-${index + 1}`,
      url,
      alt: altFallback,
    });
  });
  return items;
}

function fromObjectList(list: unknown[], altFallback: string): InvitationGalleryItem[] {
  const items: InvitationGalleryItem[] = [];
  list.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const record = entry as Record<string, unknown>;
    const url = asUrl(record.url ?? record.src ?? record.image);
    if (!url) return;
    const alt =
      (typeof record.alt === 'string' && record.alt.trim()) ||
      (typeof record.name === 'string' && record.name.trim()) ||
      altFallback;
    const objectPosition =
      typeof record.objectPosition === 'string' && record.objectPosition.trim()
        ? record.objectPosition.trim()
        : undefined;
    items.push({
      id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `gallery-${index + 1}`,
      url,
      alt,
      objectPosition,
    });
  });
  return items;
}

/** concept 무관 gallery selector */
export function getInvitationGalleryItems(
  invitationData: GallerySource | null | undefined,
  options?: { alt?: string }
): InvitationGalleryItem[] {
  if (!invitationData || typeof invitationData !== 'object') return [];
  const altFallback = options?.alt?.trim() || 'Gallery image';

  if (Array.isArray(invitationData.galleryItems) && invitationData.galleryItems.length > 0) {
    const fromItems = fromObjectList(invitationData.galleryItems, altFallback);
    if (fromItems.length > 0) return fromItems;
  }

  if (Array.isArray(invitationData.galleryImages) && invitationData.galleryImages.length > 0) {
    if (invitationData.galleryImages.every((item) => typeof item === 'string')) {
      return fromStringList(invitationData.galleryImages, altFallback);
    }
    return fromObjectList(invitationData.galleryImages, altFallback);
  }

  if (Array.isArray(invitationData.gallery) && invitationData.gallery.length > 0) {
    if (invitationData.gallery.every((item) => typeof item === 'string')) {
      return fromStringList(invitationData.gallery, altFallback);
    }
    return fromObjectList(invitationData.gallery, altFallback);
  }

  return [];
}
