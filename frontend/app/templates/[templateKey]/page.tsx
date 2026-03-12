'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { cloneTemplateInvitation } from '@/src/lib/api';
import { setGuestToken } from '@/src/lib/auth';
import MarketingLayout from '@/src/components/MarketingLayout';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import { fetchTemplateDefinitionById, type TemplateDefinition } from '@/src/templates/registry';
import styles from './template-detail.module.css';

export default function TemplateDetailPage() {
  const params = useParams<{ templateKey: string }>();
  const router = useRouter();
  const templateKey = typeof params?.templateKey === 'string' ? params.templateKey : '';
  const [template, setTemplate] = useState<TemplateDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTemplate() {
      setLoading(true);
      const loaded = await fetchTemplateDefinitionById(templateKey);
      if (!active) {
        return;
      }
      setTemplate(loaded);
      setLoading(false);
    }

    if (!templateKey) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    void loadTemplate();

    return () => {
      active = false;
    };
  }, [templateKey]);

  const displayKey = useMemo(
    () => template?.publicTemplateKey || template?.slug || template?.id || templateKey,
    [template, templateKey]
  );

  const handleCreate = async () => {
    if (!template || cloning) return;
    setCloning(true);
    try {
      const cloned = await cloneTemplateInvitation(template.id);
      if (cloned.guest_token) {
        setGuestToken(cloned.guest_token);
      }
      router.push(cloned.editor_url);
    } catch {
      router.push(`/editor/new?template=${template.id}`);
    } finally {
      setCloning(false);
    }
  };

  return (
    <MarketingLayout>
      <div className={styles.root}>
        <Link href="/templates" className={styles.backLink}>
          ← 템플릿 목록으로
        </Link>

        {loading && <p className={styles.emptyState}>템플릿 정보를 불러오는 중입니다...</p>}

        {!loading && !template && (
          <div className={styles.emptyBox}>
            <h1>템플릿을 찾을 수 없습니다</h1>
            <p>삭제되었거나 공개되지 않은 템플릿일 수 있습니다.</p>
            <Link href="/templates" className={styles.backButton}>
              목록으로 돌아가기
            </Link>
          </div>
        )}

        {!loading && template && (
          <section className={styles.content}>
            <div className={styles.previewPanel}>
              {template.thumbnailUrl ? (
                <img
                  src={template.thumbnailUrl}
                  alt={`${template.title || template.name} thumbnail`}
                  className={styles.thumbnailImage}
                />
              ) : (
                <TemplatePreviewWrapper
                  templateKey={template.templateKey}
                  studioConfig={template.studioConfig || undefined}
                />
              )}
            </div>

            <div className={styles.metaPanel}>
              <h1 className={styles.title}>{template.title || template.name}</h1>
              <p className={styles.description}>{template.description}</p>
              <dl className={styles.metaList}>
                <div>
                  <dt>Template Key</dt>
                  <dd>{displayKey}</dd>
                </div>
                <div>
                  <dt>Creator</dt>
                  <dd>
                    {template.creatorName || 'Global Invitation'} ({template.creatorDisplayId || 'system'})
                  </dd>
                </div>
                <div>
                  <dt>Views</dt>
                  <dd>{template.viewCount || 0}</dd>
                </div>
                <div>
                  <dt>Clones</dt>
                  <dd>{template.cloneCount || 0}</dd>
                </div>
              </dl>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleCreate}
                  disabled={cloning}
                  data-testid="template-detail-create-button"
                >
                  {cloning ? '생성 중...' : '이 템플릿으로 만들기'}
                </button>
                <Link href="/templates" className={styles.secondaryButton}>
                  다른 템플릿 보기
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </MarketingLayout>
  );
}
