'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ADMIN_NAV_GROUPS,
  isAdminNavGroupActiveByPathname,
} from './adminNavConfig';
import styles from './AdminShell.module.css';

type AdminSidebarNavFallbackProps = {
  pathname: string;
};

/** Suspense fallback: pathname-only active until query tab resolves. */
export default function AdminSidebarNavFallback({ pathname }: AdminSidebarNavFallbackProps) {
  const groups = useMemo(
    () =>
      ADMIN_NAV_GROUPS.map((group) => ({
        ...group,
        isActive: isAdminNavGroupActiveByPathname(pathname, group),
      })),
    [pathname]
  );

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
              <Link key={item.href} href={item.href} className={styles.navSubLink}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
