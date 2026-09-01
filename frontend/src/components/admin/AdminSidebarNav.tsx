'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { AdminSession } from '@/src/lib/adminApi';
import {
  ADMIN_NAV_GROUPS,
  SUPER_ADMIN_NAV_ITEM,
  isAdminNavGroupActive,
  isAdminNavItemActive,
} from './adminNavConfig';
import styles from './AdminShell.module.css';

type AdminSidebarNavProps = {
  pathname: string;
  session: AdminSession;
};

export default function AdminSidebarNav({ pathname, session }: AdminSidebarNavProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const groups = useMemo(() => {
    const mapped = ADMIN_NAV_GROUPS.map((group) => ({
      ...group,
      isActive: isAdminNavGroupActive(pathname, tab, group),
      items: group.items.map((item) => ({
        ...item,
        isActive: isAdminNavItemActive(pathname, tab, item),
      })),
    }));

    if (session.role === 'SUPER_ADMIN') {
      mapped.push({
        id: 'super',
        label: 'Super Admin',
        isActive:
          pathname === SUPER_ADMIN_NAV_ITEM.href ||
          pathname.startsWith(`${SUPER_ADMIN_NAV_ITEM.href}/`),
        items: [
          {
            href: SUPER_ADMIN_NAV_ITEM.href,
            label: SUPER_ADMIN_NAV_ITEM.label,
            isActive:
              pathname === SUPER_ADMIN_NAV_ITEM.href ||
              pathname.startsWith(`${SUPER_ADMIN_NAV_ITEM.href}/`),
          },
        ],
      });
    }

    return mapped;
  }, [pathname, session.role, tab]);

  return (
    <>
      {groups.map((group) => (
        <div key={group.id} className={styles.navGroup}>
          <div
            className={`${styles.navGroupLabel} ${group.isActive ? styles.navGroupLabelActive : ''}`}
          >
            {group.label}
          </div>
          <div className={styles.navSub}>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navSubLink} ${item.isActive ? styles.navSubLinkActive : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
