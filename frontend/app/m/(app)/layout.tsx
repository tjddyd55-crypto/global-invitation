import type { ReactNode } from 'react';
import MobileShell from '@/src/ui/mobile/MobileShell';

export default function MobileAppLayout({ children }: { children: ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
