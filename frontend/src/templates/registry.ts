import type { ComponentType } from 'react';
import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';
import { syncGuestTokenFromResponse } from '@/src/lib/guestToken';
import type { TemplatePreviewData } from '@/src/templates/previewData';
import { weddingPreviewData } from '@/src/templates/previewData';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';

export type TemplateCategory =
  | 'wedding'
  | 'birthday'
  | 'funeral'
  | 'party'
  | 'message'
  | 'simple_notice'
  | 'event'
  | 'business';
export type TemplateStyle = 'korean' | 'japanese' | 'western' | 'traditional' | 'modern';
export type TemplateMarketplaceType = 'SYSTEM' | 'CREATOR';
export type TemplateLifecycleStatus =
  | 'CREATED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'DISABLED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'DRAFT'
  | 'SUBMITTED';

export type TemplateEditorType = 'unified' | 'wedding' | 'funeral' | 'message';
export type TemplateRegistryCategory = 'wedding' | 'funeral' | 'message';
export type TemplateRendererComponent = ComponentType<any>;

export interface TemplateDefinition {
  id: string;
  slug?: string;
  title?: string;
  name: string;
  category: TemplateCategory;
  style: TemplateStyle;
  description: string;
  price: number;
  creatorShare: number;
  creatorId?: string;
  creatorName?: string | null;
  creatorEmail?: string | null;
  creatorDisplayId?: string | null;
  component: string;
  templateKey: string;
  publicTemplateKey?: string;
  marketplaceType: TemplateMarketplaceType;
  status: TemplateLifecycleStatus;
  lifecycleStatus?: Exclude<TemplateLifecycleStatus, 'DRAFT' | 'SUBMITTED'>;
  studioConfig?: Record<string, unknown> | null;
  thumbnailUrl?: string | null;
  previewThumbnailUrl?: string | null;
  /** 관리자 템플릿 반려 시 사유 */
  adminRejectReason?: string | null;
  sourceSubmissionId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  cloneCount?: number;
  trendingScore?: number;
}

export type TemplateRegistryEntry = {
  category: TemplateRegistryCategory;
  editorType: TemplateEditorType;
  renderer: TemplateRendererComponent;
  previewData: TemplatePreviewData;
  schema: 'FullInvitationData' | 'WeddingInvitationData' | 'FuneralInvitationData' | 'MessageInvitationData';
  label: string;
  componentName: string;
  editorPath: (slug: string) => string;
};

export const TEMPLATE_REGISTRY: Record<string, TemplateRegistryEntry> = {
  invitation_full: {
    category: 'wedding',
    editorType: 'unified',
    renderer: FullInvitationRenderer,
    previewData: weddingPreviewData,
    schema: 'FullInvitationData',
    label: 'Invitation Full',
    componentName: 'FullInvitationRenderer',
    editorPath: (slug) => `/editor/${slug}`,
  },
  wedding_classic: {
    category: 'wedding',
    editorType: 'unified',
    renderer: FullInvitationRenderer,
    previewData: weddingPreviewData,
    schema: 'FullInvitationData',
    label: 'Invitation Full (Wedding Alias)',
    componentName: 'FullInvitationRenderer',
    editorPath: (slug) => `/editor/${slug}`,
  },
  classic: {
    category: 'wedding',
    editorType: 'unified',
    renderer: FullInvitationRenderer,
    previewData: weddingPreviewData,
    schema: 'FullInvitationData',
    label: 'Invitation Full (Legacy Alias)',
    componentName: 'FullInvitationRenderer',
    editorPath: (slug) => `/editor/${slug}`,
  },
  funeral_classic: {
    category: 'funeral',
    editorType: 'unified',
    renderer: FullInvitationRenderer,
    previewData: weddingPreviewData,
    schema: 'FullInvitationData',
    label: 'Invitation Full (Funeral Alias)',
    componentName: 'FullInvitationRenderer',
    editorPath: (slug) => `/editor/${slug}`,
  },
};

const CREATOR_TEMPLATE_KEY_REGEX = /^creator_(wedding|funeral)_[a-z0-9_]+$/;

const CREATOR_CATEGORY_REGISTRY: Partial<Record<TemplateRegistryCategory, TemplateRegistryEntry>> = {
  wedding: {
    category: 'wedding',
    editorType: 'unified',
    renderer: FullInvitationRenderer,
    previewData: weddingPreviewData,
    schema: 'FullInvitationData',
    label: 'Creator Wedding',
    componentName: 'FullInvitationRenderer',
    editorPath: (slug) => `/editor/${slug}`,
  },
  funeral: {
    category: 'funeral',
    editorType: 'unified',
    renderer: FullInvitationRenderer,
    previewData: weddingPreviewData,
    schema: 'FullInvitationData',
    label: 'Creator Funeral',
    componentName: 'FullInvitationRenderer',
    editorPath: (slug) => `/editor/${slug}`,
  },
};

export const ADMIN_TEMPLATE_KEY_OPTIONS = [
  { value: 'invitation_full', label: 'Invitation Full' },
  { value: 'wedding_classic', label: 'Invitation Full (wedding alias)' },
  { value: 'funeral_classic', label: 'Invitation Full (funeral alias)' },
  { value: 'classic', label: 'Invitation Full (legacy alias)' },
] as const;

export type SupportedTemplateKey = keyof typeof TEMPLATE_REGISTRY;
export const VALID_TEMPLATE_KEYS = Object.keys(TEMPLATE_REGISTRY) as SupportedTemplateKey[];

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  FULL: 'invitation-full-default',
  SIMPLE: 'invitation-full-default',
};

const DEFAULT_TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'invitation-full-default',
    name: 'FULL 초대장 엔진',
    category: 'wedding',
    style: 'modern',
    description: '단일 FULL 엔진 + 컨셉 확장(WEDDING/FUNERAL/GENERAL)',
    price: 50,
    creatorShare: 0,
    component: 'FullInvitationRenderer',
    templateKey: 'invitation_full',
    marketplaceType: 'SYSTEM',
    status: 'PUBLISHED',
    isActive: true,
    isDeleted: false,
    createdAt: '2026-02-17T00:00:00.000Z',
  },
];

export function calculateTemplateRevenue(price: number, creatorShare: number) {
  const normalizedPrice = Number(price) || 0;
  const normalizedShare = Math.min(100, Math.max(0, Number(creatorShare) || 0));
  const creatorEarnings = Number(((normalizedPrice * normalizedShare) / 100).toFixed(2));
  const platformEarnings = Number((normalizedPrice - creatorEarnings).toFixed(2));

  return {
    price: normalizedPrice,
    creatorShare: normalizedShare,
    creatorEarnings,
    platformEarnings,
  };
}

export function getDefaultTemplateRegistry(): TemplateDefinition[] {
  return DEFAULT_TEMPLATE_REGISTRY.map((template) => ({ ...template }));
}

export function getTemplateRegistryEntry(templateKey: string | null | undefined): TemplateRegistryEntry | null {
  if (!templateKey) return null;
  const staticEntry = TEMPLATE_REGISTRY[templateKey];
  if (staticEntry) {
    return staticEntry;
  }

  const creatorMatch = templateKey.match(CREATOR_TEMPLATE_KEY_REGEX);
  if (!creatorMatch) {
    return null;
  }

  const category = creatorMatch[1] as TemplateRegistryCategory;
  return CREATOR_CATEGORY_REGISTRY[category] ?? null;
}

export function getTemplateRenderer(templateKey: string | null | undefined): TemplateRendererComponent | null {
  return getTemplateRegistryEntry(templateKey)?.renderer ?? null;
}

export function getTemplatePreviewData(templateKey: string | null | undefined): TemplatePreviewData | null {
  return getTemplateRegistryEntry(templateKey)?.previewData ?? null;
}

export function getTemplateEditorType(templateKey: string | null | undefined): TemplateEditorType | null {
  return getTemplateRegistryEntry(templateKey)?.editorType ?? null;
}

export function getTemplateComponentName(templateKey: string | null | undefined): string | null {
  return getTemplateRegistryEntry(templateKey)?.componentName ?? null;
}

export function getTemplateEditorPath(templateKey: string | null | undefined, slug: string): string | null {
  const entry = getTemplateRegistryEntry(templateKey);
  if (!entry) return null;
  return entry.editorPath(slug);
}

export function isValidTemplateKey(templateKey: string | null | undefined): boolean {
  return Boolean(getTemplateRegistryEntry(templateKey));
}

export function isTemplateSupported(template: TemplateDefinition): boolean {
  return isValidTemplateKey(template.templateKey);
}

export function isTemplateVisible(template: TemplateDefinition): boolean {
  return (
    template.status === 'PUBLISHED' &&
    template.isActive &&
    !template.isDeleted &&
    isTemplateSupported(template)
  );
}

export function listVisibleTemplateDefinitions(
  templates: TemplateDefinition[] = getDefaultTemplateRegistry()
): TemplateDefinition[] {
  return templates.filter(isTemplateVisible);
}

function normalizeRequestedTemplateId(templateId: string | null): string | null {
  if (!templateId) return null;
  return LEGACY_TEMPLATE_ALIASES[templateId] ?? templateId;
}

function matchesTemplateIdentifier(template: TemplateDefinition, identifier: string): boolean {
  return (
    template.id === identifier ||
    template.slug === identifier ||
    template.publicTemplateKey === identifier
  );
}

export function getTemplateDefinitionById(
  templateId: string | null,
  templates: TemplateDefinition[] = getDefaultTemplateRegistry()
): TemplateDefinition | null {
  const normalizedId = normalizeRequestedTemplateId(templateId);
  if (!normalizedId) return null;
  return templates.find((template) => matchesTemplateIdentifier(template, normalizedId)) ?? null;
}

export function resolveTemplateKeyByTemplateId(
  templateId: string | null,
  templates: TemplateDefinition[] = getDefaultTemplateRegistry()
): string | null {
  const template = getTemplateDefinitionById(templateId, templates);
  return template?.templateKey ?? null;
}

export function resolveRendererByTemplateKey(templateKey: string | null): string | null {
  return getTemplateRegistryEntry(templateKey)?.label ?? null;
}

export async function fetchVisibleTemplateDefinitions(
  sort: 'newest' | 'popular' | 'trending' = 'newest'
): Promise<TemplateDefinition[]> {
  try {
    const response = await fetch(
      buildApiUrl(`/api/templates/marketplace?sort=${encodeURIComponent(sort)}`),
      buildRequestInit({ cache: 'no-store' })
    );
    if (!response.ok) {
      return listVisibleTemplateDefinitions();
    }
    syncGuestTokenFromResponse(response);
    const templates = (await response.json()) as TemplateDefinition[];
    return listVisibleTemplateDefinitions(templates);
  } catch {
    return listVisibleTemplateDefinitions();
  }
}

export async function fetchTemplateDefinitionById(templateId: string): Promise<TemplateDefinition | null> {
  try {
    const normalizedId = normalizeRequestedTemplateId(templateId);
    if (!normalizedId) {
      return null;
    }

    const response = await fetch(
      buildApiUrl(`/api/templates/${normalizedId}`),
      buildRequestInit({ cache: 'no-store' })
    );

    if (!response.ok) {
      return getTemplateDefinitionById(normalizedId);
    }

    syncGuestTokenFromResponse(response);
    const template = (await response.json()) as TemplateDefinition;
    return isTemplateVisible(template) ? template : null;
  } catch {
    const template = getTemplateDefinitionById(templateId);
    return template && isTemplateVisible(template) ? template : null;
  }
}
