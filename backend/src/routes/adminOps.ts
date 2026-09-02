import { Router, type Request, type Response } from 'express';
import { InvitationPaymentStatus, InvitationStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  getAdminSession,
  requireAdminSession,
  requireSuperAdminSession,
  type AdminSession,
} from '../lib/adminSession';
import { logAdminAction } from '../admin/adminAuditLog';
import { getTemplateStoreSummary } from '../admin/templateStore';
import {
  getInvitationPricingSnapshot,
  invalidatePricingCache,
  INVITATION_PRICING,
} from '../lib/pricing/invitationPricing';
import {
  getMaskedProviderConfig,
  upsertProviderConfig,
  type ProviderEnvironment,
} from '../lib/ops/paymentProviderConfig';
import {
  getSystemRuntimeSettings,
  resolveRuntimeAppEnvironment,
  updateSystemRuntimeSettings,
} from '../lib/ops/systemConfig';
import {
  getPaymentDiagnostics,
  getPrimaryPaymentChannel,
  resolvePaymentProvider,
  resolveTossRuntimeKeys,
} from '../lib/payments/provider';
import { probeTossCredentials } from '../lib/payments/tossClient';
import {
  decryptSecretFromJson,
  isAdminSettingsEncryptionConfigured,
} from '../lib/security/adminSettingsCrypto';

const router = Router();

router.use(requireAdminSession);

function sessionOf(res: Response): AdminSession {
  return res.locals.adminSession as AdminSession;
}

function requireSuper(req: Request, res: Response): AdminSession | null {
  const session = getAdminSession(req);
  if (!session || session.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    return null;
  }
  return session;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function extractConcept(dataJson: unknown): string | null {
  if (!dataJson || typeof dataJson !== 'object') return null;
  const concept = (dataJson as Record<string, unknown>).conceptType;
  return typeof concept === 'string' ? concept : null;
}

function extractVisualTemplateId(dataJson: unknown): string | null {
  if (!dataJson || typeof dataJson !== 'object') return null;
  const id = (dataJson as Record<string, unknown>).visualTemplateId;
  return typeof id === 'string' ? id : null;
}

function maskPaymentKey(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}${'*'.repeat(8)}${value.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Dashboard (extends metrics; keeps existing fields for FE compatibility)
// ---------------------------------------------------------------------------
router.get('/ops/dashboard', async (_req, res) => {
  try {
    const today = startOfToday();
    const month = startOfMonth();
    const [
      templateSummary,
      totalUsers,
      usersToday,
      usersMonth,
      totalInvitations,
      draftCount,
      publishedCount,
      invitationsToday,
      invitationsMonth,
      paidCount,
      paidToday,
      paidMonth,
      revenueToday,
      revenueMonth,
      recentPayments,
      recentInvitations,
      recentUsers,
      recentAudit,
      pricing,
      paymentDiag,
      system,
    ] = await Promise.all([
      getTemplateStoreSummary(),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: month } } }),
      prisma.invitation.count({ where: { isDeleted: false } }),
      prisma.invitation.count({ where: { isDeleted: false, status: InvitationStatus.DRAFT } }),
      prisma.invitation.count({ where: { isDeleted: false, status: InvitationStatus.PUBLISHED } }),
      prisma.invitation.count({ where: { isDeleted: false, createdAt: { gte: today } } }),
      prisma.invitation.count({ where: { isDeleted: false, createdAt: { gte: month } } }),
      prisma.invitationPayment.count({ where: { status: InvitationPaymentStatus.PAID } }),
      prisma.invitationPayment.count({
        where: { status: InvitationPaymentStatus.PAID, paidAt: { gte: today } },
      }),
      prisma.invitationPayment.count({
        where: { status: InvitationPaymentStatus.PAID, paidAt: { gte: month } },
      }),
      prisma.invitationPayment.aggregate({
        where: { status: InvitationPaymentStatus.PAID, paidAt: { gte: today } },
        _sum: { chargedAmount: true },
      }),
      prisma.invitationPayment.aggregate({
        where: { status: InvitationPaymentStatus.PAID, paidAt: { gte: month } },
        _sum: { chargedAmount: true },
      }),
      prisma.invitationPayment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { invitation: { select: { id: true, title: true, slug: true } } },
      }),
      prisma.invitation.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          isPaid: true,
          createdAt: true,
          userId: true,
          dataJson: true,
          language: true,
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, email: true, createdAt: true },
      }),
      prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      getInvitationPricingSnapshot(),
      getPaymentDiagnostics(),
      getSystemRuntimeSettings(),
    ]);

    const failedPayments = await prisma.invitationPayment.count({
      where: { status: InvitationPaymentStatus.FAILED },
    });

    return res.status(200).json({
      runtimeEnvironment: resolveRuntimeAppEnvironment(),
      totalTemplates: templateSummary.totalTemplates,
      activeTemplates: templateSummary.activeTemplates,
      totalInvitationsCreated: totalInvitations,
      invitationsCreatedToday: invitationsToday,
      creatorTemplates: templateSummary.creatorTemplates,
      systemTemplates: templateSummary.systemTemplates,
      revenueSummary: templateSummary.revenueSummary,
      metrics: {
        totalUsers,
        usersToday,
        usersMonth,
        totalInvitations,
        draftCount,
        publishedCount,
        invitationsToday,
        invitationsMonth,
        paidCount,
        paidToday,
        paidMonth,
        revenueTodayMinor: revenueToday._sum.chargedAmount || 0,
        revenueMonthMinor: revenueMonth._sum.chargedAmount || 0,
        failedPayments,
        currentSalePriceMinor: pricing.chargedAmountCents,
        currentListPriceMinor: pricing.listPriceCents,
        currency: pricing.currency,
      },
      payment: paymentDiag,
      system: {
        paymentsEnabled: system.paymentsEnabled,
        publishingEnabled: system.publishingEnabled,
        activePaymentEnvironment: system.activePaymentEnvironment,
      },
      recent: {
        payments: recentPayments.map((p) => ({
          id: p.id,
          invitationId: p.invitationId,
          invitationTitle: p.invitation.title,
          status: p.status,
          chargedAmount: p.chargedAmount,
          currency: p.currency,
          provider: p.provider,
          createdAt: p.createdAt.toISOString(),
          paidAt: p.paidAt?.toISOString() ?? null,
        })),
        invitations: recentInvitations.map((inv) => ({
          id: inv.id,
          title: inv.title,
          status: inv.status,
          isPaid: inv.isPaid,
          userId: inv.userId,
          concept: extractConcept(inv.dataJson),
          language: inv.language,
          createdAt: inv.createdAt.toISOString(),
        })),
        users: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          createdAt: u.createdAt.toISOString(),
        })),
        audit: recentAudit.map((a) => ({
          id: a.id,
          adminId: a.adminId,
          action: a.action,
          targetType: a.targetType,
          targetId: a.targetId,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[admin/ops] dashboard failed', error);
    return res.status(500).json({ error: 'DASHBOARD_FAILED' });
  }
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
router.get('/ops/users', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const take = Math.min(Number(req.query.limit) || 50, 100);
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { id: q },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, email: true, createdAt: true, role: true, deactivatedAt: true },
    });

    const enriched = await Promise.all(
      users.map(async (u) => {
        const [invitationCount, publishedCount, paidCount] = await Promise.all([
          prisma.invitation.count({ where: { userId: u.id, isDeleted: false } }),
          prisma.invitation.count({
            where: { userId: u.id, isDeleted: false, status: InvitationStatus.PUBLISHED },
          }),
          prisma.invitationPayment.count({
            where: { userId: u.id, status: InvitationPaymentStatus.PAID },
          }),
        ]);
        return {
          id: u.id,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
          deactivatedAt: u.deactivatedAt?.toISOString() ?? null,
          invitationCount,
          publishedCount,
          paidCount,
        };
      })
    );

    return res.status(200).json({ users: enriched });
  } catch (error) {
    console.error('[admin/ops] users list failed', error);
    return res.status(500).json({ error: 'USERS_LIST_FAILED' });
  }
});

router.get('/ops/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, createdAt: true, role: true, deactivatedAt: true },
    });
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' });

    const [invitations, payments] = await Promise.all([
      prisma.invitation.findMany({
        where: { userId: user.id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          isPaid: true,
          shareSlug: true,
          createdAt: true,
          publishedAt: true,
          dataJson: true,
        },
      }),
      prisma.invitationPayment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
      },
      invitations: invitations.map((inv) => ({
        ...inv,
        concept: extractConcept(inv.dataJson),
        visualTemplateId: extractVisualTemplateId(inv.dataJson),
        createdAt: inv.createdAt.toISOString(),
        publishedAt: inv.publishedAt?.toISOString() ?? null,
        dataJson: undefined,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        invitationId: p.invitationId,
        status: p.status,
        chargedAmount: p.chargedAmount,
        currency: p.currency,
        provider: p.provider,
        providerOrderId: p.providerOrderId,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('[admin/ops] user detail failed', error);
    return res.status(500).json({ error: 'USER_DETAIL_FAILED' });
  }
});

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------
router.get('/ops/invitations', async (req, res) => {
  try {
    const concept = typeof req.query.concept === 'string' ? req.query.concept.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const locale = typeof req.query.locale === 'string' ? req.query.locale.trim() : '';
    const paid = typeof req.query.paid === 'string' ? req.query.paid.trim() : '';
    const deleted = typeof req.query.deleted === 'string' ? req.query.deleted.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const take = Math.min(Number(req.query.limit) || 50, 100);

    const where: Prisma.InvitationWhereInput = {};
    if (deleted === 'true') where.isDeleted = true;
    else if (deleted !== 'all') where.isDeleted = false;
    if (status && Object.values(InvitationStatus).includes(status as InvitationStatus)) {
      where.status = status as InvitationStatus;
    }
    if (paid === 'true') where.isPaid = true;
    if (paid === 'false') where.isPaid = false;
    if (locale) where.language = locale;
    if (q) {
      where.OR = [
        { id: q },
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { shareSlug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        userId: true,
        guestToken: true,
        templateKey: true,
        language: true,
        status: true,
        isPaid: true,
        isDeleted: true,
        shareSlug: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        dataJson: true,
        user: { select: { email: true } },
      },
    });

    const filtered = concept
      ? rows.filter((r) => extractConcept(r.dataJson) === concept)
      : rows;

    return res.status(200).json({
      invitations: filtered.map((inv) => ({
        id: inv.id,
        title: inv.title,
        userId: inv.userId,
        ownerEmail: inv.user?.email ?? null,
        templateKey: inv.templateKey,
        visualTemplateId: extractVisualTemplateId(inv.dataJson),
        concept: extractConcept(inv.dataJson),
        language: inv.language,
        status: inv.status,
        isPaid: inv.isPaid,
        isDeleted: inv.isDeleted,
        shareSlug: inv.shareSlug,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
        publishedAt: inv.publishedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('[admin/ops] invitations list failed', error);
    return res.status(500).json({ error: 'INVITATIONS_LIST_FAILED' });
  }
});

router.get('/ops/invitations/:id', async (req, res) => {
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
    if (!invitation) return res.status(404).json({ error: 'NOT_FOUND' });

    const [rsvpCount, commentCount, mediaCount, payments] = await Promise.all([
      prisma.rSVP.count({ where: { invitationId: invitation.id } }),
      prisma.invitationComment.count({
        where: { invitationId: invitation.id, deletedAt: null },
      }),
      prisma.mediaFile.count({
        where: { ownerRefId: invitation.id, deletedAt: null },
      }),
      prisma.invitationPayment.findMany({
        where: { invitationId: invitation.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return res.status(200).json({
      invitation: {
        id: invitation.id,
        title: invitation.title,
        slug: invitation.slug,
        shareSlug: invitation.shareSlug,
        templateKey: invitation.templateKey,
        templateId: invitation.templateId,
        visualTemplateId: extractVisualTemplateId(invitation.dataJson),
        concept: extractConcept(invitation.dataJson),
        language: invitation.language,
        status: invitation.status,
        isPaid: invitation.isPaid,
        isDeleted: invitation.isDeleted,
        isPublished: invitation.isPublished,
        createdAt: invitation.createdAt.toISOString(),
        updatedAt: invitation.updatedAt.toISOString(),
        publishedAt: invitation.publishedAt?.toISOString() ?? null,
        owner: invitation.user
          ? { id: invitation.user.id, email: invitation.user.email }
          : { guestToken: invitation.guestToken ? 'present' : null },
      },
      counts: { rsvpCount, commentCount, mediaCount },
      payments: payments.map((p) => ({
        id: p.id,
        status: p.status,
        chargedAmount: p.chargedAmount,
        listPriceAmount: p.listPriceAmount,
        currency: p.currency,
        provider: p.provider,
        providerOrderId: p.providerOrderId,
        providerPaymentIdMasked: maskPaymentKey(p.providerPaymentId),
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('[admin/ops] invitation detail failed', error);
    return res.status(500).json({ error: 'INVITATION_DETAIL_FAILED' });
  }
});

router.post('/ops/invitations/:id/archive', async (req, res) => {
  const session = sessionOf(res);
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        isDeleted: true,
        isPaid: true,
        status: true,
      },
    });
    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    if (invitation.isDeleted) {
      return res.status(200).json({ success: true, alreadyArchived: true, id: invitation.id });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        isDeleted: true,
        isPublished: false,
        status: InvitationStatus.DRAFT,
      },
    });

    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'invitation_archive',
      targetType: 'invitation',
      targetId: invitation.id,
      payload: {
        actorRole: session.role,
        isPaid: invitation.isPaid,
        previousStatus: invitation.status,
      },
    });

    return res.status(200).json({
      success: true,
      id: invitation.id,
      archived: true,
      paidPreserved: invitation.isPaid,
    });
  } catch (error) {
    console.error('[admin/ops] invitation archive failed', error);
    return res.status(500).json({ error: 'INVITATION_ARCHIVE_FAILED' });
  }
});

router.patch('/ops/invitations/:id/status', async (req, res) => {
  const session = sessionOf(res);
  try {
    const nextStatusRaw = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!Object.values(InvitationStatus).includes(nextStatusRaw as InvitationStatus)) {
      return res.status(400).json({ error: 'INVALID_STATUS' });
    }
    const nextStatus = nextStatusRaw as InvitationStatus;

    const invitation = await prisma.invitation.findFirst({
      where: { id: req.params.id, isDeleted: false },
      select: { id: true, status: true, isPublished: true },
    });
    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const updated = await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: nextStatus,
        isPublished: nextStatus === InvitationStatus.PUBLISHED,
      },
      select: { id: true, status: true, isPublished: true },
    });

    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'invitation_status_update',
      targetType: 'invitation',
      targetId: invitation.id,
      payload: {
        actorRole: session.role,
        before: invitation.status,
        after: updated.status,
      },
    });

    return res.status(200).json({ success: true, invitation: updated });
  } catch (error) {
    console.error('[admin/ops] invitation status update failed', error);
    return res.status(500).json({ error: 'INVITATION_STATUS_UPDATE_FAILED' });
  }
});

router.post('/ops/users/:id/deactivate', async (req, res) => {
  const session = sessionOf(res);
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, role: true, deactivatedAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'ADMIN_USER_PROTECTED' });
    }
    if (user.deactivatedAt) {
      return res.status(200).json({ success: true, alreadyDeactivated: true, id: user.id });
    }

    const deactivatedAt = new Date();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { deactivatedAt },
      }),
      prisma.authSession.deleteMany({ where: { userId: user.id } }),
    ]);

    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'user_deactivate',
      targetType: 'user',
      targetId: user.id,
      payload: {
        actorRole: session.role,
        email: user.email,
      },
    });

    return res.status(200).json({
      success: true,
      id: user.id,
      deactivatedAt: deactivatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[admin/ops] user deactivate failed', error);
    return res.status(500).json({ error: 'USER_DEACTIVATE_FAILED' });
  }
});

// ---------------------------------------------------------------------------
// Payments (transactions) ??static paths before :id
// ---------------------------------------------------------------------------
router.get('/ops/payments/pricing', async (_req, res) => {
  try {
    const snapshot = await getInvitationPricingSnapshot();
    const row = await prisma.invitationPricingConfig.findFirst({
      where: { enabled: true },
      orderBy: { updatedAt: 'desc' },
    });
    return res.status(200).json({
      currency: 'USD',
      listPriceMinor: snapshot.listPriceCents,
      salePriceMinor: row?.salePriceMinor ?? INVITATION_PRICING.salePriceCents,
      effectivePriceMinor: snapshot.chargedAmountCents,
      promoEnabled: row?.promoEnabled ?? true,
      promoStartsAt: row?.promoStartsAt?.toISOString() ?? null,
      promoEndsAt: row?.promoEndsAt?.toISOString() ?? null,
      enabled: row?.enabled ?? true,
      source: snapshot.source,
      pricingConfigId: snapshot.pricingConfigId,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
    });
  } catch (error) {
    console.error('[admin/ops] pricing get failed', error);
    return res.status(500).json({ error: 'PRICING_GET_FAILED' });
  }
});

router.put('/ops/payments/pricing', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;

  try {
    const listPriceMinor = Number(req.body?.listPriceMinor);
    const salePriceMinor = Number(req.body?.salePriceMinor);
    const promoEnabled = Boolean(req.body?.promoEnabled);
    if (!Number.isInteger(listPriceMinor) || listPriceMinor <= 0) {
      return res.status(400).json({ error: 'INVALID_LIST_PRICE' });
    }
    if (!Number.isInteger(salePriceMinor) || salePriceMinor <= 0) {
      return res.status(400).json({ error: 'INVALID_SALE_PRICE' });
    }
    if (salePriceMinor > listPriceMinor) {
      return res.status(400).json({ error: 'SALE_EXCEEDS_LIST' });
    }
    if (listPriceMinor % 100 !== 0 || salePriceMinor % 100 !== 0) {
      return res.status(400).json({ error: 'USD_MUST_BE_WHOLE_DOLLARS' });
    }

    const before = await getInvitationPricingSnapshot();
    const existing = await prisma.invitationPricingConfig.findFirst({
      where: { enabled: true },
      orderBy: { updatedAt: 'desc' },
    });

    const data = {
      currency: 'USD',
      listPriceMinor,
      salePriceMinor,
      promoEnabled,
      promoStartsAt: req.body?.promoStartsAt ? new Date(req.body.promoStartsAt) : null,
      promoEndsAt: req.body?.promoEndsAt ? new Date(req.body.promoEndsAt) : null,
      enabled: true,
      updatedBy: session.email,
    };

    const row = existing
      ? await prisma.invitationPricingConfig.update({ where: { id: existing.id }, data })
      : await prisma.invitationPricingConfig.create({ data });

    invalidatePricingCache();
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'pricing_update',
      targetType: 'invitation_pricing',
      targetId: row.id,
      payload: {
        actorRole: session.role,
        before: {
          listPriceMinor: before.listPriceCents,
          salePriceMinor: before.chargedAmountCents,
        },
        after: {
          listPriceMinor: row.listPriceMinor,
          salePriceMinor: row.salePriceMinor,
          promoEnabled: row.promoEnabled,
        },
      },
    });

    return res.status(200).json({
      currency: 'USD',
      listPriceMinor: row.listPriceMinor,
      salePriceMinor: row.salePriceMinor,
      promoEnabled: row.promoEnabled,
      pricingConfigId: row.id,
    });
  } catch (error) {
    console.error('[admin/ops] pricing update failed', error);
    return res.status(500).json({ error: 'PRICING_UPDATE_FAILED' });
  }
});

router.get('/ops/payments/provider-config', async (_req, res) => {
  try {
    const [test, live, system] = await Promise.all([
      getMaskedProviderConfig('TEST'),
      getMaskedProviderConfig('LIVE'),
      getSystemRuntimeSettings(),
    ]);
    return res.status(200).json({
      channel: getPrimaryPaymentChannel(),
      currency: 'USD',
      runtimeEnvironment: resolveRuntimeAppEnvironment(),
      activePaymentEnvironment: system.activePaymentEnvironment,
      encryptionConfigured: isAdminSettingsEncryptionConfigured(),
      test,
      live,
      foreignMidNote: 'USD foreign MID / overseas card contract must be confirmed in Toss console.',
    });
  } catch (error) {
    console.error('[admin/ops] provider-config get failed', error);
    return res.status(500).json({ error: 'PROVIDER_CONFIG_GET_FAILED' });
  }
});

router.put('/ops/payments/provider-config', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;

  try {
    const environment = String(req.body?.environment || '').toUpperCase() as ProviderEnvironment;
    if (environment !== 'TEST' && environment !== 'LIVE') {
      return res.status(400).json({ error: 'INVALID_ENVIRONMENT' });
    }

    const result = await upsertProviderConfig({
      environment,
      enabled: typeof req.body?.enabled === 'boolean' ? req.body.enabled : undefined,
      clientKey: typeof req.body?.clientKey === 'string' ? req.body.clientKey : undefined,
      secretKey: typeof req.body?.secretKey === 'string' ? req.body.secretKey : undefined,
      variantKey:
        req.body?.variantKey === null
          ? null
          : typeof req.body?.variantKey === 'string'
            ? req.body.variantKey
            : undefined,
      updatedBy: session.email,
    });

    await logAdminAction({
      adminId: session.adminId || session.email,
      action: environment === 'LIVE' ? 'toss_live_config_update' : 'toss_test_config_update',
      targetType: 'payment_provider_config',
      targetId: `${environment}`,
      payload: {
        actorRole: session.role,
        environment,
        enabled: result.view.enabled,
        secretChanged: result.secretChanged,
        clientChanged: result.clientChanged,
        variantChanged: result.variantChanged,
      },
    });

    return res.status(200).json(result.view);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PROVIDER_CONFIG_UPDATE_FAILED';
    if (message === 'ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED') {
      return res.status(503).json({ error: message });
    }
    if (message === 'PROVIDER_CONFIG_NOTHING_TO_SAVE') {
      return res.status(400).json({ error: message });
    }
    console.error('[admin/ops] provider-config update failed', error);
    return res.status(500).json({ error: 'PROVIDER_CONFIG_UPDATE_FAILED' });
  }
});

router.post('/ops/payments/provider-config/test', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;

  try {
    const environment = String(req.body?.environment || 'TEST').toUpperCase() as ProviderEnvironment;
    if (environment !== 'TEST' && environment !== 'LIVE') {
      return res.status(400).json({ error: 'INVALID_ENVIRONMENT' });
    }

    const row = await prisma.paymentProviderConfig.findUnique({
      where: {
        provider_environment: {
          provider: 'toss_payments',
          environment: environment === 'LIVE' ? 'LIVE' : 'TEST',
        },
      },
    });
    const secret = row?.encryptedSecretKey
      ? decryptSecretFromJson(row.encryptedSecretKey)
      : null;

    if (!secret) {
      const keys = await resolveTossRuntimeKeys();
      if (!keys.ok) {
        return res.status(503).json({
          ok: false,
          code: 'FOREIGN_MID_NOT_CONFIGURED',
          message: 'No Toss secret configured for connection test.',
        });
      }
      const probe = await probeTossCredentials(keys.secretKey);
      return res.status(200).json({ ...probe, source: keys.source, environment });
    }

    const probe = await probeTossCredentials(secret);
    return res.status(200).json({ ...probe, source: 'db', environment });
  } catch (error) {
    console.error('[admin/ops] provider-config test failed', error);
    return res.status(500).json({ error: 'PROVIDER_CONFIG_TEST_FAILED' });
  }
});

router.get('/ops/payments', async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
    const invitationId =
      typeof req.query.invitationId === 'string' ? req.query.invitationId.trim() : '';
    const take = Math.min(Number(req.query.limit) || 50, 100);

    const where: Prisma.InvitationPaymentWhereInput = {};
    if (status && Object.values(InvitationPaymentStatus).includes(status as InvitationPaymentStatus)) {
      where.status = status as InvitationPaymentStatus;
    }
    if (orderId) where.providerOrderId = orderId;
    if (invitationId) where.invitationId = invitationId;
    if (email) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      where.userId = user?.id || '00000000-0000-0000-0000-000000000000';
    }

    const rows = await prisma.invitationPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        invitation: { select: { id: true, title: true, slug: true } },
      },
    });

    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    return res.status(200).json({
      payments: rows.map((p) => {
        let channel: string | null = null;
        try {
          const meta = p.rawProviderStatus ? JSON.parse(p.rawProviderStatus) : {};
          channel = typeof meta.paymentChannel === 'string' ? meta.paymentChannel : null;
        } catch {
          channel = null;
        }
        return {
          id: p.id,
          invitationId: p.invitationId,
          invitationTitle: p.invitation.title,
          userId: p.userId,
          userEmail: p.userId ? emailById.get(p.userId) || null : null,
          orderId: p.providerOrderId,
          provider: p.provider,
          channel: channel || getPrimaryPaymentChannel(),
          amount: p.chargedAmount,
          listPriceAmount: p.listPriceAmount,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          paidAt: p.paidAt?.toISOString() ?? null,
        };
      }),
    });
  } catch (error) {
    console.error('[admin/ops] payments list failed', error);
    return res.status(500).json({ error: 'PAYMENTS_LIST_FAILED' });
  }
});

router.get('/ops/payments/:id', async (req, res) => {
  try {
    const payment = await prisma.invitationPayment.findUnique({
      where: { id: req.params.id },
      include: { invitation: { select: { id: true, title: true, slug: true, shareSlug: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'NOT_FOUND' });

    const user = payment.userId
      ? await prisma.user.findUnique({
          where: { id: payment.userId },
          select: { id: true, email: true },
        })
      : null;

    let meta: Record<string, unknown> = {};
    try {
      meta = payment.rawProviderStatus ? JSON.parse(payment.rawProviderStatus) : {};
    } catch {
      meta = {};
    }

    return res.status(200).json({
      payment: {
        id: payment.id,
        invitation: payment.invitation,
        user,
        provider: payment.provider,
        status: payment.status,
        currency: payment.currency,
        listPriceAmount: payment.listPriceAmount,
        chargedAmount: payment.chargedAmount,
        promotionCode: payment.promotionCode,
        orderId: payment.providerOrderId,
        paymentKeyMasked: maskPaymentKey(payment.providerPaymentId),
        channel: typeof meta.paymentChannel === 'string' ? meta.paymentChannel : null,
        pricingConfigId: typeof meta.pricingConfigId === 'string' ? meta.pricingConfigId : null,
        createdAt: payment.createdAt.toISOString(),
        paidAt: payment.paidAt?.toISOString() ?? null,
        failedAt: payment.failedAt?.toISOString() ?? null,
        canceledAt: payment.canceledAt?.toISOString() ?? null,
        refundedAt: payment.refundedAt?.toISOString() ?? null,
        providerPhase: typeof meta.phase === 'string' ? meta.phase : null,
      },
    });
  } catch (error) {
    console.error('[admin/ops] payment detail failed', error);
    return res.status(500).json({ error: 'PAYMENT_DETAIL_FAILED' });
  }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// System + Audit
// ---------------------------------------------------------------------------
router.get('/ops/system', async (_req, res) => {
  try {
    const [system, payment] = await Promise.all([
      getSystemRuntimeSettings(),
      getPaymentDiagnostics(),
    ]);
    return res.status(200).json({
      runtimeEnvironment: resolveRuntimeAppEnvironment(),
      settings: system,
      payment,
      channel: getPrimaryPaymentChannel(),
      currency: 'USD',
    });
  } catch (error) {
    console.error('[admin/ops] system get failed', error);
    return res.status(500).json({ error: 'SYSTEM_GET_FAILED' });
  }
});

router.put('/ops/system', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;

  try {
    const before = await getSystemRuntimeSettings();
    const activePaymentEnvironment = req.body?.activePaymentEnvironment
      ? String(req.body.activePaymentEnvironment).toUpperCase()
      : undefined;

    if (activePaymentEnvironment && activePaymentEnvironment !== 'TEST' && activePaymentEnvironment !== 'LIVE') {
      return res.status(400).json({ error: 'INVALID_ACTIVE_PAYMENT_ENVIRONMENT' });
    }

    if (
      activePaymentEnvironment === 'LIVE' &&
      resolveRuntimeAppEnvironment() !== 'production'
    ) {
      // Allow storing preference only with explicit confirm ??still blocked at charge time.
      if (req.body?.confirmLiveActivation !== true) {
        return res.status(400).json({
          error: 'LIVE_ACTIVATION_CONFIRM_REQUIRED',
          message:
            'Development environment: set confirmLiveActivation=true to record LIVE preference. Actual LIVE charges remain blocked.',
        });
      }
    }

    const after = await updateSystemRuntimeSettings(
      {
        paymentsEnabled:
          typeof req.body?.paymentsEnabled === 'boolean' ? req.body.paymentsEnabled : undefined,
        publishingEnabled:
          typeof req.body?.publishingEnabled === 'boolean' ? req.body.publishingEnabled : undefined,
        invitationCreationEnabled:
          typeof req.body?.invitationCreationEnabled === 'boolean'
            ? req.body.invitationCreationEnabled
            : undefined,
        signupsEnabled:
          typeof req.body?.signupsEnabled === 'boolean' ? req.body.signupsEnabled : undefined,
        supportEmail:
          req.body?.supportEmail === null
            ? null
            : typeof req.body?.supportEmail === 'string'
              ? req.body.supportEmail.trim() || null
              : undefined,
        activePaymentEnvironment: activePaymentEnvironment as 'TEST' | 'LIVE' | undefined,
      },
      session.email
    );

    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'system_settings_update',
      targetType: 'system_runtime_config',
      targetId: 'default',
      payload: {
        actorRole: session.role,
        before,
        after,
      },
    });

    return res.status(200).json({ settings: after });
  } catch (error) {
    console.error('[admin/ops] system update failed', error);
    return res.status(500).json({ error: 'SYSTEM_UPDATE_FAILED' });
  }
});

router.get('/ops/audit', async (req, res) => {
  try {
    const take = Math.min(Number(req.query.limit) || 50, 100);
    const rows = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    return res.status(200).json({
      logs: rows.map((row) => ({
        id: row.id,
        adminId: row.adminId,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        payload: row.payload,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[admin/ops] audit list failed', error);
    return res.status(500).json({ error: 'AUDIT_LIST_FAILED' });
  }
});

// Keep requireSuperAdminSession import used for clarity in module graph
void requireSuperAdminSession;
void resolvePaymentProvider;

export default router;
