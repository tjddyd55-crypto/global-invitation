'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { appPath, resolveAppNavPrefix } from '@/src/shared/platform/appNavPrefix';
import { shouldShowMobileBottomNavigation } from '@/src/shared/platform/mobileBottomNavigation';
import { useServiceWorker } from '@/src/shared/platform/useServiceWorker';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { shouldShowSiteBusinessFooter } from '@/src/components/layout/shouldShowSiteBusinessFooter';
import styles from './MobileShell.module.css';

/**
 * PWA 스타일 모바일 쉘.
 * Bottom Navigation 표시는 shouldShowMobileBottomNavigation SSOT만 따른다.
 * 링크는 현재가 /m QA면 /m/*, canonical이면 공식 경로를 쓴다.
 */
export default function MobileShell({ children }: { children: ReactNode }) {
  useServiceWorker();
  const pathname = usePathname() ?? '';
  const prefix = resolveAppNavPrefix(pathname);
  const showBottomNav = shouldShowMobileBottomNavigation(pathname);
  const isEditorChrome = pathname.includes('/editor');
  const isConceptChrome =
    pathname === '/templates' ||
    pathname.startsWith('/templates/') ||
    pathname === '/m/templates' ||
    pathname.startsWith('/m/templates/') ||
    pathname === '/create' ||
    pathname.startsWith('/create/') ||
    pathname === '/m/create' ||
    pathname.startsWith('/m/create/') ||
    pathname === '/pc/create' ||
    pathname.startsWith('/pc/create/');
  const chrome = isEditorChrome ? 'editor' : isConceptChrome ? 'concept' : 'default';
  const showBusinessFooter = shouldShowSiteBusinessFooter(pathname) && !isEditorChrome;

  const navItems = [
    { href: appPath(prefix, '/'), label: '홈', icon: '🏠' },
    { href: appPath(prefix, '/create/concept'), label: '만들기', icon: '✨' },
    { href: appPath(prefix, '/my-invitations'), label: '내 초대장', icon: '📬' },
    { href: appPath(prefix, '/dashboard'), label: '대시보드', icon: '📊' },
  ];

  return (
    <div
      className={styles.root}
      data-bottom-nav={showBottomNav ? 'visible' : 'hidden'}
      data-chrome={chrome}
    >
      <main className={styles.content}>
        {children}
        {showBusinessFooter ? <SiteBusinessFooter /> : null}
      </main>
      {showBottomNav ? (
        <nav className={styles.bottomNav} aria-label="primary" data-testid="mobile-bottom-nav">
          {navItems.map((item) => {
            const active = isActiveNav(pathname, item.href, prefix);
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

function isActiveNav(pathname: string, href: string, prefix: '' | '/m' | '/pc'): boolean {
  const home = appPath(prefix, '/');
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}
