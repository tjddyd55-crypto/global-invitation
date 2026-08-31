import crypto from 'crypto';
import { Router } from 'express';
import { InvitationStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { generateSlug } from '../utils/slug';
import { getAuthUser, getGuestToken } from '../lib/auth';
import { collectInvitationCleanupR2Keys } from '../storage/mediaCleanup';
import { hasPaidEntitlement } from '../lib/payments/service';
import { resolveInvitationDeleteAuth } from '../lib/invitations/resolveInvitationDeleteAuth';
import {
  parseCreateInvitationLocale,
  stripLegacyDataJsonLocale,
} from '../lib/invitationLocale';
import { getSystemRuntimeSettings } from '../lib/ops/systemConfig';

const router = Router();
const INVITATION_STATUS_VALUES = new Set<string>(['DRAFT', 'SHARED', 'PUBLISHED']);
const SHARE_SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

type InvitationSummary = {
  id: string;
  slug: string;
  shareSlug: string | null;
  title: string | null;
  templateKey: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseInvitationStatus(value: string | null | undefined): InvitationStatus | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const upper = value.trim().toUpperCase();
  return INVITATION_STATUS_VALUES.has(upper) ? (upper as InvitationStatus) : undefined;
}

function normalizeInvitationData(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value as Prisma.InputJsonValue;
  }
  return undefined;
}

function resolveGuestTokenFromRequest(req: {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}): string | null {
  const tokenCandidates = [
    normalizeText(req.body?.guestToken),
    normalizeText(req.body?.guest_token),
    normalizeText(req.query?.token),
    normalizeText(req.query?.guestToken),
    normalizeText(req.query?.guest_token),
    typeof req.headers?.['x-guest-token'] === 'string' ? req.headers['x-guest-token'].trim() : '',
  ].filter(Boolean);

  return tokenCandidates[0] || null;
}

function createShareSlugCandidate(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let index = 0; index < bytes.length; index += 1) {
    result += SHARE_SLUG_CHARS[bytes[index] % SHARE_SLUG_CHARS.length];
  }
  return result;
}

async function createUniqueShareSlug(): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const length = 8 + Math.floor(Math.random() * 3);
    const candidate = createShareSlugCandidate(length);
    const existing = await prisma.invitation.findFirst({
      where: { shareSlug: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error('FAILED_TO_ALLOCATE_SHARE_SLUG');
}

async function resolveTemplateReference(value: unknown): Promise<{ id: string; templateKey: string } | null> {
  const key = normalizeText(value);
  if (!key) return null;

  let lookupWhere: Prisma.TemplateWhereInput;
  if (isUuidLike(key)) {
    console.log('Template lookup by uuid:', key);
    lookupWhere = { id: key, isDeleted: false, isActive: true };
  } else {
    console.log('Template lookup by slug:', key);
    lookupWhere = { slug: key, isDeleted: false, isActive: true };
  }

  const template = await prisma.template.findFirst({
    where: lookupWhere,
    select: {
      id: true,
      templateKey: true,
    },
  });

  return template ?? null;
}

function invitationIdentifierWhere(identifier: string) {
  return isUuidLike(identifier)
    ? { OR: [{ id: identifier }, { slug: identifier }] }
    : { slug: identifier };
}

async function findInvitationByIdentifier(identifier: string) {
  const normalized = normalizeText(identifier);
  if (!normalized) return null;
  return prisma.invitation.findFirst({
    where: {
      isDeleted: false,
      ...invitationIdentifierWhere(normalized),
    },
  });
}

async function findInvitationByIdentifierIncludingDeleted(identifier: string) {
  const normalized = normalizeText(identifier);
  if (!normalized) return null;
  return prisma.invitation.findFirst({
    where: invitationIdentifierWhere(normalized),
  });
}

async function canEditInvitation(params: {
  invitation: { userId: string | null; guestToken: string | null };
  userId?: string;
  guestToken?: string | null;
}): Promise<boolean> {
  if (params.invitation.userId) {
    return Boolean(params.userId && params.invitation.userId === params.userId);
  }
  return Boolean(params.invitation.guestToken && params.guestToken && params.invitation.guestToken === params.guestToken);
}

async function claimGuestInvitationIfNeeded(params: {
  invitation: { id: string; userId: string | null; guestToken: string | null };
  userId?: string;
  guestToken?: string | null;
}) {
  if (!params.userId) return;
  if (params.invitation.userId) return;
  if (!params.invitation.guestToken) return;
  if (!params.guestToken || params.guestToken !== params.invitation.guestToken) return;

  await prisma.invitation.update({
    where: { id: params.invitation.id },
    data: {
      userId: params.userId,
      guestToken: null,
      ownerType: 'USER',
      ownerId: params.userId,
    },
  });
}

function toPublicInvitation(row: {
  id: string;
  slug: string;
  shareSlug: string | null;
  templateId: string | null;
  title: string | null;
  data: Prisma.JsonValue | null;
  dataJson: Prisma.JsonValue | null;
  createdBy: string | null;
  isPublished: boolean;
  eventDate: Date | null;
  locationText: string | null;
  message: string | null;
  templateKey: string;
  musicKey: string | null;
  countryCode: string;
  language: string;
  status: InvitationStatus;
  isPaid: boolean;
  canShare: boolean;
  paidAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    slug: row.slug,
    shareSlug: row.shareSlug,
    templateId: row.templateId,
    title: row.title,
    data: row.dataJson ?? row.data,
    dataJson: row.dataJson ?? row.data,
    createdBy: row.createdBy,
    isPublished: row.isPublished,
    eventDate: row.eventDate,
    locationText: row.locationText,
    message: row.message,
    templateKey: row.templateKey,
    musicKey: row.musicKey,
    countryCode: row.countryCode,
    language: row.language,
    status: row.status.toLowerCase(),
    isPaid: row.isPaid,
    canShare: row.canShare,
    paidAt: row.paidAt,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function createInvitationRecord(params: {
  templateId?: string | null;
  templateKey: string;
  ownerType: 'USER' | 'GUEST';
  ownerId: string;
  userId?: string | null;
  guestToken?: string | null;
  data?: Prisma.InputJsonValue;
  countryCode?: string;
  /** Canonical product locale. Required — never rely on Prisma default "en". */
  language: string;
}) {
  const slug = generateSlug();
  const parsedLocale = parseCreateInvitationLocale(params.language);
  if (!parsedLocale.ok) {
    throw new Error('INVALID_LOCALE');
  }
  return prisma.invitation.create({
    data: {
      id: crypto.randomUUID(),
      slug,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      createdBy: params.ownerId,
      status: InvitationStatus.DRAFT,
      isPublished: false,
      isPaid: false,
      canShare: false,
      templateKey: params.templateKey || 'basic',
      templateId: params.templateId || null,
      data: params.data,
      dataJson: params.data,
      countryCode: params.countryCode || 'GLOBAL',
      language: parsedLocale.locale,
      userId: params.userId || null,
      guestToken: params.guestToken || null,
    },
    select: {
      id: true,
      slug: true,
      shareSlug: true,
      templateId: true,
      templateKey: true,
      title: true,
      language: true,
      data: true,
      dataJson: true,
      createdBy: true,
      isPublished: true,
      status: true,
      canShare: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
    },
  });
}

async function saveDraftByIdentifier(params: {
  identifier: string;
  body: Record<string, unknown>;
  userId?: string;
  guestToken?: string | null;
}) {
  const invitation = await findInvitationByIdentifier(params.identifier);
  if (!invitation) {
    return { error: 'NOT_FOUND' as const };
  }

  const editable = await canEditInvitation({
    invitation: {
      userId: invitation.userId,
      guestToken: invitation.guestToken,
    },
    userId: params.userId,
    guestToken: params.guestToken,
  });
  if (!editable) {
    return { error: 'FORBIDDEN' as const };
  }

  await claimGuestInvitationIfNeeded({
    invitation: {
      id: invitation.id,
      userId: invitation.userId,
      guestToken: invitation.guestToken,
    },
    userId: params.userId,
    guestToken: params.guestToken,
  });

  const payload: Prisma.InvitationUpdateInput = {};
  const dataJson = normalizeInvitationData(params.body?.data_json ?? params.body?.data);
  if (dataJson !== undefined) {
    if (dataJson && typeof dataJson === 'object' && !Array.isArray(dataJson)) {
      const record = dataJson as Record<string, unknown>;
      const { applyVisualTemplateToDataJson } = await import('../invitation/visualTemplate');
      const concept =
        typeof record.conceptType === 'string'
          ? record.conceptType
          : ((invitation.dataJson as { conceptType?: string } | null)?.conceptType ??
            (invitation.data as { conceptType?: string } | null)?.conceptType);
      const sanitized = applyVisualTemplateToDataJson(record, concept);
      payload.data = sanitized as Prisma.InputJsonValue;
      payload.dataJson = sanitized as Prisma.InputJsonValue;
    } else {
      payload.data = dataJson;
      payload.dataJson = dataJson;
    }
  }
  if (params.body?.title !== undefined) {
    payload.title = normalizeText(params.body.title) || null;
  }
  if (params.body?.eventDate !== undefined) {
    payload.eventDate = normalizeText(params.body.eventDate) ? new Date(String(params.body.eventDate)) : null;
  }
  if (params.body?.locationText !== undefined) {
    payload.locationText = normalizeText(params.body.locationText) || null;
  }
  if (params.body?.message !== undefined) {
    payload.message = normalizeText(params.body.message) || null;
  }
  if (params.body?.templateKey !== undefined) {
    payload.templateKey = normalizeText(params.body.templateKey) || invitation.templateKey;
  }
  if (params.body?.musicKey !== undefined) {
    payload.musicKey = normalizeText(params.body.musicKey) || null;
  }

  payload.status = InvitationStatus.DRAFT;
  payload.isPublished = false;

  const updated = await prisma.invitation.update({
    where: { id: invitation.id },
    data: payload,
    select: {
      id: true,
      slug: true,
      shareSlug: true,
      templateId: true,
      title: true,
      data: true,
      dataJson: true,
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
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      guestToken: true,
    },
  });

  const isOwner = updated.userId
    ? Boolean(params.userId && params.userId === updated.userId)
    : Boolean(updated.guestToken && params.guestToken && updated.guestToken === params.guestToken);

  return {
    data: {
      ...toPublicInvitation(updated),
      isOwner,
    },
  };
}

// GET /api/invitations - List invitations (owner or guest)
router.get('/', async (req, res) => {
  try {
    const owner = typeof req.query.owner === 'string' ? req.query.owner : null;
    const guestToken = normalizeText(req.query.guestToken);
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
          isDeleted: false,
          status,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit && !Number.isNaN(limit) ? limit : undefined,
        select: {
          id: true,
          slug: true,
          shareSlug: true,
          title: true,
          templateKey: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
        },
      });

      return res.status(200).json(invitations as InvitationSummary[]);
    }

    if (guestToken) {
      const invitations = await prisma.invitation.findMany({
        where: {
          guestToken,
          isDeleted: false,
          status,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit && !Number.isNaN(limit) ? limit : undefined,
        select: {
          id: true,
          slug: true,
          shareSlug: true,
          title: true,
          templateKey: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
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

// GET /api/invitations/recent — 헤더 퀵 액세스용 (로그인 사용자만)
router.get('/recent', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invitations = await prisma.invitation.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        shareSlug: true,
        title: true,
        templateKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    return res.status(200).json(invitations);
  } catch (error) {
    console.error('Error listing recent invitations:', error);
    return res.status(500).json({ error: 'Failed to list recent invitations' });
  }
});

// POST /api/invitations/guest - legacy only (신규 작성자 플로우에서는 사용 금지)
router.post('/guest', async (_req, res) => {
  // legacy: 과거 guestToken 제작 경로. 신규 생성은 이메일 인증 + POST /api/invitations 만 허용.
  return res.status(403).json({
    error: 'GUEST_CREATE_DISABLED',
    message: 'Email verification is required to create invitations',
  });
});

// POST /api/invitations - Create invitation (authenticated user only)
router.post('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const system = await getSystemRuntimeSettings();
    if (!system.invitationCreationEnabled) {
      return res.status(503).json({ error: 'INVITATION_CREATION_DISABLED' });
    }

    const resolvedTemplate = await resolveTemplateReference(
      req.body?.templateId ?? req.body?.templateSlug ?? req.body?.template
    );
    const invitationData = normalizeInvitationData(req.body?.data_json ?? req.body?.data);
    const templateKey =
      normalizeText(req.body?.templateKey) || resolvedTemplate?.templateKey || 'invitation_full';

    const conceptRaw = normalizeText(req.body?.conceptType) || normalizeText(req.body?.concept);
    const conceptType =
      conceptRaw === 'WEDDING' ||
      conceptRaw === 'FUNERAL' ||
      conceptRaw === 'GENERAL' ||
      conceptRaw === 'ORGANIZATION'
        ? conceptRaw
        : null;

    const baseData =
      invitationData && typeof invitationData === 'object' && !Array.isArray(invitationData)
        ? (invitationData as Record<string, unknown>)
        : {};
    const { applyVisualTemplateToDataJson } = await import('../invitation/visualTemplate');
    const explicitVisual =
      normalizeText(req.body?.visualTemplateId) ||
      (typeof baseData.visualTemplateId === 'string' ? baseData.visualTemplateId : undefined);
    const parsedLocale = parseCreateInvitationLocale(
      normalizeText(req.body?.locale) || normalizeText(req.body?.language)
    );
    if (!parsedLocale.ok) {
      return res.status(400).json({ error: 'INVALID_LOCALE' });
    }
    const invitationLocale = parsedLocale.locale;
    const dataWithConcept = stripLegacyDataJsonLocale({
      ...applyVisualTemplateToDataJson(baseData, conceptType, explicitVisual),
      templateType: 'FULL',
      ...(conceptType ? { conceptType } : {}),
    }) as Prisma.InputJsonValue;

    const invitation = await createInvitationRecord({
      templateId: resolvedTemplate?.id || null,
      templateKey,
      ownerType: 'USER',
      ownerId: user.id,
      userId: user.id,
      guestToken: null,
      data: dataWithConcept,
      countryCode: normalizeText(req.body?.countryCode) || 'GLOBAL',
      language: invitationLocale,
    });

    return res.status(201).json({
      ...invitation,
      status: invitation.status.toLowerCase(),
      data: invitation.dataJson ?? invitation.data,
      dataJson: invitation.dataJson ?? invitation.data,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// GET /api/invitations/share/:slug - Public invitation by share slug
router.get('/share/:slug', async (req, res) => {
  try {
    const shareSlug = normalizeText(req.params.slug);
    if (!shareSlug) {
      return res.status(400).json({ error: 'INVALID_SHARE_SLUG' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        shareSlug,
        isDeleted: false,
        status: InvitationStatus.PUBLISHED,
      },
      select: {
        id: true,
        slug: true,
        shareSlug: true,
        templateId: true,
        title: true,
        data: true,
        dataJson: true,
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
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const paid = await hasPaidEntitlement(invitation.id);
    if (!paid) {
      // Guest must not be sent to payment; unpaid public looks like not published.
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    return res.status(200).json({
      ...toPublicInvitation(invitation),
      shareUrl: `/i/${shareSlug}`,
    });
  } catch (error) {
    console.error('Error fetching invitation by share slug:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_SHARED_INVITATION' });
  }
});

// PATCH /api/invitations/:id - Save draft
router.patch('/:id', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromRequest(req) || getGuestToken(req);
    const result = await saveDraftByIdentifier({
      identifier,
      body: (req.body || {}) as Record<string, unknown>,
      userId: user?.id,
      guestToken,
    });
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (result.error === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error('Error patching invitation draft:', error);
    return res.status(500).json({ error: 'Failed to patch invitation' });
  }
});

// POST /api/invitations/:id/publish - Publish invitation
router.post('/:id/publish', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const invitation = await findInvitationByIdentifier(identifier);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromRequest(req) || getGuestToken(req);
    const editable = await canEditInvitation({
      invitation: {
        userId: invitation.userId,
        guestToken: invitation.guestToken,
      },
      userId: user?.id,
      guestToken,
    });
    if (!editable) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await claimGuestInvitationIfNeeded({
      invitation: {
        id: invitation.id,
        userId: invitation.userId,
        guestToken: invitation.guestToken,
      },
      userId: user?.id,
      guestToken,
    });

    const paid = await hasPaidEntitlement(invitation.id);
    if (!paid) {
      console.info('[publish] payment required', { invitationId: invitation.id, userId: user?.id || null });
      return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    const system = await getSystemRuntimeSettings();
    if (!system.publishingEnabled) {
      return res.status(503).json({ error: 'PUBLISHING_DISABLED' });
    }

    const shareSlug = invitation.shareSlug || (await createUniqueShareSlug());
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.PUBLISHED,
        isPublished: true,
        canShare: true,
        shareSlug,
        publishedAt: new Date(),
      },
    });

    return res.status(200).json({
      share_url: `/i/${shareSlug}`,
      shareSlug,
    });
  } catch (error) {
    console.error('Error publishing invitation:', error);
    return res.status(500).json({ error: 'Failed to publish invitation' });
  }
});

// GET /api/invitations/:id/rsvps - Owner RSVP management list
router.get('/:id/rsvps', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const invitation = await findInvitationByIdentifier(identifier);
    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const editable = await canEditInvitation({
      invitation: {
        userId: invitation.userId,
        guestToken: invitation.guestToken,
      },
      userId: user.id,
      guestToken: null,
    });
    if (!editable) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const guests = await prisma.rSVP.findMany({
      where: { invitationId: invitation.id },
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

    const attending = guests.filter((g) => g.attendance === 'yes' || g.attendance === 'attending').length;
    const declined = guests.filter((g) => g.attendance === 'no' || g.attendance === 'declined').length;
    const maybe = guests.filter((g) => g.attendance === 'maybe').length;

    return res.status(200).json({
      invitation: {
        id: invitation.id,
        title: invitation.title,
        shareSlug: invitation.shareSlug,
      },
      summary: {
        total: guests.length,
        attending,
        declined,
        maybe,
      },
      guests,
    });
  } catch (error) {
    console.error('Error listing invitation RSVPs:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_RSVPS' });
  }
});

// GET /api/invitations/:id - Get invitation for editor (id or slug)
router.get('/:id', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const invitation = await findInvitationByIdentifier(identifier);
    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromRequest(req) || getGuestToken(req);

    await claimGuestInvitationIfNeeded({
      invitation: {
        id: invitation.id,
        userId: invitation.userId,
        guestToken: invitation.guestToken,
      },
      userId: user?.id,
      guestToken,
    });

    const refreshed = await prisma.invitation.findFirst({
      where: { id: invitation.id, isDeleted: false },
      select: {
        id: true,
        userId: true,
        guestToken: true,
        slug: true,
        shareSlug: true,
        templateId: true,
        title: true,
        data: true,
        dataJson: true,
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
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!refreshed) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const isOwner = refreshed.userId
      ? Boolean(user && user.id === refreshed.userId)
      : Boolean(refreshed.guestToken && guestToken && refreshed.guestToken === guestToken);

    if (!isOwner && refreshed.status !== InvitationStatus.PUBLISHED) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    return res.status(200).json({
      ...toPublicInvitation(refreshed),
      isOwner,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return res.status(503).json({ error: 'TEMP_UNAVAILABLE' });
  }
});

// PUT /api/invitations/:id - Legacy update endpoint
router.put('/:id', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }
    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromRequest(req) || getGuestToken(req);
    const result = await saveDraftByIdentifier({
      identifier,
      body: {
        ...(req.body || {}),
        data_json: req.body?.data_json ?? req.body?.data,
      } as Record<string, unknown>,
      userId: user?.id,
      guestToken,
    });
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (result.error === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error('Error updating invitation:', error);
    return res.status(500).json({ error: 'Failed to update invitation' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const existing = await findInvitationByIdentifierIncludingDeleted(identifier);
    if (!existing) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const user = await getAuthUser(req);
    const guestToken = resolveGuestTokenFromRequest(req) || getGuestToken(req);
    const auth = resolveInvitationDeleteAuth({
      userId: user?.id,
      guestToken,
      invitation: {
        userId: existing.userId,
        guestToken: existing.guestToken,
      },
    });
    if (auth === 'UNAUTHENTICATED') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (auth === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (existing.isDeleted) {
      return res.status(200).json({
        success: true,
        id: existing.id,
        slug: existing.slug,
        cleanupJobsEnqueued: 0,
        alreadyDeleted: true,
      });
    }

    const r2Keys = await collectInvitationCleanupR2Keys({
      invitationId: existing.id,
      dataJson: existing.dataJson,
      data: existing.data,
    });

    await prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: existing.id },
        data: { isDeleted: true },
      });
      await tx.mediaFile.updateMany({
        where: {
          ownerType: 'INVITATION',
          ownerRefId: existing.id,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
      if (r2Keys.length > 0) {
        const scheduledAt = new Date();
        await tx.cleanupJob.createMany({
          data: r2Keys.map((r2Key) => ({
            resourceType: 'INVITATION',
            resourceId: existing.id,
            r2Key,
            scheduledAt,
          })),
        });
      }
    });

    return res.status(200).json({
      success: true,
      id: existing.id,
      slug: existing.slug,
      cleanupJobsEnqueued: r2Keys.length,
    });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return res.status(500).json({ error: 'Failed to delete invitation' });
  }
});

export default router;
