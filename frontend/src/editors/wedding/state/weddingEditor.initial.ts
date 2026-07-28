import { I18N_KEYS, translate, type Language } from '@/src/i18n';
import { formatDateTime } from '@/src/lib/i18n/format';
import type { Invitation } from '@/src/lib/api';
import { buildWeddingClassicHeroTitle } from '@/src/templates/weddingClassic/data';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
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
const DEFAULT_GALLERY_IMAGES = Array.from({ length: 12 }, (_, index) => {
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

function toDateTimeLocal(source?: string | null): string {
  if (!source) return DEFAULT_EVENT_DATE_TIME;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return DEFAULT_EVENT_DATE_TIME;
  return parsed.toISOString().slice(0, 16);
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
  if (language === 'en' || language === 'mn') return language;
  return 'ko';
}

function normalizeTemplateKey(): 'invitation_full' {
  return 'invitation_full';
}

function normalizeConceptType(value: unknown): 'WEDDING' | 'FUNERAL' | 'GENERAL' {
  if (value === 'FUNERAL' || value === 'GENERAL') return value;
  return 'WEDDING';
}

function getDefaultTitleByConcept(conceptType: EditorConceptType): string {
  if (conceptType === 'FUNERAL') return '부고를 전합니다';
  if (conceptType === 'GENERAL') return '초대합니다';
  return '결혼식에 초대합니다';
}

function getDefaultMessageByConcept(conceptType: EditorConceptType): string {
  if (conceptType === 'FUNERAL') return '삼가 고인의 명복을 빕니다.';
  if (conceptType === 'GENERAL') return '행사에 초대드립니다.';
  return '소중한 분들을 모시고\n결혼식을 올리게 되었습니다.';
}

function getDefaultQuoteByConcept(conceptType: EditorConceptType): string {
  if (conceptType === 'FUNERAL') return '삼가 고인의 명복을 빕니다.';
  if (conceptType === 'GENERAL') return '뜻깊은 시간에 함께해 주세요.';
  return DEFAULT_INTRO_QUOTE;
}

function buildGalleryImages(): WeddingEditorImage[] {
  return DEFAULT_GALLERY_IMAGES.map((url, index) => ({
    id: `gallery-${index + 1}`,
    url,
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
  const defaultTitle = getDefaultTitleByConcept(conceptType);
  const defaultMessage = getDefaultMessageByConcept(conceptType);
  const defaultQuote = getDefaultQuoteByConcept(conceptType);

  return {
    setup: {
      invitationType: 'wedding',
      templateKey,
      conceptType,
      language,
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
      images: buildGalleryImages(),
    },
    location: {
      address: '서울 구로구 경인로 610',
      venueName: undefined,
      detailAddress: undefined,
      googlePlaceId: undefined,
      mapLat: undefined,
      mapLng: undefined,
      transportInfo: [...DEFAULT_TRANSPORT],
      parkingInfo: [...DEFAULT_PARKING],
    },
    accounts:
      conceptType === 'GENERAL' ? [] : buildDefaultAccounts({ groomName, brideName }),
    extras: {
      rsvpEnabled: true,
      guestbookEnabled: true,
      rsvpButtonText: translate(language, I18N_KEYS.weddingClassic.rsvpButton),
      accountEnabled: conceptType === 'GENERAL' ? false : true,
      accountsTitle:
        conceptType === 'GENERAL'
          ? '참가비 및 입금 안내'
          : translate(language, I18N_KEYS.weddingClassic.accountsTitle),
      musicEnabled: false,
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
    },
    basic: {
      ...base.basic,
      title: invitation.title || runtimeData.title || runtimeData.coupleNames || base.basic.title,
      subtitle: runtimeData.contactPerson || base.basic.subtitle,
      eventDateTime:
        typeof runtimeData.eventDate === 'string'
          ? toDateTimeLocal(runtimeData.eventDate)
          : runtimeData.weddingDate
            ? toDateTimeLocalFromDate(runtimeData.weddingDate)
            : base.basic.eventDateTime,
      venueName: runtimeData.locationText || runtimeData.venueName || base.basic.venueName,
      venueDetail: undefined,
    },
    hero: {
      heroImage: runtimeData.heroImage || base.hero.heroImage,
      overlayText: runtimeData.heroOverlayText || base.hero.overlayText,
    },
    invitationMessage: {
      quote: runtimeData.introQuote || base.invitationMessage.quote,
      body: normalizedContent ?? normalizedLegacyIntroText ?? base.invitationMessage.body,
    },
    groom: {
      name: stripRolePrefix(runtimeData.groom?.name || runtimeData.groomName || '') || base.groom.name,
      photo: runtimeData.groom?.image || base.groom.photo,
      phone: runtimeData.groom?.phone || runtimeData.groomPhone || base.groom.phone,
      parentsText: runtimeData.groom?.parentsText || runtimeData.parentsInfo || base.groom.parentsText,
    },
    bride: {
      name: stripRolePrefix(runtimeData.bride?.name || runtimeData.brideName || '') || base.bride.name,
      photo: runtimeData.bride?.image || base.bride.photo,
      phone: runtimeData.bride?.phone || runtimeData.bridePhone || base.bride.phone,
      parentsText: runtimeData.bride?.parentsText || runtimeData.parentsInfo || base.bride.parentsText,
    },
    gallery: {
      images:
        runtimeData.galleryImages && runtimeData.galleryImages.length > 0
          ? runtimeData.galleryImages.map((url, index) => ({ id: `gallery-${index + 1}`, url }))
          : base.gallery.images,
    },
    location: {
      ...base.location,
      address: runtimeData.formattedAddress || runtimeData.address || runtimeData.locationText || base.location.address,
      venueName: runtimeData.venueName || base.location.venueName,
      detailAddress: runtimeData.detailAddress || runtimeData.venueDetail || base.location.detailAddress,
      googlePlaceId: runtimeData.googlePlaceId || base.location.googlePlaceId,
      mapLat: runtimeData.mapLat ?? base.location.mapLat,
      mapLng: runtimeData.mapLng ?? base.location.mapLng,
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
      musicKey: runtimeData.music?.musicKey || undefined,
      musicFileUrl: runtimeData.music?.fileUrl || undefined,
      musicFileKey: runtimeData.music?.fileKey || undefined,
      musicTitle: runtimeData.music?.title || undefined,
      musicLoop: Boolean(runtimeData.music?.loop),
      musicStartAtSeconds: runtimeData.music?.startAtSeconds ?? 0,
    },
    share: {
      ...base.share,
      ogImage: runtimeData.heroImage || base.share.ogImage,
    },
  };
}

export const WEDDING_EDITOR_ASSETS = {
  DEFAULT_HERO_IMAGE,
  DEFAULT_GROOM_IMAGE,
  DEFAULT_BRIDE_IMAGE,
  DEFAULT_MAP_IMAGE,
  DEFAULT_GALLERY_IMAGES,
};
