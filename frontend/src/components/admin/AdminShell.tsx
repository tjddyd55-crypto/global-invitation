'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getAdminSession, logoutAdmin, type AdminSession } from '@/src/shared/api';
import styles from './AdminShell.module.css';

type AdminShellProps = {
  children: React.ReactNode;
};

const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/music', label: '음악 라이브러리' },
  { href: '/admin/templates', label: 'Template Management' },
  { href: '/admin/template-submissions', label: 'Template Submissions' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/system', label: 'System' },
];

const SUPER_NAV_ITEM = { href: '/admin/super/credit-policies', label: 'Super Admin' } as const;

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await getAdminSession();
        if (!isMounted) return;
        setSession(nextSession);
      } catch {
        if (!isMounted) return;
        router.replace('/admin/login');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [isLoginPage, router]);

  const navItems = useMemo(() => {
    const base = ADMIN_NAV_ITEMS.map((item) => ({
      ...item,
      isActive: pathname === item.href || pathname.startsWith(`${item.href}/`),
    }));
    if (session?.role === 'SUPER_ADMIN') {
      const superItem = {
        ...SUPER_NAV_ITEM,
        isActive:
          pathname === SUPER_NAV_ITEM.href || pathname.startsWith(`${SUPER_NAV_ITEM.href}/`),
      };
      return [...base, superItem];
    }
    return base;
  }, [pathname, session?.role]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className={styles.loading}>관리자 인증 상태를 확인하는 중입니다...</div>;
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await logoutAdmin().catch(() => undefined);
    router.replace('/admin/login');
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Global Invitation Admin</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${item.isActive ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div>{session.email}</div>
          <Link href="/" className={styles.userScreenLink}>
            사용자 화면
          </Link>
          <button type="button" onClick={handleLogout} className={styles.logoutButton}>
            로그아웃
          </button>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
