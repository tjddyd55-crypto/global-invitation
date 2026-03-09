import {
  buildWeddingClassicCalendarTitle,
  buildWeddingClassicHeroTitle,
  getWeddingClassicDefaultLabels,
} from '@/src/templates/weddingClassic/data';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { I18N_KEYS, translate, type Language } from '@/src/i18n';
import { formatDateTime } from '@/src/lib/i18n/format';
import type { Invitation } from '@/src/models/invitation';
import { WEDDING_EDITOR_ASSETS } from './weddingEditor.initial';
import type { WeddingEditorShare, WeddingEditorState } from './weddingEditor.types';

const DEFAULT_MESSAGES = [
  { name: '서문교', content: '두 분 결혼 축하드려요~ 알콩달콩 이쁘게 잘 살아요^^', createdAt: '2025.04.13 17:21' },
  { name: '스윙 이소영', content: '소식 전해줘서 고마워요! 행복하게 잘 살아줘요.', createdAt: '2025.04.12 19:45' },
];

function safeDate(source?: string): Date {
  if (!source) return new Date('2025-04-13T17:20:00');
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? new Date('2025-04-13T17:20:00') : parsed;
}

function buildCoupleNames(groomName: string, brideName: string, language: Language): string {
  const groom = groomName || translate(language, I18N_KEYS.weddingClassic.groomLabel);
  const bride = brideName || translate(language, I18N_KEYS.weddingClassic.brideLabel);
  return `${groom} ♥ ${bride}`;
}

function resolveInvitationTitle(state: WeddingEditorState): string {
  const normalized = state.basic.title.trim();
  if (normalized) {
    return normalized;
  }
  return buildCoupleNames(state.groom.name, state.bride.name, state.setup.language);
}

function resolveVenueName(venueName: string, venueDetail?: string): string {
  if (!venueDetail) return venueName;
  return `${venueName} ${venueDetail}`;
}

function resolveSharePreview(state: WeddingEditorState): WeddingEditorShare {
  const fallbackTitle = buildWeddingClassicHeroTitle(state.groom.name, state.bride.name, state.setup.language);
  const venueName = resolveVenueName(state.basic.venueName, state.basic.venueDetail);
  const fallbackDate = safeDate(state.basic.eventDateTime);
  const fallbackDescription = `${formatDateTime(state.setup.language, fallbackDate)} · ${venueName}`;
  return {
    ogTitle: state.share.ogTitle || fallbackTitle,
    ogDescription: state.share.ogDescription || fallbackDescription,
    ogImage: state.share.ogImage || state.hero.heroImage || WEDDING_EDITOR_ASSETS.DEFAULT_HERO_IMAGE,
  };
}

export function buildWeddingClassicPreviewData(state: WeddingEditorState): WeddingInvitationData {
  const weddingDate = safeDate(state.basic.eventDateTime);
  const venueName = resolveVenueName(state.basic.venueName, state.basic.venueDetail);
  const invitationTitle = resolveInvitationTitle(state);
  const coupleNames = invitationTitle;
  const heroTitle = invitationTitle;
  const defaultLabels = getWeddingClassicDefaultLabels(state.setup.language);

  return {
    heroImage: state.hero.heroImage || WEDDING_EDITOR_ASSETS.DEFAULT_HERO_IMAGE,
    heroOverlayText: state.hero.overlayText,
    heroTitle,
    heroSubtitle: formatDateTime(state.setup.language, weddingDate),
    coupleNames,
    weddingDateTime: formatDateTime(state.setup.language, weddingDate),
    venueName,
    introQuote: state.invitationMessage.quote || '',
    introText: state.invitationMessage.body.length > 0 ? state.invitationMessage.body : [],
    groom: {
      image: state.groom.photo || WEDDING_EDITOR_ASSETS.DEFAULT_GROOM_IMAGE,
      name: state.groom.name
        ? `${translate(state.setup.language, I18N_KEYS.weddingClassic.groomLabel)} ${state.groom.name}`
        : translate(state.setup.language, I18N_KEYS.weddingClassic.groomLabel),
      phone: state.groom.phone || '',
      parentsText: state.groom.parentsText || '',
    },
    bride: {
      image: state.bride.photo || WEDDING_EDITOR_ASSETS.DEFAULT_BRIDE_IMAGE,
      name: state.bride.name
        ? `${translate(state.setup.language, I18N_KEYS.weddingClassic.brideLabel)} ${state.bride.name}`
        : translate(state.setup.language, I18N_KEYS.weddingClassic.brideLabel),
      phone: state.bride.phone || '',
      parentsText: state.bride.parentsText || '',
    },
    weddingDate,
    calendarTitle: buildWeddingClassicCalendarTitle(weddingDate, state.setup.language),
    galleryImages: state.gallery.images.length > 0
      ? state.gallery.images.map((image) => image.url)
      : WEDDING_EDITOR_ASSETS.DEFAULT_GALLERY_IMAGES,
    address: state.location.address,
    mapImage: WEDDING_EDITOR_ASSETS.DEFAULT_MAP_IMAGE,
    transportInfo: state.location.transportInfo ?? [],
    parkingInfo: state.location.parkingInfo ?? [],
    rsvp: { enabled: state.extras.rsvpEnabled },
    rsvpTitle: defaultLabels.rsvpTitle,
    rsvpDescription: defaultLabels.rsvpDescription,
    rsvpButton: state.extras.rsvpButtonText || defaultLabels.rsvpButton,
    accountsTitle: defaultLabels.accountsTitle,
    accounts: state.accounts.map((account) => ({
      role: account.role,
      bank: account.bank,
      number: account.number,
      holder: account.holder,
    })),
    messagesTitle: defaultLabels.messagesTitle,
    messages: DEFAULT_MESSAGES,
  };
}

export function buildSharePreview(state: WeddingEditorState): WeddingEditorShare {
  return resolveSharePreview(state);
}

/** Editor state → Invitation (localStorage 저장용). Backend 전송 금지. */
export function weddingEditorStateToInvitation(state: WeddingEditorState, slug: string): Invitation {
  const now = new Date().toISOString();
  const locationText = resolveVenueName(state.basic.venueName, state.basic.venueDetail);
  const message =
    state.invitationMessage.body.length > 0 ? state.invitationMessage.body.join('\n') : undefined;
  return {
    id: slug,
    slug,
    title: state.basic.title || undefined,
    eventDate: state.basic.eventDateTime || undefined,
    locationText: locationText || undefined,
    message: message || undefined,
    templateKey: state.setup.templateKey,
    musicKey: 'piano_wedding',
    countryCode: 'GLOBAL',
    language: state.setup.language,
    status: 'draft',
    isPaid: false,
    canShare: true,
    paidAt: null,
    isOwner: true,
    createdAt: now,
    updatedAt: now,
  };
}
