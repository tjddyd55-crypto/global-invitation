import { Router, type Response } from 'express';
import {
  Prisma,
  VisualTemplateCatalogStatus,
} from '@prisma/client';
import prisma from '../lib/prisma';
import {
  getAdminSession,
  requireAdminSession,
  type AdminSession,
} from '../lib/adminSession';
import { logAdminAction } from '../admin/adminAuditLog';
import {
  getVisualCatalogDrift,
  invalidateVisualCatalogCache,
  syncVisualTemplateCatalogFromRegistry,
} from '../lib/visualTemplates/catalogService';
import { isCodeRegistryKey } from '../lib/visualTemplates/codeRegistrySeed';

const router = Router();
router.use(requireAdminSession);

function sessionOf(res: Response): AdminSession {
  return res.locals.adminSession as AdminSession;
}

function requireSuper(req: import('express').Request, res: Response): AdminSession | null {
  const session = getAdminSession(req);
  if (!session || session.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    return null;
  }
  return session;
}

router.post('/visual-templates/sync', async (req, res) => {
  try {
    const dryRun = req.body?.dryRun === true;
    const report = await syncVisualTemplateCatalogFromRegistry({ dryRun });
    invalidateVisualCatalogCache();
    return res.status(200).json(report);
  } catch (error) {
    console.error('[admin/visual-templates] sync failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_SYNC_FAILED' });
  }
});

router.get('/visual-templates/drift', async (_req, res) => {
  try {
    return res.status(200).json(await getVisualCatalogDrift());
  } catch (error) {
    console.error('[admin/visual-templates] drift failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_DRIFT_FAILED' });
  }
});

router.get('/visual-templates', async (req, res) => {
  try {
    const concept = typeof req.query.concept === 'string' ? req.query.concept.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const source = typeof req.query.source === 'string' ? req.query.source.trim() : '';
    const visible = typeof req.query.visible === 'string' ? req.query.visible.trim() : '';
    const featured = typeof req.query.featured === 'string' ? req.query.featured.trim() : '';
    const isNew = typeof req.query.new === 'string' ? req.query.new.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const where: Prisma.VisualTemplateCatalogEntryWhereInput = {};
    if (concept) where.concept = concept;
    if (status) where.status = status as VisualTemplateCatalogStatus;
    if (source === 'CODE' || source === 'FIGMA_DEFINITION') where.sourceType = source;
    if (visible === 'true') where.isVisible = true;
    if (visible === 'false') where.isVisible = false;
    if (featured === 'true') where.isFeatured = true;
    if (featured === 'false') where.isFeatured = false;
    if (isNew === 'true') where.isNew = true;
    if (isNew === 'false') where.isNew = false;
    if (q) {
      where.OR = [
        { templateKey: { contains: q, mode: 'insensitive' } },
        { displayNameKo: { contains: q, mode: 'insensitive' } },
        { displayNameEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const entries = await prisma.visualTemplateCatalogEntry.findMany({
      where,
      orderBy: [{ concept: 'asc' }, { sortOrder: 'asc' }, { templateKey: 'asc' }],
      include: { activeVersion: true },
    });

    // Bounded by registry size (~10); path filter per key (no N×invitations scan).
    const usageByKey = new Map<string, { total: number; draft: number; published: number }>();
    await Promise.all(
      entries.map(async (entry) => {
        const [total, draft, published] = await Promise.all([
          prisma.invitation.count({
            where: {
              isDeleted: false,
              dataJson: { path: ['visualTemplateId'], equals: entry.templateKey },
            },
          }),
          prisma.invitation.count({
            where: {
              isDeleted: false,
              status: 'DRAFT',
              dataJson: { path: ['visualTemplateId'], equals: entry.templateKey },
            },
          }),
          prisma.invitation.count({
            where: {
              isDeleted: false,
              status: 'PUBLISHED',
              dataJson: { path: ['visualTemplateId'], equals: entry.templateKey },
            },
          }),
        ]);
        usageByKey.set(entry.templateKey, { total, draft, published });
      })
    );

    return res.status(200).json({
      templates: entries.map((e) => ({
        id: e.id,
        templateKey: e.templateKey,
        concept: e.concept,
        displayNameKo: e.displayNameKo,
        displayNameEn: e.displayNameEn,
        descriptionKo: e.descriptionKo,
        descriptionEn: e.descriptionEn,
        sourceType: e.sourceType,
        status: e.status,
        isVisible: e.isVisible,
        isFeatured: e.isFeatured,
        isNew: e.isNew,
        isPremium: e.isPremium,
        sortOrder: e.sortOrder,
        thumbnailUrl: e.thumbnailUrl,
        previewUrl: e.previewUrl,
        activeVersion: e.activeVersion?.version ?? null,
        activeVersionId: e.activeVersionId,
        registryOk: e.sourceType !== 'CODE' || isCodeRegistryKey(e.templateKey),
        usage: usageByKey.get(e.templateKey) || { total: 0, draft: 0, published: 0 },
        updatedAt: e.updatedAt.toISOString(),
      })),
      drift: await getVisualCatalogDrift(),
    });
  } catch (error) {
    console.error('[admin/visual-templates] list failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATES_LIST_FAILED' });
  }
});

router.get('/visual-templates/:id', async (req, res) => {
  try {
    const entry = await prisma.visualTemplateCatalogEntry.findFirst({
      where: {
        OR: [{ id: req.params.id }, { templateKey: req.params.id }],
      },
      include: {
        versions: { orderBy: { version: 'desc' } },
        activeVersion: true,
      },
    });
    if (!entry) return res.status(404).json({ error: 'NOT_FOUND' });

    return res.status(200).json({
      template: {
        ...entry,
        registryOk: entry.sourceType !== 'CODE' || isCodeRegistryKey(entry.templateKey),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        versions: entry.versions.map((v) => ({
          id: v.id,
          version: v.version,
          sourceType: v.sourceType,
          status: v.status,
          createdAt: v.createdAt.toISOString(),
          activatedAt: v.activatedAt?.toISOString() ?? null,
          archivedAt: v.archivedAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (error) {
    console.error('[admin/visual-templates] detail failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_DETAIL_FAILED' });
  }
});

router.patch('/visual-templates/:id', async (req, res) => {
  const session = sessionOf(res);
  try {
    const entry = await prisma.visualTemplateCatalogEntry.findFirst({
      where: {
        OR: [{ id: req.params.id }, { templateKey: req.params.id }],
      },
    });
    if (!entry) return res.status(404).json({ error: 'NOT_FOUND' });

    const body = req.body || {};
    if (body.templateKey !== undefined && body.templateKey !== entry.templateKey) {
      return res.status(400).json({ error: 'TEMPLATE_KEY_IMMUTABLE' });
    }
    if (body.concept !== undefined && body.concept !== entry.concept) {
      return res.status(400).json({ error: 'CONCEPT_IMMUTABLE' });
    }

    const nextStatus =
      typeof body.status === 'string'
        ? (body.status as VisualTemplateCatalogStatus)
        : entry.status;
    const nextVisible =
      typeof body.isVisible === 'boolean' ? body.isVisible : entry.isVisible;

    if (
      (nextStatus === VisualTemplateCatalogStatus.ARCHIVED ||
        nextStatus === VisualTemplateCatalogStatus.HIDDEN) &&
      nextVisible
    ) {
      return res.status(400).json({ error: 'VISIBLE_CONFLICT_WITH_STATUS' });
    }

    if (nextStatus === VisualTemplateCatalogStatus.ARCHIVED && session.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    }

    const data: Prisma.VisualTemplateCatalogEntryUpdateInput = {};
    if (typeof body.displayNameKo === 'string') data.displayNameKo = body.displayNameKo.trim();
    if (typeof body.displayNameEn === 'string') data.displayNameEn = body.displayNameEn.trim();
    if (typeof body.descriptionKo === 'string') data.descriptionKo = body.descriptionKo;
    if (typeof body.descriptionEn === 'string') data.descriptionEn = body.descriptionEn;
    if (typeof body.thumbnailUrl === 'string' || body.thumbnailUrl === null) {
      data.thumbnailUrl = body.thumbnailUrl;
    }
    if (typeof body.previewUrl === 'string' || body.previewUrl === null) {
      data.previewUrl = body.previewUrl;
    }
    if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible;
    if (typeof body.isFeatured === 'boolean') data.isFeatured = body.isFeatured;
    if (typeof body.isNew === 'boolean') data.isNew = body.isNew;
    if (typeof body.isPremium === 'boolean') data.isPremium = body.isPremium;
    if (typeof body.sortOrder === 'number' && Number.isInteger(body.sortOrder)) {
      data.sortOrder = body.sortOrder;
    }
    if (typeof body.status === 'string') data.status = nextStatus;

    const before = {
      isVisible: entry.isVisible,
      isFeatured: entry.isFeatured,
      isNew: entry.isNew,
      isPremium: entry.isPremium,
      sortOrder: entry.sortOrder,
      status: entry.status,
      displayNameKo: entry.displayNameKo,
      displayNameEn: entry.displayNameEn,
    };

    const updated = await prisma.visualTemplateCatalogEntry.update({
      where: { id: entry.id },
      data,
    });
    invalidateVisualCatalogCache();

    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'visual_template_update',
      targetType: 'visual_template_catalog',
      targetId: entry.id,
      payload: {
        actorRole: session.role,
        templateKey: entry.templateKey,
        before,
        after: {
          isVisible: updated.isVisible,
          isFeatured: updated.isFeatured,
          isNew: updated.isNew,
          isPremium: updated.isPremium,
          sortOrder: updated.sortOrder,
          status: updated.status,
          displayNameKo: updated.displayNameKo,
          displayNameEn: updated.displayNameEn,
        },
      },
    });

    return res.status(200).json({ template: updated });
  } catch (error) {
    console.error('[admin/visual-templates] patch failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_UPDATE_FAILED' });
  }
});

router.post('/visual-templates/reorder', async (req, res) => {
  const session = sessionOf(res);
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order : null;
    if (!order) return res.status(400).json({ error: 'ORDER_REQUIRED' });

    const updates: Array<{ id: string; sortOrder: number }> = [];
    order.forEach((item: unknown, index: number) => {
      if (!item || typeof item !== 'object') return;
      const row = item as { id?: string; templateKey?: string };
      updates.push({
        id: typeof row.id === 'string' ? row.id : '',
        sortOrder: index + 1,
      });
    });

    for (let i = 0; i < order.length; i += 1) {
      const item = order[i] as { id?: string; templateKey?: string };
      const where = item.id
        ? { id: item.id }
        : item.templateKey
          ? { templateKey: item.templateKey }
          : null;
      if (!where) continue;
      await prisma.visualTemplateCatalogEntry.update({
        where,
        data: { sortOrder: i + 1 },
      });
    }

    invalidateVisualCatalogCache();
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'visual_template_reorder',
      targetType: 'visual_template_catalog',
      payload: { actorRole: session.role, count: order.length },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[admin/visual-templates] reorder failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_REORDER_FAILED' });
  }
});

router.post('/visual-templates/:id/archive', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const entry = await prisma.visualTemplateCatalogEntry.findFirst({
      where: {
        OR: [{ id: req.params.id }, { templateKey: req.params.id }],
      },
    });
    if (!entry) return res.status(404).json({ error: 'NOT_FOUND' });

    const updated = await prisma.visualTemplateCatalogEntry.update({
      where: { id: entry.id },
      data: {
        status: VisualTemplateCatalogStatus.ARCHIVED,
        isVisible: false,
      },
    });
    invalidateVisualCatalogCache();
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'visual_template_archive',
      targetType: 'visual_template_catalog',
      targetId: entry.id,
      payload: {
        actorRole: session.role,
        templateKey: entry.templateKey,
        before: { status: entry.status, isVisible: entry.isVisible },
        after: { status: updated.status, isVisible: updated.isVisible },
      },
    });
    return res.status(200).json({ template: updated });
  } catch (error) {
    console.error('[admin/visual-templates] archive failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_ARCHIVE_FAILED' });
  }
});

router.post('/visual-templates/:id/activate', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const entry = await prisma.visualTemplateCatalogEntry.findFirst({
      where: {
        OR: [{ id: req.params.id }, { templateKey: req.params.id }],
      },
    });
    if (!entry) return res.status(404).json({ error: 'NOT_FOUND' });

    const updated = await prisma.visualTemplateCatalogEntry.update({
      where: { id: entry.id },
      data: {
        status: VisualTemplateCatalogStatus.ACTIVE,
        isVisible: true,
      },
    });
    invalidateVisualCatalogCache();
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'visual_template_activate',
      targetType: 'visual_template_catalog',
      targetId: entry.id,
      payload: {
        actorRole: session.role,
        templateKey: entry.templateKey,
        before: { status: entry.status, isVisible: entry.isVisible },
        after: { status: updated.status, isVisible: updated.isVisible },
      },
    });
    return res.status(200).json({ template: updated });
  } catch (error) {
    console.error('[admin/visual-templates] activate failed', error);
    return res.status(500).json({ error: 'VISUAL_TEMPLATE_ACTIVATE_FAILED' });
  }
});

export default router;
