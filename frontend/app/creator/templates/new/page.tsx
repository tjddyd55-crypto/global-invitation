'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_GUIDES, CREATOR_CATEGORY_ORDER } from '@/src/creator/categoryGuides';
import { createCreatorTemplateSubmission } from '@/src/lib/creatorApi';
import { fetchCurrentUser } from '@/src/lib/auth';
import styles from '../creator.module.css';

export default function CreatorTemplateNewPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<(typeof CREATOR_CATEGORY_ORDER)[number]>('wedding');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [accessReady, setAccessReady] = useState(false);

  const selectedGuide = useMemo(() => CATEGORY_GUIDES[selectedCategory], [selectedCategory]);

  useEffect(() => {
    let mounted = true;
    async function guardCreatorAccess() {
      try {
        const me = await fetchCurrentUser();
        if (!me || me.role !== 'CREATOR') {
          router.replace('/signup?role=CREATOR');
          return;
        }
        if (!mounted) return;
        setAccessReady(true);
      } catch {
        if (!mounted) return;
        router.replace('/signup?role=CREATOR');
      }
    }

    void guardCreatorAccess();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleCreate = async () => {
    if (selectedGuide.availability !== 'active') {
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await createCreatorTemplateSubmission({
        category: selectedGuide.category,
        name: `${selectedGuide.label} Template`,
        description: `${selectedGuide.label} category creator template`,
        style: 'modern',
        price: 0,
      });
      if (!created?.id) {
        throw new Error('TEMPLATE_CREATION_FAILED');
      }
      router.push(`/creator/templates/${created.id}/studio`);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : '템플릿 생성에 실패했습니다.';
      if (message.includes('CREATOR_ROLE_REQUIRED') || message.includes('UNAUTHORIZED')) {
        router.replace('/signup?role=CREATOR');
        return;
      }
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  if (!accessReady) {
    return <div className={styles.page}>Loading creator access...</div>;
  }

  return (
    <div className={styles.page}>
      <nav className={styles.menuBar} aria-label="creator-dashboard-menu">
        <ul className={styles.menuList}>
          <li>
            <Link href="/creator/templates" className={styles.menuLink}>
              내 템플릿
            </Link>
          </li>
          <li>
            <Link href="/creator/templates/new" className={`${styles.menuLink} ${styles.menuLinkActive}`}>
              템플릿 만들기
            </Link>
          </li>
          <li>
            <Link href="/creator/dashboard#stats" className={styles.menuLink}>
              통계
            </Link>
          </li>
          <li>
            <Link href="/creator/dashboard#revenue" className={styles.menuLink}>
              수익
            </Link>
          </li>
          <li>
            <Link href="/creator/dashboard#settings" className={styles.menuLink}>
              설정
            </Link>
          </li>
        </ul>
      </nav>

      <header className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Create Template</h1>
          <p className={styles.subtitle}>카테고리를 선택하고 데이터 가이드를 확인한 뒤 Studio로 진입합니다.</p>
        </div>
        <Link href="/creator/dashboard" className={`${styles.button} ${styles.buttonSecondary}`}>
          Back
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.grid}>
        {CREATOR_CATEGORY_ORDER.map((category) => {
          const guide = CATEGORY_GUIDES[category];
          const selected = selectedCategory === category;
          return (
            <article
              key={category}
              className={styles.card}
              style={selected ? { borderColor: '#2563eb' } : undefined}
            >
              <div>
                <span className={`${styles.pill} ${guide.availability === 'planned' ? styles.pillPlanned : ''}`}>
                  {guide.availability}
                </span>
              </div>
              <strong>{guide.label}</strong>
              <p className={styles.meta}>{guide.description}</p>
              <p className={styles.meta}>Use case: {guide.useCase}</p>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setSelectedCategory(category)}
                data-testid={`creator-category-select-${category}`}
              >
                Select
              </button>
            </article>
          );
        })}
      </section>

      <section className={styles.section}>
        <div className={styles.card}>
          <h2 style={{ margin: 0 }}>{selectedGuide.label} Data Guide</h2>
          <p className={styles.meta}>{selectedGuide.description}</p>
          <p className={styles.meta}>Required fields summary: {selectedGuide.keyFieldSummary.join(', ')}</p>
          <div className={styles.grid}>
            <article className={styles.card}>
              <strong>Media rules</strong>
              <ul>
                {selectedGuide.mediaRules.map((rule) => (
                  <li key={rule} className={styles.meta}>
                    {rule}
                  </li>
                ))}
              </ul>
            </article>
            <article className={styles.card}>
              <strong>Section rules</strong>
              <ul>
                {selectedGuide.sectionRules.map((rule) => (
                  <li key={rule} className={styles.meta}>
                    {rule}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className={styles.button}
              onClick={handleCreate}
              disabled={creating || selectedGuide.availability !== 'active'}
              data-testid="creator-enter-studio-button"
            >
              {creating ? 'Creating...' : selectedGuide.availability === 'active' ? 'Enter Studio' : 'Planned Category'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
