'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import MarketingSiteHeader from '@/src/features/marketing/ui/MarketingSiteHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import { getCreateInvitationEntryPath } from '@/src/shared/auth/authEntryPaths';
import { useAuth } from '@/src/shared/hooks';
import {
  formatUsdFromCents,
  getInvitationDiscountCents,
  INVITATION_PRICING,
} from '@/src/shared/pricing/invitationPricing';
import styles from './PricingPage.module.css';

const FEATURES = [
  '모든 현재 템플릿 사용',
  '사진 · 갤러리',
  '로고 · 브랜드',
  '일정',
  '지도',
  '계좌 · 참가비',
  'RSVP',
  '공개 링크',
  '결제 후 자유롭게 수정',
] as const;

const STEPS = [
  '무료로 만들기',
  '완성본 미리보기',
  '결제 후 발행',
  '링크 공유',
] as const;

const FAQS = [
  {
    q: '결제 전에도 미리볼 수 있나요?',
    a: '네. 초대장 제작과 Editor/Template Preview는 무료입니다. 실제 외부 발행 직전에만 결제합니다.',
  },
  {
    q: '수정할 때 다시 결제하나요?',
    a: '같은 초대장은 추가 결제가 없습니다. 결제 후에도 자유롭게 수정할 수 있습니다.',
  },
  {
    q: '새 초대장을 만들면?',
    a: '새 invitation마다 한 번씩 결제가 필요합니다.',
  },
] as const;

/**
 * SaaS Pricing — Figma 07_PRICING_CONTACT 기준.
 * 결제 CTA 없음. 만들기 플로우로만 연결.
 */
export default function PricingPage() {
  const { status } = useAuth();
  const createHref = getCreateInvitationEntryPath(status === 'loading' ? 'unauthenticated' : status);
  const list = formatUsdFromCents(INVITATION_PRICING.listPriceCents);
  const sale = formatUsdFromCents(INVITATION_PRICING.salePriceCents);
  const discount = formatUsdFromCents(getInvitationDiscountCents());

  return (
    <div className={styles.page} data-testid="pricing-page">
      <MarketingSiteHeader />
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>필요한 만큼만 결제하세요</h1>
          <p className={styles.heroLead}>
            초대장은 무료로 만들고 미리볼 수 있습니다.
            <br />
            실제 발행할 때 초대장 1개당 한 번만 결제합니다.
          </p>
        </header>

        <section className={styles.card} aria-labelledby="pricing-main-title">
          <span className={styles.badge}>오픈 특별가</span>
          <h2 id="pricing-main-title" className={styles.srOnly}>
            초대장 발행 요금
          </h2>
          <div className={styles.priceBlock}>
            <span className={styles.listPrice} aria-label={`정상가 ${list}`}>
              {list}
            </span>
            <span className={styles.salePrice} aria-label={`오픈 특별가 ${sale}`}>
              {sale}
            </span>
          </div>
          <p className={styles.unit}>초대장 1개 · 1회 결제 · {INVITATION_PRICING.currency}</p>
          <p className={styles.note}>
            정상가 대비 {discount} 할인. 결제 후에도 같은 초대장은 자유롭게 수정할 수 있습니다.
          </p>
          <Link href={createHref} className={styles.cta} data-testid="pricing-create-cta">
            무료로 초대장 만들기
          </Link>
        </section>

        <section className={styles.section} aria-labelledby="pricing-features">
          <h2 id="pricing-features" className={styles.sectionTitle}>
            포함 기능
          </h2>
          <ul className={styles.featureList}>
            {FEATURES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="pricing-steps">
          <h2 id="pricing-steps" className={styles.sectionTitle}>
            이용 방법
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((label, index) => (
              <li key={label}>
                <span className={styles.stepNum} aria-hidden>
                  {index + 1}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="pricing-faq">
          <h2 id="pricing-faq" className={styles.sectionTitle}>
            자주 묻는 질문
          </h2>
          <div className={styles.faqList}>
            {FAQS.map((item) => (
              <article key={item.q} className={styles.faqItem}>
                <h3 className={styles.faqQ}>{item.q}</h3>
                <p className={styles.faqA}>{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <div className={styles.footerWrap}>
        <SiteBusinessFooter />
      </div>
    </div>
  );
}
