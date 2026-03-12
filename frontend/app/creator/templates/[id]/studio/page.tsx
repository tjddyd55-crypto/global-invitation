'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  createCreatorTemplateSubmission,
  getCreatorTemplateSubmission,
  submitCreatorTemplateSubmission,
  updateCreatorTemplateSubmission,
  type TemplateSubmission,
} from '@/src/lib/creatorApi';
import {
  buildDefaultStudioConfig,
  isCreatorActiveCategory,
  parseStudioConfig,
  type CreatorActiveCategory,
  type CreatorSectionMap,
  type CreatorThemeConfig,
} from '@/src/creator/studioConfig';
import TemplateCreatorShell from '@/src/creator/studio/TemplateCreatorShell';
import TemplateMetaPanel, { type TemplateMetaValue } from '@/src/creator/studio/TemplateMetaPanel';
import SectionConfigPanel from '@/src/creator/studio/SectionConfigPanel';
import ThemeConfigPanel from '@/src/creator/studio/ThemeConfigPanel';
import LivePreviewPanel from '@/src/creator/studio/LivePreviewPanel';
import SubmissionActions from '@/src/creator/studio/SubmissionActions';
import studioStyles from '@/src/creator/studio/TemplateCreatorStudio.module.css';
import { uploadMediaImage } from '@/src/lib/mediaApi';
import { fetchCurrentUser } from '@/src/lib/auth';

function buildMetaValue(submission: TemplateSubmission): TemplateMetaValue {
  return {
    name: submission.name,
    description: submission.description,
    style: submission.style,
    price: submission.price,
    previewThumbnailUrl: submission.previewThumbnailUrl || '',
    templateKeyCandidate: submission.templateKeyCandidate,
  };
}

export default function CreatorTemplateStudioPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [submission, setSubmission] = useState<TemplateSubmission | null>(null);
  const [metaValue, setMetaValue] = useState<TemplateMetaValue | null>(null);
  const [themeConfig, setThemeConfig] = useState<CreatorThemeConfig>(buildDefaultStudioConfig('wedding').theme);
  const [sectionsConfig, setSectionsConfig] = useState<CreatorSectionMap>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [accessReady, setAccessReady] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    let isMounted = true;

    async function loadSubmission() {
      try {
        const me = await fetchCurrentUser();
        if (!me || me.role !== 'CREATOR') {
          router.replace('/signup?role=CREATOR');
          return;
        }

        const next = await getCreatorTemplateSubmission(submissionId);
        if (!isMounted) return;
        setSubmission(next);
        setMetaValue(buildMetaValue(next));
        setAccessReady(true);

        if (isCreatorActiveCategory(next.category)) {
          const parsed = parseStudioConfig(next.studioConfig);
          const baseConfig = parsed || buildDefaultStudioConfig(next.category);
          setThemeConfig(baseConfig.theme);
          setSectionsConfig(baseConfig.sections);
          setSectionOrder(baseConfig.sectionOrder);
        }
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : 'Studio 데이터를 불러오지 못했습니다.';
        if (message.includes('CREATOR_ROLE_REQUIRED') || message.includes('UNAUTHORIZED')) {
          router.replace('/signup?role=CREATOR');
          return;
        }
        setError(message);
        setAccessReady(true);
      }
    }

    void loadSubmission();

    return () => {
      isMounted = false;
    };
  }, [submissionId, router]);

  const category = submission?.category;
  const activeCategory = isCreatorActiveCategory(category || '') ? (category as CreatorActiveCategory) : null;

  const studioConfig = useMemo(() => {
    if (!activeCategory) return null;
    return {
      category: activeCategory,
      theme: themeConfig,
      sections: sectionsConfig,
      sectionOrder,
    };
  }, [activeCategory, sectionOrder, sectionsConfig, themeConfig]);

  const canSubmit = Boolean(
    submission &&
      metaValue &&
      activeCategory &&
      metaValue.name.trim() &&
      metaValue.description.trim() &&
      metaValue.previewThumbnailUrl.trim() &&
      studioConfig
  );

  if (!accessReady) {
    return <div className={studioStyles.studioPage}>Loading creator access...</div>;
  }

  if (!submission || !metaValue) {
    return <div className={studioStyles.studioPage}>Loading studio...</div>;
  }

  if (!activeCategory) {
    return (
      <div className={studioStyles.studioPage}>
        <p className={studioStyles.error}>
          이 카테고리는 현재 Studio 실동작 대상이 아닙니다. (active: wedding/funeral/message)
        </p>
        <Link href="/creator/templates" className={`${studioStyles.button} ${studioStyles.buttonSecondary}`}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const saveDraft = async () => {
    if (!studioConfig) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateCreatorTemplateSubmission(submission.id, {
        name: metaValue.name,
        description: metaValue.description,
        style: metaValue.style,
        price: metaValue.price,
        templateKeyCandidate: metaValue.templateKeyCandidate,
        previewThumbnailUrl: metaValue.previewThumbnailUrl,
        studioConfig,
      });
      setSubmission(updated);
      setSuccess('Draft saved');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Draft 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!studioConfig) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await saveDraft();
      const updated = await submitCreatorTemplateSubmission(submission.id);
      setSubmission(updated);
      setSuccess('Submission sent for review');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '제출 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const createRevision = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createCreatorTemplateSubmission({
        category: submission.category,
        parentSubmissionId: submission.id,
        name: metaValue.name,
        description: metaValue.description,
        style: metaValue.style,
        price: metaValue.price,
        templateKeyCandidate: metaValue.templateKeyCandidate,
        previewThumbnailUrl: metaValue.previewThumbnailUrl,
        studioConfig: studioConfig || undefined,
      });
      router.push(`/creator/templates/${created.id}/studio`);
    } catch (revisionError) {
      setError(revisionError instanceof Error ? revisionError.message : '리비전 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateSection = (sectionKey: string) => {
    const target = document.getElementById(`studio-section-${sectionKey}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    setError(null);
    try {
      const uploaded = await uploadMediaImage(file, {
        context: 'template',
        entityId: submission.id,
        assetType: 'thumbnail',
      });
      setMetaValue((current) => (current ? { ...current, previewThumbnailUrl: uploaded.url } : current));
      setSuccess('Thumbnail uploaded');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '썸네일 업로드에 실패했습니다.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  return (
    <TemplateCreatorShell
      title={`Studio: ${metaValue.name || 'Untitled'}`}
      description={`Category: ${submission.category} · Status: ${submission.status}`}
      notice={
        <>
          {submission.status === 'REJECTED' && (
            <p className={studioStyles.error} data-testid="creator-rejected-reason">
              반려 사유: {submission.reviewNote || '관리자 사유가 없습니다. 수정 후 재제출하세요.'}
            </p>
          )}
          {error && <p className={studioStyles.error}>{error}</p>}
          {success && <p className={studioStyles.success}>{success}</p>}
        </>
      }
      headerActions={
        <Link href="/creator/templates" className={`${studioStyles.button} ${studioStyles.buttonSecondary}`}>
          Back
        </Link>
      }
      left={
        <>
          <TemplateMetaPanel
            category={activeCategory}
            value={metaValue}
            sectionKeys={sectionOrder}
            uploadingThumbnail={uploadingThumbnail}
            onChange={(next) => setMetaValue({ ...metaValue, ...next })}
            onNavigateSection={handleNavigateSection}
            onThumbnailUpload={handleThumbnailUpload}
          />
          <SubmissionActions
            status={submission.status}
            canSubmit={canSubmit}
            saving={saving}
            submitting={submitting}
            onSave={saveDraft}
            onSubmit={submitForReview}
            onCreateRevision={createRevision}
          />
        </>
      }
      center={
        <>
          <SectionConfigPanel
            category={activeCategory}
            sections={sectionsConfig}
            sectionOrder={sectionOrder}
            onSectionsChange={setSectionsConfig}
            onSectionOrderChange={setSectionOrder}
          />
          <ThemeConfigPanel value={themeConfig} onChange={setThemeConfig} />
        </>
      }
      right={
        <LivePreviewPanel
          category={activeCategory}
          templateKeyCandidate={metaValue.templateKeyCandidate}
          studioConfig={
            studioConfig || buildDefaultStudioConfig(activeCategory)
          }
        />
      }
    />
  );
}
