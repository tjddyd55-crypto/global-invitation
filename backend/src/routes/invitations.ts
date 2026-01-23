import { Router } from 'express';
import prisma from '../lib/prisma';
import { generateSlug } from '../utils/slug';

const router = Router();

// POST /api/invitations - Create a new invitation
router.post('/', async (req, res) => {
  try {
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
    const invitation = await prisma.invitation.create({
      data: {
        slug,
        status: 'draft',
        isPaid: false,
        canShare: false,
        templateKey: req.body.templateKey || 'basic',
        countryCode: req.body.countryCode || 'GLOBAL',
        language: req.body.language || 'en',
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

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        id: true,
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

    res.status(200).json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// PUT /api/invitations/:slug - Update invitation
router.put('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, eventDate, locationText, message, templateKey, musicKey } = req.body;

    // Check if invitation exists
    const existing = await prisma.invitation.findUnique({
      where: { slug },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Update only allowed fields
    const updateData: {
      title?: string;
      eventDate?: Date | null;
      locationText?: string | null;
      message?: string | null;
      templateKey?: string;
      musicKey?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null;
    if (locationText !== undefined) updateData.locationText = locationText;
    if (message !== undefined) updateData.message = message;
    if (templateKey !== undefined) updateData.templateKey = templateKey;
    if (musicKey !== undefined) updateData.musicKey = musicKey || null;

    const invitation = await prisma.invitation.update({
      where: { slug },
      data: updateData,
      select: {
        id: true,
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

    res.status(200).json(invitation);
  } catch (error) {
    console.error('Error updating invitation:', error);
    res.status(500).json({ error: 'Failed to update invitation' });
  }
});

export default router;
