import type { Metadata } from 'next';
import { Suspense } from 'react';
import PaymentFailPage from '@/src/features/payments/ui/PaymentFailPage';

export const metadata: Metadata = {
  title: '결제 실패 | Invite',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function InvitationPaymentFailRoute({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PaymentFailPage invitationId={resolved.id} />
    </Suspense>
  );
}
