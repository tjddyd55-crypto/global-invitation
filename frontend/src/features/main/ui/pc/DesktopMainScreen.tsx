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
import styles from './DesktopMainScreen.module.css';

const TRUST = ['이메일 인증 하나로 시작', '비밀번호 필요 없음', '게스트 앱 설치 불필요'];

/**
 * Figma Make DesktopMainScreen — MCP 소스 구조/카피 SSOT.
 */
export default function DesktopMainScreen() {
  const { status } = useAuth();
  const ctaDisabled = status === 'loading';
  const authStatus = status === 'loading' ? 'unauthenticated' : status;
  const createHref = getCreateInvitationEntryPath(authStatus);
  const conceptCards = listMainConceptCards();

  return (
    <div className={styles.page} data-testid="desktop-main-screen">
      <MarketingDesktopHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <SparklesIcon size={14} />
              디지털 초대장
            </span>
            <h1 className={styles.heroTitle}>
              소중한 순간을
              <br />
              가장 쉽게 전하세요
            </h1>
            <p className={styles.heroDesc}>
              결혼식, 부고장, 일반 행사, 기업·단체 초대장을 이메일 인증 후 간편하게 만들고 공유할 수 있습니다.
            </p>
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
                초대장 만들기
                <ArrowRightIcon size={18} />
              </Link>
              <Link href="/templates/WEDDING_05_GARDEN/preview" className={styles.secondaryCta}>
                완성 예시 보기
              </Link>
            </div>
            <ul className={styles.trustRow}>
              {TRUST.map((item) => (
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
            <div className={styles.phoneGlow} aria-hidden />
            <div className={styles.phoneMockup} role="img" aria-label="초대장 미리보기">
              <div className={styles.phoneNotch} aria-hidden />
              <div className={styles.phoneHero}>
                <span className={styles.phoneBadge}>결혼식</span>
                <p className={styles.phoneTitle}>
                  이준혁 ♥ 김지은
                  <br />
                  결혼식에 초대합니다
                </p>
                <p className={styles.phoneMeta}>2025년 11월 15일 토요일</p>
              </div>
              <div className={styles.phoneBody}>
                <div className={styles.phoneBlock}>
                  <p className={styles.phoneBlockLabel}>인사말</p>
                  <p className={styles.phoneBlockText}>저희 두 사람이 사랑으로...</p>
                </div>
                <div className={styles.phoneBlock}>
                  <p className={styles.phoneBlockLabel}>예식장</p>
                  <p className={styles.phoneBlockText}>더 웨딩홀 그랜드볼룸</p>
                </div>
                <div className={styles.phoneRsvp}>참석 여부 알리기</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.dividerWrap}>
        <div className={styles.divider} />
      </div>

      <section className={styles.concepts} id="examples" data-testid="main-concept-cards">
        <div className={styles.conceptsHead}>
          <p className={styles.conceptsEyebrow}>초대장 종류</p>
          <h2 className={styles.conceptsTitle}>어떤 초대장이 필요하세요?</h2>
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
