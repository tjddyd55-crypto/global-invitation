'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useServiceWorker } from '@/src/shared/platform/useServiceWorker';
import styles from './MobileShell.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/m', label: '홈', icon: '🏠' },
  { href: '/m/templates', label: '만들기', icon: '✨' },
  { href: '/m/my-invitations', label: '내 초대장', icon: '📬' },
  { href: '/m/dashboard', label: '대시보드', icon: '📊' },
];

/**
 * PWA 스타일 모바일 쉘.
 * - 상단 세이프에어리어, 하단 바텀네비.
 * - 실제 페이지 콘텐츠는 children 으로만 받는다 (쉘이 도메인 로직을 알면 안 됨).
 */
export default function MobileShell({ children }: { children: ReactNode }) {
  useServiceWorker();
  const pathname = usePathname() ?? '';
  return (
    <div className={styles.root}>
      <main className={styles.content}>{children}</main>
      <nav className={styles.bottomNav} aria-label="primary">
        {NAV_ITEMS.map((item) => {
          const active = isActiveNav(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function isActiveNav(pathname: string, href: string): boolean {
  if (href === '/m') return pathname === '/m';
  return pathname === href || pathname.startsWith(`${href}/`);
}
