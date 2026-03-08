import { Router } from 'express';
import { InvitationStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { generateSlug } from '../utils/slug';
import { createToken, getAuthUser, getGuestToken } from '../lib/auth';

const router = Router();

type InvitationSummary = {
  id: string;
  slug: string;
  title: string | null;
  templateKey: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const INVITATION_STATUS_VALUES = new Set<string>(['DRAFT', 'SHARED', 'PUBLISHED']);
const SAMPLE_WEDDING_SLUG = 'sample-wedding';
const SAMPLE_WEDDING_INVITATION = {
  id: 'sample-wedding',
  slug: SAMPLE_WEDDING_SLUG,
  title: '샘플 웨딩 초대장',
  eventDate: '2025-04-13T17:20:00',
  locationText: '더링크호텔 서울 3층 베일리홀',
  message: '샘플 초대장입니다. 정상 렌더링/공유/메타 검증용.',
  templateKey: 'wedding_classic',
  musicKey: 'piano_wedding',
  countryCode: 'GLOBAL',
  language: 'ko',
  status: 'published',
  isPaid: false,
  canShare: false,
  paidAt: null,
  createdAt: '2025-03-01T00:00:00',
  updatedAt: '2025-03-01T00:00:00',
};

function parseInvitationStatus(value: string | null | undefined): InvitationStatus | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const upper = value.trim().toUpperCase();
  return INVITATION_STATUS_VALUES.has(upper) ? (upper as InvitationStatus) : undefined;
}

function resolveGuestTokenFromBody(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

function normalizeInvitationData(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value === 'object') return value as Prisma.InputJsonValue;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value as Prisma.InputJsonValue;
  }
  return undefined;
}

async function resolveTemplateReference(value: unknown): Promise<{ id: string; templateKey: string } | null> {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const key = value.trim();
  const template = await prisma.template.findFirst({
    where: {
      OR: [{ id: key }, { slug: key }],
      isDeleted: false,
    },
    select: {
      id: true,
      templateKey: true,
    },
  });

  return template ?? null;
}

// GET /api/invitations - List invitations (owner or guest)
router.get('/', async (req, res) => {
  try {
    const owner = typeof req.query.owner === 'string' ? req.query.owner : null;
    const guestToken = typeof req.query.guestToken === 'string' ? req.query.guestToken : null;
    const statusParam = typeof req.query.status === 'string' ? req.query.status : null;
    const status = parseInvitationStatus(statusParam);
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : null;

    if (owner === 'me') {
      const user = await getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const invitations = await prisma.invitation.findMany({
        where: {
          userId: user.id,
          status,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit && !Number.isNaN(limit) ? limit : undefined,
        select: {
          id: true,
          slug: true,
          title: true,
          templateKey: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(invitations as InvitationSummary[]);
    }

    if (guestToken) {
      const invitations = await prisma.invitation.findMany({
        where: {
          guestToken,
          status,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit && !Number.isNaN(limit) ? limit : undefined,
        select: {
          id: true,
          slug: true,
          title: true,
          templateKey: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(invitations as InvitationSummary[]);
    }

    return res.status(400).json({ error: 'Invalid list request' });
  } catch (error) {
    console.error('Error listing invitations:', error);
    res.status(500).json({ error: 'Failed to list invitations' });
  }
});

// POST /api/invitations - Create a new invitation
router.post('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromBody(req.body?.guestToken) || getGuestToken(req);
    const resolvedTemplate = await resolveTemplateReference(
      req.body?.templateId ?? req.body?.templateSlug ?? req.body?.template
    );
    const invitationData = normalizeInvitationData(req.body?.data);

    // Generate unique slug with retry logic
    let slug: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      slug = generateSlug();
      attempts++;

      // Check if slug exists
      const existing = await prisma.invitation.findUnique({
        where: { slug },
      });

      if (!existing) {
        break; // Slug is unique
      }

      if (attempts >= maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique slug' });
      }
    } while (true);

    // Create invitation with default values
    const ownerType = user ? 'USER' : 'GUEST';
    const ownerId = user ? user.id : (guestToken || createToken());
    const resolvedTemplateKey =
      typeof req.body?.templateKey === 'string' && req.body.templateKey.trim()
        ? req.body.templateKey.trim()
        : resolvedTemplate?.templateKey || 'basic';

    const invitation = await prisma.invitation.create({
      data: {
        slug,
        ownerType,
        ownerId,
        createdBy: ownerId,
        status: InvitationStatus.DRAFT,
        isPublished: false,
        isPaid: false,
        canShare: false,
        templateKey: resolvedTemplateKey,
        templateId: resolvedTemplate?.id ?? null,
        data: invitationData,
        countryCode: req.body.countryCode || 'GLOBAL',
        language: req.body.language || 'en',
        userId: user?.id ?? null,
        guestToken: user ? null : ownerId,
      },
      select: {
        id: true,
        slug: true,
        templateId: true,
        templateKey: true,
        title: true,
        data: true,
        createdBy: true,
        isPublished: true,
        status: true,
        canShare: true,
        createdAt: true,
      },
    });

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// GET /api/invitations/:slug - Get invitation by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Sample-only safe response (no DB dependency)
    if (slug === SAMPLE_WEDDING_SLUG) {
      return res.status(200).json({ ...SAMPLE_WEDDING_INVITATION, isOwner: false });
    }

    const user = await getAuthUser(req);
    const guestToken = getGuestToken(req);

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        id: true,
        userId: true,
        guestToken: true,
        slug: true,
        templateId: true,
        title: true,
        data: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const isOwner = invitation.userId
      ? Boolean(user && user.id === invitation.userId)
      : Boolean(invitation.guestToken && guestToken && invitation.guestToken === guestToken);

    const { userId, guestToken: storedGuestToken, ...publicFields } = invitation;

    res.status(200).json({
      ...publicFields,
      isOwner,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(503).json({ error: 'TEMP_UNAVAILABLE' });
  }
});

// PUT /api/invitations/:slug - Update invitation
router.put('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, eventDate, locationText, message, templateKey, musicKey, status } = req.body;
    const resolvedTemplate = await resolveTemplateReference(
      req.body?.templateId ?? req.body?.templateSlug ?? req.body?.template
    );
    const invitationData = normalizeInvitationData(req.body?.data);
    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromBody(req.body?.guestToken) || getGuestToken(req);

    // Check if invitation exists
    const existing = await prisma.invitation.findUnique({
      where: { slug },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const isOwner = existing.userId
      ? Boolean(user && user.id === existing.userId)
      : Boolean(existing.guestToken && guestToken && existing.guestToken === guestToken);

    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowedStatuses = new Set<InvitationStatus>(['DRAFT', 'PUBLISHED']);
    const normalizedStatus = parseInvitationStatus(status);
    if (typeof status === 'string' && status.trim() !== '' && normalizedStatus === undefined) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (normalizedStatus === 'PUBLISHED' && !user) {
      return res.status(403).json({ error: 'Login required to publish' });
    }

    // Update only allowed fields
    const updateData: {
      title?: string;
      eventDate?: Date | null;
      locationText?: string | null;
      message?: string | null;
      templateId?: string | null;
      templateKey?: string;
      data?: Prisma.InputJsonValue;
      musicKey?: string | null;
      status?: InvitationStatus;
      isPublished?: boolean;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null;
    if (locationText !== undefined) updateData.locationText = locationText;
    if (message !== undefined) updateData.message = message;
    if (resolvedTemplate) {
      updateData.templateId = resolvedTemplate.id;
      updateData.templateKey = resolvedTemplate.templateKey;
    } else if (templateKey !== undefined) {
      updateData.templateKey = templateKey;
    }
    if (invitationData !== undefined) updateData.data = invitationData;
    if (musicKey !== undefined) updateData.musicKey = musicKey || null;
    if (normalizedStatus !== undefined && allowedStatuses.has(normalizedStatus)) {
      updateData.status = normalizedStatus;
      updateData.isPublished = normalizedStatus === 'PUBLISHED';
    }

    const invitation = await prisma.invitation.update({
      where: { slug },
      data: updateData as Prisma.InvitationUncheckedUpdateInput,
      select: {
        id: true,
        userId: true,
        guestToken: true,
        slug: true,
        templateId: true,
        title: true,
        data: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    const updatedIsOwner = invitation.userId
      ? Boolean(user && user.id === invitation.userId)
      : Boolean(invitation.guestToken && guestToken && invitation.guestToken === guestToken);

    const { userId, guestToken: storedGuestToken, ...publicFields } = invitation;

    res.status(200).json({
      ...publicFields,
      isOwner: updatedIsOwner,
    });
  } catch (error) {
    console.error('Error updating invitation:', error);
    res.status(500).json({ error: 'Failed to update invitation' });
  }
});

export default router;
