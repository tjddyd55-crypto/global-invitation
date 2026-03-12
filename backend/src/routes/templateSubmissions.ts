import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';
import {
  createTemplateSubmissionDraft,
  getCreatorDashboardSummary,
  getCreatorTemplateSubmissionById,
  listCreatorTemplateSubmissions,
  submitTemplateSubmission,
  TemplateSubmissionError,
  updateTemplateSubmissionDraft,
} from '../creator/templateSubmission.service';
import { logAdminAction } from '../admin/adminAuditLog';

const router = Router();

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function resolveCreatorOrReject(req: Request, res: Response) {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return null;
  }

  if (user.role !== 'CREATOR') {
    res.status(403).json({ error: 'CREATOR_ROLE_REQUIRED' });
    return null;
  }

  return user;
}

function handleServiceError(res: Response, error: unknown) {
  if (error instanceof TemplateSubmissionError) {
    return res.status(error.status).json({ error: error.code, message: error.message });
  }
  console.error('Template submission route error:', error);
  return res.status(500).json({ error: 'TEMPLATE_SUBMISSION_INTERNAL_ERROR' });
}

router.post('/enroll', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (user.role === 'CREATOR' || user.role === 'ADMIN') {
    return res.status(200).json({
      ok: true,
      role: user.role,
      alreadyEnrolled: true,
    });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'CREATOR',
        isCreator: true,
      },
      select: {
        id: true,
        role: true,
        isCreator: true,
      },
    });

    return res.status(200).json({
      ok: true,
      userId: updated.id,
      role: updated.role,
      isCreator: updated.isCreator,
    });
  } catch (error) {
    console.error('Creator enroll failed:', error);
    return res.status(500).json({ error: 'CREATOR_ENROLL_FAILED' });
  }
});

router.get('/dashboard', async (req, res) => {
  const creator = await resolveCreatorOrReject(req, res);
  if (!creator) return;

  try {
    const summary = await getCreatorDashboardSummary(creator.id);
    return res.status(200).json(summary);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.get('/template-submissions', async (req, res) => {
  const creator = await resolveCreatorOrReject(req, res);
  if (!creator) return;

  try {
    const rows = await listCreatorTemplateSubmissions(creator.id);
    return res.status(200).json(rows);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.get('/template-submissions/:id', async (req, res) => {
  const creator = await resolveCreatorOrReject(req, res);
  if (!creator) return;

  try {
    const submissionId = normalizeText(req.params.id);
    if (!submissionId) {
      return res.status(400).json({ error: 'TEMPLATE_SUBMISSION_ID_REQUIRED' });
    }

    const row = await getCreatorTemplateSubmissionById(creator.id, submissionId);
    return res.status(200).json(row);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.post('/template-submissions', async (req, res) => {
  const creator = await resolveCreatorOrReject(req, res);
  if (!creator) return;

  try {
    const category = normalizeText(req.body?.category).toLowerCase();
    if (!category) {
      return res.status(400).json({ error: 'CATEGORY_REQUIRED' });
    }

    const row = await createTemplateSubmissionDraft(creator.id, {
      category,
      parentSubmissionId: normalizeText(req.body?.parentSubmissionId) || undefined,
      templateKeyCandidate: normalizeText(req.body?.templateKeyCandidate) || undefined,
      name: normalizeText(req.body?.name) || undefined,
      description: normalizeText(req.body?.description) || undefined,
      style: normalizeText(req.body?.style) || undefined,
      price: req.body?.price,
      previewThumbnailUrl: normalizeText(req.body?.previewThumbnailUrl) || undefined,
      studioConfig: req.body?.studioConfig,
    });

    await logAdminAction({
      adminId: `creator:${creator.id}`,
      action: 'submission_created',
      targetType: 'template_submission',
      targetId: row.id,
      payload: {
        category: row.category,
        revisionNumber: row.revisionNumber,
      },
    }).catch((error) => {
      console.warn('Failed to write submission_created audit log:', error);
    });

    return res.status(201).json(row);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.patch('/template-submissions/:id', async (req, res) => {
  const creator = await resolveCreatorOrReject(req, res);
  if (!creator) return;

  try {
    const submissionId = normalizeText(req.params.id);
    if (!submissionId) {
      return res.status(400).json({ error: 'TEMPLATE_SUBMISSION_ID_REQUIRED' });
    }

    const row = await updateTemplateSubmissionDraft(creator.id, submissionId, {
      templateKeyCandidate:
        req.body?.templateKeyCandidate !== undefined
          ? normalizeText(req.body.templateKeyCandidate)
          : undefined,
      name: req.body?.name !== undefined ? normalizeText(req.body.name) : undefined,
      description: req.body?.description !== undefined ? normalizeText(req.body.description) : undefined,
      style: req.body?.style !== undefined ? normalizeText(req.body.style) : undefined,
      price: req.body?.price,
      previewThumbnailUrl:
        req.body?.previewThumbnailUrl !== undefined
          ? normalizeText(req.body.previewThumbnailUrl)
          : undefined,
      studioConfig: req.body?.studioConfig,
    });

    return res.status(200).json(row);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.post('/template-submissions/:id/submit', async (req, res) => {
  const creator = await resolveCreatorOrReject(req, res);
  if (!creator) return;

  try {
    const submissionId = normalizeText(req.params.id);
    if (!submissionId) {
      return res.status(400).json({ error: 'TEMPLATE_SUBMISSION_ID_REQUIRED' });
    }

    const row = await submitTemplateSubmission(creator.id, submissionId);

    await logAdminAction({
      adminId: `creator:${creator.id}`,
      action: 'submission_submitted',
      targetType: 'template_submission',
      targetId: row.id,
      payload: {
        category: row.category,
        revisionNumber: row.revisionNumber,
      },
    }).catch((error) => {
      console.warn('Failed to write submission_submitted audit log:', error);
    });

    return res.status(200).json(row);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

export default router;
