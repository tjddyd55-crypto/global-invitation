'use client';

import type { FuneralInvitationData, InvitationRuntimeData, WeddingInvitationData } from '@/src/invitation/schemas';
import {
  isFuneralInvitationData,
  isWeddingInvitationData,
  resolveInvitationConceptType,
} from '@/src/invitation/schemas';
import { getFuneralClassicDemoData } from '@/src/templates/funeralClassic/data';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import { buildWeddingClassicData, getSampleWeddingInvitation } from '@/src/templates/weddingClassic/data';

type FullInvitationRendererProps = {
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
    rsvpEnabled: true,
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
  };
}

export default function FullInvitationRenderer({
  data,
  invitationSlug,
  showPlayButton,
  previewMode,
  showRsvp,
  showGuestbook,
  onShare,
  onKakaoShare,
  isShared,
}: FullInvitationRendererProps) {
  const conceptType = resolveInvitationConceptType(data, (data as { templateKey?: string })?.templateKey);

  const weddingData =
    isWeddingInvitationData(data)
      ? data
      : isFuneralInvitationData(data)
        ? toWeddingFromFuneral(data)
        : toWeddingFromFuneral(getFuneralClassicDemoData());

  const normalizedData =
    conceptType === 'FUNERAL'
      ? { ...weddingData, conceptType: 'FUNERAL' as const }
      : conceptType === 'GENERAL'
        ? { ...weddingData, conceptType: 'GENERAL' as const }
        : { ...weddingData, conceptType: 'WEDDING' as const };

  return (
    <WeddingClassicInvitation
      data={normalizedData}
      invitationSlug={invitationSlug}
      showPlayButton={showPlayButton}
      previewMode={previewMode}
      showRsvp={showRsvp}
      showGuestbook={showGuestbook}
      onShare={onShare}
      onKakaoShare={onKakaoShare}
      showCoupleSection={conceptType === 'WEDDING'}
      isShared={isShared}
    />
  );
}

