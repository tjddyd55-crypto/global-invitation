'use client';

import type { TemplatePreviewData } from '@/src/templates/previewData';
import { getTemplatePreviewData, getTemplateRegistryEntry } from '@/src/templates/registry';

/** `phone`: 모바일 폭(420px) 기준 중앙 정렬 — 관리자 미리보기/iframe용 */
const PHONE_PREVIEW_MAX_WIDTH_PX = 420;

function safeStudioConfig(studioConfig: unknown): object {
  if (studioConfig && typeof studioConfig === 'object' && !Array.isArray(studioConfig)) {
    return studioConfig as object;
  }
  return {};
}

type TemplatePreviewWrapperProps = {
  templateKey: string;
  sampleData?: TemplatePreviewData | null;
  studioConfig?: unknown;
  variant?: 'default' | 'phone';
};

function resolvePreviewScale(templateKey: string) {
  const entry = getTemplateRegistryEntry(templateKey);
  if (!entry) return 0.28;
  if (entry.category === 'message') return 0.3;
  if (entry.category === 'funeral') return 0.29;
  return 0.24;
}

function isCreatorTemplateKey(templateKey: string): boolean {
  return /^creator_(wedding|funeral|message)_[a-z0-9_]+$/.test(templateKey);
}

function buildPreviewProps(templateKey: string, data: unknown, studioConfig?: unknown) {
  const safeConfig = safeStudioConfig(studioConfig);
  const baseProps = {
    data,
    runtimeData: data,
    previewMode: true,
    studioConfig: safeConfig,
  };

  switch (templateKey) {
    case 'wedding_classic':
    case 'classic':
      return {
        ...baseProps,
        invitationSlug: `preview-${templateKey}`,
        showPlayButton: false,
        showRsvp: false,
        showGuestbook: false,
      };
    case 'message_thankyou':
      return {
        ...baseProps,
        interactive: false,
      };
    default:
      if (isCreatorTemplateKey(templateKey)) {
        return {
          ...baseProps,
          invitationSlug: `preview-${templateKey}`,
          showPlayButton: false,
          showRsvp: false,
          showGuestbook: false,
        };
      }
      return baseProps;
  }
}

export default function TemplatePreviewWrapper({
  templateKey,
  sampleData,
  studioConfig,
  variant = 'default',
}: TemplatePreviewWrapperProps) {
  const key = typeof templateKey === 'string' ? templateKey.trim() : '';
  if (!key) {
    return <div>Template not found</div>;
  }

  const entry = getTemplateRegistryEntry(key);
  const Renderer = entry?.renderer;
  if (!Renderer) {
    return <div>Unknown template: {key}</div>;
  }

  const registryDefault = getTemplatePreviewData(key);
  const previewData = (sampleData ?? registryDefault ?? {}) as TemplatePreviewData;
  const safeConfig = safeStudioConfig(studioConfig);

  const scale = resolvePreviewScale(key);
  const isPhone = variant === 'phone';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        maxWidth: isPhone ? PHONE_PREVIEW_MAX_WIDTH_PX : undefined,
        margin: isPhone ? '0 auto' : undefined,
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          width: `${100 / scale}%`,
          minHeight: `${100 / scale}%`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <Renderer {...buildPreviewProps(key, previewData, safeConfig)} />
      </div>
    </div>
  );
}
