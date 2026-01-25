'use client';

import Link from 'next/link';
import styles from './HomePageClient.module.css';
import MarketingLayout from './MarketingLayout';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type Translate = (key: string) => string;

type CardLink = {
  href: string;
  labelKey: string;
};

type DemoCard = {
  titleKey: string;
  descriptionKey: string;
  links: CardLink[];
};

type PricingPlan = {
  nameKey: string;
  descriptionKey: string;
};

const DEMO_CARDS: DemoCard[] = [
  {
    titleKey: I18N_KEYS.marketing.cardInvitationTitle,
    descriptionKey: I18N_KEYS.marketing.cardInvitationDescription,
    links: [
      { href: '/invitation/demo-wedding-classic', labelKey: I18N_KEYS.marketing.cardInvitationCtaWedding },
      { href: '/invitation/demo-funeral-classic', labelKey: I18N_KEYS.marketing.cardInvitationCtaFuneral },
    ],
  },
  {
    titleKey: I18N_KEYS.marketing.cardMessageTitle,
    descriptionKey: I18N_KEYS.marketing.cardMessageDescription,
    links: [
      { href: '/message/demo-thank-you', labelKey: I18N_KEYS.marketing.cardMessageCtaThankYou },
      { href: '/message/demo-simple', labelKey: I18N_KEYS.marketing.cardMessageCtaSimple },
    ],
  },
  {
    titleKey: I18N_KEYS.marketing.cardBrandedTitle,
    descriptionKey: I18N_KEYS.marketing.cardBrandedDescription,
    links: [
      { href: '/message/branded/demo-jci', labelKey: I18N_KEYS.marketing.cardBrandedCtaJci },
    ],
  },
];

const PRICING_PLANS: PricingPlan[] = [
  {
    nameKey: I18N_KEYS.marketing.pricingPlanFreeName,
    descriptionKey: I18N_KEYS.marketing.pricingPlanFreeDescription,
  },
  {
    nameKey: I18N_KEYS.marketing.pricingPlanBasicName,
    descriptionKey: I18N_KEYS.marketing.pricingPlanBasicDescription,
  },
  {
    nameKey: I18N_KEYS.marketing.pricingPlanPlusName,
    descriptionKey: I18N_KEYS.marketing.pricingPlanPlusDescription,
  },
];

function HeroSection({ t }: { t: Translate }) {
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>{t(I18N_KEYS.marketing.heroTitle)}</h1>
      <p className={styles.heroSubtitle}>{t(I18N_KEYS.marketing.heroSubtitle)}</p>
      <div className={styles.heroActions}>
        <Link className={styles.primaryButton} href="/invitation/demo-wedding-classic">
          {t(I18N_KEYS.marketing.heroCtaPrimary)}
        </Link>
        <Link className={styles.secondaryButton} href="/pricing">
          {t(I18N_KEYS.marketing.heroCtaSecondary)}
        </Link>
      </div>
    </section>
  );
}

function FeaturesSection({ t }: { t: Translate }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t(I18N_KEYS.marketing.featuresTitle)}</h2>
      <ul className={styles.featureList}>
        <li>{t(I18N_KEYS.marketing.featuresItemOne)}</li>
        <li>{t(I18N_KEYS.marketing.featuresItemTwo)}</li>
        <li>{t(I18N_KEYS.marketing.featuresItemThree)}</li>
      </ul>
    </section>
  );
}

function DemoCardsSection({ t }: { t: Translate }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t(I18N_KEYS.marketing.cardsTitle)}</h2>
        <p className={styles.sectionSubtitle}>{t(I18N_KEYS.marketing.cardsSubtitle)}</p>
      </div>
      <div className={styles.cardGrid}>
        {DEMO_CARDS.map((card) => (
          <div key={card.titleKey} className={styles.card}>
            <h3 className={styles.cardTitle}>{t(card.titleKey)}</h3>
            <p className={styles.cardDescription}>{t(card.descriptionKey)}</p>
            <div className={styles.cardActions}>
              {card.links.map((link) => (
                <Link key={link.href} className={styles.cardButton} href={link.href}>
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSummarySection({ t }: { t: Translate }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t(I18N_KEYS.marketing.pricingSummaryTitle)}</h2>
        <Link className={styles.textLink} href="/pricing">
          {t(I18N_KEYS.marketing.pricingSummaryLink)}
        </Link>
      </div>
      <div className={styles.pricingGrid}>
        {PRICING_PLANS.map((plan) => (
          <div key={plan.nameKey} className={styles.pricingCard}>
            <h3 className={styles.cardTitle}>{t(plan.nameKey)}</h3>
            <p className={styles.cardDescription}>{t(plan.descriptionKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePageClient() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <HeroSection t={t} />
      <FeaturesSection t={t} />
      <DemoCardsSection t={t} />
      <PricingSummarySection t={t} />
    </MarketingLayout>
  );
}
