import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAdminSession } from '../lib/adminSession';
import {
  createTemplate,
  disableTemplate,
  getTemplateById,
  getTemplateStoreSummary,
  listTemplates,
  softDeleteTemplate,
  updateTemplate,
  type TemplateCategory,
  type TemplateStyle,
} from '../admin/templateStore';

const router = Router();

const TEMPLATE_CATEGORIES = new Set<TemplateCategory>(['wedding', 'birthday', 'funeral', 'party']);
const TEMPLATE_STYLES = new Set<TemplateStyle>([
  'korean',
  'japanese',
  'western',
  'traditional',
  'modern',
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

router.get('/dashboard', async (_req, res) => {
  try {
    const [templateSummary, totalInvitationsCreated, invitationsCreatedToday] = await Promise.all([
      getTemplateStoreSummary(),
      prisma.invitation.count(),
      prisma.invitation.count({
        where: {
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

router.get('/templates', async (_req, res) => {
  try {
    const templates = await listTemplates();
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing admin templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_TEMPLATES' });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
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
    const name = normalizeText(req.body?.name);
    const category = normalizeText(req.body?.category);
    const style = normalizeText(req.body?.style);
    const description = normalizeText(req.body?.description);
    const component = normalizeText(req.body?.component);
    const templateKey = normalizeText(req.body?.templateKey) || 'wedding_classic';
    const creatorId = normalizeText(req.body?.creatorId);
    const price = normalizeNumber(req.body?.price);
    const creatorShare = normalizeNumber(req.body?.creatorShare);

    if (!name || !description || !component) {
      return res.status(400).json({ error: 'REQUIRED_FIELDS_MISSING' });
    }
    if (!validateCategory(category) || !validateStyle(style)) {
      return res.status(400).json({ error: 'INVALID_TEMPLATE_TAXONOMY' });
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
    });
    return res.status(201).json(template);
  } catch (error) {
    console.error('Error creating admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_TEMPLATE' });
  }
});

router.patch('/templates/:id', async (req, res) => {
  try {
    const payload: Record<string, unknown> = {};

    if (typeof req.body?.name === 'string') payload.name = normalizeText(req.body.name);
    if (typeof req.body?.description === 'string') payload.description = normalizeText(req.body.description);
    if (typeof req.body?.component === 'string') payload.component = normalizeText(req.body.component);
    if (typeof req.body?.templateKey === 'string') payload.templateKey = normalizeText(req.body.templateKey);
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
    if (req.body?.isActive !== undefined) payload.isActive = Boolean(req.body.isActive);
    if (req.body?.isDeleted !== undefined) payload.isDeleted = Boolean(req.body.isDeleted);

    const template = await updateTemplate(req.params.id, payload);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error updating admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_TEMPLATE' });
  }
});

router.post('/templates/:id/disable', async (req, res) => {
  try {
    const template = await disableTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error disabling admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_DISABLE_TEMPLATE' });
  }
});

router.post('/templates/:id/delete', async (req, res) => {
  try {
    const template = await softDeleteTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error deleting admin template:', error);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_TEMPLATE' });
  }
});

export default router;
