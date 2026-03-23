import type { ComponentType } from 'react';
import { buildApiUrl } from '@/src/lib/apiBase';
import type { TemplatePreviewData } from '@/src/templates/previewData';
import {
  funeralPreviewData,
  messageBrandedJciPreviewData,
  messageSimplePreviewData,
  messageThankYouPreviewData,
  weddingPreviewData,
} from '@/src/templates/previewData';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import MessageSimpleCard from '@/src/templates/messageSimple/MessageSimpleCard';
import MessageThankYouCard from '@/src/templates/messageThankYou/MessageThankYouCard';
import MessageBrandedJCI from '@/src/templates/messageBranded/jci/MessageBrandedJCI';
import CreatorWeddingRenderer from '@/src/templates/creator/CreatorWeddingRenderer';
import CreatorFuneralRenderer from '@/src/templates/creator/CreatorFuneralRenderer';
import CreatorMessageRenderer from '@/src/templates/creator/CreatorMessageRenderer';

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

export type TemplateEditorType = 'wedding' | 'funeral' | 'message';
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
  schema: 'WeddingInvitationData' | 'FuneralInvitationData' | 'MessageInvitationData';
  label: string;
  componentName: string;
  editorPath: (slug: string) => string;
};

export const TEMPLATE_REGISTRY: Record<string, TemplateRegistryEntry> = {
  wedding_classic: {
    category: 'wedding',
    editorType: 'wedding',
    renderer: WeddingClassicInvitation,
    previewData: weddingPreviewData,
    schema: 'WeddingInvitationData',
    label: 'Wedding Classic',
    componentName: 'WeddingClassicTemplate',
    editorPath: (slug) => `/editor/${slug}`,
  },
  classic: {
    category: 'wedding',
    editorType: 'wedding',
    renderer: WeddingClassicInvitation,
    previewData: weddingPreviewData,
    schema: 'WeddingInvitationData',
    label: 'Wedding Classic (Legacy)',
    componentName: 'WeddingClassicTemplate',
    editorPath: (slug) => `/editor/${slug}`,
  },
  funeral_classic: {
    category: 'funeral',
    editorType: 'funeral',
    renderer: FuneralClassicInvitation,
    previewData: funeralPreviewData,
    schema: 'FuneralInvitationData',
    label: 'Funeral Classic',
    componentName: 'FuneralClassicTemplate',
    editorPath: (slug) => `/editor/${slug}`,
  },
  message_simple: {
    category: 'message',
    editorType: 'message',
    renderer: MessageSimpleCard,
    previewData: messageSimplePreviewData,
    schema: 'MessageInvitationData',
    label: 'Message Simple',
    componentName: 'MessageSimpleTemplate',
    editorPath: (slug) => `/message/editor/${slug}`,
  },
  message_thankyou: {
    category: 'message',
    editorType: 'message',
    renderer: MessageThankYouCard,
    previewData: messageThankYouPreviewData,
    schema: 'MessageInvitationData',
    label: 'Message Thank You',
    componentName: 'MessageThankYouTemplate',
    editorPath: (slug) => `/message/editor/${slug}`,
  },
  message_branded_jci: {
    category: 'message',
    editorType: 'message',
    renderer: MessageBrandedJCI,
    previewData: messageBrandedJciPreviewData,
    schema: 'MessageInvitationData',
    label: 'Message Branded JCI',
    componentName: 'MessageBrandedJciTemplate',
    editorPath: (slug) => `/message/branded/editor/${slug}`,
  },
  message_branded: {
    category: 'message',
    editorType: 'message',
    renderer: MessageBrandedJCI,
    previewData: messageBrandedJciPreviewData,
    schema: 'MessageInvitationData',
    label: 'Message Branded JCI (Legacy)',
    componentName: 'MessageBrandedJciTemplate',
    editorPath: (slug) => `/message/branded/editor/${slug}`,
  },
};

const CREATOR_TEMPLATE_KEY_REGEX = /^creator_(wedding|funeral|message)_[a-z0-9_]+$/;

const CREATOR_CATEGORY_REGISTRY: Record<TemplateRegistryCategory, TemplateRegistryEntry> = {
  wedding: {
    category: 'wedding',
    editorType: 'wedding',
    renderer: CreatorWeddingRenderer,
    previewData: weddingPreviewData,
    schema: 'WeddingInvitationData',
    label: 'Creator Wedding',
    componentName: 'CreatorWeddingTemplate',
    editorPath: (slug) => `/editor/${slug}`,
  },
  funeral: {
    category: 'funeral',
    editorType: 'funeral',
    renderer: CreatorFuneralRenderer,
    previewData: funeralPreviewData,
    schema: 'FuneralInvitationData',
    label: 'Creator Funeral',
    componentName: 'CreatorFuneralTemplate',
    editorPath: (slug) => `/editor/${slug}`,
  },
  message: {
    category: 'message',
    editorType: 'message',
    renderer: CreatorMessageRenderer,
    previewData: messageSimplePreviewData,
    schema: 'MessageInvitationData',
    label: 'Creator Message',
    componentName: 'CreatorMessageTemplate',
    editorPath: (slug) => `/message/editor/${slug}`,
  },
};

export const ADMIN_TEMPLATE_KEY_OPTIONS = [
  { value: 'wedding_classic', label: 'Wedding Classic' },
  { value: 'classic', label: 'Wedding Classic (legacy alias)' },
  { value: 'funeral_classic', label: 'Funeral Classic' },
  { value: 'message_simple', label: 'Message Simple' },
  { value: 'message_thankyou', label: 'Message Thank You' },
  { value: 'message_branded_jci', label: 'Message Branded JCI' },
  { value: 'message_branded', label: 'Message Branded JCI (legacy alias)' },
] as const;

export type SupportedTemplateKey = keyof typeof TEMPLATE_REGISTRY;
export const VALID_TEMPLATE_KEYS = Object.keys(TEMPLATE_REGISTRY) as SupportedTemplateKey[];

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  FULL: 'wedding-korean-classic',
  SIMPLE: 'wedding-simple-minimal',
};

const DEFAULT_TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'wedding-korean-classic',
    name: '한국 전통 웨딩',
    category: 'wedding',
    style: 'korean',
    description: '전통적인 한국식 결혼식 초대장',
    price: 50,
    creatorShare: 0,
    component: 'WeddingClassicTemplate',
    templateKey: 'wedding_classic',
    marketplaceType: 'SYSTEM',
    status: 'PUBLISHED',
    isActive: true,
    isDeleted: false,
    createdAt: '2026-02-17T00:00:00.000Z',
  },
  {
    id: 'wedding-modern-white',
    name: '모던 화이트 웨딩',
    category: 'wedding',
    style: 'modern',
    description: '깔끔하고 현대적인 웨딩 초대장',
    price: 50,
    creatorShare: 0,
    component: 'WeddingClassicTemplate',
    templateKey: 'wedding_classic',
    marketplaceType: 'SYSTEM',
    status: 'PUBLISHED',
    isActive: true,
    isDeleted: false,
    createdAt: '2026-02-17T00:00:00.000Z',
  },
  {
    id: 'wedding-japanese-minimal',
    name: '일본식 웨딩',
    category: 'wedding',
    style: 'japanese',
    description: '절제된 일본 스타일의 웨딩 초대장',
    price: 50,
    creatorShare: 20,
    creatorId: 'creator-japan-studio',
    component: 'WeddingClassicTemplate',
    templateKey: 'wedding_classic',
    marketplaceType: 'CREATOR',
    status: 'PUBLISHED',
    isActive: true,
    isDeleted: false,
    createdAt: '2026-02-17T00:00:00.000Z',
  },
  {
    id: 'wedding-simple-minimal',
    name: '심플 웨딩',
    category: 'wedding',
    style: 'western',
    description: '군더더기 없이 단정한 웨딩 초대장',
    price: 30,
    creatorShare: 0,
    component: 'WeddingClassicTemplate',
    templateKey: 'classic',
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
    const response = await fetch(buildApiUrl(`/api/templates/marketplace?sort=${encodeURIComponent(sort)}`), {
      cache: 'no-store',
    });
    if (!response.ok) {
      return listVisibleTemplateDefinitions();
    }
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

    const response = await fetch(buildApiUrl(`/api/templates/${normalizedId}`), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return getTemplateDefinitionById(normalizedId);
    }

    const template = (await response.json()) as TemplateDefinition;
    return isTemplateVisible(template) ? template : null;
  } catch {
    const template = getTemplateDefinitionById(templateId);
    return template && isTemplateVisible(template) ? template : null;
  }
}
