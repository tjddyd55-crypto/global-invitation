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
  getInvitationScheduleCalendarModel,
  SCHEDULE_WEEKDAY_LABELS_KO,
} from '@/src/invitation/scheduleCalendar';
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

export type TemplateDateParts = {
  year: string;
  /** 2자리 (01~12) */
  month: string;
  /** 2자리 (01~31) */
  day: string;
  weekday: string;
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
  /** 사람이 읽는 한 줄 일시 */
  dateText: string;
  dateParts: TemplateDateParts | null;
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

function formatTimeLabel(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return '';
  const meridiem = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${meridiem} ${hour12}시` : `${meridiem} ${hour12}시 ${minutes}분`;
}

function buildDateParts(data: WeddingInvitationData): TemplateDateParts | null {
  const model = getInvitationScheduleCalendarModel({
    weddingDate: data.weddingDate ?? null,
    eventDate: data.eventDate ?? null,
    weddingDateTime: data.weddingDateTime ?? null,
  });
  if (!model) return null;
  return {
    year: String(model.year),
    month: String(model.monthIndex + 1).padStart(2, '0'),
    day: String(model.highlightDay).padStart(2, '0'),
    weekday: SCHEDULE_WEEKDAY_LABELS_KO[model.eventDate.getDay()],
    time: formatTimeLabel(model.eventDate),
  };
}

function buildDateText(data: WeddingInvitationData, parts: TemplateDateParts | null): string {
  const explicit = text(data.weddingDateTime) || toLines(data.schedule)[0];
  if (explicit) return explicit;
  if (!parts) return '';
  const day = `${parts.year}. ${parts.month}. ${parts.day} ${parts.weekday}`;
  return parts.time ? `${day} ${parts.time}` : day;
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
  return data.conceptType === 'WEDDING' || data.conceptType === 'FUNERAL' ? data.conceptType : 'GENERAL';
}

export function buildTemplateInvitationModel(data: WeddingInvitationData): TemplateInvitationModel {
  const conceptType = resolveConceptType(data);
  const dateParts = buildDateParts(data);
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
    dateText: buildDateText(data, dateParts),
    dateParts,
    scheduleLines: toLines(data.schedule),
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
