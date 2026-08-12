import type { Metadata } from 'next';
import { Suspense } from 'react';
import PaymentSuccessPage from '@/src/features/payments/ui/PaymentSuccessPage';

export const metadata: Metadata = {
  title: '결제 확인 | Invite',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function InvitationPaymentSuccessRoute({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PaymentSuccessPage invitationId={resolved.id} />
    </Suspense>
  );
}
