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
  createCheckoutAttempt,
  getPaymentSummaryForInvitation,
  hasPaidEntitlement,
  markPaymentStatus,
  recordWebhookEvent,
} from '../lib/payments/service';
import {
  parseStripeWebhookEvent,
  resolvePaymentProvider,
  verifyStripeWebhookSignature,
} from '../lib/payments/provider';
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

// GET /api/invitations/:id/payment — owner summary
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

// POST /api/invitations/:id/payment/checkout
router.post('/invitations/:id/payment/checkout', async (req, res) => {
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
    const result = await createCheckoutAttempt({
      invitationId: invitation.id,
      userId: access.user?.id || invitation.userId,
    });

    if (!result.ok) {
      return res.status(502).json({ error: result.code });
    }

    if (result.alreadyPaid) {
      return res.status(409).json({
        error: 'ALREADY_PAID',
        paymentId: result.paymentId,
      });
    }

    return res.status(200).json({
      paymentId: result.paymentId,
      checkoutUrl: result.checkoutUrl,
      provider: result.provider,
      pricing: getInvitationPricingSnapshot(),
    });
  } catch (error) {
    console.error('[payments] checkout failed', error);
    return res.status(500).json({ error: 'CHECKOUT_FAILED' });
  }
});

// GET /api/invitations/:id/payment/status
router.get('/invitations/:id/payment/status', async (req, res) => {
  try {
    const identifier = normalizeText(req.params.id);
    const paymentId = normalizeText(req.query.paymentId);

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
      paidAt: attempt?.paidAt?.toISOString() ?? null,
      chargedAmount: attempt?.chargedAmount ?? null,
      currency: attempt?.currency ?? null,
    });
  } catch (error) {
    console.error('[payments] status failed', error);
    return res.status(500).json({ error: 'PAYMENT_STATUS_FAILED' });
  }
});

// GET /api/payments/mock/complete — development mock provider only
router.get('/payments/mock/complete', async (req, res) => {
  try {
    const provider = resolvePaymentProvider();
    if (provider !== 'mock') {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const checkoutId = normalizeText(req.query.checkoutId);
    const redirect = normalizeText(req.query.redirect);
    if (!checkoutId) {
      return res.status(400).json({ error: 'CHECKOUT_ID_REQUIRED' });
    }

    const result = await markPaymentStatus({
      provider: 'mock',
      providerCheckoutId: checkoutId,
      providerPaymentId: `mock_pi_${checkoutId}`,
      status: InvitationPaymentStatus.PAID,
      currency: 'USD',
      amountCents: getInvitationPricingSnapshot().chargedAmountCents,
      rawProviderStatus: 'mock_complete',
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.reason || 'MOCK_COMPLETE_FAILED' });
    }

    if (redirect) {
      return res.redirect(302, redirect);
    }
    return res.status(200).json({ ok: true, paymentId: result.payment?.id });
  } catch (error) {
    console.error('[payments] mock complete failed', error);
    return res.status(500).json({ error: 'MOCK_COMPLETE_FAILED' });
  }
});

// POST /api/payments/mock/cancel — mark attempt canceled (dev)
router.post('/payments/mock/cancel', async (req, res) => {
  try {
    if (resolvePaymentProvider() !== 'mock') {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    const paymentId = normalizeText(req.body?.paymentId);
    if (!paymentId) {
      return res.status(400).json({ error: 'PAYMENT_ID_REQUIRED' });
    }
    const result = await markPaymentStatus({
      paymentId,
      provider: 'mock',
      status: InvitationPaymentStatus.CANCELED,
      rawProviderStatus: 'mock_canceled',
      skipAmountCheck: true,
    });
    if (!result.ok) {
      return res.status(400).json({ error: result.reason });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[payments] mock cancel failed', error);
    return res.status(500).json({ error: 'MOCK_CANCEL_FAILED' });
  }
});

// POST /api/payments/webhook — Stripe (raw body attached by index)
router.post('/payments/webhook', async (req, res) => {
  try {
    const provider = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase() === 'mock' ? 'mock' : 'stripe';

    if (provider === 'mock') {
      // Mock webhooks use signed shared secret body for tests
      const eventId = normalizeText(req.body?.providerEventId);
      const paymentId = normalizeText(req.body?.paymentId);
      const statusRaw = normalizeText(req.body?.status).toUpperCase();
      const secret = normalizeText(req.headers['x-mock-webhook-secret'] as string);
      const expected = process.env.PAYMENT_WEBHOOK_SECRET || 'dev-mock-webhook-secret';
      if (secret !== expected) {
        return res.status(401).json({ error: 'INVALID_SIGNATURE' });
      }
      if (!eventId || !paymentId || !statusRaw) {
        return res.status(400).json({ error: 'INVALID_PAYLOAD' });
      }

      const dedupe = await recordWebhookEvent({
        provider: 'mock',
        providerEventId: eventId,
        eventType: statusRaw,
      });
      if (dedupe === 'duplicate') {
        return res.status(200).json({ ok: true, duplicate: true });
      }

      const status =
        statusRaw === 'PAID' ||
        statusRaw === 'FAILED' ||
        statusRaw === 'CANCELED' ||
        statusRaw === 'REFUNDED'
          ? (statusRaw as InvitationPaymentStatus)
          : null;
      if (!status) {
        return res.status(400).json({ error: 'INVALID_STATUS' });
      }

      const amountCents =
        typeof req.body?.amountCents === 'number' ? req.body.amountCents : undefined;
      const currency = typeof req.body?.currency === 'string' ? req.body.currency : undefined;

      const result = await markPaymentStatus({
        paymentId,
        provider: 'mock',
        status,
        amountCents,
        currency,
        rawProviderStatus: `mock_webhook_${statusRaw}`,
      });

      if (!result.ok) {
        return res.status(400).json({ error: result.reason });
      }
      return res.status(200).json({ ok: true });
    }

    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      return res.status(400).json({ error: 'RAW_BODY_REQUIRED' });
    }

    const signature = req.headers['stripe-signature'] as string | undefined;
    if (!verifyStripeWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'INVALID_SIGNATURE' });
    }

    const parsed = parseStripeWebhookEvent(rawBody);
    if (parsed.kind === 'ignored') {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const dedupe = await recordWebhookEvent({
      provider: 'stripe',
      providerEventId: parsed.providerEventId,
      eventType: parsed.eventType,
    });
    if (dedupe === 'duplicate') {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const result = await markPaymentStatus({
      provider: 'stripe',
      providerCheckoutId: parsed.providerCheckoutId,
      providerPaymentId: parsed.providerPaymentId,
      status: InvitationPaymentStatus[parsed.status],
      currency: parsed.currency,
      amountCents: parsed.amountCents ?? undefined,
      rawProviderStatus: parsed.rawProviderStatus,
    });

    if (!result.ok) {
      console.warn('[payments] webhook apply failed', {
        eventId: parsed.providerEventId,
        reason: result.reason,
      });
      return res.status(400).json({ error: result.reason });
    }

    console.info('[payments] webhook applied', {
      eventId: parsed.providerEventId,
      paymentId: result.payment?.id,
      status: parsed.status,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[payments] webhook failed', error);
    return res.status(500).json({ error: 'WEBHOOK_FAILED' });
  }
});

export default router;
