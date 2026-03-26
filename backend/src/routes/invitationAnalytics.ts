import { Router } from 'express';
import {
  detectDeviceType,
  normalizeReferrer,
  normalizeSessionId,
  resolveClientIp,
  resolveCountryCode,
} from '../analytics/invitationAnalytics';
import prisma from '../lib/prisma';

const router = Router();
const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

function normalizeHeaderValue(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

router.post('/:slug/view', async (req, res) => {
  try {
    const slug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';
    if (!slug) {
      return res.status(400).json({ error: 'INVITATION_SLUG_REQUIRED' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        isPublished: true,
        userId: true,
        shareSlug: true,
        title: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND' });
    }

    if (!invitation.isPublished) {
      return res.status(403).json({ error: 'INVITATION_NOT_PUBLISHED' });
    }

    const sessionId = normalizeSessionId(req.body?.sessionId);
    if (sessionId) {
      const dedupeThreshold = new Date(Date.now() - VIEW_DEDUPE_WINDOW_MS);
      const existing = await prisma.invitationView.findFirst({
        where: {
          invitationId: invitation.id,
          sessionId,
          viewedAt: {
            gte: dedupeThreshold,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        return res.status(200).json({ success: true, deduped: true });
      }
    }

    const userAgent = normalizeHeaderValue(req.headers['user-agent'], 500);
    const viewerIp = normalizeHeaderValue(resolveClientIp(req), 120);
    const referrerHeader = req.headers.referer || req.headers.referrer;
    const referrer = normalizeReferrer(
      Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader
    );

    await prisma.invitationView.create({
      data: {
        invitationId: invitation.id,
        sessionId,
        userAgent,
        viewerIp,
        referrer,
        deviceType: detectDeviceType(userAgent || ''),
        countryCode: resolveCountryCode(req),
      },
    });

    if (invitation.userId) {
      const dedupeKey = `${invitation.id}:INVITATION_VIEW`;
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const recent = await prisma.notification.findFirst({
        where: {
          userId: invitation.userId,
          dedupeKey,
          createdAt: { gte: since },
        },
        select: { id: true },
      });

      if (!recent) {
        try {
          await prisma.notification.create({
            data: {
              userId: invitation.userId,
              type: 'INVITATION_VIEW',
              title: '초대장 방문',
              body: '공개 초대장에 새 방문이 기록되었습니다.',
              linkPath: invitation.shareSlug ? `/i/${invitation.shareSlug}` : `/editor/${invitation.id}`,
              dedupeKey,
              metadata: { invitationId: invitation.id },
            },
          });
        } catch (notifyError) {
          console.warn('Failed to create view notification:', notifyError);
        }
      }
    }

    return res.status(201).json({ success: true, deduped: false });
  } catch (error) {
    console.error('Error tracking invitation view:', error);
    return res.status(500).json({ error: 'FAILED_TO_TRACK_INVITATION_VIEW' });
  }
});

export default router;
