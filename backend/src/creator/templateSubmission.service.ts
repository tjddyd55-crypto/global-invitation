import { Prisma, TemplateSubmissionStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { copySubmissionPreviewToCanonicalTemplateThumbnail } from '../lib/media/copyCanonicalTemplateThumbnail';
import {
  isActiveCreatorCategory,
  isCreatorTemplateCategory,
  type CreatorTemplateCategory,
  validateSubmissionReadyForReview,
  validateStudioConfigForCategory,
} from './templateSubmission.validation';

const TEMPLATE_STYLES = new Set(['korean', 'japanese', 'western', 'traditional', 'modern']);

const CREATOR_COMPONENT_BY_CATEGORY: Record<'wedding' | 'funeral' | 'message', string> = {
  wedding: 'CreatorWeddingTemplate',
  funeral: 'CreatorFuneralTemplate',
  message: 'CreatorMessageTemplate',
};

type SubmissionWithRelations = {
  id: string;
  creatorId: string;
  category: string;
  templateKeyCandidate: string;
  name: string;
  description: string;
  style: string;
  price: number;
  creatorShare: number;
  status: TemplateSubmissionStatus;
  studioConfig: Prisma.JsonValue | null;
  previewThumbnailUrl: string | null;
  parentSubmissionId: string | null;
  revisionNumber: number;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  approvedTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator?: { id: string; email: string | null } | null;
  approvedTemplate?: { id: string; slug: string; templateKey: string; isActive: boolean } | null;
};

export type TemplateSubmissionDto = {
  id: string;
  creatorId: string;
  category: string;
  templateKeyCandidate: string;
  name: string;
  description: string;
  style: string;
  price: number;
  creatorShare: number;
  status: TemplateSubmissionStatus;
  studioConfig: Prisma.JsonValue | null;
  previewThumbnailUrl: string | null;
  parentSubmissionId: string | null;
  revisionNumber: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  approvedTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; email: string | null } | null;
  approvedTemplate?: { id: string; slug: string; templateKey: string; isActive: boolean } | null;
};

export type CreatorDashboardSummary = {
  totalTemplates: number;
  publishedTemplates: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  usageCount: number;
  viewCount: number;
  cloneCount: number;
  revenueTotal: number;
  revenuePlaceholder: number;
  payoutSummary: {
    totalPaid: number;
    totalPending: number;
    payoutCount: number;
    lastPaidAt: string | null;
  };
  templateRevenueStats: Array<{
    templateId: string;
    templateName: string;
    templateSlug: string;
    templateStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
    usageCount: number;
    viewCount: number;
    cloneCount: number;
    revenueTotal: number;
    lastUsedAt: string | null;
  }>;
  recentUsages: Array<{
    usageId: string;
    templateId: string;
    templateName: string;
    invitationId: string;
    invitationSlug: string;
    usedAt: string;
    usedBy: 'USER' | 'GUEST';
    priceSnapshot: number;
    creatorRevenue: number;
  }>;
  updatedAt: string;
};

export type CreateTemplateSubmissionInput = {
  category: string;
  parentSubmissionId?: string;
  templateKeyCandidate?: string;
  name?: string;
  description?: string;
  style?: string;
  price?: number;
  previewThumbnailUrl?: string;
  studioConfig?: Prisma.InputJsonValue;
};

export type UpdateTemplateSubmissionInput = {
  templateKeyCandidate?: string;
  name?: string;
  description?: string;
  style?: string;
  price?: number;
  previewThumbnailUrl?: string;
  studioConfig?: Prisma.InputJsonValue;
};

export type ApproveSubmissionInput = {
  reviewNote?: string;
  creatorShare?: number;
};

export type RejectSubmissionInput = {
  reviewNote?: string;
};

export class TemplateSubmissionError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeInteger(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
}

function normalizeStyle(value: unknown): string {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return 'modern';
  return TEMPLATE_STYLES.has(normalized) ? normalized : 'modern';
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function sanitizeTemplateKeyCandidate(value: unknown, fallback: string): string {
  const raw = normalizeText(value) || fallback;
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 64);
  return normalized || 'creator_template';
}

function isSubmissionKeyDuplicateError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function toDto(row: SubmissionWithRelations): TemplateSubmissionDto {
  return {
    id: row.id,
    creatorId: row.creatorId,
    category: row.category,
    templateKeyCandidate: row.templateKeyCandidate,
    name: row.name,
    description: row.description,
    style: row.style,
    price: row.price,
    creatorShare: row.creatorShare,
    status: row.status,
    studioConfig: row.studioConfig,
    previewThumbnailUrl: row.previewThumbnailUrl,
    parentSubmissionId: row.parentSubmissionId,
    revisionNumber: row.revisionNumber,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    reviewNote: row.reviewNote,
    approvedTemplateId: row.approvedTemplateId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    creator: row.creator ?? null,
    approvedTemplate: row.approvedTemplate ?? null,
  };
}

function assertSubmissionEditable(status: TemplateSubmissionStatus) {
  if (status === 'APPROVED') {
    throw new TemplateSubmissionError(409, 'APPROVED_SUBMISSION_IMMUTABLE');
  }
  if (status === 'SUBMITTED') {
    throw new TemplateSubmissionError(409, 'SUBMITTED_SUBMISSION_LOCKED');
  }
}

async function findCreatorSubmissionOrThrow(creatorId: string, submissionId: string) {
  const submission = await prisma.templateSubmission.findFirst({
    where: {
      id: submissionId,
      creatorId,
    },
    include: {
      approvedTemplate: {
        select: { id: true, slug: true, templateKey: true, isActive: true },
      },
    },
  });
  if (!submission) {
    throw new TemplateSubmissionError(404, 'TEMPLATE_SUBMISSION_NOT_FOUND');
  }
  return submission;
}

async function createUniqueTemplateSlug(
  client: Prisma.TransactionClient | typeof prisma,
  baseName: string
): Promise<string> {
  const baseSlug = slugify(baseName) || `creator-template-${Date.now()}`;
  let attempt = 0;
  while (attempt < 100) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existing = await client.template.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    attempt += 1;
  }
  throw new TemplateSubmissionError(500, 'FAILED_TO_ALLOCATE_TEMPLATE_SLUG');
}

async function createUniqueTemplateKey(
  client: Prisma.TransactionClient | typeof prisma,
  category: 'wedding' | 'funeral' | 'message',
  templateKeyCandidate: string,
  revisionNumber: number
): Promise<string> {
  const keyPrefix = `creator_${category}_`;
  const base = `${keyPrefix}${sanitizeTemplateKeyCandidate(templateKeyCandidate, 'template')}`;
  const revisionSuffix = revisionNumber > 1 ? `_r${revisionNumber}` : '';
  const seed = `${base}${revisionSuffix}`;

  let attempt = 0;
  while (attempt < 100) {
    const candidate = attempt === 0 ? seed : `${seed}_${attempt + 1}`;
    const existing = await client.template.findFirst({
      where: { templateKey: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    attempt += 1;
  }

  throw new TemplateSubmissionError(500, 'FAILED_TO_ALLOCATE_TEMPLATE_KEY');
}

function appendTemplateCandidateSuffix(baseCandidate: string, suffixIndex: number): string {
  if (suffixIndex <= 1) {
    return baseCandidate;
  }
  const suffix = `_${suffixIndex}`;
  const maxBaseLength = Math.max(1, 64 - suffix.length);
  return `${baseCandidate.slice(0, maxBaseLength)}${suffix}`;
}

async function createUniqueSubmissionKeyCandidate(
  client: Prisma.TransactionClient | typeof prisma,
  creatorId: string,
  baseCandidate: string,
  revisionNumber: number,
  excludeSubmissionId?: string
): Promise<string> {
  const normalizedBase = sanitizeTemplateKeyCandidate(baseCandidate, 'creator_template');
  for (let attempt = 1; attempt <= 200; attempt += 1) {
    const candidate = appendTemplateCandidateSuffix(normalizedBase, attempt);
    const duplicated = await client.templateSubmission.findFirst({
      where: {
        creatorId,
        templateKeyCandidate: candidate,
        revisionNumber,
        ...(excludeSubmissionId ? { id: { not: excludeSubmissionId } } : {}),
      },
      select: {
        id: true,
      },
    });
    if (!duplicated) {
      return candidate;
    }
  }
  throw new TemplateSubmissionError(500, 'FAILED_TO_ALLOCATE_SUBMISSION_KEY_CANDIDATE');
}

function resolveCreatorComponent(category: string): string {
  if (!isActiveCreatorCategory(category)) {
    throw new TemplateSubmissionError(400, 'UNSUPPORTED_CREATOR_CATEGORY');
  }
  return CREATOR_COMPONENT_BY_CATEGORY[category];
}

export async function listCreatorTemplateSubmissions(creatorId: string): Promise<TemplateSubmissionDto[]> {
  const rows = await prisma.templateSubmission.findMany({
    where: { creatorId },
    include: {
      approvedTemplate: {
        select: { id: true, slug: true, templateKey: true, isActive: true },
      },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });
  return rows.map((row) => toDto(row as SubmissionWithRelations));
}

export async function getCreatorTemplateSubmissionById(
  creatorId: string,
  submissionId: string
): Promise<TemplateSubmissionDto> {
  const submission = await findCreatorSubmissionOrThrow(creatorId, submissionId);
  return toDto(submission as SubmissionWithRelations);
}

export async function createTemplateSubmissionDraft(
  creatorId: string,
  input: CreateTemplateSubmissionInput
): Promise<TemplateSubmissionDto> {
  const categoryText = normalizeText(input.category).toLowerCase();
  if (!isCreatorTemplateCategory(categoryText)) {
    throw new TemplateSubmissionError(400, 'INVALID_CATEGORY');
  }
  if (!isActiveCreatorCategory(categoryText)) {
    throw new TemplateSubmissionError(400, 'PLANNED_CATEGORY_SUBMISSION_NOT_ALLOWED');
  }

  let parentSubmission:
    | {
        id: string;
        category: string;
        templateKeyCandidate: string;
        name: string;
        description: string;
        style: string;
        price: number;
        creatorShare: number;
        studioConfig: Prisma.JsonValue | null;
        previewThumbnailUrl: string | null;
        revisionNumber: number;
      }
    | null = null;

  if (input.parentSubmissionId) {
    parentSubmission = await prisma.templateSubmission.findFirst({
      where: {
        id: input.parentSubmissionId,
        creatorId,
      },
      select: {
        id: true,
        category: true,
        templateKeyCandidate: true,
        name: true,
        description: true,
        style: true,
        price: true,
        creatorShare: true,
        studioConfig: true,
        previewThumbnailUrl: true,
        revisionNumber: true,
      },
    });

    if (!parentSubmission) {
      throw new TemplateSubmissionError(404, 'PARENT_SUBMISSION_NOT_FOUND');
    }
    if (parentSubmission.category !== categoryText) {
      throw new TemplateSubmissionError(400, 'PARENT_CATEGORY_MISMATCH');
    }
  }

  const templateKeyCandidateBase = sanitizeTemplateKeyCandidate(
    input.templateKeyCandidate,
    parentSubmission?.templateKeyCandidate ?? input.name ?? 'creator_template'
  );
  const revisionNumber = parentSubmission ? parentSubmission.revisionNumber + 1 : 1;
  const templateKeyCandidate = await createUniqueSubmissionKeyCandidate(
    prisma,
    creatorId,
    templateKeyCandidateBase,
    revisionNumber
  );

  const studioConfigInput =
    input.studioConfig !== undefined
      ? input.studioConfig
      : (parentSubmission?.studioConfig as Prisma.InputJsonValue | undefined);
  let normalizedStudioConfig: Prisma.InputJsonValue | undefined;
  if (studioConfigInput !== undefined) {
    const validation = validateStudioConfigForCategory(categoryText, studioConfigInput);
    if (!validation.ok) {
      throw new TemplateSubmissionError(400, 'INVALID_STUDIO_CONFIG', validation.errors.join('; '));
    }
    normalizedStudioConfig = validation.normalized as Prisma.InputJsonValue;
  }

  let row: Awaited<ReturnType<typeof prisma.templateSubmission.create>> | null = null;
  let nextCandidate = templateKeyCandidate;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      row = await prisma.templateSubmission.create({
        data: {
          creatorId,
          category: categoryText,
          templateKeyCandidate: nextCandidate,
          name: normalizeText(input.name) || parentSubmission?.name || 'Untitled Creator Template',
          description: normalizeText(input.description) || parentSubmission?.description || '',
          style: normalizeStyle(input.style || parentSubmission?.style),
          price: normalizeInteger(input.price ?? parentSubmission?.price ?? 0),
          creatorShare: clampNumber(Number(parentSubmission?.creatorShare ?? 0), 0, 100),
          status: 'DRAFT',
          studioConfig: normalizedStudioConfig === undefined ? undefined : normalizedStudioConfig,
          previewThumbnailUrl:
            normalizeText(input.previewThumbnailUrl) || parentSubmission?.previewThumbnailUrl || null,
          parentSubmissionId: parentSubmission?.id ?? null,
          revisionNumber,
          submittedAt: null,
          reviewedAt: null,
          reviewNote: null,
          approvedTemplateId: null,
        },
        include: {
          approvedTemplate: {
            select: { id: true, slug: true, templateKey: true, isActive: true },
          },
        },
      });
      break;
    } catch (error) {
      if (!isSubmissionKeyDuplicateError(error)) {
        throw error;
      }
      nextCandidate = await createUniqueSubmissionKeyCandidate(
        prisma,
        creatorId,
        templateKeyCandidateBase,
        revisionNumber
      );
    }
  }
  if (!row) {
    throw new TemplateSubmissionError(500, 'FAILED_TO_ALLOCATE_SUBMISSION_KEY_CANDIDATE');
  }

  return toDto(row as SubmissionWithRelations);
}

export async function updateTemplateSubmissionDraft(
  creatorId: string,
  submissionId: string,
  input: UpdateTemplateSubmissionInput
): Promise<TemplateSubmissionDto> {
  const submission = await findCreatorSubmissionOrThrow(creatorId, submissionId);
  assertSubmissionEditable(submission.status);

  const payload: Prisma.TemplateSubmissionUpdateInput = {};

  if (input.templateKeyCandidate !== undefined) {
    const baseCandidate = sanitizeTemplateKeyCandidate(
      input.templateKeyCandidate,
      submission.templateKeyCandidate
    );
    payload.templateKeyCandidate = await createUniqueSubmissionKeyCandidate(
      prisma,
      creatorId,
      baseCandidate,
      submission.revisionNumber,
      submission.id
    );
  }
  if (input.name !== undefined) {
    payload.name = normalizeText(input.name) || submission.name;
  }
  if (input.description !== undefined) {
    payload.description = normalizeText(input.description);
  }
  if (input.style !== undefined) {
    payload.style = normalizeStyle(input.style);
  }
  if (input.price !== undefined) {
    payload.price = normalizeInteger(input.price);
  }
  if (input.previewThumbnailUrl !== undefined) {
    payload.previewThumbnailUrl = normalizeText(input.previewThumbnailUrl) || null;
  }
  if (input.studioConfig !== undefined) {
    const validation = validateStudioConfigForCategory(submission.category, input.studioConfig);
    if (!validation.ok) {
      throw new TemplateSubmissionError(400, 'INVALID_STUDIO_CONFIG', validation.errors.join('; '));
    }
    payload.studioConfig = validation.normalized as Prisma.InputJsonValue;
  }

  const updated = await prisma.templateSubmission.update({
    where: { id: submission.id },
    data: payload,
    include: {
      approvedTemplate: {
        select: { id: true, slug: true, templateKey: true, isActive: true },
      },
    },
  });

  return toDto(updated as SubmissionWithRelations);
}

export async function submitTemplateSubmission(
  creatorId: string,
  submissionId: string
): Promise<TemplateSubmissionDto> {
  const submission = await findCreatorSubmissionOrThrow(creatorId, submissionId);
  assertSubmissionEditable(submission.status);

  if (!isActiveCreatorCategory(submission.category)) {
    throw new TemplateSubmissionError(400, 'PLANNED_CATEGORY_SUBMISSION_NOT_ALLOWED');
  }
  const validation = validateSubmissionReadyForReview({
    category: submission.category,
    studioConfig: submission.studioConfig,
    previewThumbnailUrl: submission.previewThumbnailUrl,
  });
  if (!validation.ok) {
    const code = validation.errors.includes('PREVIEW_THUMBNAIL_REQUIRED')
      ? 'PREVIEW_THUMBNAIL_REQUIRED'
      : 'INVALID_STUDIO_CONFIG';
    throw new TemplateSubmissionError(400, code, validation.errors.join('; '));
  }

  const updated = await prisma.$transaction(async (tx) => {
    return tx.templateSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewNote: null,
      },
      include: {
        approvedTemplate: {
          select: { id: true, slug: true, templateKey: true, isActive: true },
        },
      },
    });
  });

  return toDto(updated as SubmissionWithRelations);
}

export async function getCreatorDashboardSummary(creatorId: string): Promise<CreatorDashboardSummary> {
  const [statusCounts, creatorTemplates, revenueSummary, paidPayoutSummary] = await Promise.all([
    prisma.templateSubmission.groupBy({
      by: ['status'],
      where: { creatorId },
      _count: { _all: true },
    }),
    prisma.template.findMany({
      where: {
        creatorId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.templateRevenue.aggregate({
      where: {
        creatorId,
      },
      _sum: {
        creatorRevenue: true,
      },
    }),
    prisma.creatorPayout.aggregate({
      where: {
        creatorId,
        status: 'PAID',
      },
      _sum: {
        totalRevenue: true,
      },
      _count: {
        _all: true,
      },
      _max: {
        paidAt: true,
      },
    }),
  ]);

  const templateIds = creatorTemplates.map((template) => template.id);
  let usageCount = 0;
  let viewCount = 0;
  let cloneCount = 0;
  let usageGroupByTemplate: Array<{
    templateId: string;
    usageCount: number;
    lastUsedAt: string | null;
  }> = [];
  let viewGroupByTemplate: Array<{ templateId: string; viewCount: number }> = [];
  let cloneGroupByTemplate: Array<{ templateId: string; cloneCount: number }> = [];
  let revenueGroupByTemplate: Array<{ templateId: string; revenueTotal: number }> = [];
  let recentUsages: CreatorDashboardSummary['recentUsages'] = [];

  if (templateIds.length > 0) {
    const [
      usageCountResult,
      viewCountResult,
      cloneCountResult,
      usageGroupRows,
      viewGroupRows,
      cloneGroupRows,
      revenueGroupRows,
      recentUsageRows,
    ] = await Promise.all([
      prisma.templateUsage.count({
        where: {
          templateId: {
            in: templateIds,
          },
        },
      }),
      prisma.templateView.count({
        where: {
          templateId: {
            in: templateIds,
          },
        },
      }),
      prisma.templateClone.count({
        where: {
          templateId: {
            in: templateIds,
          },
        },
      }),
      prisma.templateUsage.groupBy({
        by: ['templateId'],
        where: {
          templateId: {
            in: templateIds,
          },
        },
        _count: {
          _all: true,
        },
        _max: {
          createdAt: true,
        },
      }),
      prisma.templateView.groupBy({
        by: ['templateId'],
        where: {
          templateId: {
            in: templateIds,
          },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.templateClone.groupBy({
        by: ['templateId'],
        where: {
          templateId: {
            in: templateIds,
          },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.templateRevenue.groupBy({
        by: ['templateId'],
        where: {
          templateId: {
            in: templateIds,
          },
          creatorId,
        },
        _sum: {
          creatorRevenue: true,
        },
      }),
      prisma.templateUsage.findMany({
        where: {
          templateId: {
            in: templateIds,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          templateId: true,
          invitationId: true,
          usedByUserId: true,
          usedByGuestToken: true,
          priceSnapshot: true,
          createdAt: true,
          template: {
            select: {
              name: true,
            },
          },
          invitation: {
            select: {
              slug: true,
            },
          },
          revenue: {
            select: {
              creatorRevenue: true,
            },
          },
        },
      }),
    ]);

    usageCount = usageCountResult;
    viewCount = viewCountResult;
    cloneCount = cloneCountResult;
    usageGroupByTemplate = usageGroupRows.map((row) => ({
      templateId: row.templateId,
      usageCount: row._count._all,
      lastUsedAt: row._max.createdAt ? row._max.createdAt.toISOString() : null,
    }));
    viewGroupByTemplate = viewGroupRows.map((row) => ({
      templateId: row.templateId,
      viewCount: row._count._all,
    }));
    cloneGroupByTemplate = cloneGroupRows.map((row) => ({
      templateId: row.templateId,
      cloneCount: row._count._all,
    }));
    revenueGroupByTemplate = revenueGroupRows.map((row) => ({
      templateId: row.templateId,
      revenueTotal: Number((row._sum.creatorRevenue || 0).toFixed(2)),
    }));
    recentUsages = recentUsageRows.map((row) => ({
      usageId: row.id,
      templateId: row.templateId,
      templateName: row.template.name,
      invitationId: row.invitationId,
      invitationSlug: row.invitation.slug,
      usedAt: row.createdAt.toISOString(),
      usedBy: row.usedByUserId ? ('USER' as const) : ('GUEST' as const),
      priceSnapshot: row.priceSnapshot,
      creatorRevenue: Number((row.revenue?.creatorRevenue || 0).toFixed(2)),
    }));
  }

  const countByStatus: Record<'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED', number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  statusCounts.forEach((row) => {
    countByStatus[row.status] = row._count._all;
  });

  const revenueTotal = Number((revenueSummary._sum.creatorRevenue || 0).toFixed(2));
  const usageByTemplate = new Map(
    usageGroupByTemplate.map((row) => [
      row.templateId,
      {
        usageCount: row.usageCount,
        lastUsedAt: row.lastUsedAt,
      },
    ])
  );
  const revenueByTemplate = new Map(
    revenueGroupByTemplate.map((row) => [row.templateId, row.revenueTotal])
  );
  const viewByTemplate = new Map(viewGroupByTemplate.map((row) => [row.templateId, row.viewCount]));
  const cloneByTemplate = new Map(
    cloneGroupByTemplate.map((row) => [row.templateId, row.cloneCount])
  );
  const paidPayoutTotal = Number((paidPayoutSummary._sum.totalRevenue || 0).toFixed(2));
  const pendingPayoutTotal = Number(Math.max(0, revenueTotal - paidPayoutTotal).toFixed(2));

  const templateRevenueStats = creatorTemplates
    .map((template) => {
      const usageInfo = usageByTemplate.get(template.id);
      return {
        templateId: template.id,
        templateName: template.name,
        templateSlug: template.slug,
        templateStatus: template.status,
        usageCount: usageInfo?.usageCount || 0,
        viewCount: viewByTemplate.get(template.id) || 0,
        cloneCount: cloneByTemplate.get(template.id) || 0,
        revenueTotal: revenueByTemplate.get(template.id) || 0,
        lastUsedAt: usageInfo?.lastUsedAt || null,
      };
    })
    .sort((left, right) => {
      if (right.revenueTotal !== left.revenueTotal) {
        return right.revenueTotal - left.revenueTotal;
      }
      return right.usageCount - left.usageCount;
    });

  const totalTemplates = creatorTemplates.length;
  const publishedTemplates = creatorTemplates.filter((template) => template.status === 'PUBLISHED').length;

  return {
    totalTemplates,
    publishedTemplates,
    draftCount: countByStatus.DRAFT,
    submittedCount: countByStatus.SUBMITTED,
    approvedCount: countByStatus.APPROVED,
    rejectedCount: countByStatus.REJECTED,
    usageCount,
    viewCount,
    cloneCount,
    revenueTotal,
    revenuePlaceholder: revenueTotal,
    payoutSummary: {
      totalPaid: paidPayoutTotal,
      totalPending: pendingPayoutTotal,
      payoutCount: paidPayoutSummary._count._all,
      lastPaidAt: paidPayoutSummary._max.paidAt
        ? paidPayoutSummary._max.paidAt.toISOString()
        : null,
    },
    templateRevenueStats,
    recentUsages,
    updatedAt: new Date().toISOString(),
  };
}

export async function listAdminTemplateSubmissions(): Promise<TemplateSubmissionDto[]> {
  const rows = await prisma.templateSubmission.findMany({
    include: {
      creator: {
        select: {
          id: true,
          email: true,
        },
      },
      approvedTemplate: {
        select: { id: true, slug: true, templateKey: true, isActive: true },
      },
    },
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
  });

  return rows.map((row) => toDto(row as SubmissionWithRelations));
}

export async function getAdminTemplateSubmissionById(
  submissionId: string
): Promise<TemplateSubmissionDto> {
  const row = await prisma.templateSubmission.findUnique({
    where: { id: submissionId },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
        },
      },
      approvedTemplate: {
        select: { id: true, slug: true, templateKey: true, isActive: true },
      },
    },
  });
  if (!row) {
    throw new TemplateSubmissionError(404, 'TEMPLATE_SUBMISSION_NOT_FOUND');
  }
  return toDto(row as SubmissionWithRelations);
}

export async function approveTemplateSubmission(
  submissionId: string,
  input: ApproveSubmissionInput
): Promise<TemplateSubmissionDto> {
  const reviewNote = normalizeText(input.reviewNote);
  const explicitCreatorShare =
    input.creatorShare !== undefined ? clampNumber(Number(input.creatorShare) || 0, 0, 100) : undefined;

  const transactionResult = await prisma.$transaction(async (tx) => {
    const submission = await tx.templateSubmission.findUnique({
      where: { id: submissionId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    if (!submission) {
      throw new TemplateSubmissionError(404, 'TEMPLATE_SUBMISSION_NOT_FOUND');
    }
    if (submission.status !== 'SUBMITTED') {
      throw new TemplateSubmissionError(409, 'SUBMISSION_NOT_READY_FOR_APPROVAL');
    }
    if (!isActiveCreatorCategory(submission.category)) {
      throw new TemplateSubmissionError(400, 'UNSUPPORTED_CREATOR_CATEGORY');
    }
    if (!submission.studioConfig) {
      throw new TemplateSubmissionError(400, 'STUDIO_CONFIG_REQUIRED');
    }

    const validation = validateStudioConfigForCategory(submission.category, submission.studioConfig);
    if (!validation.ok) {
      throw new TemplateSubmissionError(400, 'INVALID_STUDIO_CONFIG', validation.errors.join('; '));
    }

    const templateKey = await createUniqueTemplateKey(
      tx,
      submission.category,
      submission.templateKeyCandidate,
      submission.revisionNumber
    );
    const slug = await createUniqueTemplateSlug(
      tx,
      `${submission.category}-${submission.style}-${submission.name || submission.templateKeyCandidate}`
    );
    const component = resolveCreatorComponent(submission.category);
    const creatorShare =
      explicitCreatorShare !== undefined
        ? explicitCreatorShare
        : clampNumber(Number(submission.creatorShare) || 0, 0, 100);

    const template = await tx.template.create({
      data: {
        slug,
        name: submission.name,
        category: submission.category,
        style: submission.style,
        description: submission.description,
        price: normalizeInteger(submission.price),
        creatorShare,
        creatorId: submission.creatorId,
        component,
        templateKey,
        marketplaceType: 'CREATOR',
        status: 'APPROVED',
        studioConfig: validation.normalized as Prisma.InputJsonValue,
        thumbnailUrl: submission.previewThumbnailUrl,
        previewThumbnailUrl: submission.previewThumbnailUrl,
        sourceSubmissionId: submission.id,
        isActive: true,
        isDeleted: false,
      },
    });

    await tx.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        templateKey,
        name: template.name,
        style: template.style,
        description: template.description,
        price: template.price,
        creatorShare: template.creatorShare,
        studioConfig: template.studioConfig === null ? Prisma.JsonNull : template.studioConfig,
        thumbnailUrl: template.thumbnailUrl,
      },
    });

    const updated = await tx.templateSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
        approvedTemplateId: template.id,
        creatorShare,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        approvedTemplate: {
          select: { id: true, slug: true, templateKey: true, isActive: true },
        },
      },
    });

    return {
      dto: toDto(updated as SubmissionWithRelations),
      templateId: template.id,
      previewUrl: submission.previewThumbnailUrl,
    };
  }, {
    maxWait: 10_000,
    timeout: 20_000,
  });

  const canonical = await copySubmissionPreviewToCanonicalTemplateThumbnail(
    transactionResult.templateId,
    transactionResult.previewUrl
  );
  if (canonical) {
    await prisma.template.update({
      where: { id: transactionResult.templateId },
      data: { thumbnailUrl: canonical, previewThumbnailUrl: canonical },
    });
    await prisma.templateVersion.updateMany({
      where: { templateId: transactionResult.templateId, versionNumber: 1 },
      data: { thumbnailUrl: canonical },
    });
  }

  return transactionResult.dto;
}

export async function rejectTemplateSubmission(
  submissionId: string,
  input: RejectSubmissionInput
): Promise<TemplateSubmissionDto> {
  const reviewNote = normalizeText(input.reviewNote);
  return prisma.$transaction(async (tx) => {
    const submission = await tx.templateSubmission.findUnique({
      where: { id: submissionId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        approvedTemplate: {
          select: { id: true, slug: true, templateKey: true, isActive: true },
        },
      },
    });

    if (!submission) {
      throw new TemplateSubmissionError(404, 'TEMPLATE_SUBMISSION_NOT_FOUND');
    }
    if (submission.status !== 'SUBMITTED') {
      throw new TemplateSubmissionError(409, 'SUBMISSION_NOT_READY_FOR_REJECTION');
    }

    const updated = await tx.templateSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        approvedTemplate: {
          select: { id: true, slug: true, templateKey: true, isActive: true },
        },
      },
    });

    return toDto(updated as SubmissionWithRelations);
  });
}
