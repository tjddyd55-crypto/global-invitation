'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import { useMyInvitations } from '@/src/features/invitations/model/useMyInvitations';
import type { InvitationSummary } from '@/src/lib/api';
import styles from './MyInvitationsScreen.module.css';

export default function MyInvitationsScreen() {
  const { items, status, reload } = useMyInvitations();

  return (
    <RequireAuth nextPath="/m/my-invitations">
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
              <InvitationCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </section>
    </RequireAuth>
  );
}

function InvitationCard({ item }: { item: InvitationSummary }) {
  const isPublished = item.status === 'PUBLISHED' || item.status === 'published';
  const editorHref = `/editor/${item.id}`;
  const viewHref = item.shareSlug ? `/i/${item.shareSlug}` : editorHref;
  const rsvpHref = `/my-invitations/${item.id}/rsvp`;
  const completeHref = `/my-invitations/${item.id}/complete`;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{item.title || '제목 없음'}</h2>
        <span className={`${styles.badge} ${isPublished ? styles.badgePublished : ''}`}>
          {isPublished ? '공개됨' : '초안'}
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
      <div className={styles.actions}>
        <Link href={rsvpHref} className={styles.actionSecondary}>RSVP 관리</Link>
        {item.shareSlug ? (
          <Link href={completeHref} className={styles.actionSecondary}>공유</Link>
        ) : null}
      </div>
    </article>
  );
}

function formatRelativeKorean(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
