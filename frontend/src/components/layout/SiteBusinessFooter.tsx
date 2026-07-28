'use client';
/* eslint-disable i18next/no-literal-string */

import styles from './SiteBusinessFooter.module.css';

type SiteBusinessFooterProps = {
  className?: string;
};

/**
 * 서비스 공통 Footer 사업자 정보 SSOT.
 * 페이지마다 문구를 복제하지 말고 이 컴포넌트만 사용한다.
 */
export default function SiteBusinessFooter({ className }: SiteBusinessFooterProps) {
  return (
    <footer
      className={`${styles.footer} ${className || ''}`.trim()}
      data-testid="site-business-footer"
    >
      <p>
        All-in-One Solution | Owner: Sungyong Park | Business Registration No. 232-51-00991
      </p>
      <p>39, Cheonho-daero 114-gil, Gwangjin-gu, Seoul, Republic of Korea</p>
      <p>
        Email:{' '}
        <a href="mailto:tjddyd55@naver.com">tjddyd55@naver.com</a>
        {' | '}
        Privacy Inquiries:{' '}
        <a href="tel:+821022221382">+82-10-2222-1382</a>
      </p>
      <p>© 2026 All-in-One Solution. All rights reserved.</p>
    </footer>
  );
}
