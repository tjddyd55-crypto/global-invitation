'use client';

import MarketingLayout from '@/src/components/MarketingLayout';
import styles from '@/src/components/MarketingContent.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type TermsSection = {
  titleKey: string;
  bodyKey: string;
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    titleKey: I18N_KEYS.marketing.termsSectionServiceTitle,
    bodyKey: I18N_KEYS.marketing.termsSectionServiceBody,
  },
  {
    titleKey: I18N_KEYS.marketing.termsSectionContentTitle,
    bodyKey: I18N_KEYS.marketing.termsSectionContentBody,
  },
  {
    titleKey: I18N_KEYS.marketing.termsSectionChangeTitle,
    bodyKey: I18N_KEYS.marketing.termsSectionChangeBody,
  },
];

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <section className={styles.section}>
        <h1 className={styles.title}>{t(I18N_KEYS.marketing.termsTitle)}</h1>
        <p className={styles.subtitle}>{t(I18N_KEYS.marketing.termsSubtitle)}</p>
        <div className={styles.cardGrid}>
          {TERMS_SECTIONS.map((section) => (
            <div key={section.titleKey} className={styles.card}>
              <h2 className={styles.cardTitle}>{t(section.titleKey)}</h2>
              <p className={styles.cardText}>{t(section.bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
