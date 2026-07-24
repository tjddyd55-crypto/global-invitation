'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import { listInvitationRsvps, type InvitationRsvpListResponse } from '@/src/lib/api';
import styles from './RsvpManagementScreen.module.css';

type RsvpManagementScreenProps = {
  invitationId: string;
};

/**
 * 작성자 RSVP 관리 화면 (참석자 인증 없음 — 작성자 세션만 필요).
 */
export default function RsvpManagementScreen({ invitationId }: RsvpManagementScreenProps) {
  const [data, setData] = useState<InvitationRsvpListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next = await listInvitationRsvps(invitationId);
        if (mounted) setData(next);
      } catch {
        if (mounted) setError('RSVP 목록을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [invitationId]);

  const shareHref = data?.invitation.shareSlug ? `/i/${data.invitation.shareSlug}` : null;

  return (
    <RequireAuth nextPath={`/my-invitations/${invitationId}/rsvp`}>
      <section className={styles.screen}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>RSVP Management</p>
          <h1>{data?.invitation.title || '참석 응답 관리'}</h1>
          <p>참석자들은 로그인 없이 응답할 수 있습니다. 여기서는 결과만 확인합니다.</p>
        </header>

        <div className={styles.actions}>
          <Link href={`/editor/${invitationId}`} className={styles.linkButton}>
            에디터
          </Link>
          {shareHref && (
            <Link href={shareHref} className={styles.linkButton} target="_blank" rel="noreferrer">
              공개 초대장
            </Link>
          )}
          <Link href="/my-invitations" className={styles.linkButton}>
            목록
          </Link>
        </div>

        {loading && <p className={styles.muted}>불러오는 중…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {data && (
          <>
            <div className={styles.summary}>
              <div className={styles.stat}>
                <strong>{data.summary.total}</strong>
                <span>전체</span>
              </div>
              <div className={styles.stat}>
                <strong>{data.summary.attending}</strong>
                <span>참석</span>
              </div>
              <div className={styles.stat}>
                <strong>{data.summary.declined}</strong>
                <span>불참</span>
              </div>
              <div className={styles.stat}>
                <strong>{data.summary.maybe}</strong>
                <span>미정</span>
              </div>
            </div>

            <div className={styles.list}>
              {data.guests.length === 0 ? (
                <p className={styles.muted}>아직 응답이 없습니다.</p>
              ) : (
                data.guests.map((guest) => (
                  <article key={guest.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <h2>{guest.guestName}</h2>
                      <span className={styles.badge}>{guest.attendance}</span>
                    </div>
                    <p className={styles.meta}>인원 {guest.guestCount} · {new Date(guest.createdAt).toLocaleString()}</p>
                    {guest.message && <p className={styles.message}>{guest.message}</p>}
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>
    </RequireAuth>
  );
}
