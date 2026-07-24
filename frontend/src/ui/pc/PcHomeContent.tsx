'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import PlatformSwitcher from '@/src/ui/shared/PlatformSwitcher';
import styles from './PcHomeContent.module.css';

/**
 * PC 홈 컨텐츠.
 * - 로딩/인증/비로그인 3 가지 상태를 모두 처리한다.
 * - 비로그인: 마케팅 히어로 + CTA (로그인/가입)
 * - 로그인: 주요 관리 섹션 카드
 */
export default function PcHomeContent() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <section className={styles.root}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </section>
    );
  }

  if (status === 'anonymous') {
    return (
      <section className={styles.root}>
        <div className={styles.marketingHero}>
          <h1>Global Invitation 데스크톱</h1>
          <p>
            템플릿으로 시작하고, 복잡한 관리·리포트·크리에이터 기능은 이 데스크톱 화면에서 모두 처리하세요.
            모바일 PWA 는 시청·편집용으로 따로 제공됩니다.
          </p>
          <div className={styles.ctaRow}>
            <Link className={styles.primary} href="/auth/email?next=%2Fpc%2Ftemplates">
              이메일로 시작하기
            </Link>
            <Link className={styles.secondary} href="/auth/email?next=%2Fpc%2Ftemplates">
              초대장 만들기
            </Link>
          </div>
        </div>
        <div className={styles.bottomRow}>
          <PlatformSwitcher target="mobile" redirectTo="/m">
            모바일 버전 보기 →
          </PlatformSwitcher>
        </div>
      </section>
    );
  }

  const displayName = user?.nickname || user?.email || '사용자';
  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <h1>안녕하세요, {displayName} 님</h1>
        <p>자주 쓰는 관리 섹션에 바로 이동하세요.</p>
      </header>

      <div className={styles.grid}>
        <Link href="/pc/templates" className={styles.card}>
          <span className={styles.cardTitle}>템플릿 둘러보기</span>
          <span className={styles.cardDesc}>컨셉별 템플릿 검색 · 즉시 편집</span>
        </Link>
        <Link href="/pc/my-invitations" className={styles.card}>
          <span className={styles.cardTitle}>내 초대장</span>
          <span className={styles.cardDesc}>작성 중 · 발행된 초대장 관리</span>
        </Link>
        <Link href="/pc/dashboard" className={styles.card}>
          <span className={styles.cardTitle}>대시보드</span>
          <span className={styles.cardDesc}>발송 · 방문 · RSVP 통계</span>
        </Link>
      </div>

      <div className={styles.bottomRow}>
        <PlatformSwitcher target="mobile" redirectTo="/m">
          모바일 버전 보기 →
        </PlatformSwitcher>
      </div>
    </section>
  );
}
