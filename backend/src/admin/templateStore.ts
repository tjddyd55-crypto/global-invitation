import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export type TemplateCategory = 'wedding' | 'birthday' | 'funeral' | 'party' | 'message';
export type TemplateStyle = 'korean' | 'japanese' | 'western' | 'traditional' | 'modern';
export type TemplateMarketplaceType = 'SYSTEM' | 'CREATOR';
export type TemplateFieldType = 'text' | 'textarea' | 'date' | 'datetime' | 'number' | 'select';

export interface TemplateFieldDefinition {
  id: string;
  templateId: string;
  fieldName: string;
  fieldType: TemplateFieldType;
  label: string;
  placeholder: string;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TemplateDefinition {
  id: string;
  slug: string;
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
  studioConfig?: Prisma.JsonValue | null;
  previewThumbnailUrl?: string | null;
  sourceSubmissionId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  fields?: TemplateFieldDefinition[];
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
  studioConfig?: Prisma.InputJsonValue;
  previewThumbnailUrl?: string;
  sourceSubmissionId?: string;
};

export type TemplateUpdateInput = Partial<TemplateCreateInput> & {
  isActive?: boolean;
  isDeleted?: boolean;
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeMarketplaceType(creatorId?: string): TemplateMarketplaceType {
  return creatorId?.trim() ? 'CREATOR' : 'SYSTEM';
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function mapTemplateRecord(
  row: {
    id: string;
    slug: string;
    name: string;
    category: string;
    style: string;
    description: string;
    price: number;
    creatorShare: number;
    creatorId: string | null;
    component: string;
    templateKey: string;
    marketplaceType: string;
    studioConfig?: Prisma.JsonValue | null;
    previewThumbnailUrl?: string | null;
    sourceSubmissionId?: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    fields?: Array<{
      id: string;
      templateId: string;
      fieldName: string;
      fieldType: string;
      label: string;
      placeholder: string;
      isRequired: boolean;
      sortOrder: number;
      createdAt: Date;
    }>;
  }
): TemplateDefinition {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as TemplateCategory,
    style: row.style as TemplateStyle,
    description: row.description,
    price: row.price,
    creatorShare: row.creatorShare,
    creatorId: row.creatorId ?? undefined,
    component: row.component,
    templateKey: row.templateKey,
    marketplaceType: (row.marketplaceType as TemplateMarketplaceType) || 'SYSTEM',
    studioConfig: row.studioConfig ?? null,
    previewThumbnailUrl: row.previewThumbnailUrl ?? null,
    sourceSubmissionId: row.sourceSubmissionId ?? null,
    isActive: row.isActive,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    fields: row.fields?.map((field) => ({
      id: field.id,
      templateId: field.templateId,
      fieldName: field.fieldName,
      fieldType: field.fieldType as TemplateFieldType,
      label: field.label,
      placeholder: field.placeholder,
      isRequired: field.isRequired,
      sortOrder: field.sortOrder,
      createdAt: field.createdAt.toISOString(),
    })),
  };
}

async function createUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName) || `template-${Date.now()}`;
  let attempt = 0;
  while (attempt < 50) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const candidate = `${baseSlug}${suffix}`;
    const existing = await prisma.template.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
    attempt += 1;
  }
  throw new Error('Failed to allocate unique template slug');
}

export function calculateRevenue(price: number, creatorShare: number) {
  const normalizedPrice = normalizeInteger(Number(price) || 0);
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
  const rows = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapTemplateRecord);
}

export async function listVisibleTemplates(): Promise<TemplateDefinition[]> {
  const rows = await prisma.template.findMany({
    where: {
      isActive: true,
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapTemplateRecord);
}

export async function getTemplates(): Promise<TemplateDefinition[]> {
  return listTemplates();
}

export async function getTemplateById(identifier: string): Promise<TemplateDefinition | null> {
  const row = await prisma.template.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: {
      fields: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
  return row ? mapTemplateRecord(row) : null;
}

export async function getTemplateFields(identifier: string): Promise<TemplateFieldDefinition[]> {
  const template = await prisma.template.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    select: { id: true },
  });

  if (!template) {
    return [];
  }

  const fields = await prisma.templateField.findMany({
    where: { templateId: template.id },
    orderBy: { sortOrder: 'asc' },
  });

  return fields.map((field) => ({
    id: field.id,
    templateId: field.templateId,
    fieldName: field.fieldName,
    fieldType: field.fieldType as TemplateFieldType,
    label: field.label,
    placeholder: field.placeholder,
    isRequired: field.isRequired,
    sortOrder: field.sortOrder,
    createdAt: field.createdAt.toISOString(),
  }));
}

export async function createTemplate(input: TemplateCreateInput): Promise<TemplateDefinition> {
  const creatorId = normalizeText(input.creatorId || '');
  const slug = await createUniqueSlug(`${input.category}-${input.style}-${input.name}`);
  const row = await prisma.template.create({
    data: {
      slug,
      name: normalizeText(input.name),
      category: input.category,
      style: input.style,
      description: normalizeText(input.description),
      price: normalizeInteger(Number(input.price) || 0),
      creatorShare: clampNumber(Number(input.creatorShare) || 0, 0, 100),
      creatorId: creatorId || null,
      component: normalizeText(input.component),
      templateKey: normalizeText(input.templateKey) || 'wedding_classic',
      marketplaceType: normalizeMarketplaceType(creatorId),
      studioConfig: input.studioConfig === undefined ? undefined : input.studioConfig,
      previewThumbnailUrl: normalizeText(input.previewThumbnailUrl || '') || null,
      sourceSubmissionId: normalizeText(input.sourceSubmissionId || '') || null,
      isActive: true,
      isDeleted: false,
    },
  });
  return mapTemplateRecord(row);
}

export async function updateTemplate(
  identifier: string,
  input: TemplateUpdateInput
): Promise<TemplateDefinition | null> {
  const existing = await prisma.template.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
  });

  if (!existing) {
    return null;
  }

  const payload: Prisma.TemplateUpdateInput = {};

  if (input.name !== undefined) {
    payload.name = normalizeText(input.name);
  }
  if (input.category !== undefined) {
    payload.category = input.category;
  }
  if (input.style !== undefined) {
    payload.style = input.style;
  }
  if (input.description !== undefined) {
    payload.description = normalizeText(input.description);
  }
  if (input.price !== undefined) {
    payload.price = normalizeInteger(Number(input.price) || 0);
  }
  if (input.creatorShare !== undefined) {
    payload.creatorShare = clampNumber(Number(input.creatorShare) || 0, 0, 100);
  }
  if (input.creatorId !== undefined) {
    const creatorId = normalizeText(input.creatorId || '');
    payload.creatorId = creatorId || null;
    payload.marketplaceType = normalizeMarketplaceType(creatorId);
  }
  if (input.component !== undefined) {
    payload.component = normalizeText(input.component);
  }
  if (input.templateKey !== undefined) {
    payload.templateKey = normalizeText(input.templateKey) || 'wedding_classic';
  }
  if (input.studioConfig !== undefined) {
    payload.studioConfig = input.studioConfig;
  }
  if (input.previewThumbnailUrl !== undefined) {
    payload.previewThumbnailUrl = normalizeText(input.previewThumbnailUrl || '') || null;
  }
  if (input.sourceSubmissionId !== undefined) {
    payload.sourceSubmissionId = normalizeText(input.sourceSubmissionId || '') || null;
  }
  if (input.isActive !== undefined) {
    payload.isActive = Boolean(input.isActive);
  }
  if (input.isDeleted !== undefined) {
    payload.isDeleted = Boolean(input.isDeleted);
  }

  const row = await prisma.template.update({
    where: { id: existing.id },
    data: payload,
  });

  return mapTemplateRecord(row);
}

export async function deleteTemplate(identifier: string): Promise<TemplateDefinition | null> {
  return updateTemplate(identifier, {
    isDeleted: true,
    isActive: false,
  });
}

export async function disableTemplate(identifier: string): Promise<TemplateDefinition | null> {
  return updateTemplate(identifier, { isActive: false });
}

export async function softDeleteTemplate(identifier: string): Promise<TemplateDefinition | null> {
  return deleteTemplate(identifier);
}

export async function getTemplateStoreSummary() {
  const [allTemplates, activeTemplates] = await Promise.all([
    prisma.template.findMany(),
    prisma.template.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
    }),
  ]);

  const revenueSummary = activeTemplates.reduce(
    (summary, definition) => {
      const revenue = calculateRevenue(Number(definition.price), Number(definition.creatorShare));
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
    totalTemplates: allTemplates.length,
    activeTemplates: activeTemplates.length,
    creatorTemplates: allTemplates.filter((definition) => definition.marketplaceType === 'CREATOR').length,
    systemTemplates: allTemplates.filter((definition) => definition.marketplaceType === 'SYSTEM').length,
    revenueSummary,
  };
}
