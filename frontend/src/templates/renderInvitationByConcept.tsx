'use client';

import type { FuneralInvitationData, InvitationRuntimeData, WeddingInvitationData } from '@/src/invitation/schemas';
import {
  isFuneralInvitationData,
  isWeddingInvitationData,
  resolveInvitationConceptType,
} from '@/src/invitation/schemas';
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

function resolveWeddingLikePayload(data: InvitationRuntimeData): WeddingInvitationData | null {
  if (isWeddingInvitationData(data)) return data;
  if (isFuneralInvitationData(data)) return toWeddingFromFuneral(data);
  return null;
}

/**
 * Concept SSOT renderer — Preview / Public / Template Preview 동일 분기.
 * WEDDING/GENERAL → VisualInvitationHost (visualTemplateId).
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

  const resolvedConcept = conceptType === 'WEDDING' || conceptType === 'GENERAL' ? conceptType : 'GENERAL';

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
