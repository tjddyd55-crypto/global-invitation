'use client';

import type { FuneralInvitationData, InvitationRuntimeData, WeddingInvitationData } from '@/src/invitation/schemas';
import {
  isFuneralInvitationData,
  isWeddingInvitationData,
  resolveInvitationConceptType,
} from '@/src/invitation/schemas';
import { normalizeOrganizationBranding } from '@/src/invitation/conceptTypes';
import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import { buildWeddingClassicData, getSampleWeddingInvitation } from '@/src/templates/weddingClassic/data';
import { resolveCommentsEnabled } from '@/src/invitation/commentsSettings';
import VisualInvitationHost from '@/src/templates/visualTemplate/VisualInvitationHost';
import type { InvitationRenderMode } from '@/src/templates/visualTemplate/visualTemplateRegistry';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';

type RenderInvitationByConceptProps = {
  data: InvitationRuntimeData;
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  renderMode?: InvitationRenderMode;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  onShare?: () => void;
  onKakaoShare?: () => void;
  isShared?: boolean;
  visualTemplateIdOverride?: VisualTemplateId;
};

function toWeddingFromFuneral(data: FuneralInvitationData): WeddingInvitationData {
  const base = buildWeddingClassicData(getSampleWeddingInvitation());
  const funeralDate = new Date(data.schedule.funeralDate);
  const normalizedDate = Number.isNaN(funeralDate.getTime()) ? base.weddingDate : funeralDate;
  return {
    ...base,
    templateType: 'FULL',
    conceptType: 'FUNERAL',
    title: data.deceasedName ? `${data.deceasedName} 추모 초대` : base.title,
    content: data.message || base.content,
    eventDate: data.schedule.funeralDate || base.eventDate,
    locationText: data.funeralHall.address || data.funeralHall.name || base.locationText,
    schedule: [data.schedule.wakeStart, data.schedule.funeralDate, data.schedule.burial].filter(
      (item): item is string => Boolean(item)
    ),
    rsvpEnabled: false,
    guestbookEnabled: base.guestbookEnabled ?? true,
    commentsEnabled: true,
    heroImage: data.heroImage || base.heroImage,
    heroTitle: data.deceasedName ? `${data.deceasedName} 추모 초대` : base.heroTitle,
    heroSubtitle: data.schedule.funeralDate || base.heroSubtitle,
    venueName: data.funeralHall.name || base.venueName,
    introQuote: data.message || base.introQuote,
    introText: data.familyMembers ?? base.introText,
    weddingDate: normalizedDate,
    weddingDateTime: data.schedule.funeralDate || base.weddingDateTime,
    address: data.funeralHall.address || base.address,
    mapImage: data.funeralHall.mapImage || base.mapImage,
    mapLat: data.funeralHall.mapLat,
    mapLng: data.funeralHall.mapLng,
    deceasedName: data.deceasedName,
    funeralHall: data.funeralHall.name,
    funeralDate: data.schedule.funeralDate,
    contactPerson: data.contact ? `${data.contact.name} ${data.contact.phone}`.trim() : '',
    groomName: '',
    brideName: '',
    groomImage: '',
    brideImage: '',
    groomPhone: '',
    bridePhone: '',
    parentsInfo: '',
  };
}

function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stringArrayOrEmpty(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? (value as string[])
    : [];
}

/**
 * create 직후 dataJson 은 conceptType/templateType/visualTemplateId 만 있을 수 있다.
 * 샘플 fixture 를 섞지 않고 빈 필드로 wedding-like 를 만든다.
 */
function toSparseWeddingLike(
  data: Record<string, unknown>,
  conceptType: 'WEDDING' | 'GENERAL' | 'ORGANIZATION'
): WeddingInvitationData {
  const eventDate = textOrEmpty(data.eventDate);
  const parsedDate = eventDate ? new Date(eventDate) : new Date(0);
  return {
    templateType: 'FULL',
    conceptType,
    visualTemplateId: textOrEmpty(data.visualTemplateId) || undefined,
    title: textOrEmpty(data.title),
    subtitle: textOrEmpty(data.subtitle),
    content: textOrEmpty(data.content),
    eventDate,
    locationText: textOrEmpty(data.locationText),
    venueDetail: textOrEmpty(data.venueDetail),
    venueName: textOrEmpty(data.venueName),
    schedule: stringArrayOrEmpty(data.schedule),
    rsvpEnabled: typeof data.rsvpEnabled === 'boolean' ? data.rsvpEnabled : false,
    guestbookEnabled: typeof data.guestbookEnabled === 'boolean' ? data.guestbookEnabled : false,
    commentsEnabled: typeof data.commentsEnabled === 'boolean' ? data.commentsEnabled : false,
    heroImage: textOrEmpty(data.heroImage),
    galleryImages: stringArrayOrEmpty(data.galleryImages),
    heroTitle: textOrEmpty(data.heroTitle),
    heroSubtitle: textOrEmpty(data.heroSubtitle),
    coupleNames: textOrEmpty(data.coupleNames),
    weddingDateTime: textOrEmpty(data.weddingDateTime),
    introQuote: textOrEmpty(data.introQuote),
    introText: stringArrayOrEmpty(data.introText),
    weddingDate: Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate,
    address: textOrEmpty(data.address),
    mapImage: textOrEmpty(data.mapImage),
    transportInfo: stringArrayOrEmpty(data.transportInfo),
    parkingInfo: stringArrayOrEmpty(data.parkingInfo),
    accounts: Array.isArray(data.accounts) ? (data.accounts as WeddingInvitationData['accounts']) : [],
    messages: Array.isArray(data.messages) ? (data.messages as WeddingInvitationData['messages']) : [],
    groomName: textOrEmpty(data.groomName),
    brideName: textOrEmpty(data.brideName),
    groomImage: textOrEmpty(data.groomImage),
    brideImage: textOrEmpty(data.brideImage),
    groomPhone: textOrEmpty(data.groomPhone),
    bridePhone: textOrEmpty(data.bridePhone),
    parentsInfo: textOrEmpty(data.parentsInfo),
    groom:
      data.groom && typeof data.groom === 'object'
        ? (data.groom as WeddingInvitationData['groom'])
        : { name: textOrEmpty(data.groomName) },
    bride:
      data.bride && typeof data.bride === 'object'
        ? (data.bride as WeddingInvitationData['bride'])
        : { name: textOrEmpty(data.brideName) },
    organization: normalizeOrganizationBranding(data.organization),
  };
}

function resolveWeddingLikePayload(data: InvitationRuntimeData): WeddingInvitationData | null {
  if (isWeddingInvitationData(data)) return data;
  if (isFuneralInvitationData(data)) return toWeddingFromFuneral(data);

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    // PATCH 는 dataJson 을 merge 하지 않고 교체할 수 있어 templateType 이 빠질 수 있다.
    // FUNERAL 스키마가 아니면 WEDDING/GENERAL sparse 로 렌더한다 (샘플 fixture 병합 금지).
    if (record.templateType !== undefined && record.templateType !== 'FULL') {
      return null;
    }
    const concept = resolveInvitationConceptType(record as InvitationRuntimeData);
    if (concept === 'WEDDING' || concept === 'GENERAL' || concept === 'ORGANIZATION') {
      return toSparseWeddingLike(record, concept);
    }
  }
  return null;
}

/**
 * Concept SSOT renderer — Preview / Public / Template Preview 동일 분기.
 * WEDDING/GENERAL/ORGANIZATION → VisualInvitationHost (visualTemplateId).
 * FUNERAL → 기존 Classic only (visual registry 제외).
 */
export default function RenderInvitationByConcept(props: RenderInvitationByConceptProps) {
  const {
    data,
    invitationSlug,
    showPlayButton,
    previewMode,
    renderMode,
    showRsvp,
    showGuestbook,
    onShare,
    onKakaoShare,
    isShared,
    visualTemplateIdOverride,
  } = props;

  const conceptType = resolveInvitationConceptType(data);
  const weddingLike = resolveWeddingLikePayload(data);
  const commentsEnabled = showGuestbook ?? (weddingLike ? resolveCommentsEnabled(weddingLike) : true);

  if (conceptType === 'FUNERAL') {
    if (isFuneralInvitationData(data)) {
      return (
        <FuneralClassicInvitation
          data={data}
          invitationSlug={invitationSlug}
          previewMode={previewMode}
          onShare={onShare}
          onKakaoShare={onKakaoShare}
        />
      );
    }
    if (weddingLike) {
      return (
        <VisualInvitationHost
          data={{ ...weddingLike, conceptType: 'FUNERAL' }}
          invitationSlug={invitationSlug}
          showPlayButton={showPlayButton}
          previewMode={previewMode}
          renderMode={renderMode}
          showRsvp={showRsvp ?? weddingLike.rsvpEnabled}
          showGuestbook={commentsEnabled}
          onShare={onShare}
          onKakaoShare={onKakaoShare}
          isShared={isShared}
          visualTemplateIdOverride="WEDDING_01_CLASSIC"
        />
      );
    }
    return (
      <div data-testid="concept-render-error" style={{ padding: 24, textAlign: 'center' }}>
        초대장을 표시할 수 없습니다.
      </div>
    );
  }

  if (!weddingLike) {
    return (
      <div data-testid="concept-render-error" style={{ padding: 24, textAlign: 'center' }}>
        초대장을 표시할 수 없습니다.
      </div>
    );
  }

  const resolvedConcept =
    conceptType === 'WEDDING' || conceptType === 'GENERAL' || conceptType === 'ORGANIZATION'
      ? conceptType
      : 'GENERAL';

  return (
    <VisualInvitationHost
      data={{ ...weddingLike, conceptType: resolvedConcept }}
      invitationSlug={invitationSlug}
      showPlayButton={showPlayButton}
      previewMode={previewMode}
      renderMode={renderMode}
      showRsvp={showRsvp ?? weddingLike.rsvpEnabled}
      showGuestbook={commentsEnabled}
      showComments={commentsEnabled}
      onShare={onShare}
      onKakaoShare={onKakaoShare}
      isShared={isShared}
      visualTemplateIdOverride={visualTemplateIdOverride}
    />
  );
}
