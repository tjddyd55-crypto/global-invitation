import { Router, type Request } from 'express';
import { getAdminSession } from '../lib/adminSession';
import prisma from '../lib/prisma';
import { buildRsvpSummary } from '../rsvp/rsvpSummary';

const router = Router();

const RSVP_WINDOW_MS = 5 * 60_000;
const RSVP_MAX_ATTEMPTS = 10;
const RSVP_ATTENDANCE_VALUES = new Set(['yes', 'no', 'maybe']);
const rsvpAttemptsByIp = new Map<string, number[]>();

type NormalizedRsvpPayload = {
  guestName: string;
  attendance: 'yes' | 'no' | 'maybe';
  guestCount: number;
  mealChoice: string;
  message: string;
};

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

function parseRsvpPayload(source: unknown): NormalizedRsvpPayload {
  const payload = (source ?? {}) as Record<string, unknown>;
  return {
    guestName: normalizeText(payload.guestName),
    attendance: normalizeText(payload.attendance).toLowerCase() as NormalizedRsvpPayload['attendance'],
    guestCount: normalizeGuestCount(payload.guestCount),
    mealChoice: normalizeText(payload.mealChoice),
    message: normalizeText(payload.message),
  };
}

function validateRsvpPayload(payload: NormalizedRsvpPayload): string | null {
  if (!payload.guestName || !RSVP_ATTENDANCE_VALUES.has(payload.attendance)) {
    return 'INVALID_RSVP_PAYLOAD';
  }

  if (payload.guestName.length > 80) {
    return 'GUEST_NAME_TOO_LONG';
  }

  if (payload.guestCount < 1 || payload.guestCount > 99) {
    return 'INVALID_GUEST_COUNT';
  }

  if (payload.mealChoice.length > 80) {
    return 'MEAL_CHOICE_TOO_LONG';
  }

  if (payload.message.length > 1000) {
    return 'MESSAGE_TOO_LONG';
  }

  return null;
}

function validateAttendanceFilter(value: string): value is 'yes' | 'no' | 'maybe' {
  return RSVP_ATTENDANCE_VALUES.has(value);
}

function isRsvpEnabled(invitationData: unknown): boolean {
  if (!invitationData || typeof invitationData !== 'object' || Array.isArray(invitationData)) {
    return false;
  }
  const data = invitationData as {
    rsvpEnabled?: unknown;
    rsvp?: { enabled?: unknown };
    attendanceEnabled?: unknown;
  };
  if (data.rsvp?.enabled === true) return true;
  if (data.rsvpEnabled === true) return true;
  if (data.attendanceEnabled === true) return true;
  return false;
}

function isRsvpClosed(deadline: Date | null | undefined): boolean {
  return Boolean(deadline && deadline.getTime() < Date.now());
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
    const payload = parseRsvpPayload(req.body);
    const validationError = validateRsvpPayload(payload);

    if (!invitationSlug) {
      return res.status(400).json({ error: 'INVALID_RSVP_PAYLOAD' });
    }

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { slug: invitationSlug, isDeleted: false },
      select: {
        id: true,
        slug: true,
        userId: true,
        title: true,
        isPublished: true,
        data: true,
        rsvpDeadline: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    if (!invitation.isPublished) {
      return res.status(403).json({ error: 'INVITATION_NOT_PUBLISHED' });
    }

    if (!isRsvpEnabled(invitation.data)) {
      return res.status(403).json({ error: 'RSVP_DISABLED' });
    }

    if (isRsvpClosed(invitation.rsvpDeadline)) {
      return res.status(403).json({ error: 'RSVP_CLOSED' });
    }

    const existing = await prisma.rSVP.findUnique({
      where: {
        invitationId_guestName: {
          invitationId: invitation.id,
          guestName: payload.guestName,
        },
      },
      select: { id: true },
    });

    const rsvp = await prisma.rSVP.upsert({
      where: {
        invitationId_guestName: {
          invitationId: invitation.id,
          guestName: payload.guestName,
        },
      },
      create: {
        invitationId: invitation.id,
        guestName: payload.guestName,
        attendance: payload.attendance,
        guestCount: payload.guestCount,
        mealChoice: payload.mealChoice || null,
        message: payload.message || null,
      },
      update: {
        attendance: payload.attendance,
        guestCount: payload.guestCount,
        mealChoice: payload.mealChoice || null,
        message: payload.message || null,
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

    const isNew = !existing;
    if (isNew && invitation.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: invitation.userId,
            type: 'RSVP_NEW',
            title: '새 RSVP 응답',
            body: `${payload.guestName}님이 ${payload.attendance}로 응답했습니다.`,
            linkPath: `/editor/${invitation.id}`,
            metadata: { invitationId: invitation.id, rsvpId: rsvp.id },
          },
        });
      } catch (notifyError) {
        console.warn('Failed to create RSVP notification:', notifyError);
      }
    }

    return res.status(existing ? 200 : 201).json({
      success: true,
      mode: existing ? 'updated' : 'created',
      rsvp,
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_RSVP' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const rsvpId = normalizeText(req.params.id);
    const payload = parseRsvpPayload(req.body);
    const validationError = validateRsvpPayload(payload);

    if (!rsvpId) {
      return res.status(400).json({ error: 'RSVP_ID_REQUIRED' });
    }

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existing = await prisma.rSVP.findUnique({
      where: { id: rsvpId },
      select: {
        id: true,
        guestName: true,
        invitation: {
          select: {
            id: true,
            isPublished: true,
            isDeleted: true,
            data: true,
            rsvpDeadline: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'RSVP_NOT_FOUND' });
    }

    if (existing.invitation.isDeleted) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    if (payload.guestName !== existing.guestName) {
      return res.status(400).json({ error: 'GUEST_NAME_MISMATCH' });
    }

    if (!existing.invitation.isPublished) {
      return res.status(403).json({ error: 'INVITATION_NOT_PUBLISHED' });
    }

    if (!isRsvpEnabled(existing.invitation.data)) {
      return res.status(403).json({ error: 'RSVP_DISABLED' });
    }

    if (isRsvpClosed(existing.invitation.rsvpDeadline)) {
      return res.status(403).json({ error: 'RSVP_CLOSED' });
    }

    const rsvp = await prisma.rSVP.update({
      where: { id: rsvpId },
      data: {
        attendance: payload.attendance,
        guestCount: payload.guestCount,
        mealChoice: payload.mealChoice || null,
        message: payload.message || null,
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

    return res.status(200).json({
      success: true,
      mode: 'updated',
      rsvp,
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_RSVP' });
  }
});

router.get('/:invitationId', async (req, res) => {
  try {
    const adminSession = ensureAdminApiSession(req);
    if (!adminSession) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const invitationId = normalizeText(req.params.invitationId);
    const search = normalizeText(req.query.search);
    const attendance = normalizeText(req.query.attendance).toLowerCase();
    if (!invitationId) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }
    if (attendance && !validateAttendanceFilter(attendance)) {
      return res.status(400).json({ error: 'INVALID_ATTENDANCE_FILTER' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, isDeleted: false },
      select: {
        id: true,
        slug: true,
        shareSlug: true,
        title: true,
        rsvpDeadline: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    const guests = await prisma.rSVP.findMany({
      where: {
        invitationId,
        ...(search
          ? {
              guestName: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(attendance ? { attendance } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        guestName: true,
        attendance: true,
        guestCount: true,
        mealChoice: true,
        message: true,
        isHidden: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      invitation,
      ...buildRsvpSummary(guests),
      guests,
    });
  } catch (error) {
    console.error('Error fetching RSVP guest list:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_RSVPS' });
  }
});

export default router;
