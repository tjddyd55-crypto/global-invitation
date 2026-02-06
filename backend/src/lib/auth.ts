import crypto from 'crypto';
import type { Request } from 'express';
import type { Invitation } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';

const MAGIC_LINK_TTL_MINUTES = 30;
const SESSION_TTL_DAYS = 30;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function createToken(size = 32): string {
  return crypto.randomBytes(size).toString('hex');
}

export function getMagicLinkExpiry(): Date {
  return new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function resolveFrontendBaseUrl(): string {
  return process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export function buildMagicLink(token: string, draftSlug?: string): string {
  const baseUrl = resolveFrontendBaseUrl();
  const url = new URL('/auth/verify', baseUrl);
  url.searchParams.set('token', token);
  if (draftSlug) {
    url.searchParams.set('draft', draftSlug);
  }
  return url.toString();
}

export function getGuestToken(req: Request): string | null {
  const header = req.headers['x-guest-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  return null;
}

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer', '').trim();
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

export type GuestActor = {
  type: 'GUEST';
  guestToken: string;
};

export type UserActor = {
  type: 'USER';
  userId: string;
};

export type ActorIdentity = GuestActor | UserActor;

export async function transferGuestData(guestToken: string, userId: string) {
  if (!guestToken || !userId) {
    return 0;
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const result = await tx.invitation.updateMany({
      where: {
        ownerType: 'GUEST',
        ownerId: guestToken,
      },
      data: {
        ownerType: 'USER',
        ownerId: userId,
        userId,
        guestToken: null,
      },
    });
    return result.count;
  });
}

export function canEdit(invitation: Invitation, actor: ActorIdentity) {
  if (actor.type === 'USER') {
    return invitation.ownerType === 'USER' && invitation.ownerId === actor.userId;
  }

  if (actor.type === 'GUEST') {
    return invitation.ownerType === 'GUEST' && invitation.ownerId === actor.guestToken;
  }

  return false;
}
