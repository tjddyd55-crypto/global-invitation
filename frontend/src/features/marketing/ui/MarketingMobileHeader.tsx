'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/shared/hooks';
import {
  getLoginEntryPath,
  getMyInvitationsEntryPath,
} from '@/src/shared/auth/authEntryPaths';
import LogoutConfirmDialog from '@/src/features/auth/ui/shared/LogoutConfirmDialog';
import { SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './MarketingMobileHeader.module.css';

/**
 * Mobile marketing header SSOT — same chrome as home MainScreen.
 * Pricing/Contact/Home share this; do not fork per-page headers.
 */
export default function MarketingMobileHeader() {
  const router = useRouter();
  const { status, signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const myInvitationsHref = getMyInvitationsEntryPath('authenticated');
  const loginHref = getLoginEntryPath();

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
      <nav className={styles.nav} data-testid="marketing-mobile-header" data-auth-state={status}>
        <Link href="/" className={styles.brand} aria-label="Invite 홈으로">
          <SparklesIcon size={18} />
          <span>Invite</span>
        </Link>
        <div className={styles.navActions}>
          {status === 'unauthenticated' && (
            <Link href={loginHref} className={styles.loginLink} data-testid="mobile-login-button">
              로그인
            </Link>
          )}
          {status === 'authenticated' && (
            <>
              <Link href={myInvitationsHref} className={styles.myLink} data-testid="mobile-my-invitations">
                내 초대장
              </Link>
              <button
                type="button"
                className={styles.logoutLink}
                onClick={() => setConfirmOpen(true)}
                data-testid="mobile-logout-button"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </nav>
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
