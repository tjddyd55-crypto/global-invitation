import type { Metadata } from 'next';
import { Suspense } from 'react';
import PaymentPage from '@/src/features/payments/ui/PaymentPage';

export const metadata: Metadata = {
  title: '초대장 발행 결제 | Invite',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function InvitationPaymentRoute({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PaymentPage invitationId={resolved.id} />
    </Suspense>
  );
}
