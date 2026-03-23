'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchAdminTemplatePreviewBundle,
  updateTemplateStatus,
} from '@/src/lib/adminApi';
import { mergeAdminPreviewSample } from '@/src/lib/mergeAdminTemplatePreviewSample';
import type { TemplatePreviewData } from '@/src/templates/previewData';
import type { TemplateDefinition } from '@/src/templates/registry';
import { getTemplatePreviewData } from '@/src/templates/registry';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import styles from '@/src/components/admin/AdminShell.module.css';

const POST_MESSAGE_TYPE = 'TEMPLATE_UPDATED' as const;

function notifyAdminParentToRefresh() {
  try {
    if (typeof window === 'undefined') return;
    const msg = { type: POST_MESSAGE_TYPE };
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(msg, '*');
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, '*');
    }
  } catch {
    /* cross-origin */
  }
}

export default function AdminTemplatePreviewPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [embed, setEmbed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateDefinition | null>(null);
  const [previewData, setPreviewData] = useState<TemplatePreviewData | null | undefined>(undefined);
  const [previewMode, setPreviewMode] = useState<'sample' | 'real'>('sample');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [rejectReasonDraft, setRejectReasonDraft] = useState('');
  const [showRejectPanel, setShowRejectPanel] = useState(false);

  const loadBundle = useCallback(
    async (mode: 'sample' | 'real') => {
      if (!id) return;
      setError(null);
      const bundle = await fetchAdminTemplatePreviewBundle(id, {
        mode: mode === 'real' ? 'real' : undefined,
      });
      setTemplate(bundle.template);

      if (mode === 'real') {
        setPreviewData(undefined);
        if (!getTemplatePreviewData(bundle.template.templateKey)) {
          setError('이 templateKey는 실제(Real) 미리보기를 지원하지 않습니다.');
          setPreviewData(null);
          return;
        }
        return;
      }

      const merged =
        bundle.sampleData && Object.keys(bundle.sampleData).length > 0
          ? mergeAdminPreviewSample(bundle.template, bundle.sampleData)
          : null;
      if (!merged) {
        setPreviewData(null);
        setError('이 templateKey는 미리보기 레지스트리에 없습니다.');
        return;
      }
      setPreviewData(merged);
    },
    [id]
  );

  useEffect(() => {
    setEmbed(new URLSearchParams(window.location.search).get('embed') === '1');
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    (async () => {
      try {
        await loadBundle(previewMode);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '미리보기를 불러오지 못했습니다.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, previewMode, loadBundle]);

  const runStatusAction = async (label: string, nextStatus: string, opts?: { rejectReason?: string }) => {
    if (!id) return;
    setBusyAction(label);
    try {
      await updateTemplateStatus(id, nextStatus, opts);
      await loadBundle(previewMode);
      notifyAdminParentToRefresh();
      // eslint-disable-next-line no-alert -- 운영자 즉시 피드백
      alert(`${label} 완료`);
      setShowRejectPanel(false);
      setRejectReasonDraft('');
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e instanceof Error ? e.message : '상태 변경에 실패했습니다.');
    } finally {
      setBusyAction(null);
    }
  };

  const lifecycle = template?.lifecycleStatus ?? null;
  const canApprove = lifecycle === 'PENDING_REVIEW';
  const canReject = lifecycle === 'PENDING_REVIEW';
  const canPublish = lifecycle === 'APPROVED' || lifecycle === 'DISABLED';
  const canPause = lifecycle === 'PUBLISHED';

  if (!id) {
    return <div style={{ padding: 16 }}>잘못된 템플릿 ID</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: '#b91c1c' }}>
        {error}
        {template ? (
          <div style={{ marginTop: 8, fontSize: 14, color: '#374151' }}>
            templateKey: <code>{template.templateKey}</code>
          </div>
        ) : null}
      </div>
    );
  }

  if (!template) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  if (previewMode === 'sample' && previewData === undefined) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  if (previewMode === 'sample' && previewData === null) {
    return (
      <div style={{ padding: 16, color: '#b91c1c' }}>
        미리보기 데이터를 구성할 수 없습니다.
        <div style={{ marginTop: 8 }}>
          <code>{template.templateKey}</code>
        </div>
      </div>
    );
  }

  const frame = (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        height: embed ? '100%' : 'min(90vh, 820px)',
        minHeight: embed ? '100%' : undefined,
        border: embed ? 'none' : '1px solid #e5e7eb',
        borderRadius: embed ? 0 : 12,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <TemplatePreviewWrapper
        templateKey={template.templateKey}
        sampleData={previewMode === 'real' ? undefined : previewData ?? undefined}
        studioConfig={template.studioConfig ?? undefined}
      />
    </div>
  );

  if (embed) {
    return (
      <div style={{ height: '100vh', width: '100%', background: '#f3f4f6', boxSizing: 'border-box' }}>
        {frame}
      </div>
    );
  }

  const creatorDisplay =
    template.creatorName && template.creatorEmail
      ? `${template.creatorName} (${template.creatorEmail})`
      : template.creatorEmail || template.creatorName || template.creatorId || 'SYSTEM';

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: 16, boxSizing: 'border-box' }}>
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>{template.name}</h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
            fontSize: 14,
            color: '#4b5563',
            marginBottom: 16,
          }}
        >
          <div>
            <strong>Category</strong>: {template.category}
          </div>
          <div>
            <strong>Style</strong>: {template.style}
          </div>
          <div>
            <strong>Price</strong>: ${Number(template.price).toFixed(2)}
          </div>
          <div>
            <strong>Creator share</strong>: {template.creatorShare}%
          </div>
          <div>
            <strong>Creator</strong>: {creatorDisplay}
          </div>
          <div>
            <strong>Registered</strong>: {new Date(template.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Status (DB)</strong>: {template.status}
          </div>
          <div>
            <strong>Lifecycle</strong>: {lifecycle ?? '—'}
          </div>
          <div>
            <strong>templateKey</strong>: <code>{template.templateKey}</code>
          </div>
          {template.adminRejectReason ? (
            <div style={{ gridColumn: '1 / -1', color: '#b45309' }}>
              <strong>Last reject reason</strong>: {template.adminRejectReason}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280', marginRight: 4 }}>Preview mode:</span>
          <button
            type="button"
            className={previewMode === 'sample' ? styles.button : `${styles.button} ${styles.secondaryButton}`}
            onClick={() => setPreviewMode('sample')}
            disabled={busyAction !== null}
          >
            Sample (기본+오버레이)
          </button>
          <button
            type="button"
            className={previewMode === 'real' ? styles.button : `${styles.button} ${styles.secondaryButton}`}
            onClick={() => setPreviewMode('real')}
            disabled={busyAction !== null}
            title="크리에이터 Studio와 동일: 레지스트리 기본 데이터 + studioConfig만"
          >
            Real (실제 구성)
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={styles.button}
            style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' }}
            disabled={!canApprove || busyAction !== null}
            onClick={() => void runStatusAction('승인', 'APPROVED')}
          >
            Approve
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.dangerButton}`}
            disabled={!canReject || busyAction !== null}
            onClick={() => setShowRejectPanel((v) => !v)}
          >
            Reject
          </button>
          <button
            type="button"
            className={styles.button}
            style={{ background: '#15803d', color: '#fff', borderColor: '#15803d' }}
            disabled={!canPublish || busyAction !== null}
            onClick={() => void runStatusAction('공개', 'PUBLISHED')}
          >
            Publish
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondaryButton}`}
            disabled={!canPause || busyAction !== null}
            onClick={() => void runStatusAction('일시 비활성', 'DISABLED')}
            title="마켓에서 숨김 (PUBLISHED → DISABLED)"
          >
            Pause (Disable)
          </button>
          {busyAction ? (
            <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b7280' }}>{busyAction} 처리 중…</span>
          ) : null}
        </div>

        {showRejectPanel && canReject ? (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              background: '#fef2f2',
              borderRadius: 8,
              border: '1px solid #fecaca',
            }}
          >
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              반려 사유 (필수)
            </label>
            <textarea
              value={rejectReasonDraft}
              onChange={(e) => setRejectReasonDraft(e.target.value)}
              rows={3}
              style={{ width: '100%', maxWidth: 480, padding: 8, fontSize: 14, borderRadius: 6, border: '1px solid #e5e7eb' }}
              placeholder="크리에이터에게 전달됩니다."
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`${styles.button} ${styles.dangerButton}`}
                disabled={busyAction !== null}
                onClick={() => {
                  const trimmed = rejectReasonDraft.trim();
                  if (!trimmed) {
                    // eslint-disable-next-line no-alert
                    alert('반려 사유를 입력하세요.');
                    return;
                  }
                  void runStatusAction('반려', 'REJECTED', { rejectReason: trimmed });
                }}
              >
                Confirm reject
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => {
                  setShowRejectPanel(false);
                  setRejectReasonDraft('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
          Approve/Reject는 PENDING_REVIEW에서만, Publish는 APPROVED 또는 DISABLED, Pause는 PUBLISHED에서만
          가능합니다.
        </p>
      </div>

      {frame}
    </div>
  );
}
