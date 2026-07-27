'use client';

import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import RenderInvitationByConcept from '@/src/templates/renderInvitationByConcept';

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

/**
 * FULL 엔진 엔트리 — concept SSOT (`renderInvitationByConcept`)로 위임.
 * GENERAL은 WeddingClassicInvitation을 쓰지 않는다.
 */
export default function FullInvitationRenderer(props: FullInvitationRendererProps) {
  return <RenderInvitationByConcept {...props} />;
}
