import type { Request } from 'express';
import prisma from '../lib/prisma';
import { buildRsvpSummary } from '../rsvp/rsvpSummary';

const REFERRER_MAX_LENGTH = 120;

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function normalizeSessionId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, 120);
}

export function detectDeviceType(userAgent: string): DeviceType {
  const normalized = userAgent.toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('ipad') || normalized.includes('tablet')) return 'tablet';
  if (
    normalized.includes('mobi') ||
    normalized.includes('iphone') ||
    normalized.includes('android')
  ) {
    return 'mobile';
  }
  if (
    normalized.includes('windows') ||
    normalized.includes('macintosh') ||
    normalized.includes('linux')
  ) {
    return 'desktop';
  }
  return 'unknown';
}

export function normalizeReferrer(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return 'direct';
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (!hostname) return 'unknown';
    if (hostname.includes('kakao')) return 'kakao';
    if (hostname.includes('facebook') || hostname.includes('fb.')) return 'facebook';
    if (hostname.includes('instagram') || hostname.includes('instagr.am')) return 'instagram';

    return hostname.slice(0, REFERRER_MAX_LENGTH) || 'other';
  } catch {
    return 'unknown';
  }
}

export function resolveCountryCode(req: Request): string | null {
  const headerValue =
    req.headers['cf-ipcountry'] ||
    req.headers['x-vercel-ip-country'] ||
    req.headers['x-country-code'];

  const normalized =
    typeof headerValue === 'string'
      ? headerValue.trim().toUpperCase()
      : Array.isArray(headerValue) && headerValue.length > 0
        ? String(headerValue[0]).trim().toUpperCase()
        : '';

  if (!normalized) return null;
  return normalized.slice(0, 8);
}

export async function getInvitationAnalyticsSummary(invitationId: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalViews,
    viewsToday,
    viewsLast7Days,
    uniqueSessionRows,
    deviceGroups,
    referrerGroups,
    rsvpRows,
  ] = await Promise.all([
    prisma.invitationView.count({
      where: { invitationId },
    }),
    prisma.invitationView.count({
      where: {
        invitationId,
        viewedAt: {
          gte: startOfToday,
        },
      },
    }),
    prisma.invitationView.count({
      where: {
        invitationId,
        viewedAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    prisma.invitationView.findMany({
      where: {
        invitationId,
        sessionId: {
          not: null,
        },
      },
      distinct: ['sessionId'],
      select: {
        sessionId: true,
      },
    }),
    prisma.invitationView.groupBy({
      by: ['deviceType'],
      where: { invitationId },
      _count: {
        _all: true,
      },
    }),
    prisma.invitationView.groupBy({
      by: ['referrer'],
      where: { invitationId },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          referrer: 'desc',
        },
      },
    }),
    prisma.rSVP.findMany({
      where: { invitationId },
      select: {
        attendance: true,
        guestCount: true,
      },
    }),
  ]);

  const deviceBreakdown = deviceGroups.reduce<Record<DeviceType, number>>(
    (acc, item) => {
      const key = (item.deviceType as DeviceType | null) || 'unknown';
      acc[key] = item._count._all;
      return acc;
    },
    {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      unknown: 0,
    }
  );

  const rsvpSummary = buildRsvpSummary(rsvpRows);
  const uniqueSessions = uniqueSessionRows.length;
  const conversionRate = uniqueSessions > 0 ? rsvpSummary.totalGuests / uniqueSessions : 0;

  return {
    totalViews,
    uniqueSessions,
    viewsToday,
    viewsLast7Days,
    deviceBreakdown,
    referrerBreakdown: referrerGroups.map((item) => ({
      referrer: item.referrer || 'unknown',
      count: item._count._all,
    })),
    rsvpSummary,
    conversionRate,
  };
}
