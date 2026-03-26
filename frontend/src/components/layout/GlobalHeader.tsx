'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  clearStoredSession,
  fetchNavbarUser,
  getCachedNavbarUserSnapshot,
  logoutCurrentSession,
  type AuthUser,
} from '@/src/lib/auth';
import { buildLoginHref } from '@/src/lib/loginRedirect';
import LanguageSelector from '@/src/components/LanguageSelector';
import styles from './GlobalHeader.module.css';

function profileInitial(user: AuthUser): string {
  const raw = (user.nickname || user.email || '?').trim();
  return raw ? raw.slice(0, 1).toUpperCase() : '?';
}

function GlobalHeaderFallback() {
  return <div className={styles.fallbackBar} aria-hidden />;
}

function GlobalHeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = pathname === '/templates' ? (searchParams.get('q') ?? '') : '';

  const loginHref = buildLoginHref(pathname || '/');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  const initialCachedUser = getCachedNavbarUserSnapshot();
  const [loadingAuth, setLoadingAuth] = useState(initialCachedUser === undefined);
  const [user, setUser] = useState<AuthUser | null>(initialCachedUser ?? null);

  useEffect(() => {
    if (pathname === '/templates') {
      setSearchDraft(qParam);
    }
  }, [pathname, qParam]);

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

  useEffect(() => {
    if (!profileOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      if (profileRef.current?.contains(event.target as Node)) {
        return;
      }
      setProfileOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    await logoutCurrentSession();
    clearStoredSession();
    setUser(null);
    setProfileOpen(false);
    setMobileOpen(false);
    router.replace('/');
    router.refresh();
  };

  const submitSearch = (raw: string) => {
    const q = raw.trim();
    if (q) {
      router.push(`/templates?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/templates');
    }
    setMobileOpen(false);
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch(searchDraft);
  };

  const desktopSearch = (
    <form className={styles.searchForm} onSubmit={onSearchSubmit}>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden>
          ⌕
        </span>
        <label htmlFor="global-header-search" className={styles.visuallyHidden}>
          템플릿 검색
        </label>
        <input
          id="global-header-search"
          className={styles.searchInput}
          placeholder="템플릿 검색"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          autoComplete="off"
        />
      </div>
    </form>
  );

  const mainNav = (
    <nav className={styles.nav} aria-label="주요 메뉴">
      <Link href="/" className={styles.navLink}>
        홈
      </Link>
      <Link href="/templates" className={styles.navLink}>
        템플릿
      </Link>
      <Link href="/create" className={styles.navLink}>
        초대장 만들기
      </Link>
      {user && (
        <Link href="/my" className={styles.navLink}>
          내 초대장
        </Link>
      )}
    </nav>
  );

  const authSection = () => {
    if (loadingAuth) {
      return <span className={styles.loading}>확인 중…</span>;
    }

    if (!user) {
      return (
        <>
          <Link href={loginHref} className={styles.authLink} data-testid="login-button">
            로그인
          </Link>
          <Link href="/signup" className={styles.authPrimary} data-testid="signup-button">
            시작하기
          </Link>
        </>
      );
    }

    return (
      <div className={styles.profileWrap} ref={profileRef}>
        <button
          type="button"
          className={styles.profileButton}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          data-testid="profile-menu-trigger"
          onClick={() => setProfileOpen((open) => !open)}
        >
          {profileInitial(user)}
        </button>
        {profileOpen && (
          <div className={styles.dropdown} role="menu" data-testid="profile-menu">
            <div className={styles.dropdownEmail}>{user.email}</div>
            <Link href="/my" className={styles.dropdownLink} role="menuitem" onClick={() => setProfileOpen(false)}>
              내 초대장
            </Link>
            <Link
              href="/creator/dashboard"
              className={styles.dropdownLink}
              role="menuitem"
              data-testid="creator-dashboard-link"
              onClick={() => setProfileOpen(false)}
            >
              크리에이터
            </Link>
            <Link href="/admin/templates" className={styles.dropdownLink} role="menuitem" onClick={() => setProfileOpen(false)}>
              관리자
            </Link>
            <div className={styles.dropdownDivider} />
            <button type="button" className={styles.logoutBtn} data-testid="logout-button" onClick={() => void handleLogout()}>
              로그아웃
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.shell}>
        <Link href="/" className={styles.brand}>
          Global Invitation
        </Link>

        <div className={styles.center}>
          {mainNav}
          {desktopSearch}
        </div>

        <div className={styles.right}>
          <LanguageSelector />
          {authSection()}
        </div>

        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label="모바일 메뉴"
        >
          ☰
        </button>
      </div>

      {mobileOpen && (
        <div className={styles.mobilePanel}>
          <p className={styles.mobileSectionLabel}>메뉴</p>
          <Link href="/" onClick={() => setMobileOpen(false)}>
            홈
          </Link>
          <Link href="/templates" onClick={() => setMobileOpen(false)}>
            템플릿
          </Link>
          <Link href="/create" onClick={() => setMobileOpen(false)}>
            초대장 만들기
          </Link>
          {user && (
            <Link href="/my" onClick={() => setMobileOpen(false)}>
              내 초대장
            </Link>
          )}
          <Link href="/creator/dashboard" onClick={() => setMobileOpen(false)} data-testid="creator-dashboard-link">
            크리에이터
          </Link>
          <Link href="/admin/templates" onClick={() => setMobileOpen(false)}>
            관리자
          </Link>
          <p className={styles.mobileSectionLabel}>검색</p>
          <form className={styles.mobileSearchForm} onSubmit={onSearchSubmit}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden>
                ⌕
              </span>
              <input
                className={styles.searchInput}
                placeholder="템플릿 검색"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                autoComplete="off"
              />
            </div>
          </form>
          <div className={styles.mobileSectionLabel}>설정</div>
          <LanguageSelector variant="mobile" />
          {!user && (
            <>
              <Link href={loginHref} onClick={() => setMobileOpen(false)} data-testid="login-button">
                로그인
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} data-testid="signup-button">
                시작하기
              </Link>
            </>
          )}
          {user && (
            <button type="button" className={styles.logoutBtn} data-testid="logout-button" onClick={() => void handleLogout()}>
              로그아웃
            </button>
          )}
        </div>
      )}
    </header>
  );
}

export default function GlobalHeader() {
  return (
    <Suspense fallback={<GlobalHeaderFallback />}>
      <GlobalHeaderContent />
    </Suspense>
  );
}
