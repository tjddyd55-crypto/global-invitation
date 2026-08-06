/**
 * Editorial GRID_EXPAND — presentation-only slot + object-fit resolvers.
 * Never persisted to dataJson.
 */

export type EditorialGallerySlot =
  | 'WIDE'
  | 'PORTRAIT_LEFT'
  | 'PORTRAIT_RIGHT'
  | 'TALL_LEFT'
  | 'MEDIUM_RIGHT'
  | 'WIDE_SECONDARY';

export type GalleryObjectFit = 'cover' | 'contain';

/** Repeating magazine rhythm (6 slots). Paired rows share equal heights via CSS. */
export const EDITORIAL_GALLERY_SLOT_PATTERN: readonly EditorialGallerySlot[] = [
  'WIDE',
  'PORTRAIT_LEFT',
  'PORTRAIT_RIGHT',
  'TALL_LEFT',
  'MEDIUM_RIGHT',
  'WIDE_SECONDARY',
] as const;

const PAIR_LEFT = new Set<EditorialGallerySlot>(['PORTRAIT_LEFT', 'TALL_LEFT']);

export function getEditorialGallerySlot(index: number): EditorialGallerySlot {
  const safe = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  return EDITORIAL_GALLERY_SLOT_PATTERN[safe % EDITORIAL_GALLERY_SLOT_PATTERN.length]!;
}

/**
 * Last item alone in a pair column → promote to full-width (no empty column).
 */
export function isEditorialLastSingleOrphan(index: number, total: number): boolean {
  if (total <= 0 || index !== total - 1) return false;
  return PAIR_LEFT.has(getEditorialGallerySlot(index));
}

/**
 * Resolve slot for visible collage index within a pool of `total` items.
 * Small counts use intentional short layouts; 6+ follow the repeating pattern.
 */
export function resolveEditorialGallerySlot(index: number, total: number): EditorialGallerySlot {
  if (total <= 0 || index < 0 || index >= total) return 'WIDE';

  if (total === 1) return 'WIDE';

  if (total === 2) {
    return index === 0 ? 'WIDE' : 'WIDE_SECONDARY';
  }

  if (total === 3) {
    if (index === 0) return 'WIDE';
    return index === 1 ? 'PORTRAIT_LEFT' : 'PORTRAIT_RIGHT';
  }

  if (total === 4) {
    if (index === 0) return 'WIDE';
    if (index === 1) return 'PORTRAIT_LEFT';
    if (index === 2) return 'PORTRAIT_RIGHT';
    return 'WIDE_SECONDARY';
  }

  if (total === 5) {
    if (index === 0) return 'WIDE';
    if (index === 1) return 'PORTRAIT_LEFT';
    if (index === 2) return 'PORTRAIT_RIGHT';
    if (index === 3) return 'TALL_LEFT';
    return 'MEDIUM_RIGHT';
  }

  // 6+ (including 9 / 10+ expanded): repeating pattern + orphan promotion
  if (isEditorialLastSingleOrphan(index, total)) return 'WIDE_SECONDARY';
  return getEditorialGallerySlot(index);
}

/**
 * Extreme ratios → contain (poster/doc/banner). Normal photos → cover.
 * ratio = width / height. null → cover (slot size stays fixed until load).
 */
export function resolveEditorialGalleryObjectFit(ratio: number | null | undefined): GalleryObjectFit {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return 'cover';
  if (ratio < 0.65) return 'contain';
  if (ratio > 1.9) return 'contain';
  return 'cover';
}

export function computeImageAspectRatio(width: number, height: number): number | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return width / height;
}
