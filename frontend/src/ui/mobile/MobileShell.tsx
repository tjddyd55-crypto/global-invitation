'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { shouldShowMobileBottomNavigation } from '@/src/shared/platform/mobileBottomNavigation';
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
 * Bottom Navigation 표시는 shouldShowMobileBottomNavigation SSOT만 따른다.
 */
export default function MobileShell({ children }: { children: ReactNode }) {
  useServiceWorker();
  const pathname = usePathname() ?? '';
  const showBottomNav = shouldShowMobileBottomNavigation(pathname);
  const isEditorChrome = pathname.includes('/editor');
  const isConceptChrome =
    pathname === '/m/templates' ||
    pathname.startsWith('/m/templates/') ||
    pathname === '/m/create' ||
    pathname.startsWith('/m/create/');
  const chrome = isEditorChrome ? 'editor' : isConceptChrome ? 'concept' : 'default';

  return (
    <div
      className={styles.root}
      data-bottom-nav={showBottomNav ? 'visible' : 'hidden'}
      data-chrome={chrome}
    >
      <main className={styles.content}>{children}</main>
      {showBottomNav ? (
        <nav className={styles.bottomNav} aria-label="primary" data-testid="mobile-bottom-nav">
          {NAV_ITEMS.map((item) => {
            const active = isActiveNav(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                aria-current={active ? 'page' : undefined}
              >
                <span aria-hidden className={styles.navIcon}>
                  {item.icon}
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function isActiveNav(pathname: string, href: string): boolean {
  if (href === '/m') return pathname === '/m';
  return pathname === href || pathname.startsWith(`${href}/`);
}
