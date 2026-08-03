'use client';

import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import RenderInvitationByConcept from '@/src/templates/renderInvitationByConcept';
import type { InvitationRenderMode } from '@/src/templates/visualTemplate/visualTemplateRegistry';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';

type FullInvitationRendererProps = {
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

/**
 * FULL 엔진 엔트리 — concept SSOT (`renderInvitationByConcept`)로 위임.
 */
export default function FullInvitationRenderer(props: FullInvitationRendererProps) {
  return <RenderInvitationByConcept {...props} />;
}
