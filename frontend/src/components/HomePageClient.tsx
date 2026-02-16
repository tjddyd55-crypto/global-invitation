'use client';

import Link from 'next/link';
import styles from './HomePageClient.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type Translate = (key: string) => string;

type PricingPlan = {
  nameKey: string;
  descriptionKey: string;
};

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
        <Link className={styles.primaryButton} href="/templates">
          {t(I18N_KEYS.marketing.heroCtaPrimary)}
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

function MainHeader({ t }: { t: Translate }) {
  return (
    <header className={styles.mainHeader}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          {t(I18N_KEYS.marketing.brandName)}
        </Link>
        <nav className={styles.navMenu}>
          <Link href="/templates">{t(I18N_KEYS.marketing.navCreateInvitation)}</Link>
          <Link href="/my-invitations">{t(I18N_KEYS.marketing.navMyInvitations)}</Link>
          <Link href="/templates">{t(I18N_KEYS.marketing.navTemplates)}</Link>
        </nav>
      </div>
    </header>
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
    <div>
      <MainHeader t={t} />
      <HeroSection t={t} />
      <FeaturesSection t={t} />
      <PricingSummarySection t={t} />
    </div>
  );
}
