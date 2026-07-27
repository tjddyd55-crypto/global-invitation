'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/shared/hooks';
import {
  getCreateInvitationEntryPath,
  getMyInvitationsEntryPath,
} from '@/src/shared/auth/authEntryPaths';
import LogoutConfirmDialog from '@/src/features/auth/ui/shared/LogoutConfirmDialog';
import { PlusIcon, SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './MarketingDesktopHeader.module.css';

export interface MarketingDesktopHeaderProps {
  /** 컨셉 선택 등 집중이 필요한 화면에서는 nav 를 숨긴다. */
  showNav?: boolean;
  /**
   * @deprecated 인증 분기는 헤더 내부 useAuth + authEntryPaths SSOT 사용.
   * 호환을 위해 남겨 두지만 무시한다.
   */
  isLoggedIn?: boolean;
  /** @deprecated SSOT 로 대체. 전달해도 무시. */
  createHref?: string;
  /** @deprecated SSOT 로 대체. 전달해도 무시. */
  myInvitationsHref?: string;
}

const NAV_ITEMS = [
  { href: '/#service-intro', label: '서비스 소개' },
  { href: '/#examples', label: '완성 예시' },
  { href: '/pricing', label: '요금 안내' },
  { href: '/contact', label: '고객센터' },
];

/**
 * Figma Make `DesktopHeader` — marketing/concept 공용 데스크톱 헤더.
 * 로그인 시 작은 「로그아웃」 텍스트 + confirm. Public /i 에서는 사용하지 않는다.
 */
export default function MarketingDesktopHeader({ showNav = true }: MarketingDesktopHeaderProps) {
  const router = useRouter();
  const { status, signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const authReady = status !== 'loading';
  const createHref = getCreateInvitationEntryPath(status === 'loading' ? 'unauthenticated' : status);
  const myInvitationsHref = getMyInvitationsEntryPath(status === 'loading' ? 'unauthenticated' : status);
  // loading 중에는 concept 직행 금지 — unauthenticated 경로(auth)를 쓰되 CTA는 disabled
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
      <header
        className={styles.header}
        data-auth-state={status}
        data-testid="marketing-desktop-header"
      >
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
            {status === 'authenticated' && (
              <button
                type="button"
                className={styles.logoutLink}
                onClick={() => setConfirmOpen(true)}
                data-testid="header-logout-button"
              >
                로그아웃
              </button>
            )}
            <Link
              href={ctaDisabled ? '#' : myInvitationsHref}
              className={`${styles.myInvitationsLink} ${ctaDisabled ? styles.ctaDisabled : ''}`}
              aria-disabled={ctaDisabled}
              onClick={(event) => {
                if (ctaDisabled) event.preventDefault();
              }}
            >
              내 초대장
            </Link>
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
