'use client';

import type { TemplatePreviewData } from '@/src/templates/previewData';
import { getTemplatePreviewData, getTemplateRegistryEntry, type SupportedTemplateKey } from '@/src/templates/registry';

type TemplatePreviewWrapperProps = {
  templateKey: string;
  sampleData?: TemplatePreviewData;
};

function resolvePreviewScale(templateKey: SupportedTemplateKey) {
  const entry = getTemplateRegistryEntry(templateKey);
  if (!entry) return 0.28;
  if (entry.category === 'message') return 0.3;
  if (entry.category === 'funeral') return 0.29;
  return 0.24;
}

function buildPreviewProps(templateKey: SupportedTemplateKey, data: unknown) {
  const baseProps = {
    data,
    previewMode: true,
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
      return baseProps;
  }
}

export default function TemplatePreviewWrapper({ templateKey, sampleData }: TemplatePreviewWrapperProps) {
  const entry = getTemplateRegistryEntry(templateKey);
  const previewData = sampleData ?? getTemplatePreviewData(templateKey);

  if (!entry || !previewData) {
    return null;
  }

  const Renderer = entry.renderer;
  const scale = resolvePreviewScale(templateKey as SupportedTemplateKey);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
        <Renderer {...buildPreviewProps(templateKey as SupportedTemplateKey, previewData)} />
      </div>
    </div>
  );
}
