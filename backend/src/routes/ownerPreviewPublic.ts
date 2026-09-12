import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyOwnerPreviewToken } from '../lib/ownerPreviewToken';

const router = Router();

const INVITATION_SELECT = {
  id: true,
  slug: true,
  shareSlug: true,
  templateId: true,
  title: true,
  data: true,
  dataJson: true,
  createdBy: true,
  isPublished: true,
  eventDate: true,
  locationText: true,
  message: true,
  templateKey: true,
  musicKey: true,
  countryCode: true,
  language: true,
  status: true,
  isPaid: true,
  canShare: true,
  paidAt: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
};

router.get('/', async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'TOKEN_REQUIRED' });
    }

    const payload = verifyOwnerPreviewToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: payload.invitationId,
        userId: payload.userId,
        isDeleted: false,
      },
      select: INVITATION_SELECT,
    });

    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    return res.status(200).json({
      id: invitation.id,
      slug: invitation.slug,
      shareSlug: invitation.shareSlug,
      templateId: invitation.templateId,
      title: invitation.title,
      data: invitation.dataJson ?? invitation.data,
      dataJson: invitation.dataJson ?? invitation.data,
      createdBy: invitation.createdBy,
      isPublished: invitation.isPublished,
      eventDate: invitation.eventDate,
      locationText: invitation.locationText,
      message: invitation.message,
      templateKey: invitation.templateKey,
      musicKey: invitation.musicKey,
      countryCode: invitation.countryCode,
      language: invitation.language,
      status: invitation.status.toLowerCase(),
      isPaid: invitation.isPaid,
      canShare: invitation.canShare,
      paidAt: invitation.paidAt,
      publishedAt: invitation.publishedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      previewMode: 'owner',
    });
  } catch (error) {
    console.error('Error fetching owner preview:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_OWNER_PREVIEW' });
  }
});

export default router;
