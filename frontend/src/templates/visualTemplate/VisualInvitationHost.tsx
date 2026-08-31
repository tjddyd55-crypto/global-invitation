'use client';

import { useEffect, useState, type ComponentType } from 'react';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { resolveInvitationConceptType } from '@/src/invitation/schemas';
import { resolveVisualTemplateId } from './resolveVisualTemplateId';
import type { VisualTemplateId } from './ids';
import { isVisualTemplateId } from './ids';
import { loadVisualTemplateRenderer } from './loadVisualTemplateRenderer';
import type {
  InvitationRenderMode,
  VisualTemplateRendererProps,
} from './visualTemplateRegistry';
import { visualTemplateFonts } from './fonts';
import DefinitionTemplateRenderer from '@/src/templates/definition/DefinitionTemplateRenderer';
import type { TemplateDefinition } from '@/src/templates/definition/types';
import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';

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
  /** Force a CODE template (preview route). Still validated against concept. */
  visualTemplateIdOverride?: VisualTemplateId;
  /** Admin/preview: inject FIGMA definition directly */
  definitionOverride?: TemplateDefinition;
  /** Snapshot version id for FIGMA render */
  visualTemplateVersionId?: string | null;
};

async function fetchDefinition(
  templateKey: string,
  versionId?: string | null
): Promise<TemplateDefinition | null> {
  const qs = versionId ? `?versionId=${encodeURIComponent(versionId)}` : '';
  const response = await fetch(
    buildApiUrl(`/api/templates/visual-definition/${encodeURIComponent(templateKey)}${qs}`),
    buildRequestInit({ method: 'GET' })
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { definition?: TemplateDefinition };
  return json.definition || null;
}

/**
 * Resolves visualTemplateId:
 * - CODE registry → dynamic CODE renderer
 * - FIGMA_DEFINITION → DefinitionTemplateRenderer
 * FUNERAL is handled outside this host.
 */
export default function VisualInvitationHost(props: VisualInvitationHostProps) {
  const conceptType = resolveInvitationConceptType(props.data);
  const rawId =
    props.visualTemplateIdOverride ??
    (typeof (props.data as { visualTemplateId?: unknown }).visualTemplateId === 'string'
      ? String((props.data as { visualTemplateId?: string }).visualTemplateId)
      : undefined);

  const codeResolved =
    props.visualTemplateIdOverride ??
    (rawId && isVisualTemplateId(rawId)
      ? rawId
      : !rawId
        ? resolveVisualTemplateId(props.data as { visualTemplateId?: unknown; conceptType?: unknown }, conceptType)
        : null);

  const [Renderer, setRenderer] = useState<ComponentType<VisualTemplateRendererProps> | null>(null);
  const [definition, setDefinition] = useState<TemplateDefinition | null>(
    props.definitionOverride || null
  );
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<'CODE' | 'FIGMA' | null>(props.definitionOverride ? 'FIGMA' : null);

  useEffect(() => {
    if (props.definitionOverride) {
      setDefinition(props.definitionOverride);
      setMode('FIGMA');
      setFailed(false);
      return;
    }

    let cancelled = false;
    setRenderer(null);
    setFailed(false);

    async function resolve() {
      if (codeResolved && isVisualTemplateId(codeResolved)) {
        try {
          const mod = await loadVisualTemplateRenderer(codeResolved);
          if (!cancelled) {
            setRenderer(() => mod.default);
            setMode('CODE');
          }
          return;
        } catch {
          // fall through to definition fetch
        }
      }

      const key = rawId || codeResolved;
      if (!key) {
        if (!cancelled) setFailed(true);
        return;
      }

      const versionId =
        props.visualTemplateVersionId ||
        (typeof (props.data as { visualTemplateVersionId?: string }).visualTemplateVersionId ===
        'string'
          ? (props.data as { visualTemplateVersionId?: string }).visualTemplateVersionId
          : null);

      const def = await fetchDefinition(key, versionId);
      if (cancelled) return;
      if (def) {
        setDefinition(def);
        setMode('FIGMA');
        return;
      }
      setFailed(true);
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [
    codeResolved,
    rawId,
    props.definitionOverride,
    props.visualTemplateVersionId,
    props.data,
  ]);

  if (failed) {
    return (
      <div data-testid="visual-template-error" style={{ padding: 24, textAlign: 'center' }}>
        초대장을 표시할 수 없습니다.
      </div>
    );
  }

  if (mode === 'FIGMA' && definition) {
    return (
      <div
        className={visualTemplateFonts.className}
        data-visual-template={definition.templateKey}
        data-visual-source="FIGMA_DEFINITION"
      >
        <DefinitionTemplateRenderer
          definition={definition}
          data={props.data as Record<string, unknown>}
          invitationSlug={props.invitationSlug}
          previewMode={props.previewMode ?? props.renderMode !== 'PUBLIC'}
          renderMode={props.renderMode}
          showRsvp={props.showRsvp}
          showComments={props.showComments}
        />
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
    <div className={visualTemplateFonts.className} data-visual-template={codeResolved || rawId}>
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
