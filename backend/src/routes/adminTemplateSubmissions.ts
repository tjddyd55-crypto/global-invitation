import { Router } from 'express';
import type { Response } from 'express';
import { requireAdminSession } from '../lib/adminSession';
import {
  approveTemplateSubmission,
  getAdminTemplateSubmissionById,
  listAdminTemplateSubmissions,
  rejectTemplateSubmission,
  TemplateSubmissionError,
} from '../creator/templateSubmission.service';
import { logAdminAction } from '../admin/adminAuditLog';

const router = Router();

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function handleServiceError(error: unknown, res: Response) {
  if (error instanceof TemplateSubmissionError) {
    return res.status(error.status).json({ error: error.code, message: error.message });
  }
  console.error('Admin template submission route error:', error);
  return res.status(500).json({ error: 'ADMIN_TEMPLATE_SUBMISSION_INTERNAL_ERROR' });
}

router.use(requireAdminSession);

router.get('/template-submissions', async (_req, res) => {
  try {
    const rows = await listAdminTemplateSubmissions();
    return res.status(200).json(rows);
  } catch (error) {
    return handleServiceError(error, res);
  }
});

router.get('/template-submissions/:id', async (req, res) => {
  try {
    const submissionId = normalizeText(req.params.id);
    if (!submissionId) {
      return res.status(400).json({ error: 'TEMPLATE_SUBMISSION_ID_REQUIRED' });
    }
    const row = await getAdminTemplateSubmissionById(submissionId);
    return res.status(200).json(row);
  } catch (error) {
    return handleServiceError(error, res);
  }
});

router.post('/template-submissions/:id/approve', async (req, res) => {
  try {
    const submissionId = normalizeText(req.params.id);
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    if (!submissionId) {
      return res.status(400).json({ error: 'TEMPLATE_SUBMISSION_ID_REQUIRED' });
    }

    const approved = await approveTemplateSubmission(submissionId, {
      reviewNote: normalizeText(req.body?.reviewNote) || undefined,
      creatorShare: req.body?.creatorShare,
    });

    await logAdminAction({
      adminId,
      action: 'submission_approved',
      targetType: 'template_submission',
      targetId: approved.id,
      payload: {
        approvedTemplateId: approved.approvedTemplateId,
        category: approved.category,
        templateKeyCandidate: approved.templateKeyCandidate,
      },
    }).catch((error) => {
      console.warn('Failed to write submission_approved audit log:', error);
    });

    return res.status(200).json(approved);
  } catch (error) {
    return handleServiceError(error, res);
  }
});

router.post('/template-submissions/:id/reject', async (req, res) => {
  try {
    const submissionId = normalizeText(req.params.id);
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    if (!submissionId) {
      return res.status(400).json({ error: 'TEMPLATE_SUBMISSION_ID_REQUIRED' });
    }

    const rejected = await rejectTemplateSubmission(submissionId, {
      reviewNote: normalizeText(req.body?.reviewNote) || undefined,
    });

    await logAdminAction({
      adminId,
      action: 'submission_rejected',
      targetType: 'template_submission',
      targetId: rejected.id,
      payload: {
        category: rejected.category,
        templateKeyCandidate: rejected.templateKeyCandidate,
        reviewNote: rejected.reviewNote,
      },
    }).catch((error) => {
      console.warn('Failed to write submission_rejected audit log:', error);
    });

    return res.status(200).json(rejected);
  } catch (error) {
    return handleServiceError(error, res);
  }
});

export default router;
