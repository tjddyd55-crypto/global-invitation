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

function formatWeddingDateTime(date: Date): string {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildCalendarTitle(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월의 ${day}번째 날.`;
}

export const WEDDING_CLASSIC_TEMPLATE_KEYS = new Set(['wedding_classic', 'classic']);

export function isWeddingClassicTemplate(templateKey?: string | null): boolean {
  if (!templateKey) return false;
  return WEDDING_CLASSIC_TEMPLATE_KEYS.has(templateKey);
}

export function buildWeddingClassicData(invitation?: Invitation | null): WeddingClassicData {
  const weddingDate = getWeddingDate(invitation?.eventDate ?? null);
  const { coupleNames, groomName, brideName } = parseCoupleNames(invitation?.title ?? undefined);

  return {
    heroImage: HERO_IMAGE,
    heroOverlayText: 'Welcome to our wedding',
    coupleNames,
    weddingDateTime: formatWeddingDateTime(weddingDate),
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
      name: `신랑 ${groomName}`,
      phone: '010-1234-5678',
      parentsText: '유갑성 · 우재한 의 아들',
    },
    bride: {
      image: BRIDE_IMAGE,
      name: `신부 ${brideName}`,
      phone: '010-9876-5432',
      parentsText: '이상금 · 형명숙 의 딸',
    },
    weddingDate,
    calendarTitle: buildCalendarTitle(weddingDate),
    galleryImages: GALLERY_IMAGES,
    address: '서울 구로구 경인로 610',
    mapImage: MAP_IMAGE,
    transportInfo: ['신도림역 1번 출구 앞'],
    parkingInfo: ['웨딩고객 주차 1시간 30분 무료'],
    rsvpTitle: '참석 여부 전달',
    rsvpDescription: '결혼식에 참석해주시는 모든 분들을 더욱 특별하게 모시고자 하오니, 참석 여부 전달을 부탁드립니다.',
    rsvpButton: '참석 여부 전달',
    accountsTitle: '마음 전하실 곳',
    accounts: [
      { role: '신랑', bank: '신한은행', number: '110464926697', holder: groomName },
      { role: '신부', bank: '신한은행', number: '110237577153', holder: brideName },
      { role: '신부 아버지', bank: '국민은행', number: '29870204098895', holder: '이상금' },
    ],
    messagesTitle: '축하의 메시지를 남겨주세요!',
    messages: [
      { name: '서문교', content: '두 분 결혼 축하드려요~ 알콩달콩 이쁘게 잘 살아요^^', createdAt: '2025.04.13 17:21' },
      { name: '스윙 이소영', content: '소식 전해줘서 고마워요! 행복하게 잘 살아줘요.', createdAt: '2025.04.12 19:45' },
    ],
  };
}

export function buildWeddingClassicMetadata(invitation?: Invitation | null) {
  const weddingDate = getWeddingDate(invitation?.eventDate ?? null);
  const { groomName, brideName } = parseCoupleNames(invitation?.title ?? undefined);
  const title = `${groomName} ♥ ${brideName} 결혼합니다`;
  const description = `${formatWeddingDateTime(weddingDate)} · ${invitation?.locationText || '더링크호텔 서울'}`;
  return { title, description, heroImage: HERO_IMAGE };
}
