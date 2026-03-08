import path from 'path';
import { promises as fs } from 'fs';

export type TemplateCategory = 'wedding' | 'birthday' | 'funeral' | 'party';
export type TemplateStyle = 'korean' | 'japanese' | 'western' | 'traditional' | 'modern';
export type TemplateMarketplaceType = 'SYSTEM' | 'CREATOR';

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

export type TemplateCreateInput = {
  name: string;
  category: TemplateCategory;
  style: TemplateStyle;
  description: string;
  price: number;
  creatorShare: number;
  creatorId?: string;
  component: string;
  templateKey: string;
};

export type TemplateUpdateInput = Partial<TemplateCreateInput> & {
  isActive?: boolean;
  isDeleted?: boolean;
};

const DATA_DIRECTORY = path.resolve(__dirname, '../../data');
const TEMPLATE_REGISTRY_FILE = path.join(DATA_DIRECTORY, 'template-registry.json');

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

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value: string): string {
  return value.trim();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeTemplateRecord(record: TemplateDefinition): TemplateDefinition {
  const creatorId = normalizeText(record.creatorId || '');
  const marketplaceType: TemplateMarketplaceType = creatorId ? 'CREATOR' : 'SYSTEM';

  return {
    ...record,
    id: normalizeText(record.id),
    name: normalizeText(record.name),
    category: record.category,
    style: record.style,
    description: normalizeText(record.description),
    price: Number(record.price) || 0,
    creatorShare: clampNumber(Number(record.creatorShare) || 0, 0, 100),
    creatorId: creatorId || undefined,
    component: normalizeText(record.component),
    templateKey: normalizeText(record.templateKey) || 'wedding_classic',
    marketplaceType,
    isActive: Boolean(record.isActive),
    isDeleted: Boolean(record.isDeleted),
    createdAt: record.createdAt,
  };
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  try {
    await fs.access(TEMPLATE_REGISTRY_FILE);
  } catch {
    await fs.writeFile(
      TEMPLATE_REGISTRY_FILE,
      JSON.stringify(DEFAULT_TEMPLATE_REGISTRY, null, 2),
      'utf8'
    );
  }
}

async function readRegistry(): Promise<TemplateDefinition[]> {
  await ensureStoreFile();
  const raw = await fs.readFile(TEMPLATE_REGISTRY_FILE, 'utf8');
  const parsed = JSON.parse(raw) as TemplateDefinition[];
  return parsed.map(normalizeTemplateRecord);
}

async function writeRegistry(definitions: TemplateDefinition[]): Promise<void> {
  const normalized = definitions.map(normalizeTemplateRecord);
  await fs.writeFile(TEMPLATE_REGISTRY_FILE, JSON.stringify(normalized, null, 2), 'utf8');
}

function createTemplateId(input: TemplateCreateInput): string {
  const base = slugify(`${input.category}-${input.style}-${input.name}`);
  const fallback = `template-${Date.now()}`;
  return base || fallback;
}

export function calculateRevenue(price: number, creatorShare: number) {
  const normalizedPrice = Number(price) || 0;
  const normalizedShare = clampNumber(Number(creatorShare) || 0, 0, 100);
  const creatorEarnings = Number(((normalizedPrice * normalizedShare) / 100).toFixed(2));
  const platformEarnings = Number((normalizedPrice - creatorEarnings).toFixed(2));

  return {
    price: normalizedPrice,
    creatorShare: normalizedShare,
    creatorEarnings,
    platformEarnings,
  };
}

export async function listTemplates(): Promise<TemplateDefinition[]> {
  const definitions = await readRegistry();
  return definitions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listVisibleTemplates(): Promise<TemplateDefinition[]> {
  const definitions = await listTemplates();
  return definitions.filter((definition) => definition.isActive && !definition.isDeleted);
}

export async function getTemplateById(id: string): Promise<TemplateDefinition | null> {
  const definitions = await listTemplates();
  return definitions.find((definition) => definition.id === id) ?? null;
}

export async function createTemplate(input: TemplateCreateInput): Promise<TemplateDefinition> {
  const definitions = await listTemplates();
  const createdAt = new Date().toISOString();
  const id = createTemplateId(input);

  if (definitions.some((definition) => definition.id === id)) {
    throw new Error('Template id already exists');
  }

  const record = normalizeTemplateRecord({
    id,
    name: input.name,
    category: input.category,
    style: input.style,
    description: input.description,
    price: input.price,
    creatorShare: input.creatorShare,
    creatorId: input.creatorId,
    component: input.component,
    templateKey: input.templateKey,
    marketplaceType: input.creatorId?.trim() ? 'CREATOR' : 'SYSTEM',
    isActive: true,
    isDeleted: false,
    createdAt,
  });

  definitions.push(record);
  await writeRegistry(definitions);
  return record;
}

export async function updateTemplate(id: string, input: TemplateUpdateInput): Promise<TemplateDefinition | null> {
  const definitions = await listTemplates();
  const targetIndex = definitions.findIndex((definition) => definition.id === id);
  if (targetIndex < 0) {
    return null;
  }

  const current = definitions[targetIndex];
  const updated = normalizeTemplateRecord({
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
  });

  definitions[targetIndex] = updated;
  await writeRegistry(definitions);
  return updated;
}

export async function disableTemplate(id: string): Promise<TemplateDefinition | null> {
  return updateTemplate(id, { isActive: false });
}

export async function softDeleteTemplate(id: string): Promise<TemplateDefinition | null> {
  return updateTemplate(id, { isDeleted: true, isActive: false });
}

export async function getTemplateStoreSummary() {
  const definitions = await listTemplates();
  const activeTemplates = definitions.filter((definition) => definition.isActive && !definition.isDeleted);

  const revenueSummary = activeTemplates.reduce(
    (summary, definition) => {
      const revenue = calculateRevenue(definition.price, definition.creatorShare);
      return {
        totalTemplatePrice: Number((summary.totalTemplatePrice + revenue.price).toFixed(2)),
        totalCreatorEarnings: Number(
          (summary.totalCreatorEarnings + revenue.creatorEarnings).toFixed(2)
        ),
        totalPlatformEarnings: Number(
          (summary.totalPlatformEarnings + revenue.platformEarnings).toFixed(2)
        ),
      };
    },
    {
      totalTemplatePrice: 0,
      totalCreatorEarnings: 0,
      totalPlatformEarnings: 0,
    }
  );

  return {
    totalTemplates: definitions.length,
    activeTemplates: activeTemplates.length,
    creatorTemplates: definitions.filter((definition) => definition.marketplaceType === 'CREATOR').length,
    systemTemplates: definitions.filter((definition) => definition.marketplaceType === 'SYSTEM').length,
    revenueSummary,
  };
}
