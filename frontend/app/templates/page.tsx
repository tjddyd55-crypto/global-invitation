'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { createInvitation } from '@/src/lib/api';
import MarketingLayout from '@/src/components/MarketingLayout';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import styles from './templates.module.css';

type ConceptType = 'WEDDING' | 'FUNERAL' | 'GENERAL';

const CONCEPT_OPTIONS: Array<{ value: ConceptType; label: string; description: string }> = [
  { value: 'WEDDING', label: '결혼식', description: '신랑/신부/혼주 정보가 활성화됩니다.' },
  { value: 'FUNERAL', label: '부고장', description: '고인/장례식장/장례 일정 정보가 활성화됩니다.' },
  { value: 'GENERAL', label: '일반 행사', description: '공통 기능 중심의 기본 초대장을 작성합니다.' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [creatingConcept, setCreatingConcept] = useState<ConceptType | null>(null);

  const handleCreate = async (conceptType: ConceptType) => {
    setCreatingConcept(conceptType);
    try {
      const created = await createInvitation('invitation_full');
      router.push(`/editor/${created.id}?concept=${conceptType}`);
    } catch {
      router.push(`/editor/new?template=invitation-full-default&concept=${conceptType}`);
    } finally {
      setCreatingConcept(null);
    }
  };

  return (
    <MarketingLayout>
      <div className={styles.root}>
        <h1 className={styles.title}>FULL 엔진 시작</h1>
        <p className={styles.subtitle}>
          템플릿은 `FULL` 하나만 사용합니다. 아래에서 컨셉을 선택해 시작하세요.
        </p>
        <div className={styles.grid} data-testid="templates-grid">
          <article className={styles.card} data-testid="template-card">
            <div className={styles.thumbnail}>
              <TemplatePreviewWrapper templateKey="invitation_full" />
              <span className={styles.thumbnailLabel}>FULL · Concept-driven</span>
            </div>
            <h2 className={styles.cardTitle}>Invitation Full Engine</h2>
            <p className={styles.cardDesc}>
              공통 기능(히어로/갤러리/지도/일정/RSVP/계좌/공유/음악)을 단일 엔진으로 사용하고,
              컨셉별 확장 필드만 분기합니다.
            </p>
            <div className={styles.actions} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              {CONCEPT_OPTIONS.map((concept) => (
                <button
                  key={concept.value}
                  type="button"
                  onClick={() => handleCreate(concept.value)}
                  className={styles.button}
                  disabled={creatingConcept === concept.value}
                  data-testid={`concept-create-${concept.value.toLowerCase()}`}
                >
                  {creatingConcept === concept.value ? '생성 중...' : `${concept.label}으로 시작`}
                </button>
              ))}
            </div>
            <p className={styles.searchHint}>
              {CONCEPT_OPTIONS.map((concept) => `${concept.label}: ${concept.description}`).join(' / ')}
            </p>
          </article>
        </div>
        <p className={styles.footer}>
          <Link href="/my-invitations" className={styles.link}>내 초대장 관리</Link>
        </p>
      </div>
    </MarketingLayout>
  );
}
