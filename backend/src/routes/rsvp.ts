import { Router, type Request } from 'express';
import { getAdminSession } from '../lib/adminSession';
import prisma from '../lib/prisma';

const router = Router();

const RSVP_WINDOW_MS = 5 * 60_000;
const RSVP_MAX_ATTEMPTS = 10;
const RSVP_ATTENDANCE_VALUES = new Set(['yes', 'no', 'maybe']);
const rsvpAttemptsByIp = new Map<string, number[]>();

function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function consumeRsvpAttempt(ip: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recentAttempts = (rsvpAttemptsByIp.get(ip) || []).filter(
    (timestamp) => now - timestamp < RSVP_WINDOW_MS
  );

  if (recentAttempts.length >= RSVP_MAX_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((RSVP_WINDOW_MS - (now - oldestAttempt)) / 1000)
    );
    rsvpAttemptsByIp.set(ip, recentAttempts);
    return { limited: true, retryAfterSeconds };
  }

  recentAttempts.push(now);
  rsvpAttemptsByIp.set(ip, recentAttempts);
  return { limited: false, retryAfterSeconds: 0 };
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeGuestCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.floor(parsed);
    }
  }

  return 1;
}

function ensureAdminApiSession(req: Request) {
  return getAdminSession(req);
}

router.post('/', async (req, res) => {
  try {
    const ip = resolveClientIp(req);
    const rateLimit = consumeRsvpAttempt(ip);
    if (rateLimit.limited) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({ error: 'TOO_MANY_RSVP_REQUESTS' });
    }

    const invitationSlug = normalizeText(req.body?.invitationSlug);
    const guestName = normalizeText(req.body?.guestName);
    const attendance = normalizeText(req.body?.attendance).toLowerCase();
    const guestCount = normalizeGuestCount(req.body?.guestCount);
    const mealChoice = normalizeText(req.body?.mealChoice);
    const message = normalizeText(req.body?.message);

    if (!invitationSlug || !guestName || !RSVP_ATTENDANCE_VALUES.has(attendance)) {
      return res.status(400).json({ error: 'INVALID_RSVP_PAYLOAD' });
    }

    if (guestName.length > 80) {
      return res.status(400).json({ error: 'GUEST_NAME_TOO_LONG' });
    }

    if (guestCount < 1 || guestCount > 10) {
      return res.status(400).json({ error: 'INVALID_GUEST_COUNT' });
    }

    if (mealChoice.length > 80) {
      return res.status(400).json({ error: 'MEAL_CHOICE_TOO_LONG' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'MESSAGE_TOO_LONG' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { slug: invitationSlug },
      select: {
        id: true,
        isPublished: true,
        data: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    if (!invitation.isPublished) {
      return res.status(403).json({ error: 'INVITATION_NOT_PUBLISHED' });
    }

    const invitationData = invitation.data as { rsvp?: { enabled?: boolean } } | null;
    const isRsvpEnabled = invitationData?.rsvp?.enabled === true;
    if (!isRsvpEnabled) {
      return res.status(403).json({ error: 'RSVP_DISABLED' });
    }

    const rsvp = await prisma.rSVP.create({
      data: {
        invitationId: invitation.id,
        guestName,
        attendance,
        guestCount,
        mealChoice: mealChoice || null,
        message: message || null,
      },
      select: {
        id: true,
        guestName: true,
        attendance: true,
        guestCount: true,
        mealChoice: true,
        message: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      rsvp,
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_RSVP' });
  }
});

router.get('/:invitationId', async (req, res) => {
  try {
    const adminSession = ensureAdminApiSession(req);
    if (!adminSession) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const invitationId = normalizeText(req.params.invitationId);
    if (!invitationId) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    const guests = await prisma.rSVP.findMany({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        guestName: true,
        attendance: true,
        guestCount: true,
        mealChoice: true,
        message: true,
        createdAt: true,
      },
    });

    const summary = guests.reduce(
      (acc, guest) => {
        acc.totalGuests += guest.guestCount;
        if (guest.attendance === 'yes') acc.attending += guest.guestCount;
        if (guest.attendance === 'no') acc.declined += guest.guestCount;
        if (guest.attendance === 'maybe') acc.maybe += guest.guestCount;
        return acc;
      },
      {
        totalGuests: 0,
        attending: 0,
        declined: 0,
        maybe: 0,
      }
    );

    return res.status(200).json({
      invitation,
      ...summary,
      guests,
    });
  } catch (error) {
    console.error('Error fetching RSVP guest list:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_RSVPS' });
  }
});

export default router;
