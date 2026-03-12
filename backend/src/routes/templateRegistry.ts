import { Router } from 'express';
import crypto from 'crypto';
import { InvitationStatus } from '@prisma/client';
import {
  calculateRevenue,
  getTemplateById,
  getLatestTemplateVersion,
  getTemplateFields,
  listVisibleTemplatesBySort,
  recordTemplateView,
} from '../admin/templateStore';
import prisma from '../lib/prisma';
import { getAuthUser, getGuestToken } from '../lib/auth';
import { generateSlug } from '../utils/slug';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const sortQuery = typeof req.query?.sort === 'string' ? req.query.sort.toLowerCase() : 'newest';
    const sort: 'newest' | 'popular' | 'trending' =
      sortQuery === 'popular' || sortQuery === 'trending' ? sortQuery : 'newest';
    const templates = await listVisibleTemplatesBySort({ sort });
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing public templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_PUBLIC_TEMPLATES' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted || template.status !== 'PUBLISHED') {
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

router.get('/:id/fields', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted || template.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }

    const fields = await getTemplateFields(req.params.id);
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

router.post('/:id/view', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted || template.status !== 'PUBLISHED') {
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

router.post('/:id/clone', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted || template.status !== 'PUBLISHED') {
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
