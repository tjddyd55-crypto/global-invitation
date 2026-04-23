'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useMyInvitations } from '@/src/features/invitations/model/useMyInvitations';
import type { InvitationSummary } from '@/src/lib/api';
import styles from './MyInvitationsScreen.module.css';

export default function MyInvitationsScreen() {
  const { items, guestToken, status, reload } = useMyInvitations();

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <h1>내 초대장</h1>
        <Link href="/m/templates" className={styles.newButton}>＋ 새로 만들기</Link>
      </header>

      {status === 'loading' && (
        <>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </>
      )}

      {status === 'error' && (
        <div className={styles.errorBox}>
          목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.
          <button type="button" className={styles.retryButton} onClick={() => void reload()}>
            다시 시도
          </button>
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.emptyBox}>
          <span className={styles.emptyIcon}>📮</span>
          <p>아직 저장된 초대장이 없어요.</p>
          <Link href="/m/templates" className={styles.emptyCta}>첫 초대장 만들기</Link>
        </div>
      )}

      {status === 'ready' && (
        <div className={styles.cardList}>
          {items.map((item) => (
            <InvitationCard key={item.slug} item={item} guestToken={guestToken} />
          ))}
        </div>
      )}
    </section>
  );
}

function InvitationCard({ item, guestToken }: { item: InvitationSummary; guestToken: string | null }) {
  const isPublished = item.status === 'PUBLISHED' || item.status === 'published';
  const editorHref = guestToken
    ? `/editor/${item.id}?token=${encodeURIComponent(guestToken)}`
    : `/editor/${item.id}`;
  const viewHref = item.shareSlug ? `/i/${item.shareSlug}` : editorHref;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{item.title || '제목 없음'}</h2>
        <span className={`${styles.badge} ${isPublished ? styles.badgePublished : ''}`}>
          {isPublished ? 'published' : 'draft'}
        </span>
      </div>
      <div className={styles.metaRow}>
        최근 저장 {formatRelativeKorean(item.updatedAt)}
      </div>
      <div className={styles.actions}>
        <Link href={editorHref} className={styles.actionSecondary}>편집</Link>
        <Link href={viewHref} className={styles.actionPrimary}>
          {item.shareSlug ? '공개 페이지' : '편집 계속'}
        </Link>
      </div>
    </article>
  );
}

function formatRelativeKorean(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
