'use client';

/**
 * 템플릿 선택 진입. FULL / SIMPLE 카드 표시.
 * 선택 시 /editor/[templateSlug] 또는 새 draft로 이동. API 호출 없음.
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateDraftSlug } from '@/src/lib/invitationStorage';
import MarketingLayout from '@/src/components/MarketingLayout';
import styles from './templates.module.css';

type TemplateCard = {
  id: string;
  title: string;
  description: string;
  createLabel: string;
};

const TEMPLATE_CARDS: TemplateCard[] = [
  {
    id: 'wedding_classic',
    title: '웨딩 클래식',
    description: '결혼식 초대장을 생성하고 저장/공개/공유까지 한 번에 진행할 수 있습니다.',
    createLabel: '이 템플릿으로 만들기',
  },
];

export default function TemplatesPage() {
  const router = useRouter();

  const handleCreate = (_card: TemplateCard) => {
    const slug = generateDraftSlug();
    router.push(`/editor/${slug}`);
  };

  return (
    <MarketingLayout>
      <div className={styles.root}>
        <h1 className={styles.title}>템플릿 선택</h1>
        <p className={styles.subtitle}>
          운영용 생성 흐름: 템플릿 선택 → 편집/저장 → 공개 → 공유
        </p>
        <div className={styles.grid}>
          {TEMPLATE_CARDS.map((card) => (
            <article key={card.id} className={styles.card}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardDesc}>{card.description}</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => handleCreate(card)}
                  className={styles.button}
                >
                  {card.createLabel}
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
