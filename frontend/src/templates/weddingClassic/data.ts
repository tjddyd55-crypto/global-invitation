import { I18N_KEYS, SUPPORTED_LANGUAGES, translate, type Language } from '@/src/i18n';
import { formatDate, formatDateTime } from '@/src/lib/i18n/format';
import type { Invitation } from '@/src/lib/api';

export type WeddingClassicPerson = {
  image: string;
  name: string;
  phone: string;
  parentsText: string;
};

export type WeddingClassicAccount = {
  role: string;
  bank: string;
  number: string;
  holder: string;
};

export type WeddingClassicMessage = {
  name: string;
  content: string;
  createdAt: string;
};

export type WeddingClassicData = {
  heroImage: string;
  heroOverlayText?: string;
  heroTitle: string;
  heroSubtitle: string;
  coupleNames: string;
  weddingDateTime: string;
  venueName: string;
  introQuote: string;
  introText: string[];
  groom: WeddingClassicPerson;
  bride: WeddingClassicPerson;
  weddingDate: Date;
  calendarTitle: string;
  galleryImages: string[];
  address: string;
  mapImage: string;
  transportInfo: string[];
  parkingInfo: string[];
  rsvpTitle: string;
  rsvpDescription: string;
  rsvpButton: string;
  accountsTitle: string;
  accounts: WeddingClassicAccount[];
  messagesTitle: string;
  messages: WeddingClassicMessage[];
};

const HERO_IMAGE = '/images/wedding/classic/hero.jpg';
const GROOM_IMAGE = '/images/wedding/classic/groom.jpg';
const BRIDE_IMAGE = '/images/wedding/classic/bride.jpg';
const MAP_IMAGE = '/images/wedding/classic/map.jpg';
const GALLERY_IMAGES = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `/images/wedding/classic/gallery_${number}.jpg`;
});

const DEFAULT_DATE = new Date('2025-04-13T17:20:00');
const DEFAULT_LANGUAGE: Language = 'en';
const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

function resolveLanguage(value?: string | null): Language {
  if (!value) return DEFAULT_LANGUAGE;
  const normalized = value.toLowerCase();
  return SUPPORTED_LANGUAGE_SET.has(normalized) ? (normalized as Language) : DEFAULT_LANGUAGE;
}

function parseCoupleNames(rawTitle?: string): { coupleNames: string; groomName: string; brideName: string } {
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

function getWeddingDate(source?: string | null): Date {
  if (!source) return DEFAULT_DATE;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? DEFAULT_DATE : parsed;
}

export function buildWeddingClassicCalendarTitle(date: Date, language: Language): string {
  const template = translate(language, I18N_KEYS.weddingClassic.calendarTitle);
  return template.replace('{date}', formatDate(language, date));
}

export function getWeddingClassicDefaultLabels(language: Language) {
  return {
    rsvpTitle: translate(language, I18N_KEYS.weddingClassic.rsvpTitle),
    rsvpDescription: translate(language, I18N_KEYS.weddingClassic.rsvpDescription),
    rsvpButton: translate(language, I18N_KEYS.weddingClassic.rsvpButton),
    accountsTitle: translate(language, I18N_KEYS.weddingClassic.accountsTitle),
    messagesTitle: translate(language, I18N_KEYS.weddingClassic.messagesTitle),
  };
}

export function buildWeddingClassicHeroTitle(groomName: string, brideName: string, language: Language): string {
  const groom = groomName || translate(language, I18N_KEYS.weddingClassic.groomLabel);
  const bride = brideName || translate(language, I18N_KEYS.weddingClassic.brideLabel);
  const template = translate(language, I18N_KEYS.weddingClassic.heroTitleTemplate);
  return template.replace('{groom}', groom).replace('{bride}', bride);
}

export const WEDDING_CLASSIC_TEMPLATE_KEYS = new Set(['wedding_classic', 'classic']);
export const DEMO_WEDDING_CLASSIC_SLUG = 'demo-wedding-classic';

export function isWeddingClassicTemplate(templateKey?: string | null): boolean {
  if (!templateKey) return false;
  return WEDDING_CLASSIC_TEMPLATE_KEYS.has(templateKey);
}

export function isWeddingClassicDemoSlug(slug?: string | null): boolean {
  return slug === DEMO_WEDDING_CLASSIC_SLUG;
}

export function getWeddingClassicDemoInvitation(): Invitation {
  return {
    id: 'demo-wedding-classic',
    slug: DEMO_WEDDING_CLASSIC_SLUG,
    title: '유동규 ♥ 이소영',
    eventDate: '2025-04-13T17:20:00',
    locationText: '더링크호텔 서울',
    message: '봄날의 햇살 아래, 결혼합니다.',
    templateKey: 'wedding_classic',
    musicKey: 'piano_wedding',
    countryCode: 'GLOBAL',
    language: 'ko',
    status: 'published',
    isPaid: false,
    canShare: true,
    paidAt: null,
    createdAt: '2025-03-01T00:00:00',
    updatedAt: '2025-03-01T00:00:00',
  };
}

export function buildWeddingClassicData(
  invitation?: Invitation | null,
  languageOverride?: Language
): WeddingClassicData {
  const weddingDate = getWeddingDate(invitation?.eventDate ?? null);
  const language = resolveLanguage(languageOverride ?? invitation?.language);
  const defaultLabels = getWeddingClassicDefaultLabels(language);
  const { coupleNames, groomName, brideName } = parseCoupleNames(invitation?.title ?? undefined);
  const heroTitle = buildWeddingClassicHeroTitle(groomName, brideName, language);
  const heroSubtitle = formatDateTime(language, weddingDate);
  const groomLabel = translate(language, I18N_KEYS.relationship.groom);
  const brideLabel = translate(language, I18N_KEYS.relationship.bride);
  const brideFatherLabel = translate(language, I18N_KEYS.relationship.brideFather);

  return {
    heroImage: HERO_IMAGE,
    heroOverlayText: translate(language, I18N_KEYS.weddingClassic.heroOverlayText),
    heroTitle,
    heroSubtitle,
    coupleNames,
    weddingDateTime: formatDateTime(language, weddingDate),
    venueName: invitation?.locationText || '더링크호텔 서울 3층 베일리홀',
    introQuote: '예쁜 예감이 들었다. 우리는 언제나 손을 잡고 있게 될 것이다.',
    introText: [
      '봄날의 햇살 아래, 결혼합니다.',
      '사랑의 선율 속에서,',
      '저희 두 사람이 하나 되어 행복한 춤을 시작하려 합니다.',
      '인생이라는 긴 무대 위에 설레는 마음으로 첫 스텝을 내딛는 날,',
      '소중한 분들과 함께하고 싶습니다.',
      '부디 오셔서 따뜻한 축복과 응원으로 자리를 빛내 주시면 감사하겠습니다.',
    ],
    groom: {
      image: GROOM_IMAGE,
      name: `${groomLabel} ${groomName}`,
      phone: '010-1234-5678',
      parentsText: '유갑성 · 우재한 의 아들',
    },
    bride: {
      image: BRIDE_IMAGE,
      name: `${brideLabel} ${brideName}`,
      phone: '010-9876-5432',
      parentsText: '이상금 · 형명숙 의 딸',
    },
    weddingDate,
    calendarTitle: buildWeddingClassicCalendarTitle(weddingDate, language),
    galleryImages: GALLERY_IMAGES,
    address: '서울 구로구 경인로 610',
    mapImage: MAP_IMAGE,
    transportInfo: ['신도림역 1번 출구 앞'],
    parkingInfo: ['웨딩고객 주차 1시간 30분 무료'],
    rsvpTitle: defaultLabels.rsvpTitle,
    rsvpDescription: defaultLabels.rsvpDescription,
    rsvpButton: defaultLabels.rsvpButton,
    accountsTitle: defaultLabels.accountsTitle,
    accounts: [
      { role: groomLabel, bank: '신한은행', number: '110464926697', holder: groomName },
      { role: brideLabel, bank: '신한은행', number: '110237577153', holder: brideName },
      { role: brideFatherLabel, bank: '국민은행', number: '29870204098895', holder: '이상금' },
    ],
    messagesTitle: defaultLabels.messagesTitle,
    messages: [
      { name: '서문교', content: '두 분 결혼 축하드려요~ 알콩달콩 이쁘게 잘 살아요^^', createdAt: '2025.04.13 17:21' },
      { name: '스윙 이소영', content: '소식 전해줘서 고마워요! 행복하게 잘 살아줘요.', createdAt: '2025.04.12 19:45' },
    ],
  };
}

export function buildWeddingClassicMetadata(invitation?: Invitation | null) {
  const weddingDate = getWeddingDate(invitation?.eventDate ?? null);
  const { groomName, brideName } = parseCoupleNames(invitation?.title ?? undefined);
  const language = resolveLanguage(invitation?.language);
  const title = buildWeddingClassicHeroTitle(groomName, brideName, language);
  const description = `${formatDateTime(language, weddingDate)} · ${invitation?.locationText || '더링크호텔 서울'}`;
  return { title, description, heroImage: HERO_IMAGE };
}
