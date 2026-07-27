'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import {
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@/src/ui/icons/MarketingIcons';
import { HeartIcon as HeartConcept, BookOpenIcon as BookConcept, CalendarDaysIcon as CalConcept } from '@/src/ui/icons/ConceptIcons';
import styles from './DesktopMainScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';
const MY_INVITATIONS_PATH = '/my-invitations';

/** Figma DesktopMainScreen conceptCards — GENERAL features include payment account */
const CONCEPT_CARDS = [
  {
    key: 'wedding',
    Icon: HeartConcept,
    iconBg: '#FCE7F3',
    color: '#BE185D',
    badgeBg: '#FCE7F3',
    title: '결혼식 초대장',
    desc: '정성스러운 청첩장으로 소중한 분들을 초대하세요',
    badge: '결혼식',
    features: ['신랑 · 신부 정보', '예식장 · 위치 안내', '사진 갤러리', '계좌 정보', '참석 여부 RSVP', '방명록/댓글'],
  },
  {
    key: 'funeral',
    Icon: BookConcept,
    iconBg: '#F3F4F6',
    color: '#374151',
    badgeBg: '#F3F4F6',
    title: '부고장',
    desc: '고인을 기리며 조문 안내를 정중하게 전달하세요',
    badge: '부고장',
    features: ['고인 정보', '빈소 · 발인 일정', '장례식장 위치', '조의금 계좌', '추모 메시지', '방명록/댓글'],
  },
  {
    key: 'general',
    Icon: CalConcept,
    iconBg: '#DBEAFE',
    color: '#1D4ED8',
    badgeBg: '#DBEAFE',
    title: '일반 행사',
    desc: '세미나, 파티, 모임 등 다양한 행사를 안내하세요',
    badge: '일반 행사',
    features: [
      '행사 소개',
      '세부 일정',
      '갤러리',
      'Google 위치',
      '참가비 · 계좌 정보',
      '참석 여부 RSVP',
      '댓글',
    ],
  },
] as const;

const TRUST = ['이메일 인증 하나로 시작', '비밀번호 필요 없음', '게스트 앱 설치 불필요'];

/**
 * Figma Make DesktopMainScreen — MCP 소스 구조/카피 SSOT.
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
    <div className={styles.page} data-testid="desktop-main-screen">
      <MarketingDesktopHeader
        isLoggedIn={isLoggedIn}
        createHref={createHref}
        myInvitationsHref={myInvitationsHref}
      />

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
              결혼식, 부고장, 행사 초대장을 이메일 인증 후 간편하게 만들고 공유할 수 있습니다.
            </p>
            <div className={styles.heroActions}>
              <Link href={createHref} className={styles.primaryCta} data-testid="hero-create-cta">
                초대장 만들기
                <ArrowRightIcon size={18} />
              </Link>
              <Link href="/i/sample" className={styles.secondaryCta}>
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
          {CONCEPT_CARDS.map((card) => {
            const Icon = card.Icon;
            return (
              <Link
                key={card.key}
                href={createHref}
                className={styles.conceptCard}
                style={{ ['--card-accent' as string]: card.color }}
                data-testid={`main-concept-${card.key}`}
              >
                <span className={styles.conceptIcon} style={{ background: card.iconBg, color: card.color }}>
                  <Icon size={28} />
                </span>
                <span className={styles.conceptBadge} style={{ background: card.badgeBg, color: card.color }}>
                  {card.badge}
                </span>
                <h3 className={styles.conceptTitle}>{card.title}</h3>
                <p className={styles.conceptDesc}>{card.desc}</p>
                <ul className={styles.featureList}>
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <span className={styles.featureDot} style={{ background: card.iconBg, color: card.color }}>
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
          <p className={styles.footerCopy}>© 2025 Invite · 개인정보처리방침 · 이용약관 · 고객센터</p>
        </div>
      </footer>
    </div>
  );
}
