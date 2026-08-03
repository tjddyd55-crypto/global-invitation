'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  listActiveVisualTemplates,
  type VisualTemplateDefinition,
} from '@/src/templates/visualTemplate/visualTemplateRegistry';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { isVisualTemplateId, VISUAL_TEMPLATE_CONCEPT } from '@/src/templates/visualTemplate/ids';
import { useCreateInvitation } from '@/src/features/templates/model/useCreateInvitation';
import {
  savePendingVisualTemplate,
  VISUAL_TEMPLATE_RESUME_PATH,
} from '@/src/features/templates/model/pendingVisualTemplate';
import { fetchCurrentUser } from '@/src/shared/auth';
import styles from './VisualTemplateCatalog.module.css';

type ConceptFilter = 'WEDDING' | 'GENERAL';

function resolveConcept(raw: string | null): ConceptFilter | null {
  if (raw === 'WEDDING' || raw === 'GENERAL') return raw;
  return null;
}

export default function VisualTemplateCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const concept = resolveConcept(searchParams.get('concept'));
  const { creatingConcept, error, start } = useCreateInvitation();
  const [busyId, setBusyId] = useState<string | null>(null);

  const templates = useMemo(
    () => (concept ? listActiveVisualTemplates(concept) : []),
    [concept]
  );

  const handleCreate = useCallback(
    async (def: VisualTemplateDefinition) => {
      setBusyId(def.id);
      try {
        const user = await fetchCurrentUser({ useCache: false });
        if (!user) {
          savePendingVisualTemplate({
            conceptType: def.conceptType,
            visualTemplateId: def.id,
            createdAt: Date.now(),
          });
          router.replace(
            `/auth/email?next=${encodeURIComponent(VISUAL_TEMPLATE_RESUME_PATH)}`
          );
          return;
        }
        await start(def.conceptType, def.id);
      } finally {
        setBusyId(null);
      }
    },
    [router, start]
  );

  if (!concept) {
    return (
      <section className={styles.screen} data-testid="visual-template-catalog">
        <p className={styles.error}>초대장 종류를 먼저 선택해 주세요.</p>
        <Link href="/create/concept" className={styles.linkBtn}>
          종류 선택으로
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="visual-template-catalog">
      <header className={styles.header}>
        <Link href="/create/concept" className={styles.back}>
          ← 뒤로
        </Link>
        <h1 className={styles.title}>템플릿을 골라 보세요</h1>
        <p className={styles.desc}>
          {concept === 'WEDDING' ? '결혼식' : '일반 행사'}에 맞는 디자인을 미리 보고 선택할 수 있습니다.
        </p>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <ul className={styles.grid}>
        {templates.map((def) => (
          <li key={def.id} className={styles.card} data-testid={`template-card-${def.id}`}>
            <div className={styles.thumbWrap}>
              <Image
                src={def.thumbnailAsset}
                alt=""
                width={240}
                height={400}
                className={styles.thumb}
                unoptimized
              />
            </div>
            <div className={styles.body}>
              <h2 className={styles.name}>{def.name}</h2>
              <p className={styles.description}>{def.description}</p>
              <p className={styles.tags}>
                {def.styleTags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </p>
              <div className={styles.actions}>
                <Link
                  href={`/templates/${def.id}/preview`}
                  className={styles.secondary}
                  data-testid={`template-preview-${def.id}`}
                >
                  미리보기
                </Link>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={Boolean(creatingConcept) || busyId === def.id}
                  onClick={() => void handleCreate(def)}
                  data-testid={`template-create-${def.id}`}
                >
                  {busyId === def.id || creatingConcept === def.conceptType
                    ? '생성 중...'
                    : '이 템플릿으로 만들기'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function assertCatalogTemplateId(raw: string | null | undefined): VisualTemplateId | null {
  if (!isVisualTemplateId(raw)) return null;
  return raw;
}

export function conceptForTemplateId(id: VisualTemplateId): ConceptFilter {
  return VISUAL_TEMPLATE_CONCEPT[id];
}
