'use client';

import { useMemo } from 'react';
import { applyStudioConfigToPreviewData } from '@/src/lib/studioPreviewMediaMerge';
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
  /** `sampleData`보다 우선합니다(관리자 미리보기 등 병합 결과). */
  data?: TemplatePreviewData | null;
  sampleData?: TemplatePreviewData | null;
  studioConfig?: unknown;
  variant?: 'default' | 'phone';
};

function resolvePreviewScale(templateKey: string) {
  const entry = getTemplateRegistryEntry(templateKey);
  if (!entry) return 0.28;
  if (entry.category === 'funeral') return 0.29;
  return 0.24;
}

function isCreatorTemplateKey(templateKey: string): boolean {
  return /^creator_(wedding|funeral)_[a-z0-9_]+$/.test(templateKey);
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
    case 'funeral_classic':
    case 'invitation_full':
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
  data,
  sampleData,
  studioConfig,
  variant = 'default',
}: TemplatePreviewWrapperProps) {
  // 훅은 조건부 return 이전에 "반드시" 모두 호출되어야 한다 (React Rules of Hooks).
  const key = typeof templateKey === 'string' ? templateKey.trim() : '';
  const entry = key ? getTemplateRegistryEntry(key) : null;
  const Renderer = entry?.renderer ?? null;
  const registryDefault = key ? getTemplatePreviewData(key) : null;

  const mergedBase = useMemo(
    () =>
      ({
        ...(registryDefault ?? {}),
        ...(sampleData ?? {}),
        ...(data ?? {}),
      }) as TemplatePreviewData,
    [registryDefault, sampleData, data]
  );

  const finalData = useMemo(() => {
    const fd = applyStudioConfigToPreviewData(mergedBase, studioConfig);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- preview 데이터 파이프라인 확인용
      console.log('[TemplatePreview] FINAL DATA', key, {
        heroImage: (fd as Record<string, unknown>).heroImage,
        galleryImages: (fd as Record<string, unknown>).galleryImages,
      });
    }
    return fd;
  }, [mergedBase, studioConfig, key]);

  if (!key) {
    return <div>Template not found</div>;
  }

  if (!Renderer) {
    return <div>Unknown template: {key}</div>;
  }

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
        <Renderer {...buildPreviewProps(key, finalData, studioConfig)} />
      </div>
    </div>
  );
}
