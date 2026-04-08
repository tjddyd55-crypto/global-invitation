import type { Invitation } from '@/src/models/invitation';

export type InvitationConceptKind = 'WEDDING' | 'FUNERAL' | 'GENERAL';

export type SharePresentation = {
  concept: InvitationConceptKind;
  metaTitle: string;
  metaDescription: string;
  /** OG 카드 제목 (최대 2줄, 이미지용) — 메타/OG 이미지 동일 규칙 */
  titleLines: [string] | [string, string];
  /** 부제 (날짜·장소·부고 한 줄 등) */
  detailLines: string[];
  heroImageRaw: string | null;
  /** 이미지 하단 작은 문구 (컨셉 톤) */
  toneTagline: string;
};

/** OG/스크랩 이미지용 폰트 스택 (next/og 로드 실패 시에도 동일 스택으로 렌더) */
export const OG_IMAGE_FONT_STACK =
  '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", "Pretendard Variable", Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

/** 한글 기준 한 줄 권장 글자 수 (~40–44자, 1200px 카드에서 픽셀 느낌 유사) */
export const OG_TITLE_MAX_CHARS_PER_LINE = 42;
export const OG_TITLE_MAX_LINES = 2;
/** 카카오 등 스크랩 설명 길이 상한 */
export const META_DESCRIPTION_MAX = 60;

const TONE = {
  WEDDING: '소중한 날에 함께해 주세요',
  FUNERAL: '삼가 알려드립니다',
  GENERAL: '행사에 초대드립니다',
} as const;

const DEFAULT_TITLE: Record<InvitationConceptKind, string> = {
  WEDDING: '결혼식에 초대합니다',
  FUNERAL: '부고 안내',
  GENERAL: '행사에 초대합니다',
};

/** detailLines: 메타/OG 본문과 동일 상한 */
const DETAIL_MAX_LEN = 44;
const DETAIL_MAX_LINES = 2;

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function pickConcept(data: Record<string, unknown>, inv: Record<string, unknown>): InvitationConceptKind {
  const a = data.conceptType ?? inv.conceptType;
  if (a === 'WEDDING' || a === 'FUNERAL' || a === 'GENERAL') return a;
  return 'GENERAL';
}

function pickString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

function formatWhen(iso: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return null;
  }
}

function clampMetaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  if (max <= 1) return '…';
  return `${t.slice(0, max - 1)}…`;
}

/**
 * 공백/구두점에서 우선 줄바꿈 — 없으면 글자 수로 자름(한글 단어 중간 분리 최소화).
 */
function breakFirstLine(text: string, maxLen: number): { first: string; rest: string } {
  const t = text.trim();
  if (t.length <= maxLen) return { first: t, rest: '' };

  const hard = t.slice(0, maxLen);
  const sliceForBreak = t.slice(0, Math.min(maxLen + 8, t.length));
  const delims = [' ', '　', '\n', '·', '/', '|', ',', '，', ':', '：'];
  let best = -1;
  for (const d of delims) {
    const idx = sliceForBreak.lastIndexOf(d, maxLen);
    if (idx > maxLen * 0.35) {
      best = Math.max(best, idx);
    }
  }

  if (best > 0) {
    const first = t.slice(0, best).trimEnd();
    const rest = t.slice(best).trim();
    if (first.length > 0) return { first, rest };
  }

  return { first: hard.trimEnd(), rest: t.slice(maxLen).trimStart() };
}

/**
 * OG/라이브 메타/동일 이미지에서 쓰는 제목 줄 — 반드시 이 함수만 통해 생성한다.
 */
export function buildOgTitleLines(title: string): [string] | [string, string] {
  const t = title.trim() || DEFAULT_TITLE.GENERAL;
  const { first, rest } = breakFirstLine(t, OG_TITLE_MAX_CHARS_PER_LINE);
  if (!rest) return [first];
  if (rest.length <= OG_TITLE_MAX_CHARS_PER_LINE) return [first, rest];
  const second =
    rest.length > OG_TITLE_MAX_CHARS_PER_LINE
      ? `${rest.slice(0, OG_TITLE_MAX_CHARS_PER_LINE - 1)}…`
      : rest;
  return [first, second];
}

function pushDetailLine(out: string[], line: string) {
  const s = line.trim();
  if (!s || out.length >= DETAIL_MAX_LINES) return;
  out.push(s.length <= DETAIL_MAX_LEN ? s : `${s.slice(0, DETAIL_MAX_LEN - 1)}…`);
}

/**
 * 공유 API/Invitation JSON에서 메타·OG·스크랩용 문구를 일관되게 계산한다.
 */
export function extractSharePresentationFromPayload(invitationLike: unknown): SharePresentation {
  const inv = asRecord(invitationLike);
  const data = asRecord(inv.dataJson ?? inv.data ?? {});

  const concept = pickConcept(data, inv);

  let metaTitle = pickString(inv.title, data.title, data.heroTitle, data.coupleNames);
  if (!metaTitle) {
    if (concept === 'FUNERAL') {
      const deceased = pickString(data.deceasedName);
      metaTitle = deceased ? `${deceased}님 부고` : DEFAULT_TITLE.FUNERAL;
    } else {
      metaTitle = DEFAULT_TITLE[concept];
    }
  }

  const rawDescription = TONE[concept];
  const metaDescription = clampMetaDescription(rawDescription);
  const toneTagline = rawDescription;

  const eventRaw = pickString(inv.eventDate, data.eventDate, data.funeralDate, data.weddingDateTime);
  const eventLine = eventRaw ? formatWhen(eventRaw) : null;

  const locationLine = pickString(inv.locationText, data.locationText, data.address, data.venueName);

  const shareRec = asRecord(data.share);
  const heroImageRaw = pickString(data.heroImage, data.ogImage, shareRec.ogImage) || null;

  const titleLines = buildOgTitleLines(metaTitle);
  const detailLines: string[] = [];

  if (concept === 'FUNERAL') {
    const deceased = pickString(data.deceasedName);
    const hall = pickString(data.funeralHall);
    const sub = deceased || hall;
    if (sub) pushDetailLine(detailLines, sub);
    if (eventLine) pushDetailLine(detailLines, eventLine);
    else if (pickString(data.funeralDate)) pushDetailLine(detailLines, pickString(data.funeralDate));
  } else {
    if (eventLine) pushDetailLine(detailLines, eventLine);
    if (locationLine) pushDetailLine(detailLines, locationLine);
  }

  return {
    concept,
    metaTitle,
    metaDescription,
    titleLines,
    detailLines,
    heroImageRaw,
    toneTagline,
  };
}

export function extractSharePresentationFromInvitation(invitation: Invitation): SharePresentation {
  return extractSharePresentationFromPayload(invitation);
}

export function resolveHeroImageAbsolute(heroRaw: string | null, siteOrigin: string): string | null {
  if (!heroRaw?.trim()) return null;
  const h = heroRaw.trim();
  if (h.startsWith('http://') || h.startsWith('https://')) return h;
  if (h.startsWith('/')) {
    if (!siteOrigin) return null;
    try {
      return new URL(h, siteOrigin.endsWith('/') ? siteOrigin : `${siteOrigin}/`).toString();
    } catch {
      return null;
    }
  }
  return null;
}

export const KAKAO_SHARE_BUTTON_LABEL = '초대장 보기';
