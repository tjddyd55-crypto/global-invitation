'use client';

import styles from './MarketingLayout.module.css';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import SiteLegalFooterNav from '@/src/components/layout/SiteLegalFooterNav';

type MarketingLayoutProps = {
  children: React.ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>{children}</main>

      <div className={styles.footerBlock}>
        <SiteLegalFooterNav />
        <SiteBusinessFooter className={styles.footerBusiness} />
      </div>
    </div>
  );
}
