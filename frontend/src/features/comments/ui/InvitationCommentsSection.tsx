'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildApiUrl } from '@/src/lib/apiBase';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from './InvitationCommentsSection.module.css';

export type PublicComment = {
  id: string;
  authorName: string;
  message: string;
  isPinned: boolean;
  createdAt: string;
};

type InvitationCommentsSectionProps = {
  /** invitation.slug or shareSlug — public API accepts both */
  invitationSlug?: string;
  conceptType?: string | null;
  enabled?: boolean;
  titleOverride?: string;
  placeholderOverride?: string;
  /** Editor preview — no network */
  previewMode?: boolean;
};

function escapePlain(text: string): string {
  return text.replace(/[<>]/g, '');
}

function commentKeys(conceptType?: string | null) {
  if (conceptType === 'FUNERAL') {
    return {
      title: 'invitation.comments.funeralTitle',
      subtitle: 'invitation.comments.funeralSubtitle',
      placeholder: 'invitation.comments.funeralPlaceholder',
    };
  }
  if (conceptType === 'WEDDING') {
    return {
      title: 'invitation.comments.weddingTitle',
      subtitle: 'invitation.comments.weddingSubtitle',
      placeholder: 'invitation.comments.weddingPlaceholder',
    };
  }
  return {
    title: 'invitation.comments.generalTitle',
    subtitle: 'invitation.comments.generalSubtitle',
    placeholder: 'invitation.comments.generalPlaceholder',
  };
}

export default function InvitationCommentsSection({
  invitationSlug,
  conceptType,
  enabled = true,
  titleOverride,
  placeholderOverride,
  previewMode = false,
}: InvitationCommentsSectionProps) {
  const { t } = useInvitationT();
  const keys = commentKeys(conceptType);
  const title = (titleOverride || t(keys.title)).trim();
  const subtitle = t(keys.subtitle);
  const placeholder = (placeholderOverride || t(keys.placeholder)).trim();

  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const canFetch = Boolean(enabled && invitationSlug && !previewMode);

  const loadComments = useCallback(async () => {
    if (!canFetch || !invitationSlug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        buildApiUrl(`/api/public/invitations/${encodeURIComponent(invitationSlug)}/comments?limit=50`),
        { credentials: 'include' }
      );
      if (!res.ok) {
        throw new Error(t('invitation.comments.errorLoad'));
      }
      const data = (await res.json()) as { items?: PublicComment[] };
      setComments(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invitation.comments.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [canFetch, invitationSlug, t]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const sorted = useMemo(() => {
    const pinned = comments.filter((c) => c.isPinned);
    const rest = comments.filter((c) => !c.isPinned);
    return [...pinned, ...rest];
  }, [comments]);

  const handleSubmit = async () => {
    if (!invitationSlug || previewMode) return;
    const name = escapePlain(authorName).trim();
    const body = escapePlain(message).trim();
    if (name.length < 1 || name.length > 30) {
      setError(t('invitation.comments.errorName'));
      return;
    }
    if (body.length < 1 || body.length > 500) {
      setError(t('invitation.comments.errorMessage'));
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        buildApiUrl(`/api/public/invitations/${encodeURIComponent(invitationSlug)}/comments`),
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName: name, message: body }),
        }
      );
      if (res.status === 429) {
        throw new Error(t('invitation.comments.errorRateLimit'));
      }
      if (!res.ok) {
        throw new Error(t('invitation.comments.errorCreate'));
      }
      setAuthorName('');
      setMessage('');
      setComposerOpen(false);
      setSuccess(t('invitation.comments.success'));
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invitation.comments.errorCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) return null;

  return (
    <section
      className={styles.root}
      data-testid="invitation-comments-section"
      data-section-id="comments"
    >
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>

      {loading ? <p className={styles.meta}>{t('invitation.comments.loading')}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.list}>
        {sorted.length === 0 && !loading ? (
          <p className={styles.empty}>{t('invitation.comments.empty')}</p>
        ) : (
          sorted.map((item) => (
            <article key={item.id} className={styles.card} data-pinned={item.isPinned ? '1' : '0'}>
              <div className={styles.cardHeader}>
                <span className={styles.author}>{item.authorName}</span>
                <time className={styles.time} dateTime={item.createdAt}>
                  {item.createdAt.slice(0, 10)}
                </time>
              </div>
              <p className={styles.body}>{item.message}</p>
            </article>
          ))
        )}
      </div>

      {previewMode ? (
        <p className={styles.meta}>{t('invitation.comments.previewHint')}</p>
      ) : (
        <>
          {!composerOpen ? (
            <button type="button" className={styles.writeBtn} onClick={() => setComposerOpen(true)}>
              {t('invitation.comments.write')}
            </button>
          ) : (
            <div className={styles.composer} data-testid="invitation-comments-composer">
              <label className={styles.field}>
                <span>{t('invitation.comments.name')}</span>
                <input
                  value={authorName}
                  maxLength={30}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={t('invitation.comments.name')}
                />
              </label>
              <label className={styles.field}>
                <span>{t('invitation.comments.message')}</span>
                <textarea
                  value={message}
                  maxLength={500}
                  rows={4}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={placeholder}
                />
              </label>
              <div className={styles.composerActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setComposerOpen(false)}>
                  {t('invitation.comments.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? t('invitation.comments.submitting') : t('invitation.comments.submit')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
