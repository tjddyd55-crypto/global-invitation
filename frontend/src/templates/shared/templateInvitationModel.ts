/* eslint-disable i18next/no-literal-string */
/**
 * Visual template view-model SSOT.
 *
 * 신규 시각 템플릿 6종(Editorial/Garden/Night/Clean/Festive/Culture)은
 * 데이터 정규화를 여기서 한 번만 수행하고, 각 renderer 는 "레이아웃"만 담당한다.
 * 새 필드가 필요하면 renderer 가 아니라 이 파일을 확장한다.
 */
import { shouldShowAccountsSection } from '@/src/invitation/accountItems';
import type { InvitationConceptType } from '@/src/invitation/conceptPresentationConfig';
import {
  getInvitationGallerySettings,
  type GalleryDisplayMode,
} from '@/src/invitation/galleryDisplay';
import type { InvitationGalleryItem } from '@/src/invitation/galleryItems';
import {
  getInvitationScheduleDisplay,
  toDisplayScheduleLines,
  type InvitationScheduleDisplay,
} from '@/src/invitation/scheduleDisplay';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import type { InvitationRenderMode } from '@/src/templates/visualTemplate/visualTemplateRegistry';

/** 6종 renderer 공통 props (VisualTemplateRendererProps 와 구조 호환) */
export type VisualTemplateProps = {
  data: WeddingInvitationData;
  invitationSlug?: string;
  previewMode?: boolean;
  renderMode?: InvitationRenderMode;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  showComments?: boolean;
  onShare?: () => void;
  onKakaoShare?: () => void;
  isShared?: boolean;
  showPlayButton?: boolean;
};

export type TemplatePerson = {
  role: string;
  name: string;
  image: string;
  phone: string;
  parentsText: string;
};

/** 표시 전용 날짜 조각 — 조립은 scheduleDisplay SSOT 가 담당한다. */
export type TemplateDateParts = {
  year: string;
  /** 2자리 (01~12) */
  month: string;
  /** 2자리 (01~31) */
  day: string;
  /** `토` */
  weekday: string;
  /** `SAT` */
  weekdayEn: string;
  /** 자정(시간 미입력)이면 빈 문자열 */
  time: string;
};

export type TemplateGalleryModel = {
  items: InvitationGalleryItem[];
  displayMode: GalleryDisplayMode;
  hasItems: boolean;
};

export type TemplateInvitationModel = {
  conceptType: InvitationConceptType;
  title: string;
  subtitle: string;
  greetingLines: string[];
  hasGreeting: boolean;
  heroImage: string;
  gallery: TemplateGalleryModel;
  /** `2026년 10월 17일 토요일 오후 2시` */
  dateText: string;
  /** `2026. 10. 17 SAT` */
  dateCompact: string;
  /** `오후 2시` */
  timeText: string;
  dateParts: TemplateDateParts | null;
  /** 사용자가 입력한 추가 일정 줄 (ISO 원문 제외) */
  scheduleLines: string[];
  venueName: string;
  venueDetail: string;
  address: string;
  detailAddress: string;
  hasLocation: boolean;
  groom: TemplatePerson | null;
  bride: TemplatePerson | null;
  hasCouple: boolean;
  showAccounts: boolean;
  transportInfo: string[];
  parkingInfo: string[];
};

/** renderMode 파생값 — 각 renderer 가 if 를 중복 작성하지 않도록 한곳에서 계산 */
export type TemplateRenderFlags = {
  mode: InvitationRenderMode;
  isPublic: boolean;
  isTemplatePreview: boolean;
  /** RSVP 등 실제 제출 차단 여부 */
  previewMode: boolean;
  /** 빈 섹션 안내는 에디터 미리보기에서만 노출 */
  showEmptyPlaceholder: boolean;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toLines(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? value.split('\n')
      : [];
  return source.map((line) => line.trim()).filter(Boolean);
}

function toDateParts(display: InvitationScheduleDisplay): TemplateDateParts {
  return {
    year: String(display.year),
    month: display.monthPadded,
    day: display.dayPadded,
    weekday: display.weekdayKo,
    weekdayEn: display.weekdayEn,
    time: display.timeText,
  };
}

function buildPerson(
  role: string,
  name: string,
  image: string,
  phone: string,
  parentsText: string
): TemplatePerson | null {
  if (!name && !image && !phone && !parentsText) return null;
  return { role, name, image, phone, parentsText };
}

function buildCouple(data: WeddingInvitationData): {
  groom: TemplatePerson | null;
  bride: TemplatePerson | null;
} {
  const [groomFallback, brideFallback] = text(data.parentsInfo)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    groom: buildPerson(
      '신랑',
      text(data.groomName) || text(data.groom?.name),
      text(data.groomImage) || text(data.groom?.image),
      text(data.groomPhone) || text(data.groom?.phone),
      text(data.groom?.parentsText) || (groomFallback ?? '')
    ),
    bride: buildPerson(
      '신부',
      text(data.brideName) || text(data.bride?.name),
      text(data.brideImage) || text(data.bride?.image),
      text(data.bridePhone) || text(data.bride?.phone),
      text(data.bride?.parentsText) || (brideFallback ?? '')
    ),
  };
}

function buildGallery(data: WeddingInvitationData): TemplateGalleryModel {
  const settings = getInvitationGallerySettings(data, { alt: '갤러리 이미지' });
  return {
    items: settings.images,
    displayMode: settings.displayMode,
    hasItems: settings.images.length > 0,
  };
}

function resolveConceptType(data: WeddingInvitationData): InvitationConceptType {
  if (
    data.conceptType === 'WEDDING' ||
    data.conceptType === 'FUNERAL' ||
    data.conceptType === 'ORGANIZATION'
  ) {
    return data.conceptType;
  }
  return 'GENERAL';
}

export function buildTemplateInvitationModel(data: WeddingInvitationData): TemplateInvitationModel {
  const conceptType = resolveConceptType(data);
  const scheduleDisplay = getInvitationScheduleDisplay({
    weddingDate: data.weddingDate ?? null,
    eventDate: data.eventDate ?? null,
    weddingDateTime: data.weddingDateTime ?? null,
  });
  const { groom, bride } = buildCouple(data);
  const venueName = text(data.locationText) || text(data.venueName);
  const address = text(data.address) || venueName;
  const greetingLines = toLines(data.content).length > 0 ? toLines(data.content) : toLines(data.introText);

  return {
    conceptType,
    title: text(data.title) || text(data.heroTitle) || text(data.coupleNames),
    subtitle: text(data.subtitle) || text(data.heroSubtitle) || text(data.introQuote),
    greetingLines,
    hasGreeting: greetingLines.length > 0,
    heroImage: text(data.heroImage),
    gallery: buildGallery(data),
    dateText: scheduleDisplay?.full ?? '',
    dateCompact: scheduleDisplay?.compact ?? '',
    timeText: scheduleDisplay?.timeText ?? '',
    dateParts: scheduleDisplay ? toDateParts(scheduleDisplay) : null,
    scheduleLines: toDisplayScheduleLines(toLines(data.schedule)),
    venueName,
    venueDetail: text(data.venueDetail),
    address,
    detailAddress: text(data.detailAddress) || text(data.venueDetail),
    hasLocation:
      Boolean(address) || (typeof data.mapLat === 'number' && typeof data.mapLng === 'number'),
    groom,
    bride,
    hasCouple: conceptType === 'WEDDING' && Boolean(groom || bride),
    showAccounts: shouldShowAccountsSection(data, conceptType),
    transportInfo: toLines(data.transportInfo),
    parkingInfo: toLines(data.parkingInfo),
  };
}

export function resolveTemplateRenderFlags(props: VisualTemplateProps): TemplateRenderFlags {
  const mode: InvitationRenderMode =
    props.renderMode ?? (props.previewMode ? 'EDITOR_PREVIEW' : 'PUBLIC');
  return {
    mode,
    isPublic: mode === 'PUBLIC',
    isTemplatePreview: mode === 'TEMPLATE_PREVIEW',
    previewMode: mode !== 'PUBLIC' || Boolean(props.previewMode) || !props.invitationSlug,
    showEmptyPlaceholder: mode === 'EDITOR_PREVIEW',
  };
}

/** tel: 링크용 — 공백/하이픈 제거 */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
