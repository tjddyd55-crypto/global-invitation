'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './PcShell.module.css';

interface NavItem {
  href: string;
  label: string;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { href: '/pc', label: '대시보드' },
  { href: '/pc/templates', label: '템플릿' },
  { href: '/pc/dashboard', label: '내 초대장' },
  { href: '/pc/settings', label: '설정' },
];

/**
 * PC 데스크톱 쉘.
 * - 좌측 고정 사이드바 + 상단 유틸바 + 우측 메인 콘텐츠.
 * - 관리·편집 기능에 최적화된 다중 컬럼 레이아웃.
 */
export default function PcShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Global Invitation</div>
        <nav aria-label="primary" className={styles.nav}>
          {SIDEBAR_ITEMS.map((item) => {
            const active = isActiveNav(pathname, item.href);
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

function isActiveNav(pathname: string, href: string): boolean {
  if (href === '/pc') return pathname === '/pc';
  return pathname === href || pathname.startsWith(`${href}/`);
}
