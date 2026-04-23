'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import PlatformSwitcher from '@/src/ui/shared/PlatformSwitcher';
import styles from './MobileHomeContent.module.css';

/**
 * 모바일 홈 컨텐츠.
 * - 비로그인: 히어로 + 회원가입/로그인 primary 버튼
 * - 로그인: 퀵 액션 카드 리스트 (탭 친화적 풀폭 버튼)
 */
export default function MobileHomeContent() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <section className={styles.root}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </section>
    );
  }

  if (status === 'anonymous') {
    return (
      <section className={styles.root}>
        <div className={styles.hero}>
          <h1>Global Invitation</h1>
          <p>모바일에서 간편하게 초대장을 만들고, 한 번의 탭으로 공유하세요.</p>
        </div>
        <div className={styles.actionGrid}>
          <Link href="/m/signup" className={styles.primary}>회원가입</Link>
          <Link href="/m/login" className={styles.secondary}>로그인</Link>
          <Link href="/m/templates" className={styles.secondary}>템플릿 먼저 둘러보기</Link>
        </div>
        <div className={styles.bottomRow}>
          <PlatformSwitcher target="desktop" redirectTo="/pc">
            데스크톱 버전 보기 →
          </PlatformSwitcher>
        </div>
      </section>
    );
  }

  const displayName = user?.nickname || user?.email?.split('@')[0] || '사용자';
  return (
    <section className={styles.root}>
      <div className={styles.hero}>
        <h1>안녕하세요, {displayName} 님</h1>
        <p>자주 쓰는 기능을 바로 열어 보세요.</p>
      </div>

      <div className={styles.cardList}>
        <Link href="/m/templates" className={styles.card}>
          <div>
            <div className={styles.cardTitle}>템플릿 둘러보기</div>
            <div className={styles.cardDesc}>컨셉별로 바로 시작</div>
          </div>
          <span className={styles.chevron}>›</span>
        </Link>
        <Link href="/m/my-invitations" className={styles.card}>
          <div>
            <div className={styles.cardTitle}>내 초대장</div>
            <div className={styles.cardDesc}>작성 중 · 발행된 초대장</div>
          </div>
          <span className={styles.chevron}>›</span>
        </Link>
        <Link href="/m/dashboard" className={styles.card}>
          <div>
            <div className={styles.cardTitle}>대시보드</div>
            <div className={styles.cardDesc}>방문 · RSVP 요약</div>
          </div>
          <span className={styles.chevron}>›</span>
        </Link>
      </div>

      <div className={styles.bottomRow}>
        <PlatformSwitcher target="desktop" redirectTo="/pc">
          데스크톱 버전 보기 →
        </PlatformSwitcher>
      </div>
    </section>
  );
}
