import { Router } from 'express';
import { InvitationPaymentStatus, InvitationStatus, type Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';
import { isE2eFactoryDisabled } from '../lib/e2eFactoryGuard';
import { parseCreateInvitationLocale, stripLegacyDataJsonLocale } from '../lib/invitationLocale';
import { getInvitationPricingSnapshot } from '../lib/pricing/invitationPricing';

const router = Router();
const TITLE_PREFIX = '[E2E-LOCALE]';

function isProductionEnvironment(): boolean {
  return isE2eFactoryDisabled();
}

function e2eSlug(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

router.post('/', async (req, res) => {
  if (isProductionEnvironment()) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const parsed = parseCreateInvitationLocale(
      typeof req.body?.language === 'string'
        ? req.body.language
        : typeof req.body?.locale === 'string'
          ? req.body.locale
          : undefined
    );
    if (!parsed.ok) {
      return res.status(400).json({ error: 'INVALID_LOCALE' });
    }

    const visualTemplateId =
      typeof req.body?.visualTemplateId === 'string' && req.body.visualTemplateId.trim()
        ? req.body.visualTemplateId.trim()
        : 'WEDDING_05_GARDEN';
    const conceptType =
      typeof req.body?.conceptType === 'string' && req.body.conceptType.trim()
        ? req.body.conceptType.trim()
        : 'WEDDING';
    const title = `${TITLE_PREFIX} ${parsed.locale} ${Date.now()}`;
    const isFuneral = conceptType === 'FUNERAL';
    const isEn = parsed.locale === 'en-US';
    const locationText = isEn
      ? isFuneral
        ? 'Serenity Memorial Hall'
        : 'The Garden Hall'
      : isFuneral
        ? '서울아산병원 장례식장'
        : '라움 아트센터';
    const eventDate = isFuneral ? '2026-10-17T10:00:00' : '2026-10-17T14:00:00';
    const dataJson = stripLegacyDataJsonLocale({
      templateType: 'FULL',
      conceptType,
      ...(isFuneral ? {} : { visualTemplateId }),
      title,
      eventDate,
      locationText,
      venueName: locationText,
      rsvpEnabled: true,
      guestbookEnabled: true,
      commentsEnabled: true,
      ...(isFuneral
        ? {
            deceasedName: isEn ? 'Michael Anderson' : '홍길동',
            deathDate: '2026-10-17',
            chiefMourner: isEn ? 'Sarah Anderson' : '홍상주',
            message: isEn ? 'In loving memory.' : '삼가 고인의 명복을 빕니다.',
            funeralHall: { name: locationText, address: locationText },
            schedule: { funeralDate: eventDate },
          }
        : {}),
    }) as Prisma.InputJsonValue;

    const invitation = await prisma.invitation.create({
      data: {
        slug: e2eSlug('e2e-locale'),
        shareSlug: e2eSlug('e2e-pub'),
        ownerType: 'USER',
        ownerId: user.id,
        createdBy: user.id,
        userId: user.id,
        status: InvitationStatus.PUBLISHED,
        isPublished: true,
        isPaid: true,
        canShare: true,
        publishedAt: new Date(),
        paidAt: new Date(),
        templateKey: 'invitation_full',
        title,
        language: parsed.locale,
        data: dataJson,
        dataJson,
        eventDate: new Date('2026-10-17T14:00:00Z'),
        locationText,
        countryCode: 'GLOBAL',
      },
      select: {
        id: true,
        shareSlug: true,
        language: true,
        title: true,
      },
    });

    const pricing = getInvitationPricingSnapshot();
    await prisma.invitationPayment.create({
      data: {
        invitationId: invitation.id,
        userId: user.id,
        provider: 'mock',
        providerPaymentId: `e2e-locale-${invitation.id}`,
        currency: pricing.currency,
        listPriceAmount: pricing.listPriceCents,
        chargedAmount: pricing.chargedAmountCents,
        promotionCode: pricing.promotionCode,
        status: InvitationPaymentStatus.PAID,
        paidAt: new Date(),
        rawProviderStatus: JSON.stringify({ e2e: true, source: 'test-published-invitation' }),
      },
    });

    return res.status(201).json({
      id: invitation.id,
      shareSlug: invitation.shareSlug,
      language: invitation.language,
      title: invitation.title,
    });
  } catch (error) {
    console.error('Error in test published invitation factory:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_TEST_INVITATION' });
  }
});

router.delete('/:id', async (req, res) => {
  if (isProductionEnvironment()) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: req.params.id, userId: user.id, isDeleted: false },
      select: { id: true, slug: true, title: true, shareSlug: true },
    });
    if (!invitation) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    const allowed =
      (invitation.title || '').startsWith(TITLE_PREFIX) ||
      invitation.slug.startsWith('e2e-locale-') ||
      (invitation.shareSlug || '').startsWith('e2e-pub-');
    if (!allowed) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    await prisma.rSVP.deleteMany({ where: { invitationId: invitation.id } });
    await prisma.invitationComment.deleteMany({ where: { invitationId: invitation.id } });
    await prisma.invitationPayment.deleteMany({
      where: { invitationId: invitation.id, provider: 'mock' },
    });
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { isDeleted: true },
    });
    return res.status(204).send();
  } catch (error) {
    console.error('Error cleaning test published invitation:', error);
    return res.status(500).json({ error: 'FAILED_TO_DELETE_TEST_INVITATION' });
  }
});

export default router;
