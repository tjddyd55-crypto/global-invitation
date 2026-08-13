import { I18N_KEYS, translate, type Language } from '@/src/i18n';
import { invitationT } from '@/src/i18n/invitationT';
import { languageFromLocale, resolveInvitationLocale } from '@/src/i18n/productLocales';
import { formatDateTime } from '@/src/lib/i18n/format';
import type { Invitation } from '@/src/lib/api';
import { buildWeddingClassicHeroTitle } from '@/src/templates/weddingClassic/data';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { getConceptPresentationConfig } from '@/src/invitation/conceptPresentationConfig';
import {
  DEFAULT_BRAND_ACCENT_COLOR,
  isInvitationConceptType,
  normalizeOrganizationBranding,
} from '@/src/invitation/conceptTypes';
import { sanitizeGalleryItems } from '@/src/invitation/galleryAsset';
import { normalizeGalleryDisplayMode } from '@/src/invitation/galleryDisplay';
import type {
  WeddingEditorAccount,
  WeddingEditorImage,
  WeddingEditorState,
} from './weddingEditor.types';

type EditorConceptType = WeddingEditorState['setup']['conceptType'];

const DEFAULT_HERO_IMAGE = '/images/wedding/classic/hero.jpg';
const DEFAULT_GROOM_IMAGE = '/images/wedding/classic/groom.jpg';
const DEFAULT_BRIDE_IMAGE = '/images/wedding/classic/bride.jpg';
const DEFAULT_MAP_IMAGE = '/images/wedding/classic/map.jpg';
/** Preview/demo fixture only — never stored in invitation dataJson */
const PREVIEW_SAMPLE_GALLERY_IMAGES = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `/images/wedding/classic/gallery_${number}.jpg`;
});

const DEFAULT_EVENT_DATE_TIME = '2025-04-13T17:20';
const DEFAULT_VENUE_NAME = '더링크호텔 서울';
const DEFAULT_VENUE_DETAIL = '3층 베일리홀';
const DEFAULT_INTRO_QUOTE = '예쁜 예감이 들었다. 우리는 언제나 손을 잡고 있게 될 것이다.';

const DEFAULT_TRANSPORT = ['신도림역 1번 출구 앞'];
const DEFAULT_PARKING = ['웨딩고객 주차 1시간 30분 무료'];

const DEFAULT_ACCOUNTS: Omit<WeddingEditorAccount, 'id'>[] = [
  { role: '신랑', bank: '신한은행', number: '110464926697', holder: '유동규' },
  { role: '신부', bank: '신한은행', number: '110237577153', holder: '이소영' },
  { role: '신부 아버지', bank: '국민은행', number: '29870204098895', holder: '이상금' },
];

function parseCoupleNames(rawTitle?: string | null): { coupleNames: string; groomName: string; brideName: string } {
  const fallback = { coupleNames: '동규 ♥ 소영', groomName: '유동규', brideName: '이소영' };
  if (!rawTitle) return fallback;

  const normalized = rawTitle.replace('❤', '♥');
  const separator = normalized.includes('♥') ? '♥' : normalized.includes('&') ? '&' : null;
  if (!separator) {
    return { ...fallback, coupleNames: rawTitle };
  }

  const [left, right] = normalized.split(separator).map((part) => part.trim()).filter(Boolean);
  if (!left || !right) return { ...fallback, coupleNames: rawTitle };
  return { coupleNames: `${left} ♥ ${right}`, groomName: left, brideName: right };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * datetime-local 입력용 문자열.
 * ISO 원문이 오면 UTC toISOString 으로 시각이 밀리지 않게 로컬 벽시계를 유지한다.
 */
function toDateTimeLocal(source?: string | null): string {
  if (!source) return DEFAULT_EVENT_DATE_TIME;
  const trimmed = source.trim();
  const localMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (localMatch) {
    return `${localMatch[1]}T${localMatch[2]}`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return DEFAULT_EVENT_DATE_TIME;
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}T${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
}

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function normalizeMessageValue(source: unknown): string | null {
  if (typeof source === 'string') {
    return normalizeLineBreaks(source);
  }
  if (Array.isArray(source)) {
    const lines = source.filter((item): item is string => typeof item === 'string').map(normalizeLineBreaks);
    return lines.length > 0 ? lines.join('\n') : '';
  }
  return null;
}

function resolveMessage(source: unknown, fallback: string): string {
  const normalized = normalizeMessageValue(source);
  if (normalized === null) return fallback;
  return normalized;
}

function normalizeLanguage(language?: string | null): Language {
  return languageFromLocale(resolveInvitationLocale(language));
}

function normalizeTemplateKey(): 'invitation_full' {
  return 'invitation_full';
}

function normalizeConceptType(value: unknown): EditorConceptType {
  if (isInvitationConceptType(value)) return value;
  return 'WEDDING';
}

function isEventLikeConcept(conceptType: EditorConceptType): boolean {
  return conceptType === 'GENERAL' || conceptType === 'ORGANIZATION';
}

function getDefaultTitleByConcept(conceptType: EditorConceptType, language: Language): string {
  const locale = resolveInvitationLocale(language);
  if (conceptType === 'FUNERAL') return invitationT(locale, 'editor.default.funeralTitle');
  if (conceptType === 'ORGANIZATION') return invitationT(locale, 'editor.default.organizationTitle');
  if (conceptType === 'GENERAL') return invitationT(locale, 'editor.default.generalTitle');
  return invitationT(locale, 'editor.default.weddingTitle');
}

function getDefaultMessageByConcept(conceptType: EditorConceptType, language: Language): string {
  const locale = resolveInvitationLocale(language);
  if (conceptType === 'FUNERAL') return invitationT(locale, 'editor.default.funeralMessage');
  if (conceptType === 'ORGANIZATION') return invitationT(locale, 'editor.default.organizationMessage');
  if (conceptType === 'GENERAL') return invitationT(locale, 'editor.default.generalMessage');
  return invitationT(locale, 'editor.default.weddingMessage');
}

function getDefaultQuoteByConcept(conceptType: EditorConceptType): string {
  if (conceptType === 'FUNERAL') return '삼가 고인의 명복을 빕니다.';
  if (conceptType === 'ORGANIZATION') return '함께 만드는 내일을 위해';
  if (conceptType === 'GENERAL') return '뜻깊은 시간에 함께해 주세요.';
  return DEFAULT_INTRO_QUOTE;
}

function toEditorGalleryImages(
  urls: Array<string | null | undefined>,
  mediaByUrl?: Map<string, string>
): WeddingEditorImage[] {
  return sanitizeGalleryItems(
    urls.map((url, index) => {
      const trimmed = typeof url === 'string' ? url.trim() : '';
      return {
        id: `gallery-${index + 1}`,
        url: trimmed,
        objectKey: trimmed ? mediaByUrl?.get(trimmed) : undefined,
      };
    })
  ).map((item) => ({
    id: item.id,
    url: item.url,
    name: item.name,
    mediaId: item.mediaId || item.objectKey,
    objectKey: item.objectKey,
  }));
}

function buildDefaultAccounts({ groomName, brideName }: { groomName: string; brideName: string }): WeddingEditorAccount[] {
  return DEFAULT_ACCOUNTS.map((account, index) => ({
    ...account,
    holder: account.holder === '유동규' ? groomName : account.holder === '이소영' ? brideName : account.holder,
    id: `account-${index + 1}`,
  }));
}

function buildOgTitle({
  groomName,
  brideName,
  language,
}: {
  groomName: string;
  brideName: string;
  language: Language;
}): string {
  return buildWeddingClassicHeroTitle(groomName, brideName, language);
}

function buildOgDescription(eventDateTime: string, venueName: string, language: Language): string {
  const parsed = new Date(eventDateTime);
  const formattedDate = Number.isNaN(parsed.getTime()) ? eventDateTime : formatDateTime(language, parsed);
  return `${formattedDate} · ${venueName}`;
}

function toDateTimeLocalFromDate(source: Date): string {
  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, '0');
  const day = String(source.getDate()).padStart(2, '0');
  const hours = String(source.getHours()).padStart(2, '0');
  const minutes = String(source.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function stripRolePrefix(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  const separators = [' ', ':', '-', '·'];
  for (const separator of separators) {
    const index = normalized.indexOf(separator);
    if (index > 0 && index < normalized.length - 1) {
      return normalized.slice(index + 1).trim();
    }
  }
  return normalized;
}

export function createWeddingEditorState(
  invitation?: Invitation | null,
  options?: { conceptType?: EditorConceptType }
): WeddingEditorState {
  const { groomName, brideName } = parseCoupleNames(invitation?.title ?? undefined);
  const eventDateTime = toDateTimeLocal(invitation?.eventDate ?? null);
  const venueName = invitation?.locationText || DEFAULT_VENUE_NAME;
  const language = normalizeLanguage(invitation?.language ?? null);
  const templateKey = normalizeTemplateKey();
  const conceptType =
    options?.conceptType ??
    normalizeConceptType(
      (invitation?.dataJson as { conceptType?: unknown } | undefined)?.conceptType ??
        (invitation?.data as { conceptType?: unknown } | undefined)?.conceptType
    );
  const visualTemplateIdRaw =
    (invitation?.dataJson as { visualTemplateId?: unknown } | undefined)?.visualTemplateId ??
    (invitation?.data as { visualTemplateId?: unknown } | undefined)?.visualTemplateId;
  const visualTemplateId =
    typeof visualTemplateIdRaw === 'string' ? visualTemplateIdRaw : undefined;
  const defaultTitle = getDefaultTitleByConcept(conceptType, language);
  const defaultMessage = getDefaultMessageByConcept(conceptType, language);
  const defaultQuote = getDefaultQuoteByConcept(conceptType);
  const conceptConfig = getConceptPresentationConfig(conceptType);
  const eventLike = isEventLikeConcept(conceptType);

  return {
    setup: {
      invitationType: 'wedding',
      templateKey,
      conceptType,
      language,
      ...(visualTemplateId ? { visualTemplateId } : {}),
    },
    basic: {
      title: invitation?.title || defaultTitle,
      subtitle: undefined,
      eventDateTime,
      venueName,
      venueDetail: invitation?.locationText ? undefined : DEFAULT_VENUE_DETAIL,
    },
    hero: {
      heroImage: DEFAULT_HERO_IMAGE,
      overlayText: translate(language, I18N_KEYS.weddingClassic.heroOverlayText),
    },
    invitationMessage: {
      quote: defaultQuote,
      body: resolveMessage(invitation?.message ?? null, defaultMessage),
    },
    organization: {
      name: '',
      englishName: '',
      logo: '',
      accentColor: DEFAULT_BRAND_ACCENT_COLOR,
      presetId: 'CUSTOM',
    },
    groom: {
      name: groomName,
      photo: DEFAULT_GROOM_IMAGE,
      phone: '010-1234-5678',
      parentsText: '유갑성 · 우재한 의 아들',
    },
    bride: {
      name: brideName,
      photo: DEFAULT_BRIDE_IMAGE,
      phone: '010-9876-5432',
      parentsText: '이상금 · 형명숙 의 딸',
    },
    gallery: {
      // 신규 초대장: 샘플/placeholder를 data에 넣지 않음
      images: [],
      displayMode: 'SLIDE',
    },
    location: {
      address: '서울 구로구 경인로 610',
      venueName: undefined,
      detailAddress: undefined,
      mapProvider: 'GOOGLE',
      googlePlaceId: undefined,
      naverPlaceId: undefined,
      naverMapUrl: undefined,
      mapLat: undefined,
      mapLng: undefined,
      transportInfo: [...DEFAULT_TRANSPORT],
      parkingInfo: [...DEFAULT_PARKING],
    },
    accounts: eventLike ? [] : buildDefaultAccounts({ groomName, brideName }),
    extras: {
      rsvpEnabled: true,
      guestbookEnabled: true,
      rsvpButtonText: translate(language, I18N_KEYS.weddingClassic.rsvpButton),
      accountEnabled: conceptConfig.accountDefaultEnabled,
      accountsTitle:
        eventLike
          ? conceptConfig.accountsTitle
          : translate(language, I18N_KEYS.weddingClassic.accountsTitle),
      musicEnabled: false,
      musicSourceType: undefined,
      musicTrackId: undefined,
      musicKey: undefined,
      musicFileUrl: undefined,
      musicFileKey: undefined,
      musicTitle: undefined,
      musicLoop: false,
      musicStartAtSeconds: 0,
    },
    share: {
      ogTitle: buildOgTitle({ groomName, brideName, language }),
      ogDescription: buildOgDescription(eventDateTime, venueName, language),
      ogImage: undefined,
      ogImageMode: 'NONE',
    },
  };
}

export function createWeddingEditorStateFromDraft(
  invitation: Invitation,
  runtimeData: WeddingInvitationData | null
): WeddingEditorState {
  const base = runtimeData
    ? createWeddingEditorState(invitation, { conceptType: normalizeConceptType(runtimeData.conceptType) })
    : createWeddingEditorState(invitation);
  if (!runtimeData) {
    return base;
  }

  const normalizedContent = normalizeMessageValue((runtimeData as { content?: unknown }).content);
  const normalizedLegacyIntroText = normalizeMessageValue((runtimeData as { introText?: unknown }).introText);

  return {
    ...base,
    setup: {
      ...base.setup,
      conceptType: runtimeData.conceptType || base.setup.conceptType,
      visualTemplateId: runtimeData.visualTemplateId || base.setup.visualTemplateId,
    },
    basic: {
      ...base.basic,
      title: invitation.title || runtimeData.title || runtimeData.coupleNames || base.basic.title,
      subtitle:
        (typeof (runtimeData as { subtitle?: unknown }).subtitle === 'string'
          ? (runtimeData as { subtitle: string }).subtitle
          : '') ||
        runtimeData.contactPerson ||
        base.basic.subtitle,
      eventDateTime:
        typeof runtimeData.eventDate === 'string'
          ? toDateTimeLocal(runtimeData.eventDate)
          : runtimeData.weddingDate
            ? toDateTimeLocalFromDate(runtimeData.weddingDate)
            : base.basic.eventDateTime,
      venueName: runtimeData.venueName || runtimeData.locationText || base.basic.venueName,
      venueDetail: runtimeData.venueDetail || runtimeData.detailAddress || base.basic.venueDetail,
    },
    hero: {
      // Empty string is intentional clear — do not fall back to DEFAULT_HERO_IMAGE via ||
      heroImage: typeof runtimeData.heroImage === 'string' ? runtimeData.heroImage : base.hero.heroImage,
      overlayText: runtimeData.heroOverlayText || base.hero.overlayText,
    },
    invitationMessage: {
      quote: runtimeData.introQuote || base.invitationMessage.quote,
      body: normalizedContent ?? normalizedLegacyIntroText ?? base.invitationMessage.body,
    },
    organization: (() => {
      const next = normalizeOrganizationBranding(
        (runtimeData as { organization?: unknown }).organization
      );
      return {
        ...base.organization,
        ...next,
        presetId: next.presetId || base.organization.presetId || 'CUSTOM',
        accentColor: next.accentColor || base.organization.accentColor || DEFAULT_BRAND_ACCENT_COLOR,
      };
    })(),
    groom: {
      name: stripRolePrefix(runtimeData.groom?.name || runtimeData.groomName || '') || base.groom.name,
      photo:
        typeof runtimeData.groom?.image === 'string'
          ? runtimeData.groom.image
          : base.groom.photo,
      phone: runtimeData.groom?.phone || runtimeData.groomPhone || base.groom.phone,
      parentsText: runtimeData.groom?.parentsText || runtimeData.parentsInfo || base.groom.parentsText,
    },
    bride: {
      name: stripRolePrefix(runtimeData.bride?.name || runtimeData.brideName || '') || base.bride.name,
      photo:
        typeof runtimeData.bride?.image === 'string'
          ? runtimeData.bride.image
          : base.bride.photo,
      phone: runtimeData.bride?.phone || runtimeData.bridePhone || base.bride.phone,
      parentsText: runtimeData.bride?.parentsText || runtimeData.parentsInfo || base.bride.parentsText,
    },
    gallery: {
      images: (() => {
        const mediaByUrl = new Map<string, string>();
        const galleryMedia = (runtimeData as { galleryMedia?: unknown }).galleryMedia;
        if (Array.isArray(galleryMedia)) {
          galleryMedia.forEach((entry) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
            const record = entry as Record<string, unknown>;
            const url = typeof record.url === 'string' ? record.url.trim() : '';
            const key =
              (typeof record.key === 'string' && record.key.trim()) ||
              (typeof record.objectKey === 'string' && record.objectKey.trim()) ||
              '';
            if (url && key) mediaByUrl.set(url, key);
          });
        }
        return toEditorGalleryImages(runtimeData.galleryImages || [], mediaByUrl);
      })(),
      displayMode: normalizeGalleryDisplayMode(
        (runtimeData as { galleryDisplayMode?: unknown }).galleryDisplayMode
      ),
    },
    location: {
      ...base.location,
      address: runtimeData.formattedAddress || runtimeData.address || runtimeData.locationText || base.location.address,
      venueName: runtimeData.venueName || base.location.venueName,
      detailAddress: runtimeData.detailAddress || runtimeData.venueDetail || base.location.detailAddress,
      mapProvider: runtimeData.mapProvider === 'NAVER' ? 'NAVER' : 'GOOGLE',
      googlePlaceId: runtimeData.googlePlaceId || base.location.googlePlaceId,
      naverPlaceId: runtimeData.naverPlaceId || base.location.naverPlaceId,
      naverMapUrl: runtimeData.naverMapUrl || base.location.naverMapUrl,
      mapLat:
        typeof runtimeData.mapLat === 'number'
          ? runtimeData.mapLat
          : typeof runtimeData.mapLat === 'string' && Number.isFinite(Number(runtimeData.mapLat))
            ? Number(runtimeData.mapLat)
            : base.location.mapLat,
      mapLng:
        typeof runtimeData.mapLng === 'number'
          ? runtimeData.mapLng
          : typeof runtimeData.mapLng === 'string' && Number.isFinite(Number(runtimeData.mapLng))
            ? Number(runtimeData.mapLng)
            : base.location.mapLng,
      transportInfo:
        runtimeData.transportInfo && runtimeData.transportInfo.length > 0
          ? runtimeData.transportInfo
          : base.location.transportInfo,
      parkingInfo:
        runtimeData.parkingInfo && runtimeData.parkingInfo.length > 0
          ? runtimeData.parkingInfo
          : base.location.parkingInfo,
    },
    accounts:
      runtimeData.accounts && runtimeData.accounts.length > 0
        ? runtimeData.accounts.map((account, index) => ({
            id: `account-${index + 1}`,
            role: account.role || account.label || '',
            bank: account.financialInstitution || account.bank || '',
            number: account.accountNumber || account.number || '',
            holder: account.accountHolder || account.holder || '',
            iban: account.iban || '',
            swiftBic: account.swiftBic || '',
            routingCode: account.routingCode || '',
            paymentNote: account.paymentNote || '',
          }))
        : base.accounts,
    extras: {
      ...base.extras,
      rsvpEnabled: runtimeData.rsvpEnabled ?? runtimeData.rsvp?.enabled ?? base.extras.rsvpEnabled,
      rsvpButtonText:
        runtimeData.rsvp?.buttonLabel ||
        runtimeData.rsvpButton ||
        runtimeData.rsvpButtonLabel ||
        base.extras.rsvpButtonText,
      guestbookEnabled: runtimeData.guestbookEnabled ?? base.extras.guestbookEnabled,
      accountEnabled:
        typeof runtimeData.accountEnabled === 'boolean'
          ? runtimeData.accountEnabled
          : base.extras.accountEnabled,
      accountsTitle: runtimeData.accountsTitle || base.extras.accountsTitle,
      musicEnabled: Boolean(runtimeData.music?.enabled),
      musicTrackId: runtimeData.music?.trackId || undefined,
      musicSourceType:
        runtimeData.music?.sourceType === 'UPLOAD' || runtimeData.music?.sourceType === 'SHARED'
          ? runtimeData.music.sourceType
          : runtimeData.music?.fileUrl
            ? 'UPLOAD'
            : runtimeData.music?.musicKey
              ? 'SHARED'
              : undefined,
      musicKey: runtimeData.music?.musicKey || undefined,
      musicFileUrl: runtimeData.music?.fileUrl || undefined,
      musicFileKey: runtimeData.music?.fileKey || undefined,
      musicTitle: runtimeData.music?.title || undefined,
      musicLoop: Boolean(runtimeData.music?.loop),
      musicStartAtSeconds: runtimeData.music?.startAtSeconds ?? 0,
    },
    share: {
      ...base.share,
      ogTitle:
        pickShareString(runtimeData, 'ogTitle') ||
        base.share.ogTitle,
      ogDescription:
        pickShareString(runtimeData, 'ogDescription') ||
        base.share.ogDescription,
      ...resolveShareImageFromDraft(runtimeData, base.share),
    },
  };
}

function resolveShareImageFromDraft(
  runtimeData: WeddingInvitationData,
  baseShare: WeddingEditorState['share']
): Pick<WeddingEditorState['share'], 'ogImage' | 'ogImageMode'> {
  const share = (runtimeData as { share?: Record<string, unknown> }).share;
  const openGraph = (runtimeData as { openGraph?: Record<string, unknown> }).openGraph;
  const imageRemoved =
    openGraph?.imageRemoved === true ||
    share?.ogImageRemoved === true ||
    openGraph?.imageMode === 'NONE' ||
    share?.ogImageMode === 'NONE';

  if (imageRemoved) {
    return { ogImage: '', ogImageMode: 'NONE' };
  }

  if (openGraph?.imageMode === 'HERO' || share?.ogImageMode === 'HERO') {
    const hero =
      typeof (runtimeData as { heroImage?: unknown }).heroImage === 'string'
        ? String((runtimeData as { heroImage?: string }).heroImage).trim()
        : '';
    const stored = pickShareString(runtimeData, 'ogImage') || pickOpenGraphImage(runtimeData);
    return { ogImage: stored || hero || '', ogImageMode: 'HERO' };
  }

  const custom = pickShareString(runtimeData, 'ogImage') || pickOpenGraphImage(runtimeData);
  if (custom || openGraph?.imageMode === 'CUSTOM' || share?.ogImageMode === 'CUSTOM') {
    return { ogImage: custom || '', ogImageMode: 'CUSTOM' };
  }

  // Legacy: editor 입력란에 Hero를 채우지 않음 (빈 카드). Public SSOT는 LEGACY hero fallback.
  return {
    ogImage: baseShare.ogImage || '',
    ogImageMode: baseShare.ogImageMode || 'NONE',
  };
}

function pickShareString(
  runtimeData: WeddingInvitationData,
  key: 'ogTitle' | 'ogDescription' | 'ogImage'
): string {
  const share = (runtimeData as { share?: Record<string, unknown> }).share;
  const openGraph = (runtimeData as { openGraph?: Record<string, unknown> }).openGraph;
  if (key === 'ogTitle') {
    const fromOg = typeof openGraph?.title === 'string' ? openGraph.title.trim() : '';
    const fromShare = typeof share?.ogTitle === 'string' ? share.ogTitle.trim() : '';
    return fromOg || fromShare;
  }
  if (key === 'ogDescription') {
    const fromOg = typeof openGraph?.description === 'string' ? openGraph.description.trim() : '';
    const fromShare = typeof share?.ogDescription === 'string' ? share.ogDescription.trim() : '';
    return fromOg || fromShare;
  }
  const fromOg = typeof openGraph?.imageUrl === 'string' ? openGraph.imageUrl.trim() : '';
  const fromShare = typeof share?.ogImage === 'string' ? share.ogImage.trim() : '';
  return fromOg || fromShare;
}

function pickOpenGraphImage(runtimeData: WeddingInvitationData): string {
  const openGraph = (runtimeData as { openGraph?: { imageUrl?: unknown } }).openGraph;
  return typeof openGraph?.imageUrl === 'string' ? openGraph.imageUrl.trim() : '';
}

export const WEDDING_EDITOR_ASSETS = {
  DEFAULT_HERO_IMAGE,
  DEFAULT_GROOM_IMAGE,
  DEFAULT_BRIDE_IMAGE,
  DEFAULT_MAP_IMAGE,
  /** Editor Preview empty UI / sample fixtures only — not invitation defaults */
  PREVIEW_SAMPLE_GALLERY_IMAGES,
};
