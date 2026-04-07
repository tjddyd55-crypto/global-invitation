'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  deleteAdminRsvp,
  exportAdminInvitationGuestCsv,
  getAdminInvitationGuestList,
  updateAdminRsvpVisibility,
  type AdminInvitationGuest,
  type AdminInvitationGuestList,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';
import { buildPublicInvitationUrlPath } from '@/src/lib/publicInvitation';

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
  const [exporting, setExporting] = useState(false);
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState<'' | 'yes' | 'no' | 'maybe'>('');
  const [confirmingGuest, setConfirmingGuest] = useState<AdminInvitationGuest | null>(null);

  async function loadGuests() {
    setLoading(true);
    setError(null);
    try {
      const nextGuestList = await getAdminInvitationGuestList(invitationId, {
        search,
        attendance,
      });
      setGuestList(nextGuestList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '게스트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const nextGuestList = await getAdminInvitationGuestList(invitationId, {
          search,
          attendance,
        });
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
    })();

    return () => {
      isMounted = false;
    };
  }, [attendance, invitationId, search]);

  if (loading) {
    return <div className={styles.loading}>게스트 목록을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!guestList) {
    return <p className={styles.error}>게스트 목록을 찾을 수 없습니다.</p>;
  }

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportAdminInvitationGuestCsv(invitationId);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `invitation-${guestList.invitation.slug}-rsvp.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'CSV 내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleHidden = async (guest: AdminInvitationGuest) => {
    setBusyGuestId(guest.id);
    setError(null);
    try {
      await updateAdminRsvpVisibility(guest.id, !guest.isHidden);
      await loadGuests();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : '메시지 숨김 처리에 실패했습니다.');
    } finally {
      setBusyGuestId(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmingGuest) return;

    setBusyGuestId(confirmingGuest.id);
    setError(null);
    try {
      await deleteAdminRsvp(confirmingGuest.id);
      setConfirmingGuest(null);
      await loadGuests();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'RSVP 삭제에 실패했습니다.');
    } finally {
      setBusyGuestId(null);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Invitation Guests</h1>
          <p className={styles.pageDescription}>
            RSVP 응답 요약과 게스트 목록을 확인합니다. 초대장: {guestList.invitation.title || guestList.invitation.slug}
          </p>
          {guestList.invitation.rsvpDeadline && (
            <p className={styles.helperText}>
              RSVP 마감: {new Date(guestList.invitation.rsvpDeadline).toLocaleString()}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <Link href={`/admin/invitations/${invitationId}/analytics`} className={`${styles.button} ${styles.secondaryButton}`}>
            Analytics
          </Link>
          <button type="button" className={styles.button} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <Link
            href={
              guestList.invitation.shareSlug?.trim()
                ? buildPublicInvitationUrlPath(guestList.invitation.shareSlug.trim())
                : `/invitation/${guestList.invitation.slug}`
            }
            target="_blank"
            rel="noreferrer"
            className={styles.button}
          >
            공개 페이지 보기
          </Link>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="guest-search">게스트 검색</label>
            <input
              id="guest-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름으로 검색"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="guest-attendance-filter">응답 필터</label>
            <select
              id="guest-attendance-filter"
              value={attendance}
              onChange={(event) => setAttendance(event.target.value as '' | 'yes' | 'no' | 'maybe')}
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
            </select>
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.metricLabel}>응답 수</div>
          <p className={styles.metricValue}>{guestList.totalGuests}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>총 인원 합계</div>
          <p className={styles.metricValue}>{guestList.totalPeople}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>참석 인원</div>
          <p className={styles.metricValue}>{guestList.attendingPeople}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>불참 인원</div>
          <p className={styles.metricValue}>{guestList.declinedPeople}</p>
        </section>
        <section className={styles.card}>
          <div className={styles.metricLabel}>미정 인원</div>
          <p className={styles.metricValue}>{guestList.maybePeople}</p>
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
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {guestList.guests.map((guest) => (
                <tr key={guest.id}>
                  <td>{guest.guestName}</td>
                  <td>{guest.attendance}</td>
                  <td>{guest.guestCount}</td>
                  <td>{guest.mealChoice || '-'}</td>
                  <td>
                    {guest.message || '-'}
                    {guest.isHidden && <div className={styles.helperText}>숨김 처리됨</div>}
                  </td>
                  <td>{new Date(guest.createdAt).toLocaleString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.secondaryButton}`}
                        disabled={busyGuestId === guest.id}
                        onClick={() => void handleToggleHidden(guest)}
                      >
                        {busyGuestId === guest.id
                          ? '처리 중...'
                          : guest.isHidden
                            ? '메시지 다시 표시'
                            : '메시지 숨기기'}
                      </button>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.dangerButton}`}
                        disabled={busyGuestId === guest.id}
                        onClick={() => setConfirmingGuest(guest)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guestList.guests.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.helperText}>
                    조건에 맞는 RSVP가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {confirmingGuest && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-rsvp-title">
          <div className={styles.modalCard}>
            <h2 id="delete-rsvp-title" className={styles.pageTitle}>
              RSVP 삭제 확인
            </h2>
            <p className={styles.pageDescription}>
              `{confirmingGuest.guestName}` 응답을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => setConfirmingGuest(null)}
                disabled={busyGuestId === confirmingGuest.id}
              >
                취소
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.dangerButton}`}
                onClick={() => void handleDeleteConfirmed()}
                disabled={busyGuestId === confirmingGuest.id}
              >
                {busyGuestId === confirmingGuest.id ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
