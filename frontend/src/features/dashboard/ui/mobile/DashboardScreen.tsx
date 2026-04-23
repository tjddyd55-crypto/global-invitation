'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import { useMyInvitations } from '@/src/features/invitations/model/useMyInvitations';
import { useSubscription } from '@/src/shared/billing';
import type { SubscriptionState } from '@/src/shared/billing';
import styles from './DashboardScreen.module.css';

/**
 * 모바일 대시보드.
 * - "빠른 요약"만 보여준다 (통계 2개 + 최근 2개 카드).
 * - 구독 상태가 TRIAL/EXPIRED 이면 상단 안내를 표시.
 */
export default function DashboardScreen() {
  const { status: authStatus, user } = useAuth();
  const { items, status: listStatus } = useMyInvitations();
  const { subscription } = useSubscription();

  const displayName = user?.nickname || user?.email?.split('@')[0] || '게스트';
  const totalCount = items.length;
  const publishedCount = items.filter(
    (item) => item.status === 'PUBLISHED' || item.status === 'published',
  ).length;
  const latest = items.slice(0, 2);

  return (
    <section className={styles.screen}>
      <div className={styles.greeting}>
        <h1>{displayName} 님의 대시보드</h1>
        <p>{subscriptionHint(subscription.state)}</p>
      </div>

      {listStatus === 'loading' && <div className={styles.skeleton} />}

      {authStatus === 'anonymous' && listStatus !== 'loading' && items.length === 0 ? (
        <div className={styles.anonCard}>
          <strong>로그인하면 통계를 확인할 수 있어요.</strong>
          <Link href="/m/login" className={styles.anonCta}>로그인</Link>
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <StatCard label="전체 초대장" value={totalCount} />
            <StatCard label="공개 중" value={publishedCount} />
          </div>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>최근 초대장</h2>
            <Link href="/m/my-invitations" className={styles.seeAll}>모두 보기 →</Link>
          </div>

          <div className={styles.latestList}>
            {latest.length === 0 ? (
              <div className={styles.anonCard}>
                <span>아직 초대장이 없어요.</span>
                <Link href="/m/templates" className={styles.anonCta}>템플릿 고르기</Link>
              </div>
            ) : (
              latest.map((item) => (
                <Link
                  key={item.slug}
                  href={`/editor/${item.id}`}
                  className={styles.latestCard}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title || '제목 없음'}</div>
                    <div className={styles.latestMeta}>
                      {item.status === 'PUBLISHED' || item.status === 'published' ? '공개 중' : '작성 중'}
                    </div>
                  </div>
                  <span className={styles.chevron}>›</span>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function subscriptionHint(state: SubscriptionState): string {
  if (state === 'PAID') return '유료 구독 활성 — 모든 기능 사용 가능합니다.';
  if (state === 'TRIAL') return '체험 기간 — 모든 기능을 무료로 써 볼 수 있습니다.';
  if (state === 'EXPIRED') return '구독 만료 — 유료 기능 사용이 제한됩니다.';
  return '무료 플랜 — 기본 기능만 사용 가능합니다.';
}
