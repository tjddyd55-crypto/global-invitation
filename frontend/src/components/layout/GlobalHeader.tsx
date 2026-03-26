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
import { buildLoginHref } from '@/src/lib/loginRedirect';
import LanguageSelector from '@/src/components/LanguageSelector';
import styles from '@/src/components/Navbar.module.css';

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const loginHref = buildLoginHref(pathname || '/');

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

  const mainNav = (
    <>
      <Link href="/">홈</Link>
      <Link href="/templates">템플릿</Link>
      <Link href="/create">초대장 만들기</Link>
      <Link href="/my-invitations">내 초대장</Link>
      <Link href="/creator/dashboard" data-testid="creator-dashboard-link">
        크리에이터
      </Link>
      <Link href="/admin/templates">관리자</Link>
    </>
  );

  const authControls = () => {
    if (loadingAuth) {
      return <span className={styles.loading}>인증 확인 중...</span>;
    }

    if (!user) {
      return (
        <>
          <Link href={loginHref} className={styles.authLink} data-testid="login-button">
            로그인
          </Link>
          <Link href="/signup" className={styles.authLinkPrimary} data-testid="signup-button">
            크리에이터 시작하기
          </Link>
        </>
      );
    }

    return (
      <button
        type="button"
        className={styles.logoutButton}
        onClick={() => void handleLogout()}
        data-testid="logout-button"
      >
        로그아웃
      </button>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            Global Invitation
          </Link>
          <nav className={styles.desktopMenu}>{mainNav}</nav>
        </div>

        <div className={styles.right}>
          <LanguageSelector />
          {authControls()}
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
            홈
          </Link>
          <Link href="/templates" onClick={() => setMenuOpen(false)}>
            템플릿
          </Link>
          <Link href="/create" onClick={() => setMenuOpen(false)}>
            초대장 만들기
          </Link>
          <Link href="/my-invitations" onClick={() => setMenuOpen(false)}>
            내 초대장
          </Link>
          <Link
            href="/creator/dashboard"
            onClick={() => setMenuOpen(false)}
            data-testid="creator-dashboard-link"
          >
            크리에이터
          </Link>
          <Link href="/admin/templates" onClick={() => setMenuOpen(false)}>
            관리자
          </Link>
          <div className={styles.mobileLanguage}>
            <LanguageSelector variant="mobile" />
          </div>
          {!user && (
            <>
              <Link href={loginHref} onClick={() => setMenuOpen(false)} data-testid="login-button">
                로그인
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} data-testid="signup-button">
                크리에이터 시작하기
              </Link>
            </>
          )}
          {user && (
            <button
              type="button"
              className={styles.mobileLogout}
              onClick={() => void handleLogout()}
              data-testid="logout-button"
            >
              로그아웃
            </button>
          )}
        </div>
      )}
    </header>
  );
}
