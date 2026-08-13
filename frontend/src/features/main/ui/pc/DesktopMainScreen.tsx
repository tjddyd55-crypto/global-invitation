'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import { getCreateInvitationEntryPath, getConceptCardEntryPath } from '@/src/shared/auth/authEntryPaths';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import {
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@/src/ui/icons/MarketingIcons';
import { listMainConceptCards } from '@/src/features/main/model/mainConceptCards';
import HomeInvitationPreviewFrame from '@/src/features/main/ui/shared/HomeInvitationPreviewFrame';
import HomeInvitationExamplesSection from '@/src/features/main/ui/shared/HomeInvitationExamplesSection';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from './DesktopMainScreen.module.css';

/**
 * Figma Make DesktopMainScreen — MCP 소스 구조/카피 SSOT.
 */
export default function DesktopMainScreen() {
  const { status } = useAuth();
  const { t } = useI18n();
  const ctaDisabled = status === 'loading';
  const authStatus = status === 'loading' ? 'unauthenticated' : status;
  const createHref = getCreateInvitationEntryPath(authStatus);
  const conceptCards = listMainConceptCards(t);
  const trustItems = [
    t('marketing.home.trustEmail'),
    t('marketing.home.trustPassword'),
    t('marketing.home.trustGuest'),
  ];

  return (
    <div className={styles.page} data-testid="desktop-main-screen">
      <MarketingDesktopHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <SparklesIcon size={14} />
              {t('marketing.home.eyebrow')}
            </span>
            <h1 className={styles.heroTitle}>
              {t('marketing.home.titleLine1')}
              <br />
              {t('marketing.home.titleLine2')}
            </h1>
            <p className={styles.heroDesc}>{t('marketing.home.desc')}</p>
            <div className={styles.heroActions}>
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
            <ul className={styles.trustRow}>
              {trustItems.map((item) => (
                <li key={item} className={styles.trustItem}>
                  <span className={styles.trustCheck}>
                    <CheckIcon size={11} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.heroVisual}>
            <HomeInvitationPreviewFrame exampleId="wedding" size="hero" showGlow />
          </div>
        </div>
      </section>

      <div className={styles.dividerWrap}>
        <div className={styles.divider} />
      </div>

      <HomeInvitationExamplesSection />

      <section className={styles.concepts} id="service-intro" data-testid="main-concept-cards">
        <div className={styles.conceptsHead}>
          <p className={styles.conceptsEyebrow}>{t('marketing.home.conceptsEyebrow')}</p>
          <h2 className={styles.conceptsTitle}>{t('marketing.home.conceptsTitle')}</h2>
        </div>
        <div className={styles.conceptGrid}>
          {conceptCards.map((card) => {
            const Icon = card.Icon;
            const href = getConceptCardEntryPath(card.value, authStatus);
            return (
              <Link
                key={card.key}
                href={ctaDisabled ? '#' : href}
                className={styles.conceptCard}
                style={{ ['--card-accent' as string]: card.accent }}
                data-testid={`main-concept-${card.key}`}
                aria-disabled={ctaDisabled}
                onClick={(event) => {
                  if (ctaDisabled) event.preventDefault();
                }}
              >
                <span className={styles.conceptIcon} style={{ background: card.accentSoft, color: card.accent }}>
                  <Icon size={28} />
                </span>
                <span className={styles.conceptBadge} style={{ background: card.accentSoft, color: card.accent }}>
                  {card.badge}
                </span>
                <h3 className={styles.conceptTitle}>{card.homeTitle}</h3>
                <p className={styles.conceptDesc}>{card.homeDescription}</p>
                <ul className={styles.featureList}>
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <span className={styles.featureDot} style={{ background: card.accentSoft, color: card.accent }}>
                        <CheckIcon size={10} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <SparklesIcon size={16} />
            <span>Invite</span>
          </div>
          <SiteBusinessFooter className={styles.footerBusiness} />
        </div>
      </footer>
    </div>
  );
}
