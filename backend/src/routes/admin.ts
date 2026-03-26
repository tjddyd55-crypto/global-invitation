import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { getInvitationAnalyticsSummary } from '../analytics/invitationAnalytics';
import { requireAdminSession } from '../lib/adminSession';
import {
  createTemplate,
  disableTemplate,
  getTemplateByIdentifier,
  getTemplateStoreSummary,
  isAllowedTemplateLifecycleTransition,
  lifecycleStatusToDatabaseStatus,
  listTemplates,
  listTemplatesForAdmin,
  normalizeTemplateLifecycleStatusInput,
  softDeleteTemplate,
  toTemplateLifecycleStatus,
  updateTemplate,
  type TemplateCategory,
  type TemplateLifecycleStatus,
  type TemplateStyle,
} from '../admin/templateStore';
import { isValidTemplateKey, resolveTemplateComponentByKey } from '../admin/templateRegistry';
import { logAdminAction } from '../admin/adminAuditLog';
import { cleanupTemplateMedia } from '../storage/mediaCleanup';

const router = Router();

const TEMPLATE_CATEGORIES = new Set<TemplateCategory>(['wedding', 'birthday', 'funeral', 'party', 'message']);
const TEMPLATE_STYLES = new Set<TemplateStyle>([
  'korean',
  'japanese',
  'western',
  'traditional',
  'modern',
]);
const TEMPLATE_STATUSES = new Set([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'CREATED',
  'PENDING_REVIEW',
  'ARCHIVED',
  'DISABLED',
]);

router.use(requireAdminSession);

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function validateCategory(value: string): value is TemplateCategory {
  return TEMPLATE_CATEGORIES.has(value as TemplateCategory);
}

function validateStyle(value: string): value is TemplateStyle {
  return TEMPLATE_STYLES.has(value as TemplateStyle);
}

function validateTemplateStatus(value: string): boolean {
  return TEMPLATE_STATUSES.has(value);
}

function resolveTemplateLifecycleStatusFromBody(statusValue: string): TemplateLifecycleStatus | null {
  return normalizeTemplateLifecycleStatusInput(statusValue);
}

function escapeCsvCell(value: unknown): string {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

router.get('/dashboard', async (_req, res) => {
  try {
    const [templateSummary, totalInvitationsCreated, invitationsCreatedToday] = await Promise.all([
      getTemplateStoreSummary(),
      prisma.invitation.count({ where: { isDeleted: false } }),
      prisma.invitation.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return res.status(200).json({
      totalTemplates: templateSummary.totalTemplates,
      activeTemplates: templateSummary.activeTemplates,
      totalInvitationsCreated,
      invitationsCreatedToday,
      revenueSummary: templateSummary.revenueSummary,
      creatorTemplates: templateSummary.creatorTemplates,
      systemTemplates: templateSummary.systemTemplates,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_ADMIN_DASHBOARD' });
  }
});

router.get('/invitations/:id/rsvp/export', async (req, res) => {
  try {
    const invitationId = normalizeText(req.params.id);
    if (!invitationId) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, isDeleted: false },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    const guests = await prisma.rSVP.findMany({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
      select: {
        guestName: true,
        attendance: true,
        guestCount: true,
        mealChoice: true,
        message: true,
        createdAt: true,
      },
    });

    const rows = [
      ['guest_name', 'attendance', 'guest_count', 'meal_choice', 'message', 'created_at'].join(','),
      ...guests.map((guest) =>
        [
          escapeCsvCell(guest.guestName),
          escapeCsvCell(guest.attendance),
          escapeCsvCell(guest.guestCount),
          escapeCsvCell(guest.mealChoice),
          escapeCsvCell(guest.message),
          escapeCsvCell(guest.createdAt.toISOString()),
        ].join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invitation-${invitation.slug}-rsvp.csv"`
    );
    return res.status(200).send(rows.join('\n'));
  } catch (error) {
    console.error('Error exporting RSVP CSV:', error);
    return res.status(500).json({ error: 'FAILED_TO_EXPORT_RSVP_CSV' });
  }
});

router.get('/invitations/:id/analytics', async (req, res) => {
  try {
    const invitationId = normalizeText(req.params.id);
    if (!invitationId) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, isDeleted: false },
      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    const summary = await getInvitationAnalyticsSummary(invitationId);

    return res.status(200).json({
      invitation,
      ...summary,
    });
  } catch (error) {
    console.error('Error fetching invitation analytics:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_INVITATION_ANALYTICS' });
  }
});

router.patch('/rsvp/:id', async (req, res) => {
  try {
    const rsvpId = normalizeText(req.params.id);
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    const isHidden = Boolean(req.body?.isHidden);

    if (!rsvpId) {
      return res.status(400).json({ error: 'RSVP_ID_REQUIRED' });
    }

    const rsvp = await prisma.rSVP.update({
      where: { id: rsvpId },
      data: {
        isHidden,
      },
      select: {
        id: true,
        invitationId: true,
        guestName: true,
        attendance: true,
        guestCount: true,
        mealChoice: true,
        message: true,
        isHidden: true,
        createdAt: true,
      },
    });

    await logAdminAction({
      adminId,
      action: isHidden ? 'rsvp_message_hide' : 'rsvp_message_show',
      targetType: 'rsvp',
      targetId: rsvp.id,
      payload: {
        invitationId: rsvp.invitationId,
        guestName: rsvp.guestName,
        isHidden: rsvp.isHidden,
      },
    }).catch((error) => {
      console.warn('Failed to write RSVP moderation audit log:', error);
    });

    return res.status(200).json({
      success: true,
      rsvp,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'RSVP_NOT_FOUND' });
    }
    console.error('Error updating RSVP visibility:', error);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_RSVP_VISIBILITY' });
  }
});

router.delete('/rsvp/:id', async (req, res) => {
  try {
    const rsvpId = normalizeText(req.params.id);
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');

    if (!rsvpId) {
      return res.status(400).json({ error: 'RSVP_ID_REQUIRED' });
    }

    const existing = await prisma.rSVP.findUnique({
      where: { id: rsvpId },
      select: {
        id: true,
        invitationId: true,
        guestName: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'RSVP_NOT_FOUND' });
    }

    await prisma.rSVP.delete({
      where: { id: rsvpId },
    });

    await logAdminAction({
      adminId,
      action: 'rsvp_delete',
      targetType: 'rsvp',
      targetId: existing.id,
      payload: {
        invitationId: existing.invitationId,
        guestName: existing.guestName,
      },
    }).catch((error) => {
      console.warn('Failed to write RSVP delete audit log:', error);
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'RSVP_NOT_FOUND' });
    }
    console.error('Error deleting RSVP:', error);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_RSVP' });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const statusFilter = typeof req.query?.status === 'string' ? req.query.status : undefined;
    if (statusFilter && !normalizeTemplateLifecycleStatusInput(statusFilter)) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_STATUS' });
    }
    const templates = statusFilter
      ? await listTemplatesForAdmin({ status: statusFilter })
      : await listTemplates();
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing admin templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_TEMPLATES' });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await getTemplateByIdentifier(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_TEMPLATE' });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    const name = normalizeText(req.body?.name);
    const category = normalizeText(req.body?.category);
    const style = normalizeText(req.body?.style);
    const description = normalizeText(req.body?.description);
    const templateKey = normalizeText(req.body?.templateKey) || 'wedding_classic';
    const statusText = normalizeText(req.body?.status).toUpperCase();
    const creatorId = normalizeText(req.body?.creatorId);
    const thumbnailUrl = normalizeText(req.body?.thumbnailUrl || req.body?.previewThumbnailUrl);
    const price = normalizeNumber(req.body?.price);
    const creatorShare = normalizeNumber(req.body?.creatorShare);

    if (!name || !description) {
      return res.status(400).json({ error: 'REQUIRED_FIELDS_MISSING' });
    }
    if (!validateCategory(category) || !validateStyle(style)) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_TAXONOMY' });
    }
    if (!isValidTemplateKey(templateKey)) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_KEY' });
    }
    if (statusText && !validateTemplateStatus(statusText)) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_STATUS' });
    }
    const lifecycleStatus = statusText ? resolveTemplateLifecycleStatusFromBody(statusText) : null;
    if (statusText && !lifecycleStatus) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_STATUS' });
    }
    if (lifecycleStatus === 'ARCHIVED') {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_INITIAL_STATUS' });
    }
    const status = lifecycleStatus
      ? lifecycleStatusToDatabaseStatus(lifecycleStatus)
      : null;

    const component = resolveTemplateComponentByKey(templateKey);
    if (!component) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_KEY' });
    }

    const template = await createTemplate({
      name,
      category,
      style,
      description,
      price,
      creatorShare,
      creatorId: creatorId || undefined,
      component,
      templateKey,
      status: status || undefined,
      previewThumbnailUrl: thumbnailUrl || undefined,
    });
    await logAdminAction({
      adminId,
      action: 'template_create',
      targetType: 'template',
      targetId: template.id,
      payload: {
        slug: template.slug,
        name: template.name,
        category: template.category,
        style: template.style,
        component: template.component,
      },
    }).catch((error) => {
      console.warn('Failed to write template_create audit log:', error);
    });
    return res.status(201).json(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREATOR_ID') {
      return res.status(400).json({ error: 'INVALID_CREATOR_ID' });
    }
    console.error('Error creating admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_TEMPLATE' });
  }
});

router.patch('/templates/:id', async (req, res) => {
  try {
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    const existing = await getTemplateByIdentifier(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }

    const payload: Record<string, unknown> = {};

    if (typeof req.body?.name === 'string') payload.name = normalizeText(req.body.name);
    if (typeof req.body?.description === 'string') payload.description = normalizeText(req.body.description);
    if (typeof req.body?.templateKey === 'string') {
      const templateKey = normalizeText(req.body.templateKey);
      if (!isValidTemplateKey(templateKey)) {
        return res.status(400).json({ error: 'INVALID_TEMPLATE_KEY' });
      }

      const component = resolveTemplateComponentByKey(templateKey);
      if (!component) {
        return res.status(400).json({ error: 'INVALID_TEMPLATE_KEY' });
      }

      payload.templateKey = templateKey;
      payload.component = component;
    }
    const lifecycleRaw =
      typeof req.body?.lifecycleStatus === 'string'
        ? normalizeText(req.body.lifecycleStatus)
        : typeof req.body?.status === 'string'
          ? normalizeText(req.body.status)
          : '';
    const hasLifecycleInput = Boolean(lifecycleRaw);

    if (lifecycleRaw) {
      const statusUpper = lifecycleRaw.toUpperCase();
      if (!validateTemplateStatus(statusUpper)) {
        return res.status(400).json({ error: 'INVALID_TEMPLATE_STATUS' });
      }

      const nextLifecycleStatus = resolveTemplateLifecycleStatusFromBody(statusUpper);
      if (!nextLifecycleStatus) {
        return res.status(400).json({ error: 'INVALID_TEMPLATE_STATUS' });
      }

      const currentLifecycleStatus = toTemplateLifecycleStatus(
        existing.status,
        existing.isActive,
        existing.isDeleted
      );
      if (!isAllowedTemplateLifecycleTransition(currentLifecycleStatus, nextLifecycleStatus)) {
        return res.status(409).json({
          error: 'INVALID_TEMPLATE_STATUS_TRANSITION',
          from: currentLifecycleStatus,
          to: nextLifecycleStatus,
        });
      }

      if (nextLifecycleStatus === 'ARCHIVED') {
        payload.isActive = false;
        payload.isDeleted = true;
      } else if (nextLifecycleStatus === 'DISABLED') {
        if (existing.status !== 'PUBLISHED') {
          return res.status(400).json({ error: 'DISABLED_REQUIRES_PUBLISHED_STATUS' });
        }
        payload.isActive = false;
        payload.isDeleted = false;
      } else if (nextLifecycleStatus === 'PUBLISHED') {
        payload.status = 'PUBLISHED';
        payload.isActive = true;
        payload.isDeleted = false;
      } else {
        const dbStatus = lifecycleStatusToDatabaseStatus(nextLifecycleStatus);
        if (!dbStatus) {
          return res.status(400).json({ error: 'INVALID_TEMPLATE_STATUS' });
        }
        payload.status = dbStatus;
        payload.isActive = true;
        payload.isDeleted = false;
      }

      if (nextLifecycleStatus === 'REJECTED') {
        const rejectRaw = req.body?.rejectReason ?? req.body?.reviewNote;
        const rejectReason = typeof rejectRaw === 'string' ? normalizeText(rejectRaw) : '';
        if (!rejectReason) {
          return res.status(400).json({ error: 'REJECT_REASON_REQUIRED' });
        }
        payload.adminRejectReason = rejectReason;
      } else if (nextLifecycleStatus !== currentLifecycleStatus) {
        payload.adminRejectReason = null;
      }
    }
    if (typeof req.body?.category === 'string') {
      const category = normalizeText(req.body.category);
      if (!validateCategory(category)) {
        return res.status(400).json({ error: 'INVALID_TEMPLATE_CATEGORY' });
      }
      payload.category = category;
    }
    if (typeof req.body?.style === 'string') {
      const style = normalizeText(req.body.style);
      if (!validateStyle(style)) {
        return res.status(400).json({ error: 'INVALID_TEMPLATE_STYLE' });
      }
      payload.style = style;
    }
    if (req.body?.price !== undefined) payload.price = normalizeNumber(req.body.price);
    if (req.body?.creatorShare !== undefined) payload.creatorShare = normalizeNumber(req.body.creatorShare);
    if (req.body?.creatorId !== undefined) payload.creatorId = normalizeText(req.body.creatorId) || undefined;
    if (req.body?.thumbnailUrl !== undefined || req.body?.previewThumbnailUrl !== undefined) {
      payload.previewThumbnailUrl = normalizeText(req.body?.thumbnailUrl || req.body?.previewThumbnailUrl);
    }
    if (req.body?.isActive !== undefined && !hasLifecycleInput) {
      payload.isActive = Boolean(req.body.isActive);
    }
    if (req.body?.isDeleted !== undefined && !hasLifecycleInput) {
      payload.isDeleted = Boolean(req.body.isDeleted);
    }

    const template = await updateTemplate(req.params.id, payload);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    await logAdminAction({
      adminId,
      action: 'template_update',
      targetType: 'template',
      targetId: template.id,
      payload: payload as Prisma.InputJsonValue,
    }).catch((error) => {
      console.warn('Failed to write template_update audit log:', error);
    });
    return res.status(200).json(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREATOR_ID') {
      return res.status(400).json({ error: 'INVALID_CREATOR_ID' });
    }
    console.error('Error updating admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_TEMPLATE' });
  }
});

router.post('/templates/:id/disable', async (req, res) => {
  try {
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    const template = await disableTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    await logAdminAction({
      adminId,
      action: 'template_update',
      targetType: 'template',
      targetId: template.id,
      payload: { isActive: false, reason: 'admin_disable' },
    }).catch((error) => {
      console.warn('Failed to write template_update audit log:', error);
    });
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error disabling admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_DISABLE_TEMPLATE' });
  }
});

router.post('/templates/:id/delete', async (req, res) => {
  try {
    const adminId = String(res.locals.adminSession?.adminId || 'unknown-admin');
    const template = await softDeleteTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    try {
      await cleanupTemplateMedia({
        id: template.id,
        creatorId: template.creatorId,
        sourceSubmissionId: template.sourceSubmissionId,
        previewThumbnailUrl: template.previewThumbnailUrl,
        previewThumbnailObjectKey: template.previewThumbnailObjectKey,
      });
    } catch (cleanupError) {
      console.warn('Failed to cleanup template media:', cleanupError);
    }
    await logAdminAction({
      adminId,
      action: 'template_delete',
      targetType: 'template',
      targetId: template.id,
      payload: { isDeleted: true, isActive: false },
    }).catch((error) => {
      console.warn('Failed to write template_delete audit log:', error);
    });
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error deleting admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_TEMPLATE' });
  }
});

export default router;
