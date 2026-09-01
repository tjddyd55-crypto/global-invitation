'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getAdminSession, logoutAdmin, type AdminSession } from '@/src/lib/adminApi';
import styles from './AdminShell.module.css';

type AdminShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  tab?: string;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    items: [{ href: '/admin/dashboard', label: '대시보드' }],
  },
  {
    id: 'invitations',
    label: '초대장 관리',
    items: [{ href: '/admin/invitations', label: '초대장 목록' }],
  },
  {
    id: 'users',
    label: '회원 관리',
    items: [{ href: '/admin/users', label: '회원 목록' }],
  },
  {
    id: 'payments',
    label: '결제 관리',
    items: [
      { href: '/admin/payments?tab=transactions', label: '결제 내역', tab: 'transactions' },
      { href: '/admin/payments?tab=pricing', label: '가격 설정', tab: 'pricing' },
      { href: '/admin/payments?tab=toss', label: 'Toss Payments 설정', tab: 'toss' },
    ],
  },
  {
    id: 'music',
    label: '음악 관리',
    items: [{ href: '/admin/music', label: '음악 목록' }],
  },
  {
    id: 'visual-templates',
    label: '비주얼 템플릿',
    items: [
      { href: '/admin/visual-templates', label: '템플릿 목록' },
      { href: '/admin/visual-templates/new', label: '새 템플릿 만들기' },
      { href: '/admin/visual-templates/import', label: 'Figma 가져오기' },
    ],
  },
  {
    id: 'marketplace',
    label: '마켓플레이스',
    items: [
      { href: '/admin/templates', label: '마켓플레이스 템플릿 관리' },
      { href: '/admin/template-submissions', label: '크리에이터 템플릿 신청' },
    ],
  },
  {
    id: 'system',
    label: '시스템 설정',
    items: [
      { href: '/admin/system?tab=runtime', label: '운영 설정', tab: 'runtime' },
      { href: '/admin/system?tab=figma', label: 'Figma 연동', tab: 'figma' },
      { href: '/admin/system?tab=audit', label: '관리자 변경 이력', tab: 'audit' },
    ],
  },
];

const SUPER_NAV_ITEM = { href: '/admin/super/credit-policies', label: 'Super Admin' } as const;

function isItemActive(pathname: string, tab: string | null, item: NavItem): boolean {
  if (item.href.startsWith('/admin/payments')) {
    return pathname.startsWith('/admin/payments') && (item.tab ? tab === item.tab : true);
  }
  if (item.href.startsWith('/admin/system')) {
    return pathname.startsWith('/admin/system') && (item.tab ? tab === item.tab : true);
  }
  if (item.href === '/admin/visual-templates') {
    return (
      pathname === '/admin/visual-templates' ||
      (pathname.startsWith('/admin/visual-templates/') &&
        !pathname.startsWith('/admin/visual-templates/new') &&
        !pathname.startsWith('/admin/visual-templates/import'))
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isGroupActive(pathname: string, tab: string | null, group: NavGroup): boolean {
  return group.items.some((item) => isItemActive(pathname, tab, item));
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const tab = searchParams.get('tab');
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

  const groups = useMemo(() => {
    const mapped = NAV_GROUPS.map((group) => ({
      ...group,
      isActive: isGroupActive(pathname, tab, group),
      items: group.items.map((item) => ({
        ...item,
        isActive: isItemActive(pathname, tab, item),
      })),
    }));
    if (session?.role === 'SUPER_ADMIN') {
      mapped.push({
        id: 'super',
        label: 'Super Admin',
        isActive:
          pathname === SUPER_NAV_ITEM.href || pathname.startsWith(`${SUPER_NAV_ITEM.href}/`),
        items: [
          {
            href: SUPER_NAV_ITEM.href,
            label: SUPER_NAV_ITEM.label,
            isActive:
              pathname === SUPER_NAV_ITEM.href || pathname.startsWith(`${SUPER_NAV_ITEM.href}/`),
          },
        ],
      });
    }
    return mapped;
  }, [pathname, session?.role, tab]);

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
