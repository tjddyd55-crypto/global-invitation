'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getAdminSession, type AdminSession } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

const SUPER_NAV = [
  { href: '/admin/super/credit-policies', label: 'Credit Policies' },
  { href: '/admin/super/credit-packages', label: 'Credit Packages' },
  { href: '/admin/super/users', label: 'Users' },
  { href: '/admin/super/transactions', label: 'Transactions' },
  { href: '/admin/super/logs', label: 'Logs' },
  { href: '/admin/super/bulk-grant', label: 'Bulk Grant' },
] as const;

type Props = {
  children: React.ReactNode;
};

export default function SuperAdminShell({ children }: Props) {
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getAdminSession();
        if (mounted) setSession(me);
      } catch {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const nav = useMemo(
    () =>
      SUPER_NAV.map((item) => ({
        ...item,
        active: pathname === item.href || pathname.startsWith(`${item.href}/`),
      })),
    [pathname]
  );

  if (loading) {
    return <div className={styles.loading}>권한 확인 중…</div>;
  }

  if (!session || session.role !== 'SUPER_ADMIN') {
    return (
      <section className={styles.section}>
        <h1 className={styles.pageTitle}>403 Forbidden</h1>
        <p className={styles.pageDescription}>
          이 영역은 SUPER_ADMIN 계정만 접근할 수 있습니다. 일반 관리자는 이 URL에 접근할 수 없습니다.
        </p>
      </section>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-6 md:flex-row">
      <aside className="w-full shrink-0 border-b border-gray-200 pb-4 md:w-52 md:border-b-0 md:border-r md:pr-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Super Admin</p>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                item.active ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
