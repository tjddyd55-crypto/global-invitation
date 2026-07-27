'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { PlusIcon, SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './MarketingDesktopHeader.module.css';

export interface MarketingDesktopHeaderProps {
  /** 컨셉 선택 등 집중이 필요한 화면에서는 nav 를 숨긴다. */
  showNav?: boolean;
  /** 표시용 상태 힌트. 렌더 분기에는 쓰지 않는다 — 프레젠테이션은 로그인 여부와 무관하게 동일하다. */
  isLoggedIn?: boolean;
  createHref: string;
  myInvitationsHref: string;
}

const NAV_ITEMS = [
  { href: '/#service-intro', label: '서비스 소개' },
  { href: '/#examples', label: '완성 예시' },
  { href: '/pricing', label: '요금 안내' },
  { href: '/contact', label: '고객센터' },
];

/**
 * Figma Make `DesktopHeader` — marketing/concept 공용 데스크톱 헤더 (`>=1024px`).
 * 로그인 여부는 caller 가 `createHref` / `myInvitationsHref` 로만 반영한다
 * (컴포넌트 내부에서 인증 상태를 조회하지 않는다 — 프레젠테이션은 항상 동일).
 */
export default function MarketingDesktopHeader({
  showNav = true,
  isLoggedIn,
  createHref,
  myInvitationsHref,
}: MarketingDesktopHeaderProps) {
  return (
    <header className={styles.header} data-auth-state={isLoggedIn ? 'authenticated' : 'anonymous'}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="Invite 홈으로">
          <span className={styles.logoBadge}>
            <SparklesIcon size={18} />
          </span>
          <span className={styles.logoText}>Invite</span>
        </Link>

        {showNav ? (
          <nav className={styles.nav} aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : (
          <span aria-hidden className={styles.navSpacer} />
        )}

        <div className={styles.actions}>
          <Link href={myInvitationsHref} className={styles.myInvitationsLink}>
            내 초대장
          </Link>
          <Link href={createHref} className={styles.createButton} data-testid="header-create-cta">
            <PlusIcon size={16} />
            초대장 만들기
          </Link>
        </div>
      </div>
    </header>
  );
}
