import type { TemplatePreviewData } from '@/src/templates/previewData';

function trimUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t || undefined;
}

function normalizeGallery(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const urls = v
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map((u) => u.trim());
  return urls;
}

function ensureGalleryArray(next: Record<string, unknown>): void {
  if (!('galleryImages' in next)) return;
  if (!Array.isArray(next.galleryImages)) {
    next.galleryImages = [];
  }
}

/**
 * studioConfig에 저장된 미디어 URL을 preview 렌더 데이터에 반영합니다.
 * (히어로/갤러리는 `data`만 읽는 템플릿과 호환되도록 단일 병합 경로를 둡니다.)
 */
export function applyStudioConfigToPreviewData<T extends TemplatePreviewData>(
  result: T,
  studioConfig: unknown
): T {
  const next = { ...result } as Record<string, unknown>;

  if (!studioConfig || typeof studioConfig !== 'object' || Array.isArray(studioConfig)) {
    ensureGalleryArray(next);
    return next as T;
  }

  const sc = studioConfig as Record<string, unknown>;
  const hero = trimUrl(sc.heroImage);
  const coverDirect = trimUrl(sc.coverImage);
  const galleryFromStudio = normalizeGallery(sc.galleryImages);

  if (hero && 'heroImage' in next) {
    next.heroImage = hero;
  }

  if ('galleryImages' in next) {
    if (galleryFromStudio !== undefined) {
      next.galleryImages = galleryFromStudio;
    }
    ensureGalleryArray(next);
  }

  const cover = coverDirect ?? hero;
  if (cover && 'coverImage' in next) {
    next.coverImage = cover;
  }

  return next as T;
}
