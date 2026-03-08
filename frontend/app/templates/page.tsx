'use client';

/**
 * 템플릿 선택 진입. FULL / SIMPLE 카드 표시.
 * 선택 시 /editor/[templateSlug] 또는 새 draft로 이동. API 호출 없음.
 */

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { generateDraftSlug } from '@/src/lib/invitationStorage';
import MarketingLayout from '@/src/components/MarketingLayout';
import styles from './templates.module.css';

type TemplateCard = {
  id: string;
  name: string;
  category: '웨딩' | '심플';
  description: string;
  template: 'FULL' | 'SIMPLE';
};

const TEMPLATE_LIST: TemplateCard[] = [
  {
    id: 'wedding-classic',
    name: '웨딩 클래식',
    category: '웨딩',
    description: '전통적이고 우아한 결혼식 초대장',
    template: 'FULL',
  },
  {
    id: 'simple-minimal',
    name: '심플 미니멀',
    category: '심플',
    description: '간결하고 모던한 초대장',
    template: 'SIMPLE',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'전체' | '웨딩' | '심플'>('전체');

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === '전체') return TEMPLATE_LIST;
    return TEMPLATE_LIST.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const handleCreate = (card: TemplateCard) => {
    const slug = generateDraftSlug();
    router.push(`/editor/${slug}?template=${card.template}`);
  };

  return (
    <MarketingLayout>
      <div className={styles.root}>
        <h1 className={styles.title}>템플릿 선택</h1>
        <p className={styles.subtitle}>
          운영용 생성 흐름: 템플릿 선택 → 편집/저장 → 공개 → 공유
        </p>
        <div className={styles.filters}>
          {(['전체', '웨딩', '심플'] as const).map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? `${styles.filterButton} ${styles.filterButtonActive}` : styles.filterButton}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          {filteredTemplates.map((card) => (
            <article key={card.id} className={styles.card}>
              <div className={styles.thumbnail}>
                <span className={styles.thumbnailLabel}>{card.category}</span>
              </div>
              <h2 className={styles.cardTitle}>{card.name}</h2>
              <p className={styles.cardDesc}>{card.description}</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => handleCreate(card)}
                  className={styles.button}
                >
                  이 템플릿으로 만들기
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className={styles.footer}>
          <Link href="/my-invitations" className={styles.link}>내 초대장 관리</Link>
        </p>
      </div>
    </MarketingLayout>
  );
}
