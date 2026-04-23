import { Suspense } from 'react';
import LoginScreen from '@/src/features/auth/ui/mobile/LoginScreen';

export default function MobileLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
