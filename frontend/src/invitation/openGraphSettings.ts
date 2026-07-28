/**
 * Invitation Open Graph SSOT — Editor Preview / Public metadata / KakaoTalk payload 공통.
 * Server Component에서도 import 가능한 순수 TypeScript 모듈.
 */

export type OpenGraphImageMode = 'CUSTOM' | 'HERO' | 'NONE';

export type InvitationOpenGraphSettings = {
  title: string;
  description: string;
  imageUrl?: string;
  imageMode: OpenGraphImageMode | 'LEGACY';
  canonicalUrl: string;
};

export type InvitationOpenGraphInput = {
  title?: string | null;
  eventDate?: string | null;
  locationText?: string | null;
  dataJson?: unknown;
  data?: unknown;
  shareSlug?: string | null;
  slug?: string | null;
};

/** getInvitationOpenGraphSettings 이미지 해석 목적 */
export type OpenGraphImagePurpose = 'editor-preview' | 'public-meta' | 'share-payload';

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 160;

const DEFAULT_TITLE = {
  WEDDING: '결혼식에 초대합니다',
  FUNERAL: '부고 안내',
  GENERAL: '행사에 초대합니다',
} as const;

const DEFAULT_DESCRIPTION = {
  WEDDING: '소중한 날에 함께해 주세요',
  FUNERAL: '삼가 알려드립니다',
  GENERAL: '행사에 초대드립니다',
} as const;

/** Kakao feed 등 imageUrl 권장 시 NONE 상태 concept 공용 fallback */
export const CONCEPT_SHARE_FALLBACK_IMAGE: Record<'WEDDING' | 'FUNERAL' | 'GENERAL', string> = {
  WEDDING: 'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg',
  FUNERAL: 'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg',
  GENERAL: 'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg',
};

export function getConceptOpenGraphFallbackImage(
  concept: 'WEDDING' | 'FUNERAL' | 'GENERAL' = 'WEDDING'
): string {
  return CONCEPT_SHARE_FALLBACK_IMAGE[concept] || CONCEPT_SHARE_FALLBACK_IMAGE.WEDDING;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function pickString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

function stripControlAndTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeOpenGraphTitle(value: string): string {
  const cleaned = stripControlAndTags(value);
  if (cleaned.length <= TITLE_MAX) return cleaned;
  return `${cleaned.slice(0, TITLE_MAX - 1)}…`;
}

export function sanitizeOpenGraphDescription(value: string): string {
  const cleaned = stripControlAndTags(value);
  if (cleaned.length <= DESCRIPTION_MAX) return cleaned;
  return `${cleaned.slice(0, DESCRIPTION_MAX - 1)}…`;
}

/**
 * OG/카카오 크롤러용 영구 HTTPS 이미지 URL만 허용.
 * blob / data / localhost / relative-only / presigned 쿼리 남발은 거부.
 */
export function isValidOpenGraphImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
    if (/[?&]X-Amz-Signature=/i.test(parsed.search) || /[?&]Signature=/i.test(parsed.search)) {
      return false;
    }
    return Boolean(parsed.pathname && parsed.pathname !== '/');
  } catch {
    return false;
  }
}

export function resolveAbsoluteOpenGraphImageUrl(
  raw: string | null | undefined,
  siteOrigin?: string
): string | undefined {
  const value = (raw || '').trim();
  if (!value) return undefined;
  if (value.startsWith('/')) {
    const origin = (siteOrigin || '').replace(/\/+$/, '');
    if (!origin) return undefined;
    try {
      const absolute = new URL(value, `${origin}/`).toString();
      return isValidOpenGraphImageUrl(absolute) ? absolute : undefined;
    } catch {
      return undefined;
    }
  }
  return isValidOpenGraphImageUrl(value) ? value : undefined;
}

function pickConcept(data: Record<string, unknown>, inv: Record<string, unknown>): keyof typeof DEFAULT_TITLE {
  const value = data.conceptType ?? inv.conceptType;
  if (value === 'WEDDING' || value === 'FUNERAL' || value === 'GENERAL') return value;
  return 'GENERAL';
}

function formatWhen(iso: string): string | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return null;
  }
}

function buildFallbackDescription(params: {
  concept: keyof typeof DEFAULT_TITLE;
  eventDate?: string;
  locationText?: string;
}): string {
  const eventLine = params.eventDate ? formatWhen(params.eventDate) : null;
  const location = (params.locationText || '').trim();
  const parts = [eventLine, location].filter(Boolean);
  if (parts.length > 0) return parts.join(' · ');
  return DEFAULT_DESCRIPTION[params.concept];
}

export function buildPublicCanonicalUrl(siteOrigin: string, shareSlug: string): string {
  const origin = siteOrigin.replace(/\/+$/, '');
  const slug = shareSlug.trim().replace(/^\/+/, '');
  if (!slug) return `${origin}/i`;
  return `${origin}/i/${encodeURIComponent(slug)}`;
}

function parseImageMode(value: unknown): OpenGraphImageMode | null {
  if (value === 'CUSTOM' || value === 'HERO' || value === 'NONE') return value;
  return null;
}

/**
 * openGraph/share 필드에서 이미지 모드를 판정한다.
 * 명시적 NONE/제거는 Hero 자동 복귀를 막는다.
 */
export function resolveOpenGraphImageMode(
  openGraph: Record<string, unknown>,
  share: Record<string, unknown>
): OpenGraphImageMode | 'LEGACY' {
  if (openGraph.imageRemoved === true || share.ogImageRemoved === true) return 'NONE';
  const fromOg = parseImageMode(openGraph.imageMode);
  if (fromOg) return fromOg;
  const fromShare = parseImageMode(share.ogImageMode);
  if (fromShare) return fromShare;

  const custom = pickString(openGraph.imageUrl, openGraph.ogImageUrl, share.ogImage, share.ogImageUrl);
  if (custom) return 'CUSTOM';
  return 'LEGACY';
}

function resolveImageByMode(params: {
  mode: OpenGraphImageMode | 'LEGACY';
  customRaw: string;
  heroRaw: string;
  concept: keyof typeof DEFAULT_TITLE;
  purpose: OpenGraphImagePurpose;
  siteOrigin?: string;
}): string | undefined {
  const { mode, customRaw, heroRaw, concept, purpose, siteOrigin } = params;

  if (mode === 'NONE') {
    // Editor: placeholder. Public meta / Kakao: concept CDN (빈 카드·상대 dynamic 회피).
    if (purpose === 'editor-preview') return undefined;
    return resolveAbsoluteOpenGraphImageUrl(CONCEPT_SHARE_FALLBACK_IMAGE[concept], siteOrigin);
  }

  if (mode === 'CUSTOM') {
    return resolveAbsoluteOpenGraphImageUrl(customRaw, siteOrigin);
  }

  if (mode === 'HERO') {
    return resolveAbsoluteOpenGraphImageUrl(heroRaw, siteOrigin);
  }

  // LEGACY: 명시 모드 없는 기존 데이터
  const custom = resolveAbsoluteOpenGraphImageUrl(customRaw, siteOrigin);
  if (custom) return custom;

  // Editor preview: 빈 입력 = 빈 카드 (자동 Hero 금지)
  if (purpose === 'editor-preview') return undefined;

  // Public/Kakao: Hero → concept placeholder
  const hero = resolveAbsoluteOpenGraphImageUrl(heroRaw, siteOrigin);
  if (hero) return hero;
  return resolveAbsoluteOpenGraphImageUrl(CONCEPT_SHARE_FALLBACK_IMAGE[concept], siteOrigin);
}

/**
 * Invitation/public payload → Open Graph settings.
 */
export function getInvitationOpenGraphSettings(
  invitationLike: InvitationOpenGraphInput | null | undefined,
  publicUrl: string,
  options?: { siteOrigin?: string; purpose?: OpenGraphImagePurpose }
): InvitationOpenGraphSettings {
  const inv = asRecord(invitationLike);
  const data = asRecord(inv.dataJson ?? invitationLike?.dataJson ?? inv.data ?? invitationLike?.data ?? {});
  const share = asRecord(data.share);
  const openGraph = asRecord(data.openGraph);
  const concept = pickConcept(data, inv);
  const purpose = options?.purpose || 'public-meta';

  const rawTitle = pickString(
    openGraph.title,
    share.ogTitle,
    data.ogTitle,
    data.shareTitle,
    inv.title,
    invitationLike?.title,
    data.title,
    data.heroTitle,
    data.coupleNames
  );
  const title = sanitizeOpenGraphTitle(rawTitle || DEFAULT_TITLE[concept]);

  const eventDate = pickString(
    inv.eventDate,
    invitationLike?.eventDate,
    data.eventDate,
    data.funeralDate,
    data.weddingDateTime
  );
  const locationText = pickString(
    inv.locationText,
    invitationLike?.locationText,
    data.locationText,
    data.venueName,
    data.address
  );

  const rawDescription = pickString(
    openGraph.description,
    share.ogDescription,
    data.ogDescription,
    data.shareDescription,
    buildFallbackDescription({ concept, eventDate, locationText })
  );
  const description = sanitizeOpenGraphDescription(rawDescription || DEFAULT_DESCRIPTION[concept]);

  const imageMode = resolveOpenGraphImageMode(openGraph, share);
  const customRaw = pickString(openGraph.imageUrl, openGraph.ogImageUrl, share.ogImage, share.ogImageUrl);
  const heroRaw = pickString(data.heroImage);
  const imageUrl = resolveImageByMode({
    mode: imageMode,
    customRaw,
    heroRaw,
    concept,
    purpose,
    siteOrigin: options?.siteOrigin,
  });

  const canonicalUrl =
    (publicUrl || '').trim() ||
    buildPublicCanonicalUrl(
      options?.siteOrigin || '',
      pickString(inv.shareSlug, invitationLike?.shareSlug, inv.slug, invitationLike?.slug)
    );

  return {
    title: title || DEFAULT_TITLE[concept],
    description: description || DEFAULT_DESCRIPTION[concept],
    imageUrl,
    imageMode,
    canonicalUrl,
  };
}

/** Editor/save payload — canonical openGraph + legacy share 동기화 */
export function buildOpenGraphSaveFields(input: {
  title: string;
  description: string;
  imageUrl?: string;
  imageMode: OpenGraphImageMode;
}): {
  openGraph: {
    title: string;
    description: string;
    imageMode: OpenGraphImageMode;
    imageUrl: string;
    imageKey?: string;
    imageRemoved: boolean;
  };
  share: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogImageMode: OpenGraphImageMode;
    ogImageRemoved: boolean;
  };
} {
  const title = sanitizeOpenGraphTitle(input.title);
  const description = sanitizeOpenGraphDescription(input.description);
  const imageMode = input.imageMode;
  const imageUrl = input.imageUrl?.trim() || '';

  let safeImage = '';
  if (imageMode === 'NONE') {
    safeImage = '';
  } else if (imageUrl && isValidOpenGraphImageUrl(imageUrl)) {
    safeImage = imageUrl;
  } else if (imageUrl.startsWith('/')) {
    safeImage = imageUrl;
  }

  return {
    openGraph: {
      title,
      description,
      imageMode,
      imageUrl: safeImage,
      imageRemoved: imageMode === 'NONE',
    },
    share: {
      ogTitle: title,
      ogDescription: description,
      ogImage: safeImage,
      ogImageMode: imageMode,
      ogImageRemoved: imageMode === 'NONE',
    },
  };
}
