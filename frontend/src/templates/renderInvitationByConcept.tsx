'use client';

import type { FuneralInvitationData, InvitationRuntimeData, WeddingInvitationData } from '@/src/invitation/schemas';
import {
  isFuneralInvitationData,
  isWeddingInvitationData,
  resolveInvitationConceptType,
} from '@/src/invitation/schemas';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import GeneralInvitationRenderer from '@/src/templates/general/GeneralInvitationRenderer';
import { buildWeddingClassicData, getSampleWeddingInvitation } from '@/src/templates/weddingClassic/data';
import { resolveCommentsEnabled } from '@/src/invitation/commentsSettings';

type RenderInvitationByConceptProps = {
  data: InvitationRuntimeData;
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  onShare?: () => void;
  onKakaoShare?: () => void;
  isShared?: boolean;
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
 * Concept SSOT renderer — Preview / Public 동일 분기.
 * concept 불명 시 Wedding fallback 금지 → GENERAL.
 */
export default function RenderInvitationByConcept(props: RenderInvitationByConceptProps) {
  const {
    data,
    invitationSlug,
    showPlayButton,
    previewMode,
    showRsvp,
    showGuestbook,
    onShare,
    onKakaoShare,
    isShared,
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
        <WeddingClassicInvitation
          data={{ ...weddingLike, conceptType: 'FUNERAL' }}
          invitationSlug={invitationSlug}
          showPlayButton={showPlayButton}
          previewMode={previewMode}
          showRsvp={showRsvp ?? weddingLike.rsvpEnabled}
          showGuestbook={commentsEnabled}
          onShare={onShare}
          onKakaoShare={onKakaoShare}
          isShared={isShared}
        />
      );
    }
    return (
      <div data-testid="concept-render-error" style={{ padding: 24, textAlign: 'center' }}>
        초대장을 표시할 수 없습니다.
      </div>
    );
  }

  if (conceptType === 'GENERAL') {
    if (!weddingLike) {
      return (
        <div data-testid="concept-render-error" style={{ padding: 24, textAlign: 'center' }}>
          초대장을 표시할 수 없습니다.
        </div>
      );
    }
    return (
      <GeneralInvitationRenderer
        data={{ ...weddingLike, conceptType: 'GENERAL' }}
        invitationSlug={invitationSlug}
        previewMode={previewMode}
        showRsvp={showRsvp ?? weddingLike.rsvpEnabled}
        showComments={commentsEnabled}
        onShare={onShare}
      />
    );
  }

  if (conceptType === 'WEDDING' && weddingLike) {
    return (
      <WeddingClassicInvitation
        data={{ ...weddingLike, conceptType: 'WEDDING' }}
        invitationSlug={invitationSlug}
        showPlayButton={showPlayButton}
        previewMode={previewMode}
        showRsvp={showRsvp ?? weddingLike.rsvpEnabled}
        showGuestbook={commentsEnabled}
        onShare={onShare}
        onKakaoShare={onKakaoShare}
        isShared={isShared}
      />
    );
  }

  // Unknown → GENERAL (never Wedding)
  if (weddingLike) {
    return (
      <GeneralInvitationRenderer
        data={{ ...weddingLike, conceptType: 'GENERAL' }}
        invitationSlug={invitationSlug}
        previewMode={previewMode}
        showRsvp={showRsvp ?? weddingLike.rsvpEnabled}
        showComments={commentsEnabled}
        onShare={onShare}
      />
    );
  }

  return (
    <div data-testid="concept-render-error" style={{ padding: 24, textAlign: 'center' }}>
      초대장을 표시할 수 없습니다.
    </div>
  );
}
