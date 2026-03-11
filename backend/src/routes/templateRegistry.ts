import { Router } from 'express';
import crypto from 'crypto';
import { InvitationStatus } from '@prisma/client';
import { getTemplateById, getTemplateFields, listVisibleTemplates } from '../admin/templateStore';
import prisma from '../lib/prisma';
import { getAuthUser, getGuestToken } from '../lib/auth';
import { generateSlug } from '../utils/slug';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const templates = await listVisibleTemplates();
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing public templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_PUBLIC_TEMPLATES' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching public template:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_PUBLIC_TEMPLATE' });
  }
});

router.get('/:id/fields', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }

    const fields = await getTemplateFields(req.params.id);
    return res.status(200).json(fields);
  } catch (error) {
    console.error('Error fetching template fields:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_TEMPLATE_FIELDS' });
  }
});

router.post('/:id/clone', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }

    const user = await getAuthUser(req);
    const requestGuestToken =
      (typeof req.headers['x-guest-token'] === 'string' ? req.headers['x-guest-token'].trim() : '') ||
      getGuestToken(req) ||
      crypto.randomBytes(32).toString('hex');

    const invitation = await prisma.invitation.create({
      data: {
        id: crypto.randomUUID(),
        slug: generateSlug(),
        templateId: template.id,
        templateKey: template.templateKey,
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

    const editorUrl = user
      ? `/editor/${invitation.id}`
      : `/editor/${invitation.id}?token=${requestGuestToken}`;

    return res.status(201).json({
      editor_url: editorUrl,
      guest_token: user ? null : requestGuestToken,
      invitation_id: invitation.id,
    });
  } catch (error) {
    console.error('Error cloning template to invitation:', error);
    return res.status(500).json({ error: 'FAILED_TO_CLONE_TEMPLATE' });
  }
});

export default router;
