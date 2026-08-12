import { Router } from 'express';
import { InvitationPaymentStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { getAuthUser, getGuestToken } from '../lib/auth';
import {
  canEditInvitation,
  claimGuestInvitationIfNeeded,
  resolveGuestTokenFromRequest,
} from '../lib/invitationAccess';
import {
  confirmPaymentAttempt,
  getPaymentSummaryForInvitation,
  hasPaidEntitlement,
  markPaymentStatus,
  preparePaymentAttempt,
  reconcileTossPaymentByKey,
  recordWebhookEvent,
} from '../lib/payments/service';
import { resolvePaymentProvider } from '../lib/payments/provider';
import { getInvitationPricingSnapshot } from '../lib/pricing/invitationPricing';

const router = Router();

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function findInvitationByIdentifier(identifier: string) {
  const byId = await prisma.invitation.findFirst({
    where: { id: identifier, isDeleted: false },
  });
  if (byId) return byId;
  return prisma.invitation.findFirst({
    where: { slug: identifier, isDeleted: false },
  });
}

async function assertEditableInvitation(req: import('express').Request, invitationId: string) {
  const invitation = await findInvitationByIdentifier(invitationId);
  if (!invitation) {
    return { errorStatus: 404 as const, error: 'NOT_FOUND' as const };
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
    return { errorStatus: 403 as const, error: 'FORBIDDEN' as const };
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

  return { invitation, user };
}

// GET /api/invitations/:id/payment
router.get('/invitations/:id/payment', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const access = await assertEditableInvitation(req, identifier);
    if ('error' in access && access.error) {
      return res.status(access.errorStatus).json({ error: access.error });
    }

    const invitation = access.invitation!;
    const summary = await getPaymentSummaryForInvitation(invitation.id);
    const pricing = getInvitationPricingSnapshot();

    return res.status(200).json({
      invitationId: invitation.id,
      title: invitation.title,
      templateKey: invitation.templateKey,
      status: invitation.status,
      shareSlug: invitation.shareSlug,
      isPublished: invitation.status === 'PUBLISHED',
      provider: resolvePaymentProvider(),
      pricing: {
        currency: pricing.currency,
        listPriceCents: pricing.listPriceCents,
        salePriceCents: pricing.chargedAmountCents,
        discountCents: pricing.listPriceCents - pricing.chargedAmountCents,
        promotionKey: pricing.promotionCode,
      },
      payment: summary,
    });
  } catch (error) {
    console.error('[payments] summary failed', error);
    return res.status(500).json({ error: 'PAYMENT_SUMMARY_FAILED' });
  }
});

// POST /api/invitations/:id/payment/prepare
router.post('/invitations/:id/payment/prepare', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    if (!identifier) {
      return res.status(400).json({ error: 'INVITATION_ID_REQUIRED' });
    }

    const access = await assertEditableInvitation(req, identifier);
    if ('error' in access && access.error) {
      return res.status(access.errorStatus).json({ error: access.error });
    }

    const invitation = access.invitation!;
    const result = await preparePaymentAttempt({
      invitationId: invitation.id,
      userId: access.user?.id || invitation.userId,
    });

    if (!result.ok) {
      const status =
        result.code === 'UNSUPPORTED_CURRENCY'
          ? 422
          : result.code === 'MISSING_TOSS_KEYS'
            ? 503
            : 502;
      return res.status(status).json({ error: result.code, message: result.message });
    }

    if (result.alreadyPaid) {
      return res.status(409).json({
        error: 'ALREADY_PAID',
        paymentId: result.paymentId,
      });
    }

    return res.status(200).json({
      paymentId: result.paymentId,
      orderId: result.orderId,
      provider: result.provider,
      orderName: result.orderName,
      amount: result.amount,
      domainCurrency: result.domainCurrency,
      domainChargedAmountCents: result.domainChargedAmountCents,
      successUrl: result.successUrl,
      failUrl: result.failUrl,
      clientKey: result.clientKey,
      pricing: getInvitationPricingSnapshot(),
    });
  } catch (error) {
    console.error('[payments] prepare failed', error);
    return res.status(500).json({ error: 'PREPARE_FAILED' });
  }
});

// POST /api/invitations/:id/payment/prepare is the canonical start endpoint.

// POST /api/invitations/:id/payment/confirm
router.post('/invitations/:id/payment/confirm', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    const paymentKey = normalizeText(req.body?.paymentKey);
    const orderId = normalizeText(req.body?.orderId);
    const amount = Number(req.body?.amount);

    if (!identifier || !paymentKey || !orderId || !Number.isFinite(amount)) {
      return res.status(400).json({ error: 'INVALID_CONFIRM_PAYLOAD' });
    }

    const access = await assertEditableInvitation(req, identifier);
    if ('error' in access && access.error) {
      return res.status(access.errorStatus).json({ error: access.error });
    }

    const invitation = access.invitation!;
    const result = await confirmPaymentAttempt({
      invitationId: invitation.id,
      paymentKey,
      orderId,
      amount,
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.code, message: result.message });
    }

    return res.status(200).json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      paymentId: result.payment.id,
      status: result.payment.status,
      paidAt: result.payment.paidAt?.toISOString() ?? null,
      isPaid: true,
    });
  } catch (error) {
    console.error('[payments] confirm failed', error);
    return res.status(500).json({ error: 'CONFIRM_FAILED' });
  }
});

// GET /api/invitations/:id/payment/status
router.get('/invitations/:id/payment/status', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    const paymentId = normalizeText(req.query.paymentId);
    const orderId = normalizeText(req.query.orderId);

    const access = await assertEditableInvitation(req, identifier);
    if ('error' in access && access.error) {
      return res.status(access.errorStatus).json({ error: access.error });
    }

    const invitation = access.invitation!;
    const paid = await hasPaidEntitlement(invitation.id);

    let attempt = null;
    if (paymentId) {
      attempt = await prisma.invitationPayment.findFirst({
        where: { id: paymentId, invitationId: invitation.id },
      });
    } else if (orderId) {
      attempt = await prisma.invitationPayment.findFirst({
        where: { providerOrderId: orderId, invitationId: invitation.id },
      });
    } else {
      attempt = await prisma.invitationPayment.findFirst({
        where: { invitationId: invitation.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.status(200).json({
      invitationId: invitation.id,
      isPaid: paid,
      status: attempt?.status ?? (paid ? 'PAID' : null),
      paymentId: attempt?.id ?? null,
      orderId: attempt?.providerOrderId ?? null,
      paidAt: attempt?.paidAt?.toISOString() ?? null,
      chargedAmount: attempt?.chargedAmount ?? null,
      currency: attempt?.currency ?? null,
    });
  } catch (error) {
    console.error('[payments] status failed', error);
    return res.status(500).json({ error: 'PAYMENT_STATUS_FAILED' });
  }
});

/**
 * POST /api/payments/webhook
 * Toss general payment webhooks do not use Stripe-style HMAC.
 * Verify by re-querying Toss Payment API with paymentKey.
 */
router.post('/payments/webhook', async (req, res) => {
  try {
    const eventType = normalizeText(req.body?.eventType);
    const data = (req.body?.data || {}) as Record<string, unknown>;
    const paymentKey = normalizeText(data.paymentKey);
    const orderId = normalizeText(data.orderId);
    const status = normalizeText(data.status);
    const createdAt = normalizeText(req.body?.createdAt) || new Date().toISOString();

    if (eventType && eventType !== 'PAYMENT_STATUS_CHANGED') {
      return res.status(200).json({ ok: true, ignored: true, eventType });
    }

    if (!paymentKey) {
      return res.status(400).json({ error: 'PAYMENT_KEY_REQUIRED' });
    }

    const providerEventId = `toss:${paymentKey}:${status || 'unknown'}:${createdAt}`;
    const dedupe = await recordWebhookEvent({
      provider: 'toss_payments',
      providerEventId,
      eventType: eventType || 'PAYMENT_STATUS_CHANGED',
    });
    if (dedupe === 'duplicate') {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Development mock webhook path (explicit header) for tests without Toss network
    const mockSecret = normalizeText(req.headers['x-mock-webhook-secret'] as string);
    if (mockSecret && resolvePaymentProvider() === 'mock') {
      const expected = process.env.PAYMENT_WEBHOOK_SECRET || 'dev-mock-webhook-secret';
      if (mockSecret !== expected) {
        return res.status(401).json({ error: 'INVALID_SIGNATURE' });
      }
      const mapped =
        status.toUpperCase() === 'DONE' || status.toUpperCase() === 'PAID'
          ? InvitationPaymentStatus.PAID
          : status.toUpperCase() === 'CANCELED'
            ? InvitationPaymentStatus.CANCELED
            : status.toUpperCase() === 'ABORTED' || status.toUpperCase() === 'FAILED'
              ? InvitationPaymentStatus.FAILED
              : null;
      if (!mapped) {
        return res.status(200).json({ ok: true, ignored: true });
      }
      const marked = await markPaymentStatus({
        provider: 'mock',
        providerOrderId: orderId || undefined,
        providerPaymentId: paymentKey,
        status: mapped,
        skipAmountCheck: mapped !== InvitationPaymentStatus.PAID,
        amountCents: typeof data.totalAmount === 'number' ? data.totalAmount : undefined,
        currency: typeof data.currency === 'string' ? data.currency : undefined,
        rawProviderStatus: `mock_webhook_${status}`,
      });
      return res.status(marked.ok ? 200 : 400).json({ ok: marked.ok, reason: marked.reason });
    }

    const reconciled = await reconcileTossPaymentByKey(paymentKey);
    if (!reconciled.ok) {
      console.warn('[payments] webhook reconcile failed', {
        paymentKey,
        orderId,
        reason: reconciled.reason,
      });
      return res.status(400).json({ error: reconciled.reason || 'RECONCILE_FAILED' });
    }

    console.info('[payments] webhook applied', {
      eventType: eventType || 'PAYMENT_STATUS_CHANGED',
      paymentId: reconciled.payment?.id,
      status: reconciled.payment?.status,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[payments] webhook failed', error);
    return res.status(500).json({ error: 'WEBHOOK_FAILED' });
  }
});

export default router;
