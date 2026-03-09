'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  approveAdminTemplateSubmission,
  getAdminTemplateSubmission,
  rejectAdminTemplateSubmission,
  type AdminTemplateSubmission,
} from '@/src/lib/adminApi';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import styles from '@/src/components/admin/AdminShell.module.css';

function buildPreviewTemplateKey(submission: AdminTemplateSubmission): string {
  if (submission.approvedTemplate?.templateKey) {
    return submission.approvedTemplate.templateKey;
  }
  return `creator_${submission.category}_${submission.templateKeyCandidate || 'preview'}`;
}

export default function AdminTemplateSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [item, setItem] = useState<AdminTemplateSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [creatorShare, setCreatorShare] = useState<number>(0);

  useEffect(() => {
    if (!submissionId) return;
    let isMounted = true;

    async function load() {
      try {
        const next = await getAdminTemplateSubmission(submissionId);
        if (!isMounted) return;
        setItem(next);
        setReviewNote(next.reviewNote || '');
        setCreatorShare(next.creatorShare || 0);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '상세 정보를 불러오지 못했습니다.');
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  const previewTemplateKey = useMemo(() => (item ? buildPreviewTemplateKey(item) : null), [item]);

  if (!item && !error) {
    return <div className={styles.loading}>제출 상세 정보를 불러오는 중입니다...</div>;
  }

  if (error || !item) {
    return <p className={styles.error}>{error || '제출 정보를 찾을 수 없습니다.'}</p>;
  }

  const canReview = item.status === 'SUBMITTED';

  const handleApprove = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await approveAdminTemplateSubmission(item.id, {
        reviewNote,
        creatorShare,
      });
      setItem(updated);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '승인 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await rejectAdminTemplateSubmission(item.id, {
        reviewNote,
      });
      setItem(updated);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '반려 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Submission Review</h1>
          <p className={styles.pageDescription}>
            {item.name} · {item.category} · {item.status}
          </p>
        </div>
        <button type="button" className={`${styles.button} ${styles.secondaryButton}`} onClick={() => router.push('/admin/template-submissions')}>
          Back to List
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.metricLabel}>Creator</div>
          <p className={styles.metricValue}>{item.creator?.email || item.creatorId}</p>
          <p className={styles.helperText}>Candidate key: {item.templateKeyCandidate}</p>
          <p className={styles.helperText}>Revision: r{item.revisionNumber}</p>
          <p className={styles.helperText}>Price: ${item.price.toFixed(2)}</p>
        </article>
        <article className={styles.card}>
          <div className={styles.metricLabel}>Thumbnail</div>
          {item.previewThumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewThumbnailUrl} alt={item.name} style={{ width: '100%', borderRadius: 12 }} />
          ) : (
            <p className={styles.helperText}>썸네일 없음</p>
          )}
        </article>
        <article className={styles.card}>
          <div className={styles.metricLabel}>Review note</div>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            style={{ width: '100%', minHeight: 120 }}
            disabled={busy}
          />
          <label className={styles.field} style={{ marginTop: 12 }}>
            <span>Creator share (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={creatorShare}
              onChange={(e) => setCreatorShare(Number(e.target.value) || 0)}
              disabled={busy}
            />
          </label>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.pageTitle}>Preview</h2>
            <p className={styles.pageDescription}>Studio config 기반 시각 결과를 확인합니다.</p>
          </div>
        </div>
        <div style={{ height: 420, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {previewTemplateKey && (
            <TemplatePreviewWrapper
              templateKey={previewTemplateKey}
              studioConfig={item.studioConfig || undefined}
            />
          )}
        </div>
      </section>

      {canReview && (
        <section className={styles.section}>
          <div className={styles.actions}>
            <button type="button" className={styles.button} disabled={busy} onClick={handleApprove}>
              Approve
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.dangerButton}`}
              disabled={busy}
              onClick={handleReject}
            >
              Reject
            </button>
          </div>
        </section>
      )}
    </>
  );
}
