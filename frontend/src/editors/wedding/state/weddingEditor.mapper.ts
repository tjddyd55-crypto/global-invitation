import {
  buildWeddingClassicCalendarTitle,
  buildWeddingClassicHeroTitle,
  getWeddingClassicDefaultLabels,
} from '@/src/templates/weddingClassic/data';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { formatDateTime } from '@/src/lib/i18n/format';
import type { Invitation } from '@/src/models/invitation';
import type { WeddingEditorState } from './weddingEditor.types';

function parseWeddingDate(eventDateTime: string): Date {
  const parsed = new Date(eventDateTime);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function resolveVenueLine(venueName: string, venueDetail?: string): string {
  if (!venueDetail?.trim()) return venueName.trim();
  return `${venueName.trim()} ${venueDetail.trim()}`.trim();
}

function buildPreviewMapImage(mapLat?: number, mapLng?: number): string {
  if (
    typeof mapLat !== 'number' ||
    typeof mapLng !== 'number' ||
    Number.isNaN(mapLat) ||
    Number.isNaN(mapLng)
  ) {
    return '';
  }
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${mapLat},${mapLng}&zoom=16&size=600x400&markers=${mapLat},${mapLng},red-pushpin`;
}

/**
 * 에디터 state → 공개 템플릿과 동일 스키마의 미리보기 데이터.
 * - 컨셉과 무관하게 state에 있는 표시용 필드는 모두 포함 (조건부 생략 없음).
 * - hero: state.hero, 갤러리: state.gallery, RSVP·방명록: state.extras (스키마상 필드명과 대응).
 */
export function buildWeddingClassicPreviewData(state: WeddingEditorState): WeddingInvitationData {
  const weddingDate = parseWeddingDate(state.basic.eventDateTime);
  const venueName = state.basic.venueName.trim();
  const venueDetail = (state.basic.venueDetail ?? '').trim();
  const locationText = venueName;
  const venueLineForMap = resolveVenueLine(venueName, venueDetail || undefined);
  const title = state.basic.title.trim();
  const heroTitle = title;
  const heroSubtitle = formatDateTime(state.setup.language, weddingDate);
  const coupleNames = [state.groom.name.trim(), state.bride.name.trim()].filter(Boolean).join(' ♥ ');
  const content = state.invitationMessage.body;
  const heroImage = (state.hero.heroImage ?? '').trim();
  const galleryImages = state.gallery.images
    .map((image) => image.url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  const defaultLabels = getWeddingClassicDefaultLabels(state.setup.language);
  const mapImage = buildPreviewMapImage(state.location.mapLat, state.location.mapLng);

  const groomPhoto = (state.groom.photo ?? '').trim();
  const bridePhoto = (state.bride.photo ?? '').trim();
  const parentsInfo = [state.groom.parentsText, state.bride.parentsText].filter(Boolean).join(' / ');

  const base = {
    templateType: 'FULL' as const,
    conceptType: state.setup.conceptType,
    title,
    subtitle: (state.basic.subtitle ?? '').trim(),
    content,
    eventDate: state.basic.eventDateTime,
    locationText,
    venueDetail,
    venueName,
    schedule: [formatDateTime(state.setup.language, weddingDate)],
    rsvpEnabled: state.extras.rsvpEnabled,
    guestbookEnabled: state.extras.guestbookEnabled,
    share: {
      ogTitle: state.share.ogTitle.trim(),
      ogDescription: state.share.ogDescription.trim(),
      ogImage: (state.share.ogImage ?? '').trim(),
    },
    musicKey: 'piano_wedding',
    heroImage,
    galleryImages,
    accounts: state.accounts.map((account) => ({
      role: account.role,
      bank: account.bank,
      number: account.number,
      holder: account.holder,
    })),
    address: state.location.address.trim(),
    mapLat: state.location.mapLat,
    mapLng: state.location.mapLng,
    mapImage,
    heroOverlayText: (state.hero.overlayText ?? '').trim(),
    heroTitle,
    heroSubtitle,
    coupleNames,
    weddingDateTime: formatDateTime(state.setup.language, weddingDate),
    introQuote: (state.invitationMessage.quote ?? '').trim(),
    introText: [] as string[],
    weddingDate,
    calendarTitle: buildWeddingClassicCalendarTitle(weddingDate, state.setup.language),
    transportInfo: state.location.transportInfo ?? [],
    parkingInfo: state.location.parkingInfo ?? [],
    rsvp: { enabled: state.extras.rsvpEnabled },
    rsvpTitle: defaultLabels.rsvpTitle,
    rsvpDescription: defaultLabels.rsvpDescription,
    rsvpButton: (state.extras.rsvpButtonText ?? '').trim(),
    accountsTitle: defaultLabels.accountsTitle,
    messagesTitle: defaultLabels.messagesTitle,
    messages: [] as WeddingInvitationData['messages'],
    groomName: state.groom.name,
    brideName: state.bride.name,
    groomImage: groomPhoto,
    brideImage: bridePhoto,
    groomPhone: state.groom.phone ?? '',
    bridePhone: state.bride.phone ?? '',
    parentsInfo,
    groom: {
      image: groomPhoto,
      name: state.groom.name,
      phone: state.groom.phone ?? '',
      parentsText: state.groom.parentsText ?? '',
    },
    bride: {
      image: bridePhoto,
      name: state.bride.name,
      phone: state.bride.phone ?? '',
      parentsText: state.bride.parentsText ?? '',
    },
  } satisfies WeddingInvitationData;

  if (state.setup.conceptType === 'FUNERAL') {
    return {
      ...base,
      deceasedName: state.basic.title || '',
      funeralHall: venueLineForMap || venueName,
      funeralDate: weddingDate.toISOString(),
      contactPerson: (state.basic.subtitle ?? '').trim(),
      funeral: {
        deceased: state.basic.title || '',
        funeralHall: venueLineForMap || venueName,
        schedule: formatDateTime(state.setup.language, weddingDate),
      },
    };
  }

  return base;
}

/** Editor state → Invitation (localStorage 저장용). Backend 전송 금지. */
export function weddingEditorStateToInvitation(state: WeddingEditorState, slug: string): Invitation {
  const now = new Date().toISOString();
  const venueLine = resolveVenueLine(state.basic.venueName, state.basic.venueDetail);
  const normalizedMessage = state.invitationMessage.body.trim();
  return {
    id: slug,
    slug,
    templateType: 'FULL',
    conceptType: state.setup.conceptType,
    title: state.basic.title || undefined,
    eventDate: state.basic.eventDateTime || undefined,
    locationText: venueLine || undefined,
    message: normalizedMessage || undefined,
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
