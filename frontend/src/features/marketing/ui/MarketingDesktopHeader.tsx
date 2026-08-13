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
import LanguageSelector from '@/src/components/LanguageSelector';
import { useI18n } from '@/src/contexts/I18nContext';
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
  { href: '/#service-intro', labelKey: 'marketing.nav.serviceIntro' },
  { href: '/#examples', labelKey: 'marketing.nav.examples' },
  { href: '/pricing', labelKey: 'marketing.nav.pricing' },
  { href: '/contact', labelKey: 'marketing.nav.contact' },
] as const;

/**
 * Figma Make DesktopHeader — 비로그인: 로그인 + 만들기 / 로그인: 내 초대장 + 로그아웃 + 만들기
 */
export default function MarketingDesktopHeader({ showNav = true }: MarketingDesktopHeaderProps) {
  const router = useRouter();
  const { t } = useI18n();
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
          <Link href="/" className={styles.logo} aria-label={t('marketing.brandName')}>
            <span className={styles.logoBadge}>
              <SparklesIcon size={18} />
            </span>
            <span className={styles.logoText}>Invite</span>
          </Link>

          {showNav ? (
            <nav className={styles.nav} aria-label={t('marketing.nav.openMenu')}>
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={styles.navLink}>
                  {t(item.labelKey)}
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
                {t('marketing.nav.login')}
              </Link>
            )}

            {status === 'authenticated' && (
              <>
                <Link href={myInvitationsHref} className={styles.myInvitationsLink} data-testid="header-my-invitations">
                  {t('marketing.nav.myInvitations')}
                </Link>
                <button
                  type="button"
                  className={styles.logoutLink}
                  onClick={() => setConfirmOpen(true)}
                  data-testid="header-logout-button"
                >
                  {t('marketing.nav.logout')}
                </button>
              </>
            )}

            <LanguageSelector />

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
              {t('marketing.nav.createInvitation')}
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
