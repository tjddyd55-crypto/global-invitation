import { Prisma, TemplateSubmissionStatus } from '@prisma/client';
import prisma from '../lib/prisma';
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
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  usageCount: number;
  revenuePlaceholder: number;
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

  const templateKeyCandidate = sanitizeTemplateKeyCandidate(
    input.templateKeyCandidate,
    parentSubmission?.templateKeyCandidate ?? input.name ?? 'creator_template'
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

  const row = await prisma.templateSubmission.create({
    data: {
      creatorId,
      category: categoryText,
      templateKeyCandidate,
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
      revisionNumber: parentSubmission ? parentSubmission.revisionNumber + 1 : 1,
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
    payload.templateKeyCandidate = sanitizeTemplateKeyCandidate(
      input.templateKeyCandidate,
      submission.templateKeyCandidate
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

  const updated = await prisma.templateSubmission.update({
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

  return toDto(updated as SubmissionWithRelations);
}

export async function getCreatorDashboardSummary(creatorId: string): Promise<CreatorDashboardSummary> {
  const [statusCounts, templateCount, usageCount] = await Promise.all([
    prisma.templateSubmission.groupBy({
      by: ['status'],
      where: { creatorId },
      _count: { _all: true },
    }),
    prisma.template.count({
      where: {
        creatorId,
        isDeleted: false,
      },
    }),
    prisma.invitation.count({
      where: {
        template: {
          creatorId,
        },
      },
    }),
  ]);

  const countByStatus = {
    DRAFT: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  statusCounts.forEach((row) => {
    countByStatus[row.status] = row._count._all;
  });

  return {
    totalTemplates: templateCount,
    draftCount: countByStatus.DRAFT,
    submittedCount: countByStatus.SUBMITTED,
    approvedCount: countByStatus.APPROVED,
    rejectedCount: countByStatus.REJECTED,
    usageCount,
    revenuePlaceholder: 0,
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
        studioConfig: validation.normalized as Prisma.InputJsonValue,
        previewThumbnailUrl: submission.previewThumbnailUrl,
        sourceSubmissionId: submission.id,
        isActive: true,
        isDeleted: false,
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

    return toDto(updated as SubmissionWithRelations);
  }, {
    maxWait: 10_000,
    timeout: 20_000,
  });
}

export async function rejectTemplateSubmission(
  submissionId: string,
  input: RejectSubmissionInput
): Promise<TemplateSubmissionDto> {
  const reviewNote = normalizeText(input.reviewNote);
  const submission = await prisma.templateSubmission.findUnique({
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

  const updated = await prisma.templateSubmission.update({
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
}
