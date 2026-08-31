'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import {
  getVisualTemplateDefinition,
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
import { useI18n } from '@/src/contexts/I18nContext';
import {
  fetchPublicVisualCatalog,
  type PublicVisualCatalogItem,
} from '@/src/features/templates/model/fetchPublicVisualCatalog';
import styles from './VisualTemplateCatalog.module.css';

type ConceptFilter = 'WEDDING' | 'GENERAL' | 'ORGANIZATION';

type CatalogCard = {
  id: string;
  conceptType: ConceptFilter;
  name: string;
  description: string;
  thumbnailAsset: string;
  styleTags: string[];
  featured: boolean;
  isNew: boolean;
  premium: boolean;
  sourceType?: string;
};

function resolveConcept(raw: string | null): ConceptFilter | null {
  if (raw === 'WEDDING' || raw === 'GENERAL' || raw === 'ORGANIZATION') return raw;
  return null;
}

function toCard(item: PublicVisualCatalogItem): CatalogCard {
  const def = isVisualTemplateId(item.templateKey)
    ? getVisualTemplateDefinition(item.templateKey)
    : null;
  return {
    id: item.templateKey,
    conceptType: item.concept as ConceptFilter,
    name: item.displayName || def?.name || item.templateKey,
    description: item.description || def?.description || '',
    thumbnailAsset: item.thumbnailUrl || def?.thumbnailAsset || '',
    styleTags: def?.styleTags || [],
    featured: item.featured,
    isNew: item.new,
    premium: item.premium,
    sourceType: item.sourceType,
  };
}

export default function VisualTemplateCatalog() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const concept = resolveConcept(searchParams.get('concept'));
  const { creatingConcept, error, start } = useCreateInvitation();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CatalogCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!concept) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    void fetchPublicVisualCatalog({ concept, locale })
      .then((items) => {
        if (!mounted) return;
        setTemplates(items.map(toCard));
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : t('create.templates.loadFailed'));
        setTemplates([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [concept, locale, t]);

  const handleCreate = useCallback(
    async (def: CatalogCard) => {
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
        <p className={styles.error}>{t('create.templates.needConcept')}</p>
        <Link href="/create/concept" className={styles.linkBtn}>
          {t('create.templates.chooseConcept')}
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="visual-template-catalog">
      <header className={styles.header}>
        <Link href="/create/concept" className={styles.back}>
          {t('create.templates.back')}
        </Link>
        <h1 className={styles.title}>{t('create.templates.title')}</h1>
        <p className={styles.desc}>
          {concept === 'WEDDING'
            ? t('create.templates.descWedding')
            : concept === 'ORGANIZATION'
              ? t('create.templates.descOrganization')
              : t('create.templates.descGeneral')}
        </p>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loadError ? <p className={styles.error}>{loadError}</p> : null}
      {loading ? <p className={styles.desc}>{t('create.templates.loading')}</p> : null}

      <ul className={styles.grid}>
        {templates.map((def) => (
          <li key={def.id} className={styles.card} data-testid={`template-card-${def.id}`}>
            <div className={styles.thumbWrap}>
              <ImageWithFallback
                src={def.thumbnailAsset}
                alt={`${def.name} 템플릿 미리보기 이미지`}
                className={styles.thumb}
                fallback={<span className={styles.thumbFallback}>{def.name}</span>}
              />
            </div>
            <div className={styles.body}>
              <h2 className={styles.name}>
                {t(`template.${def.id}.name`) || def.name}
                {def.featured ? <span className={styles.badge}> Featured</span> : null}
                {def.isNew ? <span className={styles.badge}> NEW</span> : null}
              </h2>
              <p className={styles.description}>{t(`template.${def.id}.description`) || def.description}</p>
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
                  {t('create.templates.preview')}
                </Link>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={Boolean(creatingConcept) || busyId === def.id}
                  onClick={() => void handleCreate(def)}
                  data-testid={`template-create-${def.id}`}
                >
                  {busyId === def.id || creatingConcept === def.conceptType
                    ? t('create.templates.creating')
                    : t('create.templates.useThis')}
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

/** @deprecated Prefer operational catalog; kept for type imports */
export type { VisualTemplateDefinition };
