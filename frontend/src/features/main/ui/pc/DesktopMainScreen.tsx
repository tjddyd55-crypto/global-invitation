'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import { CONCEPT_OPTIONS } from '@/src/features/templates/model/useCreateInvitation';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  LayoutGridIcon,
  MailIcon,
  SparklesIcon,
} from '@/src/ui/icons/MarketingIcons';
import styles from './DesktopMainScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';
const MY_INVITATIONS_PATH = '/my-invitations';

const TRUST_POINTS = ['무료로 시작', '1분이면 완성', '언제든 다시 수정'];

const BENEFITS = [
  {
    Icon: SparklesIcon,
    title: '컨셉만 고르면 끝',
    desc: '결혼식·부고장·일반 행사 중 고르면 필요한 섹션이 자동으로 준비됩니다.',
  },
  {
    Icon: ClockIcon,
    title: '1분 만에 완성',
    desc: '문구를 입력하고 사진만 올리면 바로 공유 가능한 초대장이 만들어집니다.',
  },
  {
    Icon: MailIcon,
    title: '카톡·문자로 바로 공유',
    desc: '링크 하나로 어디서든 열리고, 참석 여부와 방명록도 실시간으로 모입니다.',
  },
  {
    Icon: LayoutGridIcon,
    title: '언제든 다시 편집',
    desc: '발행 후에도 일정·사진·계좌 정보를 자유롭게 수정할 수 있습니다.',
  },
];

/**
 * Figma Make `DesktopMainScreen` — canonical `/` 데스크톱 프레젠테이션 (`>=1024px`).
 * marketing shell (헤더만 존재, PcShell 사이드바 없음). 로그인 여부와 무관하게 동일한 화면을
 * 보여주고, 이동 목적지(next 경로)만 `useAuth` 로 분기한다.
 */
export default function DesktopMainScreen() {
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';
  const createHref = isLoggedIn
    ? CONCEPT_CREATE_PATH
    : `/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_PATH)}`;
  const myInvitationsHref = isLoggedIn
    ? MY_INVITATIONS_PATH
    : `/auth/email?next=${encodeURIComponent(MY_INVITATIONS_PATH)}`;

  return (
    <div className={styles.page}>
      <MarketingDesktopHeader
        isLoggedIn={isLoggedIn}
        createHref={createHref}
        myInvitationsHref={myInvitationsHref}
      />

      <main>
        <section className={styles.hero} id="service-intro">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <SparklesIcon size={14} />
                초대장을 가장 쉽게 만드는 방법
              </span>
              <h1 className={styles.heroTitle}>
                모두를 위한
                <br />
                디지털 초대장, Invite
              </h1>
              <p className={styles.heroDesc}>
                결혼식부터 돌잔치, 부고장까지 — 컨셉을 고르고 내용을 채우면
                <br />
                누구에게나 예쁘게 열리는 초대장 링크가 완성됩니다.
              </p>
              <div className={styles.heroActions}>
                <Link href={createHref} className={styles.primaryCta} data-testid="hero-create-cta">
                  초대장 만들기
                  <ArrowRightIcon size={18} />
                </Link>
                <Link href="#examples" className={styles.secondaryCta}>
                  완성 예시 보기
                </Link>
              </div>
              <ul className={styles.trustRow}>
                {TRUST_POINTS.map((point) => (
                  <li key={point} className={styles.trustItem}>
                    <CheckIcon size={14} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.phoneMockup} role="img" aria-label="Invite 모바일 초대장 미리보기">
                <div className={styles.phoneNotch} />
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneHero} />
                  <div className={styles.phoneLineWide} />
                  <div className={styles.phoneLineNarrow} />
                  <div className={styles.phoneCardRow}>
                    <span className={styles.phoneChip} />
                    <span className={styles.phoneChip} />
                  </div>
                  <div className={styles.phoneButton} />
                </div>
              </div>
              <div className={styles.heroBlobPrimary} aria-hidden />
              <div className={styles.heroBlobSoft} aria-hidden />
            </div>
          </div>
        </section>

        <section className={styles.benefits} aria-label="Invite 의 장점">
          <div className={styles.sectionInner}>
            <div className={styles.benefitGrid}>
              {BENEFITS.map(({ Icon, title, desc }) => (
                <div key={title} className={styles.benefitCard}>
                  <span className={styles.benefitIcon}>
                    <Icon size={22} />
                  </span>
                  <h3 className={styles.benefitTitle}>{title}</h3>
                  <p className={styles.benefitDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.concepts} id="examples" aria-label="컨셉별 초대장">
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>어떤 초대장을 만들고 싶으세요?</h2>
              <p className={styles.sectionDesc}>컨셉을 고르면 필요한 섹션이 자동으로 구성됩니다.</p>
            </header>

            <div className={styles.conceptGrid}>
              {CONCEPT_OPTIONS.map((concept) => {
                const Icon = concept.Icon;
                return (
                  <Link
                    key={concept.value}
                    href={createHref}
                    className={styles.conceptCard}
                    data-testid={`main-concept-${concept.value.toLowerCase()}`}
                  >
                    <span
                      className={styles.conceptIcon}
                      style={{ background: concept.accentSoft, color: concept.accent }}
                    >
                      <Icon size={24} />
                    </span>
                    <h3 className={styles.conceptTitle}>{concept.label}</h3>
                    <p className={styles.conceptDesc}>{concept.description}</p>
                    <ul className={styles.conceptFeatureList}>
                      {concept.features.map((feature) => (
                        <li key={feature} className={styles.conceptFeatureItem}>
                          <CheckIcon size={14} style={{ color: concept.accent }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <span className={styles.conceptLink}>
                      선택하기
                      <ArrowRightIcon size={14} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <h2 className={styles.finalCtaTitle}>지금 바로 나만의 초대장을 만들어보세요</h2>
            <p className={styles.finalCtaDesc}>가입 없이 이메일 인증만으로 1분이면 시작할 수 있습니다.</p>
            <Link href={createHref} className={styles.finalCtaButton} data-testid="final-create-cta">
              초대장 만들기
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
