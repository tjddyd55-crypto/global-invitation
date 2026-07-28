'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/shared/hooks';
import {
  getCreateInvitationEntryPath,
  getLoginEntryPath,
  getMyInvitationsEntryPath,
} from '@/src/shared/auth/authEntryPaths';
import LogoutConfirmDialog from '@/src/features/auth/ui/shared/LogoutConfirmDialog';
import { PlusIcon, SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './MarketingDesktopHeader.module.css';

export interface MarketingDesktopHeaderProps {
  showNav?: boolean;
  /** @deprecated 무시 */
  isLoggedIn?: boolean;
  createHref?: string;
  myInvitationsHref?: string;
}

const NAV_ITEMS = [
  { href: '/#service-intro', label: '서비스 소개' },
  { href: '/#examples', label: '완성 예시' },
  { href: '/pricing', label: '요금 안내' },
  { href: '/contact', label: '고객센터' },
];

/**
 * Figma Make DesktopHeader — 비로그인: 로그인 + 만들기 / 로그인: 내 초대장 + 로그아웃 + 만들기
 */
export default function MarketingDesktopHeader({ showNav = true }: MarketingDesktopHeaderProps) {
  const router = useRouter();
  const { status, signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const authReady = status !== 'loading';
  const createHref = getCreateInvitationEntryPath(status === 'loading' ? 'unauthenticated' : status);
  const myInvitationsHref = getMyInvitationsEntryPath('authenticated');
  const loginHref = getLoginEntryPath();
  const ctaDisabled = !authReady;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setConfirmOpen(false);
      router.replace('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className={styles.header} data-auth-state={status} data-testid="marketing-desktop-header">
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} aria-label="Invite 홈으로">
            <span className={styles.logoBadge}>
              <SparklesIcon size={18} />
            </span>
            <span className={styles.logoText}>Invite</span>
          </Link>

          {showNav ? (
            <nav className={styles.nav} aria-label="주요 메뉴">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <span aria-hidden className={styles.navSpacer} />
          )}

          <div className={styles.actions}>
            {!authReady && <span className={styles.actionsSkeleton} aria-hidden data-testid="header-actions-skeleton" />}

            {status === 'unauthenticated' && (
              <Link
                href={loginHref}
                className={styles.loginLink}
                data-testid="header-login-button"
              >
                로그인
              </Link>
            )}

            {status === 'authenticated' && (
              <>
                <Link href={myInvitationsHref} className={styles.myInvitationsLink} data-testid="header-my-invitations">
                  내 초대장
                </Link>
                <button
                  type="button"
                  className={styles.logoutLink}
                  onClick={() => setConfirmOpen(true)}
                  data-testid="header-logout-button"
                >
                  로그아웃
                </button>
              </>
            )}

            <Link
              href={ctaDisabled ? '#' : createHref}
              className={`${styles.createButton} ${ctaDisabled ? styles.ctaDisabled : ''}`}
              data-testid="header-create-cta"
              aria-disabled={ctaDisabled}
              onClick={(event) => {
                if (ctaDisabled) event.preventDefault();
              }}
            >
              <PlusIcon size={16} />
              초대장 만들기
            </Link>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={confirmOpen}
        busy={loggingOut}
        onCancel={() => {
          if (!loggingOut) setConfirmOpen(false);
        }}
        onConfirm={() => void handleLogout()}
      />
    </>
  );
}
