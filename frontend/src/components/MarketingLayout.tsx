'use client';

import Link from 'next/link';
import styles from './MarketingLayout.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type MarketingLayoutProps = {
  children: React.ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <Link href="/terms">{t(I18N_KEYS.marketing.footerTerms)}</Link>
        <Link href="/privacy">{t(I18N_KEYS.marketing.footerPrivacy)}</Link>
        <Link href="/contact">{t(I18N_KEYS.marketing.footerContact)}</Link>
      </footer>
    </div>
  );
}
