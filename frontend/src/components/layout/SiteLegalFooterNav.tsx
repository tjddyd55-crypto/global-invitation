'use client';

import Link from 'next/link';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from '../MarketingLayout.module.css';

export default function SiteLegalFooterNav() {
  const { t } = useI18n();
  return (
    <nav className={styles.footerNav} aria-label={t('marketing.footer.legalAria')} data-testid="footer-legal-nav">
      <Link href="/terms">{t('marketing.footer.terms')}</Link>
      <Link href="/privacy">{t('marketing.footer.privacy')}</Link>
      <Link href="/refund-policy" data-testid="footer-refund-policy">{t('marketing.footer.refund')}</Link>
      <Link href="/contact">{t('marketing.footer.contact')}</Link>
    </nav>
  );
}
