'use client';

import MarketingLayout from '@/src/components/MarketingLayout';
import styles from '@/src/components/MarketingContent.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <MarketingLayout>
      <section className={styles.section}>
        <h1 className={styles.title}>{t(I18N_KEYS.marketing.aboutTitle)}</h1>
        <p className={styles.subtitle}>{t(I18N_KEYS.marketing.aboutSubtitle)}</p>
        <ul className={styles.list}>
          <li>{t(I18N_KEYS.marketing.aboutPointOne)}</li>
          <li>{t(I18N_KEYS.marketing.aboutPointTwo)}</li>
          <li>{t(I18N_KEYS.marketing.aboutPointThree)}</li>
        </ul>
      </section>
    </MarketingLayout>
  );
}
