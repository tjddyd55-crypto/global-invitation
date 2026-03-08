'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAdminInvitationGuestList, type AdminInvitationGuestList } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

type AdminInvitationGuestsPageProps = {
  params: {
    id: string;
  };
};

export default function AdminInvitationGuestsPage({ params }: AdminInvitationGuestsPageProps) {
  const invitationId = params.id;
  const [guestList, setGuestList] = useState<AdminInvitationGuestList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGuests() {
      setLoading(true);
      setError(null);
      try {
        const nextGuestList = await getAdminInvitationGuestList(invitationId);
        if (!isMounted) return;
        setGuestList(nextGuestList);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '게스트 목록을 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadGuests();

    return () => {
      isMounted = false;
    };
  }, [invitationId]);

  if (loading) {
    return <div className={styles.loading}>게스트 목록을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!guestList) {
    return <p className={styles.error}>게스트 목록을 찾을 수 없습니다.</p>;
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Invitation Guests</h1>
          <p className={styles.pageDescription}>
            RSVP 응답 요약과 게스트 목록을 확인합니다. 초대장: {guestList.invitation.title || guestList.invitation.slug}
          </p>
        </div>
        <Link
          href={`/invitation/${guestList.invitation.slug}`}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          공개 페이지 보기
        </Link>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.metricLabel}>총 인원</div>
          <p className={styles.metricValue}>{guestList.totalGuests}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>참석</div>
          <p className={styles.metricValue}>{guestList.attending}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>불참</div>
          <p className={styles.metricValue}>{guestList.declined}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>미정</div>
          <p className={styles.metricValue}>{guestList.maybe}</p>
        </section>
      </div>

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>응답</th>
                <th>인원</th>
                <th>식사 옵션</th>
                <th>메시지</th>
                <th>응답일</th>
              </tr>
            </thead>
            <tbody>
              {guestList.guests.map((guest) => (
                <tr key={guest.id}>
                  <td>{guest.guestName}</td>
                  <td>{guest.attendance}</td>
                  <td>{guest.guestCount}</td>
                  <td>{guest.mealChoice || '-'}</td>
                  <td>{guest.message || '-'}</td>
                  <td>{new Date(guest.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
