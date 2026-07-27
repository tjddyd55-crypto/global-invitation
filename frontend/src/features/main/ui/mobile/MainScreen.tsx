'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import { ArrowRightIcon, SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import { HeartIcon as HeartConcept, BookOpenIcon as BookConcept, CalendarDaysIcon as CalConcept } from '@/src/ui/icons/ConceptIcons';
import styles from './MainScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';
const MY_INVITATIONS_PATH = '/my-invitations';

const CONCEPT_CARDS = [
  {
    key: 'wedding',
    Icon: HeartConcept,
    bg: '#FDF2F8',
    iconBg: '#FCE7F3',
    color: '#BE185D',
    title: '결혼식 초대장',
    desc: '정성스러운 청첩장으로 소중한 분들을 초대하세요',
  },
  {
    key: 'funeral',
    Icon: BookConcept,
    bg: '#F9FAFB',
    iconBg: '#F3F4F6',
    color: '#374151',
    title: '부고장',
    desc: '고인을 기리며 조문 안내를 정중하게 전달하세요',
  },
  {
    key: 'general',
    Icon: CalConcept,
    bg: '#EFF6FF',
    iconBg: '#DBEAFE',
    color: '#1D4ED8',
    title: '일반 행사',
    desc: '세미나, 파티, 모임 등 다양한 행사를 안내하세요',
  },
] as const;

/** Figma Make MainScreen — MCP 소스 카피/구조 */
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
    <div className={styles.page} data-testid="mobile-main-screen">
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <SparklesIcon size={18} />
          <span>Invite</span>
        </div>
        <Link href={myInvitationsHref} className={styles.myLink}>
          내 초대장
        </Link>
      </nav>

      <div className={styles.heroPad}>
        <div className={styles.heroCard}>
          <span className={styles.eyebrow}>✦ 디지털 초대장</span>
          <h1 className={styles.title}>
            소중한 순간을
            <br />
            가장 쉽게 전하세요
          </h1>
          <p className={styles.desc}>
            결혼식, 부고장, 행사 초대장을 이메일 인증 후 간편하게 만들고 공유할 수 있습니다.
          </p>
          <Link href={createHref} className={styles.primaryCta} data-testid="hero-create-cta">
            초대장 만들기
            <ArrowRightIcon size={18} />
          </Link>
          <Link href="/i/sample" className={styles.secondaryCta}>
            완성 예시 보기
          </Link>
        </div>
      </div>

      <div className={styles.conceptsPad}>
        <p className={styles.conceptsLabel}>초대장 종류</p>
        <div className={styles.conceptList}>
          {CONCEPT_CARDS.map((card) => {
            const Icon = card.Icon;
            return (
              <Link
                key={card.key}
                href={createHref}
                className={styles.conceptCard}
                style={{ background: card.bg, borderColor: `${card.color}33` }}
              >
                <span className={styles.conceptIcon} style={{ background: card.iconBg, color: card.color }}>
                  <Icon size={24} />
                </span>
                <span className={styles.conceptCopy}>
                  <span className={styles.conceptTitle}>{card.title}</span>
                  <span className={styles.conceptDesc}>{card.desc}</span>
                </span>
                <ArrowRightIcon size={16} className={styles.conceptArrow} />
              </Link>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© 2025 Invite · 개인정보처리방침 · 이용약관</p>
      </footer>
    </div>
  );
}
