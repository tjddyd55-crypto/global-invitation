'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { appPath, resolveAppNavPrefix } from '@/src/shared/platform/appNavPrefix';
import styles from './PcShell.module.css';

/**
 * PC 데스크톱 쉘 (Figma Make SaaS 톤).
 * Editor 경로에서는 Figma DesktopEditor 단일 header를 위해 sidebar 를 숨긴다.
 */
export default function PcShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const prefix = resolveAppNavPrefix(pathname);
  const isEditor = pathname.includes('/editor');

  if (isEditor) {
    return (
      <div className={styles.rootEditor} data-chrome="editor">
        <main className={styles.mainEditor} data-testid="pc-shell-editor-main">
          {children}
        </main>
      </div>
    );
  }

  const sidebarItems = [
    { href: appPath(prefix, '/'), label: '홈' },
    { href: appPath(prefix, '/create/concept'), label: '초대장 만들기' },
    { href: appPath(prefix, '/my-invitations'), label: '내 초대장' },
    { href: appPath(prefix, '/dashboard'), label: '대시보드' },
  ];

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Global Invitation</div>
        <nav aria-label="primary" className={styles.nav}>
          {sidebarItems.map((item) => {
            const active = isActiveNav(pathname, item.href, prefix);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

function isActiveNav(pathname: string, href: string, prefix: '' | '/m' | '/pc'): boolean {
  const home = appPath(prefix, '/');
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}
