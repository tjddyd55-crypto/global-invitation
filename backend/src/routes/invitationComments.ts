import { Router, type Request } from 'express';
import prisma from '../lib/prisma';
import { getAuthUser, getGuestToken } from '../lib/auth';

const COMMENT_WINDOW_MS = 5 * 60_000;
const COMMENT_MAX_ATTEMPTS = 8;
const commentAttemptsByIp = new Map<string, number[]>();

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

function consumeCommentAttempt(ip: string): { limited: boolean } {
  const now = Date.now();
  const recent = (commentAttemptsByIp.get(ip) || []).filter((ts) => now - ts < COMMENT_WINDOW_MS);
  if (recent.length >= COMMENT_MAX_ATTEMPTS) {
    commentAttemptsByIp.set(ip, recent);
    return { limited: true };
  }
  recent.push(now);
  commentAttemptsByIp.set(ip, recent);
  return { limited: false };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();
}

function countUrls(value: string): number {
  return (value.match(/https?:\/\/|www\./gi) || []).length;
}

async function findInvitationByPublicSlug(slug: string) {
  const normalized = slug.trim();
  if (!normalized) return null;
  return prisma.invitation.findFirst({
    where: {
      isDeleted: false,
      OR: [{ shareSlug: normalized }, { slug: normalized }],
    },
    select: {
      id: true,
      slug: true,
      shareSlug: true,
      dataJson: true,
      data: true,
      userId: true,
      guestToken: true,
      ownerId: true,
    },
  });
}

function resolveCommentsEnabledFromInvitation(invitation: {
  dataJson: unknown;
  data: unknown;
}): boolean {
  const sources = [invitation.dataJson, invitation.data];
  for (const source of sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    const record = source as Record<string, unknown>;
    if (typeof record.commentsEnabled === 'boolean') return record.commentsEnabled;
    if (typeof record.guestbookEnabled === 'boolean') return record.guestbookEnabled;
  }
  return true;
}

function toPublicComment(row: {
  id: string;
  authorName: string;
  message: string;
  isPinned: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    authorName: row.authorName,
    message: row.message,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertInvitationOwner(
  invitationId: string,
  req: Request
): Promise<{ ok: true; invitationId: string } | { ok: false; status: number; error: string }> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, isDeleted: false },
    select: { id: true, userId: true, guestToken: true, ownerId: true },
  });
  if (!invitation) {
    return { ok: false, status: 404, error: 'Invitation not found' };
  }

  const user = await getAuthUser(req);
  if (user && invitation.userId === user.id) {
    return { ok: true, invitationId: invitation.id };
  }

  const guestToken = getGuestToken(req);
  if (guestToken && (invitation.guestToken === guestToken || invitation.ownerId === guestToken)) {
    return { ok: true, invitationId: invitation.id };
  }

  return { ok: false, status: 403, error: 'Forbidden' };
}

/** Public comments — mount at /api/public/invitations */
export const publicInvitationCommentsRouter = Router();

publicInvitationCommentsRouter.get('/:slug/comments', async (req, res) => {
  try {
    const invitation = await findInvitationByPublicSlug(String(req.params.slug || ''));
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (!resolveCommentsEnabledFromInvitation(invitation)) {
      return res.status(200).json({ items: [], total: 0 });
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 50;

    const items = await prisma.invitationComment.findMany({
      where: {
        invitationId: invitation.id,
        isVisible: true,
        deletedAt: null,
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        authorName: true,
        message: true,
        isPinned: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      items: items.map(toPublicComment),
      total: items.length,
    });
  } catch (error) {
    console.error('[public comments list]', error);
    return res.status(500).json({ error: 'Failed to list comments' });
  }
});

publicInvitationCommentsRouter.post('/:slug/comments', async (req, res) => {
  try {
    const ip = resolveClientIp(req);
    if (consumeCommentAttempt(ip).limited) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const invitation = await findInvitationByPublicSlug(String(req.params.slug || ''));
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (!resolveCommentsEnabledFromInvitation(invitation)) {
      return res.status(403).json({ error: 'Comments are disabled' });
    }

    const authorName = stripHtml(String(req.body?.authorName ?? ''));
    const message = stripHtml(String(req.body?.message ?? ''));

    if (authorName.length < 1 || authorName.length > 30) {
      return res.status(400).json({ error: 'authorName must be 1-30 characters' });
    }
    if (message.length < 1 || message.length > 500) {
      return res.status(400).json({ error: 'message must be 1-500 characters' });
    }
    if (countUrls(message) > 1) {
      return res.status(400).json({ error: 'Too many links in message' });
    }

    const created = await prisma.invitationComment.create({
      data: {
        invitationId: invitation.id,
        authorName,
        message,
      },
      select: {
        id: true,
        authorName: true,
        message: true,
        isPinned: true,
        createdAt: true,
      },
    });

    return res.status(201).json(toPublicComment(created));
  } catch (error) {
    console.error('[public comments create]', error);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
});

/** Owner comments — mount at /api/invitations/:id/comments */
export const ownerInvitationCommentsRouter = Router({ mergeParams: true });

ownerInvitationCommentsRouter.get('/', async (req, res) => {
  try {
    const invitationId = String((req.params as { id?: string }).id || '');
    const access = await assertInvitationOwner(invitationId, req);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const items = await prisma.invitationComment.findMany({
      where: { invitationId: access.invitationId },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        authorName: true,
        message: true,
        isVisible: true,
        isPinned: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ items });
  } catch (error) {
    console.error('[owner comments list]', error);
    return res.status(500).json({ error: 'Failed to list comments' });
  }
});

ownerInvitationCommentsRouter.patch('/:commentId', async (req, res) => {
  try {
    const invitationId = String((req.params as { id?: string; commentId?: string }).id || '');
    const access = await assertInvitationOwner(invitationId, req);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const commentId = String((req.params as { commentId?: string }).commentId || '');
    const existing = await prisma.invitationComment.findFirst({
      where: { id: commentId, invitationId: access.invitationId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const data: { isVisible?: boolean; isPinned?: boolean } = {};
    if (typeof req.body?.isVisible === 'boolean') data.isVisible = req.body.isVisible;
    if (typeof req.body?.isPinned === 'boolean') data.isPinned = req.body.isPinned;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No updatable fields' });
    }

    const updated = await prisma.invitationComment.update({
      where: { id: existing.id },
      data,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('[owner comments patch]', error);
    return res.status(500).json({ error: 'Failed to update comment' });
  }
});

ownerInvitationCommentsRouter.delete('/:commentId', async (req, res) => {
  try {
    const invitationId = String((req.params as { id?: string; commentId?: string }).id || '');
    const access = await assertInvitationOwner(invitationId, req);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const commentId = String((req.params as { commentId?: string }).commentId || '');
    const existing = await prisma.invitationComment.findFirst({
      where: { id: commentId, invitationId: access.invitationId, deletedAt: null },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await prisma.invitationComment.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isVisible: false },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('[owner comments delete]', error);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});
