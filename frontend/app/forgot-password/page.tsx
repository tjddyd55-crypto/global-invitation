'use client';

import { Suspense } from 'react';
import { ForgotPasswordScreen } from '@/src/features/auth/ui/shared/PasswordAuthScreens';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
