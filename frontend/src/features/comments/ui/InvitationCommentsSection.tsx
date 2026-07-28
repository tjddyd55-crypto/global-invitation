'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getConceptPresentationConfig } from '@/src/invitation/conceptPresentationConfig';
import { buildApiUrl } from '@/src/lib/apiBase';
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

export default function InvitationCommentsSection({
  invitationSlug,
  conceptType,
  enabled = true,
  titleOverride,
  placeholderOverride,
  previewMode = false,
}: InvitationCommentsSectionProps) {
  const labels = getConceptPresentationConfig(conceptType);
  const title = (titleOverride || labels.commentsTitle).trim();
  const subtitle = labels.commentsSubtitle;
  const placeholder = (placeholderOverride || labels.commentsPlaceholder).trim();

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
        throw new Error('댓글을 불러오지 못했습니다.');
      }
      const data = (await res.json()) as { items?: PublicComment[] };
      setComments(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [canFetch, invitationSlug]);

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
      setError('이름은 1~30자로 입력해 주세요.');
      return;
    }
    if (body.length < 1 || body.length > 500) {
      setError('메시지는 1~500자로 입력해 주세요.');
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
        throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
      }
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || '메시지 등록에 실패했습니다.');
      }
      setAuthorName('');
      setMessage('');
      setComposerOpen(false);
      setSuccess('메시지가 등록되었습니다.');
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 등록에 실패했습니다.');
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

      {loading ? <p className={styles.meta}>불러오는 중…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.list}>
        {sorted.length === 0 && !loading ? (
          <p className={styles.empty}>아직 등록된 메시지가 없습니다.</p>
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
        <p className={styles.meta}>미리보기 — 공개 페이지에서 메시지를 남길 수 있습니다.</p>
      ) : (
        <>
          {!composerOpen ? (
            <button type="button" className={styles.writeBtn} onClick={() => setComposerOpen(true)}>
              작성하기
            </button>
          ) : (
            <div className={styles.composer} data-testid="invitation-comments-composer">
              <label className={styles.field}>
                <span>이름</span>
                <input
                  value={authorName}
                  maxLength={30}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="이름"
                />
              </label>
              <label className={styles.field}>
                <span>메시지</span>
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
                  취소
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? '등록 중…' : '등록하기'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
