'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAdminSession, logoutAdmin, type AdminSession } from '@/src/lib/adminApi';
import AdminSidebarNav from './AdminSidebarNav';
import AdminSidebarNavFallback from './AdminSidebarNavFallback';
import styles from './AdminShell.module.css';

type AdminShellProps = {
  children: React.ReactNode;
};

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
        const next = pathname && pathname.startsWith('/admin') ? pathname : '/admin';
        const loginUrl =
          next === '/admin/login'
            ? '/admin/login'
            : `/admin/login?next=${encodeURIComponent(next)}`;
        router.replace(loginUrl);
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
  }, [isLoginPage, pathname, router]);

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
        <div className={styles.brand}>
          Global Invitation 관리자
          <span className={styles.envBadge}>DEVELOPMENT</span>
        </div>
        <nav className={styles.nav}>
          <Suspense fallback={<AdminSidebarNavFallback pathname={pathname} />}>
            <AdminSidebarNav pathname={pathname} session={session} />
          </Suspense>
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
