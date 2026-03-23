'use client';

import type { TemplatePreviewData } from '@/src/templates/previewData';
import { getTemplatePreviewData, getTemplateRegistryEntry } from '@/src/templates/registry';

/** `phone`: 모바일 폭(420px) 기준 중앙 정렬 — 관리자 미리보기/iframe용 */
const PHONE_PREVIEW_MAX_WIDTH_PX = 420;

type TemplatePreviewWrapperProps = {
  templateKey: string;
  sampleData?: TemplatePreviewData;
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
  const baseProps = {
    data,
    runtimeData: data,
    previewMode: true,
    studioConfig,
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
  const entry = getTemplateRegistryEntry(templateKey);
  const previewData = sampleData ?? getTemplatePreviewData(templateKey);

  if (!entry || !previewData) {
    return null;
  }

  const Renderer = entry.renderer;
  const scale = resolvePreviewScale(templateKey);

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
        <Renderer {...buildPreviewProps(templateKey, previewData, studioConfig)} />
      </div>
    </div>
  );
}
