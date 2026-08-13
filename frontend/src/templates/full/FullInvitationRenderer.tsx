'use client';

import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import { InvitationLocaleProvider } from '@/src/i18n/InvitationLocaleContext';
import { resolveInvitationLocale } from '@/src/i18n/productLocales';
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
  const data = props.data as { locale?: string; language?: string };
  const locale = resolveInvitationLocale(data?.language || data?.locale);
  return (
    <InvitationLocaleProvider locale={locale}>
      <RenderInvitationByConcept {...props} />
    </InvitationLocaleProvider>
  );
}
