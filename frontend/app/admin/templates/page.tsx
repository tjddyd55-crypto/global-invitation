'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  approveAdminTemplateSubmission,
  type AdminTemplateSubmission,
  deleteAdminTemplate,
  listAdminTemplates,
  listAdminTemplateSubmissions,
  rejectAdminTemplateSubmission,
  updateTemplateStatus,
} from '@/src/lib/adminApi';
import { calculateTemplateRevenue, type TemplateDefinition } from '@/src/templates/registry';
import styles from '@/src/components/admin/AdminShell.module.css';

function TemplateListThumb({ template }: { template: TemplateDefinition }) {
  const src = template.previewThumbnailUrl || template.thumbnailUrl;
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          background: '#f3f4f6',
          border: '1px dashed #d1d5db',
          fontSize: 11,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 4,
        }}
      >
        No thumb
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 관리자 썸네일은 임의 원격 URL(R2 등)
    <img
      src={src}
      alt=""
      width={80}
      height={80}
      style={{
        width: 80,
        height: 80,
        objectFit: 'cover',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}
      onError={() => setBroken(true)}
    />
  );
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [submissions, setSubmissions] = useState<AdminTemplateSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    | 'ALL'
    | 'CREATED'
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'DISABLED'
    | 'REJECTED'
    | 'ARCHIVED'
  >('ALL');

  const refreshTemplateTables = useCallback(async () => {
    try {
      const [nextTemplates, nextSubmissions] = await Promise.all([
        listAdminTemplates(statusFilter === 'ALL' ? undefined : statusFilter),
        listAdminTemplateSubmissions(),
      ]);
      setTemplates(nextTemplates);
      setSubmissions(nextSubmissions);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '템플릿 목록을 불러오지 못했습니다.');
    }
  }, [statusFilter]);

  useEffect(() => {
    void refreshTemplateTables();
  }, [refreshTemplateTables]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'TEMPLATE_UPDATED') {
        void refreshTemplateTables();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [refreshTemplateTables]);

  const handleStatusChange = async (templateId: string, newStatus: string) => {
    let rejectReason: string | undefined;
    if (newStatus === 'REJECTED') {
      const raw =
        typeof window !== 'undefined' ? window.prompt('반려 사유(필수):', '')?.trim() : '';
      if (!raw) {
        setError('반려 사유를 입력해야 합니다.');
        return;
      }
      rejectReason = raw;
    }
    setBusyTemplateId(templateId);
    setError(null);
    try {
      const updated = await updateTemplateStatus(
        templateId,
        newStatus,
        rejectReason ? { rejectReason } : undefined
      );
      setTemplates((current) => current.map((t) => (t.id === templateId ? updated : t)));
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : '템플릿 상태 변경에 실패했습니다.'
      );
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    setBusyTemplateId(templateId);
    setError(null);
    try {
      const updated = await deleteAdminTemplate(templateId);
      setTemplates((current) =>
        current.map((template) => (template.id === templateId ? updated : template))
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '템플릿 삭제에 실패했습니다.');
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    setBusySubmissionId(submissionId);
    setError(null);
    try {
      const approved = await approveAdminTemplateSubmission(submissionId);
      setSubmissions((current) =>
        current.map((submission) => (submission.id === submissionId ? approved : submission))
      );
      const nextTemplates = await listAdminTemplates();
      setTemplates(nextTemplates);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '템플릿 승인에 실패했습니다.');
    } finally {
      setBusySubmissionId(null);
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    setBusySubmissionId(submissionId);
    setError(null);
    try {
      const rejected = await rejectAdminTemplateSubmission(submissionId);
      setSubmissions((current) =>
        current.map((submission) => (submission.id === submissionId ? rejected : submission))
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '템플릿 반려에 실패했습니다.');
    } finally {
      setBusySubmissionId(null);
    }
  };

  const pendingSubmissions = submissions.filter((submission) => submission.status === 'SUBMITTED');

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Template Management</h1>
          <p className={styles.pageDescription}>
            템플릿 메타데이터, 가격, 제작자 수익, 활성 상태를 운영합니다.
          </p>
        </div>
        <Link href="/admin/templates/new" className={styles.button}>
          Create Template
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Review Queue</h2>
        <p className={styles.pageDescription}>Creator 검토 요청 상태(SUBMITTED) 템플릿을 심사합니다.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>템플릿 이름</th>
                <th>카테고리</th>
                <th>Creator</th>
                <th>요청일</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {pendingSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <strong>{submission.name}</strong>
                    <div className={styles.helperText}>{submission.templateKeyCandidate}</div>
                  </td>
                  <td>{submission.category}</td>
                  <td>{submission.creator?.email || submission.creatorId}</td>
                  <td>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}</td>
                  <td>
                    <span className={styles.pill}>{submission.status}</span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/template-submissions/${submission.id}`}
                        className={`${styles.button} ${styles.secondaryButton}`}
                      >
                        Review
                      </Link>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.secondaryButton}`}
                        onClick={() => handleApproveSubmission(submission.id)}
                        disabled={busySubmissionId === submission.id}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.dangerButton}`}
                        onClick={() => handleRejectSubmission(submission.id)}
                        disabled={busySubmissionId === submission.id}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingSubmissions.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.helperText}>
                    검토 대기 중인 submission이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.topbar} style={{ marginBottom: 8 }}>
          <div className={styles.pageDescription}>템플릿 상태 필터</div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'ALL'
                  | 'CREATED'
                  | 'PENDING_REVIEW'
                  | 'APPROVED'
                  | 'PUBLISHED'
                  | 'DISABLED'
                  | 'REJECTED'
                  | 'ARCHIVED'
              )
            }
          >
            <option value="ALL">ALL</option>
            <option value="CREATED">CREATED</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DISABLED">DISABLED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>썸네일</th>
                <th>템플릿 이름</th>
                <th>카테고리</th>
                <th>스타일</th>
                <th>제작자</th>
                <th>가격</th>
                <th>수익비율</th>
                <th>상태</th>
                <th>등록일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const revenue = calculateTemplateRevenue(template.price, template.creatorShare);
                const lifecycle =
                  template.lifecycleStatus ??
                  (template.status as TemplateDefinition['lifecycleStatus'] | undefined);

                return (
                  <tr key={template.id}>
                    <td>
                      <TemplateListThumb template={template} />
                    </td>
                    <td>
                      <strong>{template.name}</strong>
                      <div className={styles.helperText}>{template.component}</div>
                    </td>
                    <td>{template.category}</td>
                    <td>{template.style}</td>
                    <td>{template.creatorId || 'SYSTEM'}</td>
                    <td>${template.price.toFixed(2)}</td>
                    <td>
                      {template.creatorShare}% / ${revenue.creatorEarnings.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span className={styles.pill}>{lifecycle || template.status}</span>
                        <select
                          value={lifecycle || 'CREATED'}
                          onChange={(e) => void handleStatusChange(template.id, e.target.value)}
                          disabled={busyTemplateId === template.id}
                          className="rounded border border-neutral-300 px-2 py-1 text-sm"
                          aria-label="Template lifecycle status"
                        >
                          <option value="CREATED">CREATED</option>
                          <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="DISABLED">DISABLED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </td>
                    <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/templates/${template.id}`}
                          className={`${styles.button} ${styles.secondaryButton}`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.secondaryButton}`}
                          onClick={() => setPreviewTemplateId(template.id)}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.secondaryButton}`}
                          onClick={() => void handleStatusChange(template.id, 'PUBLISHED')}
                          disabled={
                            busyTemplateId === template.id ||
                            (lifecycle !== 'APPROVED' && lifecycle !== 'DISABLED')
                          }
                          title="APPROVED 또는 DISABLED에서만 공개 가능"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.secondaryButton}`}
                          onClick={() => void handleStatusChange(template.id, 'DISABLED')}
                          disabled={
                            busyTemplateId === template.id || lifecycle !== 'PUBLISHED'
                          }
                          title="마켓 일시 비활성 (PUBLISHED만)"
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.dangerButton}`}
                          onClick={() => void handleStatusChange(template.id, 'ARCHIVED')}
                          disabled={
                            busyTemplateId === template.id ||
                            (lifecycle !== 'PUBLISHED' && lifecycle !== 'DISABLED')
                          }
                          title="숨김(소프트 아카이브)"
                        >
                          Hide
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.dangerButton}`}
                          onClick={() => handleDelete(template.id)}
                          disabled={busyTemplateId === template.id || template.isDeleted}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {previewTemplateId ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setPreviewTemplateId(null)}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label="Template preview"
            style={{
              maxWidth: 'min(960px, 96vw)',
              width: '100%',
              height: 'min(90vh, 860px)',
              maxHeight: '90vh',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <strong>Template preview</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/admin/templates/${previewTemplateId}/preview`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.button} ${styles.secondaryButton}`}
                >
                  Open in tab
                </Link>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setPreviewTemplateId(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              title="Template preview"
              src={`/admin/templates/${previewTemplateId}/preview?embed=1`}
              style={{ flex: 1, width: '100%', border: 'none', minHeight: 0 }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
