'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import styles from '@/src/components/admin/AdminShell.module.css';

type AdminPageHeaderProps = {
  breadcrumb?: Array<{ label: string; href?: string }>;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function AdminPageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className={styles.topbar}>
      <div>
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`}>
                {index > 0 ? <span className={styles.breadcrumbSep}> › </span> : null}
                {item.href ? (
                  <Link href={item.href} className={styles.breadcrumbLink}>
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className={styles.pageTitle}>{title}</h1>
        {description ? <p className={styles.pageDescription}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
