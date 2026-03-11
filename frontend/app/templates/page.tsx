'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cloneTemplateInvitation } from '@/src/lib/api';
import { setGuestToken } from '@/src/lib/auth';
import MarketingLayout from '@/src/components/MarketingLayout';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import {
  fetchVisibleTemplateDefinitions,
  type TemplateCategory,
  type TemplateDefinition,
  type TemplateStyle,
  listVisibleTemplateDefinitions,
} from '@/src/templates/registry';
import styles from './templates.module.css';

type FilterOption<T extends string> = { value: T | 'all'; label: string };

const CATEGORY_FILTERS: FilterOption<TemplateCategory>[] = [
  { value: 'all', label: '전체' },
  { value: 'wedding', label: '웨딩' },
  { value: 'birthday', label: '돌잔치' },
  { value: 'funeral', label: '장례식' },
  { value: 'party', label: '파티' },
  { value: 'message', label: '메시지' },
  { value: 'simple_notice', label: '공지' },
  { value: 'event', label: '이벤트' },
  { value: 'business', label: '비즈니스' },
];

const STYLE_FILTERS: FilterOption<TemplateStyle>[] = [
  { value: 'all', label: '전체' },
  { value: 'korean', label: '한국식' },
  { value: 'japanese', label: '일본식' },
  { value: 'western', label: '서양식' },
  { value: 'traditional', label: '전통' },
  { value: 'modern', label: '모던' },
];

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  wedding: '웨딩',
  birthday: '돌잔치',
  funeral: '장례식',
  party: '파티',
  message: '메시지',
  simple_notice: '공지',
  event: '이벤트',
  business: '비즈니스',
};

const STYLE_LABELS: Record<TemplateStyle, string> = {
  korean: '한국식',
  japanese: '일본식',
  western: '서양식',
  traditional: '전통',
  modern: '모던',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [styleFilter, setStyleFilter] = useState<TemplateStyle | 'all'>('all');
  const [templates, setTemplates] = useState<TemplateDefinition[]>(() => listVisibleTemplateDefinitions());
  const [loading, setLoading] = useState(true);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      const nextTemplates = await fetchVisibleTemplateDefinitions();
      if (!isMounted) return;
      setTemplates(nextTemplates);
      setLoading(false);
    }

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const isCategoryMatched = categoryFilter === 'all' || item.category === categoryFilter;
      const isStyleMatched = styleFilter === 'all' || item.style === styleFilter;
      return isCategoryMatched && isStyleMatched;
    });
  }, [categoryFilter, styleFilter, templates]);

  const handleCreate = async (card: TemplateDefinition) => {
    setCreatingTemplateId(card.id);
    try {
      const cloned = await cloneTemplateInvitation(card.id);
      if (cloned.guest_token) {
        setGuestToken(cloned.guest_token);
      }
      router.push(cloned.editor_url);
    } catch {
      router.push(`/editor/new?template=${card.id}`);
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <MarketingLayout>
      <div className={styles.root}>
        <h1 className={styles.title}>템플릿 선택</h1>
        <p className={styles.subtitle}>
          운영용 생성 흐름: 템플릿 선택 → 편집/저장 → 공개 → 공유
        </p>
        <section className={styles.filterSection}>
          <p className={styles.filterTitle}>카테고리</p>
          <div className={styles.filters}>
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  categoryFilter === filter.value
                    ? `${styles.filterButton} ${styles.filterButtonActive}`
                    : styles.filterButton
                }
                onClick={() => setCategoryFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
        <section className={styles.filterSection}>
          <p className={styles.filterTitle}>스타일</p>
          <div className={styles.filters}>
            {STYLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  styleFilter === filter.value
                    ? `${styles.filterButton} ${styles.filterButtonActive}`
                    : styles.filterButton
                }
                onClick={() => setStyleFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
        <div className={styles.resultCount}>
          총 <strong>{filteredTemplates.length}</strong>개의 템플릿
        </div>
        {loading && <p className={styles.emptyState}>템플릿 레지스트리를 불러오는 중입니다...</p>}
        <div className={styles.grid}>
          {filteredTemplates.map((card) => (
            <article key={card.id} className={styles.card}>
              <div className={styles.thumbnail}>
                <TemplatePreviewWrapper templateKey={card.templateKey} studioConfig={card.studioConfig || undefined} />
                <span className={styles.thumbnailLabel}>
                  {CATEGORY_LABELS[card.category]} · {STYLE_LABELS[card.style]}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{card.name}</h2>
              {card.marketplaceType === 'CREATOR' && (
                <p className={styles.cardDesc}>Creator template</p>
              )}
              <p className={styles.cardDesc}>{card.description}</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => handleCreate(card)}
                  className={styles.button}
                  disabled={creatingTemplateId === card.id}
                >
                  {creatingTemplateId === card.id ? '생성 중...' : '이 템플릿으로 만들기'}
                </button>
              </div>
            </article>
          ))}
        </div>
        {filteredTemplates.length === 0 && (
          <p className={styles.emptyState}>조건에 맞는 템플릿이 없습니다. 필터를 변경해 보세요.</p>
        )}
        <p className={styles.footer}>
          <Link href="/my-invitations" className={styles.link}>내 초대장 관리</Link>
        </p>
      </div>
    </MarketingLayout>
  );
}
