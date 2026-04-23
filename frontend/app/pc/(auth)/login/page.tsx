import { Suspense } from 'react';
import LoginCard from '@/src/features/auth/ui/pc/LoginCard';

export default function PcLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
