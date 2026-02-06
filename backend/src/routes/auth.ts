import { Router } from 'express';
import prisma from '../lib/prisma';
import {
  buildMagicLink,
  createToken,
  getAuthUser,
  getMagicLinkExpiry,
  getSessionExpiry,
  isValidEmail,
  normalizeEmail,
  transferGuestData,
} from '../lib/auth';
import { sendMagicLinkEmail } from '../lib/mailer';

const router = Router();

router.post('/magic-link', async (req, res) => {
  try {
    const { email, guestToken, draftSlug } = req.body ?? {};

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail },
      update: {},
    });

    const token = createToken();
    const expiresAt = getMagicLinkExpiry();
    const link = buildMagicLink(token, typeof draftSlug === 'string' ? draftSlug : undefined);

    const normalizedGuestToken = typeof guestToken === 'string' ? guestToken.trim() : null;
    await prisma.magicLinkToken.create({
      data: {
        token,
        email: normalizedEmail,
        userId: user.id,
        guestToken: normalizedGuestToken || null,
        draftSlug: typeof draftSlug === 'string' ? draftSlug : null,
        expiresAt,
      },
    });

    let delivered = false;
    try {
      delivered = await sendMagicLinkEmail({ to: normalizedEmail, link });
    } catch (err) {
      console.warn('Failed to send magic link email:', err);
    }

    if (!delivered) {
      console.info(`[auth] Magic link for ${normalizedEmail}: ${link}`);
    }

    const isDev = process.env.NODE_ENV !== 'production';
    res.status(200).json({ success: true, previewLink: !delivered && isDev ? link : undefined });
  } catch (error) {
    console.error('Error creating magic link:', error);
    res.status(500).json({ error: 'Failed to create magic link' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token, guestToken } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const magicToken = await prisma.magicLinkToken.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return res.status(400).json({ error: 'Token not found' });
    }
    if (magicToken.usedAt) {
      return res.status(400).json({ error: 'Token already used' });
    }
    if (magicToken.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const now = new Date();
    await prisma.magicLinkToken.update({
      where: { id: magicToken.id },
      data: { usedAt: now },
    });

    const sessionToken = createToken();
    const session = await prisma.authSession.create({
      data: {
        token: sessionToken,
        userId: magicToken.userId,
        expiresAt: getSessionExpiry(),
      },
      include: { user: true },
    });

    const mergeGuestToken =
      typeof guestToken === 'string' && guestToken.trim()
        ? guestToken.trim()
        : magicToken.guestToken || undefined;

    if (mergeGuestToken) {
      await prisma.invitation.updateMany({
        where: {
          guestToken: mergeGuestToken,
          userId: null,
        },
        data: {
          userId: session.userId,
          guestToken: null,
        },
      });
    }

    res.status(200).json({
      token: sessionToken,
      user: { id: session.user.id, email: session.user.email },
      redirectSlug: magicToken.draftSlug || null,
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ error: 'Failed to verify magic link' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/transfer-guest', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const guestToken = typeof req.body?.guestToken === 'string' ? req.body.guestToken.trim() : '';
    if (!guestToken) {
      return res.status(400).json({ error: 'guestToken is required' });
    }

    const transferredCount = await transferGuestData(guestToken, user.id);
    res.status(200).json({ transferredCount });
  } catch (error) {
    console.error('Error transferring guest data:', error);
    res.status(500).json({ error: 'Failed to transfer guest data' });
  }
});

export default router;
