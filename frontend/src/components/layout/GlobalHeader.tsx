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
import {
  fetchHubNotifications,
  markAllHubNotificationsRead,
  markHubNotificationRead,
  fetchRecentInvitationsForHub,
  fetchTemplateSearchSuggestions,
  type HubNotification,
  type InvitationSummary,
  type TemplateSearchHit,
} from '@/src/lib/api';
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

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function GlobalHeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = pathname === '/templates' ? (searchParams.get('q') ?? '') : '';

  const loginHref = buildLoginHref(pathname || '/');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [suggestions, setSuggestions] = useState<TemplateSearchHit[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [notifications, setNotifications] = useState<HubNotification[]>([]);
  const [recentInvitations, setRecentInvitations] = useState<InvitationSummary[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const initialCachedUser = getCachedNavbarUserSnapshot();
  const [loadingAuth, setLoadingAuth] = useState(initialCachedUser === undefined);
  const [user, setUser] = useState<AuthUser | null>(initialCachedUser ?? null);

  const trimmedDraft = searchDraft.trim();
  const unreadNotifCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    if (pathname === '/templates') {
      setSearchDraft(qParam);
    }
  }, [pathname, qParam]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(trimmedDraft), 300);
    return () => clearTimeout(timer);
  }, [trimmedDraft]);

  useEffect(() => {
    if (!debouncedQ) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    void fetchTemplateSearchSuggestions(debouncedQ).then((rows) => {
      if (!cancelled) setSuggestions(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  useEffect(() => {
    if (!suggestOpen) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchBoxRef.current?.contains(target) || mobileSearchRef.current?.contains(target)) {
        return;
      }
      setSuggestOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [suggestOpen]);

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
    if (!user?.id) {
      setNotifications([]);
      setRecentInvitations([]);
      return;
    }

    let cancelled = false;
    void Promise.all([fetchHubNotifications(), fetchRecentInvitationsForHub()]).then(([n, r]) => {
      if (!cancelled) {
        setNotifications(n);
        setRecentInvitations(r);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchHubNotifications().then(setNotifications);
  }, [pathname, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      void fetchHubNotifications().then(setNotifications);
    }, 10_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markOneNotificationRead = (id: string) => {
    void (async () => {
      const ok = await markHubNotificationRead(id);
      if (!ok) return;
      const readAt = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt } : n)));
    })();
  };

  const markAllNotificationsRead = () => {
    void (async () => {
      const ok = await markAllHubNotificationsRead();
      if (!ok) return;
      const readAt = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt })));
    })();
  };

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

  useEffect(() => {
    if (!notifOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      if (notifRef.current?.contains(event.target as Node)) {
        return;
      }
      setNotifOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  const handleLogout = async () => {
    await logoutCurrentSession();
    clearStoredSession();
    setUser(null);
    setProfileOpen(false);
    setNotifOpen(false);
    setMobileOpen(false);
    setNotifications([]);
    setRecentInvitations([]);
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
    setSuggestions([]);
    setSuggestOpen(false);
    setMobileOpen(false);
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch(searchDraft);
  };

  const pickSuggestion = (hit: TemplateSearchHit) => {
    router.push(`/templates/${encodeURIComponent(hit.slug)}`);
    setSearchDraft(hit.name);
    setSuggestions([]);
    setSuggestOpen(false);
    setMobileOpen(false);
  };

  const renderSearchSuggestions = () => {
    if (!suggestOpen || suggestions.length === 0) return null;
    return (
      <div className={styles.searchSuggestPanel}>
        {suggestions.map((hit) => (
          <button
            key={hit.id}
            type="button"
            className={styles.searchSuggestRow}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pickSuggestion(hit)}
          >
            {hit.name}
            <span className={styles.searchSuggestMeta}>{hit.templateKey}</span>
          </button>
        ))}
      </div>
    );
  };

  const desktopSearch = (
    <div className={styles.searchForm} ref={searchBoxRef}>
      <form onSubmit={onSearchSubmit}>
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
            onFocus={() => setSuggestOpen(true)}
            autoComplete="off"
          />
        </div>
      </form>
      {renderSearchSuggestions()}
    </div>
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

  const hubExtras = () => {
    if (!user) return null;

    return (
      <div className={styles.notifWrap} ref={notifRef}>
        <button
          type="button"
          className={styles.notifButton}
          aria-expanded={notifOpen}
          aria-haspopup="menu"
          data-testid="header-notifications-trigger"
          onClick={() => {
            setNotifOpen((o) => !o);
            setProfileOpen(false);
          }}
        >
          <span aria-hidden>🔔</span>
          {unreadNotifCount > 0 ? <span className={styles.notifBadge}>{unreadNotifCount}</span> : null}
        </button>
        {notifOpen && (
          <div className={styles.notifPanel} role="menu">
            <div className={styles.notifPanelHeader}>
              <span className={styles.notifPanelTitle}>알림</span>
              {unreadNotifCount > 0 ? (
                <button
                  type="button"
                  className={styles.notifMarkAll}
                  data-testid="notifications-mark-all-read"
                  onClick={() => markAllNotificationsRead()}
                >
                  모두 읽음
                </button>
              ) : null}
            </div>
            {notifications.length === 0 ? (
              <p className={styles.notifEmpty}>새 알림이 없습니다.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.linkPath || '/my'}
                  className={`${styles.notifItem} ${n.readAt ? styles.notifItemRead : styles.notifItemUnread}`}
                  role="menuitem"
                  onClick={() => {
                    if (!n.readAt) {
                      markOneNotificationRead(n.id);
                    }
                    setNotifOpen(false);
                  }}
                >
                  <span className={styles.notifItemTitle}>{n.title}</span>
                  {n.body ? <span className={styles.notifItemBody}>{n.body}</span> : null}
                  <span className={styles.notifItemBody}>{formatShortDate(n.createdAt)}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

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
          onClick={() => {
            setProfileOpen((open) => !open);
            setNotifOpen(false);
          }}
        >
          {profileInitial(user)}
        </button>
        {profileOpen && (
          <div className={styles.dropdown} role="menu" data-testid="profile-menu">
            <div className={styles.dropdownEmail}>{user.email}</div>
            {recentInvitations.length > 0 ? (
              <>
                <div className={styles.dropdownSectionTitle}>최근 초대장</div>
                {recentInvitations.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/editor/${encodeURIComponent(inv.id)}`}
                    className={styles.recentRow}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    {inv.title?.trim() || '제목 없음'}
                    <span className={styles.recentHint}>
                      {inv.status} · {formatShortDate(inv.updatedAt)}
                    </span>
                  </Link>
                ))}
                <div className={styles.dropdownDivider} />
              </>
            ) : null}
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
          {hubExtras()}
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
          {user ? (
            <>
              <div className={styles.mobileNotifHeader}>
                <p className={styles.mobileSectionLabel}>알림</p>
                {unreadNotifCount > 0 ? (
                  <button type="button" className={styles.notifMarkAll} onClick={() => markAllNotificationsRead()}>
                    모두 읽음
                  </button>
                ) : null}
              </div>
              {notifications.length === 0 ? (
                <span className={styles.notifEmpty}>새 알림 없음</span>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    href={n.linkPath || '/my'}
                    className={`${styles.mobileNotifLink} ${n.readAt ? styles.mobileNotifLinkRead : styles.mobileNotifLinkUnread}`}
                    onClick={() => {
                      if (!n.readAt) {
                        markOneNotificationRead(n.id);
                      }
                      setMobileOpen(false);
                    }}
                  >
                    {n.title}
                  </Link>
                ))
              )}
              {recentInvitations.length > 0 ? (
                <>
                  <p className={styles.mobileSectionLabel}>최근 초대장</p>
                  {recentInvitations.map((inv) => (
                    <Link key={inv.id} href={`/editor/${encodeURIComponent(inv.id)}`} onClick={() => setMobileOpen(false)}>
                      {inv.title?.trim() || inv.id.slice(0, 8)}
                    </Link>
                  ))}
                </>
              ) : null}
            </>
          ) : null}
          <p className={styles.mobileSectionLabel}>검색</p>
          <div ref={mobileSearchRef} className={styles.mobileSearchForm}>
            <form onSubmit={onSearchSubmit}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon} aria-hidden>
                  ⌕
                </span>
                <input
                  className={styles.searchInput}
                  placeholder="템플릿 검색"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  onFocus={() => setSuggestOpen(true)}
                  autoComplete="off"
                />
              </div>
            </form>
            {renderSearchSuggestions()}
          </div>
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
