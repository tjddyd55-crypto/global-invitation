'use client';

import Link from 'next/link';
import MarketingSiteHeader from '@/src/features/marketing/ui/MarketingSiteHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { getCreateInvitationEntryPath } from '@/src/shared/auth/authEntryPaths';
import { useAuth } from '@/src/shared/hooks';
import {
  formatUsdFromCents,
  getInvitationDiscountCents,
  INVITATION_PRICING,
} from '@/src/shared/pricing/invitationPricing';
import { useI18n } from '@/src/contexts/I18nContext';
import { interpolate } from '@/src/i18n';
import styles from './PricingPage.module.css';

const FEATURE_KEYS = [
  'pricing.feature.templates',
  'pricing.feature.gallery',
  'pricing.feature.logo',
  'pricing.feature.schedule',
  'pricing.feature.map',
  'pricing.feature.accounts',
  'pricing.feature.rsvp',
  'pricing.feature.link',
  'pricing.feature.edit',
] as const;

const STEP_KEYS = [
  'pricing.step.create',
  'pricing.step.preview',
  'pricing.step.publish',
  'pricing.step.share',
] as const;

const FAQ_KEYS = [
  { q: 'pricing.faq.preview.q', a: 'pricing.faq.preview.a' },
  { q: 'pricing.faq.edit.q', a: 'pricing.faq.edit.a' },
  { q: 'pricing.faq.new.q', a: 'pricing.faq.new.a' },
] as const;

export default function PricingPage() {
  const { status } = useAuth();
  const { t } = useI18n();
  const createHref = getCreateInvitationEntryPath(status === 'loading' ? 'unauthenticated' : status);
  const list = formatUsdFromCents(INVITATION_PRICING.listPriceCents);
  const sale = formatUsdFromCents(INVITATION_PRICING.salePriceCents);
  const discount = formatUsdFromCents(getInvitationDiscountCents());
  const leadLines = t('pricing.heroLead').split('\n');

  return (
    <div className={styles.page} data-testid="pricing-page">
      <MarketingSiteHeader />
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>{t('pricing.heroTitle')}</h1>
          <p className={styles.heroLead}>
            {leadLines[0]}
            {leadLines[1] ? (
              <>
                <br />
                {leadLines[1]}
              </>
            ) : null}
          </p>
        </header>

        <section className={styles.card} aria-labelledby="pricing-main-title">
          <span className={styles.badge}>{t('pricing.badge')}</span>
          <h2 id="pricing-main-title" className={styles.srOnly}>
            {t('pricing.heroTitle')}
          </h2>
          <div className={styles.priceBlock}>
            <span className={styles.listPrice} aria-label={interpolate(t('pricing.listAria'), { price: list })}>
              {list}
            </span>
            <span className={styles.salePrice} aria-label={interpolate(t('pricing.saleAria'), { price: sale })}>
              {sale}
            </span>
          </div>
          <p className={styles.unit}>
            {interpolate(t('pricing.unit'), { currency: INVITATION_PRICING.currency })}
          </p>
          <p className={styles.note}>{interpolate(t('pricing.note'), { discount })}</p>
          <Link href={createHref} className={styles.cta} data-testid="pricing-create-cta">
            {t('pricing.cta')}
          </Link>
        </section>

        <section className={styles.section} aria-labelledby="pricing-features">
          <h2 id="pricing-features" className={styles.sectionTitle}>
            {t('pricing.featuresTitle')}
          </h2>
          <ul className={styles.featureList}>
            {FEATURE_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="pricing-steps">
          <h2 id="pricing-steps" className={styles.sectionTitle}>
            {t('pricing.stepsTitle')}
          </h2>
          <ol className={styles.steps}>
            {STEP_KEYS.map((key, index) => (
              <li key={key}>
                <span className={styles.stepNum} aria-hidden>
                  {index + 1}
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="pricing-faq">
          <h2 id="pricing-faq" className={styles.sectionTitle}>
            {t('pricing.faqTitle')}
          </h2>
          <div className={styles.faqList}>
            {FAQ_KEYS.map((item) => (
              <article key={item.q} className={styles.faqItem}>
                <h3 className={styles.faqQ}>{t(item.q)}</h3>
                <p className={styles.faqA}>{t(item.a)}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <div className={styles.footerWrap}>
        <SiteBusinessFooter />
      </div>
    </div>
  );
}
