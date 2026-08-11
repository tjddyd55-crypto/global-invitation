import type { Metadata } from 'next';
import PricingPage from '@/src/features/pricing/ui/PricingPage';

export const metadata: Metadata = {
  title: '요금 안내 | Invite',
  description:
    '초대장은 무료로 만들고 미리볼 수 있습니다. 실제 발행 시 초대장 1개당 한 번만 결제합니다.',
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
