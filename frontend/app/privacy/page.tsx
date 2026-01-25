'use client';

import MarketingLayout from '@/src/components/MarketingLayout';
import styles from '@/src/components/MarketingContent.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type PrivacySection = {
  titleKey: string;
  bodyKey: string;
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    titleKey: I18N_KEYS.marketing.privacySectionDataTitle,
    bodyKey: I18N_KEYS.marketing.privacySectionDataBody,
  },
  {
    titleKey: I18N_KEYS.marketing.privacySectionUseTitle,
    bodyKey: I18N_KEYS.marketing.privacySectionUseBody,
  },
  {
    titleKey: I18N_KEYS.marketing.privacySectionContactTitle,
    bodyKey: I18N_KEYS.marketing.privacySectionContactBody,
  },
];

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <section className={styles.section}>
        <h1 className={styles.title}>{t(I18N_KEYS.marketing.privacyTitle)}</h1>
        <p className={styles.subtitle}>{t(I18N_KEYS.marketing.privacySubtitle)}</p>
        <div className={styles.cardGrid}>
          {PRIVACY_SECTIONS.map((section) => (
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
