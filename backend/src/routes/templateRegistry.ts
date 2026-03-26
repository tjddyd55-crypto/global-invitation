import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { InvitationStatus } from '@prisma/client';
import {
  calculateRevenue,
  getTemplateByIdentifier,
  getTemplateFieldsByIdentifier,
  getLatestTemplateVersion,
  listTemplatesByCreator,
  listVisibleTemplatesBySort,
  recordTemplateView,
  type TemplateUpdateInput,
  updateTemplate,
} from '../admin/templateStore';
import prisma from '../lib/prisma';
import { getAuthUser, getGuestToken } from '../lib/auth';
import { getAdminSession } from '../lib/adminSession';
import { buildTemplatePreviewSampleData } from '../admin/templatePreviewSampleData';
import { generateSlug } from '../utils/slug';

const router = Router();

function isMarketplaceVisibleTemplate(template: {
  status?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}): boolean {
  return template.status === 'PUBLISHED' && template.isActive === true && template.isDeleted !== true;
}

function isCreatorRole(role?: string | null): boolean {
  return role === 'CREATOR';
}

async function listMarketplaceTemplates(req: Request, res: Response) {
  try {
    const sortQuery = typeof req.query?.sort === 'string' ? req.query.sort.toLowerCase() : 'newest';
    const sort: 'newest' | 'popular' | 'trending' =
      sortQuery === 'popular' || sortQuery === 'trending' ? sortQuery : 'newest';
    const templates = await listVisibleTemplatesBySort({ sort });
    const visibleTemplates = templates.filter(isMarketplaceVisibleTemplate);
    return res.status(200).json(visibleTemplates);
  } catch (error) {
    console.error('Error listing public templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_PUBLIC_TEMPLATES' });
  }
}

router.get('/', listMarketplaceTemplates);
router.get('/marketplace', listMarketplaceTemplates);

router.get('/search', async (req, res) => {
  try {
    const raw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!raw) {
      return res.status(200).json([]);
    }

    const templates = await prisma.template.findMany({
      where: {
        status: 'PUBLISHED',
        isActive: true,
        isDeleted: false,
        OR: [
          { name: { contains: raw, mode: 'insensitive' } },
          { description: { contains: raw, mode: 'insensitive' } },
          { slug: { contains: raw, mode: 'insensitive' } },
          { templateKey: { contains: raw, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        templateKey: true,
      },
    });

    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error searching templates:', error);
    return res.status(500).json({ error: 'TEMPLATE_SEARCH_FAILED' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }
    if (!isCreatorRole(user.role)) {
      return res.status(403).json({ error: 'CREATOR_ROLE_REQUIRED' });
    }

    const templates = await listTemplatesByCreator(user.id);
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing creator templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_CREATOR_TEMPLATES' });
  }
});

router.patch('/my/:identifier', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }
    if (!isCreatorRole(user.role)) {
      return res.status(403).json({ error: 'CREATOR_ROLE_REQUIRED' });
    }

    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    if (template.creatorId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN_TEMPLATE_OWNER_ONLY' });
    }
    if (req.body?.status !== undefined) {
      return res.status(403).json({ error: 'ONLY_ADMIN_CAN_CHANGE_TEMPLATE_STATUS' });
    }
    if (req.body?.lifecycleStatus !== undefined) {
      return res.status(403).json({ error: 'ONLY_ADMIN_CAN_CHANGE_TEMPLATE_STATUS' });
    }
    if (req.body?.creatorId !== undefined) {
      return res.status(403).json({ error: 'CREATOR_ID_CANNOT_BE_CHANGED' });
    }

    const payload: TemplateUpdateInput = {};
    if (typeof req.body?.name === 'string') payload.name = req.body.name.trim();
    if (typeof req.body?.description === 'string') payload.description = req.body.description.trim();
    if (req.body?.price !== undefined) payload.price = Number(req.body.price) || 0;
    if (req.body?.creatorShare !== undefined) payload.creatorShare = Number(req.body.creatorShare) || 0;
    if (typeof req.body?.thumbnailUrl === 'string') payload.thumbnailUrl = req.body.thumbnailUrl.trim();
    if (typeof req.body?.previewThumbnailUrl === 'string') {
      payload.previewThumbnailUrl = req.body.previewThumbnailUrl.trim();
    }
    if (req.body?.studioConfig !== undefined) payload.studioConfig = req.body.studioConfig;

    const updated = await updateTemplate(req.params.identifier, payload);
    if (!updated) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating creator template:', error);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_CREATOR_TEMPLATE' });
  }
});

router.post('/my/:identifier/submit', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }
    if (!isCreatorRole(user.role)) {
      return res.status(403).json({ error: 'CREATOR_ROLE_REQUIRED' });
    }

    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    if (template.creatorId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN_TEMPLATE_OWNER_ONLY' });
    }
    if (template.lifecycleStatus !== 'CREATED') {
      return res.status(409).json({ error: 'ONLY_DRAFT_TEMPLATE_CAN_BE_SUBMITTED' });
    }

    const updated = await updateTemplate(req.params.identifier, {
      status: 'SUBMITTED',
      isActive: true,
      isDeleted: false,
    });
    if (!updated) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error submitting creator template:', error);
    return res.status(500).json({ error: 'FAILED_TO_SUBMIT_CREATOR_TEMPLATE' });
  }
});

/**
 * 템플릿 실제 UI 미리보기용 메타 + 샘플 데이터.
 * - 마켓 노출 템플릿: 누구나
 * - 비공개 템플릿: 관리자 세션 필요
 */
router.get('/:identifier/preview', async (req, res) => {
  try {
    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }

    const adminSession = getAdminSession(req);
    const isAdmin =
      adminSession?.role === 'ADMIN' || adminSession?.role === 'SUPER_ADMIN';
    const visible = isMarketplaceVisibleTemplate(template);

    if (!visible && !isAdmin) {
      return res.status(403).json({ error: 'TEMPLATE_PREVIEW_FORBIDDEN' });
    }

    const modeRaw = typeof req.query?.mode === 'string' ? req.query.mode.toLowerCase() : '';
    const isReal = modeRaw === 'real';

    return res.status(200).json({
      template,
      studioConfig: template.studioConfig ?? null,
      previewMode: isReal ? 'real' : 'sample',
      sampleData: isReal ? null : buildTemplatePreviewSampleData(template),
    });
  } catch (error) {
    console.error('Error building template preview bundle:', error);
    return res.status(500).json({ error: 'FAILED_TO_BUILD_TEMPLATE_PREVIEW' });
  }
});

router.delete('/my/:identifier', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }
    if (!isCreatorRole(user.role)) {
      return res.status(403).json({ error: 'CREATOR_ROLE_REQUIRED' });
    }

    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    if (template.creatorId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN_TEMPLATE_OWNER_ONLY' });
    }
    if (template.lifecycleStatus !== 'CREATED') {
      return res.status(409).json({ error: 'ONLY_DRAFT_TEMPLATE_CAN_BE_DELETED' });
    }

    const deleted = await updateTemplate(req.params.identifier, {
      isActive: false,
      isDeleted: true,
    });
    if (!deleted) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(deleted);
  } catch (error) {
    console.error('Error deleting creator template:', error);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_CREATOR_TEMPLATE' });
  }
});

router.get('/:identifier', async (req, res) => {
  try {
    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template || !isMarketplaceVisibleTemplate(template)) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    const user = await getAuthUser(req);
    const guestToken = getGuestToken(req);
    await recordTemplateView({
      templateId: template.id,
      viewerUserId: user?.id || null,
      viewerGuestToken: user ? null : guestToken,
      sessionId: typeof req.headers['x-session-id'] === 'string' ? req.headers['x-session-id'] : null,
      referrer: typeof req.headers.referer === 'string' ? req.headers.referer : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    }).catch((error) => {
      console.warn('Failed to record template view:', error);
    });
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching public template:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_PUBLIC_TEMPLATE' });
  }
});

router.get('/:identifier/fields', async (req, res) => {
  try {
    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template || !isMarketplaceVisibleTemplate(template)) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }

    const fields = await getTemplateFieldsByIdentifier(req.params.identifier);
    const user = await getAuthUser(req);
    const guestToken = getGuestToken(req);
    await recordTemplateView({
      templateId: template.id,
      viewerUserId: user?.id || null,
      viewerGuestToken: user ? null : guestToken,
      sessionId: typeof req.headers['x-session-id'] === 'string' ? req.headers['x-session-id'] : null,
      referrer: typeof req.headers.referer === 'string' ? req.headers.referer : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    }).catch((error) => {
      console.warn('Failed to record template field view:', error);
    });
    return res.status(200).json(fields);
  } catch (error) {
    console.error('Error fetching template fields:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_TEMPLATE_FIELDS' });
  }
});

router.post('/:identifier/view', async (req, res) => {
  try {
    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template || !isMarketplaceVisibleTemplate(template)) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    const user = await getAuthUser(req);
    const guestToken = getGuestToken(req);
    await recordTemplateView({
      templateId: template.id,
      viewerUserId: user?.id || null,
      viewerGuestToken: user ? null : guestToken,
      sessionId: typeof req.headers['x-session-id'] === 'string' ? req.headers['x-session-id'] : null,
      referrer: typeof req.headers.referer === 'string' ? req.headers.referer : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Error recording template view:', error);
    return res.status(500).json({ error: 'FAILED_TO_RECORD_TEMPLATE_VIEW' });
  }
});

router.post('/:identifier/clone', async (req, res) => {
  try {
    const template = await getTemplateByIdentifier(req.params.identifier);
    if (!template || !isMarketplaceVisibleTemplate(template)) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    const latestVersion = await getLatestTemplateVersion(template.id);
    const templateKeyForClone = latestVersion?.templateKey || template.templateKey;
    const priceForClone = latestVersion?.price ?? template.price;
    const creatorShareForClone = latestVersion?.creatorShare ?? template.creatorShare;

    const user = await getAuthUser(req);
    const requestGuestToken =
      (typeof req.headers['x-guest-token'] === 'string' ? req.headers['x-guest-token'].trim() : '') ||
      getGuestToken(req) ||
      crypto.randomBytes(32).toString('hex');

    const invitation = await prisma.$transaction(async (tx) => {
      const createdInvitation = await tx.invitation.create({
        data: {
          id: crypto.randomUUID(),
          slug: generateSlug(),
          templateId: template.id,
          templateKey: templateKeyForClone,
          status: InvitationStatus.DRAFT,
          isPublished: false,
          canShare: false,
          isPaid: false,
          ownerType: user ? 'USER' : 'GUEST',
          ownerId: user?.id || requestGuestToken,
          createdBy: user?.id || requestGuestToken,
          userId: user?.id || null,
          guestToken: user ? null : requestGuestToken,
          countryCode: 'GLOBAL',
          language: 'ko',
        },
        select: {
          id: true,
        },
      });

      const usage = await tx.templateUsage.create({
        data: {
          templateId: template.id,
          templateVersionId: latestVersion?.id || null,
          invitationId: createdInvitation.id,
          usedByUserId: user?.id || null,
          usedByGuestToken: user ? null : requestGuestToken,
          priceSnapshot: priceForClone,
          creatorShareSnapshot: creatorShareForClone,
        },
        select: {
          id: true,
        },
      });

      const revenue = calculateRevenue(priceForClone, creatorShareForClone);
      await tx.templateRevenue.create({
        data: {
          usageId: usage.id,
          templateId: template.id,
          creatorId: template.creatorId || null,
          totalAmount: revenue.price,
          creatorRevenue: template.creatorId ? revenue.creatorEarnings : 0,
          platformRevenue: template.creatorId ? revenue.platformEarnings : revenue.price,
          creatorShareSnapshot: revenue.creatorShare,
        },
      });

      await tx.templateClone.create({
        data: {
          templateId: template.id,
          templateVersionId: latestVersion?.id || null,
          templateUsageId: usage.id,
          invitationId: createdInvitation.id,
          clonedByUserId: user?.id || null,
          clonedByGuestToken: user ? null : requestGuestToken,
        },
      });

      return createdInvitation;
    });

    const editorUrl = user
      ? `/editor/${invitation.id}`
      : `/editor/${invitation.id}?token=${requestGuestToken}`;

    return res.status(201).json({
      editor_url: editorUrl,
      guest_token: user ? null : requestGuestToken,
      invitation_id: invitation.id,
      template_version_id: latestVersion?.id || null,
      template_key: templateKeyForClone,
    });
  } catch (error) {
    console.error('Error cloning template to invitation:', error);
    return res.status(500).json({ error: 'FAILED_TO_CLONE_TEMPLATE' });
  }
});

export default router;
