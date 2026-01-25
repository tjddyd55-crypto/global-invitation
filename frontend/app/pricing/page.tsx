'use client';

import MarketingLayout from '@/src/components/MarketingLayout';
import styles from '@/src/components/MarketingContent.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

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

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <section className={styles.section}>
        <h1 className={styles.title}>{t(I18N_KEYS.marketing.pricingPageTitle)}</h1>
        <p className={styles.subtitle}>{t(I18N_KEYS.marketing.pricingPageSubtitle)}</p>
        <div className={styles.cardGrid}>
          {PRICING_PLANS.map((plan) => (
            <div key={plan.nameKey} className={styles.card}>
              <h2 className={styles.cardTitle}>{t(plan.nameKey)}</h2>
              <p className={styles.cardText}>{t(plan.descriptionKey)}</p>
            </div>
          ))}
        </div>
        <p className={styles.note}>{t(I18N_KEYS.marketing.pricingPageNote)}</p>
      </section>
    </MarketingLayout>
  );
}
