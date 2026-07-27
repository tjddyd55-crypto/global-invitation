'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import AuthBrandHeader from '@/src/features/marketing/ui/AuthBrandHeader';
import { CONCEPT_OPTIONS } from '@/src/features/templates/model/useCreateInvitation';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  LayoutGridIcon,
  MailIcon,
  SparklesIcon,
} from '@/src/ui/icons/MarketingIcons';
import styles from './MainScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';
const MY_INVITATIONS_PATH = '/my-invitations';

const TRUST_POINTS = ['무료로 시작', '1분이면 완성', '언제든 다시 수정'];

const BENEFITS = [
  { Icon: SparklesIcon, title: '컨셉만 고르면 끝', desc: '필요한 섹션이 자동으로 준비됩니다.' },
  { Icon: ClockIcon, title: '1분 만에 완성', desc: '문구와 사진만 넣으면 바로 완성됩니다.' },
  { Icon: MailIcon, title: '카톡으로 바로 공유', desc: '링크 하나로 누구에게나 열립니다.' },
  { Icon: LayoutGridIcon, title: '언제든 다시 편집', desc: '발행 후에도 자유롭게 수정하세요.' },
];

/**
 * Figma Make `MainScreen` — canonical `/` 모바일 프레젠테이션.
 * MobileShell 사이드/바텀 내비게이션 없이 마케팅 톤으로 단독 렌더링한다.
 */
export default function MainScreen() {
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';
  const createHref = isLoggedIn
    ? CONCEPT_CREATE_PATH
    : `/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_PATH)}`;
  const myInvitationsHref = isLoggedIn
    ? MY_INVITATIONS_PATH
    : `/auth/email?next=${encodeURIComponent(MY_INVITATIONS_PATH)}`;

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <AuthBrandHeader />
        <Link href={myInvitationsHref} className={styles.myInvitationsLink}>
          내 초대장
        </Link>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          <SparklesIcon size={13} />
          초대장을 가장 쉽게 만드는 방법
        </span>
        <h1 className={styles.heroTitle}>
          모두를 위한
          <br />
          디지털 초대장, Invite
        </h1>
        <p className={styles.heroDesc}>
          결혼식부터 돌잔치, 부고장까지 — 컨셉을 고르고 채우면 예쁜 초대장 링크가 완성됩니다.
        </p>

        <div className={styles.phoneMockup} role="img" aria-label="Invite 모바일 초대장 미리보기">
          <div className={styles.phoneNotch} />
          <div className={styles.phoneScreen}>
            <div className={styles.phoneHero} />
            <div className={styles.phoneLineWide} />
            <div className={styles.phoneLineNarrow} />
            <div className={styles.phoneButton} />
          </div>
        </div>

        <Link href={createHref} className={styles.primaryCta} data-testid="hero-create-cta">
          초대장 만들기
          <ArrowRightIcon size={18} />
        </Link>

        <ul className={styles.trustRow}>
          {TRUST_POINTS.map((point) => (
            <li key={point} className={styles.trustItem}>
              <CheckIcon size={13} />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.benefits} aria-label="Invite 의 장점">
        {BENEFITS.map(({ Icon, title, desc }) => (
          <div key={title} className={styles.benefitCard}>
            <span className={styles.benefitIcon}>
              <Icon size={20} />
            </span>
            <div>
              <h3 className={styles.benefitTitle}>{title}</h3>
              <p className={styles.benefitDesc}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.concepts} aria-label="컨셉별 초대장">
        <h2 className={styles.sectionTitle}>어떤 초대장을 만들고 싶으세요?</h2>
        <div className={styles.conceptList}>
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
                  <Icon size={22} />
                </span>
                <div className={styles.conceptBody}>
                  <h3 className={styles.conceptTitle}>{concept.label}</h3>
                  <p className={styles.conceptDesc}>{concept.description}</p>
                </div>
                <ArrowRightIcon size={16} className={styles.conceptChevron} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>지금 바로 시작해보세요</h2>
        <p className={styles.finalCtaDesc}>이메일 인증만으로 1분이면 시작할 수 있습니다.</p>
        <Link href={createHref} className={styles.finalCtaButton} data-testid="final-create-cta">
          초대장 만들기
          <ArrowRightIcon size={18} />
        </Link>
      </section>
    </div>
  );
}
