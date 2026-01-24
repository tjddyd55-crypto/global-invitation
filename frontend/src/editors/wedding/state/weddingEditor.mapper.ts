import type { WeddingClassicData } from '@/src/templates/weddingClassic/data';
import { WEDDING_EDITOR_ASSETS } from './weddingEditor.initial';
import type { WeddingEditorShare, WeddingEditorState } from './weddingEditor.types';

const DEFAULT_CALENDAR_TITLE_SUFFIX = '번째 날.';

const DEFAULT_RSVP_TITLE = '참석 여부 전달';
const DEFAULT_RSVP_DESCRIPTION = '결혼식에 참석해주시는 모든 분들을 더욱 특별하게 모시고자 하오니, 참석 여부 전달을 부탁드립니다.';
const DEFAULT_ACCOUNTS_TITLE = '마음 전하실 곳';
const DEFAULT_MESSAGES_TITLE = '축하의 메시지를 남겨주세요!';

const DEFAULT_MESSAGES = [
  { name: '서문교', content: '두 분 결혼 축하드려요~ 알콩달콩 이쁘게 잘 살아요^^', createdAt: '2025.04.13 17:21' },
  { name: '스윙 이소영', content: '소식 전해줘서 고마워요! 행복하게 잘 살아줘요.', createdAt: '2025.04.12 19:45' },
];

function safeDate(source?: string): Date {
  if (!source) return new Date('2025-04-13T17:20:00');
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? new Date('2025-04-13T17:20:00') : parsed;
}

function formatKoreanDateTime(date: Date): string {
  const datePart = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const timePart = date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedTime = timePart.replace(':', '시 ') + '분';
  return `${datePart} ${formattedTime}`;
}

function buildCalendarTitle(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월의 ${day}${DEFAULT_CALENDAR_TITLE_SUFFIX}`;
}

function buildCoupleNames(groomName: string, brideName: string): string {
  const groom = groomName || '신랑';
  const bride = brideName || '신부';
  return `${groom} ♥ ${bride}`;
}

function resolveHeroTitle(groomName: string, brideName: string): string {
  const groom = groomName || '신랑';
  const bride = brideName || '신부';
  return `${groom} ♥ ${bride} 결혼합니다`;
}

function resolveVenueName(venueName: string, venueDetail?: string): string {
  if (!venueDetail) return venueName;
  return `${venueName} ${venueDetail}`;
}

function resolveSharePreview(state: WeddingEditorState): WeddingEditorShare {
  const fallbackTitle = resolveHeroTitle(state.groom.name, state.bride.name);
  const venueName = resolveVenueName(state.basic.venueName, state.basic.venueDetail);
  const fallbackDescription = `${state.basic.eventDateTime.replace('T', ' ')} · ${venueName}`;
  return {
    ogTitle: state.share.ogTitle || fallbackTitle,
    ogDescription: state.share.ogDescription || fallbackDescription,
    ogImage: state.share.ogImage || state.hero.heroImage || WEDDING_EDITOR_ASSETS.DEFAULT_HERO_IMAGE,
  };
}

export function buildWeddingClassicPreviewData(state: WeddingEditorState): WeddingClassicData {
  const weddingDate = safeDate(state.basic.eventDateTime);
  const venueName = resolveVenueName(state.basic.venueName, state.basic.venueDetail);
  const coupleNames = buildCoupleNames(state.groom.name, state.bride.name);
  const heroTitle = resolveHeroTitle(state.groom.name, state.bride.name);

  return {
    heroImage: state.hero.heroImage || WEDDING_EDITOR_ASSETS.DEFAULT_HERO_IMAGE,
    heroOverlayText: state.hero.overlayText,
    heroTitle,
    heroSubtitle: formatKoreanDateTime(weddingDate),
    coupleNames,
    weddingDateTime: formatKoreanDateTime(weddingDate),
    venueName,
    introQuote: state.invitationMessage.quote || '',
    introText: state.invitationMessage.body.length > 0 ? state.invitationMessage.body : [],
    groom: {
      image: state.groom.photo || WEDDING_EDITOR_ASSETS.DEFAULT_GROOM_IMAGE,
      name: state.groom.name ? `신랑 ${state.groom.name}` : '신랑',
      phone: state.groom.phone || '',
      parentsText: state.groom.parentsText || '',
    },
    bride: {
      image: state.bride.photo || WEDDING_EDITOR_ASSETS.DEFAULT_BRIDE_IMAGE,
      name: state.bride.name ? `신부 ${state.bride.name}` : '신부',
      phone: state.bride.phone || '',
      parentsText: state.bride.parentsText || '',
    },
    weddingDate,
    calendarTitle: buildCalendarTitle(weddingDate),
    galleryImages: state.gallery.images.length > 0
      ? state.gallery.images.map((image) => image.url)
      : WEDDING_EDITOR_ASSETS.DEFAULT_GALLERY_IMAGES,
    address: state.location.address,
    mapImage: WEDDING_EDITOR_ASSETS.DEFAULT_MAP_IMAGE,
    transportInfo: state.location.transportInfo ?? [],
    parkingInfo: state.location.parkingInfo ?? [],
    rsvpTitle: DEFAULT_RSVP_TITLE,
    rsvpDescription: DEFAULT_RSVP_DESCRIPTION,
    rsvpButton: state.extras.rsvpButtonText || DEFAULT_RSVP_TITLE,
    accountsTitle: DEFAULT_ACCOUNTS_TITLE,
    accounts: state.accounts.map((account) => ({
      role: account.role,
      bank: account.bank,
      number: account.number,
      holder: account.holder,
    })),
    messagesTitle: DEFAULT_MESSAGES_TITLE,
    messages: DEFAULT_MESSAGES,
  };
}

export function buildSharePreview(state: WeddingEditorState): WeddingEditorShare {
  return resolveSharePreview(state);
}
