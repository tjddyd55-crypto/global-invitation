'use client';

import { useEffect, useState, type ComponentType } from 'react';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { resolveInvitationConceptType } from '@/src/invitation/schemas';
import { resolveVisualTemplateId } from './resolveVisualTemplateId';
import type { VisualTemplateId } from './ids';
import { loadVisualTemplateRenderer } from './loadVisualTemplateRenderer';
import type {
  InvitationRenderMode,
  VisualTemplateRendererProps,
} from './visualTemplateRegistry';
import { visualTemplateFonts } from './fonts';

export type VisualInvitationHostProps = {
  data: WeddingInvitationData;
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  renderMode?: InvitationRenderMode;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  showComments?: boolean;
  onShare?: () => void;
  onKakaoShare?: () => void;
  isShared?: boolean;
  /** Force a template (preview route). Still validated against concept. */
  visualTemplateIdOverride?: VisualTemplateId;
};

/**
 * Resolves visualTemplateId and dynamically loads the matching renderer.
 * FUNERAL is handled outside this host.
 */
export default function VisualInvitationHost(props: VisualInvitationHostProps) {
  const conceptType = resolveInvitationConceptType(props.data);
  const resolved =
    props.visualTemplateIdOverride ??
    resolveVisualTemplateId(props.data as { visualTemplateId?: unknown; conceptType?: unknown }, conceptType);

  const [Renderer, setRenderer] = useState<ComponentType<VisualTemplateRendererProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRenderer(null);
    setFailed(false);
    if (!resolved) {
      setFailed(true);
      return;
    }
    void loadVisualTemplateRenderer(resolved)
      .then((mod) => {
        if (!cancelled) setRenderer(() => mod.default);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <div data-testid="visual-template-error" style={{ padding: 24, textAlign: 'center' }}>
        초대장을 표시할 수 없습니다.
      </div>
    );
  }

  if (!Renderer) {
    return (
      <div data-testid="visual-template-loading" style={{ padding: 48, textAlign: 'center', opacity: 0.6 }}>
        …
      </div>
    );
  }

  const renderMode: InvitationRenderMode =
    props.renderMode ?? (props.previewMode ? 'EDITOR_PREVIEW' : 'PUBLIC');

  return (
    <div className={visualTemplateFonts.className} data-visual-template={resolved}>
      <Renderer
        data={props.data as VisualTemplateRendererProps['data']}
        invitationSlug={props.invitationSlug}
        showPlayButton={props.showPlayButton}
        previewMode={props.previewMode ?? renderMode !== 'PUBLIC'}
        renderMode={renderMode}
        showRsvp={props.showRsvp}
        showGuestbook={props.showGuestbook}
        showComments={props.showComments}
        onShare={props.onShare}
        onKakaoShare={props.onKakaoShare}
        isShared={props.isShared}
      />
    </div>
  );
}
