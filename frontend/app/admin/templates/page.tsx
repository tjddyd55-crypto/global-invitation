'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  approveAdminTemplateSubmission,
  type AdminTemplateSubmission,
  deleteAdminTemplate,
  disableAdminTemplate,
  listAdminTemplates,
  listAdminTemplateSubmissions,
  rejectAdminTemplateSubmission,
} from '@/src/lib/adminApi';
import { calculateTemplateRevenue, type TemplateDefinition } from '@/src/templates/registry';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [submissions, setSubmissions] = useState<AdminTemplateSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'CREATED' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'
  >('ALL');

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      try {
        const [nextTemplates, nextSubmissions] = await Promise.all([
          listAdminTemplates(statusFilter === 'ALL' ? undefined : statusFilter),
          listAdminTemplateSubmissions(),
        ]);
        if (!isMounted) return;
        setTemplates(nextTemplates);
        setSubmissions(nextSubmissions);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '템플릿 목록을 불러오지 못했습니다.');
      }
    }

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const handleDisable = async (templateId: string) => {
    setBusyTemplateId(templateId);
    setError(null);
    try {
      const updated = await disableAdminTemplate(templateId);
      setTemplates((current) =>
        current.map((template) => (template.id === templateId ? updated : template))
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '템플릿 비활성화에 실패했습니다.');
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
                event.target.value as 'ALL' | 'CREATED' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'
              )
            }
          >
            <option value="ALL">ALL</option>
            <option value="CREATED">CREATED</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
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
                const statusSuffix = template.isDeleted ? ' / Deleted' : template.isActive ? '' : ' / Disabled';
                const status = `${template.status}${statusSuffix}`;

                return (
                  <tr key={template.id}>
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
                      <span className={styles.pill}>{status}</span>
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
                          onClick={() => handleDisable(template.id)}
                          disabled={busyTemplateId === template.id || !template.isActive}
                        >
                          Disable
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
    </>
  );
}
