import { Prisma, TemplateStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { isUuid } from '../lib/isUuid';

export type TemplateCategory = 'wedding' | 'birthday' | 'funeral' | 'party' | 'message';
export type TemplateStyle = 'korean' | 'japanese' | 'western' | 'traditional' | 'modern';
export type TemplateMarketplaceType = 'SYSTEM' | 'CREATOR';
export type TemplateFieldType = 'text' | 'textarea' | 'date' | 'datetime' | 'number' | 'select';
export type VisibleTemplateSort = 'newest' | 'popular' | 'trending';

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
  title: string;
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
  status: TemplateStatus;
  studioConfig?: Prisma.JsonValue | null;
  thumbnailUrl?: string | null;
  previewThumbnailUrl?: string | null;
  sourceSubmissionId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  cloneCount?: number;
  trendingScore?: number;
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
  status?: TemplateStatus;
  studioConfig?: Prisma.InputJsonValue;
  thumbnailUrl?: string;
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

function isUuidLike(value: string): boolean {
  return isUuid(value);
}

function normalizeCreatorId(value?: string): string | null {
  const normalized = normalizeText(value || '');
  if (!normalized) {
    return null;
  }
  if (!isUuidLike(normalized)) {
    throw new Error('INVALID_CREATOR_ID');
  }
  return normalized;
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
    status: TemplateStatus;
    studioConfig?: Prisma.JsonValue | null;
    thumbnailUrl?: string | null;
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
    title: row.name,
    name: row.name,
    category: row.category as TemplateCategory,
    style: row.style as TemplateStyle,
    description: row.description,
    price: row.price,
    creatorShare: row.creatorShare,
    creatorId: row.creatorId ?? undefined,
    creatorName: null,
    creatorDisplayId: row.creatorId ?? null,
    component: row.component,
    templateKey: row.templateKey,
    publicTemplateKey: row.slug,
    marketplaceType: (row.marketplaceType as TemplateMarketplaceType) || 'SYSTEM',
    status: row.status,
    studioConfig: row.studioConfig ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
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

type CreatorProfile = {
  id: string;
  nickname: string | null;
  email: string | null;
};

function resolveCreatorName(profile?: CreatorProfile): string {
  if (!profile) {
    return 'Unknown Creator';
  }
  const nickname = profile.nickname?.trim();
  if (nickname) {
    return nickname;
  }
  const emailPrefix = profile.email?.split('@')[0]?.trim();
  return emailPrefix || 'Unknown Creator';
}

async function withCreatorMetadata(templates: TemplateDefinition[]): Promise<TemplateDefinition[]> {
  if (templates.length === 0) {
    return templates;
  }

  const creatorIds = Array.from(
    new Set(
      templates
        .map((template) => template.creatorId)
        .filter((creatorId): creatorId is string => Boolean(creatorId))
    )
  );

  if (creatorIds.length === 0) {
    return templates.map((template) => ({
      ...template,
      creatorName: 'Global Invitation',
      creatorDisplayId: 'system',
    }));
  }

  const creatorMap = new Map<string, CreatorProfile>();
  await Promise.all(
    creatorIds.map(async (creatorId) => {
      let creator: CreatorProfile | null = null;

      try {
        if (creatorId && isUuid(creatorId)) {
          creator = await prisma.user.findUnique({
            where: { id: creatorId },
            select: {
              id: true,
              nickname: true,
              email: true,
            },
          });
        }
      } catch (err) {
        console.error('Creator lookup failed:', err);
      }

      if (creator) {
        creatorMap.set(creator.id, creator);
      }
    })
  );

  return templates.map((template) => {
    if (!template.creatorId) {
      return {
        ...template,
        creatorName: 'Global Invitation',
        creatorDisplayId: 'system',
      };
    }

    const creatorProfile = creatorMap.get(template.creatorId);
    return {
      ...template,
      creatorName: resolveCreatorName(creatorProfile),
      creatorDisplayId: template.creatorId,
    };
  });
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

function logTemplateLookupByUuid(id: string) {
  console.log('Template lookup by uuid:', id);
}

function logTemplateLookupBySlug(slug: string) {
  console.log('Template lookup by slug:', slug);
}

async function findTemplateIdentityByIdentifier(identifier: string): Promise<{ id: string } | null> {
  const normalized = normalizeText(identifier);
  if (!normalized) {
    return null;
  }
  if (isUuidLike(normalized)) {
    logTemplateLookupByUuid(normalized);
    return prisma.template.findUnique({
      where: { id: normalized },
      select: { id: true },
    });
  }
  logTemplateLookupBySlug(normalized);
  return prisma.template.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });
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
  return withCreatorMetadata(rows.map(mapTemplateRecord));
}

export async function listVisibleTemplates(): Promise<TemplateDefinition[]> {
  return listVisibleTemplatesBySort({ sort: 'newest' });
}

export async function listVisibleTemplatesBySort(options?: {
  sort?: VisibleTemplateSort;
}): Promise<TemplateDefinition[]> {
  const sort = options?.sort || 'newest';
  const rows = await prisma.template.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      status: 'PUBLISHED',
    },
    orderBy: { createdAt: 'desc' },
  });
  const mapped = rows.map(mapTemplateRecord);
  if (sort === 'newest') {
    return withCreatorMetadata(mapped);
  }

  const templateIds = mapped.map((template) => template.id);
  if (templateIds.length === 0) {
    return mapped;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [cloneCountsAll, viewCountsAll, cloneCountsRecent, viewCountsRecent] = await Promise.all([
    prisma.templateClone.groupBy({
      by: ['templateId'],
      where: {
        templateId: { in: templateIds },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.templateView.groupBy({
      by: ['templateId'],
      where: {
        templateId: { in: templateIds },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.templateClone.groupBy({
      by: ['templateId'],
      where: {
        templateId: { in: templateIds },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.templateView.groupBy({
      by: ['templateId'],
      where: {
        templateId: { in: templateIds },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const cloneCountMap = new Map(cloneCountsAll.map((row) => [row.templateId, row._count._all]));
  const viewCountMap = new Map(viewCountsAll.map((row) => [row.templateId, row._count._all]));
  const cloneRecentMap = new Map(cloneCountsRecent.map((row) => [row.templateId, row._count._all]));
  const viewRecentMap = new Map(viewCountsRecent.map((row) => [row.templateId, row._count._all]));

  const withStats = mapped.map((template) => {
    const cloneCount = cloneCountMap.get(template.id) || 0;
    const viewCount = viewCountMap.get(template.id) || 0;
    const recentCloneCount = cloneRecentMap.get(template.id) || 0;
    const recentViewCount = viewRecentMap.get(template.id) || 0;
    const trendingScore = recentCloneCount * 3 + recentViewCount;
    return {
      ...template,
      cloneCount,
      viewCount,
      trendingScore,
    };
  });

  withStats.sort((left, right) => {
    if (sort === 'popular') {
      if ((right.cloneCount || 0) !== (left.cloneCount || 0)) {
        return (right.cloneCount || 0) - (left.cloneCount || 0);
      }
      if ((right.viewCount || 0) !== (left.viewCount || 0)) {
        return (right.viewCount || 0) - (left.viewCount || 0);
      }
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    }

    if ((right.trendingScore || 0) !== (left.trendingScore || 0)) {
      return (right.trendingScore || 0) - (left.trendingScore || 0);
    }
    if ((right.cloneCount || 0) !== (left.cloneCount || 0)) {
      return (right.cloneCount || 0) - (left.cloneCount || 0);
    }
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });

  return withCreatorMetadata(withStats);
}

export async function getTemplates(): Promise<TemplateDefinition[]> {
  return listTemplates();
}

async function getTemplateByUuidInternal(id: string) {
  return prisma.template.findUnique({
    where: { id },
    include: {
      fields: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function getTemplateById(id: string): Promise<TemplateDefinition | null> {
  const normalized = normalizeText(id);
  if (!normalized || !isUuidLike(normalized)) {
    return null;
  }
  logTemplateLookupByUuid(normalized);
  const row = await getTemplateByUuidInternal(normalized);
  if (!row) {
    return null;
  }
  const [resolved] = await withCreatorMetadata([mapTemplateRecord(row)]);
  return resolved || null;
}

export async function getTemplateBySlug(slug: string): Promise<TemplateDefinition | null> {
  const normalized = normalizeText(slug);
  if (!normalized) {
    return null;
  }
  logTemplateLookupBySlug(normalized);
  const row = await prisma.template.findUnique({
    where: { slug: normalized },
    include: {
      fields: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
  if (!row) {
    return null;
  }
  const [resolved] = await withCreatorMetadata([mapTemplateRecord(row)]);
  return resolved || null;
}

export async function getTemplateByIdentifier(identifier: string): Promise<TemplateDefinition | null> {
  const normalized = normalizeText(identifier);
  if (!normalized) {
    return null;
  }
  if (isUuidLike(normalized)) {
    return getTemplateById(normalized);
  }
  return getTemplateBySlug(normalized);
}

async function getTemplateFieldsByTemplateId(templateId: string): Promise<TemplateFieldDefinition[]> {
  if (!templateId) {
    return [];
  }
  const fields = await prisma.templateField.findMany({
    where: { templateId },
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

export async function getTemplateFieldsByIdentifier(identifier: string): Promise<TemplateFieldDefinition[]> {
  const templateIdentity = await findTemplateIdentityByIdentifier(identifier);
  if (!templateIdentity) {
    return [];
  }
  return getTemplateFieldsByTemplateId(templateIdentity.id);
}

export async function getTemplateFields(identifier: string): Promise<TemplateFieldDefinition[]> {
  return getTemplateFieldsByIdentifier(identifier);
}

export async function createTemplate(input: TemplateCreateInput): Promise<TemplateDefinition> {
  const creatorId = normalizeCreatorId(input.creatorId || undefined);
  const slug = await createUniqueSlug(`${input.category}-${input.style}-${input.name}`);
  const normalizedThumbnail =
    normalizeText(input.thumbnailUrl || '') || normalizeText(input.previewThumbnailUrl || '') || null;
  const row = await prisma.template.create({
    data: {
      slug,
      name: normalizeText(input.name),
      category: input.category,
      style: input.style,
      description: normalizeText(input.description),
      price: normalizeInteger(Number(input.price) || 0),
      creatorShare: clampNumber(Number(input.creatorShare) || 0, 0, 100),
      creatorId,
      component: normalizeText(input.component),
      templateKey: normalizeText(input.templateKey) || 'wedding_classic',
      marketplaceType: normalizeMarketplaceType(creatorId || undefined),
      status: input.status || 'PUBLISHED',
      studioConfig: input.studioConfig === undefined ? undefined : input.studioConfig,
      thumbnailUrl: normalizedThumbnail,
      previewThumbnailUrl: normalizedThumbnail,
      sourceSubmissionId: normalizeText(input.sourceSubmissionId || '') || null,
      isActive: true,
      isDeleted: false,
    },
  });
  await createTemplateVersion({
    templateId: row.id,
    templateKey: row.templateKey,
    name: row.name,
    style: row.style,
    description: row.description,
    price: row.price,
    creatorShare: row.creatorShare,
    studioConfig: row.studioConfig as Prisma.InputJsonValue | null,
    thumbnailUrl: row.thumbnailUrl,
  });
  return mapTemplateRecord(row);
}

export async function updateTemplate(
  identifier: string,
  input: TemplateUpdateInput
): Promise<TemplateDefinition | null> {
  const existing = await findTemplateIdentityByIdentifier(identifier);

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
    const creatorId = normalizeCreatorId(input.creatorId || undefined);
    payload.creatorId = creatorId;
    payload.marketplaceType = normalizeMarketplaceType(creatorId || undefined);
  }
  if (input.component !== undefined) {
    payload.component = normalizeText(input.component);
  }
  if (input.templateKey !== undefined) {
    payload.templateKey = normalizeText(input.templateKey) || 'wedding_classic';
  }
  if (input.status !== undefined) {
    payload.status = input.status;
  }
  if (input.studioConfig !== undefined) {
    payload.studioConfig = input.studioConfig;
  }
  if (input.thumbnailUrl !== undefined || input.previewThumbnailUrl !== undefined) {
    const nextThumbnail =
      normalizeText(input.thumbnailUrl || '') || normalizeText(input.previewThumbnailUrl || '') || null;
    payload.thumbnailUrl = nextThumbnail;
    payload.previewThumbnailUrl = nextThumbnail;
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

  const shouldCreateVersion =
    input.name !== undefined ||
    input.style !== undefined ||
    input.description !== undefined ||
    input.price !== undefined ||
    input.creatorShare !== undefined ||
    input.templateKey !== undefined ||
    input.studioConfig !== undefined ||
    input.previewThumbnailUrl !== undefined;

  if (shouldCreateVersion) {
    await createTemplateVersion({
      templateId: row.id,
      templateKey: row.templateKey,
      name: row.name,
      style: row.style,
      description: row.description,
      price: row.price,
      creatorShare: row.creatorShare,
      studioConfig: row.studioConfig as Prisma.InputJsonValue | null,
      thumbnailUrl: row.thumbnailUrl,
    });
  }

  return mapTemplateRecord(row);
}

type TemplateVersionInput = {
  templateId: string;
  templateKey: string;
  name: string;
  style: string;
  description: string;
  price: number;
  creatorShare: number;
  studioConfig?: Prisma.InputJsonValue | null;
  thumbnailUrl?: string | null;
};

export async function createTemplateVersion(input: TemplateVersionInput) {
  const lastVersion = await prisma.templateVersion.findFirst({
    where: {
      templateId: input.templateId,
    },
    orderBy: {
      versionNumber: 'desc',
    },
    select: {
      versionNumber: true,
    },
  });
  const versionNumber = (lastVersion?.versionNumber || 0) + 1;
  return prisma.templateVersion.create({
    data: {
      templateId: input.templateId,
      versionNumber,
      templateKey: input.templateKey,
      name: input.name,
      style: input.style,
      description: input.description,
      price: input.price,
      creatorShare: input.creatorShare,
      studioConfig:
        input.studioConfig === undefined
          ? undefined
          : input.studioConfig === null
            ? Prisma.JsonNull
            : input.studioConfig,
      thumbnailUrl: input.thumbnailUrl || null,
    },
  });
}

export async function getLatestTemplateVersion(templateId: string) {
  return prisma.templateVersion.findFirst({
    where: {
      templateId,
    },
    orderBy: {
      versionNumber: 'desc',
    },
  });
}

export async function recordTemplateView(input: {
  templateId: string;
  viewerUserId?: string | null;
  viewerGuestToken?: string | null;
  sessionId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
}) {
  return prisma.templateView.create({
    data: {
      templateId: input.templateId,
      viewerUserId: input.viewerUserId || null,
      viewerGuestToken: input.viewerGuestToken || null,
      sessionId: input.sessionId || null,
      referrer: input.referrer || null,
      userAgent: input.userAgent || null,
    },
  });
}

export async function recordTemplateClone(input: {
  templateId: string;
  templateVersionId?: string | null;
  templateUsageId?: string | null;
  invitationId: string;
  clonedByUserId?: string | null;
  clonedByGuestToken?: string | null;
}) {
  return prisma.templateClone.create({
    data: {
      templateId: input.templateId,
      templateVersionId: input.templateVersionId || null,
      templateUsageId: input.templateUsageId || null,
      invitationId: input.invitationId,
      clonedByUserId: input.clonedByUserId || null,
      clonedByGuestToken: input.clonedByGuestToken || null,
    },
  });
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
