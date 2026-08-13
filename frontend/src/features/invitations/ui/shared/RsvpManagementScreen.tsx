'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import { listInvitationRsvps, type InvitationRsvpListResponse } from '@/src/lib/api';
import { useI18n } from '@/src/contexts/I18nContext';
import { invitationT } from '@/src/i18n/invitationT';
import styles from './RsvpManagementScreen.module.css';

type RsvpManagementScreenProps = {
  invitationId: string;
};

function attendanceLabel(t: (key: string) => string, attendance: string): string {
  if (attendance === 'yes' || attendance === 'attending') return t('rsvp.admin.attending');
  if (attendance === 'no' || attendance === 'declined') return t('rsvp.admin.declined');
  if (attendance === 'maybe') return t('rsvp.admin.maybe');
  return attendance;
}

/**
 * 작성자 RSVP 관리 화면 — 서비스 locale.
 */
export default function RsvpManagementScreen({ invitationId }: RsvpManagementScreenProps) {
  const { t, locale } = useI18n();
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
        if (mounted) setError(t('rsvp.admin.error'));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [invitationId, t]);

  const shareHref = data?.invitation.shareSlug ? `/i/${data.invitation.shareSlug}` : null;

  return (
    <RequireAuth nextPath={`/my-invitations/${invitationId}/rsvp`}>
      <section className={styles.screen} data-testid="rsvp-admin-screen">
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('rsvp.admin.eyebrow')}</p>
          <h1>{data?.invitation.title || t('rsvp.admin.title')}</h1>
          <p>{t('rsvp.admin.desc')}</p>
        </header>

        <div className={styles.actions}>
          <Link href={`/editor/${invitationId}`} className={styles.linkButton}>
            {t('rsvp.admin.editor')}
          </Link>
          {shareHref && (
            <Link href={shareHref} className={styles.linkButton} target="_blank" rel="noreferrer">
              {t('rsvp.admin.public')}
            </Link>
          )}
          <Link href="/my-invitations" className={styles.linkButton}>
            {t('rsvp.admin.list')}
          </Link>
        </div>

        {loading && <p className={styles.muted}>{t('rsvp.admin.loading')}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {data && (
          <>
            <div className={styles.summary}>
              <div className={styles.stat}>
                <strong>{data.summary.total}</strong>
                <span>{t('rsvp.admin.total')}</span>
              </div>
              <div className={styles.stat}>
                <strong>{data.summary.attending}</strong>
                <span>{t('rsvp.admin.attending')}</span>
              </div>
              <div className={styles.stat}>
                <strong>{data.summary.declined}</strong>
                <span>{t('rsvp.admin.declined')}</span>
              </div>
              <div className={styles.stat}>
                <strong>{data.summary.maybe}</strong>
                <span>{t('rsvp.admin.maybe')}</span>
              </div>
            </div>

            <div className={styles.list}>
              {data.guests.length === 0 ? (
                <p className={styles.muted}>{t('rsvp.admin.empty')}</p>
              ) : (
                data.guests.map((guest) => {
                  const partyKey =
                    guest.guestCount === 1 ? 'rsvp.admin.partySizeOne' : 'rsvp.admin.partySizeMany';
                  return (
                    <article key={guest.id} className={styles.card}>
                      <div className={styles.cardTop}>
                        <h2>{guest.guestName}</h2>
                        <span className={styles.badge}>{attendanceLabel(t, guest.attendance)}</span>
                      </div>
                      <p className={styles.meta}>
                        {invitationT(locale, partyKey, { count: guest.guestCount })} ·{' '}
                        {new Date(guest.createdAt).toLocaleString()}
                      </p>
                      {guest.message && <p className={styles.message}>{guest.message}</p>}
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>
    </RequireAuth>
  );
}
