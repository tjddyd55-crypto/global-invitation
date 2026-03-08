import { buildApiUrl } from '@/src/lib/apiBase';

export type TemplateCategory = 'wedding' | 'birthday' | 'funeral' | 'party';
export type TemplateStyle = 'korean' | 'japanese' | 'western' | 'traditional' | 'modern';
export type TemplateMarketplaceType = 'SYSTEM' | 'CREATOR';
export type TemplateRendererKind = 'weddingClassic';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  style: TemplateStyle;
  description: string;
  price: number;
  creatorShare: number;
  creatorId?: string;
  component: string;
  templateKey: string;
  marketplaceType: TemplateMarketplaceType;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

type ComponentBinding = {
  renderer: TemplateRendererKind;
  supportedTemplateKeys: string[];
};

const COMPONENT_BINDINGS: Record<string, ComponentBinding> = {
  WeddingClassicTemplate: {
    renderer: 'weddingClassic',
    supportedTemplateKeys: ['wedding_classic', 'classic'],
  },
};

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

export function resolveComponentBinding(component: string): ComponentBinding | null {
  return COMPONENT_BINDINGS[component] ?? null;
}

export function isTemplateSupported(template: TemplateDefinition): boolean {
  return Boolean(resolveComponentBinding(template.component));
}

export function isTemplateVisible(template: TemplateDefinition): boolean {
  return template.isActive && !template.isDeleted && isTemplateSupported(template);
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

export function getTemplateDefinitionById(
  templateId: string | null,
  templates: TemplateDefinition[] = getDefaultTemplateRegistry()
): TemplateDefinition | null {
  const normalizedId = normalizeRequestedTemplateId(templateId);
  if (!normalizedId) return null;
  return templates.find((template) => template.id === normalizedId) ?? null;
}

export function resolveTemplateKeyByTemplateId(
  templateId: string | null,
  templates: TemplateDefinition[] = getDefaultTemplateRegistry()
): string | null {
  const template = getTemplateDefinitionById(templateId, templates);
  return template?.templateKey ?? null;
}

export function resolveRendererByTemplateKey(templateKey: string | null): TemplateRendererKind | null {
  if (!templateKey) return null;

  const binding = Object.values(COMPONENT_BINDINGS).find((candidate) =>
    candidate.supportedTemplateKeys.includes(templateKey)
  );
  return binding?.renderer ?? null;
}

export async function fetchVisibleTemplateDefinitions(): Promise<TemplateDefinition[]> {
  try {
    const response = await fetch(buildApiUrl('/api/templates'), {
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
