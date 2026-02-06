import { Router } from 'express';
import { InvitationStatus } from '@prisma/client';
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
    const invitation = await prisma.invitation.create({
      data: {
        slug,
        ownerType,
        ownerId,
        status: InvitationStatus.DRAFT,
        isPaid: false,
        canShare: false,
        templateKey: req.body.templateKey || 'basic',
        countryCode: req.body.countryCode || 'GLOBAL',
        language: req.body.language || 'en',
        userId: user?.id ?? null,
        guestToken: user ? null : ownerId,
      },
      select: {
        id: true,
        slug: true,
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
    const user = await getAuthUser(req);
    const guestToken = getGuestToken(req);

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        id: true,
        userId: true,
        guestToken: true,
        slug: true,
        title: true,
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
      return res.status(404).json({ error: 'Invitation not found' });
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
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// PUT /api/invitations/:slug - Update invitation
router.put('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, eventDate, locationText, message, templateKey, musicKey, status } = req.body;
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
      templateKey?: string;
      musicKey?: string | null;
      status?: InvitationStatus;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null;
    if (locationText !== undefined) updateData.locationText = locationText;
    if (message !== undefined) updateData.message = message;
    if (templateKey !== undefined) updateData.templateKey = templateKey;
    if (musicKey !== undefined) updateData.musicKey = musicKey || null;
    if (normalizedStatus !== undefined && allowedStatuses.has(normalizedStatus)) {
      updateData.status = normalizedStatus;
    }

    const invitation = await prisma.invitation.update({
      where: { slug },
      data: updateData,
      select: {
        id: true,
        userId: true,
        guestToken: true,
        slug: true,
        title: true,
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
