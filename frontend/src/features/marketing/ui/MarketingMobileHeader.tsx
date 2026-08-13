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
import LanguageSelector from '@/src/components/LanguageSelector';
import { useI18n } from '@/src/contexts/I18nContext';
import { SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './MarketingMobileHeader.module.css';

/**
 * Mobile marketing header SSOT — same chrome as home MainScreen.
 * Pricing/Contact/Home share this; do not fork per-page headers.
 */
export default function MarketingMobileHeader() {
  const router = useRouter();
  const { t } = useI18n();
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
        <Link href="/" className={styles.brand} aria-label={t('marketing.brandName')}>
          <SparklesIcon size={18} />
          <span>Invite</span>
        </Link>
        <div className={styles.navActions}>
          {status === 'unauthenticated' && (
            <Link href={loginHref} className={styles.loginLink} data-testid="mobile-login-button">
              {t('marketing.nav.login')}
            </Link>
          )}
          {status === 'authenticated' && (
            <>
              <Link href={myInvitationsHref} className={styles.myLink} data-testid="mobile-my-invitations">
                {t('marketing.nav.myInvitations')}
              </Link>
              <button
                type="button"
                className={styles.logoutLink}
                onClick={() => setConfirmOpen(true)}
                data-testid="mobile-logout-button"
              >
                {t('marketing.nav.logout')}
              </button>
            </>
          )}
          <LanguageSelector />
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
