'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { cloneTemplateInvitation, trackTemplateView } from '@/src/lib/api';
import { setGuestToken } from '@/src/lib/auth';
import { isValidImageUrl } from '@/src/lib/mediaApi';
import MarketingLayout from '@/src/components/MarketingLayout';
import AppImage from '@/src/components/media/AppImage';
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
type TemplateSortOption = 'newest' | 'popular' | 'trending';
type DiscoveryOption = { value: TemplateSortOption; label: string; description: string };

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

const DISCOVERY_OPTIONS: DiscoveryOption[] = [
  {
    value: 'popular',
    label: 'Popular',
    description: '가장 많이 선택된 템플릿 중심으로 둘러봅니다.',
  },
  {
    value: 'trending',
    label: 'Trending',
    description: '최근 7일간 반응이 빠르게 증가한 템플릿을 확인합니다.',
  },
  {
    value: 'newest',
    label: 'Newest',
    description: '최근 등록된 템플릿을 먼저 살펴봅니다.',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [styleFilter, setStyleFilter] = useState<TemplateStyle | 'all'>('all');
  const [sortOption, setSortOption] = useState<TemplateSortOption>('newest');
  const [templates, setTemplates] = useState<TemplateDefinition[]>(() => listVisibleTemplateDefinitions());
  const [loading, setLoading] = useState(true);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const trackedTemplateIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      const nextTemplates = await fetchVisibleTemplateDefinitions(sortOption);
      if (!isMounted) return;
      setTemplates(nextTemplates);
      setLoading(false);
    }

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [sortOption]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const isCategoryMatched = categoryFilter === 'all' || item.category === categoryFilter;
      const isStyleMatched = styleFilter === 'all' || item.style === styleFilter;
      return isCategoryMatched && isStyleMatched;
    });
  }, [categoryFilter, styleFilter, templates]);
  const currentDiscovery = useMemo(
    () => DISCOVERY_OPTIONS.find((item) => item.value === sortOption) || DISCOVERY_OPTIONS[0],
    [sortOption]
  );

  useEffect(() => {
    const visibleCards = filteredTemplates.slice(0, 12);
    visibleCards.forEach((template) => {
      if (trackedTemplateIdsRef.current.has(template.id)) {
        return;
      }
      trackedTemplateIdsRef.current.add(template.id);
      void trackTemplateView(template.id);
    });
  }, [filteredTemplates]);

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
          공개 템플릿 흐름: Creator 제작 → Admin 승인 → User 선택/사용
        </p>
        <section className={styles.discoverySection}>
          <div className={styles.discoveryHeader}>
            <strong>Discovery</strong>
            <p>{currentDiscovery.description}</p>
          </div>
          <div className={styles.discoveryTabs}>
            {DISCOVERY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  sortOption === option.value
                    ? `${styles.discoveryTab} ${styles.discoveryTabActive}`
                    : styles.discoveryTab
                }
                onClick={() => setSortOption(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
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
        <div className={styles.grid} data-testid="templates-grid">
          {filteredTemplates.map((card) => (
            <article key={card.id} className={styles.card} data-testid="template-card">
              <div className={styles.thumbnail}>
                {card.thumbnailUrl && isValidImageUrl(card.thumbnailUrl) ? (
                  <AppImage
                    src={card.thumbnailUrl}
                    alt={`${card.name} template thumbnail`}
                    className={styles.thumbnailImage}
                  />
                ) : (
                  <TemplatePreviewWrapper
                    templateKey={card.templateKey}
                    studioConfig={card.studioConfig || undefined}
                  />
                )}
                <span className={styles.thumbnailLabel}>
                  {CATEGORY_LABELS[card.category]} · {STYLE_LABELS[card.style]}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{card.title || card.name}</h2>
              <p className={styles.creatorMeta}>by {card.creatorName || 'Global Invitation'}</p>
              {card.marketplaceType === 'CREATOR' && (
                <p className={styles.cardDesc}>Creator template</p>
              )}
              <p className={styles.cardDesc}>{card.description}</p>
              <div className={styles.cardStats}>
                <span>
                  {card.viewCount || 0} views • {card.cloneCount || 0} uses
                </span>
              </div>
              <div className={styles.actions}>
                <Link
                  href={`/templates/${encodeURIComponent(card.publicTemplateKey || card.slug || card.id)}`}
                  className={styles.detailLink}
                >
                  템플릿 상세 보기
                </Link>
                <button
                  type="button"
                  onClick={() => handleCreate(card)}
                  className={styles.button}
                  disabled={creatingTemplateId === card.id}
                  data-testid="template-create-button"
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
