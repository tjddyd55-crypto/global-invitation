import { Suspense } from 'react';
import EmailAuthForm from '@/src/features/auth/ui/shared/EmailAuthForm';

export default function MobileAuthEmailPage() {
  return (
    <Suspense fallback={null}>
      <EmailAuthForm />
    </Suspense>
  );
}
