'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import { getCreateInvitationEntryPath, getConceptCardEntryPath } from '@/src/shared/auth/authEntryPaths';
import MarketingMobileHeader from '@/src/features/marketing/ui/MarketingMobileHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { ArrowRightIcon } from '@/src/ui/icons/MarketingIcons';
import { listMainConceptCards } from '@/src/features/main/model/mainConceptCards';
import { HOME_PREVIEW_PATH } from '@/src/features/main/model/homeInvitationPreview';
import HomeInvitationPreviewPhone from '@/src/features/main/ui/shared/HomeInvitationPreviewPhone';
import styles from './MainScreen.module.css';

/** Figma Make MainScreen — MCP 소스 카피/구조 */
export default function MainScreen() {
  const { status } = useAuth();
  const ctaDisabled = status === 'loading';
  const authStatus = status === 'loading' ? 'unauthenticated' : status;
  const createHref = getCreateInvitationEntryPath(authStatus);
  const conceptCards = listMainConceptCards();

  return (
    <div className={styles.page} data-testid="mobile-main-screen" data-auth-state={status}>
      <MarketingMobileHeader />

      <div className={styles.heroPad}>
        <div className={styles.heroCard}>
          <span className={styles.eyebrow}>✦ 디지털 초대장</span>
          <h1 className={styles.title}>
            소중한 순간을
            <br />
            가장 쉽게 전하세요
          </h1>
          <p className={styles.desc}>
            결혼식, 부고장, 일반 행사, 기업·단체 초대장을 이메일 인증 후 간편하게 만들고 공유할 수 있습니다.
          </p>
          <Link
            href={ctaDisabled ? '#' : createHref}
            className={styles.primaryCta}
            data-testid="hero-create-cta"
            aria-disabled={ctaDisabled}
            onClick={(event) => {
              if (ctaDisabled) event.preventDefault();
            }}
          >
            초대장 만들기
            <ArrowRightIcon size={18} />
          </Link>
          <Link href={HOME_PREVIEW_PATH} className={styles.secondaryCta}>
            완성 예시 보기
          </Link>
        </div>
      </div>

      <div className={styles.previewPad}>
        <HomeInvitationPreviewPhone size="compact" />
      </div>

      <div className={styles.conceptsPad}>
        <p className={styles.conceptsLabel}>초대장 종류</p>
        <div className={styles.conceptList} data-testid="main-concept-cards">
          {conceptCards.map((card) => {
            const Icon = card.Icon;
            const href = getConceptCardEntryPath(card.value, authStatus);
            return (
              <Link
                key={card.key}
                href={ctaDisabled ? '#' : href}
                className={styles.conceptCard}
                style={{ background: card.accentActiveBg, borderColor: `${card.accent}33` }}
                data-testid={`main-concept-${card.key}`}
                aria-disabled={ctaDisabled}
                onClick={(event) => {
                  if (ctaDisabled) event.preventDefault();
                }}
              >
                <span className={styles.conceptIcon} style={{ background: card.accentSoft, color: card.accent }}>
                  <Icon size={24} />
                </span>
                <span className={styles.conceptCopy}>
                  <span className={styles.conceptTitle}>{card.homeTitle}</span>
                  <span className={styles.conceptDesc}>{card.homeDescription}</span>
                </span>
                <ArrowRightIcon size={16} className={styles.conceptArrow} />
              </Link>
            );
          })}
        </div>
      </div>

      <SiteBusinessFooter className={styles.footer} />
    </div>
  );
}
