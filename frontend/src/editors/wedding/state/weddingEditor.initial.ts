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
const DEFAULT_MESSAGE_BODY = [
  '봄날의 햇살 아래, 결혼합니다.',
  '사랑의 선율 속에서,',
  '저희 두 사람이 하나 되어 행복한 춤을 시작하려 합니다.',
  '소중한 분들과 함께하고 싶습니다.',
];

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

function splitMessage(source?: string | null): string[] {
  if (!source) return DEFAULT_MESSAGE_BODY;
  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : DEFAULT_MESSAGE_BODY;
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

export function createWeddingEditorState(invitation?: Invitation | null): WeddingEditorState {
  const { groomName, brideName } = parseCoupleNames(invitation?.title ?? undefined);
  const eventDateTime = toDateTimeLocal(invitation?.eventDate ?? null);
  const venueName = invitation?.locationText || DEFAULT_VENUE_NAME;
  const language = normalizeLanguage(invitation?.language ?? null);
  const templateKey = normalizeTemplateKey();
  const conceptType = normalizeConceptType(
    (invitation?.dataJson as { conceptType?: unknown } | undefined)?.conceptType ??
      (invitation?.data as { conceptType?: unknown } | undefined)?.conceptType
  );

  return {
    setup: {
      invitationType: 'wedding',
      templateKey,
      conceptType,
      language,
    },
    basic: {
      title: invitation?.title || `${groomName} ♥ ${brideName}`,
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
      quote: DEFAULT_INTRO_QUOTE,
      body: splitMessage(invitation?.message ?? null),
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
      mapLat: undefined,
      mapLng: undefined,
      transportInfo: [...DEFAULT_TRANSPORT],
      parkingInfo: [...DEFAULT_PARKING],
    },
    accounts: buildDefaultAccounts({ groomName, brideName }),
    extras: {
      rsvpEnabled: true,
      guestbookEnabled: true,
      rsvpButtonText: translate(language, I18N_KEYS.weddingClassic.rsvpButton),
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
  const base = createWeddingEditorState(invitation);
  if (!runtimeData) {
    return base;
  }

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
      body:
        runtimeData.content?.split('\n').filter(Boolean) && runtimeData.content.split('\n').filter(Boolean).length > 0
          ? runtimeData.content.split('\n').filter(Boolean)
          : runtimeData.introText && runtimeData.introText.length > 0
            ? runtimeData.introText
            : base.invitationMessage.body,
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
      address: runtimeData.locationText || runtimeData.address || base.location.address,
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
            role: account.role,
            bank: account.bank,
            number: account.number,
            holder: account.holder,
          }))
        : base.accounts,
    extras: {
      ...base.extras,
      rsvpEnabled: runtimeData.rsvpEnabled ?? runtimeData.rsvp?.enabled ?? base.extras.rsvpEnabled,
      rsvpButtonText: runtimeData.rsvpButton || base.extras.rsvpButtonText,
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
