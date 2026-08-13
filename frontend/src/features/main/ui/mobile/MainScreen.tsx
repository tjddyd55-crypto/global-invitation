'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import { getCreateInvitationEntryPath, getConceptCardEntryPath } from '@/src/shared/auth/authEntryPaths';
import MarketingMobileHeader from '@/src/features/marketing/ui/MarketingMobileHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { ArrowRightIcon } from '@/src/ui/icons/MarketingIcons';
import { listMainConceptCards } from '@/src/features/main/model/mainConceptCards';
import HomeInvitationExamplesSection from '@/src/features/main/ui/shared/HomeInvitationExamplesSection';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from './MainScreen.module.css';

/** Figma Make MainScreen — MCP 소스 카피/구조 */
export default function MainScreen() {
  const { status } = useAuth();
  const { t } = useI18n();
  const ctaDisabled = status === 'loading';
  const authStatus = status === 'loading' ? 'unauthenticated' : status;
  const createHref = getCreateInvitationEntryPath(authStatus);
  const conceptCards = listMainConceptCards(t);

  return (
    <div className={styles.page} data-testid="mobile-main-screen" data-auth-state={status}>
      <MarketingMobileHeader />

      <div className={styles.heroPad}>
        <div className={styles.heroCard}>
          <span className={styles.eyebrow}>✦ {t('marketing.home.eyebrow')}</span>
          <h1 className={styles.title}>
            {t('marketing.home.titleLine1')}
            <br />
            {t('marketing.home.titleLine2')}
          </h1>
          <p className={styles.desc}>{t('marketing.home.desc')}</p>
          <Link
            href={ctaDisabled ? '#' : createHref}
            className={styles.primaryCta}
            data-testid="hero-create-cta"
            aria-disabled={ctaDisabled}
            onClick={(event) => {
              if (ctaDisabled) event.preventDefault();
            }}
          >
            {t('marketing.nav.createInvitation')}
            <ArrowRightIcon size={18} />
          </Link>
          <Link href="#examples" className={styles.secondaryCta}>
            {t('marketing.home.ctaExamples')}
          </Link>
        </div>
      </div>

      <HomeInvitationExamplesSection layout="mobile" />

      <div className={styles.conceptsPad} id="service-intro">
        <p className={styles.conceptsLabel}>{t('marketing.home.conceptsEyebrow')}</p>
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
