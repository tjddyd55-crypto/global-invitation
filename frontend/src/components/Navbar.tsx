'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  clearStoredSession,
  fetchNavbarUser,
  getCachedNavbarUserSnapshot,
  logoutCurrentSession,
  type AuthUser,
} from '@/src/lib/auth';
import LanguageSelector from '@/src/components/LanguageSelector';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const initialCachedUser = getCachedNavbarUserSnapshot();
  const [loadingAuth, setLoadingAuth] = useState(initialCachedUser === undefined);
  const [user, setUser] = useState<AuthUser | null>(initialCachedUser ?? null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const me = await fetchNavbarUser({ useCache: true });
        if (!mounted) return;
        setUser(me);
      } finally {
        if (!mounted) return;
        setLoadingAuth(false);
      }
    }

    void loadUser();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await logoutCurrentSession();
    clearStoredSession();
    setUser(null);
    setMenuOpen(false);
    router.replace('/');
  };

  const authMenu = () => {
    if (loadingAuth) {
      return <span className={styles.loading}>인증 확인 중...</span>;
    }

    if (!user) {
      return (
        <>
          <Link href="/login" className={styles.authLink} data-testid="login-button">
            로그인
          </Link>
          <Link href="/signup" className={styles.authLinkPrimary} data-testid="signup-button">
            크리에이터 시작하기
          </Link>
        </>
      );
    }

    if (user.role === 'CREATOR') {
      return (
        <>
          <Link
            href="/creator/dashboard"
            className={styles.authLink}
            data-testid="creator-dashboard-link"
          >
            Creator Dashboard
          </Link>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => void handleLogout()}
            data-testid="logout-button"
          >
            로그아웃
          </button>
        </>
      );
    }

    if (user.role === 'ADMIN') {
      return (
        <>
          <Link href="/admin" className={styles.authLink}>
            Admin
          </Link>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => void handleLogout()}
            data-testid="logout-button"
          >
            로그아웃
          </button>
        </>
      );
    }

    return (
      <>
        <Link href="/dashboard" className={styles.authLink}>
          내 대시보드
        </Link>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={() => void handleLogout()}
          data-testid="logout-button"
        >
          로그아웃
        </button>
      </>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            Global Invitation
          </Link>
          <nav className={styles.desktopMenu}>
            <Link href="/">Home</Link>
            <Link href="/templates">템플릿</Link>
            <Link href="/create">초대장 만들기</Link>
          </nav>
        </div>

        <div className={styles.right}>
          <LanguageSelector />
          {authMenu()}
        </div>

        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="모바일 메뉴 열기"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobilePanel}>
          <Link href="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/templates" onClick={() => setMenuOpen(false)}>
            Templates
          </Link>
          <Link href="/create" onClick={() => setMenuOpen(false)}>
            Create Invitation
          </Link>
          <div className={styles.mobileLanguage}>
            <LanguageSelector variant="mobile" />
          </div>
          {!user && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} data-testid="login-button">
                Login
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} data-testid="signup-button">
                Creator Signup
              </Link>
            </>
          )}
          {user?.role === 'USER' && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
          {user?.role === 'CREATOR' && (
            <Link
              href="/creator/dashboard"
              onClick={() => setMenuOpen(false)}
              data-testid="creator-dashboard-link"
            >
              Creator Dashboard
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
          )}
          {user && (
            <button
              type="button"
              className={styles.mobileLogout}
              onClick={() => void handleLogout()}
              data-testid="logout-button"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
